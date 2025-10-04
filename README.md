# MG Chat (Vercel Blob) — без БД, в файле

Мобильный чат на Next.js (App Router) c хранением в **одном JSON-файле** на Vercel Blob.
Телеграм-бот умеет скачивать дамп и загружать его обратно.

## Что понадобится
- Аккаунт Vercel.
- Включить **Vercel Blob** и создать токен `BLOB_READ_WRITE_TOKEN` (Project → Storage → Blob → Generate token).
- В Project Settings → Environment Variables добавить:
  - `BLOB_READ_WRITE_TOKEN`
  - `BOT_SYNC_SECRET` — любой длинный секрет для доступа к /api/export и /api/import

## Запуск (локально)
```bash
npm i
npm run dev
```

## Деплой на Vercel
- Импортируйте проект или загрузите архив.
- В Settings → Environment Variables добавьте `BLOB_READ_WRITE_TOKEN` и `BOT_SYNC_SECRET`.
- Нажмите Deploy.

## REST API
- `GET /api/messages?since=<iso>` — получить сообщения (все/с момента `since`).
- `POST /api/messages` — добавить сообщение `{ user_id, nickname, content }`.
- `POST /api/presence/ping` — пинг клиента `{ id, nickname }` → возвращает `{ online }` (до 45 сек считается онлайн).
- `GET /api/export` — выдать дамп (требует заголовок `X-Bot-Secret`).
- `POST /api/import` — принять дамп и записать (требует заголовок `X-Bot-Secret`).

Файлы в Blob:
- `messages.json` — `{ messages: Msg[] }`, хранится до 1000 последних сообщений.
- `presence.json` — карта онлайн-пользователей (id → {nickname, ts}), TTL ~45 сек.

## Telegram-бот
Файл: `tg_sync_bot.py` (aiogram 3)
Переменные окружения:
```
BOT_TOKEN=123:ABC
API_BASE=https://your-app.vercel.app
BOT_SYNC_SECRET=<тот же секрет, что на сайте>
```
Команды:
- `/exportdb` — скачивает `messages.json` в JSON-дампе
- `/importdb` — ответить командой на JSON-файл/текст — загрузит в `messages.json`

## Ограничения и заметки
- Это не база данных: запись идёт целиком в JSON — подходят небольшие объёмы и онлайн до десятков пользователей.
- Параллельные записи могут перезаписывать друг друга в экстремальных коллизиях.
  Для небольших чатов на Vercel обычно ок. При росте — переходите на Supabase/Redis/Pusher.
- Онлайн-счётчик приблизительный (по ping каждые 10 сек, TTL 45 сек).
