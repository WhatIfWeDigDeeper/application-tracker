import { createBrowserRouter } from "react-router-dom";
import App from "./App";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: App,
    children: [
      {
        index: true,
        lazy: () =>
          import("./pages/ListPage").then((m) => ({ Component: m.ListPage })),
      },
      {
        path: "applications/new",
        lazy: () =>
          import("./components/applications/ApplicationEdit").then((m) => ({
            Component: m.ApplicationEdit,
          })),
      },
      {
        path: "applications/:id",
        lazy: () =>
          import("./components/applications/ApplicationEdit").then((m) => ({
            Component: m.ApplicationEdit,
          })),
      },
    ],
  },
]);
