import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Node-only packages — never webpack-bundle (CDR / IPFS / Circle Gateway). */
const nodeOnlyPackages = [
  "@piplabs/cdr-sdk",
  "@piplabs/cdr-crypto",
  "@piplabs/cdr-contracts",
  "@circle-fin/x402-batching",
  "multiformats",
  "helia",
  "@helia/unixfs",
];

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
  webpack: (config, { isServer, dev }) => {
    // Workaround for intermittent .next cache corruption on Windows dev sessions
    // causing missing chunk/module errors like "./948.js".
    if (dev) {
      // Faster than disabled cache, but avoids flaky filesystem cache writes on Windows.
      config.cache = { type: "memory" };
    }

    config.resolve.alias = {
      ...config.resolve.alias,
      ...multiformatsAliases,
    };

    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      {
        module: /virtualMasterPool/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ];

    if (isServer) {
      const prev = config.externals;
      const extra = [
        "@piplabs/cdr-sdk",
        "@piplabs/cdr-crypto",
        "@piplabs/cdr-contracts",
        "@circle-fin/x402-batching",
        "multiformats",
        "helia",
        "@helia/unixfs",
        ({ request }, callback) => {
          if (typeof request !== "string") {
            callback();
            return;
          }
          if (
            request === "multiformats" ||
            request.startsWith("multiformats/") ||
            request.startsWith("@piplabs/") ||
            request.startsWith("@circle-fin/") ||
            request === "helia" ||
            request.startsWith("helia/") ||
            request.startsWith("@helia/")
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
