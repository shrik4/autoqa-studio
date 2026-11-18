import { create } from 'zustand';
import { LogEntry, LogLevel } from '../../../../common/types';

interface TerminalState {
  logs: LogEntry[];
  filterLevel: LogLevel | 'ALL';
  searchTerm: string;
  isAutoScroll: boolean;
  isDockOpen: boolean;
  dockHeight: number; // in pixels
  addLog: (log: LogEntry) => void;
  clearLogs: () => void;
  setFilterLevel: (level: LogLevel | 'ALL') => void;
  setSearchTerm: (term: string) => void;
  setAutoScroll: (autoScroll: boolean) => void;
  toggleDock: () => void;
  setDockHeight: (height: number) => void;
}

export const useTerminalStore = create<TerminalState>((set) => ({
  logs: [
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      level: 'INFO',
      category: 'SYSTEM',
      message: 'AutoQA Studio initialized. System ready for instructions.',
    },
    {
      id: 'init-2',
      timestamp: new Date().toLocaleTimeString(),
      level: 'SUCCESS',
      category: 'SYSTEM',
      message: 'Secure IPC communication bridge established (Context Isolation active).',
    },
  ],
  filterLevel: 'ALL',
  searchTerm: '',
  isAutoScroll: true,
  isDockOpen: true,
  dockHeight: 260,
  addLog: (log) =>
    set((state) => ({
      logs: [...state.logs.slice(-1000), log], // keep last 1000 logs for performance
    })),
  clearLogs: () => set({ logs: [] }),
  setFilterLevel: (filterLevel) => set({ filterLevel }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setAutoScroll: (isAutoScroll) => set({ isAutoScroll }),
  toggleDock: () => set((state) => ({ isDockOpen: !state.isDockOpen })),
  setDockHeight: (dockHeight) => set({ dockHeight }),
}));
