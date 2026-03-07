import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export function docsLayoutOptions(): BaseLayoutProps {
  return {
    nav: {
      title: "Apollos Docs",
      url: "/docs",
    },
    links: [
      {
        type: "custom",
        children: (
          <a
            href="/"
            className="inline-flex items-center rounded-md px-2.5 py-1.5 text-sm font-medium text-fd-foreground hover:bg-fd-accent hover:text-fd-accent-foreground"
          >
            Back to Website
          </a>
        ),
      },
    ],
    searchToggle: {
      enabled: true,
    },
    themeSwitch: {
      enabled: false,
    },
  };
}
