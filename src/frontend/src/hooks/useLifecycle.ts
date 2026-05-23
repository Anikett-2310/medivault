import { type WorkflowChain, createActor } from "@/backend";
import { useMyMedicines } from "@/hooks/useBackend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";

export type { WorkflowChain };

export function useWorkflowChain(medicineId: string | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<WorkflowChain>({
    queryKey: ["workflowChain", medicineId],
    queryFn: async () => {
      if (!actor || !medicineId) {
        return { stages: [] };
      }
      return actor.getWorkflowChain(medicineId);
    },
    enabled: !!actor && !isFetching && !!medicineId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useLifecycleMedicines() {
  return useMyMedicines();
}
