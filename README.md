# «Доброе Сердце» — веб-приложение приюта животных

Учебный проект для УП.08 «Разработка дизайна веб-приложений». В репозитории есть React SPA, Express REST API, SQLite, каталог из 36 демонстрационных животных, формы заявок, авторизация администратора, загрузка нескольких изображений, слайдер, тёмная тема, адаптивная вёрстка и документы проекта и 42-секундную презентацию макетов (это не запись браузера).

## Структура
- `frontend/` — React + Vite + React Router, страницы и стили.
- `backend/` — Express API, SQLite, JWT, bcryptjs, загрузка фото, CSV-экспорт и резервные копии.
- `docs/` — ТЗ (исходный файл, не редактировался), отчёт, UI-kit, мудборд, вайрфреймы, карта сайта, ER-диаграмма, макеты desktop/mobile и кликабельный прототип.
- `scripts/check-imports.mjs` — проверка относительных импортов.

## Требования
Node.js 22.13+ и npm. SQLite встроен в Node.js — Visual Studio C++ Build Tools и нативный модуль `better-sqlite3` больше не нужны.

## Самый простой запуск (Windows)
Дважды щёлкни `УСТАНОВИТЬ_И_ЗАПУСТИТЬ.bat` в корне проекта. Скрипт установит зависимости, подготовит базу и откроет сайт и API в отдельных окнах. Для установки зависимостей нужен доступ к npm registry.

## Локальный запуск (Windows CMD)
Открой первое окно CMD и выполни команды по очереди:
```bat
cd /d ПУТЬ\К\dobroe_serdtse_complete\backend
npm install
copy .env.example .env
npm run seed
npm run dev
```
Не закрывай первое окно. Открой второе окно CMD:
```bat
cd /d ПУТЬ\К\dobroe_serdtse_complete\frontend
npm install
copy .env.example .env
npm run dev
```
Открой адрес Vite, который появится в окне терминала (обычно `http://localhost:5173`). API доступно на `http://localhost:4000/api/health`.

**Важно:** в `.env` для локального запуска после копирования можно оставить демо-учётные данные. Перед публикацией обязательно установи уникальные `ADMIN_PASSWORD` и `JWT_SECRET`; не коммить `.env`.

## Демо-вход в админ-панель
- E-mail: `admin@dobroe-serdtse.local`
- Пароль: `ChangeMe123!`

Эти данные подходят только для локальной демонстрации. При `NODE_ENV=production` скрипт seed требует заданный `ADMIN_PASSWORD` и `JWT_SECRET`.

## Проверки
Из корня проекта: `node scripts/check-imports.mjs`. В папке `backend`: `npm test` и `node --check src/server.js`. Полная сборка фронтенда: из `frontend` — `npm run build` (требуется установить npm-зависимости).

## API
| Метод | Адрес | Назначение |
|---|---|---|
| GET | `/api/health` | Проверка состояния API |
| GET | `/api/animals?q=&species=&sex=&status=&sort=&page=&limit=` | Каталог, фильтры, сортировка и пагинация |
| GET | `/api/animals/:id` | Карточка питомца и галерея |
| POST | `/api/applications` | Создать заявку с серверной валидацией |
| POST | `/api/auth/login` | Вход администратора, JWT |
| GET/POST | `/api/admin/animals` | Список и создание животного (JWT) |
| PATCH/DELETE | `/api/admin/animals/:id` | Изменение и удаление животного (JWT) |
| GET | `/api/applications` | Список заявок (JWT) |
| PATCH | `/api/applications/:id` | Изменить статус заявки (JWT) |
| GET | `/api/admin/applications.csv` | Экспорт заявок в CSV (JWT) |

## Деплой
1. Создай GitHub-репозиторий и отправь код. В проекте уже сформирована локальная Git-история с осмысленными коммитами. После создания своего GitHub-репозитория добавь remote и выполни push; затем продолжай фиксировать собственные изменения отдельными коммитами.
2. Backend: создай Web Service на Render из `backend/` или используй `backend/render.yaml`. Укажи `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `FRONTEND_ORIGIN` (публичный URL фронтенда); используй постоянный диск для SQLite и загруженных файлов. Выполни `npm run seed` при первом запуске/деплое.
3. Frontend: импортируй папку `frontend/` в Vercel/Netlify, установи `VITE_API_URL` равным URL backend. Конфигурации SPA fallback уже включены.
4. После публикации проверь `/api/health`, каталог, форму, вход в админку и загрузку изображений.

Публичные URL намеренно не указаны заранее: их выдаёт хостинг после публикации в аккаунте владельца. Не вводи настоящие персональные данные в учебной версии.
