import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:http";
import { createServer as createNetServer } from "node:net";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import {
  executeAgriTool,
  searchAgriData,
} from "../artifacts/api-server/src/routes/chat-tools.ts";

const repoRoot = resolve(import.meta.dirname, "..");
const dataDirectory = resolve(repoRoot, "artifacts/agri-lens-ai/src/data");
const national = JSON.parse(
  readFileSync(resolve(dataDirectory, "national-indicators.json"), "utf8"),
);
const workbook = JSON.parse(
  readFileSync(
    resolve(dataDirectory, "nisr-sas-2026-season-a-tables.json"),
    "utf8",
  ),
);
const ahsWorkbook = JSON.parse(
  readFileSync(resolve(dataDirectory, "ahs-2024-tables.json"), "utf8"),
);
const provinceYield = JSON.parse(
  readFileSync(resolve(dataDirectory, "province-yields-2026a.json"), "utf8"),
);

function almostEqual(actual, expected, epsilon = 1e-8) {
  assert.ok(
    Math.abs(actual - expected) <= epsilon,
    `Expected ${actual} to be within ${epsilon} of ${expected}`,
  );
}

function reservePort() {
  return new Promise((resolvePort, reject) => {
    const server = createNetServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Could not reserve an ephemeral test port."));
        return;
      }
      const { port } = address;
      server.close((error) => (error ? reject(error) : resolvePort(port)));
    });
  });
}

async function closeServer(server) {
  if (!server.listening) return;
  await new Promise((resolveClose, reject) => {
    server.close((error) => (error ? reject(error) : resolveClose()));
  });
}

test("Kinyarwanda crop aliases find the core NISR analytics tables and retain provenance", () => {
  for (const query of ["ibigori", "ibishyimbo", "umusaruro w'ibigori"]) {
    const result = searchAgriData(query, 10);
    assert.ok(result.count > 0, `Expected search hits for ${query}`);
    assert.ok(
      result.results.some((hit) =>
        /workbook-(?:row|value):(6|12|13|15):/.test(hit.id),
      ),
      `Expected core crop analytics among the hits for ${query}`,
    );
    assert.ok(result.results.every((hit) => hit.sourceId && hit.sourceUrl));
    if (query.includes("ibigori")) {
      assert.ok(
        result.results.some((hit) => /Table 13: Maize yield/.test(hit.title)),
      );
      assert.ok(
        result.results.some((hit) =>
          /Table 15: Maize production/.test(hit.title),
        ),
      );
      assert.ok(
        result.results.every((hit) => !/— (?:Banana|Cassava),/.test(hit.title)),
      );
    }
  }
});

test("crop-plus-district search does not surface another crop’s values", () => {
  const result = searchAgriData("Rwamagana maize", 10);
  assert.ok(
    result.results.some((hit) => /Table 13: Maize yield/.test(hit.title)),
  );
  assert.ok(
    result.results.some((hit) => /Table 15: Maize production/.test(hit.title)),
  );
  assert.ok(
    result.results.every(
      (hit) => !/Banana|Cassava|Beans|Potato/.test(hit.title),
    ),
  );
});

test("catalog search supports a Kinyarwanda province name and emits 2026A evidence", () => {
  const result = searchAgriData("Intara y'Iburasirazuba umusaruro", 10);
  assert.ok(
    result.results.some(
      (hit) =>
        hit.location === "Eastern Province" && hit.period === "2026 Season A",
    ),
  );
});

