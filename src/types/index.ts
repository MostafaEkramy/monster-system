// ============================================================
// MONSTERS TEAM MANAGEMENT SYSTEM — Type Definitions
// ============================================================

import { Timestamp } from 'firebase/firestore';

// ---- Enums & Constants ----

export type UserRole =
  | 'magic'
  | 'president'
  | 'vice_president'
  | 'leader'
  | 'hr_leader'
  | 'hr_member'
  | 'member';

export type AccountStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type CommitteeName =
  | 'logistics'
  | 'creativity'
  | 'media'
  | 'pr'
  | 'hr'
  | 'activity';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus =
  | 'assigned'
  | 'in_progress'
  | 'submitted'
  | 'late'
  | 'under_review'
  | 'evaluated';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export type SeasonStatus = 'active' | 'upcoming' | 'archived';

export type NotificationType =
  | 'new_task'
  | 'deadline'
  | 'evaluation'
  | 'attendance'
  | 'registration';

export type ActivityAction =
  | 'user_registered'
  | 'registration_approved'
  | 'registration_rejected'
  | 'role_changed'
  | 'committee_changed'
  | 'task_created'
  | 'task_modified'
  | 'task_deleted'
  | 'task_assigned'
  | 'task_submitted'
  | 'task_resubmitted'
  | 'evaluation_created'
  | 'evaluation_modified'
  | 'attendance_created'
  | 'attendance_modified'
  | 'season_created'
  | 'season_activated'
  | 'season_archived'
  | 'admin_action';

// ---- Database Models ----

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  university?: string;
  profileImage?: string;
  committee: CommitteeName;
  role: UserRole;
  status: AccountStatus;
  joinDate: Timestamp;
  currentSeasonPoints: number;
  currentSeasonRank: number;
  attendancePercentage: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Committee {
  id: string;
  name: CommitteeName;
  displayName: string;
  displayNameAr: string;
  description: string;
  descriptionAr: string;
  leaderId?: string;
  leaderName?: string;
  memberCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  committee: CommitteeName;
  committeeId: string;
  assignedTo: string[]; // User IDs
  assignedToAll: boolean;
  createdBy: string;
  createdByName: string;
  creationDate: Timestamp;
  startDate: Timestamp;
  deadline: Timestamp;
  priority: TaskPriority;
  status: TaskStatus;
  attachments: TaskAttachment[];
  submissionRequirements: string;
  maxScore?: number;
  seasonId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TaskAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Timestamp;
}

