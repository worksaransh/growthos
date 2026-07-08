import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { unlinkSync, existsSync } from "fs";
import { join } from "path";

export async function POST() {
  const repoRoot = join(process.cwd(), "..");
  const results: string[] = [];

  try {
    // Remove git index lock if it exists
    const lockPath = join(repoRoot, ".git", "index.lock");
    if (existsSync(lockPath)) {
      unlinkSync(lockPath);
      results.push("Removed index.lock");
    }

    // Remove test.txt from screenshots
    const testFile = join(repoRoot, "docs", "screenshots", "test.txt");
    if (existsSync(testFile)) {
      unlinkSync(testFile);
      results.push("Removed test.txt");
    }

    // Git operations
    const opts = { cwd: repoRoot, encoding: "utf8" as const };

    const status = execSync("git status --short", opts);
    results.push("Status:\n" + status);

    execSync("git add docs/screenshots/ README.md frontend/app/api/ frontend/public/html2canvas.min.js", opts);
    results.push("git add done");

    const diff = execSync("git diff --cached --stat", opts);
    results.push("Staged:\n" + diff);

    execSync('git commit -m "docs: add live screenshots + html2canvas + screenshot API"', opts);
    results.push("git commit done");

    const push = execSync("git push origin main", opts);
    results.push("git push done: " + push);

    return NextResponse.json({ ok: true, results });
  } catch (err: unknown) {
    const error = err as { message?: string; stderr?: string; stdout?: string };
    return NextResponse.json({ ok: false, error: error.message, stderr: error.stderr, stdout: error.stdout, results }, { status: 500 });
  }
}
