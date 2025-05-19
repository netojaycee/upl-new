import Main from "./Main";

export default async function PlayerDetailsPage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = await params;

  return <Main playerId={playerId} />;
}
