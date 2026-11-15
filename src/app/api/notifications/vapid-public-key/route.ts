import { NextResponse } from "next/server";
import { VAPID_PUBLIC_KEY } from "@/utils/webPush";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    publicKey: VAPID_PUBLIC_KEY,
  });
}

