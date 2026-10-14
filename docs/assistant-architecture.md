# AgriLens assistant architecture and search

**Reviewed:** 14 October 2026. This document records the shipped branch design, current safeguards, and the next steps for turning the prototype into a durable planning service.

## Why the provider default changed

NVIDIA’s Kimi K3 model page says its API is deprecated on 14 October 2026 and will no longer be supported after 15 October 2026. Keeping it as AgriLens’s default would create an immediate service-interruption risk. The server now defaults to NVIDIA’s `z-ai/glm-5.3` and keeps the model, reasoning effort, and OpenAI-compatible endpoint configurable.[1]

NVIDIA’s GLM-5.3 model card lists reasoning and OpenAI-compatible tool calls; it also recommends `clear_thinking=true` for chat scenarios. NVIDIA’s NIM reference documents chat completions, streaming, and tool calls.[2][3] The final answer preserves the supplied `max_tokens=16384`, `temperature=1`, `seed=0`, and `reasoning_effort=max` settings; the separate tool-planning output ceiling is bounded at 2,048 tokens. The app never assumes that the deployment’s key has access to this model: **confirm GLM-5.3 access with the runtime credential in the deployment environment.** The live NVIDIA call cannot be verified until that secret is configured.

## Shipped system

```mermaid
flowchart LR
  P[District planner] --> UI[AgriLens assistant UI]
  UI -->|GET /api/search| S[Weighted bilingual catalog search]
  UI -->|POST /api/chat| H[Express agent harness]
  H <--> N[NVIDIA OpenAI-compatible endpoint]
  H --> T[Read-only NISR tool registry]
  T --> D[(Checked-in NISR snapshot)]
  D -->|Exact values, periods, methods, source IDs| H
  H -->|Final sourced response only| UI
```

- **Search:** `GET /api/search?q=...&limit=...` and the assistant’s bilingual search panel share one local catalog. Weighted lexical ranking covers indicator definitions, 2025/2026 observations, district land, derived province yields, and all 35 workbook tables. English/Kinyarwanda crop and indicator aliases and official province/district names are supported. Core workbook measures are indexed as crop-specific value records (crop × metric × period, plus district/province where reported), so a wide table row cannot be mistaken for another crop’s value. Explicit geography and metric intent receive ranking boosts, and result sets limit repeated rows from any one workbook table. Results include period, location, units and source link.
- **Read-only tool registry:** the model can call only `search_agri_data`, `get_agri_data_catalog`, `query_nisr_snapshot`, and `analyze_nisr_data`. The catalog reports coverage and limitations; snapshot queries retrieve exact records; analysis functions compute the supported comparisons and rankings deterministically. There is no free-form SQL, shell, filesystem, write, or external-action tool.
- **Analysis available now:** 2025A-to-2026A national crop production comparisons, district crop-production rankings from Table 15, province/city crop-yield rankings from the verified area-weighted derivation, district land comparisons, and national-indicator comparisons where both periods exist.
- **Grounding:** the agent must call data tools before making statistical or coverage claims; tool outputs carry exact source IDs, units, periods, calculation notes and caveats. The system prompt tells it to treat returned data as evidence—not instructions—cite only returned source IDs, distinguish production/area/yield, state missing data and avoid causal or policy claims. The UI turns recognized citations into source links.
- **Bounded harness:** validates 1–12 recent messages and message-size limits; enforces JSON-Schema types, enums, key allowlists and numeric bounds again on the server; caps a request at 3 tool rounds, 6 tool calls, and 90 seconds; applies a 12-request-per-IP-per-minute in-memory chat limit; and streams only the final answer to the browser. Operational tool traces record tool name, availability, duration, and citation count without logging prompts, arguments, or data values.
- **Bilingual interaction:** the search affordance, assistant status, error/empty states, and handoff from a result to a question have English and Kinyarwanda text. The model is also instructed to answer in the user’s language.

## Search choice and growth path

Modern hybrid search can combine lexical and vector retrieval, merge ranked candidates with Reciprocal Rank Fusion, and apply structured filters.[6] AgriLens currently has a small, checked-in, mostly structured statistical snapshot. Here, exact crop/indicator aliases, geography, period, units, and numeric rows are more reliable for statistical answers than semantic similarity. The current weighted lexical search is intentionally simple, fast, reproducible, and auditable; it does **not** claim vector or semantic retrieval.

If the content base expands to include many narrative reports, advisories, regulations, or locally authored plans, introduce a hybrid candidate retriever with metadata filters, lexical+vector fusion, reranking, and source-page/paragraph citations. Continue routing numeric claims through exact structured-data tools rather than relying on retrieved prose.

## Evaluation and operating the prototype

Modern agent reliability requires testing the harness and completed outcomes, not only asking whether a generated answer sounds fluent. Anthropic emphasizes repeatable tasks, trials, graders, and execution traces; OpenAI stresses clear boundaries and mechanically enforced invariants.[4][5]

Run:

```bash
pnpm run test:agri-assistant
```

This builds the real Express bundle and runs 10 deterministic cases covering Kinyarwanda crop and province retrieval, crop-correct district evidence, source links, Table 15 district ranking, Table 6 arithmetic, area-weighted province yields, exact indicator filters, unsupported periods, invalid arguments and disallowed tools. It then starts the built server against a mocked NVIDIA-compatible provider and checks the bounded tool loop plus final SSE stream. These tests make **no live NVIDIA API call**. Keep a separate deployment smoke test for the configured model/key and include planner-authored English/Kinyarwanda tasks with human review before policy or budget use.

## Deployment and production hardening

- Put `NVIDIA_API_KEY` in the API server’s secret manager only. Keep `NVIDIA_MODEL`, `NVIDIA_REASONING_EFFORT`, and optionally `NVIDIA_BASE_URL` in server configuration; never embed a provider key in the frontend or Git. If an actual provider key has been shared in a chat transcript, rotate it and configure a replacement secret.
- The in-memory rate limit is process-local. Before a multi-instance or public production launch, replace it with a shared limiter and add user/role authentication, service-health monitoring, latency/error dashboards, and a tested recovery/runbook.
- Gather evaluator failures and planner feedback without storing sensitive chat content by default. Add human-reviewed Kinyarwanda grounding and citation-quality cases; distinguish tool correctness from response helpfulness.
- Keep refresh/import and integrity validation as the auditable data-ingest boundary. Do not silently treat missing values as zero or derived provincial statistics as official NISR releases.

## References

[1]: https://build.nvidia.com/moonshotai/kimi-k3/modelcard "NVIDIA Kimi K3 model card and API lifecycle notice"
[2]: https://build.nvidia.com/z-ai/glm-5-3/modelcard "NVIDIA GLM-5.3 model card"
[3]: https://docs.nvidia.com/nim/large-language-models/latest/reference/api-reference.html "NVIDIA NIM LLM API reference"
[4]: https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents "Anthropic: Demystifying evals for AI agents"
[5]: https://openai.com/index/harness-engineering/ "OpenAI: Harness engineering"
[6]: https://learn.microsoft.com/en-us/azure/search/hybrid-search-overview "Microsoft Learn: Hybrid search overview"
