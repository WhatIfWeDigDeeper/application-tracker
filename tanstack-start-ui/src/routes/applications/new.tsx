import { createFileRoute } from "@tanstack/react-router";
import { ApplicationEdit } from "../../components/applications/ApplicationEdit";
import { useHydrated } from "../../hooks/useHydrated";

export const Route = createFileRoute("/applications/new")({
  component: NewApplicationPage,
});

function NewApplicationPage() {
  const hydrated = useHydrated();
  if (!hydrated) return null;
  return <ApplicationEdit key="new" />;
}
