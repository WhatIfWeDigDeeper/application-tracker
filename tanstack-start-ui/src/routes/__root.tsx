import type { ReactNode } from "react";
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { Header } from "../components/common/Header";
import { queryClient } from "../lib/queryClient";
import appCss from "../index.css?url";

// Static inline script to apply dark mode before React hydrates (prevents FOUC).
// This is a static string literal with no user input — safe to use with dangerouslySetInnerHTML.
const darkModeScript = `
(function(){
  try {
    var s = localStorage.getItem('app-theme');
    if (s === 'dark' || (!s && matchMedia('(prefers-color-scheme:dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  } catch(e) {}
})();
`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Job Application Tracker" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
          <Header />
          <Outlet />
        </div>
      </QueryClientProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        {/* Static dark mode script — no user input, safe for dangerouslySetInnerHTML */}
        <script
          dangerouslySetInnerHTML={{ __html: darkModeScript }}
          suppressHydrationWarning
        />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
