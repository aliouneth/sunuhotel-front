import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV !== "production") return NextResponse.next();

  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProto ?? request.nextUrl.protocol.replace(":", "");

  if (protocol === "http" && !LOCAL_HOSTS.has(request.nextUrl.hostname)) {
    const host =
      request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ??
      request.nextUrl.host;
    try {
      const url = new URL(
        `${request.nextUrl.pathname}${request.nextUrl.search}`,
        `https://${host}`,
      );
      return NextResponse.redirect(url, 308);
    } catch {
      // Malformed host header: let the request through rather than failing.
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
