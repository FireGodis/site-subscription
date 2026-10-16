import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasActivePlan, isAdministrator } from "@/lib/plans-server";
import { Dashboard, Paywall } from "@/components/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 if(!(await hasActivePlan(user.id)))return <Paywall email={user.email??""}/>;
 const [{data:clients},{data:proposals}]=await Promise.all([
   supabase.from("clients").select("id,name,email,phone,created_at").order("created_at",{ascending:false}).limit(250),
   supabase.from("proposals").select("id,title,amount,status,due_date,scope,estimated_hours,actual_hours,estimated_costs,actual_costs,created_at,client:clients(name,phone)").order("created_at",{ascending:false}).limit(250)
 ]);
 return <Dashboard email={user.email??""} clients={clients??[]} proposals={(proposals??[]) as never} admin={isAdministrator(user.email)}/>;
}
