import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_ROUTES = [
  "/auth/signin",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/_next", // para permitir assets internos
  "/api/auth", // rutas internas de NextAuth
  "/api/invoices", // rutas api públicas de facturas
  "/favicon.ico",
];

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const host = req.headers.get("host") || "";
  const subdomain = host.split(".")[0]?.toLowerCase();

  // 🔹 Permitir dominios base o locales sin subdominio
  const isBaseDomain =
    subdomain === "www" ||
    subdomain === "localhost" ||
    /^[\d:.]+$/.test(subdomain); // para IPs como 127.0.0.1

  // 🔹 Permitir rutas públicas sin verificar token
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    url.pathname.startsWith(route)
  );

  if (isBaseDomain || isPublicRoute) {
    return NextResponse.next();
  }

  // 🔹 Obtener token del usuario
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // 🔹 Si no hay sesión, redirigir al login
  if (!token) {
    const redirectUrl = new URL("/auth/signin", req.url);
    // redirectUrl.searchParams.set("callbackUrl", url.pathname); // opcional: para volver después de login
    return NextResponse.redirect(redirectUrl);
  }

  // 🔹 Si hay sesión, inyectar el subdominio en los headers
  const res = NextResponse.next();
  res.headers.set("x-tenant-subdomain", subdomain);

  return res;
}

// 🧭 Aplica a todas las rutas, excepto archivos estáticos
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
