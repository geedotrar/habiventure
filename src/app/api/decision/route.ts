import { NextResponse } from "next/server";
import { dataStore } from "@/services/supabaseStore";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

function jsonResponse(data: any, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...NO_CACHE_HEADERS,
      ...(init?.headers || {}),
    },
  });
}

export async function GET() {
  try {
    const options = dataStore.getDecisionOptions
      ? await dataStore.getDecisionOptions()
      : [];
    return jsonResponse({ success: true, options });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load decision options";
    return jsonResponse({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.action === "reset") {
      const options = dataStore.resetDecisionOptions
        ? await dataStore.resetDecisionOptions()
        : [];
      return jsonResponse({ success: true, options });
    }

    const rawOpt = body.option || body;
    if (!rawOpt || !rawOpt.name || !rawOpt.name.trim()) {
      return jsonResponse(
        { success: false, error: "Option name is required" },
        { status: 400 }
      );
    }

    if (!dataStore.saveDecisionOption) {
      throw new Error("saveDecisionOption is not implemented");
    }

    const savedOption = await dataStore.saveDecisionOption({
      id: rawOpt.id ? Number(rawOpt.id) : undefined,
      name: rawOpt.name.trim(),
    });

    return jsonResponse({ success: true, option: savedOption });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save decision option";
    return jsonResponse({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const id = Number(body.id);
    if (!id) {
      return jsonResponse({ success: false, error: "Invalid decision option ID" }, { status: 400 });
    }

    if (dataStore.deleteDecisionOption) {
      await dataStore.deleteDecisionOption(id);
    }

    return jsonResponse({ success: true, id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete decision option";
    return jsonResponse({ success: false, error: message }, { status: 500 });
  }
}
