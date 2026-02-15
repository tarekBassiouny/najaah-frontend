function normalizeDomain(value) {
  if (!value) return null;

  let normalized = value.trim().toLowerCase();
  if (!normalized) return null;

  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    try {
      normalized = new URL(normalized).hostname.toLowerCase();
    } catch {
      return null;
    }
  }

  if (normalized.startsWith(".")) {
    normalized = normalized.slice(1);
  }

  if (normalized.startsWith("www.")) {
    normalized = normalized.slice(4);
  }

  return normalized.split(":")[0] || null;
}

function buildAllowedDevOrigins() {
  const domains = ["najaah.local", "najaah.me"];
  const envDomain = normalizeDomain(process.env.NEXT_PUBLIC_APP_DOMAIN);

  if (envDomain) {
    domains.push(envDomain);
  }

  return Array.from(
    new Set(domains.flatMap((domain) => [domain, `*.${domain}`])),
  );
}

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  allowedDevOrigins: buildAllowedDevOrigins(),
  images: {
    qualities: [75, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        port: "",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "pub-b7fd9c30cdbf439183b75041f5f71b92.r2.dev",
        port: "",
      },
    ],
  },
};

export default nextConfig;
