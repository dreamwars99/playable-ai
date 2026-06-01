import {
  createCandidate,
  type JsonObject,
  type JsonValue,
  type PlayableApplyPolicy,
  type PlayableCandidate,
  type PlayableCandidateStatus,
  type PlayableOperation,
  type PlayableProvider,
  type PlayableTask
} from "playable-ai";

export type OpenAICompatibleRole = "system" | "user" | "assistant";

export type OpenAICompatibleMessage = {
  role: OpenAICompatibleRole;
  content: string;
};

export type OpenAICompatibleFetchResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
};

export type OpenAICompatibleFetch = (
  endpoint: string,
  init: {
    method: "POST";
    headers: Record<string, string>;
    body: string;
  }
) => Promise<OpenAICompatibleFetchResponse>;

export type OpenAICompatibleProviderOptions<
  TSnapshot extends JsonObject = JsonObject,
  TOperation extends PlayableOperation = PlayableOperation
> = {
  id: string;
  endpoint: string;
  model: string;
  apiKey?: string;
  temperature?: number;
  headers?: Record<string, string>;
  systemPrompt?: string;
  buildUserMessage?: (task: PlayableTask<TSnapshot>) => string;
  parseResponse?: (content: string, task: PlayableTask<TSnapshot>) => PlayableCandidate<TOperation>[];
  fetch?: OpenAICompatibleFetch;
};

type OpenAICompatibleChatResponse = {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
};

type CandidateJson = {
  id?: unknown;
  title?: unknown;
  summary?: unknown;
  status?: unknown;
  confidence?: unknown;
  applyPolicy?: unknown;
  operations?: unknown;
  evidence?: unknown;
  metadata?: unknown;
};

const defaultSystemPrompt = [
  "You are a provider adapter for Playable AI.",
  "Return JSON only.",
  "Return reviewable candidates, not direct app mutations.",
  "Use only operation types listed in the task allowedOperations field."
].join(" ");

export function createOpenAICompatibleProvider<
  TSnapshot extends JsonObject,
  TOperation extends PlayableOperation
>(
  options: OpenAICompatibleProviderOptions<TSnapshot, TOperation>
): PlayableProvider<TSnapshot, TOperation> {
  return {
    id: options.id,
    async run(request) {
      const fetchImplementation = options.fetch ?? getGlobalFetch();
      const response = await fetchImplementation(options.endpoint, {
        method: "POST",
        headers: buildHeaders(options.apiKey, options.headers),
        body: JSON.stringify({
          model: options.model,
          temperature: options.temperature ?? 0.2,
          messages: buildMessages(request.task, options),
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        throw new Error(`Provider request failed with status ${response.status}: ${await response.text()}`);
      }

      const content = extractAssistantContent(await response.json());
      const candidates = options.parseResponse
        ? options.parseResponse(content, request.task)
        : parseCandidateJson<TOperation>(content, request.task);

      return { candidates };
    }
  };
}

export function buildPlayableTaskPrompt<TSnapshot extends JsonObject>(task: PlayableTask<TSnapshot>): string {
  return JSON.stringify(
    {
      task,
      outputShape: {
        candidates: [
          {
            title: "Short candidate title",
            summary: "Why this candidate helps",
            confidence: 0.8,
            applyPolicy: "review_required",
            operations: [
              {
                type: "operation.type",
                targetId: "optional-target-id",
                payload: {}
              }
            ],
            evidence: [
              {
                sourceId: "optional-source-id",
                label: "Optional label",
                reason: "Why this source matters"
              }
            ]
          }
        ]
      }
    },
    null,
    2
  );
}

export function parseCandidateJson<TOperation extends PlayableOperation>(
  content: string,
  task: Pick<PlayableTask, "id">
): PlayableCandidate<TOperation>[] {
  const parsed = JSON.parse(content) as unknown;
  const rawCandidates = Array.isArray(parsed)
    ? parsed
    : isObject(parsed) && Array.isArray(parsed.candidates)
      ? parsed.candidates
      : undefined;

  if (!rawCandidates) {
    throw new Error("Provider response must be a JSON array or an object with a candidates array.");
  }

  return rawCandidates.map((rawCandidate, index) => normalizeCandidate<TOperation>(rawCandidate, task.id, index));
}

function buildMessages<TSnapshot extends JsonObject>(
  task: PlayableTask<TSnapshot>,
  options: OpenAICompatibleProviderOptions<TSnapshot>
): OpenAICompatibleMessage[] {
  return [
    {
      role: "system",
      content: options.systemPrompt ?? defaultSystemPrompt
    },
    {
      role: "user",
      content: options.buildUserMessage?.(task) ?? buildPlayableTaskPrompt(task)
    }
  ];
}

function buildHeaders(apiKey: string | undefined, headers: Record<string, string> | undefined): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    ...headers
  };
}

function extractAssistantContent(response: unknown): string {
  if (!isObject(response)) {
    throw new Error("Provider response must be a JSON object.");
  }

  const chatResponse = response as OpenAICompatibleChatResponse;
  const content = chatResponse.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    throw new Error("Provider response did not include assistant message content.");
  }

  return content;
}

