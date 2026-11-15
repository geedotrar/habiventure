import { NextResponse } from "next/server";
import { dataStore } from "@/services/supabaseStore";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint is required" },
        { status: 400 }
      );
    }

    if (dataStore.deletePushSubscription) {
      await dataStore.deletePushSubscription(endpoint);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to remove push subscription" },
      { status: 500 }
    );
  }
}

