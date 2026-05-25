import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Packages that must run in Node, not inside the webpack server bundle. */
const nodeOnlyPackages = [
  "@piplabs/cdr-sdk",
  "@piplabs/cdr-crypto",
  "@piplabs/cdr-contracts",
  "multiformats",
];

/** Absolute paths so webpack resolves ESM export maps (Vercel-safe). */
const multiformatsAliases = {
  "multiformats/cid": path.resolve(
    __dirname,
    "node_modules/multiformats/dist/src/cid.js"
  ),
  "multiformats/hashes/sha2": path.resolve(
    __dirname,
    "node_modules/multiformats/dist/src/hashes/sha2.js"
  ),
};

const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: nodeOnlyPackages,
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      ...multiformatsAliases,
    };

    if (isServer) {
      const prev = config.externals;
      const extra = [
        "@piplabs/cdr-sdk",
        "@piplabs/cdr-crypto",
        "@piplabs/cdr-contracts",
        "multiformats",
        ({ request }, callback) => {
          if (typeof request !== "string") {
            callback();
            return;
          }
          if (
            request === "multiformats" ||
            request.startsWith("multiformats/") ||
            request.startsWith("@piplabs/")
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
