import { NextRequest, NextResponse } from "next/server";
import { readJSON } from "@/lib/blobstore";
import type { FileDB } from "@/lib/types";

export const revalidate = 0;

function auth(req: NextRequest) {
  const incoming = req.headers.get("x-bot-secret") || "";
  const secret = process.env.BOT_SYNC_SECRET || "";
  return !!secret && incoming === secret;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const db = await readJSON<FileDB>("messages.json", { messages: [] });
  const dump = {
    meta: {
      exported_at: new Date().toISOString(),
      app: "MG Chat (Blob)",
      schema_version: 1,
    },
    tables: { messages: db.messages || [] },
  };
  const body = JSON.stringify(dump, null, 2);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="mgchat_dump_${Date.now()}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
