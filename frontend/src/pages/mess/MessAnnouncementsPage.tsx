import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Megaphone, Plus, Save, Calendar, CheckCircle2 } from 'lucide-react';

export const MessAnnouncementsPage: React.FC = () => {
  const { announcements, addAnnouncement } = useApp();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');

  const messNotices = announcements.filter((a) => a.category === 'MESS');

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    addAnnouncement({
      title: title.trim(),
      content: content.trim(),
      category: 'MESS',
      priority,
      author: 'Chef Raghavendra Rao',
      authorRole: 'MESS_INCHARGE',
      targetAudience: 'ALL',
      hostel: 'ALL',
    });

    setTitle('');
    setContent('');
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            Mess Dining Bulletins & Notices
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Publish special feast menus, meal timing alterations, and kitchen sanitization advisories to students and parents.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Notices list */}
        <div className="lg:col-span-2 space-y-4">
          {messNotices.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-slate-400 text-xs">
                No mess announcements posted yet.
              </CardContent>
            </Card>
          ) : (
            messNotices.map((n) => (
              <Card key={n.id} hoverEffect className="border-l-4 border-l-orange-500">
                <CardContent className="p-5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {n.title}
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                      {n.publishedAt}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {n.content}
                  </p>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Issued by: {n.author}</span>
                    <span className="font-bold text-orange-600 dark:text-orange-400 uppercase">
                      {n.priority}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Right Col: Compose Notice */}
        <div>
          <Card>
            <CardHeader title="Broadcast New Dining Notice" subtitle="Instant notice to scholars" />
            <CardContent>
              <form onSubmit={handlePost} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Notice Headline *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Special Festive Dinner on Friday"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Urgency Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  >
                    <option value="NORMAL">Normal Advisory</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent Closure / Change</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Detailed Announcement Text *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Enter menu adjustments, timing extensions, dietary notes, etc..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full justify-center bg-orange-600 hover:bg-orange-700 text-white font-bold"
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

