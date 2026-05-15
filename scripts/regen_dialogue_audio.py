#!/usr/bin/env python3
"""
Regenerate all dialogue audio using Microsoft Edge Neural TTS (free, local).

Voices used:
- V                — ru-RU-DmitryNeural (default rate/pitch — relaxed merc)
- Johnny           — ru-RU-DmitryNeural with slower rate + lower pitch (darker, sarcastic)
- Wakako           — ru-RU-SvetlanaNeural (calm female fixer)
- Delamain         — ru-RU-DmitryNeural with slightly faster rate (AI-ish formality)
- V (English)      — en-US-GuyNeural for English-only lines (endings, Johnny EN line)
- SYS              — skipped (terminal status text, no voice)

Output: MP3 files in public/sounds/dialogue/
Quality: 24kHz 48kbps mono — small files, decent quality (much better than browser Web Speech).
"""
import asyncio
import os
import sys
from pathlib import Path

import edge_tts

OUT_DIR = Path(__file__).parent.parent / "public" / "sounds" / "dialogue"
OUT_DIR.mkdir(parents=True, exist_ok=True)


# (filename_stem, text, voice, rate, pitch)
LINES = [
    # === English briefing (V default) ===
    ("briefing_v1",
     "Эй, choom. Меня зовут V. Слышал, ты хочешь стать эджраннером в Night City? Уважаю.",
     "ru-RU-DmitryNeural", "+0%", "+0Hz"),
    ("briefing_v2",
     "Wakako Okada — наш фиксер в Вестбруке — заказала работу. Четыре датапада, четыре района. За каждый — eddies. Но фишка вот в чём: все переговоры идут на английском. Без исключений.",
     "ru-RU-DmitryNeural", "+0%", "+0Hz"),
    ("briefing_v3",
     "Готов, samurai? Тогда поехали. Burn this city.",
     "ru-RU-DmitryNeural", "+0%", "+0Hz"),

    # === Johnny — slower, lower ===
    ("johnny_1",
     "Так-так. Ещё один gonk с амбициями. V занят — брифинг проведу я.",
     "ru-RU-DmitryNeural", "-12%", "-12Hz"),
    ("johnny_2",
     "Wakako хочет данные. Четыре района. Английский — не подведи. Мне в твоей голове, конечно, не место. Но раз застрял — слушай и соберись.",
     "ru-RU-DmitryNeural", "-12%", "-12Hz"),
    ("johnny_3",
     "Wake up, samurai. We have a city to burn.",
     "en-US-GuyNeural", "-10%", "-15Hz"),

    # === Inter-mission ===
    ("inter1_v",
     "Preem job, choom. Один датапад в кармане. Eddies капают на счёт.",
     "ru-RU-DmitryNeural", "+0%", "+0Hz"),
    ("inter1_dela",
     "Поздравляю с успешным завершением задачи. Подаю машину к следующей точке.",
     "ru-RU-DmitryNeural", "+8%", "+8Hz"),
    ("inter2_johnny",
     "Не плохо для gonk'а. Не плохо. Но впереди ещё работа.",
     "ru-RU-DmitryNeural", "-12%", "-12Hz"),
    ("inter3_v",
     "ICE сломан — Wakako будет довольна. Финальный шаг: заполнить досье в NCPD. Не сачкуй.",
     "ru-RU-DmitryNeural", "+0%", "+0Hz"),

    # === Endings ===
    ("ending_win_v",
     "Preem job, choom. Eddies на счёт, callsign в Street Hall. Дальше — больше треков, новые варианты.",
     "ru-RU-DmitryNeural", "+0%", "+0Hz"),
    ("ending_win_johnny",
     "Видишь, gonk. Я в тебя верил. Почти.",
     "ru-RU-DmitryNeural", "-12%", "-12Hz"),
    ("ending_lose_johnny",
     "Слушай, choom. На улицах Night City второго шанса не дают. Но это не улица, это ВПР. Перезапустись и снова на джоб.",
     "ru-RU-DmitryNeural", "-12%", "-12Hz"),

    # === Subject briefings (Russian track) ===
    ("subj_russian_1",
     "Эй, choom. Wakako дала наводку: в Watson висит Lang-Net Hub — старый узел, по которому корпы качают русский. Если хочешь под них слиться, надо знать орфоэпию, части речи и прочую базу.",
     "ru-RU-DmitryNeural", "+0%", "+0Hz"),
    ("subj_russian_2",
     "Палишься на ударении — палишься как чужой. Это не шутка. Один промах и охрана увидит в тебе scaver'а из Pacifica.",
     "ru-RU-DmitryNeural", "+0%", "+0Hz"),
    ("subj_russian_3",
     "Lang-net ждёт. Соберись, samurai.",
     "ru-RU-DmitryNeural", "+0%", "+0Hz"),

    # === Subject briefings (Literature) ===
    ("subj_lit_1",
     "Самый странный джоб. Wakako коллекционирует pre-collapse archives — литературу до катастрофы. Платит eddies за каждый recovered fragment.",
     "ru-RU-DmitryNeural", "+0%", "+0Hz"),
    ("subj_lit_2",
     "Это не школа, choom. Это lore Земли до Night City. Толстой, Крылов, Пушкин — реальные нетраннеры своего времени, только вместо ICE'а они ломали человеческие головы.",
     "ru-RU-DmitryNeural", "+0%", "+0Hz"),
    ("subj_lit_3",
     "Прочитай fragment, ответь на verify-questions. Wakako получает датапад, ты — eddies. Поехали.",
     "ru-RU-DmitryNeural", "+0%", "+0Hz"),

    # === Subject briefings (Math) ===
    ("subj_math_1",
     "Самый горячий джоб. Arasaka шлёт зашифрованные пакеты по City Center. Калькулятор не дашь — корпы засекут сигнатуру.",
     "ru-RU-DmitryNeural", "+0%", "+0Hz"),
    ("subj_math_2",
     "Считаешь в голове. Арифметика, текстовые задачи, геометрия. За каждый decrypted packet — eddies. За провал — алёрт по Arasaka-сети.",
     "ru-RU-DmitryNeural", "+0%", "+0Hz"),
    ("subj_math_3",
     "Готов, samurai? Wake up. We have crypto to break.",
     "ru-RU-DmitryNeural", "+0%", "+0Hz"),

    # === Subject briefings (CP Lore) ===
    ("subj_cp_1",
     "Slow your roll, choom. Wakako хочет проверить, реально ли ты знаешь Night City или просто tourist из Watson.",
     "ru-RU-DmitryNeural", "+0%", "+0Hz"),
    ("subj_cp_2",
     "Lore-test: персонажи, корпы, локации, главные миссии. Если ты watched, как папа проходит — должен знать кто такая Judy, что такое Konpeki Plaza, и почему Адам Смэшер — это конец.",
     "ru-RU-DmitryNeural", "+0%", "+0Hz"),
    ("subj_cp_3",
     "Готов, samurai? Лучшие edgerunners знают город как свои импланты.",
     "ru-RU-DmitryNeural", "+0%", "+0Hz"),

    # === Subject endings ===
    ("subj_end_russian_win",
     "Lang-net пройден. Ты сошёл за своего, choom. Eddies на счёт, callsign в Street Hall.",
     "ru-RU-DmitryNeural", "+0%", "+0Hz"),
    ("subj_end_lit_win",
     "Wakako получила архив. Pre-collapse fragment recovered, choom. Eddies тебе на счёт — заслужил место в Street Hall.",
     "ru-RU-DmitryNeural", "+0%", "+0Hz"),
    ("subj_end_math_win",
     "Crypto break. Чисто. Arasaka не догадывается, что их шифры расшифровывает netrunner-стажёр. Eddies на счёт, callsign в Street Hall.",
     "ru-RU-DmitryNeural", "+0%", "+0Hz"),
    ("subj_end_cp_win",
     "Preem lore-runner. Wakako впечатлена — ты реальный fan Night City. Eddies на счёт, choom.",
     "ru-RU-DmitryNeural", "+0%", "+0Hz"),
    ("subj_end_russian_lose",
     "Lang-net тебя спалил, choom. Орфоэпия — не шутка. Перезапустись, разберись с правилами и обратно в Watson.",
     "ru-RU-DmitryNeural", "-12%", "-12Hz"),
    ("subj_end_lit_lose",
     "Архив не recovered. Wakako в ярости. Перечитай fragment повнимательнее — детали важны.",
     "ru-RU-DmitryNeural", "-12%", "-12Hz"),
    ("subj_end_math_lose",
     "Корпы засекли неверный decrypt. Алёрт по сети. Перезапустись, считай аккуратнее, choom.",
     "ru-RU-DmitryNeural", "-12%", "-12Hz"),
    ("subj_end_cp_lose",
     "Пересмотри cutscenes, gonk. Edgerunner, который не знает Adam Smasher'a, долго не живёт.",
     "ru-RU-DmitryNeural", "-12%", "-12Hz"),
]


async def render_one(stem: str, text: str, voice: str, rate: str, pitch: str) -> tuple[str, int]:
    out = OUT_DIR / f"{stem}.mp3"
    communicate = edge_tts.Communicate(text=text, voice=voice, rate=rate, pitch=pitch)
    await communicate.save(str(out))
    return stem, out.stat().st_size


async def main():
    print(f"Output dir: {OUT_DIR}")
    print(f"Generating {len(LINES)} files via Edge TTS Neural...")
    print("-" * 60)
    tasks = [render_one(*line) for line in LINES]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    ok = 0
    for i, r in enumerate(results):
        stem = LINES[i][0]
        if isinstance(r, Exception):
            print(f"  ✗ {stem:30s} ERROR: {r}")
        else:
            print(f"  ✓ {r[0]:30s} {r[1]:>7,} bytes")
            ok += 1
    print("-" * 60)
    print(f"Done: {ok}/{len(LINES)}")
    sys.exit(0 if ok == len(LINES) else 1)


if __name__ == "__main__":
    asyncio.run(main())
