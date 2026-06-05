import test from "node:test";
import assert from "node:assert/strict";

import { createOpenAICompatibleProvider, parseCandidateJson, type OpenAICompatibleFetch } from "../src/index.js";

test("parses provider candidates from JSON content", () => {
  const candidates = parseCandidateJson(
    JSON.stringify({
      candidates: [
        {
          title: "Move card",
          summary: "The card is ready for active work.",
          confidence: 0.82,
          operations: [
            {
              type: "card.move",
              targetId: "card-1",
              payload: { column: "doing" }
            }
          ]
        }
      ]
    }),
    { id: "board.review" }
  );

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0]?.taskId, "board.review");
  assert.equal(candidates[0]?.status, "suggested");
  assert.equal(candidates[0]?.applyPolicy, "review_required");
  assert.equal(candidates[0]?.operations[0]?.type, "card.move");
});

test("parses provider candidates from a raw JSON array", () => {
  const candidates = parseCandidateJson(
    JSON.stringify([
      {
        title: "Create card",
        operations: [
          {
            type: "card.create",
            payload: { title: "Review release checklist" }
          }
        ]
      }
    ]),
    { id: "board.review" }
  );

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0]?.taskId, "board.review");
  assert.equal(candidates[0]?.operations[0]?.type, "card.create");
});

test("rejects malformed provider JSON", () => {
  assert.throws(
    () => parseCandidateJson("{ not json", { id: "board.review" }),
    /Provider response must be valid JSON/
  );
});

test("rejects provider JSON without a candidates array", () => {
  assert.throws(
    () => parseCandidateJson(JSON.stringify({ result: [] }), { id: "board.review" }),
    /Provider response must be a JSON array or an object with a candidates array/
  );
});

test("rejects candidates without operations arrays", () => {
  assert.throws(
    () =>
      parseCandidateJson(
        JSON.stringify({
          candidates: [
            {
              title: "Move card"
            }
          ]
        }),
        { id: "board.review" }
      ),
    /Candidate at index 0 must include an operations array/
  );
});

test("rejects operations without JSON object payloads", () => {
  assert.throws(
    () =>
      parseCandidateJson(
        JSON.stringify({
          candidates: [
            {
              operations: [
                {
                  type: "card.move",
                  targetId: "card-1",
                  payload: "doing"
                }
              ]
            }
          ]
        }),
        { id: "board.review" }
      ),
    /Operation 0 in candidate 0 must include type and JSON object payload/
  );
});

test("normalizes invalid candidate fields to safe defaults", () => {
  const candidates = parseCandidateJson(
    JSON.stringify({
      candidates: [
        {
          status: "unknown",
          applyPolicy: "write_directly",
          confidence: Number.NaN,
          evidence: [
            { sourceId: "card-1", reason: "Mentions blocked work." },
            { sourceId: 42, reason: "Invalid source id." },
            { sourceId: "card-2" }
          ],
          metadata: { provider: "test" },
          operations: [
            {
              type: "card.move",
              targetId: 123,
              payload: { column: "doing" }
            }
          ]
        }
      ]
    }),
    { id: "board.review" }
  );

  assert.equal(candidates[0]?.status, "suggested");
  assert.equal(candidates[0]?.applyPolicy, "review_required");
  assert.equal(candidates[0]?.confidence, undefined);
  assert.deepEqual(candidates[0]?.evidence, [{ sourceId: "card-1", reason: "Mentions blocked work." }]);
  assert.deepEqual(candidates[0]?.metadata, { provider: "test" });
  assert.equal(candidates[0]?.operations[0]?.targetId, undefined);
});

test("runs an OpenAI-compatible provider with injectable fetch", async () => {
  let requestBody: unknown;
  let authorizationHeader: string | undefined;

  const fetch: OpenAICompatibleFetch = async (_endpoint, init) => {
    requestBody = JSON.parse(init.body) as unknown;
    authorizationHeader = init.headers.Authorization;

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
                      title: "Create card",
                      operations: [
                        {
                          type: "card.create",
                          payload: { title: "Add release notes", column: "todo" }
                        }
                      ]
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

  const provider = createOpenAICompatibleProvider({
    id: "test-provider",
    endpoint: "https://example.test/v1/chat/completions",
    apiKey: "test-key",
    model: "test-model",
    fetch
  });

  const result = await provider.run({
    task: {
      id: "board.review",
      scope: { app: "test", surface: "board" },
      snapshot: { cards: [] },
      allowedOperations: ["card.create"],
      createdAt: "2026-06-01T00:00:00.000Z"
    }
  });

  assert.equal(authorizationHeader, "Bearer test-key");
  assert.equal(result.candidates[0]?.operations[0]?.type, "card.create");
  assert.match(JSON.stringify(requestBody), /board\.review/);
});
