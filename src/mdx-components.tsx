import type { MDXComponents } from "mdx/types";
import defaultComponents from "fumadocs-ui/mdx";
import { SmartContractsFromEnv } from "@/components/docs/SmartContractsFromEnv";

export function getMDXComponents(components: MDXComponents = {}): MDXComponents {
  return {
    ...defaultComponents,
    SmartContractsFromEnv,
    ...components,
  };
}
