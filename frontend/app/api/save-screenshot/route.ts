import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

export async function POST(req: NextRequest) {
  const { filename, data } = await req.json();
  const base64 = data.replace(/^data:image\/\w+;base64,/, "");
  const buf = Buffer.from(base64, "base64");
  const dir = join(process.cwd(), "..", "docs", "screenshots");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, filename), buf);
  return NextResponse.json({ ok: true, path: `docs/screenshots/${filename}` });
}
