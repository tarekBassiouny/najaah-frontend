import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

describe("proxy", () => {
  it("rewrites branded center root requests to the landing route", () => {
    const request = new NextRequest("http://center-01.najaah.local/", {
      headers: {
        host: "center-01.najaah.local",
      },
    });

    const response = proxy(request);

    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "http://center-01.najaah.local/landing/center-01",
    );
  });

  it("preserves preview tokens and locale when rewriting arabic center roots", () => {
    const request = new NextRequest(
      "http://center-01.najaah.local/ar?preview_token=abc",
      {
        headers: {
          host: "center-01.najaah.local",
        },
      },
    );

    const response = proxy(request);
    const rewrite = response.headers.get("x-middleware-rewrite");

    expect(rewrite).toBe(
      "http://center-01.najaah.local/landing/center-01?preview_token=abc&locale=ar",
    );
  });

  it("prefers the requested url host over proxy headers", () => {
    const request = new NextRequest("https://branded1.najaah.me/", {
      headers: {
        host: "branded1.najaah.me",
        "x-forwarded-host": "admin.najaah.me",
      },
    });

    const response = proxy(request);

    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "https://branded1.najaah.me/landing/branded1",
    );
  });

  it("uses the forwarded center host when the internal request url is local", () => {
    const request = new NextRequest(
      "http://127.0.0.1:3000/?preview_token=abc",
      {
        headers: {
          host: "branded1.najaah.local:3000",
        },
      },
    );

    const response = proxy(request);

    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "http://localhost:3000/landing/branded1?preview_token=abc",
    );
  });

  it("does not rewrite apex-host marketing root requests", () => {
    const request = new NextRequest("http://najaah.local/", {
      headers: {
        host: "najaah.local",
      },
    });

    const response = proxy(request);

    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "http://najaah.local/landing-page-najaah.html",
    );
  });
});
