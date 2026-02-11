import { describe, expect, it } from "vitest";
import { getCenterSlugFromHost, resolveHostTenant } from "@/lib/host-routing";

describe("resolveHostTenant", () => {
  it("classifies apex host as apex", () => {
    const result = resolveHostTenant("najaah.me", "najaah.me");

    expect(result.kind).toBe("apex");
    expect(result.centerSlug).toBeNull();
  });

  it("classifies admin host as admin", () => {
    const result = resolveHostTenant("admin.najaah.me", "najaah.me");

    expect(result.kind).toBe("admin");
    expect(result.centerSlug).toBeNull();
  });

  it("classifies center subdomain as center", () => {
    const result = resolveHostTenant("center-01.najaah.me", "najaah.me");

    expect(result.kind).toBe("center");
    expect(result.centerSlug).toBe("center-01");
  });

  it("treats localhost and ip as admin context", () => {
    expect(resolveHostTenant("localhost:3000", "najaah.me").kind).toBe("admin");
    expect(resolveHostTenant("127.0.0.1:3000", "najaah.me").kind).toBe("admin");
  });

  it("returns unknown for nested center subdomains", () => {
    const result = resolveHostTenant("foo.bar.najaah.me", "najaah.me");

    expect(result.kind).toBe("unknown");
    expect(result.centerSlug).toBeNull();
  });
});

describe("getCenterSlugFromHost", () => {
  it("returns slug only for center hosts", () => {
    expect(getCenterSlugFromHost("center-01.najaah.me", "najaah.me")).toBe(
      "center-01",
    );
    expect(getCenterSlugFromHost("admin.najaah.me", "najaah.me")).toBeNull();
    expect(getCenterSlugFromHost("najaah.me", "najaah.me")).toBeNull();
  });
});
