import assert from "node:assert/strict";
import test from "node:test";

import { type OpenAICompatibleFetch } from "@playable-ai/server";
import { createTask, type PlayableTask } from "playable-ai";
import { createConfigFromEnv, createLocalProviderRuntime } from "../src/index.js";

test("creates runtime config from environment-like values", () => {
  const config = createConfigFromEnv({
    PLAYABLE_AI_LOCAL_ENDPOINT: "http://127.0.0.1:1234/v1/chat/completions",
    PLAYABLE_AI_LOCAL_MODEL: "local-model",
    PLAYABLE_AI_LOCAL_API_KEY: "optional-local-token"
  });

  assert.equal(config.endpoint, "http://127.0.0.1:1234/v1/chat/completions");
  assert.equal(config.model, "local-model");
  assert.equal(config.apiKey, "optional-local-token");
});

test("requires endpoint and model configuration", () => {
  assert.throws(
    () => createConfigFromEnv({ PLAYABLE_AI_LOCAL_ENDPOINT: "http://127.0.0.1:1234/v1/chat/completions" }),
    /PLAYABLE_AI_LOCAL_ENDPOINT and PLAYABLE_AI_LOCAL_MODEL/
  );
});

test("runs a local provider task and splits valid and rejected candidates", async () => {
  let authorizationHeader: string | undefined;
  let requestBody: unknown;

  const fetch: OpenAICompatibleFetch = async (_endpoint, init) => {
    authorizationHeader = init.headers.Authorization;
    requestBody = JSON.parse(init.body) as unknown;

    return {
      ok: true,
      status: 200,
      async json() {
        return {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  candidates: [
                    {
                      id: "move-card",
                      title: "Move ready card",
                      operations: [{ type: "card.move", targetId: "card-1", payload: { column: "doing" } }]
                    },
                    {
                      id: "delete-card",
                      title: "Delete stale card",
                      operations: [{ type: "card.delete", targetId: "card-2", payload: {} }]
                    }
                  ]
                })
              }
            }
          ]
        };
      },
      async text() {
        return "";
      }
    };
  };

  const runtime = createLocalProviderRuntime({
    endpoint: "http://127.0.0.1:1234/v1/chat/completions",
    model: "local-model",
    apiKey: "optional-local-token",
    fetch
  });

  const task = createBoardTask();
  const result = await runtime.runTask({ task });

  assert.equal(authorizationHeader, "Bearer optional-local-token");
  assert.match(JSON.stringify(requestBody), /board\.review/);
  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0]?.id, "move-card");
  assert.equal(result.rejected.length, 1);
  assert.equal(result.rejected[0]?.candidateId, "delete-card");
  assert.equal(result.rejected[0]?.issues[0]?.code, "operation_not_allowed");
});

test("handles route requests without exposing provider execution to browser code", async () => {
  const fetch: OpenAICompatibleFetch = async () => ({
    ok: true,
    status: 200,
    async json() {
      return {
        choices: [
          {
            message: {
              content: JSON.stringify({
                candidates: [
                  {
                    id: "create-card",
                    title: "Create next task",
                    operations: [{ type: "card.create", payload: { title: "Review candidates" } }]
                  }
                ]
              })
            }
          }
        ]
      };
    },
    async text() {
      return "";
    }
  });

  const runtime = createLocalProviderRuntime({
    endpoint: "http://127.0.0.1:1234/v1/chat/completions",
    model: "local-model",
    fetch
  });

  const response = await runtime.handleRequest(
    new Request("http://local.test/api/playable/run-task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task: createBoardTask() })
    })
  );

  const body = (await response.json()) as { candidates: Array<{ id: string }>; rejected: unknown[] };

  assert.equal(response.status, 200);
  assert.equal(body.candidates[0]?.id, "create-card");
  assert.deepEqual(body.rejected, []);
});

test("rejects non-POST route requests", async () => {
  const runtime = createLocalProviderRuntime({
    endpoint: "http://127.0.0.1:1234/v1/chat/completions",
    model: "local-model",
    fetch: async () => {
      throw new Error("Provider should not be called for non-POST requests.");
    }
  });

  const response = await runtime.handleRequest(new Request("http://local.test/api/playable/run-task"));

  assert.equal(response.status, 405);
});

function createBoardTask(): PlayableTask {
  return createTask({
    id: "board.review",
    scope: { app: "local-provider-runtime-example", surface: "board" },
    snapshot: {
      cards: [
        { id: "card-1", title: "Draft provider guide", column: "todo" },
        { id: "card-2", title: "Keep app state safe", column: "done" }
      ]
    },
    allowedOperations: ["card.move", "card.create"],
    constraints: ["Return candidates only.", "Do not delete cards."]
  });
}
