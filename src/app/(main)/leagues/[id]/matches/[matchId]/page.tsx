import Main from "./Main";

export default async function MatchDetailsPage({
  params,
}: {
  params: Promise<{ matchId: string; id: string  }>;
}) {
  const { matchId, id } = await params;

  return <Main leagueId={id} matchId={matchId} />;
}