function normalizeCandidate<TOperation extends PlayableOperation>(
  rawCandidate: unknown,
  taskId: string,
  index: number
): PlayableCandidate<TOperation> {
  if (!isObject(rawCandidate)) {
    throw new Error(`Candidate at index ${index} must be a JSON object.`);
  }

  const candidateJson = rawCandidate as CandidateJson;
  const operations = normalizeOperations<TOperation>(candidateJson.operations, index);

  return createCandidate<TOperation>({
    id: optionalString(candidateJson.id),
    taskId,
    status: normalizeStatus(candidateJson.status),
    title: optionalString(candidateJson.title),
    summary: optionalString(candidateJson.summary),
    confidence: optionalNumber(candidateJson.confidence),
    applyPolicy: normalizeApplyPolicy(candidateJson.applyPolicy),
    operations,
    evidence: normalizeEvidence(candidateJson.evidence),
    metadata: optionalJsonObject(candidateJson.metadata)
  });
}

function normalizeOperations<TOperation extends PlayableOperation>(operations: unknown, index: number): TOperation[] {
  if (!Array.isArray(operations)) {
    throw new Error(`Candidate at index ${index} must include an operations array.`);
  }

  return operations.map((operation, operationIndex) => {
    if (!isObject(operation) || typeof operation.type !== "string" || !isObject(operation.payload)) {
      throw new Error(`Operation ${operationIndex} in candidate ${index} must include type and JSON object payload.`);
    }

    return {
      type: operation.type,
      targetId: optionalString(operation.targetId),
      payload: operation.payload
    } as TOperation;
  });
}

function normalizeEvidence(evidence: unknown): PlayableCandidate["evidence"] {
  if (evidence === undefined) {
    return undefined;
  }

  if (!Array.isArray(evidence)) {
    return undefined;
  }

  return evidence.flatMap((item) => {
    if (!isObject(item) || typeof item.sourceId !== "string" || typeof item.reason !== "string") {
      return [];
    }

    return [
      {
        sourceId: item.sourceId,
        label: optionalString(item.label),
        reason: item.reason
      }
    ];
  });
}

function normalizeStatus(status: unknown): PlayableCandidateStatus {
  const allowed = new Set<PlayableCandidateStatus>(["suggested", "inferred", "extracted", "rejected", "stale"]);

  return typeof status === "string" && allowed.has(status as PlayableCandidateStatus)
    ? (status as PlayableCandidateStatus)
    : "suggested";
}

function normalizeApplyPolicy(policy: unknown): PlayableApplyPolicy {
  const allowed = new Set<PlayableApplyPolicy>(["review_required", "auto_if_safe", "manual_only"]);

  return typeof policy === "string" && allowed.has(policy as PlayableApplyPolicy)
    ? (policy as PlayableApplyPolicy)
    : "review_required";
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function optionalJsonObject(value: unknown): JsonObject | undefined {
  return isObject(value) ? value : undefined;
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value) && isJsonObject(value);
}

function isJsonObject(value: object): value is JsonObject {
  return Object.values(value).every(isJsonValue);
}

function isJsonValue(value: unknown): value is JsonValue {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }

  return typeof value === "object" && value !== null && !Array.isArray(value) && isJsonObject(value);
}

function getGlobalFetch(): OpenAICompatibleFetch {
  if (typeof globalThis.fetch !== "function") {
    throw new Error("No fetch implementation is available. Pass options.fetch to createOpenAICompatibleProvider.");
  }

  return async (endpoint, init) => {
    const response = await globalThis.fetch(endpoint, init);

    return {
      ok: response.ok,
      status: response.status,
      json: () => response.json() as Promise<unknown>,
      text: () => response.text()
    };
  };
}
