#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const CONTRACT_MANIFEST_PATHS = [
  "lib/supabase/contract-governance.json",
  "lib/posts/contracts/contract-governance.json",
  "components/ui/contract-governance.json",
  "lib/content/contract-governance.json"
];

const ROOT_README_GOVERNANCE_LINK_TARGETS = [
  "(lib/supabase/README.md)",
  "(lib/posts/contracts/README.md)",
  "(scripts/check-contract-governance.mjs)"
];

const ROOT_README_FORBIDDEN_GOVERNANCE_HEADINGS = [
  "## Contract Test Matrix"
];

function loadContractGovernanceManifests(paths) {
  return paths.map((manifestPath) => {
    if (!existsSync(manifestPath)) {
      console.error(`[contract-governance] Failed: missing governance manifest ${manifestPath}`);
      process.exit(1);
    }

    const rawManifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    return {
      path: manifestPath,
      architecturePaths: Array.isArray(rawManifest.architecturePaths) ? rawManifest.architecturePaths : [],
      forbiddenShims: Array.isArray(rawManifest.forbiddenShims) ? rawManifest.forbiddenShims : [],
      contractRules: Array.isArray(rawManifest.contractRules) ? rawManifest.contractRules : []
    };
  });
}

const CONTRACT_MANIFESTS = loadContractGovernanceManifests(CONTRACT_MANIFEST_PATHS);

const ARCHITECTURE_CONTRACT_PATHS = [
  ...new Set(CONTRACT_MANIFESTS.flatMap((manifest) => manifest.architecturePaths))
];

const FORBIDDEN_ARCHITECTURE_SHIMS = [
  ...new Set(CONTRACT_MANIFESTS.flatMap((manifest) => manifest.forbiddenShims))
];

const CONTRACT_RULES = CONTRACT_MANIFESTS.flatMap((manifest) => manifest.contractRules);

function run(command) {
  return execSync(command, {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8"
  }).trim();
}

function assertArchitectureContractPathsExist(paths) {
  const missingPaths = paths.filter((contractPath) => !existsSync(contractPath));
  if (missingPaths.length === 0) {
    return;
  }

  console.error("[contract-governance] Failed: documented architecture contract path(s) are missing.");
  for (const missingPath of missingPaths) {
    console.error(`- Missing: ${missingPath}`);
  }
  console.error(
    "Update package-level contract-governance manifests and README architecture pointers to keep canonical paths in sync."
  );
  process.exit(1);
}

function assertForbiddenShimPathsAbsent(paths) {
  const presentPaths = paths.filter((forbiddenPath) => existsSync(forbiddenPath));
  if (presentPaths.length === 0) {
    return;
  }

  console.error("[contract-governance] Failed: forbidden compatibility shim path(s) detected.");
  for (const presentPath of presentPaths) {
    console.error(`- Remove shim: ${presentPath}`);
  }
  console.error(
    "Supabase request-client imports must target canonical clients/* modules directly."
  );
  process.exit(1);
}

