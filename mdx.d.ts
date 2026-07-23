// Lets TypeScript resolve `import Content from "*.mdx"` as a React component.
// `@next/mdx` compiles the file; this only supplies the module's type.
declare module "*.mdx" {
  import type { FC } from "react";
  import type { MDXProps } from "mdx/types";
  const MDXComponent: FC<MDXProps>;
  export default MDXComponent;
}