test("AHS 2024 catalog search and exact table retrieval retain source rows and citations", () => {
  assert.equal(ahsWorkbook.tables.length, 56);
  const search = searchAgriData("soil erosion", 10);
  assert.ok(
    search.results.some(
      (hit) => hit.id.startsWith("ahs-") && /Table 38/.test(hit.title),
    ),
  );
  assert.ok(
    search.results.some(
      (hit) =>
        hit.sourceId === "nisr-ahs-2024-workbook" &&
        hit.sourceUrl === "/data/AHS_2024Tables.xlsx",
    ),
  );

  const result = executeAgriTool("query_nisr_snapshot", {
    dataset: "ahs_table",
    table_number: 38,
    row_query: "soil erosion",
    limit: 10,
  });
  assert.equal(result.available, true);
  assert.equal(result.table_number, 38);
  assert.match(result.title, /soil degradation threats/i);
  assert.equal(result.sourceId, "nisr-ahs-2024-workbook");
  assert.match(
    result.citation,
    /Agricultural Household Survey 2024 report, August 2025/i,
  );
  assert.ok(
    result.rows.some((row) =>
      row.cells.some((value) => String(value ?? "").includes("Soil erosion")),
    ),
  );
  assert.equal(result.rows[0].excel_row, 4);

  const catalog = executeAgriTool("get_agri_data_catalog", {});
  assert.equal(
    catalog.datasets.find((item) => item.id === "ahs_table")?.tables,
    56,
  );
});

test("AHS 2024 Table 1 returns the workbook's own 2024 estimate unchanged", () => {
  const result = executeAgriTool("query_nisr_snapshot", {
    dataset: "ahs_table",
    table_number: 1,
    row_query: "Estimated number of agricultural households in millions",
  });
  assert.equal(result.available, true);
  const row = result.rows.find((candidate) =>
    candidate.cells.includes(
      "Estimated number of agricultural households in millions",
    ),
  );
  assert.ok(row);
  assert.equal(row.excel_row, 5);
  assert.deepEqual(row.cells.slice(-3), [2.1, 2.3, 2.164]);
});

test("district maize production ranking matches Table 15 and excludes summary rows", () => {
  const table = workbook.tables.find((item) => item.number === 15);
  assert.ok(table);
  const cropIndex = table.headers.indexOf("Maize");
  assert.ok(cropIndex > 0);
  const districtRows = table.rows.filter((row) =>
    [
      "Nyagatare",
      "Kirehe",
      "Gatsibo",
      "Bugesera",
      "Ngoma",
      "Rwamagana",
      "Kayonza",
      "Gicumbi",
      "Musanze",
      "Burera",
      "Gakenke",
      "Rulindo",
      "Nyaruguru",
      "Nyamagabe",
      "Huye",
      "Gisagara",
      "Nyanza",
      "Ruhango",
      "Muhanga",
      "Kamonyi",
      "Karongi",
      "Rutsiro",
      "Nyabihu",
      "Ngororero",
      "Rubavu",
      "Nyamasheke",
      "Rusizi",
      "Gasabo",
      "Kicukiro",
      "Nyarugenge",
    ].includes(String(row[0])),
  );
  const expected = districtRows
    .map((row) => ({ district: row[0], value: row[cropIndex] }))
    .filter((row) => typeof row.value === "number")
    .sort((a, b) => b.value - a.value);
  const result = executeAgriTool("analyze_nisr_data", {
    analysis: "rank_district_crop_production",
    crop: "ibigori",
    limit: 5,
  });
  assert.equal(result.available, true);
  assert.equal(result.period, "2026 Season A");
  assert.equal(result.unit, undefined);
  assert.equal(result.records.length, 5);
  for (let index = 0; index < 5; index += 1) {
    assert.equal(result.records[index].rank, index + 1);
    assert.equal(result.records[index].district, expected[index].district);
    almostEqual(result.records[index].value, expected[index].value);
  }
  assert.equal(result.sourceId, "nisr-sas-2026-season-a-workbook");
  assert.match(result.method, /summary rows.*excluded/i);
});

