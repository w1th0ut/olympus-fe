// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();
const browserCollections = {
  docs: create.doc("docs", {"bridge-and-zap.mdx": () => import("../content/docs/bridge-and-zap.mdx?collection=docs"), "chainlink-workflow.mdx": () => import("../content/docs/chainlink-workflow.mdx?collection=docs"), "faq.mdx": () => import("../content/docs/faq.mdx?collection=docs"), "governance-and-risk.mdx": () => import("../content/docs/governance-and-risk.mdx?collection=docs"), "how-it-works.mdx": () => import("../content/docs/how-it-works.mdx?collection=docs"), "index.mdx": () => import("../content/docs/index.mdx?collection=docs"), "vaults-and-yield.mdx": () => import("../content/docs/vaults-and-yield.mdx?collection=docs"), "dev/chainlink-workflow.mdx": () => import("../content/docs/dev/chainlink-workflow.mdx?collection=docs"), "dev/smart-contracts.mdx": () => import("../content/docs/dev/smart-contracts.mdx?collection=docs"), "faq-brand/brand-assets.mdx": () => import("../content/docs/faq-brand/brand-assets.mdx?collection=docs"), "faq-brand/faq.mdx": () => import("../content/docs/faq-brand/faq.mdx?collection=docs"), "user/how-apollos-works.mdx": () => import("../content/docs/user/how-apollos-works.mdx?collection=docs"), }),
};
export default browserCollections;