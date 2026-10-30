import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DoorClosed, Search, Building2, Wrench, Users, CheckCircle2, AlertTriangle } from 'lucide-react';

export const MaintenanceRoomsPage: React.FC = () => {
  const { hostelRooms, maintenanceIssues } = useApp();

  const [activeHostelTab, setActiveHostelTab] = useState<'Chakrika Girls Hostel' | 'ALTS Boys Hostel'>('Chakrika Girls Hostel');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRooms = hostelRooms.filter((r) => {
    const matchesHostel = r.hostel === activeHostelTab;
    const matchesSearch =
      r.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.block.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.floor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesHostel && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <DoorClosed className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Hostel Room Directory & Facilities Inspection
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Physical room inventory separated by Chakrika Girls and ALTS Boys complexes. Inspect occupancy, structural fixtures, and active tickets.
          </p>
        </div>

        {/* Hostel Toggle Tabs */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveHostelTab('Chakrika Girls Hostel')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeHostelTab === 'Chakrika Girls Hostel'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Chakrika Girls Hostel (Block B)
          </button>
          <button
            onClick={() => setActiveHostelTab('ALTS Boys Hostel')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeHostelTab === 'ALTS Boys Hostel'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            ALTS Boys Hostel (Block A)
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search room by number (e.g. B-304, A-102), floor, or block..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
        />
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRooms.map((room) => {
          const roomIssues = maintenanceIssues.filter(
            (m) => m.hostel === room.hostel && m.roomNumber === room.roomNumber
          );
          const activeIssues = roomIssues.filter((m) => m.status !== 'RESOLVED');

          return (
            <Card key={room.id} hoverEffect className={activeIssues.length > 0 ? 'border-amber-500/40' : ''}>
              <CardContent className="p-5 space-y-3 text-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Room {room.roomNumber}</span>
                      <span className="text-[10px] font-mono font-normal text-slate-400">
                        ({room.floor})
                      </span>
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                      {room.block} • {room.roomType} Sharing
                    </p>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      activeIssues.length > 0
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {activeIssues.length > 0 ? `${activeIssues.length} Active Ticket` : 'Fixtures Clean'}
                  </span>
                </div>

                {/* Occupancy stats */}
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Occupancy:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {room.occupied} of {room.capacity} beds occupied
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    Inmates: {room.inmates.join(', ')}
                  </div>
                </div>

                {/* Maintenance summary */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Maintenance History ({roomIssues.length} Work Orders)
                  </span>
                  {roomIssues.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No historical issues reported.</p>
                  ) : (
                    roomIssues.slice(0, 2).map((iss) => (
                      <div
                        key={iss.id}
                        className="p-2 rounded bg-slate-100 dark:bg-slate-800/80 text-[11px] flex items-center justify-between gap-2"
                      >
                        <span className="truncate">• {iss.description}</span>
                        <Badge
                          variant={iss.status === 'RESOLVED' ? 'success' : 'warning'}
                          size="sm"
                        >
                          {iss.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex justify-between">
                  <span>Last Inspected: {room.lastInspected || 'Recently verified'}</span>
                  <span className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold">{room.id}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

