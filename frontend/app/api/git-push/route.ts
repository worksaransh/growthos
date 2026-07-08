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

    // Remove accidental test files
    for (const f of [
      join(repoRoot, "docs", "screenshots", "test.txt"),
      join(repoRoot, "docs", "test.txt"),
    ]) {
      if (existsSync(f)) {
        unlinkSync(f);
        results.push("Removed " + f.split("\\").pop());
      }
    }

    const opts = { cwd: repoRoot, encoding: "utf8" as const };

    const status = execSync("git status --short", opts);
    results.push("Status:\n" + status);

    // Stage everything relevant
    execSync(
      "git add docs/ README.md frontend/app/api/ frontend/public/html2canvas.min.js frontend/package.json frontend/package-lock.json",
      opts
    );
    results.push("git add done");

    const diff = execSync("git diff --cached --stat", opts);
    results.push("Staged:\n" + diff);

    if (!diff.trim()) {
      results.push("Nothing to commit");
      return NextResponse.json({ ok: true, results });
    }

    execSync('git commit -m "chore: update packages + cleanup"', opts);
    results.push("git commit done");

    const push = execSync("git push origin main", opts);
    results.push("git push done: " + push);

    return NextResponse.json({ ok: true, results });
  } catch (err: unknown) {
    const error = err as { message?: string; stderr?: string; stdout?: string };
    return NextResponse.json(
      { ok: false, error: error.message, stderr: error.stderr, stdout: error.stdout, results },
      { status: 500 }
    );
  }
}
