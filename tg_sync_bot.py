# -*- coding: utf-8 -*-
"""
Telegram bot to export/import chat "DB" (messages.json) via Next.js API.
Commands:
  /exportdb — download JSON dump
  /importdb — reply to a JSON dump to upload back
Env:
  BOT_TOKEN=123:abc
  API_BASE=https://your-app.vercel.app
  BOT_SYNC_SECRET=very-secret
"""
import asyncio
import os
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.filters import Command, CommandObject
from aiogram.types import Message
import aiohttp

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
API_BASE = os.getenv("API_BASE", "").rstrip("/")
BOT_SYNC_SECRET = os.getenv("BOT_SYNC_SECRET", "")

if not BOT_TOKEN or not API_BASE or not BOT_SYNC_SECRET:
    raise SystemExit("Set BOT_TOKEN, API_BASE, BOT_SYNC_SECRET in env")

bot = Bot(BOT_TOKEN, default=DefaultBotProperties(parse_mode=None))
dp = Dispatcher()

@dp.message(Command("exportdb"))
async def export_db(msg: Message, cmd: CommandObject):
    await msg.answer("⏳ Экспортирую…")
    url = f"{API_BASE}/api/export"
    async with aiohttp.ClientSession() as s:
        async with s.get(url, headers={"X-Bot-Secret": BOT_SYNC_SECRET}) as r:
            data = await r.read()
            if r.status != 200:
                txt = data.decode("utf-8", "ignore")[:300]
                return await msg.answer(f"❌ Ошибка экспорта: {r.status} {txt}")
    await msg.answer_document(document=data, filename="mgchat_dump.json", caption="Готово ✅")

@dp.message(Command("importdb"))
async def import_db(msg: Message, cmd: CommandObject):
    if not msg.reply_to_message or not (msg.reply_to_message.document or msg.reply_to_message.text):
        return await msg.answer("Ответьте этой командой на JSON-файл дампа или на сообщение с JSON-текстом.")
    # Get dump bytes
    if msg.reply_to_message.document:
        file = await bot.get_file(msg.reply_to_message.document.file_id)
        file_url = f"https://api.telegram.org/file/bot{BOT_TOKEN}/{file.file_path}"
        async with aiohttp.ClientSession() as s:
            async with s.get(file_url) as r:
                dump_bytes = await r.read()
    else:
        dump_bytes = (msg.reply_to_message.text or "").encode("utf-8")

    url = f"{API_BASE}/api/import"
    async with aiohttp.ClientSession() as s:
        async with s.post(url, data=dump_bytes, headers={
            "Content-Type": "application/json",
            "X-Bot-Secret": BOT_SYNC_SECRET
        }) as r:
            resp = await r.text()
            if r.status != 200:
                return await msg.answer(f"❌ Импорт не прошёл: {r.status} {resp[:400]}")
            return await msg.answer(f"✅ Импорт завершён: {resp[:400]}")

async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
