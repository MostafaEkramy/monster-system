// ============================================================
// MONSTERS TEAM MANAGEMENT SYSTEM — Task Service
// ============================================================

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
  Task,
  TaskAssignment,
  TaskStatus,
  CommitteeName,
  FilterState,
} from '@/types';

// ---- Constants ----

const TASKS_COL = 'tasks';
const TASK_ASSIGNMENTS_COL = 'taskAssignments';
const USERS_COL = 'users';

// ---- Task CRUD ----

/**
 * Create a task and its assignments in a single batch write.
 */
export async function createTask(
  taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>,
  assignedUserIds: string[]
): Promise<string> {
  const batch = writeBatch(db);

  // Create task document
  const taskRef = doc(collection(db, TASKS_COL));
  const taskId = taskRef.id;

  batch.set(taskRef, {
    ...taskData,
    assignedTo: assignedUserIds,
    status: 'assigned' as TaskStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Create a TaskAssignment for each assigned user
  for (const userId of assignedUserIds) {
    // Fetch user name for denormalization
    const userSnap = await getDoc(doc(db, USERS_COL, userId));
    const userName = userSnap.exists()
      ? (userSnap.data().fullName as string)
      : 'Unknown';

    const assignmentRef = doc(collection(db, TASK_ASSIGNMENTS_COL));
    batch.set(assignmentRef, {
      taskId,
      userId,
      userName,
      committee: taskData.committee,
      status: 'assigned' as TaskStatus,
      isLate: false,
      seasonId: taskData.seasonId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
  return taskId;
}

/**
 * Get tasks with optional filters.
 */
export async function getTasks(filters?: FilterState): Promise<Task[]> {
  let q = query(collection(db, TASKS_COL), orderBy('createdAt', 'desc'));

  const constraints: ReturnType<typeof where>[] = [];

  if (filters?.committee) {
    constraints.push(where('committee', '==', filters.committee));
  }
  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }
  if (filters?.season) {
    constraints.push(where('seasonId', '==', filters.season));
  }

  if (constraints.length > 0) {
    q = query(collection(db, TASKS_COL), ...constraints, orderBy('createdAt', 'desc'));
  }

  const snap = await getDocs(q);
  let tasks = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task);

  // Client-side text search (Firestore doesn't support full-text)
  if (filters?.search) {
    const term = filters.search.toLowerCase();
    tasks = tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(term) ||
        t.description.toLowerCase().includes(term)
    );
  }

  return tasks;
}

/**
 * Get a single task by ID.
 */
export async function getTaskById(taskId: string): Promise<Task | null> {
  const snap = await getDoc(doc(db, TASKS_COL, taskId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Task;
}

/**
 * Update task fields.
 */
export async function updateTask(
  taskId: string,
  data: Partial<Omit<Task, 'id' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, TASKS_COL, taskId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a task and all its assignments.
 */
export async function deleteTask(taskId: string): Promise<void> {
  const batch = writeBatch(db);

  // Delete the task
  batch.delete(doc(db, TASKS_COL, taskId));

  // Delete all related assignments
  const assignmentsSnap = await getDocs(
    query(collection(db, TASK_ASSIGNMENTS_COL), where('taskId', '==', taskId))
  );
  assignmentsSnap.docs.forEach((d) => batch.delete(d.ref));

  await batch.commit();
}

/**
 * Get tasks belonging to a specific committee.
 */
export async function getTasksByCommittee(
  committee: CommitteeName
): Promise<Task[]> {
  const q = query(
    collection(db, TASKS_COL),
    where('committee', '==', committee),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task);
}

/**
 * Get tasks assigned to a specific user (via TaskAssignments).
 */
export async function getTasksByUser(userId: string): Promise<Task[]> {
  const assignmentsSnap = await getDocs(
    query(collection(db, TASK_ASSIGNMENTS_COL), where('userId', '==', userId))
  );

  const taskIds = [
    ...new Set(assignmentsSnap.docs.map((d) => d.data().taskId as string)),
  ];

  if (taskIds.length === 0) return [];

  // Fetch each task (Firestore 'in' supports up to 30)
  const tasks: Task[] = [];
  const chunks = chunkArray(taskIds, 30);

  for (const chunk of chunks) {
    const q = query(collection(db, TASKS_COL), where('__name__', 'in', chunk));
    const snap = await getDocs(q);
    tasks.push(...snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task));
  }

  return tasks;
}

/**
 * Get all assignments for a given task.
 */
export async function getTaskAssignments(
  taskId: string
): Promise<TaskAssignment[]> {
  const q = query(
    collection(db, TASK_ASSIGNMENTS_COL),
    where('taskId', '==', taskId)
  );
  const snap = await getDocs(q);
  return snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as TaskAssignment
  );
}

/**
 * Get all assignments for a given user.
 */
export async function getUserAssignments(
  userId: string
): Promise<TaskAssignment[]> {
  const q = query(
    collection(db, TASK_ASSIGNMENTS_COL),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as TaskAssignment
  );
}

/**
 * Update the status of a TaskAssignment.
 */
export async function updateAssignmentStatus(
  assignmentId: string,
  status: TaskStatus
): Promise<void> {
  const data: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
  };

  if (status === 'submitted') {
    data.submittedAt = serverTimestamp();
  }

  await updateDoc(doc(db, TASK_ASSIGNMENTS_COL, assignmentId), data);
}

// ---- Helpers ----

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
