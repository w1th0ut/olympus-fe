// @ts-nocheck
import * as __fd_glob_15 from "../content/docs/user/how-apollos-works.mdx?collection=docs"
import * as __fd_glob_14 from "../content/docs/dev/smart-contracts.mdx?collection=docs"
import * as __fd_glob_13 from "../content/docs/dev/chainlink-workflow.mdx?collection=docs"
import * as __fd_glob_12 from "../content/docs/faq-brand/faq.mdx?collection=docs"
import * as __fd_glob_11 from "../content/docs/faq-brand/brand-assets.mdx?collection=docs"
import * as __fd_glob_10 from "../content/docs/vaults-and-yield.mdx?collection=docs"
import * as __fd_glob_9 from "../content/docs/index.mdx?collection=docs"
import * as __fd_glob_8 from "../content/docs/how-it-works.mdx?collection=docs"
import * as __fd_glob_7 from "../content/docs/governance-and-risk.mdx?collection=docs"
import * as __fd_glob_6 from "../content/docs/faq.mdx?collection=docs"
import * as __fd_glob_5 from "../content/docs/chainlink-workflow.mdx?collection=docs"
import * as __fd_glob_4 from "../content/docs/bridge-and-zap.mdx?collection=docs"
import { default as __fd_glob_3 } from "../content/docs/user/meta.json?collection=docs"
import { default as __fd_glob_2 } from "../content/docs/faq-brand/meta.json?collection=docs"
import { default as __fd_glob_1 } from "../content/docs/dev/meta.json?collection=docs"
import { default as __fd_glob_0 } from "../content/docs/meta.json?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const docs = await create.docs("docs", "content/docs", {"meta.json": __fd_glob_0, "dev/meta.json": __fd_glob_1, "faq-brand/meta.json": __fd_glob_2, "user/meta.json": __fd_glob_3, }, {"bridge-and-zap.mdx": __fd_glob_4, "chainlink-workflow.mdx": __fd_glob_5, "faq.mdx": __fd_glob_6, "governance-and-risk.mdx": __fd_glob_7, "how-it-works.mdx": __fd_glob_8, "index.mdx": __fd_glob_9, "vaults-and-yield.mdx": __fd_glob_10, "faq-brand/brand-assets.mdx": __fd_glob_11, "faq-brand/faq.mdx": __fd_glob_12, "dev/chainlink-workflow.mdx": __fd_glob_13, "dev/smart-contracts.mdx": __fd_glob_14, "user/how-apollos-works.mdx": __fd_glob_15, });