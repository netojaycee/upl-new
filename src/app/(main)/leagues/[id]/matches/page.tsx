import Main from "./Main";

export default async function MatchDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  console.log("MatchDetailsPage", id);

//   return <div>hhh</div>
  return <Main id={id} />;
}
