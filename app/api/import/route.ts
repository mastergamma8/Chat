import { NextRequest, NextResponse } from "next/server";
import { writeJSON, readJSON } from "@/lib/blobstore";
import type { FileDB, Msg } from "@/lib/types";

export const revalidate = 0;

function auth(req: NextRequest) {
  const incoming = req.headers.get("x-bot-secret") || "";
  const secret = process.env.BOT_SYNC_SECRET || "";
  return !!secret && incoming === secret;
}

export async function POST(req: NextRequest) {
  if (!auth(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }
  const list = Array.isArray(payload?.tables?.messages) ? payload.tables.messages as Msg[] : null;
  if (!list) return NextResponse.json({ error: "Invalid format: tables.messages required" }, { status: 400 });

  // Deduplicate by id and clamp fields
  const seen = new Set<string>();
  const cleaned: Msg[] = [];
  for (const m of list) {
    const id = String(m?.id || "");
    if (!id || seen.has(id)) continue;
    seen.add(id);
    cleaned.push({
      id,
      user_id: String(m?.user_id || "" ).slice(0, 64) || "unknown",
      nickname: String(m?.nickname || "Гость").slice(0, 24),
      content: String(m?.content || "").slice(0, 800),
      created_at: new Date(m?.created_at || Date.now()).toISOString(),
    });
  }
  const db: FileDB = { messages: cleaned.slice(-1000) };
  await writeJSON("messages.json", db);
  return NextResponse.json({ ok: true, count: db.messages.length });
}
