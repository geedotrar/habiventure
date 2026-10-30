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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, backupData } = body;
    const numUserId = Number(userId);

    const auth = await authenticateAdminRequest(request, numUserId || null);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error || "Access denied. Import feature is restricted to active Super Admin." },
        { status: auth.status || 403, headers: NO_CACHE_HEADERS }
      );
    }


    if (!backupData || typeof backupData !== "object") {
      return NextResponse.json(
        { error: "Invalid backup data format." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const payload = backupData.data || backupData;
    const result = await dataStore.importFullBackup(payload);

    const message = result.skippedCount && result.skippedCount > 0
      ? `Import completed: ${result.importedCount} rows imported, ${result.skippedCount} identical rows skipped.`
      : `Successfully imported ${result.importedCount} rows of data to the database.`;

    return NextResponse.json({
      success: true,
      message,
      result,
    }, { headers: NO_CACHE_HEADERS });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to import backup data.";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
