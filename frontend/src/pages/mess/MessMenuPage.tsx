import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { 
  UtensilsCrossed, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Calendar, 
  Clock, 
  Check, 
  AlertCircle,
  Sparkles,
  Flame,
  Leaf
} from 'lucide-react';
import type { MealType, MenuItem, MenuEntry } from '../../types';

export const MessMenuPage: React.FC = () => {
  const { menuEntries, todayMenu, updateMenu, addToast } = useApp();

  const [selectedDate, setSelectedDate] = useState(() => todayMenu.date);
  const [selectedMeal, setSelectedMeal] = useState<MealType>('BREAKFAST');

  // Resolve current active menu entry
  const currentEntry: MenuEntry =
    menuEntries.find((m) => m.date === selectedDate) || todayMenu;

  const currentMealInfo = currentEntry.meals[selectedMeal];

  // Editable state for active meal
  const [items, setItems] = useState<MenuItem[]>(() => currentMealInfo.items);
  const [startTime, setStartTime] = useState(() => currentMealInfo.startTime);
  const [endTime, setEndTime] = useState(() => currentMealInfo.endTime);

  // New item draft inputs
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<MenuItem['category']>('VEG');
  const [newItemCalories, setNewItemCalories] = useState<number>(200);
  const [newItemIsSpecial, setNewItemIsSpecial] = useState(false);

  // When meal tab or date changes, synchronize form
  const handleMealChange = (meal: MealType) => {
    setSelectedMeal(meal);
    const mInfo = currentEntry.meals[meal];
    setItems(mInfo.items);
    setStartTime(mInfo.startTime);
    setEndTime(mInfo.endTime);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    const entry = menuEntries.find((m) => m.date === date) || todayMenu;
    const mInfo = entry.meals[selectedMeal];
    setItems(mInfo.items);
    setStartTime(mInfo.startTime);
    setEndTime(mInfo.endTime);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      addToast('Input Error', 'Please enter a valid dish name.', 'error');
      return;
    }

    const newItem: MenuItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      name: newItemName.trim(),
      category: newItemCategory,
      calories: newItemCalories || 180,
      isSpecial: newItemIsSpecial,
    };

    setItems((prev) => [...prev, newItem]);
    setNewItemName('');
    setNewItemIsSpecial(false);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSave = () => {
    if (items.length === 0) {
      addToast('Empty Menu', 'A meal requires at least one food item before saving.', 'error');
      return;
    }

    if (!startTime || !endTime || startTime >= endTime) {
      addToast('Invalid Time Window', 'Meal end time must be after the start time.', 'error');
      return;
    }

    const success = updateMenu(selectedDate, selectedMeal, items, {
      startTime,
      endTime,
    });

    if (success) {
      // Form saved and synced with student portal
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            Food Menu Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Configure dishes, dietary tags, calorie estimates, and serving hours. Changes synchronize immediately with student dining portals.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleSave}
          className="bg-orange-600 hover:bg-orange-700 text-white font-bold"
        >
          <Save className="w-4 h-4 mr-1.5" />
          Save {selectedMeal} Menu
        </Button>
      </div>

      {/* Date & Meal Selection Controls */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Date Selector */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:ring-1 focus:ring-orange-500"
          />
        </div>

        {/* Meal Tabs */}
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {(['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'] as MealType[]).map((m) => (
            <button
              key={m}
              onClick={() => handleMealChange(m)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedMeal === m
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Current Items & Time Settings */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title={`${selectedMeal} Menu Items (${items.length} items)`}
              subtitle="Current planned courses for the selected meal session"
              action={
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Timings:</span>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="px-2 py-1 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-semibold"
                  />
                  <span>to</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="px-2 py-1 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-semibold"
                  />
                </div>
              }
            />
            <CardContent className="space-y-3">
              {items.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No items listed for {selectedMeal}. Add items using the form on the right.
                </div>
              ) : (
                items.map((it, idx) => (
                  <div
                    key={it.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {it.name}
                          </span>
                          {it.isSpecial && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              Special
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded ${
                            it.category === 'VEG'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : it.category === 'NON_VEG'
                              ? 'bg-rose-500/10 text-rose-600'
                              : 'bg-blue-500/10 text-blue-600'
                          }`}>
                            {it.category}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-[11px]">
                            <Flame className="w-3 h-3 text-orange-400" />
                            ~{it.calories || 200} kcal
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(it.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Add New Item Drawer */}
        <div className="space-y-6">
          <Card>
            <CardHeader
              title={`Add New Item to ${selectedMeal}`}
              subtitle="Enter recipe specifications"
            />
            <CardContent>
              <form onSubmit={handleAddItem} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Dish / Food Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paneer Butter Masala, Sambar, etc."
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Dietary Category
                    </label>
                    <select
                      value={newItemCategory}
                      onChange={(e) => setNewItemCategory(e.target.value as any)}
                      className="w-full px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                    >
                      <option value="VEG">Vegetarian (Veg)</option>
                      <option value="NON_VEG">Non-Vegetarian</option>
                      <option value="BEVERAGE">Beverage / Tea / Coffee</option>
                      <option value="DESSERT">Sweet / Dessert</option>
                      <option value="SPECIAL">Chef's Special</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Estimated Calories
                    </label>
                    <input
                      type="number"
                      value={newItemCalories}
                      onChange={(e) => setNewItemCalories(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isSpecial"
                    checked={newItemIsSpecial}
                    onChange={(e) => setNewItemIsSpecial(e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded"
                  />
                  <label htmlFor="isSpecial" className="font-semibold text-slate-700 dark:text-slate-300">
                    Mark as Chef's Special / Highlight dish
                  </label>
                </div>

                <Button
                  type="submit"
                  variant="outline"
                  className="w-full justify-center border-orange-500/40 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add to Current Menu
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Quick Notice */}
          <div className="p-4 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/40 text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <span className="font-bold text-orange-800 dark:text-orange-300">
              Interactive Test Tip (Workflow B):
            </span>
            <p className="text-[11px] leading-relaxed">
              Edit any breakfast, lunch, or dinner item here and click <strong>Save Menu</strong>. Then navigate to the <strong>Student Portal</strong> → <strong>Today's Mess Menu</strong> to verify instant state synchronization!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

