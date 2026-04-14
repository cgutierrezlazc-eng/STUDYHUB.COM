import { useState, useEffect } from 'react';
import { api } from './api';

interface OnlineCount {
  total: number;
  students: number;
  tutors: number;
}

const POLL_INTERVAL = 30_000; // 30 seconds

// Shared state across all hook consumers (avoids duplicate requests)
let sharedData: OnlineCount = { total: 0, students: 0, tutors: 0 };
let listeners: Set<() => void> = new Set();
let polling = false;

function startPolling() {
  if (polling) return;
  polling = true;

  const fetch = () => {
    api
      .getOnlineCount()
      .then((data: any) => {
        if (data && typeof data.total === 'number') {
          sharedData = { total: data.total, students: data.students, tutors: data.tutors };
          listeners.forEach((cb) => cb());
        }
      })
      .catch(() => {});
  };

  fetch();
  const interval = setInterval(fetch, POLL_INTERVAL);

  // Stop polling when no listeners
  const check = setInterval(() => {
    if (listeners.size === 0) {
      clearInterval(interval);
      clearInterval(check);
      polling = false;
    }
  }, 5000);
}

export function useOnlineCount(): OnlineCount {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const cb = () => forceUpdate((n) => n + 1);
    listeners.add(cb);
    startPolling();
    return () => {
      listeners.delete(cb);
    };
  }, []);

  return sharedData;
}
