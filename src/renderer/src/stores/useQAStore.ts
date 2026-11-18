import { create } from 'zustand';
import { TestCase, TestSuite } from '../../../../common/types';

interface QAState {
  suites: TestSuite[];
  activeSuite: TestSuite | null;
  isRunningSuite: boolean;
  filterStatus: string;
  setSuites: (suites: TestSuite[]) => void;
  setActiveSuite: (suite: TestSuite | null) => void;
  addSuite: (suite: TestSuite) => void;
  updateTestCase: (suiteId: string, testCase: TestCase) => void;
  setIsRunningSuite: (isRunning: boolean) => void;
  setFilterStatus: (filter: string) => void;
}

export const useQAStore = create<QAState>((set) => ({
  suites: [],
  activeSuite: null,
  isRunningSuite: false,
  filterStatus: 'ALL',
  setSuites: (suites) => set({ suites }),
  setActiveSuite: (activeSuite) => set({ activeSuite }),
  addSuite: (suite) =>
    set((state) => ({
      suites: [suite, ...state.suites],
      activeSuite: suite,
    })),
  updateTestCase: (suiteId, testCase) =>
    set((state) => {
      const updatedSuites = state.suites.map((s) => {
        if (s.id !== suiteId) return s;
        const updatedCases = s.cases.map((c) => (c.id === testCase.id ? testCase : c));
        return { ...s, cases: updatedCases };
      });
      const updatedActive = state.activeSuite?.id === suiteId
        ? { ...state.activeSuite, cases: state.activeSuite.cases.map((c) => (c.id === testCase.id ? testCase : c)) }
        : state.activeSuite;
      return { suites: updatedSuites, activeSuite: updatedActive };
    }),
  setIsRunningSuite: (isRunningSuite) => set({ isRunningSuite }),
  setFilterStatus: (filterStatus) => set({ filterStatus }),
}));
