import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Pin the workspace root: a stray lockfile in the home directory otherwise
  // makes Next infer the wrong root and warn on every build.
  turbopack: {
    root: __dirname,
  },
};

export default withNextIntl(nextConfig);
