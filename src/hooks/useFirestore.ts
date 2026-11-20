// ============================================================
// MONSTERS TEAM MANAGEMENT SYSTEM — Generic Firestore Hooks
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
  DocumentData,
  Query,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ---- Types ----

export interface QueryFilter {
  field: string;
  operator: '<' | '<=' | '==' | '!=' | '>=' | '>' | 'array-contains' | 'in' | 'array-contains-any' | 'not-in';
  value: unknown;
}

export interface QuerySort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface QueryOptions {
  filters?: QueryFilter[];
  sorts?: QuerySort[];
  limitCount?: number;
}

interface FirestoreState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface FirestoreCollectionState<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
}

// ---- Helper: Build Firestore Query ----

function buildQuery(
  collectionName: string,
  options?: QueryOptions
): Query<DocumentData> {
  const constraints: QueryConstraint[] = [];

  if (options?.filters) {
    for (const filter of options.filters) {
      constraints.push(where(filter.field, filter.operator, filter.value));
    }
  }

  if (options?.sorts) {
    for (const sort of options.sorts) {
      constraints.push(orderBy(sort.field, sort.direction));
    }
  }

  if (options?.limitCount) {
    constraints.push(limit(options.limitCount));
  }

  return query(collection(db, collectionName), ...constraints);
}

// ---- useCollection: Fetch a collection once ----

/**
 * Fetch documents from a Firestore collection with optional query constraints.
 * Returns { data, loading, error, refetch }.
 */
export function useCollection<T extends { id: string }>(
  collectionName: string,
  options?: QueryOptions
) {
  const [state, setState] = useState<FirestoreCollectionState<T>>({
    data: [],
    loading: true,
    error: null,
  });

  // Serialize options for dependency tracking
  const optionsKey = JSON.stringify(options ?? {});

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const q = buildQuery(collectionName, options);
      const snap = await getDocs(q);
      const docs = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as T
      );
      setState({ data: docs, loading: false, error: null });
    } catch (err) {
      setState({ data: [], loading: false, error: err as Error });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, optionsKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}

// ---- useDocument: Fetch a single document once ----

/**
 * Fetch a single document by ID.
 * Returns { data, loading, error, refetch }.
 */
export function useDocument<T extends { id: string }>(
  collectionName: string,
  docId: string | undefined
) {
  const [state, setState] = useState<FirestoreState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    if (!docId) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const snap = await getDoc(doc(db, collectionName, docId));
      if (snap.exists()) {
        setState({
          data: { id: snap.id, ...snap.data() } as T,
          loading: false,
          error: null,
        });
      } else {
        setState({ data: null, loading: false, error: null });
      }
    } catch (err) {
      setState({ data: null, loading: false, error: err as Error });
    }
  }, [collectionName, docId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}

// ---- useRealtime: Subscribe to real-time updates ----

/**
 * Subscribe to a Firestore collection for real-time updates.
 * Automatically cleans up the listener on unmount.
 * Returns { data, loading, error }.
 */
export function useRealtime<T extends { id: string }>(
  collectionName: string,
  options?: QueryOptions
) {
  const [state, setState] = useState<FirestoreCollectionState<T>>({
    data: [],
    loading: true,
    error: null,
  });

  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  // Serialize options for dependency tracking
  const optionsKey = JSON.stringify(options ?? {});

  useEffect(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const q = buildQuery(collectionName, options);

    unsubscribeRef.current = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as T
        );
        setState({ data: docs, loading: false, error: null });
      },
      (err) => {
        setState({ data: [], loading: false, error: err });
      }
    );

    return () => {
      unsubscribeRef.current?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, optionsKey]);

  return state;
}
