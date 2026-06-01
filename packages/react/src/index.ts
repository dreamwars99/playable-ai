import { useCallback, useMemo, useState, type DependencyList } from "react";
import {
  acceptCandidate as acceptQueuedCandidate,
  createEmptyQueue,
  createTaskFromPack,
  enqueueCandidates,
  ignoreCandidate as ignoreQueuedCandidate,
  type CandidateQueue,
  type JsonObject,
  type PlayableCandidate,
  type PlayableOperation,
  type PlayableProvider,
  type PlayableProviderResult,
  type PlayableScope,
  type PlayableTask,
  type PlayableTaskPack
} from "playable-ai";

export type UseCandidateQueueResult<TOperation extends PlayableOperation = PlayableOperation> = {
  queue: CandidateQueue<TOperation>;
  enqueue: (candidates: PlayableCandidate<TOperation>[]) => void;
  accept: (candidateId: string) => void;
  ignore: (candidateId: string) => void;
  reset: () => void;
};

export type UsePlayableProviderRunnerOptions<
  TSnapshot extends JsonObject = JsonObject,
  TOperation extends PlayableOperation = PlayableOperation
> = {
  onCandidates?: (candidates: PlayableCandidate<TOperation>[], result: PlayableProviderResult<TOperation>) => void;
  onError?: (error: Error, task: PlayableTask<TSnapshot>) => void;
};

export type UsePlayableProviderRunnerResult<
  TSnapshot extends JsonObject = JsonObject,
  TOperation extends PlayableOperation = PlayableOperation
> = {
  run: (task: PlayableTask<TSnapshot>) => Promise<PlayableProviderResult<TOperation> | undefined>;
  isRunning: boolean;
  error: Error | null;
};

export function usePlayableTaskPack<TState, TSnapshot extends JsonObject>(
  pack: PlayableTaskPack<TState, TSnapshot>,
  state: TState,
  scope: PlayableScope,
  dependencies?: DependencyList
): PlayableTask<TSnapshot> {
  const memoDependencies = dependencies ?? [pack, state, scope];

  return useMemo(() => createTaskFromPack(pack, state, scope), memoDependencies);
}

export function useCandidateQueue<TOperation extends PlayableOperation>(): UseCandidateQueueResult<TOperation> {
  const [queue, setQueue] = useState(() => createEmptyQueue<TOperation>());

  const enqueue = useCallback((candidates: PlayableCandidate<TOperation>[]) => {
    setQueue((current) => enqueueCandidates(current, candidates));
  }, []);

  const accept = useCallback((candidateId: string) => {
    setQueue((current) => acceptQueuedCandidate(current, candidateId));
  }, []);

  const ignore = useCallback((candidateId: string) => {
    setQueue((current) => ignoreQueuedCandidate(current, candidateId));
  }, []);

  const reset = useCallback(() => {
    setQueue(createEmptyQueue<TOperation>());
  }, []);

  return {
    queue,
    enqueue,
    accept,
    ignore,
    reset
  };
}

export function usePlayableProviderRunner<
  TSnapshot extends JsonObject,
  TOperation extends PlayableOperation
>(
  provider: PlayableProvider<TSnapshot, TOperation>,
  options: UsePlayableProviderRunnerOptions<TSnapshot, TOperation> = {}
): UsePlayableProviderRunnerResult<TSnapshot, TOperation> {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const run = useCallback(
    async (task: PlayableTask<TSnapshot>) => {
      setIsRunning(true);
      setError(null);

      try {
        const result = await provider.run({ task });
        options.onCandidates?.(result.candidates, result);
        return result;
      } catch (caughtError) {
        const nextError = normalizeError(caughtError);
        setError(nextError);
        options.onError?.(nextError, task);
        return undefined;
      } finally {
        setIsRunning(false);
      }
    },
    [options, provider]
  );

  return {
    run,
    isRunning,
    error
  };
}

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

