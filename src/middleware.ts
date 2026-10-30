import { type NextRequest, NextResponse } from "next/server";
import {
  generateDeviceToken,
  verifyDeviceToken,
  isValidSecretKey,
  TRUSTED_DEVICE_COOKIE_NAME,
  TRUSTED_DEVICE_MAX_AGE_SECONDS,
} from "@/utils/trustedDevice";

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  const pairKey = searchParams.get("pair_key") || searchParams.get("unlock");
  if (isValidSecretKey(pairKey)) {
    const token = await generateDeviceToken();
    const cleanUrl = new URL(pathname === "/demo" ? "/demo" : "/", request.url);
    const redirectRes = NextResponse.redirect(cleanUrl);
    redirectRes.headers.set("Referrer-Policy", "no-referrer");
    redirectRes.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    redirectRes.cookies.set({
      name: TRUSTED_DEVICE_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: TRUSTED_DEVICE_MAX_AGE_SECONDS,
    });
    return redirectRes;
  }

  const token = request.cookies.get(TRUSTED_DEVICE_COOKIE_NAME)?.value;
  const isTrusted = await verifyDeviceToken(token);

  const isPublicApi =
    pathname.startsWith("/api/auth/trust-device") ||
    pathname === "/api/auth/pin" ||
    pathname === "/api/health";

  if (pathname.startsWith("/api/") && !isPublicApi && !isTrusted) {
    const forbiddenRes = NextResponse.json(
      {
        error: "Access restricted. This device is not authorized for direct database queries.",
        isGuest: true,
      },
      { status: 403 }
    );
    forbiddenRes.headers.set("X-Content-Type-Options", "nosniff");
    forbiddenRes.headers.set("X-Frame-Options", "SAMEORIGIN");
    return forbiddenRes;
  }

  const response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  });

  response.headers.set("x-habiventure-trusted", isTrusted ? "true" : "false");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  if (isTrusted && !pathname.startsWith("/api/")) {
    const freshToken = await generateDeviceToken();
    response.cookies.set({
      name: TRUSTED_DEVICE_COOKIE_NAME,
      value: freshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: TRUSTED_DEVICE_MAX_AGE_SECONDS,
    });
  }

  return response;
}

