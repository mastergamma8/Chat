"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { clsx } from "clsx";

type Msg = {
  id: string;
  user_id: string;
  nickname: string;
  content: string;
  created_at: string;
};

function randomName() {
  const animals = ["Лис", "Кот", "Пёс", "Волк", "Олень", "Ёж", "Заяц", "Сова"];
  const n = Math.floor(Math.random() * animals.length);
  return `Гость-${animals[n]}-${Math.floor(Math.random() * 999)}`;
}

export default function Chat() {
  const [nickname, setNickname] = useState<string>(() => typeof window !== "undefined"
    ? localStorage.getItem("nickname") || randomName()
    : randomName()
  );
  const [userId, setUserId] = useState<string>(() => typeof window !== "undefined"
    ? localStorage.getItem("uid") || crypto.randomUUID()
    : crypto.randomUUID()
  );
  const [online, setOnline] = useState<number>(1);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const [since, setSince] = useState<string>("");

  useEffect(() => { localStorage.setItem("nickname", nickname); }, [nickname]);
  useEffect(() => { localStorage.setItem("uid", userId); }, [userId]);

  // Initial load
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/messages", { cache: "no-store" });
      const j = await res.json();
      const msgs: Msg[] = j.messages || [];
      setMessages(msgs);
      const last = msgs.at(-1)?.created_at || "";
      setSince(last);
      requestAnimationFrame(() => listRef.current?.scrollTo({ top: 999999, behavior: "auto" }));
    })();
  }, []);

  // Poll new messages
  useEffect(() => {
    const id = setInterval(async () => {
      const url = since ? `/api/messages?since=${encodeURIComponent(since)}` : "/api/messages";
      const res = await fetch(url, { cache: "no-store" });
      const j = await res.json();
      const newMsgs: Msg[] = j.messages || [];
      if (newMsgs.length) {
        setMessages(prev => [...prev, ...newMsgs]);
        const last = newMsgs.at(-1)?.created_at || since;
        setSince(last);
        requestAnimationFrame(() => listRef.current?.scrollTo({ top: 999999, behavior: "smooth" }));
      }
    }, 1500);
    return () => clearInterval(id);
  }, [since]);

  // Presence ping
  useEffect(() => {
    const ping = async () => {
      try {
        const res = await fetch("/api/presence/ping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: userId, nickname }),
        });
        const j = await res.json();
        setOnline(j.online || 1);
      } catch {}
    };
    ping();
    const id = setInterval(ping, 10000);
    return () => clearInterval(id);
  }, [userId, nickname]);

  async function send() {
    const content = text.trim();
    if (!content) return;
    setText("");
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, nickname, content }),
    });
    if (!res.ok) {
      const t = await res.text();
      alert("Не удалось отправить: " + t.slice(0, 200));
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      send();
    }
  }

  const myId = userId;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 p-4 bg-neutral-950/80 backdrop-blur border-b border-neutral-800">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">💬 MG Chat (Blob)</h1>
            <p className="text-xs text-neutral-400">Онлайн: <span className="font-semibold">{online}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <input
              className="input w-40"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Ваш ник"
              maxLength={24}
              title="Ник видят все пользователи"
            />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div ref={listRef} className="max-w-md mx-auto p-4 space-y-2 overflow-y-auto" style={{ height: "calc(100vh - 160px)" }}>
          {messages.map((m) => {
            const mine = m.user_id === myId;
            return (
              <div key={m.id} className={clsx("flex", mine ? "justify-end" : "justify-start")}>
                <div className={clsx("max-w-[85%] rounded-2xl px-3 py-2 text-sm", mine ? "bg-white text-black" : "bg-neutral-800 text-white")}>
                  <div className={clsx("text-[11px] mb-1", mine ? "text-black/60" : "text-neutral-400")}>
                    {m.nickname}
                    <span className="ml-2">{new Date(m.created_at).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}</span>
                  </div>
                  <div className="whitespace-pre-wrap break-words">{m.content}</div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="p-3 border-t border-neutral-800">
        <div className="max-w-md mx-auto flex gap-2">
          <input
            className="input"
            placeholder="Напишите сообщение…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            maxLength={800}
          />
          <button className="btn-primary" onClick={send}>Отпр.</button>
        </div>
      </footer>
    </div>
  );
}
