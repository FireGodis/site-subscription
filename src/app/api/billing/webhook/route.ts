import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { plans, type PlanId } from "@/lib/plans";

function verifySignature(id: string, requestId: string, signature: string, secret: string) {
  const parts = Object.fromEntries(signature.split(",").map((part) => part.trim().split("=", 2)));
  if (!parts.ts || !parts.v1 || !/^\d+$/.test(parts.ts) || !/^[a-f\d]{64}$/i.test(parts.v1)) return false;
  const manifest = `id:${id.toLowerCase()};request-id:${requestId};ts:${parts.ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  const actualBytes = Buffer.from(parts.v1, "hex");
  const expectedBytes = Buffer.from(expected, "hex");
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}

async function getResource<T>(path: string, accessToken: string): Promise<T | null> {
  const response = await fetch(`https://api.mercadopago.com/${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store"
  });
  if (!response.ok) return null;
  return response.json() as Promise<T>;
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const notificationId = url.searchParams.get("data.id") ?? "";
  const body = await request.json().catch(() => ({}));
  const topic = url.searchParams.get("type") ?? String(body?.type ?? "");
  if (!notificationId || !topic) return NextResponse.json({ error: "Notificação sem os parâmetros assinados." }, { status: 400 });

  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  const requestId = request.headers.get("x-request-id") ?? "";
  const signature = request.headers.get("x-signature") ?? "";
  if (!secret) return NextResponse.json({ error: "Webhook não configurado." }, { status: 503 });
  if (!requestId || !verifySignature(notificationId, requestId, signature, secret)) {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }
  if (!topic.includes("preapproval") && !topic.includes("authorized_payment")) return NextResponse.json({ received: true });

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) return NextResponse.json({ error: "Pagamento não configurado." }, { status: 503 });
  const admin = createAdminClient();

  if (topic.includes("authorized_payment")) {
    const invoice = await getResource<{ preapproval_id?: string; payment?: { status?: string } }>(
      `authorized_payments/${encodeURIComponent(notificationId)}`, accessToken
    );
    if (!invoice?.preapproval_id) return NextResponse.json({ error: "Fatura não encontrada." }, { status: 502 });
    const subscription = await getResource<{
      id?: string; external_reference?: string; status?: string;
    }>(`preapproval/${encodeURIComponent(invoice.preapproval_id)}`, accessToken);
    const userId = String(subscription?.external_reference ?? "");
    if (!subscription?.id || !userId) return NextResponse.json({ error: "Assinatura sem referência de conta." }, { status: 502 });
    const { data: current } = await admin.from("subscriptions").select("mp_preapproval_id,status").eq("user_id", userId).maybeSingle();
    if (current?.mp_preapproval_id !== subscription.id) return NextResponse.json({ received: true });

    let status = String(subscription.status ?? "pending");
    if (status === "authorized") {
      if (invoice.payment?.status === "approved") status = "authorized";
      else if (invoice.payment?.status) status = "payment_issue";
      else status = current.status === "authorized" ? "authorized" : "pending_payment";
    }
    const { error } = await admin.from("subscriptions").update({ status, updated_at: new Date().toISOString() })
      .eq("user_id", userId).eq("mp_preapproval_id", subscription.id);
    if (error) return NextResponse.json({ error: "Falha ao atualizar o pagamento." }, { status: 500 });
    return NextResponse.json({ received: true });
  }

  const subscription = await getResource<{
    id?: string; external_reference?: string; status?: string; auto_recurring?: { transaction_amount?: number };
  }>(`preapproval/${encodeURIComponent(notificationId)}`, accessToken);
  const userId = String(subscription?.external_reference ?? "");
  if (!subscription?.id || !userId) return NextResponse.json({ error: "Assinatura sem referência de conta." }, { status: 502 });

  const price = Number(subscription.auto_recurring?.transaction_amount);
  const planId = (Object.keys(plans) as PlanId[]).find((key) => plans[key].price === price);
  const { data: current } = await admin.from("subscriptions").select("mp_preapproval_id,status").eq("user_id", userId).maybeSingle();
  if (current?.mp_preapproval_id && current.mp_preapproval_id !== notificationId) return NextResponse.json({ received: true });
  if (!planId) {
    await admin.from("subscriptions").update({ status: "plan_mismatch", updated_at: new Date().toISOString() })
      .eq("user_id", userId).eq("mp_preapproval_id", notificationId);
    return NextResponse.json({ received: true });
  }

  let status = String(subscription.status ?? "pending");
  if (status === "authorized" && current?.status !== "authorized") status = "pending_payment";
  const { error } = await admin.from("subscriptions").upsert({
    user_id: userId, mp_preapproval_id: notificationId, plan_id: planId,
    status, updated_at: new Date().toISOString()
  }, { onConflict: "user_id" });
  if (error) return NextResponse.json({ error: "Falha ao registrar assinatura." }, { status: 500 });
  return NextResponse.json({ received: true });
}
