import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { 
  MessageSquareWarning, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  UtensilsCrossed,
  Sparkles
} from 'lucide-react';
import type { FoodComplaintCategory, MealType } from '../../types';

export const StudentFoodComplaintsPage: React.FC = () => {
  const { activeStudent, foodComplaints, submitFoodComplaint } = useApp();

  const [category, setCategory] = useState<FoodComplaintCategory>('COLD_FOOD');
  const [mealType, setMealType] = useState<MealType>('LUNCH');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Complaints submitted by this active student
  const myComplaints = foodComplaints.filter((c) => c.studentId === activeStudent.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    submitFoodComplaint({
      studentId: activeStudent.id,
      category,
      mealType,
      description: description.trim(),
    });

    setDescription('');
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquareWarning className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            Food Quality Grievances & Feedback
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Submit food feedback directly to Chef Raghavendra Rao (Mess Incharge). Track real-time investigation and corrective responses.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <Badge variant="info">
            {myComplaints.length} My Submissions
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Complaint Form (1 Col) */}
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Submit Food Complaint (Workflow C)"
              subtitle="Logged to Chef Raghavendra Rao's queue"
            />
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Grievance Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as FoodComplaintCategory)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  >
                    <option value="FOOD_QUALITY">Food Quality & Taste</option>
                    <option value="COLD_FOOD">Cold Food / Ineffective Warmers</option>
                    <option value="INSUFFICIENT_QUANTITY">Insufficient Quantity / Counter Depletion</option>
                    <option value="MENU_MISMATCH">Menu Mismatch (Scheduled vs Served)</option>
                    <option value="HYGIENE">Hygiene & Sanitization</option>
                    <option value="OTHER">Other Miscellaneous</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Affected Meal Session *
                  </label>
                  <select
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value as MealType)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  >
                    <option value="BREAKFAST">Breakfast (07:30 - 09:30)</option>
                    <option value="LUNCH">Lunch (12:30 - 14:30)</option>
                    <option value="SNACKS">Evening Snacks (17:00 - 18:15)</option>
                    <option value="DINNER">Dinner (19:30 - 21:30)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Detailed Description *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe specific counter, timing, items affected (e.g. Counter 2 curd was unavailable at 13:45; chapatis were cold)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                  Reporting as: <strong className="text-slate-700 dark:text-slate-300">{activeStudent.name}</strong> ({activeStudent.rollNumber}, Room {activeStudent.roomNumber})
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full justify-center bg-orange-600 hover:bg-orange-700 text-white font-bold"
                  disabled={isSubmitting}
                >
                  <Send className="w-4 h-4 mr-1.5" />
                  Submit Grievance (Workflow C)
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right 2 Cols: My Submitted Complaints */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader
              title="My Food Feedback & Complaints Roster"
              subtitle="Live status updates from dining management"
            />
            <CardContent className="space-y-4">
              {myComplaints.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  You haven't logged any food complaints yet. Use the form to submit feedback.
                </div>
              ) : (
                myComplaints.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {item.id}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                          {item.category.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {item.mealType}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            item.status === 'RESOLVED'
                              ? 'success'
                              : item.status === 'IN_PROGRESS'
                              ? 'warning'
                              : 'danger'
                          }
                          size="sm"
                        >
                          {item.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {item.submittedAt}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                      "{item.description}"
                    </p>

                    {/* Official Response from Mess Incharge */}
                    {item.response ? (
                      <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300 text-[11px]">
                          <span>Official Response from {item.respondedBy || 'Chef Raghavendra Rao'}:</span>
                          <span className="font-mono text-slate-400">{item.respondedAt}</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 italic">
                          "{item.response}"
                        </p>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 italic">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Awaiting mess incharge review and corrective action</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

