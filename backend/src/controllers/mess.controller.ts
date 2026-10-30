import { Request, Response } from 'express';
import { UserRole } from '../models/user.model';
import { NotificationType } from '../models/notification.model';
import { createAndDeliverRoleNotification } from '../services/notification.service';

// Demonstrative in-memory mess state synchronized across all portals
let messSchedule = {
  isOpen: true,
  currentMeal: 'Lunch',
  todayTiming: '12:30 PM - 02:30 PM',
  nextMeal: 'Snacks (05:00 PM)',
  operationalNote: 'Mess operational. Cleanliness audit cleared at 11:30 AM.',
  lastUpdated: new Date().toISOString(),
};

let dailyMenu = [
  {
    meal: 'Breakfast',
    timing: '07:30 AM - 09:30 AM',
    items: ['Masala Dosa with Sambar & Coconut Chutney', 'Boiled Eggs / Sprouts', 'Fresh Seasonal Fruits', 'Coffee & Tea'],
  },
  {
    meal: 'Lunch',
    timing: '12:30 PM - 02:30 PM',
    items: ['Jeera Rice & Steamed Basmati', 'Dal Tadka', 'Paneer Butter Masala', 'Aloo Gobi Dry', 'Curd & Roasted Papad'],
  },
  {
    meal: 'Snacks',
    timing: '05:00 PM - 06:15 PM',
    items: ['Vegetable Pakora with Mint Chutney', 'Sweet Corn Chat', 'Filter Coffee & Masala Chai'],
  },
  {
    meal: 'Dinner',
    timing: '07:30 PM - 09:30 PM',
    items: ['Tandoori Chapati', 'Mixed Vegetable Curry', 'Rajma Masala', 'Vegetable Pulao', 'Gulab Jamun (Warm)'],
  },
];

let foodComplaints: any[] = [
  {
    id: 'CMP-2026-001',
    studentName: 'Priya Sharma',
    rollNumber: '21CS042',
    category: 'Hygiene',
    meal: 'Lunch',
    description: 'Cutlery rack was not replenished promptly and water glasses had spots.',
    status: 'Resolved',
    response: 'Catering staff briefed on deep sterilization. New batch of clean tumblers installed.',
    timestamp: '2026-10-28 13:45',
  },
  {
    id: 'CMP-2026-002',
    studentName: 'Aarav Patel',
    rollNumber: '21CS089',
    category: 'Food Quality',
    meal: 'Dinner',
    description: 'Chapatis served after 8:45 PM were cold and dry.',
    status: 'In Progress',
    response: 'Hot-case warming trays replaced to keep breads hot until closing.',
    timestamp: '2026-10-28 20:30',
  },
];

export const getMessSchedule = async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({ success: true, schedule: messSchedule });
};

export const updateMessSchedule = async (req: Request, res: Response): Promise<void> => {
  const { isOpen, currentMeal, operationalNote, todayTiming, nextMeal } = req.body;
  if (typeof isOpen === 'boolean') messSchedule.isOpen = isOpen;
  if (currentMeal) messSchedule.currentMeal = currentMeal;
  if (operationalNote) messSchedule.operationalNote = operationalNote;
  if (todayTiming) messSchedule.todayTiming = todayTiming;
  if (nextMeal) messSchedule.nextMeal = nextMeal;
  messSchedule.lastUpdated = new Date().toISOString();

  res.status(200).json({
    success: true,
    message: 'Mess schedule updated successfully',
    schedule: messSchedule,
  });
};

export const getDailyMenu = async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({ success: true, menu: dailyMenu });
};

export const updateDailyMenu = async (req: Request, res: Response): Promise<void> => {
  const { menu } = req.body;
  if (Array.isArray(menu)) {
    dailyMenu = menu;
  }

  // Notify resident students of revised dining options
  createAndDeliverRoleNotification(UserRole.STUDENT, {
    title: 'Mess Menu Updated',
    message: 'The daily dining menu has been revised by Chef Raghavendra Rao. Check today\'s offerings.',
    type: NotificationType.MESS_UPDATE,
  }).catch(() => {});

  res.status(200).json({ success: true, message: 'Menu updated successfully', menu: dailyMenu });
};

export const getFoodComplaints = async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  if (user.role === UserRole.STUDENT) {
    const studentComplaints = foodComplaints.filter(
      (c) => c.rollNumber === user.rollNumber || c.studentName === user.fullName
    );
    res.status(200).json({ success: true, complaints: studentComplaints });
    return;
  }
  res.status(200).json({ success: true, count: foodComplaints.length, complaints: foodComplaints });
};

export const submitFoodComplaint = async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { category, meal, description } = req.body;

  if (!category || !description) {
    res.status(400).json({ success: false, message: 'Category and description are required' });
    return;
  }

  const newComplaint = {
    id: `CMP-${Date.now().toString().slice(-4)}`,
    studentName: user.fullName,
    rollNumber: user.rollNumber || 'N/A',
    category,
    meal: meal || 'All Meals',
    description: String(description).trim(),
    status: 'Pending',
    response: null,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
  };

  foodComplaints.unshift(newComplaint);

  res.status(201).json({
    success: true,
    message: 'Food complaint submitted successfully',
    complaint: newComplaint,
  });
};

export const updateFoodComplaint = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, response } = req.body;

  const complaint = foodComplaints.find((c) => c.id === id);
  if (!complaint) {
    res.status(404).json({ success: false, message: 'Complaint not found' });
    return;
  }

  if (status) complaint.status = status;
  if (response) complaint.response = String(response).trim();

  res.status(200).json({
    success: true,
    message: 'Complaint updated successfully',
    complaint,
  });
};

