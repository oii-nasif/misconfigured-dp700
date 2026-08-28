/* Headless behavioural suite for index.html — no dependencies, node only:
     node test/behaviour.test.mjs
   Extracts the app's inline script from index.html and runs it against a stub
   DOM (test/stub.js), then executes the checks (test/checks.js) in the same
   scope so they can see the app's real state. Exit code 0 = all checks pass. */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, "..", "index.html"), "utf8");

const m = html.match(/^<script>\r?\n([\s\S]*?)\r?\n<\/script>$/m);
if (!m) {
  console.error("behaviour.test: could not extract the inline <script> from index.html");
  process.exit(2);
}

const src = [
  readFileSync(join(here, "stub.js"), "utf8"),
  m[1],
  readFileSync(join(here, "checks.js"), "utf8"),
].join("\n");

const failures = await eval(src);   // direct eval: one shared scope for stub + app + checks
process.exit(failures ? 1 : 0);
