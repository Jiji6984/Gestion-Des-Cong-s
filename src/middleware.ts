import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options as any));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  const routesPubliques = ["/login", "/validation"];
  const estPublique = routesPubliques.some((r) => pathname.startsWith(r));

  // Non connecté → login
  if (!user && !estPublique) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Connecté sur /login → rediriger selon le rôle
  if (user && pathname === "/login") {
    const { data: employe } = await supabase
      .from("employes")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = employe?.role ?? "employe";
    if (role === "admin") return NextResponse.redirect(new URL("/admin", request.url));
    if (role === "manager") return NextResponse.redirect(new URL("/manager", request.url));
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Protéger /admin → réservé aux admins
  if (user && pathname.startsWith("/admin")) {
    const { data: employe } = await supabase
      .from("employes")
      .select("role")
      .eq("id", user.id)
      .single();
    if (employe?.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Protéger /manager → réservé aux managers et admins
  if (user && pathname.startsWith("/manager")) {
    const { data: employe } = await supabase
      .from("employes")
      .select("role")
      .eq("id", user.id)
      .single();
    if (!["manager", "admin"].includes(employe?.role ?? "")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
