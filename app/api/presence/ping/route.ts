import { NextRequest, NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/lib/blobstore";
import type { Presence } from "@/lib/types";

export const revalidate = 0;

export async function POST(req: NextRequest) {
  const { id, nickname } = await req.json().catch(() => ({ id: "", nickname: "" }));
  const now = Date.now();
  const ttl = 45_000; // 45 sec online window

  const pres = await readJSON<Presence>("presence.json", {});
  const cleaned: Presence = {};
  for (const [k, v] of Object.entries(pres)) {
    if (now - (v?.ts || 0) <= ttl) cleaned[k] = v;
  }
  if (id) {
    cleaned[id] = { nickname: String(nickname || "Гость").slice(0, 24), ts: now };
  }
  await writeJSON("presence.json", cleaned);
  const online = Object.keys(cleaned).length;
  return NextResponse.json({ online }, { headers: { "Cache-Control": "no-store" } });
}
