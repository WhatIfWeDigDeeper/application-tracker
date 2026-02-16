import { createFileRoute } from "@tanstack/react-router";
import { ApplicationEdit } from "../../components/applications/ApplicationEdit";

export const Route = createFileRoute("/applications/new")({
  component: NewApplicationPage,
});

function NewApplicationPage() {
  return <ApplicationEdit />;
}
