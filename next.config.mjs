/** @type {import('next').NextConfig} */
const nodeOnlyPackages = ["@piplabs/cdr-sdk", "multiformats"];

const nextConfig = {
  // Next.js 14.x: use experimental (serverExternalPackages is Next 15+ only)
  experimental: {
    serverComponentsExternalPackages: nodeOnlyPackages,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      const prev = config.externals;
      const extra = [
        "@piplabs/cdr-sdk",
        "multiformats",
        ({ request }, callback) => {
          if (
            typeof request === "string" &&
            (request === "multiformats" || request.startsWith("multiformats/"))
          ) {
            return callback(null, `commonjs ${request}`);
          }
          callback();
        },
      ];
      config.externals = Array.isArray(prev)
        ? [...prev, ...extra]
        : prev
          ? [prev, ...extra]
          : extra;
    } else {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
