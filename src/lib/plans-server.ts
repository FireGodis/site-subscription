import { createClient } from "@/lib/supabase/server";

export async function hasActivePlan(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("subscriptions").select("status").eq("user_id", userId).maybeSingle();
  return data?.status === "authorized";
}

export function isAdministrator(email?: string | null) {
  if (!email) return false;
  const allowed = (process.env.ADMIN_EMAILS ?? "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
  return allowed.includes(email.toLowerCase());
}
