// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();
const browserCollections = {
  docs: create.doc("docs", {"bridge-and-zap.mdx": () => import("../content/docs/bridge-and-zap.mdx?collection=docs"), "faq.mdx": () => import("../content/docs/faq.mdx?collection=docs"), "governance-and-risk.mdx": () => import("../content/docs/governance-and-risk.mdx?collection=docs"), "how-it-works.mdx": () => import("../content/docs/how-it-works.mdx?collection=docs"), "index.mdx": () => import("../content/docs/index.mdx?collection=docs"), "vaults-and-yield.mdx": () => import("../content/docs/vaults-and-yield.mdx?collection=docs"), }),
};
export default browserCollections;