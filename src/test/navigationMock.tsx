import { useSyncExternalStore } from 'react';

type Listener = () => void;

let currentUrl = '/';
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach(listener => listener());
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function normalize(url: string) {
  return new URL(url, 'http://localhost').toString();
}

function getPathname() {
  return new URL(currentUrl, 'http://localhost').pathname;
}

function getSearchParams() {
  return new URL(currentUrl, 'http://localhost').searchParams;
}

export function resetNavigation(url = '/') {
  currentUrl = normalize(url);
  notify();
}

export function useMockPathname() {
  return useSyncExternalStore(subscribe, getPathname, getPathname);
}

export function useMockSearchParams() {
  return useSyncExternalStore(subscribe, getSearchParams, getSearchParams);
}

export const mockRouter = {
  push(url: string) {
    resetNavigation(url);
  },
  replace(url: string) {
    resetNavigation(url);
  },
  prefetch: async () => {},
  refresh() {
    notify();
  },
  back() {},
  forward() {},
};