test("national crop production comparison uses published values and reproducible arithmetic", () => {
  const table = workbook.tables.find((item) => item.number === 6);
  const cropRow = table.rows.find((row) => row[0] === "Maize");
  const currentIndex = table.headers.findIndex((header) =>
    header.includes("Production (MT) · 2026 A"),
  );
  const previousIndex = table.headers.findIndex((header) =>
    header.includes("Production (MT) · 2025 A"),
  );
  const current = cropRow[currentIndex];
  const previous = cropRow[previousIndex];
  const result = executeAgriTool("analyze_nisr_data", {
    analysis: "compare_national_crop_production",
    crop: "corn",
  });
  assert.equal(result.available, true);
  assert.equal(result.previous.value, previous);
  assert.equal(result.current.value, current);
  almostEqual(result.absolute_change, current - previous);
  almostEqual(
    result.percent_change,
    ((current - previous) / Math.abs(previous)) * 100,
  );
  assert.equal(result.unit, "MT");
  assert.equal(result.sourceId, "nisr-sas-2026-season-a-workbook");
});

test("province crop-yield rankings match the area-weighted source records and disclose their method", () => {
  const result = executeAgriTool("analyze_nisr_data", {
    analysis: "rank_province_crop_yield",
    crop: "ibigori",
  });
  const expected = provinceYield.observations
    .filter((row) => row.crop === "Maize")
    .sort((a, b) => b.yield_kg_ha - a.yield_kg_ha);
  assert.equal(result.available, true);
  assert.equal(result.records.length, 5);
  assert.equal(result.unit, "kg/ha");
  assert.match(result.method, /area-weights/i);
  assert.match(result.caveat, /not figures separately published by NISR/i);
  for (let index = 0; index < expected.length; index += 1) {
    assert.equal(result.records[index].province, expected[index].province);
    almostEqual(result.records[index].yield_kg_ha, expected[index].yield_kg_ha);
  }
});

test("indicator retrieval is exact by metric, period and source", () => {
  const result = executeAgriTool("query_nisr_snapshot", {
    dataset: "national_indicators",
    metric: "improved_seed_use",
    year: 2026,
    season: "B",
  });
  const expected = national.observations.find(
    (row) =>
      row.metric === "improved_seed_use" &&
      row.year === 2026 &&
      row.season === "B",
  );
  assert.equal(result.available, true);
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].value, expected.value);
  assert.equal(result.records[0].unit, "% of farmers");
  assert.equal(result.records[0].sourceId, expected.source_id);
});

test("district comparison keeps source-period pairs, units and missing-period honesty", () => {
  const result = executeAgriTool("analyze_nisr_data", {
    analysis: "compare_district_land",
    district: "Rwamagana",
    metric: "agricultural_land_000ha",
    year_a: 2025,
    season_a: "A",
    year_b: 2026,
    season_b: "A",
  });
  assert.equal(result.available, true);
  assert.equal(result.previous.year, 2025);
  assert.equal(result.current.year, 2026);
  assert.equal(result.unit, "thousand hectares");
  assert.equal(result.source_ids.length, 2);

  const missing = executeAgriTool("analyze_nisr_data", {
    analysis: "compare_district_land",
    district: "Rwamagana",
    metric: "agricultural_land_000ha",
    year_a: 2025,
    season_a: "A",
    year_b: 2026,
    season_b: "B",
  });
  assert.equal(missing.available, false);
  assert.match(missing.reason, /does not contain both requested/i);
});

test("data access rejects ambiguous measures and unregistered tools instead of executing arbitrary commands", () => {
  const ambiguous = executeAgriTool("query_nisr_snapshot", {
    dataset: "district_land",
    metric: "land",
  });
  assert.equal(ambiguous.available, false);
  assert.ok(ambiguous.available_metrics.length > 0);

  const malformedFilter = executeAgriTool("query_nisr_snapshot", {
    dataset: "national_indicators",
    year: "2026",
  });
  assert.equal(malformedFilter.available, false);
  assert.match(malformedFilter.reason, /year.*integer/i);

  const undeclaredField = executeAgriTool("query_nisr_snapshot", {
    dataset: "national_indicators",
    query: "ignored extra field",
  });
  assert.equal(undeclaredField.available, false);
  assert.match(undeclaredField.reason, /not allowed/i);

  const unregistered = executeAgriTool("run_shell", {
    command: "echo unsafe",
  });
  assert.equal(unregistered.available, false);
  assert.match(unregistered.reason, /allowlist/i);
});

