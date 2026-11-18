import { create } from 'zustand';
import { ExecutionPlan, ExecutionStatus, PlanStep } from '../../../../common/types';

interface ExecutionState {
  currentPlan: ExecutionPlan | null;
  status: ExecutionStatus;
  userInput: string;
  isConfirmationModalOpen: boolean;
  pendingConfirmationStep: PlanStep | null;
  setUserInput: (input: string) => void;
  setPlan: (plan: ExecutionPlan | null) => void;
  setStatus: (status: ExecutionStatus) => void;
  updateStep: (step: PlanStep) => void;
  requestConfirmation: (step: PlanStep) => void;
  closeConfirmation: () => void;
  resetExecution: () => void;
}

export const useExecutionStore = create<ExecutionState>((set) => ({
  currentPlan: null,
  status: 'IDLE',
  userInput: '',
  isConfirmationModalOpen: false,
  pendingConfirmationStep: null,
  setUserInput: (userInput) => set({ userInput }),
  setPlan: (currentPlan) => set({ currentPlan, status: currentPlan?.status || 'IDLE' }),
  setStatus: (status) => set({ status }),
  updateStep: (step) =>
    set((state) => {
      if (!state.currentPlan) return state;
      const updatedSteps = state.currentPlan.steps.map((s) => (s.id === step.id ? step : s));
      return {
        currentPlan: {
          ...state.currentPlan,
          steps: updatedSteps,
        },
      };
    }),
  requestConfirmation: (step) =>
    set({
      isConfirmationModalOpen: true,
      pendingConfirmationStep: step,
    }),
  closeConfirmation: () =>
    set({
      isConfirmationModalOpen: false,
      pendingConfirmationStep: null,
    }),
  resetExecution: () =>
    set({
      currentPlan: null,
      status: 'IDLE',
      isConfirmationModalOpen: false,
      pendingConfirmationStep: null,
    }),
}));
