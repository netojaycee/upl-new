"use client";

import { League } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LeagueActions } from "./LeagueActions";
import { useRouter } from "next/navigation";

interface LeaguesTableProps {
  leagues: League[];
  onEdit: (league: League) => void;
}

export function LeaguesTable({
  leagues,
  onEdit,
}: LeaguesTableProps) {
  const router = useRouter();
  const handleRowClick = (league: League) => {
    router.push(`/leagues/${league.id}`);
  };
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Competition</TableHead>
          <TableHead>Year</TableHead>
          <TableHead className='text-right'>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leagues.length === 0 ? (
          <TableRow>
            <TableCell colSpan={3} className='text-center'>
              No leagues found
            </TableCell>
          </TableRow>
        ) : (
          leagues.map((league) => (
            <TableRow
              onClick={() => handleRowClick(league)}
              key={league.id}
              className='cursor-pointer'
            >
              <TableCell>{league.competition}</TableCell>
              <TableCell>{league.year}</TableCell>
              <TableCell className='text-right'>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <LeagueActions
                    league={league}
                    onEdit={() => onEdit(league)}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