test("mocked NVIDIA integration performs bounded tool calls and streams only the sourced answer", async (t) => {
  const providerRequests = [];
  let plannerRequests = 0;
  let analystRequests = 0;
  const provider = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    providerRequests.push({
      payload,
      authorization: req.headers.authorization,
    });
    if (payload.model === "mock-glm-model" && !payload.stream) {
      plannerRequests += 1;
      res.writeHead(200, { "Content-Type": "application/json" });
      if (plannerRequests === 1) {
        res.end(
          JSON.stringify({
            choices: [
              {
                message: {
                  role: "assistant",
                  content: null,
                  tool_calls: [
                    {
                      id: "eval-call-1",
                      type: "function",
                      function: {
                        name: "analyze_nisr_data",
                        arguments: JSON.stringify({
                          analysis: "rank_district_crop_production",
                          crop: "Maize",
                          limit: 3,
                        }),
                      },
                    },
                  ],
                },
              },
            ],
          }),
        );
      } else {
        res.end(
          JSON.stringify({
            choices: [
              {
                message: { role: "assistant", content: "Evidence retrieved." },
              },
            ],
          }),
        );
      }
      return;
    }
    if (payload.model === "mock-muse-model" && !payload.stream) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          choices: [
            {
              message: {
                role: "assistant",
                content: "REVISE: State the period as 2026 Season A.",
              },
            },
          ],
        }),
      );
      return;
    }
    if (payload.model === "mock-nemotron-model" && payload.stream) {
      analystRequests += 1;
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      });
      const text =
        analystRequests === 1
          ? "Nyagatare leads the district ranking. "
          : "For 2026 Season A, Nyagatare leads the district production ranking. ";
      res.write(
        `data: ${JSON.stringify({ choices: [{ delta: { reasoning_content: "private model reasoning", content: text } }] })}\n\n`,
      );
      await delay(5);
      res.end(
        `data: ${JSON.stringify({ choices: [{ delta: { content: "[nisr-sas-2026-season-a-workbook]" } }] })}\n\n\ndata: [DONE]\n\n`,
      );
      return;
    }
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Unexpected mock model request" }));
  });
  provider.listen(0, "127.0.0.1");
  await once(provider, "listening");
  const providerAddress = provider.address();
  assert.ok(providerAddress && typeof providerAddress !== "string");

  const port = await reservePort();
  const child = spawn(
    process.execPath,
    [resolve(repoRoot, "artifacts/api-server/dist/index.mjs")],
    {
      cwd: repoRoot,
      env: {
        ...process.env,
        PORT: String(port),
        NVIDIA_API_KEY: "eval-only-not-a-real-key",
        NVIDIA_GLM_MODEL: "mock-glm-model",
        NVIDIA_NEMOTRON_MODEL: "mock-nemotron-model",
        NVIDIA_MUSE_MODEL: "mock-muse-model",
        NVIDIA_BASE_URL: `http://127.0.0.1:${providerAddress.port}/v1/chat/completions`,
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let childOutput = "";
  child.stdout.setEncoding("utf8").on("data", (chunk) => {
    childOutput += chunk;
  });
  child.stderr.setEncoding("utf8").on("data", (chunk) => {
    childOutput += chunk;
  });
  t.after(async () => {
    child.kill("SIGTERM");
    await Promise.race([once(child, "exit"), delay(3000)]);
    await closeServer(provider);
  });

  const baseUrl = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (child.exitCode !== null) break;
    try {
      const response = await fetch(`${baseUrl}/api/search?q=maize`);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      // The API process may still be starting.
    }
    await delay(150);
  }
  assert.ok(ready, `API did not become ready. Process output: ${childOutput}`);

  const searchResponse = await fetch(
    `${baseUrl}/api/search?q=ibigori&limit=10`,
  );
  assert.equal(searchResponse.status, 200);
  const searchPayload = await searchResponse.json();
  assert.ok(
    searchPayload.results.some((hit) =>
      /workbook-(?:row|value):(6|12|13|15):/.test(hit.id),
    ),
  );

  let chatResponse;
  let stream;
  try {
    chatResponse = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(15_000),
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: "Which district produced the most maize in 2026A?",
          },
        ],
      }),
    });
    stream = await chatResponse.text();
  } catch (error) {
    throw new Error(
      `Mocked assistant request failed: ${String(error)}\nCaptured API output: ${childOutput}`,
    );
  }
  assert.equal(chatResponse.status, 200);
  assert.match(stream, /"status":"searching"/);
  assert.match(stream, /"status":"calculating"/);
  assert.match(stream, /"status":"analyzing"/);
  assert.match(stream, /"status":"reviewing"/);
  assert.match(stream, /"status":"revising"/);
  assert.match(stream, /"status":"answering"/);
  assert.match(
    stream,
    /For 2026 Season A, Nyagatare leads the district production ranking/,
  );
  assert.doesNotMatch(stream, /Nyagatare leads the district ranking\./);
  assert.doesNotMatch(stream, /private model reasoning/);
  assert.match(stream, /\[nisr-sas-2026-season-a-workbook\]/);
  assert.doesNotMatch(stream, /eval-only-not-a-real-key/);
  assert.equal(providerRequests.length, 5);
  assert.equal(providerRequests[0].payload.model, "mock-glm-model");
  assert.equal(providerRequests[0].payload.tool_choice, "required");
  assert.equal(providerRequests[0].payload.clear_thinking, true);
  assert.equal(providerRequests[0].payload.reasoning_effort, "max");
  assert.equal(providerRequests[0].payload.temperature, 0.5);
  assert.equal(providerRequests[0].payload.top_p, 1);
  assert.equal(providerRequests[0].payload.max_tokens, 1024);
  assert.equal(
    providerRequests[0].authorization,
    "Bearer eval-only-not-a-real-key",
  );
  const analystRequest = providerRequests[2].payload;
  assert.equal(analystRequest.model, "mock-nemotron-model");
  assert.equal(analystRequest.stream, true);
  assert.equal(analystRequest.max_tokens, 16_384);
  assert.equal(analystRequest.temperature, 1);
  assert.equal(analystRequest.top_p, 0.95);
  assert.equal(analystRequest.chat_template_kwargs.enable_thinking, true);
  const reviewerRequest = providerRequests[3].payload;
  assert.equal(reviewerRequest.model, "mock-muse-model");
  assert.equal(reviewerRequest.stream, false);
  assert.equal(reviewerRequest.max_tokens, 8192);
  assert.equal(reviewerRequest.temperature, 1);
  assert.equal(reviewerRequest.top_p, 0.95);
  assert.match(reviewerRequest.messages.at(-1).content, /2026 Season A/);
  assert.match(reviewerRequest.messages.at(-1).content, /draft/);
  const revisionRequest = providerRequests[4].payload;
  assert.equal(revisionRequest.model, "mock-nemotron-model");
  assert.equal(revisionRequest.stream, true);
  assert.match(
    revisionRequest.messages.at(-1).content,
    /Evidence review feedback/,
  );
  const finalMessages = providerRequests[1].payload.messages;
  const toolResult = finalMessages.find((message) => message.role === "tool");
  assert.ok(toolResult);
  const parsedToolResult = JSON.parse(toolResult.content);
  assert.equal(parsedToolResult.records[0].district, "Nyagatare");
  assert.equal(parsedToolResult.sourceId, "nisr-sas-2026-season-a-workbook");
});
