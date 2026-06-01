export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];

export type JsonObject = {
  [key: string]: JsonValue;
};

export type PlayableScope = {
  app: string;
  surface: string;
  entityId?: string;
  feature?: string;
};

export type PlayableApplyPolicy = "review_required" | "auto_if_safe" | "manual_only";

export type PlayableCandidateStatus = "suggested" | "inferred" | "extracted" | "rejected" | "stale";

export type PlayableEvidence = {
  sourceId: string;
  label?: string;
  reason: string;
};

export type PlayableOperation<TPayload extends JsonObject = JsonObject> = {
  type: string;
  targetId?: string;
  payload: TPayload;
};

export type PlayableTask<TSnapshot extends JsonObject = JsonObject> = {
  id: string;
  scope: PlayableScope;
  snapshot: TSnapshot;
  allowedOperations?: string[];
  constraints?: string[];
  instructions?: string;
  createdAt: string;
  metadata?: JsonObject;
};

export type PlayableCandidate<TOperation extends PlayableOperation = PlayableOperation> = {
  id: string;
  taskId: string;
  status: PlayableCandidateStatus;
  operations: TOperation[];
  applyPolicy: PlayableApplyPolicy;
  confidence?: number;
  title?: string;
  summary?: string;
  evidence?: PlayableEvidence[];
  createdAt: string;
  metadata?: JsonObject;
};

export type PlayableTaskPack<TState, TSnapshot extends JsonObject = JsonObject> = {
  id: string;
  title: string;
  description?: string;
  allowedOperations: string[];
  constraints?: string[];
  buildSnapshot: (state: TState) => TSnapshot;
  buildInstructions?: (snapshot: TSnapshot) => string;
};

export type PlayableProviderRequest<TSnapshot extends JsonObject = JsonObject> = {
  task: PlayableTask<TSnapshot>;
};

export type PlayableProviderResult<TOperation extends PlayableOperation = PlayableOperation> = {
  candidates: PlayableCandidate<TOperation>[];
};

export type PlayableProvider<TSnapshot extends JsonObject = JsonObject, TOperation extends PlayableOperation = PlayableOperation> = {
  id: string;
  run: (request: PlayableProviderRequest<TSnapshot>) => Promise<PlayableProviderResult<TOperation>>;
};

export type CandidateQueue<TOperation extends PlayableOperation = PlayableOperation> = {
  pending: PlayableCandidate<TOperation>[];
  accepted: PlayableCandidate<TOperation>[];
  ignored: PlayableCandidate<TOperation>[];
};

export function createTask<TSnapshot extends JsonObject>(
  input: Omit<PlayableTask<TSnapshot>, "createdAt"> & { createdAt?: string }
): PlayableTask<TSnapshot> {
  return {
    ...input,
    createdAt: input.createdAt ?? new Date().toISOString()
  };
}

export function createCandidate<TOperation extends PlayableOperation>(
  input: Omit<PlayableCandidate<TOperation>, "id" | "createdAt"> & {
    id?: string;
    createdAt?: string;
  }
): PlayableCandidate<TOperation> {
  return {
    ...input,
    id: input.id ?? createId("candidate"),
    createdAt: input.createdAt ?? new Date().toISOString()
  };
}

export function createTaskFromPack<TState, TSnapshot extends JsonObject>(
  pack: PlayableTaskPack<TState, TSnapshot>,
  state: TState,
  scope: PlayableScope
): PlayableTask<TSnapshot> {
  const snapshot = pack.buildSnapshot(state);

  return createTask({
    id: pack.id,
    scope,
    snapshot,
    allowedOperations: pack.allowedOperations,
    constraints: pack.constraints,
    instructions: pack.buildInstructions?.(snapshot)
  });
}

export function createMockProvider<TSnapshot extends JsonObject, TOperation extends PlayableOperation>(
  input: {
    id: string;
    generate: (task: PlayableTask<TSnapshot>) => PlayableCandidate<TOperation>[];
  }
): PlayableProvider<TSnapshot, TOperation> {
  return {
    id: input.id,
    async run(request) {
      return {
        candidates: input.generate(request.task)
      };
    }
  };
}

export function createEmptyQueue<TOperation extends PlayableOperation>(): CandidateQueue<TOperation> {
  return {
    pending: [],
    accepted: [],
    ignored: []
  };
}

export function enqueueCandidates<TOperation extends PlayableOperation>(
  queue: CandidateQueue<TOperation>,
  candidates: PlayableCandidate<TOperation>[]
): CandidateQueue<TOperation> {
  return {
    ...queue,
    pending: [...queue.pending, ...candidates]
  };
}

export function acceptCandidate<TOperation extends PlayableOperation>(
  queue: CandidateQueue<TOperation>,
  candidateId: string
): CandidateQueue<TOperation> {
  const candidate = queue.pending.find((item) => item.id === candidateId);

  if (!candidate) {
    return queue;
  }

  return {
    pending: queue.pending.filter((item) => item.id !== candidateId),
    accepted: [...queue.accepted, candidate],
    ignored: queue.ignored
  };
}

export function ignoreCandidate<TOperation extends PlayableOperation>(
  queue: CandidateQueue<TOperation>,
  candidateId: string
): CandidateQueue<TOperation> {
  const candidate = queue.pending.find((item) => item.id === candidateId);

  if (!candidate) {
    return queue;
  }

  return {
    pending: queue.pending.filter((item) => item.id !== candidateId),
    accepted: queue.accepted,
    ignored: [...queue.ignored, { ...candidate, status: "rejected" }]
  };
}

export function applyCandidateOperations<TState, TOperation extends PlayableOperation>(
  state: TState,
  candidate: PlayableCandidate<TOperation>,
  applyOperation: (state: TState, operation: TOperation) => TState
): TState {
  return candidate.operations.reduce((nextState, operation) => applyOperation(nextState, operation), state);
}

export function assertAllowedOperations(task: PlayableTask, candidate: PlayableCandidate): string[] {
  if (!task.allowedOperations?.length) {
    return [];
  }

  const allowed = new Set(task.allowedOperations);

  return candidate.operations
    .filter((operation) => !allowed.has(operation.type))
    .map((operation) => operation.type);
}

function createId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

