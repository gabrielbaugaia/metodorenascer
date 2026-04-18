// Shared auth helpers for edge functions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

/**
 * Validate that the request bears either:
 *   - A valid user JWT for an admin (returns { kind: 'admin', userId })
 *   - The platform service-role key as a Bearer token (returns { kind: 'service' })
 *
 * Use for cron / mass-communication endpoints that must reject anonymous callers.
 */
export async function requireAdminOrService(
  req: Request,
): Promise<
  | { ok: true; kind: "admin" | "service"; userId: string | null }
  | { ok: false; status: number; message: string }
> {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return { ok: false, status: 401, message: "missing_authorization" };
  }
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return { ok: false, status: 401, message: "missing_token" };
  }

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (serviceKey && token === serviceKey) {
    return { ok: true, kind: "service", userId: null };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const supabase = createClient(supabaseUrl, anonKey);

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return { ok: false, status: 401, message: "invalid_token" };
  }
  const userId = userData.user.id;

  // Check admin role using service client to bypass RLS on user_roles checks
  const adminClient = createClient(supabaseUrl, serviceKey);
  const { data: roleRow, error: roleError } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (roleError) {
    return { ok: false, status: 500, message: "role_check_failed" };
  }
  if (!roleRow) {
    return { ok: false, status: 403, message: "forbidden" };
  }
  return { ok: true, kind: "admin", userId };
}

/**
 * Validate that the request bears a valid user JWT.
 * Returns the authenticated user id, OR allows the platform service-role key.
 */
export async function requireAuthenticatedUser(
  req: Request,
): Promise<
  | { ok: true; kind: "user" | "service"; userId: string | null }
  | { ok: false; status: number; message: string }
> {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return { ok: false, status: 401, message: "missing_authorization" };
  }
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return { ok: false, status: 401, message: "missing_token" };
  }

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (serviceKey && token === serviceKey) {
    return { ok: true, kind: "service", userId: null };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const supabase = createClient(supabaseUrl, anonKey);

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return { ok: false, status: 401, message: "invalid_token" };
  }
  return { ok: true, kind: "user", userId: data.user.id };
}

export async function isAdmin(userId: string): Promise<boolean> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const adminClient = createClient(supabaseUrl, serviceKey);
  const { data } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}
