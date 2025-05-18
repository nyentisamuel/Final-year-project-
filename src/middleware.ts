import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  // const path = request.nextUrl.pathname;
  //
  // // Define paths that are considered public
  // const isPublicPath =
  //   path === "/" ||
  //   path.startsWith("/voter/register") ||
  //   path.startsWith("/voter/login") ||
  //   path.startsWith("/api/auth");
  //
  // // Define admin paths
  // const isAdminPath =
  //   path.startsWith("/admin") || path.startsWith("/api/admin");
  //
  // // Get the token
  // const token = await getToken({
  //   req: request,
  //   secret: process.env.NEXTAUTH_SECRET,
  // });
  //
  // // Redirect logic for admin paths
  // if (isAdminPath) {
  //   if (!token || token.role !== "admin") {
  //     return NextResponse.redirect(new URL("/admin/login", request.url));
  //   }
  // }
  //
  // // Redirect logic for protected voter paths
  // if (!isPublicPath && !isAdminPath) {
  //   if (!token) {
  //     return NextResponse.redirect(new URL("/voter/login", request.url));
  //   }
  // }
  //
  // return NextResponse.next();
}

// Configure the paths that should be matched by the middleware
export const config = {
  matcher: [
    "/admin/:path*",
    "/voter/:path*",
    "/api/admin/:path*",
    "/api/elections/:path*",
    "/api/candidates/:path*",
    "/api/votes/:path*",
  ],
};
