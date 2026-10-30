import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Building2, UserCheck } from 'lucide-react';

export const ParentAnnouncementsPage: React.FC = () => {
  const { announcements } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const parentAnnouncements = announcements.filter(
    (a) => a.targetAudience === 'ALL' || a.targetAudience === 'PARENT'
  );

  const filtered = parentAnnouncements.filter((a) => {
    if (selectedCategory === 'ALL') return true;
    return a.category === selectedCategory;
  });

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Collegiate & Hostel Announcements
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Official circulars, mess dining notices, maintenance schedules, and administrative circulars for parents.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          {['ALL', 'HOSTEL_ADMIN', 'MESS', 'MAINTENANCE', 'SECURITY'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-400 text-xs">
              No announcements found for category: {selectedCategory}
            </CardContent>
          </Card>
        ) : (
          filtered.map((item) => (
            <Card key={item.id} hoverEffect className="border-l-4 border-l-blue-600">
              <CardContent className="p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {item.title}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                      item.priority === 'URGENT'
                        ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                        : item.priority === 'HIGH'
                        ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                    }`}>
                      {item.priority} PRIORITY
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {item.category.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    Published: {item.publishedAt}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.content}
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                    <span>Issued by: <strong className="text-slate-700 dark:text-slate-300">{item.author}</strong> ({item.authorRole.replace('_', ' ')})</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    <span>Hostel: {item.hostel || 'All Campuses'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
