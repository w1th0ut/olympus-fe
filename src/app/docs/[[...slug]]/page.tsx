import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DocsBody, DocsPage } from "fumadocs-ui/page";
import { getMDXComponents } from "@/mdx-components";
import { source } from "@/lib/docs/source";

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

export default async function DocsSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const page = source.getPage(slug);

  if (!page) {
    notFound();
  }

  const MdxContent = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsBody>
        <MdxContent components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = source.getPage(slug);

  if (!page) {
    return {};
  }

  return {
    title: `${page.data.title} | Apollos Docs`,
    description: page.data.description,
  };
}
