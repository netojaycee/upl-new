// "use client";

// import { ChangeEvent, useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Modal } from "@/components/local/Modal";
// import { DeleteModal } from "@/components/local/DeleteModal";
// import { useLeagues } from "@/lib/firebaseQueries";
// import { Circle, Loader2, Pencil, Plus } from "lucide-react";

// import { Input } from "@/components/ui/input";
// import { League } from "@/lib/types";
// import { LeagueForm } from "@/components/local/forms/LeagueForm";


// export default function LeaguesPage() {
//   const [isAddLeagueModalOpen, setIsAddLeagueModalOpen] = useState(false);
//   const [editLeague, setEditLeague] = useState<League | null>(null);
//   const { data: leagues = [], isLoading, error } = useLeagues();
// console.log(leagues && leagues)
//   const [searchQuery, setSearchQuery] = useState("");

//   const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
//     setSearchQuery(event.target.value);
//   };

 
//    const filteredLeagues = Array.isArray(leagues)
//       ? (leagues).filter((league) =>
//           league.competition.toLowerCase().includes(searchQuery.toLowerCase())
//         )
//       : [];
  
//     if (isLoading) {
//       return (
//         <div className='flex justify-center'>
//           <div className='relative'>
//             <Circle className='h-20 w-20  text-muted-foreground/20 opacity-70 animate-pulse ' />
//             <Loader2
//               className='absolute inset-0 m-auto animate-spin h-10 w-10 text-primary'
//               aria-label='Loading'
//             />
//           </div>{" "}
//         </div>
//       );
//     }

 

//   return (
//     <div className='container mx-auto py-8'>
//       <div className='flex w-full justify-between items-center mb-3 gap-4'>
//         <Input
//           type='text'
//           placeholder='Search teams...'
//           value={searchQuery}
//           onChange={handleSearchChange}
//           className='max-w-sm'
//         />
//         <Button onClick={() => setIsAddLeagueModalOpen(true)}>
//           <Plus className='w-4 h-4' /> Add League
//         </Button>
//       </div>
//       {isLoading && (
//         <div className='flex justify-center'>
//           <div className='relative'>
//             <Circle className='h-20 w-20 text-muted-foreground/20 opacity-70 animate-pulse' />
//             <Loader2
//               className='absolute inset-0 m-auto animate-spin h-10 w-10 text-primary'
//               aria-label='Loading'
//             />
//           </div>
//         </div>
//       )}
//       {error && <div className='text-red-500'>Error loading leagues</div>}
//       {!isLoading && !error && leagues && (
//         <div className='mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
//           {leagues &&
//             filteredLeagues.map((league) => (
//               <div
//                 key={league.id}
//                 className='border rounded-lg p-4 flex flex-col items-center'
//               >
//                 {/* <Link href={`/teams/${league.id}/players`}>
//                   <Image
//                     width={200}
//                     height={200}
//                     src={league.imageUrl ?? "/logotest.jpg"}
//                     alt={league.name}
//                     className='w-24 h-24 object-cover rounded-full mb-2'
//                   />
//                 </Link> */}
//                 <div className='flex justify-between items-center w-full'>
//                   <span className='text-lg font-medium'>{league.competition}</span>
//                   <div className='flex gap-2'>
//                     <button
//                       onClick={() => setEditLeague(league)}
//                       className='text-blue-500 hover:text-blue-700'
//                     >
//                       <Pencil className='w-4 h-4' />
//                     </button>

