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

interface LeaguesTableProps {
  leagues: League[];
  onEdit: (league: League) => void;
  onManageTeams: (league: League) => void;
  onManagePlayers: (league: League) => void;
  onManageMatches: (league: League) => void;
}

export function LeaguesTable({
  leagues,
  onEdit,
  onManageTeams,
  onManagePlayers,
  onManageMatches,
}: LeaguesTableProps) {
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
            <TableRow key={league.number}>
              <TableCell>{league.competition}</TableCell>
              <TableCell>{league.year}</TableCell>
              <TableCell className='text-right'>
                <LeagueActions
                  league={league}
                  onEdit={() => onEdit(league)}
                  onManageTeams={() => onManageTeams(league)}
                  onManagePlayers={() => onManagePlayers(league)}
                  onManageMatches={() => onManageMatches(league)}
                />
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
