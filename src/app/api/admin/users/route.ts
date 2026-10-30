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
    const adminUserId = Number(searchParams.get("adminUserId") || searchParams.get("userId"));

    const auth = await authenticateAdminRequest(request, adminUserId || null);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error || "Access denied. Active Super Admin privileges required." },
        { status: auth.status || 403, headers: NO_CACHE_HEADERS }
      );
    }

    const [users, pairs] = await Promise.all([
      dataStore.getUsers(),
      dataStore.getPairs?.() || Promise.resolve([]),
    ]);

    return NextResponse.json(
      {
        success: true,
        users,
        pairs,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch users";
    return NextResponse.json({ error: message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adminUserId, user } = body;

    const auth = await authenticateAdminRequest(request, adminUserId ? Number(adminUserId) : null);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error || "Access denied. Active Super Admin privileges required." },
        { status: auth.status || 403, headers: NO_CACHE_HEADERS }
      );
    }


    if (!user || typeof user !== "object") {
      return NextResponse.json(
        { error: "User payload object is required." },
        { status: 400 }
      );
    }

    const trimmedName = user.name?.trim();
    if (!trimmedName) {
      return NextResponse.json(
        { error: "Full name is required." },
        { status: 400 }
      );
    }

    const trimmedPin = String(user.pin || "").trim();
    if (!/^\d{4}$/.test(trimmedPin)) {
      return NextResponse.json(
        { error: "Account PIN must consist of exactly 4 numeric digits (0-9)." },
        { status: 400 }
      );
    }

    if (user.gender && user.gender !== "male" && user.gender !== "female") {
      return NextResponse.json(
        { error: "Gender must be either 'male' or 'female'." },
        { status: 400 }
      );
    }

    if (user.role && user.role !== "user" && user.role !== "superadmin") {
      return NextResponse.json(
        { error: "Role must be either 'user' or 'superadmin'." },
        { status: 400 }
      );
    }

    const partnerId = user.partnerId ? Number(user.partnerId) : null;

    const createdUser = await dataStore.createUser?.({
      name: trimmedName,
      phone: user.phone?.trim() || "",
      gender: user.gender || "male",
      role: user.role || "user",
      active: user.active !== false,
      pin: trimmedPin,
      partnerId,
    });

    return NextResponse.json({
      success: true,
      user: createdUser,
      message: `Account '${createdUser?.name}' created successfully with assigned duo partner!`,
    }, { headers: NO_CACHE_HEADERS });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create user account.";
    return NextResponse.json({ error: message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { adminUserId, targetUserId, updates } = body;

    const auth = await authenticateAdminRequest(request, adminUserId ? Number(adminUserId) : null);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error || "Access denied. Active Super Admin privileges required." },
        { status: auth.status || 403, headers: NO_CACHE_HEADERS }
      );
    }


    const numTargetId = Number(targetUserId);
    if (!numTargetId) {
      return NextResponse.json(
        { error: "Valid target user ID is required." },
        { status: 400 }
      );
    }

    if (!updates || typeof updates !== "object") {
      return NextResponse.json(
        { error: "Updates object is required." },
        { status: 400 }
      );
    }

    if (updates.gender && updates.gender !== "male" && updates.gender !== "female") {
      return NextResponse.json(
        { error: "Gender must be either 'male' or 'female'." },
        { status: 400 }
      );
    }

    if (updates.role && updates.role !== "user" && updates.role !== "superadmin") {
      return NextResponse.json(
        { error: "Role must be either 'user' or 'superadmin'." },
        { status: 400 }
      );
    }

    if (updates.newPin) {
      if (!/^\d{4}$/.test(String(updates.newPin).trim())) {
        return NextResponse.json(
          { error: "New PIN must consist of exactly 4 numeric digits (0-9)." },
          { status: 400 }
        );
      }
    }

    const targetUser = await dataStore.getUserById(numTargetId);
    if (!targetUser) {
      return NextResponse.json(
        { error: "Target user account not found in database." },
        { status: 404 }
      );
    }

    const safeName = updates.name && typeof updates.name === "string" && updates.name.trim()
      ? updates.name.trim()
      : targetUser.name;

    const safeRole = numTargetId === 1
      ? "superadmin"
      : (updates.role || targetUser.role || "user");

    const partnerId = updates.partnerId !== undefined
      ? (updates.partnerId ? Number(updates.partnerId) : null)
      : undefined;

    const updatedUser = await dataStore.updateUser?.(numTargetId, {
      ...updates,
      name: safeName,
      role: safeRole,
      partnerId,
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `Account '${updatedUser?.name}' updated successfully!`,
    }, { headers: NO_CACHE_HEADERS });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update user account.";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminUserId = Number(searchParams.get("adminUserId"));
    const targetUserId = Number(searchParams.get("targetUserId"));

    const auth = await authenticateAdminRequest(request, adminUserId || null);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error || "Access denied. Active Super Admin privileges required." },
        { status: auth.status || 403, headers: NO_CACHE_HEADERS }
      );
    }


    if (!targetUserId || targetUserId === 1) {
      return NextResponse.json(
        { error: "Super Admin account cannot be deleted." },
        { status: 400 }
      );
    }

    await dataStore.deleteUser?.(targetUserId);

    return NextResponse.json({
      success: true,
      message: "User account deleted successfully.",
    }, { headers: NO_CACHE_HEADERS });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete user account.";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
