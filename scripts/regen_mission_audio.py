#!/usr/bin/env python3
"""
Pre-render Edge Neural TTS for every mission datapad + question in missions.json.

Why: current MissionGenericQuiz falls back to Web Speech API for in-mission
"▶ ОЗВУЧИТЬ" buttons — that's the browser-default synthetic voice the kid
calls "синтезированная хуета". Briefings already have pre-rendered Dmitry/
Svetlana MP3s; this script does the same for all mission content.

Output: public/sounds/missions/<mission>_<variant>_<key>.mp3
  - key=datapad for the variant's datapad text
  - key=Q1..Q5 for each question prompt

Voice: ru-RU-DmitryNeural for everything (consistent narrator), normal rate/pitch.
"""
import asyncio
import json
import re
from pathlib import Path

import edge_tts

ROOT = Path(__file__).parent.parent
MISSIONS_JSON = ROOT / "src" / "data" / "missions.json"
OUT_DIR = ROOT / "public" / "sounds" / "missions"
OUT_DIR.mkdir(parents=True, exist_ok=True)

VOICE = "ru-RU-DmitryNeural"

# Strip leading machine-prefixes like "[wakako.call] " / "[arasaka_packet.enc] "
# so the narrator doesn't read out terminal codes character-by-character.
NOISE_PREFIX_RE = re.compile(r"^\[[a-z_]+(?:\.[a-z]+)?\]\s*", re.IGNORECASE)


def clean(text: str) -> str:
    """Strip noise so TTS reads natural prose."""
    if not text:
        return ""
    s = text
    # Drop terminal-code prefixes (one or more)
    while True:
        new = NOISE_PREFIX_RE.sub("", s)
        if new == s:
            break
        s = new
    # Collapse multiple newlines to a period for natural pause
    s = re.sub(r"\n\s*\n+", ". ", s)
    s = s.replace("\n", " ")
    return s.strip()


async def render(stem: str, text: str) -> tuple[str, int]:
    out = OUT_DIR / f"{stem}.mp3"
    if out.exists() and out.stat().st_size > 1000:
        return stem, out.stat().st_size  # skip already-rendered
    cleaned = clean(text)
    if not cleaned:
        return stem, 0
    com = edge_tts.Communicate(text=cleaned, voice=VOICE)
    await com.save(str(out))
    return stem, out.stat().st_size


async def main():
    data = json.load(open(MISSIONS_JSON))
    jobs: list[tuple[str, str]] = []
    for m in data["missions"]:
        mid = m["id"]
        variants = m.get("variants", [])
        # Handle legacy single-variant missions (m4 NCPD has no variants)
        if not variants and m.get("questions"):
            variants = [{"id": "default", **m}]
        for v in variants:
            vid = v.get("id", "default")
            if v.get("datapad"):
                jobs.append((f"{mid}__{vid}__datapad", v["datapad"]))
            for q in v.get("questions", []):
                jobs.append((f"{mid}__{vid}__{q['id']}", q["prompt"]))
            # m3 has blanks rather than questions; we skip prompting those
            # since each blank is just a single missing word in a sentence.

    print(f"Total audio jobs: {len(jobs)}")
    print(f"Output: {OUT_DIR}")
    print("-" * 70)

    # Throttle parallel calls — Edge TTS rejects bursts >~20 concurrent
    sem = asyncio.Semaphore(8)

    async def worker(stem: str, text: str):
        async with sem:
            try:
                return await render(stem, text)
            except Exception as e:
                return (stem, f"ERR: {e}")

    results = await asyncio.gather(*(worker(s, t) for s, t in jobs))
    ok = 0
    failed = []
    for s, sz in results:
        if isinstance(sz, str):
            failed.append((s, sz))
        elif sz > 0:
            ok += 1
    print(f"OK: {ok}/{len(jobs)}")
    if failed:
        print("FAILED:")
        for s, e in failed[:10]:
            print(f"  {s}: {e}")


if __name__ == "__main__":
    asyncio.run(main())
