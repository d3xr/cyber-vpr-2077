export type Speaker = 'V' | 'JOHNNY' | 'DELAMAIN' | 'WAKAKO' | 'SYS';

export interface Line {
  speaker: Speaker;
  text: string;
  audioFile?: string;
}

const D = '/sounds/dialogue';

export const briefing: Line[] = [
  { speaker: 'SYS', text: '> NEURAL UPLINK ESTABLISHED ...' },
  { speaker: 'SYS', text: '> ENCRYPTED CALL // INCOMING' },
  {
    speaker: 'V',
    text: 'Эй, choom. Меня зовут V. Слышал, ты хочешь стать эджраннером в Night City? Уважаю.',
    audioFile: `${D}/briefing_v1.mp3`,
  },
  {
    speaker: 'V',
    text: 'Wakako Okada — наш фиксер в Вестбруке — заказала работу. Четыре датапада, четыре района. За каждый — eddies. Но фишка вот в чём: все переговоры идут на английском. Без исключений.',
    audioFile: `${D}/briefing_v2.mp3`,
  },
  {
    speaker: 'V',
    text: 'Готов, samurai? Тогда поехали. Burn this city.',
    audioFile: `${D}/briefing_v3.mp3`,
  },
];

export const johnnyVariant: Line[] = [
  { speaker: 'SYS', text: '> ANOMALY DETECTED // RELIC.dll ACTIVE' },
  {
    speaker: 'JOHNNY',
    text: 'Так-так. Ещё один gonk с амбициями. V занят — брифинг проведу я.',
    audioFile: `${D}/johnny_1.mp3`,
  },
  {
    speaker: 'JOHNNY',
    text: 'Wakako хочет данные. Четыре района. Английский — не подведи. Мне в твоей голове, конечно, не место. Но раз застрял — слушай и соберись.',
    audioFile: `${D}/johnny_2.mp3`,
  },
  {
    speaker: 'JOHNNY',
    text: 'Wake up, samurai. We have a city to burn.',
    audioFile: `${D}/johnny_3.mp3`,
  },
];

export const interMission: Record<number, Line[]> = {
  1: [
    {
      speaker: 'V',
      text: 'Preem job, choom. Один датапад в кармане. Eddies капают на счёт.',
      audioFile: `${D}/inter1_v.mp3`,
    },
    {
      speaker: 'DELAMAIN',
      text: 'Поздравляю с успешным завершением задачи. Подаю машину к следующей точке.',
      audioFile: `${D}/inter1_dela.mp3`,
    },
  ],
  2: [
    {
      speaker: 'JOHNNY',
      text: 'Не плохо для gonk\'а. Не плохо. Но впереди ещё работа.',
      audioFile: `${D}/inter2_johnny.mp3`,
    },
  ],
  3: [
    {
      speaker: 'V',
      text: 'ICE сломан — Wakako будет довольна. Финальный шаг: заполнить досье в NCPD. Не сачкуй.',
      audioFile: `${D}/inter3_v.mp3`,
    },
  ],
};

export const endingWin: Line[] = [
  {
    speaker: 'V',
    text: 'Preem job, choom. Eddies на счёт, callsign в Street Hall. Дальше — больше треков, новые варианты.',
    audioFile: `${D}/ending_win_v.mp3`,
  },
  {
    speaker: 'JOHNNY',
    text: 'Видишь, gonk. Я в тебя верил. Почти.',
    audioFile: `${D}/ending_win_johnny.mp3`,
  },
];

export const endingLose: Line[] = [
  {
    speaker: 'JOHNNY',
    text: 'Слушай, choom. На улицах Night City второго шанса не дают. Но это не улица, это ВПР. Перезапустись и снова на джоб.',
    audioFile: `${D}/ending_lose_johnny.mp3`,
  },
];

// =============================================================================
// SUBJECT-SPECIFIC BRIEFINGS
// Каждый трек получает собственный пролог от V — иначе кид сразу палит,
// что брифинг говорит про английский, а на карте русский/математика/литература.
// (Для английского остаётся «канонический» briefing с записанными аудиофайлами.)
// =============================================================================

import type { Subject } from '../types';

