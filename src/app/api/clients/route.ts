import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { hasActivePlan } from "@/lib/plans-server";
import { plans, type PlanId } from "@/lib/plans";

const schema=z.object({name:z.string().trim().min(2).max(100),email:z.union([z.string().email().max(200),z.literal("")]).optional(),phone:z.string().max(30).optional()});
async function current(){const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return {error:NextResponse.json({error:"Entre na sua conta."},{status:401})};if(!(await hasActivePlan(user.id)))return {error:NextResponse.json({error:"Escolha um plano ativo para acessar o painel."},{status:402})};return {supabase,user};}

export async function GET(){const auth=await current();if("error"in auth)return auth.error;const {data,error}=await auth.supabase.from("clients").select("id,name,email,phone,created_at").order("created_at",{ascending:false}).limit(250);if(error)return NextResponse.json({error:"Não foi possível carregar clientes."},{status:500});return NextResponse.json({clients:data});}
export async function POST(request:Request){const auth=await current();if("error"in auth)return auth.error;const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Confira os dados do cliente."},{status:400});const {data:sub}=await auth.supabase.from("subscriptions").select("plan_id").eq("user_id",auth.user.id).maybeSingle();const max=plans[(sub?.plan_id in plans?sub?.plan_id:"essencial") as PlanId].limit;const {count}=await auth.supabase.from("clients").select("id",{count:"exact",head:true});if((count??0)>=max)return NextResponse.json({error:`Seu plano permite até ${max} clientes.`},{status:409});const {data,error}=await auth.supabase.from("clients").insert({user_id:auth.user.id,...parsed.data}).select("id,name,email,phone,created_at").single();if(error)return NextResponse.json({error:"Não foi possível salvar o cliente."},{status:500});return NextResponse.json({client:data},{status:201});}
