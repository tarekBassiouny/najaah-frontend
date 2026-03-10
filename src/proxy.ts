import { NextResponse, type NextRequest } from "next/server";
import { resolveHostTenant } from "@/lib/host-routing";

function resolveRequestHost(request: NextRequest) {
  const candidates = [
    request.headers.get("host"),
    request.headers.get("x-forwarded-host"),
    request.nextUrl.host,
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    const tenant = resolveHostTenant(candidate);
    if (tenant.kind === "center") {
      return candidate;
    }
  }

  return candidates[0] ?? "";
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname !== "/" && pathname !== "/ar") {
    return NextResponse.next();
  }

  const host = resolveRequestHost(request);
  const tenant = resolveHostTenant(host);
  const url = request.nextUrl.clone();

  if (tenant.kind === "center" && tenant.centerSlug) {
    url.pathname = `/landing/${tenant.centerSlug}`;

    if (pathname === "/ar" && !url.searchParams.has("locale")) {
      url.searchParams.set("locale", "ar");
    }

    return NextResponse.rewrite(url);
  }

  url.pathname =
    pathname === "/ar" ? "/landing-page-najaah-ar.html" : "/landing-page-najaah.html";

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/", "/ar"],
};
