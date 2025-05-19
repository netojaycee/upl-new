import Main from "./Main";

export default async function TeamDetailsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  return <Main teamId={teamId} />;
}
