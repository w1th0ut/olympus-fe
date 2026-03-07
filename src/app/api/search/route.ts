import { createSearchAPI } from "fumadocs-core/search/server";
import { source } from "@/lib/docs/source";

const api = createSearchAPI("simple", {
  indexes: async () =>
    Promise.all(
      source.getPages().map(async (page) => ({
        title: page.data.title,
        description: page.data.description,
        breadcrumbs: page.slugs,
        content: await page.data.getText("raw"),
        url: page.url,
        keywords: page.data.title,
      })),
    ),
});

export const { GET } = api;