//                     <DeleteModal
//                       //   isOpen={isDeleteModalOpen}
//                       // onClose={() => setIsDeleteModalOpen(false)}
//                       onClose={() => {}}
//                       itemId={league.id}
//                       itemName={league?.competition}
//                       // onSuccess={() => setIsDeleteModalOpen(false)}
//                       onSuccess={() => {}}
//                       type='league'
//                     />
//                   </div>
//                 </div>
//               </div>
//             ))}
//         </div>
//       )}
//       <Modal
//         isOpen={isAddLeagueModalOpen}
//         onClose={() => setIsAddLeagueModalOpen(false)}
//         title='Add New League'
//       >
//         <LeagueForm
//           onSuccess={() => setIsAddLeagueModalOpen(false)}
//         />
//       </Modal>
//       <Modal
//         isOpen={!!editLeague}
//         onClose={() => setEditLeague(null)}
//         title='Edit League'
//       >
//         <LeagueForm
//           league={editLeague}
//           onSuccess={() => setEditLeague(null)}
//         />
//       </Modal>
//     </div>
//   );
// }


"use client";

import { ChangeEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { League } from "@/lib/types";
import { useLeagues } from "@/lib/firebaseQueries";
import { Circle, Loader2, Plus } from "lucide-react";
import { LeaguesTable } from "@/components/local/LeaguesTable";
import { LeagueForm } from "@/components/local/forms/LeagueForm";
import { ManageTeamsModal } from "@/components/local/ManageTeamsModal";
import { ManagePlayersDrawer } from "@/components/local/ManagePlayersDrawer";
import { Modal } from "@/components/local/Modal";

export default function LeaguesPage() {
  const [isAddLeagueModalOpen, setIsAddLeagueModalOpen] = useState(false);
  const [editLeague, setEditLeague] = useState<League | null>(null);
  const [manageTeamsLeague, setManageTeamsLeague] = useState<League | null>(
    null
  );
  const [managePlayersLeague, setManagePlayersLeague] = useState<League | null>(
    null
  );
  const { data: leagues = [], isLoading, error } = useLeagues();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const filteredLeagues = Array.isArray(leagues)
    ? leagues.filter((league) =>
        league.competition.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleManageMatches = (league: League) => {
    console.log("Manage matches for league:", league.competition);
  };

  if (isLoading) {
    return (
      <div className='flex justify-center'>
        <div className='relative'>
          <Circle className='h-20 w-20 text-muted-foreground/20 opacity-70 animate-pulse' />
          <Loader2
            className='absolute inset-0 m-auto animate-spin h-10 w-10 text-primary'
            aria-label='Loading'
          />
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-8'>
      <div className='flex w-full justify-between items-center mb-6 gap-4'>
        <Input
          type='text'
          placeholder='Search leagues...'
          value={searchQuery}
          onChange={handleSearchChange}
          className='max-w-sm'
        />
        <Button onClick={() => setIsAddLeagueModalOpen(true)}>
          <Plus className='w-4 h-4 mr-2' /> Add League
        </Button>
      </div>
      {error && <div className='text-red-500 mb-4'>Error loading leagues</div>}
      <LeaguesTable
        leagues={filteredLeagues}
        onEdit={setEditLeague}
        onManageTeams={setManageTeamsLeague}
        onManagePlayers={setManagePlayersLeague}
        onManageMatches={handleManageMatches}
      />
      <Modal
        isOpen={isAddLeagueModalOpen}
        onClose={() => setIsAddLeagueModalOpen(false)}
        title='Add New League'
      >
        <LeagueForm onSuccess={() => setIsAddLeagueModalOpen(false)} />
      </Modal>
      <Modal
        isOpen={!!editLeague}
        onClose={() => setEditLeague(null)}
        title='Edit League'
      >
        <LeagueForm league={editLeague} onSuccess={() => setEditLeague(null)} />
      </Modal>
      {manageTeamsLeague && (
        <ManageTeamsModal
          isOpen={!!manageTeamsLeague}
          onClose={() => setManageTeamsLeague(null)}
          league={manageTeamsLeague}
        />
      )}
      {managePlayersLeague && (
        <ManagePlayersDrawer
          isOpen={!!managePlayersLeague}
          onClose={() => setManagePlayersLeague(null)}
          league={managePlayersLeague}
        />
      )}
    </div>
  );
}