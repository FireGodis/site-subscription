import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Entre na sua conta." }, { status: 401 });
  const { data: subscription } = await supabase.from("subscriptions").select("mp_preapproval_id,status")
    .eq("user_id", user.id).maybeSingle();
  if (!subscription?.mp_preapproval_id) return NextResponse.json({ error: "Não há assinatura para cancelar." }, { status: 404 });
  if (["cancelled", "canceled"].includes(subscription.status)) return NextResponse.json({ ok: true });
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) return NextResponse.json({ error: "Pagamentos ainda não estão configurados." }, { status: 503 });
  const response = await fetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(subscription.mp_preapproval_id)}`, {
    method: "PUT", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ status: "canceled" }), cache: "no-store"
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !["canceled", "cancelled"].includes(String(result.status))) {
    return NextResponse.json({ error: "O Mercado Pago não confirmou o cancelamento. Tente novamente." }, { status: 502 });
  }
  const admin = createAdminClient();
  const { error } = await admin.from("subscriptions").update({ status: String(result.status), updated_at: new Date().toISOString() })
    .eq("user_id", user.id).eq("mp_preapproval_id", subscription.mp_preapproval_id);
  if (error) return NextResponse.json({ error: "A assinatura foi cancelada, mas o painel ainda não sincronizou. Atualize a página." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
