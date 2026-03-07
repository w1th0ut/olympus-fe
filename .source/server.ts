// @ts-nocheck
import * as __fd_glob_6 from "../content/docs/vaults-and-yield.mdx?collection=docs"
import * as __fd_glob_5 from "../content/docs/index.mdx?collection=docs"
import * as __fd_glob_4 from "../content/docs/how-it-works.mdx?collection=docs"
import * as __fd_glob_3 from "../content/docs/governance-and-risk.mdx?collection=docs"
import * as __fd_glob_2 from "../content/docs/faq.mdx?collection=docs"
import * as __fd_glob_1 from "../content/docs/bridge-and-zap.mdx?collection=docs"
import { default as __fd_glob_0 } from "../content/docs/meta.json?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const docs = await create.docs("docs", "content/docs", {"meta.json": __fd_glob_0, }, {"bridge-and-zap.mdx": __fd_glob_1, "faq.mdx": __fd_glob_2, "governance-and-risk.mdx": __fd_glob_3, "how-it-works.mdx": __fd_glob_4, "index.mdx": __fd_glob_5, "vaults-and-yield.mdx": __fd_glob_6, });