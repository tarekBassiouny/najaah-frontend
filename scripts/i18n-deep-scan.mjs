#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const ROOT = process.cwd();

const INCLUDE_DIRS = [
  path.join(ROOT, "src/app"),
  path.join(ROOT, "src/features"),
  path.join(ROOT, "src/components"),
];

const JS_EXTENSIONS = new Set([".tsx", ".jsx"]);

const TARGET_ATTRIBUTES = new Set([
  "title",
  "placeholder",
  "aria-label",
  "aria-description",
  "label",
  "alt",
  "helperText",
  "description",
  "tooltip",
  "emptyMessage",
  "noOptionsMessage",
]);

const ALLOWED_SINGLE_WORDS = new Set([
  "en",
  "ar",
  "ltr",
  "rtl",
  "id",
  "api",
  "json",
  "pdf",
  "drm",
  "ios",
  "android",
  "sms",
  "otp",
  "vip",
  "ok",
  "n",
  "v1",
  "v2",
  "v3",
  "v4",
]);

const MAX_LOGGED_FINDINGS = 200;

function walk(dir, output) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      if (entry.name === ".next") continue;
      if (entry.name === "coverage") continue;
      walk(fullPath, output);
      continue;
    }

    if (JS_EXTENSIONS.has(path.extname(entry.name))) {
      output.push(fullPath);
    }
  }
}

function clean(value) {
  return value.replace(/\s+/g, " ").trim();
}

function hasLetters(value) {
  return /[A-Za-z\u0600-\u06FF]/.test(value);
}

function looksTechnical(value) {
  if (/^https?:\/\//i.test(value)) return true;
  if (/^#[0-9A-Fa-f]{3,8}$/.test(value)) return true;
  if (/^\{.*\}$/.test(value)) return true;
  if (/^[+\-−]$/.test(value)) return true;
  if (/^\/?[a-z0-9_./-]+$/i.test(value)) return true;
  return false;
}

function getWordCount(value) {
  return clean(value).split(" ").filter(Boolean).length;
}

function isAllowedSingleWord(value) {
  return ALLOWED_SINGLE_WORDS.has(value.toLowerCase());
}

function toFinding(file, line, kind, value) {
  return { file: path.relative(ROOT, file), line, kind, value };
}

function collectFindings(filePath) {
  const fileText = fs.readFileSync(filePath, "utf8");
  const scriptKind = filePath.endsWith(".tsx")
    ? ts.ScriptKind.TSX
    : ts.ScriptKind.JSX;

  const sourceFile = ts.createSourceFile(
    filePath,
    fileText,
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  );

  const phraseFindings = [];
  const singleWordFindings = [];

  function classify(value, line, kind) {
    const normalized = clean(value);
    if (!normalized) return;
    if (!hasLetters(normalized)) return;
    if (looksTechnical(normalized)) return;

    const wordCount = getWordCount(normalized);
    if (wordCount >= 2) {
      phraseFindings.push(toFinding(filePath, line, kind, normalized));
      return;
    }

    if (!isAllowedSingleWord(normalized)) {
      singleWordFindings.push(toFinding(filePath, line, kind, normalized));
    }
  }

  function visit(node) {
    if (ts.isJsxText(node)) {
      const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
      classify(node.text ?? "", line, "JSXText");
    }

    if (
      ts.isJsxAttribute(node) &&
      node.initializer &&
      ts.isStringLiteral(node.initializer)
    ) {
      const attributeName = node.name.text;
      if (TARGET_ATTRIBUTES.has(attributeName)) {
        const line =
          sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        classify(node.initializer.text, line, `Attr:${attributeName}`);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return { phraseFindings, singleWordFindings };
}

function printFindings(title, findings) {
  if (findings.length === 0) return;

  console.log(`\n${title}: ${findings.length}`);
  for (const finding of findings.slice(0, MAX_LOGGED_FINDINGS)) {
    console.log(
      `${finding.file}:${finding.line} [${finding.kind}] ${finding.value}`,
    );
  }

  if (findings.length > MAX_LOGGED_FINDINGS) {
    console.log(`...and ${findings.length - MAX_LOGGED_FINDINGS} more`);
  }
}

function main() {
  const files = [];
  for (const directory of INCLUDE_DIRS) {
    if (fs.existsSync(directory)) {
      walk(directory, files);
    }
  }

  const phraseFindings = [];
  const singleWordFindings = [];

  for (const filePath of files) {
    const result = collectFindings(filePath);
    phraseFindings.push(...result.phraseFindings);
    singleWordFindings.push(...result.singleWordFindings);
  }

  const total = phraseFindings.length + singleWordFindings.length;
  if (total === 0) {
    console.log("i18n deep scan passed: no static user-facing strings found.");
    process.exit(0);
  }

  console.error("i18n deep scan failed.");
  printFindings("Phrase findings", phraseFindings);
  printFindings("Single-word findings", singleWordFindings);
  process.exit(1);
}

main();
