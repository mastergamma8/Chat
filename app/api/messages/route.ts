import { NextRequest, NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/lib/blobstore";
import type { FileDB, Msg } from "@/lib/types";

export const revalidate = 0;

function clampStr(s: string, n: number) {
  s = (s || "").trim();
  return s.length > n ? s.slice(0, n) : s;
}

export async function GET(req: NextRequest) {
  const since = req.nextUrl.searchParams.get("since") || "";
  const db = await readJSON<FileDB>("messages.json", { messages: [] });
  let messages = db.messages || [];
  if (since) {
    const t = Date.parse(since);
    if (!Number.isNaN(t)) {
      messages = messages.filter(m => Date.parse(m.created_at) > t);
    }
  }
  return NextResponse.json({ messages }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as Partial<Msg> | null;
  if (!body) return NextResponse.json({ error: "Bad JSON" }, { status: 400 });

  const user_id = clampStr(String(body.user_id || ""), 64) || crypto.randomUUID();
  const nickname = clampStr(String(body.nickname || "Гость"), 24);
  const content = clampStr(String(body.content || ""), 800);
  if (!content) return NextResponse.json({ error: "Empty message" }, { status: 400 });

  const db = await readJSON<FileDB>("messages.json", { messages: [] });
  const msg: Msg = {
    id: crypto.randomUUID(),
    user_id,
    nickname,
    content,
    created_at: new Date().toISOString(),
  };
  db.messages = (db.messages || []).concat(msg).slice(-1000); // keep last 1000
  await writeJSON("messages.json", db);
  return NextResponse.json({ ok: true, message: msg });
}
