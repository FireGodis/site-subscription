import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { plans, type PlanId } from "@/lib/plans";

const schema=z.object({plan:z.enum(["essencial","pro","estudio"])});
export async function POST(request:Request){
  const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Entre para escolher um plano."},{status:401});
  const {data:existing}=await supabase.from("subscriptions").select("status").eq("user_id",user.id).maybeSingle();if(existing&&["authorized","pending","pending_payment","payment_issue"].includes(existing.status))return NextResponse.json({error:"Sua conta já tem uma assinatura em andamento. Confira o status no Mercado Pago antes de iniciar outra."},{status:409});
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Plano inválido."},{status:400});const accessToken=process.env.MERCADOPAGO_ACCESS_TOKEN;if(!accessToken)return NextResponse.json({error:"Assinaturas em configuração. As credenciais de pagamento ainda não foram conectadas."},{status:503});if(!user.email)return NextResponse.json({error:"A conta precisa ter um e-mail para iniciar a assinatura."},{status:400});
  const plan=plans[parsed.data.plan as PlanId];const base=process.env.NEXT_PUBLIC_APP_URL||new URL(request.url).origin;
  const response=await fetch("https://api.mercadopago.com/preapproval",{method:"POST",headers:{Authorization:`Bearer ${accessToken}`,"Content-Type":"application/json"},body:JSON.stringify({reason:plan.mpReason,external_reference:user.id,payer_email:user.email,notification_url:`${base}/api/billing/webhook`,auto_recurring:{frequency:1,frequency_type:"months",transaction_amount:plan.price,currency_id:"BRL"},back_url:`${base}/painel?checkout=retorno`,status:"pending"}),cache:"no-store"});
  const result=await response.json().catch(()=>({}));if(!response.ok||!result.init_point)return NextResponse.json({error:"O Mercado Pago não conseguiu iniciar a assinatura. Tente novamente."},{status:502});
  await supabase.from("subscriptions").upsert({user_id:user.id,mp_preapproval_id:result.id,plan_id:parsed.data.plan,status:"pending",updated_at:new Date().toISOString()},{onConflict:"user_id"});
  return NextResponse.json({url:result.init_point});
}
