import { motion } from 'framer-motion';
import { Layout } from '../components/Layout';
import { GlitchTitle } from '../components/GlitchTitle';
import { HudFrame } from '../components/HudFrame';
import { DialogueBlock } from '../components/DialogueBlock';
import { BigMap } from '../components/BigMap';
import { useGame, getMissionsForSubject } from '../store/gameStore';
import { interMission } from '../data/dialogues';
import { playClick } from '../utils/audio';

export const MapScreen = () => {
  const { results, goToMission, setStage, selectedSubject } = useGame();

  // Only count results for missions of the current subject
  const missions = getMissionsForSubject(selectedSubject);
  const subjectResults = missions.filter((m) => results[m.id]);
  const completed = subjectResults.length;
  const allDone = completed >= missions.length;
  const next = missions[completed];

  // Inter-mission dialogue only makes sense for English (multi-mission flow)
  const lines = selectedSubject === 'english' ? interMission[completed] : undefined;

  const handleStart = (idx: number) => {
    playClick();
    goToMission(idx);
  };

  const handleFinale = () => {
    playClick();
    setStage('finale');
  };

  return (
    <Layout selectableMap>
      <div className="space-y-5">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="label-tag">// FREE ROAM</div>
            <GlitchTitle text="NIGHT CITY · OPS BOARD" className="text-2xl lg:text-4xl text-nc-yellow" />
          </div>
          <div className="font-mono text-xs text-nc-muted text-right">
            {allDone ? (
              <span className="text-nc-green">▣ ALL DISTRICTS CLEARED · DEBRIEF READY</span>
            ) : next ? (
              <>
                <div className="text-nc-yellow">▶ NEXT: {next.districtTag}</div>
                <div>Кликни жёлтую точку на карте</div>
              </>
            ) : null}
          </div>
        </div>

        {/* THE BIG MAP — main visual element */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          <BigMap onSelect={handleStart} />
        </motion.div>

        {lines && lines.length > 0 && (
          <HudFrame label="COMMS · INCOMING" color="cyan" className="p-5 bg-nc-dark/80">
            <DialogueBlock lines={lines} />
          </HudFrame>
        )}

        {!allDone && next && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <HudFrame label={`NEXT JOB · 0${completed + 1}`} color="yellow" className="p-5 lg:p-6 bg-nc-dark/85">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <div className="font-display text-2xl lg:text-3xl text-nc-yellow tracking-wider">
                    {next.title}
                  </div>
                  <div className="font-mono text-nc-cyan text-sm mt-1">{next.subtitle}</div>
                  <div className="font-mono text-sm text-nc-muted mt-2">
                    Локация: <span className="text-nc-text">{next.districtTag}</span> · Skill:{' '}
                    <span className="text-nc-text uppercase">{next.skill}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="cyber-btn cyber-btn-yellow text-base"
                  onClick={() => handleStart(completed)}
                >
                  ▶ ACCEPT JOB
                </button>
              </div>
            </HudFrame>
          </motion.div>
        )}

        {allDone && (
          <HudFrame label="ALL JOBS CLEARED" color="green" className="p-5 lg:p-6 bg-nc-dark/85">
            <div className="space-y-4">
              <div className="font-mono text-nc-text">
                {missions.length === 1
                  ? 'Датапад в кармане. Wakako ждёт отчёт. Жми DEBRIEF чтобы увидеть результат.'
                  : `Все ${missions.length} датапада у тебя. Wakako ждёт отчёт. Жми DEBRIEF чтобы увидеть результат.`}
              </div>
              <button type="button" onClick={handleFinale} className="cyber-btn cyber-btn-yellow text-base">
                ▶ DEBRIEF · SHOW RESULTS
              </button>
            </div>
          </HudFrame>
        )}

        <HudFrame label="JOB BOARD" color="purple" className="p-4 bg-nc-dark/70">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {missions.map((m, i) => {
              const r = results[m.id];
              const status = r ? 'DONE' : i === completed ? 'AVAILABLE' : 'LOCKED';
              const tone =
                r ? 'border-nc-green/60 text-nc-green'
                : i === completed ? 'border-nc-yellow/60 text-nc-yellow'
                : 'border-nc-muted/30 text-nc-muted';
              return (
                <div key={m.id} className={`border ${tone} p-3 bg-nc-black/40`}>
                  <div className="flex items-center justify-between font-display text-xs tracking-widest">
                    <span>0{i + 1} · {m.districtTag}</span>
                    <span>{status}</span>
                  </div>
                  <div className="font-mono text-nc-text mt-1 text-sm">{m.title}</div>
                  <div className="font-mono text-xs text-nc-muted mt-1">
                    {r ? `${r.earned}/${m.maxPoints} pts` : `0/${m.maxPoints} pts`}
                  </div>
                </div>
              );
            })}
          </div>
        </HudFrame>
      </div>
    </Layout>
  );
};