export const briefingBySubject: Record<Subject, Line[]> = {
  english: briefing,
  cyberpunk_history: [
    { speaker: 'SYS', text: '> NEURAL UPLINK ESTABLISHED ...' },
    { speaker: 'SYS', text: '> CHANNEL: WAKAKO-NET · LORE PROTOCOL' },
    {
      speaker: 'V',
      text: 'Slow your roll, choom. Wakako хочет проверить, реально ли ты знаешь Night City или просто tourist из Watson.',
      audioFile: `${D}/subj_cp_1.mp3`,
    },
    {
      speaker: 'V',
      text: 'Lore-test: персонажи, корпы, локации, главные миссии. Если ты watched, как папа проходит — должен знать кто такая Judy, что такое Konpeki Plaza, и почему Адам Смэшер — это конец.',
      audioFile: `${D}/subj_cp_2.mp3`,
    },
    {
      speaker: 'V',
      text: 'Готов, samurai? Лучшие edgerunners знают город как свои импланты.',
      audioFile: `${D}/subj_cp_3.mp3`,
    },
  ],
  russian: [
    { speaker: 'SYS', text: '> NEURAL UPLINK ESTABLISHED ...' },
    { speaker: 'SYS', text: '> CHANNEL: WATSON · LANG-NET HUB' },
    {
      speaker: 'V',
      text: 'Эй, choom. Wakako дала наводку: в Watson висит Lang-Net Hub — старый узел, по которому корпы качают русский. Если хочешь под них слиться, надо знать орфоэпию, части речи и прочую базу.',
      audioFile: `${D}/subj_russian_1.mp3`,
    },
    {
      speaker: 'V',
      text: 'Палишься на ударении — палишься как чужой. Это не шутка. Один промах и охрана увидит в тебе scaver\'а из Pacifica.',
      audioFile: `${D}/subj_russian_2.mp3`,
    },
    {
      speaker: 'V',
      text: 'Lang-net ждёт. Соберись, samurai.',
      audioFile: `${D}/subj_russian_3.mp3`,
    },
  ],
  literature: [
    { speaker: 'SYS', text: '> NEURAL UPLINK ESTABLISHED ...' },
    { speaker: 'SYS', text: '> CHANNEL: HEYWOOD · OLD MOSCOW DATABANKS' },
    {
      speaker: 'V',
      text: 'Самый странный джоб. Wakako коллекционирует pre-collapse archives — литературу до катастрофы. Платит eddies за каждый recovered fragment.',
      audioFile: `${D}/subj_lit_1.mp3`,
    },
    {
      speaker: 'V',
      text: 'Это не школа, choom. Это lore Земли до Night City. Толстой, Крылов, Пушкин — реальные нетраннеры своего времени, только вместо ICE\'а они ломали человеческие головы.',
      audioFile: `${D}/subj_lit_2.mp3`,
    },
    {
      speaker: 'V',
      text: 'Прочитай fragment, ответь на verify-questions. Wakako получает датапад, ты — eddies. Поехали.',
      audioFile: `${D}/subj_lit_3.mp3`,
    },
  ],
  math: [
    { speaker: 'SYS', text: '> NEURAL UPLINK ESTABLISHED ...' },
    { speaker: 'SYS', text: '> CHANNEL: CITY CENTER · ARASAKA TOWER' },
    {
      speaker: 'V',
      text: 'Самый горячий джоб. Arasaka шлёт зашифрованные пакеты по City Center. Калькулятор не дашь — корпы засекут сигнатуру.',
      audioFile: `${D}/subj_math_1.mp3`,
    },
    {
      speaker: 'V',
      text: 'Считаешь в голове. Арифметика, текстовые задачи, геометрия. За каждый decrypted packet — eddies. За провал — алёрт по Arasaka-сети.',
      audioFile: `${D}/subj_math_2.mp3`,
    },
    {
      speaker: 'V',
      text: 'Готов, samurai? Wake up. We have crypto to break.',
      audioFile: `${D}/subj_math_3.mp3`,
    },
  ],
};

export const endingWinBySubject: Record<Subject, Line[]> = {
  english: endingWin,
  cyberpunk_history: [
    {
      speaker: 'V',
      text: 'Preem lore-runner. Wakako впечатлена — ты реальный fan Night City. Eddies на счёт, choom.',
      audioFile: `${D}/subj_end_cp_win.mp3`,
    },
  ],
  russian: [
    {
      speaker: 'V',
      text: 'Lang-net пройден. Ты сошёл за своего, choom. Eddies на счёт, callsign в Street Hall.',
      audioFile: `${D}/subj_end_russian_win.mp3`,
    },
  ],
  literature: [
    {
      speaker: 'V',
      text: 'Wakako получила архив. Pre-collapse fragment recovered, choom. Eddies тебе на счёт — заслужил место в Street Hall.',
      audioFile: `${D}/subj_end_lit_win.mp3`,
    },
  ],
  math: [
    {
      speaker: 'V',
      text: 'Crypto break. Чисто. Arasaka не догадывается, что их шифры расшифровывает netrunner-стажёр. Eddies на счёт, callsign в Street Hall.',
      audioFile: `${D}/subj_end_math_win.mp3`,
    },
  ],
};

export const endingLoseBySubject: Record<Subject, Line[]> = {
  english: endingLose,
  cyberpunk_history: [
    {
      speaker: 'JOHNNY',
      text: 'Пересмотри cutscenes, gonk. Edgerunner, который не знает Adam Smasher\'a, долго не живёт.',
      audioFile: `${D}/subj_end_cp_lose.mp3`,
    },
  ],
  russian: [
    {
      speaker: 'JOHNNY',
      text: 'Lang-net тебя спалил, choom. Орфоэпия — не шутка. Перезапустись, разберись с правилами и обратно в Watson.',
      audioFile: `${D}/subj_end_russian_lose.mp3`,
    },
  ],
  literature: [
    {
      speaker: 'JOHNNY',
      text: 'Архив не recovered. Wakako в ярости. Перечитай fragment повнимательнее — детали важны.',
      audioFile: `${D}/subj_end_lit_lose.mp3`,
    },
  ],
  math: [
    {
      speaker: 'JOHNNY',
      text: 'Корпы засекли неверный decrypt. Алёрт по сети. Перезапустись, считай аккуратнее, choom.',
      audioFile: `${D}/subj_end_math_lose.mp3`,
    },
  ],
};