export interface TaskAssignment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  committee: CommitteeName;
  status: TaskStatus;
  isLate: boolean;
  submittedAt?: Timestamp;
  seasonId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Submission {
  id: string;
  taskId: string;
  taskTitle: string;
  userId: string;
  userName: string;
  committee: CommitteeName;
  textContent: string;
  files: SubmissionFile[];
  version: number;
  isLate: boolean;
  isLocked: boolean;
  submittedAt: Timestamp;
  seasonId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SubmissionFile {
  name: string;
  url: string;
  type: string;
  size: number;
  storagePath: string;
}

export interface Evaluation {
  id: string;
  taskId: string;
  taskTitle: string;
  submissionId: string;
  userId: string;
  userName: string;
  committee: CommitteeName;
  awardedPoints: number;
  maxPoints: number;
  feedback: string;
  evaluatorId: string;
  evaluatorName: string;
  evaluationDate: Timestamp;
  isFinalized: boolean;
  seasonId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AttendanceSession {
  id: string;
  title: string;
  committee: CommitteeName;
  date: Timestamp;
  createdBy: string;
  createdByName: string;
  seasonId: string;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalExcused: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  committee: CommitteeName;
  status: AttendanceStatus;
  date: Timestamp;
  recordedBy: string;
  seasonId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Season {
  id: string;
  name: string;
  description: string;
  startDate: Timestamp;
  endDate: Timestamp;
  status: SeasonStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  isRead: boolean;
  targetId?: string;
  targetType?: string;
  createdAt: Timestamp;
}

export interface ActivityLog {
  id: string;
  actorId: string;
  actorName: string;
  action: ActivityAction;
  targetEntity: string;
  targetId: string;
  committeeId?: string;
  details: string;
  timestamp: Timestamp;
}

export interface SystemSettings {
  id: string;
  magicInitialized: boolean;
  currentSeasonId: string;
  currentSeasonName: string;
  maintenanceMode: boolean;
  updatedAt: Timestamp;
}

// ---- Utility Types ----

export interface SelectOption {
  value: string;
  label: string;
  labelAr?: string;
}

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  labelAr?: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface FilterState {
  search?: string;
  userId?: string;
  taskId?: string;
  committee?: CommitteeName;
  role?: UserRole;
  status?: string;
  season?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ---- Committee Display Map ----

export const COMMITTEE_DISPLAY: Record<CommitteeName, { en: string; ar: string }> = {
  logistics: { en: 'Logistics', ar: 'اللوجستيات' },
  creativity: { en: 'Creativity', ar: 'الإبداع' },
  media: { en: 'Media', ar: 'الإعلام' },
  pr: { en: 'PR', ar: 'العلاقات العامة' },
  hr: { en: 'HR', ar: 'الموارد البشرية' },
  activity: { en: 'Activity', ar: 'الأنشطة' },
};

export const ROLE_DISPLAY: Record<UserRole, { en: string; ar: string }> = {
  magic: { en: 'Magic', ar: 'ماجيك' },
  president: { en: 'President', ar: 'الرئيس' },
  vice_president: { en: 'Vice President', ar: 'نائب الرئيس' },
  leader: { en: 'Committee Leader', ar: 'قائد اللجنة' },
  hr_leader: { en: 'HR Leader', ar: 'قائد الموارد البشرية' },
  hr_member: { en: 'HR Member', ar: 'عضو الموارد البشرية' },
  member: { en: 'Member', ar: 'عضو' },
};

export const PRIORITY_DISPLAY: Record<TaskPriority, { en: string; ar: string; color: string }> = {
  low: { en: 'Low', ar: 'منخفض', color: 'bg-blue-500/20 text-blue-400' },
  medium: { en: 'Medium', ar: 'متوسط', color: 'bg-yellow-500/20 text-yellow-400' },
  high: { en: 'High', ar: 'مرتفع', color: 'bg-orange-500/20 text-orange-400' },
  urgent: { en: 'Urgent', ar: 'عاجل', color: 'bg-red-500/20 text-red-400' },
};

export const STATUS_DISPLAY: Record<TaskStatus, { en: string; ar: string; color: string }> = {
  assigned: { en: 'Assigned', ar: 'معيّنة', color: 'bg-slate-500/20 text-slate-400' },
  in_progress: { en: 'In Progress', ar: 'قيد التنفيذ', color: 'bg-blue-500/20 text-blue-400' },
  submitted: { en: 'Submitted', ar: 'تم التسليم', color: 'bg-green-500/20 text-green-400' },
  late: { en: 'Late', ar: 'متأخر', color: 'bg-red-500/20 text-red-400' },
  under_review: { en: 'Under Review', ar: 'قيد المراجعة', color: 'bg-purple-500/20 text-purple-400' },
  evaluated: { en: 'Evaluated', ar: 'تم التقييم', color: 'bg-emerald-500/20 text-emerald-400' },
};

export const ATTENDANCE_DISPLAY: Record<AttendanceStatus, { en: string; ar: string; color: string }> = {
  present: { en: 'Present', ar: 'حاضر', color: 'bg-green-500/20 text-green-400' },
  absent: { en: 'Absent', ar: 'غائب', color: 'bg-red-500/20 text-red-400' },
  late: { en: 'Late', ar: 'متأخر', color: 'bg-yellow-500/20 text-yellow-400' },
  excused: { en: 'Excused', ar: 'معذور', color: 'bg-blue-500/20 text-blue-400' },
};
