import { dataStore } from "@/services/supabaseStore";
import {
  verifyAdminSessionToken,
  ADMIN_SESSION_COOKIE_NAME,
} from "@/utils/trustedDevice";
import type { User } from "@/types/domain";

export async function authenticateAdminRequest(
  request: Request,
  fallbackUserId?: number | null
): Promise<{ authorized: boolean; adminUser?: User; error?: string; status: number }> {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`(?:^|; )${ADMIN_SESSION_COOKIE_NAME}=([^;]*)`));
  const token = match ? decodeURIComponent(match[1]) : null;

  if (token) {
    const auth = await verifyAdminSessionToken(token);
    if (auth.valid && auth.adminUserId) {
      const user = await dataStore.getUserById(auth.adminUserId);
      if (user && user.role === "superadmin" && user.active) {
        return { authorized: true, adminUser: user, status: 200 };
      }
      return {
        authorized: false,
        error: "Access denied. Active Super Admin privileges required.",
        status: 403,
      };
    }
    return {
      authorized: false,
      error: "Admin session expired or invalid. Please re-authenticate with Super Admin PIN.",
      status: 401,
    };
  }

  // Fallback for automated test suites and internal invocations
  if (fallbackUserId) {
    const user = await dataStore.getUserById(Number(fallbackUserId));
    if (user && user.role === "superadmin" && user.active) {
      return { authorized: true, adminUser: user, status: 200 };
    }
    return {
      authorized: false,
      error: "Access denied. Only an active Super Admin is authorized.",
      status: 403,
    };
  }

  return {
    authorized: false,
    error: "Super Admin authentication required.",
    status: 401,
  };
}
