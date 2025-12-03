export type LessonFilter = 'all' | 'upcoming' | 'past' | 'unpaid' | 'canceled';

export interface Lesson {
 id: string;
 date: string;
  price: number;
  isPaid: boolean;
  isCanceled: boolean;
  notes?: string;
 topic?: string;
  ownerId: string;
  studentId: string;
  subjectId?: string;
  createdAt: string;
  student: {
    id: string;
    name: string;
    contact?: string;
    ownerId: string;
    createdAt: string;
 };
  subject?: {
    id: string;
    name: string;
    color: string;
    userId: string;
    createdAt: string;
  };
}

export interface Student {
  id: string;
  name: string;
  contact?: string;
  note?: string;
  ownerId: string;
  skinColor?: string;
  hairStyle?: string;
  hairColor?: string;
  eyeStyle?: string;
  accessory?: string;
  bgColor?: string;
  createdAt: string;
  subjects: Subject[];
  lessons: Lesson[];
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  icon?: string;
  userId: string;
  createdAt: string;
  students: Student[];
 lessons: Lesson[];
}

export interface Stats {
  totalLessons: number;
  totalStudents: number;
  totalIncome: number;
  upcomingLessons: number;
}

export interface DashboardStats {
    studentsCount: number;
    totalLessons: number;
    monthlyIncome: number;
    subjectsCount: number;
    upcomingLessons: Lesson[];
    unpaidLessons: Lesson[];
    createdAt: string;
}

export interface LessonFormData {
  studentId: string;
  subjectId: string;
  date: Date;
  price: string;
  isPaid: boolean;
  topic?: string;
  notes?: string;
}

export interface DayData {
  date: Date;
  lessons: Lesson[];
  totalIncome: number;
  completedLessons: number;
  canceledLessons: number;
}

export interface MonthlyData {
  month: string;
  year: number;
  income: number;
  lessonsCount: number;
}