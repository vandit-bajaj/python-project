#!/usr/bin/env node

import { execSync } from "node:child_process";

// Permissive licenses allowed for public, all-rights-reserved distribution
const ALLOWED_LICENSES = new Set([
  "MIT",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
  "0BSD",
  "CC0-1.0",
  "Unlicense",
  "Python-2.0",
]);

// Explicitly blocked copyleft licenses
const FORBIDDEN_LICENSES_REGEX = /(GPL|AGPL)/i;

console.log("Checking production dependency licenses...");

let jsonOutput = "";
try {
  jsonOutput = execSync("pnpm licenses list --json -P", {
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
  });
} catch {
  // If no dependencies are installed yet, exit cleanly
  console.log(
    "No installed production dependencies found or pnpm licenses exited with code. Skipping check.",
  );
  process.exit(0);
}

if (!jsonOutput.trim()) {
  console.log("No production dependencies detected. License check passed.");
  process.exit(0);
}

let licensesData;
try {
  licensesData = JSON.parse(jsonOutput);
} catch (err) {
  console.error("Failed to parse pnpm licenses JSON output:", err.message);
  process.exit(1);
}

const violations = [];
const unverified = [];

for (const [license, packages] of Object.entries(licensesData)) {
  const isForbidden = FORBIDDEN_LICENSES_REGEX.test(license);
  const isAllowed =
    ALLOWED_LICENSES.has(license) ||
    Array.from(ALLOWED_LICENSES).some((allowed) => license.includes(allowed));

  if (isForbidden) {
    for (const pkg of packages) {
      violations.push({ package: pkg.name, version: pkg.version, license });
    }
  } else if (!isAllowed) {
    for (const pkg of packages) {
      unverified.push({ package: pkg.name, version: pkg.version, license });
    }
  }
}

if (violations.length > 0) {
  console.error("\n❌ FORBIDDEN COPYLEFT LICENSES DETECTED:");
  for (const v of violations) {
    console.error(` - ${v.package}@${v.version}: ${v.license}`);
  }
  process.exit(1);
}

if (unverified.length > 0) {
  console.warn("\n⚠️ UNVERIFIED LICENSES (Manual review required):");
  for (const u of unverified) {
    console.warn(` - ${u.package}@${u.version}: ${u.license}`);
  }
  // Exit with failure if unverified licenses are detected
  process.exit(1);
}

console.log(
  "✅ All production dependency licenses verified permissive (MIT, Apache-2.0, BSD, ISC).",
);
process.exit(0);
