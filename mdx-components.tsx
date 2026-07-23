import type { MDXComponents } from "mdx/types";

/**
 * The shared typography wrapper for the legal pages (spec #18): `@next/mdx`
 * calls this to style the elements every legal MDX file emits, so the three
 * documents read consistently without a per-page stylesheet or the Tailwind
 * typography plugin. Only the tags the legal content actually uses are mapped.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: (props) => (
      <h1
        className="mb-2 text-3xl font-semibold tracking-tight text-balance"
        {...props}
      />
    ),
    h2: (props) => (
      <h2
        className="mt-10 mb-3 text-xl font-semibold tracking-tight"
        {...props}
      />
    ),
    p: (props) => (
      <p
        className="mt-3 leading-7 text-zinc-700 dark:text-zinc-300"
        {...props}
      />
    ),
    ul: (props) => (
      <ul
        className="mt-3 list-disc space-y-2 pl-6 text-zinc-700 dark:text-zinc-300"
        {...props}
      />
    ),
    ol: (props) => (
      <ol
        className="mt-3 list-decimal space-y-2 pl-6 text-zinc-700 dark:text-zinc-300"
        {...props}
      />
    ),
    li: (props) => <li className="leading-7" {...props} />,
    strong: (props) => (
      <strong className="font-semibold text-foreground" {...props} />
    ),
    a: (props) => (
      <a className="underline hover:text-foreground" {...props} />
    ),
    hr: (props) => (
      <hr className="my-8 border-zinc-200 dark:border-zinc-800" {...props} />
    ),
    ...components,
  };
}
