import { NextResponse } from "next/server";
import { dataStore } from "@/services/supabaseStore";
import { authenticateAdminRequest } from "@/utils/adminAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const numUserId = Number(userId);

    const auth = await authenticateAdminRequest(request, numUserId || null);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error || "Access denied. Export feature is restricted to active Super Admin." },
        { status: auth.status || 403, headers: NO_CACHE_HEADERS }
      );
    }

    const backup = await dataStore.exportFullBackup();


    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      version: "1.0",
      data: backup,
    }, { headers: NO_CACHE_HEADERS });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to export backup data.";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
