import assert from "node:assert/strict";

const baseUrl = (process.env.SMOKE_BASE_URL ?? "http://localhost:80").replace(
  /\/$/,
  "",
);

const response = await fetch(`${baseUrl}/`);
assert.equal(response.status, 200, `Expected app shell, received HTTP ${response.status}`);

const html = await response.text();
assert.match(html, /<title>AgriLens AI<\/title>/, "App title is missing");
assert.match(html, /id="root"/, "React mount point is missing");
assert.match(html, /type="module"/, "Frontend entry script is missing");

console.info("AgriLens AI smoke test passed: app shell responds with the expected entry point.");
