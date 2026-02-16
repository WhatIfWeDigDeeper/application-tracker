import { createFileRoute } from "@tanstack/react-router";
import { ApplicationEdit } from "../../components/applications/ApplicationEdit";

export const Route = createFileRoute("/applications/$id")({
  component: EditApplicationPage,
});

function EditApplicationPage() {
  const { id } = Route.useParams();
  return <ApplicationEdit applicationId={id} />;
}
