#!/usr/bin/env node
/**
 * Test File Cleanup Script
 * Automatically removes test artifacts and temporary files
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// Cleanup patterns
const CLEANUP_PATTERNS = [
  "*.test.tmp",
  "*.spec.tmp",
  "test-output-*",
  "test-results.log",
  ".test-cache",
  "coverage",
  ".nyc_output",
];

// Directories to clean
const CLEANUP_DIRECTORIES = [
  "temp-test-files",
  "test-temp",
  "tmp-test",
  ".test-artifacts",
];

// Colors for console output
const colors = {
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function removeFile(filePath) {
  try {
    await fs.unlink(filePath);
    log(`✅ Removed file: ${path.relative(projectRoot, filePath)}`, "green");
    return true;
  } catch (error) {
    log(`❌ Failed to remove file: ${filePath} - ${error.message}`, "red");
    return false;
  }
}

async function removeDirectory(dirPath) {
  try {
    await fs.rmdir(dirPath, { recursive: true });
    log(
      `✅ Removed directory: ${path.relative(projectRoot, dirPath)}`,
      "green"
    );
    return true;
  } catch (error) {
    if (error.code !== "ENOENT") {
      log(
        `❌ Failed to remove directory: ${dirPath} - ${error.message}`,
        "red"
      );
    }
    return false;
  }
}

async function findMatchingFiles(dir, patterns) {
  const matchedFiles = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Recursively search subdirectories
        const subFiles = await findMatchingFiles(fullPath, patterns);
        matchedFiles.push(...subFiles);
      } else {
        // Check if file matches any pattern
        for (const pattern of patterns) {
          const regexPattern = pattern
            .replace(/\./g, "\\.")
            .replace(/\*/g, ".*");

          if (new RegExp(`^${regexPattern}$`).test(entry.name)) {
            matchedFiles.push(fullPath);
            break;
          }
        }
      }
    }
  } catch (error) {
    // Directory doesn't exist or can't be read
  }

  return matchedFiles;
}

async function cleanupTestFiles() {
  log("🧹 Starting test file cleanup...", "blue");

  let removedCount = 0;

  // Clean up files matching patterns
  log("\n📄 Cleaning up test files...", "yellow");
  const matchedFiles = await findMatchingFiles(projectRoot, CLEANUP_PATTERNS);

  for (const filePath of matchedFiles) {
    if (await removeFile(filePath)) {
      removedCount++;
    }
  }

  // Clean up directories
  log("\n📁 Cleaning up test directories...", "yellow");
  for (const dirName of CLEANUP_DIRECTORIES) {
    const dirPath = path.join(projectRoot, dirName);
    if (await fileExists(dirPath)) {
      if (await removeDirectory(dirPath)) {
        removedCount++;
      }
    }
  }

  // Clean up node_modules test artifacts (be careful here)
  log("\n🗂️  Cleaning up node_modules test artifacts...", "yellow");
  const nodeModulesTestDirs = [
    path.join(projectRoot, "node_modules", ".cache"),
    path.join(projectRoot, "node_modules", ".test-cache"),
  ];

  for (const dirPath of nodeModulesTestDirs) {
    if (await fileExists(dirPath)) {
      if (await removeDirectory(dirPath)) {
        removedCount++;
      }
    }
  }

  // Summary
  log(`\n✨ Cleanup complete! Removed ${removedCount} items.`, "green");

  if (removedCount === 0) {
    log("🎉 No test artifacts found - your workspace is clean!", "green");
  }
}

async function main() {
  try {
    await cleanupTestFiles();
  } catch (error) {
    log(`❌ Cleanup failed: ${error.message}`, "red");
    process.exit(1);
  }
}

// Run cleanup
main();
