import type { ReactNode } from "react";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { RootProvider } from "fumadocs-ui/provider/next";
import { source } from "@/lib/docs/source";
import { docsLayoutOptions } from "@/lib/docs/layout-options";
import "fumadocs-ui/style.css";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <RootProvider theme={{ enabled: false }}>
      <DocsLayout tree={source.pageTree} sidebar={{ defaultOpenLevel: 1 }} {...docsLayoutOptions()}>
        {children}
      </DocsLayout>
    </RootProvider>
  );
}