function assertRootReadmeGovernanceIndexOnly() {
  if (!existsSync("README.md")) {
    console.error("[contract-governance] Failed: README.md is missing.");
    process.exit(1);
  }

  const readme = readFileSync("README.md", "utf8");
  const architectureSection = extractMarkdownSection(readme, "Architecture Contracts");
  const missingLinks = ROOT_README_GOVERNANCE_LINK_TARGETS.filter((target) => !readme.includes(target));
  const forbiddenHeadings = ROOT_README_FORBIDDEN_GOVERNANCE_HEADINGS.filter((heading) =>
    readme.includes(heading)
  );
  const sectionLines = architectureSection
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const sectionHasTableSyntax = sectionLines.some((line) => line.includes("|"));
  const sectionBulletLines = sectionLines.filter((line) => line.startsWith("- "));
  const sectionContainsNonLinkBullets = sectionBulletLines.some(
    (line) => !/\[[^\]]+\]\([^)]+\)/.test(line)
  );
  const sectionHasUnexpectedContent = sectionLines.some((line, index) => {
    if (line.startsWith("- ")) {
      return false;
    }
    return index > 0;
  });

  if (
    architectureSection &&
    missingLinks.length === 0 &&
    forbiddenHeadings.length === 0 &&
    !sectionHasTableSyntax &&
    !sectionContainsNonLinkBullets &&
    !sectionHasUnexpectedContent
  ) {
    return;
  }

  console.error("[contract-governance] Failed: root README governance section is not index-only.");
  if (!architectureSection) {
    console.error("- Missing required section heading: ## Architecture Contracts");
  }
  for (const linkTarget of missingLinks) {
    console.error(`- Missing required governance link target: ${linkTarget}`);
  }
  for (const heading of forbiddenHeadings) {
    console.error(`- Remove non-index governance heading from root README: ${heading}`);
  }
  if (sectionHasTableSyntax) {
    console.error("- Remove governance table content from root README Architecture Contracts section.");
  }
  if (sectionContainsNonLinkBullets) {
    console.error("- Use link bullets only in root README Architecture Contracts section.");
  }
  if (sectionHasUnexpectedContent) {
    console.error("- Keep root README Architecture Contracts section to one intro line plus link bullets.");
  }
  console.error(
    "Keep canonical boundary governance details in package READMEs and keep root README as a pointer index."
  );
  process.exit(1);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractMarkdownSection(markdown, heading) {
  const headingPattern = new RegExp(`^##\\s+${escapeRegex(heading)}\\s*$`, "m");
  const headingMatch = headingPattern.exec(markdown);
  if (!headingMatch) {
    return "";
  }
  const sectionStart = headingMatch.index + headingMatch[0].length;
  const remaining = markdown.slice(sectionStart);
  const nextHeadingMatch = /^\s*##\s+/m.exec(remaining);
  if (!nextHeadingMatch) {
    return remaining.trim();
  }
  return remaining.slice(0, nextHeadingMatch.index).trim();
}

function resolveDiffBase() {
  if (process.env.CONTRACT_GOVERNANCE_BASE) {
    return process.env.CONTRACT_GOVERNANCE_BASE;
  }
  try {
    return run("git rev-parse --verify HEAD~1");
  } catch {
    return null;
  }
}

function loadChangedFiles(baseRef) {
  const output = run(`git diff --name-only ${baseRef}...HEAD`);
  if (!output) {
    return new Set();
  }
  return new Set(
    output
      .split("\n")
      .map((entry) => entry.trim())
      .filter(Boolean)
  );
}

const baseRef = resolveDiffBase();
assertArchitectureContractPathsExist(ARCHITECTURE_CONTRACT_PATHS);
assertForbiddenShimPathsAbsent(FORBIDDEN_ARCHITECTURE_SHIMS);
assertRootReadmeGovernanceIndexOnly();
if (!baseRef) {
  console.log("[contract-governance] Skipped (no diff base available).");
  process.exit(0);
}

const changedFiles = loadChangedFiles(baseRef);
if (changedFiles.size === 0) {
  console.log(`[contract-governance] No changed files between ${baseRef}...HEAD.`);
  process.exit(0);
}

const violations = CONTRACT_RULES.flatMap((rule) => {
  const touchedSensitive = rule.sensitive.filter((file) => changedFiles.has(file));
  if (touchedSensitive.length === 0) {
    return [];
  }

  const touchedRequired = rule.required.filter((file) => changedFiles.has(file));
  if (touchedRequired.length > 0) {
    return [];
  }

  return [
    {
      id: rule.id,
      sensitive: touchedSensitive,
      required: rule.required
    }
  ];
});

if (violations.length === 0) {
  console.log(
    `[contract-governance] OK: contract-sensitive changes include corresponding test updates (${baseRef}...HEAD).`
  );
  process.exit(0);
}

console.error(`[contract-governance] Failed: ${violations.length} rule(s) violated.`);
for (const violation of violations) {
  console.error(`- Rule '${violation.id}' touched: ${violation.sensitive.join(", ")}`);
  console.error(`  Required test/doc updates: ${violation.required.join(", ")}`);
}
console.error(
  "Update at least one required contract test file for each touched sensitive module, then rerun."
);
process.exit(1);
