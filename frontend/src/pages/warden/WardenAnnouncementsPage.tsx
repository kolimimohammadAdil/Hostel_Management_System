import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useWardenPortal } from './WardenPortalLayout';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Megaphone, Plus, Save, Calendar, Building2 } from 'lucide-react';

export const WardenAnnouncementsPage: React.FC = () => {
  const { hostelName, wardenProfile, hostelType } = useWardenPortal();
  const { announcements, addAnnouncement } = useApp();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');

  const hostelAnnouncements = announcements.filter(
    (a) => a.hostel === 'ALL' || a.hostel === hostelName
  );

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    addAnnouncement({
      title: title.trim(),
      content: content.trim(),
      category: 'HOSTEL_ADMIN',
      priority,
      author: wardenProfile.name,
      authorRole: hostelType === 'GIRLS' ? 'GIRLS_WARDEN' : 'BOYS_WARDEN',
      targetAudience: 'ALL',
      hostel: hostelName as 'Chakrika Girls Hostel' | 'ALTS Boys Hostel' | 'Kaveri Girls Hostel' | 'Ganga Boys Hostel',
    });

    setTitle('');
    setContent('');
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            {hostelName} Official Circulars & Notices
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Post curfew reminders, room inspection schedules, and resident advisory circulars.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {hostelAnnouncements.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-slate-400 text-xs">
                No circulars posted for this hostel yet.
              </CardContent>
            </Card>
          ) : (
            hostelAnnouncements.map((a) => (
              <Card key={a.id} hoverEffect className="border-l-4 border-l-blue-600">
                <CardContent className="p-5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {a.title}
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">{a.publishedAt}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {a.content}
                  </p>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Issued by: {a.author}</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 uppercase">{a.priority}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div>
          <Card>
            <CardHeader title="Broadcast Hostel Circular" subtitle="Post to resident scholar dashboard" />
            <CardContent>
              <form onSubmit={handlePost} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Notice Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Curfew Compliance & Room Inspection Notice"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  >
                    <option value="NORMAL">Normal Advisory</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent Curfew Directive</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Notice Details *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Enter complete notice text for hostel inmates..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  Publish Circular
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

