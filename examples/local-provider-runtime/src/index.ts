import { createOpenAICompatibleProvider, type OpenAICompatibleFetch } from "@playable-ai/server";
import {
  validateCandidateForTask,
  type JsonObject,
  type JsonValue,
  type PlayableCandidate,
  type PlayableCandidateValidationIssue,
  type PlayableOperation,
  type PlayableTask
} from "playable-ai";

export type LocalProviderRuntimeConfig = {
  endpoint: string;
  model: string;
  apiKey?: string;
  fetch?: OpenAICompatibleFetch;
};

export type LocalProviderRouteRequest<TSnapshot extends JsonObject = JsonObject> = {
  task: PlayableTask<TSnapshot>;
};

export type RejectedCandidate = {
  candidateId: string;
  issues: PlayableCandidateValidationIssue[];
};

export type LocalProviderRouteResponse<TOperation extends PlayableOperation = PlayableOperation> = {
  candidates: PlayableCandidate<TOperation>[];
  rejected: RejectedCandidate[];
};

export function createConfigFromEnv(env: Record<string, string | undefined>): LocalProviderRuntimeConfig {
  const endpoint = env.PLAYABLE_AI_LOCAL_ENDPOINT;
  const model = env.PLAYABLE_AI_LOCAL_MODEL;

  if (!endpoint || !model) {
    throw new Error("Set PLAYABLE_AI_LOCAL_ENDPOINT and PLAYABLE_AI_LOCAL_MODEL in the local runtime.");
  }

  return {
    endpoint,
    model,
    apiKey: env.PLAYABLE_AI_LOCAL_API_KEY
  };
}

export function createLocalProviderRuntime(config: LocalProviderRuntimeConfig) {
  const provider = createOpenAICompatibleProvider({
    id: "local-openai-compatible",
    endpoint: config.endpoint,
    model: config.model,
    apiKey: config.apiKey,
    fetch: config.fetch
  });

  return {
    async runTask<TOperation extends PlayableOperation = PlayableOperation>(
      request: LocalProviderRouteRequest
    ): Promise<LocalProviderRouteResponse<TOperation>> {
      const result = await provider.run({ task: request.task });
      const candidates: PlayableCandidate<TOperation>[] = [];
      const rejected: RejectedCandidate[] = [];

      for (const candidate of result.candidates as PlayableCandidate<TOperation>[]) {
        const validation = validateCandidateForTask(request.task, candidate);

        if (validation.valid) {
          candidates.push(candidate);
        } else {
          rejected.push({
            candidateId: candidate.id,
            issues: validation.issues
          });
        }
      }

      return { candidates, rejected };
    },

    async handleRequest(request: Request): Promise<Response> {
      if (request.method !== "POST") {
        return jsonResponse({ error: "Use POST with a Playable AI task payload." }, 405);
      }

      const body = await request.json();

      if (!isObject(body) || !isObject(body.task)) {
        return jsonResponse({ error: "Request body must include a task object." }, 400);
      }

      const result = await this.runTask({ task: body.task as PlayableTask });

      return jsonResponse(result, 200);
    }
  };
}

function jsonResponse(body: JsonValue, status: number): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
