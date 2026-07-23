import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// MDX authors the legal pages (ADR 0002 / spec #18): one file per page per
// locale, styled through the root `mdx-components.tsx`. No remark/rehype plugins
// are passed so the config stays serializable for Turbopack.
const withMDX = createMDX({});

const nextConfig: NextConfig = {
  // Legal content lives in `.mdx` files imported as components; `.md`/`.mdx`
  // also need to count as page extensions for `@next/mdx` to compile them.
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  // Pin the workspace root: a stray lockfile in the home directory otherwise
  // makes Next infer the wrong root and warn on every build.
  turbopack: {
    root: __dirname,
  },
};

export default withNextIntl(withMDX(nextConfig));
