import { createFileRoute } from "@tanstack/react-router";
import { ApplicationEdit } from "../../components/applications/ApplicationEdit";
import { fetchApplication } from "../../server/applications";
import { useHydrated } from "../../hooks/useHydrated";

export const Route = createFileRoute("/applications/$id")({
  loader: ({ params }) => fetchApplication({ data: { id: params.id } }),
  // Don't cache loader data — always fetch fresh application data on navigation.
  // This ensures edits made via the form are reflected when re-visiting the page.
  gcTime: 0,
  component: EditApplicationPage,
});

function EditApplicationPage() {
  const hydrated = useHydrated();
  const { id } = Route.useParams();
  const loaderData = Route.useLoaderData();

  if (!hydrated) return null;
  return <ApplicationEdit key={id} applicationId={id} initialApplication={loaderData} />;
}
