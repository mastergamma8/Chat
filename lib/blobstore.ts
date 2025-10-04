import { put, list } from "@vercel/blob";

export async function readJSON<T>(key: string, fallback: T): Promise<T> {
  const { blobs } = await list({ prefix: key });
  const found = blobs.find(b => b.pathname === key) || blobs[0];
  if (!found) return fallback;
  const res = await fetch(found.url, { cache: "no-store" });
  if (!res.ok) return fallback;
  return (await res.json()) as T;
}

export async function writeJSON(key: string, data: any) {
  const body = JSON.stringify(data);
  await put(key, body, {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
}
