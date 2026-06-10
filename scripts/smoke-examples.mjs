import { spawnSync } from "node:child_process";
import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const validationText = "Validation passed before apply.";

const examples = [
  {
    name: "tactics-grid",
    packageName: "@playable-ai/example-tactics-grid",
    distDir: "examples/tactics-grid/dist",
    heading: "Tactics Grid Balancer",
    renderTexts: ["Tactics grid"],
    action: "Analyze level",
    taskId: "tactics.balance-level"
  },
  {
    name: "kanban-quest",
    packageName: "@playable-ai/example-kanban-quest",
    distDir: "examples/kanban-quest/dist",
    heading: "Kanban Quest Board",
    renderTexts: ["Todo", "Doing", "Done"],
    action: "Find next actions",
    taskId: "kanban.quest-review"
  },
  {
    name: "timeline-review",
    packageName: "@playable-ai/example-timeline-review",
    distDir: "examples/timeline-review/dist",
    heading: "Timeline Review",
    renderTexts: ["Event timeline"],
    action: "Review timeline",
    taskId: "timeline.review-continuity"
  }
];

const browser = await chromium.launch();

try {
  for (const example of examples) {
    await smokeExample(example);
  }

  console.log(`Smoke checked ${examples.length} examples.`);
} finally {
  await browser.close();
}

async function smokeExample(example) {
  console.log(`\n[smoke] ${example.name}`);
  runBuild(example);

  const distRoot = path.join(repoRoot, example.distDir);
  const server = await startStaticServer(distRoot);
  const page = await browser.newPage();

  try {
    await page.goto(server.url, { waitUntil: "networkidle" });

    await expectVisible(page.getByRole("heading", { name: example.heading }), `${example.name} heading`);

    for (const text of example.renderTexts) {
      await expectVisible(page.getByText(text).first(), `${example.name} render text: ${text}`);
    }

    await expectVisible(page.getByText(example.taskId).first(), `${example.name} task id`);

    await page.getByRole("button", { name: example.action }).click();
    await expectVisible(page.getByText(validationText).first(), `${example.name} validation text`);

    const validationLocator = page.getByText(validationText);
    const candidateCountBeforeApply = await validationLocator.count();

    if (candidateCountBeforeApply < 1) {
      throw new Error(`${example.name} did not generate reviewable candidates.`);
    }

    await page.getByRole("button", { name: "Apply" }).first().click();
    await page.waitForFunction(
      ({ text, before }) => document.body.innerText.split(text).length - 1 < before,
      { text: validationText, before: candidateCountBeforeApply },
      { timeout: 5000 }
    );

    await expectVisible(page.getByRole("heading", { name: example.heading }), `${example.name} heading after apply`);
    console.log(`[smoke] ${example.name} passed`);
  } finally {
    await page.close();
    await server.close();
  }
}

function runBuild(example) {
  const result = spawnSync("corepack", ["pnpm", "--filter", example.packageName, "build"], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe"
  });

  if (result.status !== 0) {
    throw new Error(
      [
        `${example.name} build failed.`,
        result.stdout.trim(),
        result.stderr.trim()
      ]
        .filter(Boolean)
        .join("\n")
    );
  }
}

async function expectVisible(locator, label) {
  try {
    await locator.waitFor({ state: "visible", timeout: 5000 });
  } catch (error) {
    throw new Error(`${label} was not visible: ${getErrorMessage(error)}`);
  }
}

async function startStaticServer(distRoot) {
  if (!existsSync(path.join(distRoot, "index.html"))) {
    throw new Error(`Missing built example output: ${distRoot}`);
  }

  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
      const filePath = await resolveStaticPath(distRoot, requestUrl.pathname);
      response.writeHead(200, { "Content-Type": getContentType(filePath) });
      createReadStream(filePath).pipe(response);
    } catch {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Static server did not expose a TCP address.");
  }

  return {
    url: `http://127.0.0.1:${address.port}/`,
    close: () => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  };
}

async function resolveStaticPath(distRoot, pathname) {
  const safePath = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const requestedPath = path.join(distRoot, safePath === "/" ? "index.html" : safePath);
  const resolvedPath = path.resolve(requestedPath);
  const resolvedRoot = path.resolve(distRoot);

  if (!resolvedPath.startsWith(resolvedRoot)) {
    throw new Error("Refusing to serve a path outside the dist root.");
  }

  const fileStats = await stat(resolvedPath);

  if (!fileStats.isFile()) {
    throw new Error("Static path is not a file.");
  }

  return resolvedPath;
}

function getContentType(filePath) {
  const extension = path.extname(filePath);

  if (extension === ".html") {
    return "text/html; charset=utf-8";
  }

  if (extension === ".js") {
    return "text/javascript; charset=utf-8";
  }

  if (extension === ".css") {
    return "text/css; charset=utf-8";
  }

  if (extension === ".svg") {
    return "image/svg+xml";
  }

  return "application/octet-stream";
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
