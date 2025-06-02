import Main from "./Main";

export default async function LeagueDetailsPage({
  params,
}: {
  params: Promise<{ id: string; teamId: string }>;
}) {
  const { id, teamId } = await params;

  return <Main id={id} teamId={teamId} />;
}
