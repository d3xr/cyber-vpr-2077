# CYBER VPR 2077 // NIGHT CITY OPS

Учебный квест в эстетике Cyberpunk 2077 для подготовки к ВПР по английскому, 4 класс.
Четыре миссии = четыре формата ВПР: listening · reading · grammar · writing.
Финал — школьная оценка по реальной шкале и «час в Night City» как награда.

## Запуск

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # сборка в dist/
npm run preview      # запустить собранную версию
```

Никакого бэкенда не нужно — всё в браузере.
Прогресс хранится в `localStorage` под ключом `cybervpr-2077`.

## Тех. стек

- React 18 + Vite + TypeScript
- Tailwind CSS (палитра NC в `tailwind.config.js`)
- Framer Motion — глитчи, появления, тряска экрана
- Zustand + middleware `persist` — стейт и сохранение прогресса
- Web Speech API — озвучка миссии Braindance (`SpeechSynthesisUtterance`, `en-US`, rate 0.85)
- Web Audio API — синтезированные SFX и ambient (без mp3-файлов)

## Структура

```
src/
├── main.tsx, App.tsx          — точка входа, роутинг по этапам
├── index.css                  — CRT, scanlines, glitch, neon стили
├── types.ts                   — TS-типы доменной модели
├── store/gameStore.ts         — Zustand-стор с localStorage
├── data/
│   ├── missions.json          — ВЕСЬ контент заданий
│   └── dialogues.ts           — реплики V/Johnny/Delamain/Wakako
├── utils/
│   ├── audio.ts               — клик/правильно/ошибка/фанфара/ambient
│   └── speech.ts              — Web Speech API обёртка
├── components/                — переиспользуемый UI (HUD, BIO, MAP, ...)
├── missions/                  — 4 миссии (по одному файлу на каждую)
└── screens/                   — Briefing / MapScreen / MissionScreen / Finale
```

## Как добавить новый вариант ВПР

Открой `src/data/missions.json` и поправь четыре блока — id остаются `m1..m4`,
структура каждой миссии описана ниже. Всё остальное приложение подстроится автоматически.

### Mission 1 — Listening (`skill: "listening"`)

```jsonc
{
  "audioScript": "Текст, который зачитает Web Speech API на английском.",
  "questions": [
    {
      "id": "A",
      "prompt": "How old is Tom?",
      "options": ["seven", "eight", "nine"],
      "answer": 2,                       // индекс правильного варианта
      "explanation": "Пояснение на русском для разбора ошибок."
    }
    // 5 вопросов — 5 баллов
  ]
}
```

### Mission 2 — Reading (`skill: "reading"`)

```jsonc
{
  "profile": "PROFILE: SARAH MILLER",   // заголовок датапада
  "datapad": "Связный текст профиля на английском, абзац.",
  "questions": [ /* такая же структура, как в M1 */ ]
}
```

### Mission 3 — Grammar (`skill: "grammar"`)

```jsonc
{
  "intro": "CORP ICE detected. Inject correct tokens to bypass.",
  "template": "Hi! My name {1} Mike. I {2} got a big family. ...",
  "blanks": [
    {
      "id": 1,
      "options": ["am", "is", "are"],
      "answer": 1,                       // индекс правильного варианта
      "explanation": "Пояснение на русском."
    }
    // 5 пропусков — 5 баллов
  ]
}
```

В `template` пропуски обозначаются `{1}`, `{2}` и т.д. — id должен совпадать с `id` в `blanks`.

### Mission 4 — Writing (`skill: "writing"`)

```jsonc
{
  "fields": [
    { "id": "name",    "label": "NAME",    "placeholder": "...", "points": 1, "minLength": 2, "kind": "text" },
    { "id": "age",     "label": "AGE",     "placeholder": "...", "points": 1, "minLength": 1, "kind": "number", "min": 6, "max": 12 },
    { "id": "family",  "label": "FAMILY",  "placeholder": "...", "points": 2, "minLength": 8, "kind": "sentence" }
    // и т.д.; sum(points) = maxPoints
  ]
}
```

Поддерживаемые `kind`:
- `text` — короткий текст, проверяется только длина (`minLength`)
- `number` — число в диапазоне `min..max`
- `sentence` — длинный текст ≥ `minLength` И минимум 2 слова через пробел

### Шкала оценок

В `src/screens/Finale.tsx`, функция `grade()`:

```ts
22+ → 5 (S-tier)
15–21 → 4 (A-tier)
10–14 → 3 (B-tier)
0–9   → 2 (retry)
```

Соответствует реальной ВПР-2026, при `maxPoints = 25`.
Если меняешь баллы — поправь и пороги.

## Аудио

Все эффекты синтезированы через Web Audio API (см. `src/utils/audio.ts`):
- `playClick` — короткий бип на кнопках
- `playCorrect` — арпеджио при правильных ответах
- `playWrong` — низкий BZZT + шумовой бёрст
- `playMissionComplete` — фанфара при 100%
- `startAmbient` / `stopAmbient` — фоновый saw-pad с медленным LFO

Замен на mp3-файлы нет — если хочется, положи их в `public/sounds/` и импортируй.

## Пасхалка

Если в брифинге ввести имя `V` (одна буква) — брифинг проводит Johnny Silverhand.
Контент тот же, тон саркастичный.

## Доступность и безопасность контента

- Никакого взрослого контента из игры — только эстетика (неон, импланты, BD, хакинг, fixers).
- Нет упоминаний насилия, секса, наркотиков, ругани.
- Web Speech API требует пользовательский жест (клик `▶ PLAY`) для запуска — это OK.

## Деплой

```bash
npm run build        # → dist/
# Vercel:
vercel --prod
# Netlify:
netlify deploy --prod --dir=dist
```

Никаких env-переменных.

## Известные ограничения

- Голос Web Speech API зависит от ОС/браузера. Лучше всего в Chrome/Edge на macOS и Windows.
- В Safari иногда нужен второй клик `▶ PLAY` после загрузки страницы — браузер так разрешает звук.
- Replay в M1 ограничен **строго одним** разом (как на реальном ВПР).
- Прогресс сохраняется автоматически. Сбросить — кнопка `⟲ RESET` в правом верхнем углу.
