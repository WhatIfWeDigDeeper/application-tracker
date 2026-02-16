import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Header } from "../components/common/Header";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header />
      <Outlet />
    </div>
  );
}
