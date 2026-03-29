'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type Phase = 'idle' | 'work' | 'rest' | 'done';

type IntervalTimerContextType = {
  workMinutes: string;
  setWorkMinutes: (value: string) => void;
  workSeconds: string;
  setWorkSeconds: (value: string) => void;
  restMinutes: string;
  setRestMinutes: (value: string) => void;
  restSeconds: string;
  setRestSeconds: (value: string) => void;
  intervals: string;
  setIntervals: (value: string) => void;

  phase: Phase;
  currentInterval: number;
  timeLeft: number;
  isRunning: boolean;

  isFullscreen: boolean;
  isPseudoFullscreen: boolean;
  isWidgetOpen: boolean;
  setIsWidgetOpen: (value: boolean) => void;

  timerRef: React.RefObject<HTMLDivElement | null>;

  workTotal: number;
  restTotal: number;
  totalIntervals: number;
  totalSessionTime: number;
  currentPhaseTotal: number;
  progressPercent: number;
  phaseLabel: string;
  nextLabel: string;
  timerTheme: string;

  formatTime: (seconds: number) => string;
  startClock: () => void;
  pauseClock: () => void;
  resetClock: () => void;
  toggleFullscreen: (target?: HTMLDivElement | null) => Promise<void>;
};

const IntervalTimerContext = createContext<IntervalTimerContextType | undefined>(
  undefined
);

export function IntervalTimerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const timerRef = useRef<HTMLDivElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPseudoFullscreen, setIsPseudoFullscreen] = useState(false);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);

  const [workMinutes, setWorkMinutes] = useState('0');
  const [workSeconds, setWorkSeconds] = useState('30');
  const [restMinutes, setRestMinutes] = useState('0');
  const [restSeconds, setRestSeconds] = useState('15');
  const [intervals, setIntervals] = useState('5');

  const [phase, setPhase] = useState<Phase>('idle');
  const [currentInterval, setCurrentInterval] = useState(1);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isRunning, setIsRunning] = useState(false);

  const workTotal = useMemo(() => {
    return (Number(workMinutes) || 0) * 60 + (Number(workSeconds) || 0);
  }, [workMinutes, workSeconds]);

  const restTotal = useMemo(() => {
    return (Number(restMinutes) || 0) * 60 + (Number(restSeconds) || 0);
  }, [restMinutes, restSeconds]);

  const totalIntervals = useMemo(() => {
    return Math.max(1, Number(intervals) || 1);
  }, [intervals]);

  const totalSessionTime = useMemo(() => {
    return workTotal * totalIntervals + restTotal * Math.max(totalIntervals - 1, 0);
  }, [workTotal, restTotal, totalIntervals]);

  const currentPhaseTotal = useMemo(() => {
    if (phase === 'work') return workTotal;
    if (phase === 'rest') return restTotal;
    return workTotal;
  }, [phase, workTotal, restTotal]);

  const progressPercent = useMemo(() => {
    if (currentPhaseTotal <= 0) return 0;
    return ((currentPhaseTotal - timeLeft) / currentPhaseTotal) * 100;
  }, [currentPhaseTotal, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // 🔊 AUDIO ENGINE
  const getAudioContext = async () => {
    if (!audioContextRef.current) {
      const AudioCtx =
        window.AudioContext ||
        // @ts-ignore
        window.webkitAudioContext;

      audioContextRef.current = new AudioCtx();
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    return audioContextRef.current;
  };

  const playBeep = async (
    frequency = 1200,
    duration = 0.12,
    volume = 0.2,
    type: OscillatorType = 'square'
  ) => {
    const ctx = await getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  const playStartBeep = async () => {
    await playBeep(1400, 0.15, 0.25, 'square');
  };

  const playRestBeep = async () => {
    await playBeep(900, 0.18, 0.18, 'triangle');
  };

  const playCountdownBeep = async () => {
    await playBeep(1800, 0.06, 0.2, 'square');
  };

  const playCompleteBeep = async () => {
    await playBeep(1200, 0.12, 0.25);
    setTimeout(() => {
      playBeep(1600, 0.15, 0.3);
    }, 140);
  };

  const startClock = async () => {
    if (workTotal <= 0) return;

    const fresh = phase === 'idle' || phase === 'done';

    if (fresh) {
      setPhase('work');
      setCurrentInterval(1);
      setTimeLeft(workTotal);
      await playStartBeep();
    }

    setIsRunning(true);
  };

  const pauseClock = () => setIsRunning(false);

  const resetClock = () => {
    setIsRunning(false);
    setPhase('work');
    setCurrentInterval(1);
    setTimeLeft(workTotal);
  };

  const toggleFullscreen = async (target?: HTMLDivElement | null) => {
    const el = target ?? timerRef.current;
    if (!el) return;

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      setIsPseudoFullscreen(false);
      return;
    }

    try {
      await el.requestFullscreen();
    } catch {
      setIsPseudoFullscreen(true);
    }
  };

  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement) setIsPseudoFullscreen(false);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev > 1) {
          const next = prev - 1;

          if (next <= 3) {
            playCountdownBeep();
          }

          return next;
        }

        if (phase === 'work') {
          if (currentInterval >= totalIntervals) {
            setPhase('done');
            setIsRunning(false);
            playCompleteBeep();
            return 0;
          }

          if (restTotal > 0) {
            setPhase('rest');
            playRestBeep();
            return restTotal;
          }

          setCurrentInterval((c) => c + 1);
          playStartBeep();
          return workTotal;
        }

        if (phase === 'rest') {
          setCurrentInterval((c) => c + 1);
          setPhase('work');
          playStartBeep();
          return workTotal;
        }

        return 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, phase, currentInterval, totalIntervals, workTotal, restTotal]);

  const phaseLabel =
    phase === 'idle'
      ? 'READY'
      : phase === 'work'
      ? 'WORK'
      : phase === 'rest'
      ? 'REST'
      : 'COMPLETE';

  const nextLabel =
    phase === 'work'
      ? currentInterval >= totalIntervals
        ? 'Finish'
        : restTotal > 0
        ? 'Rest'
        : `Work ${currentInterval + 1}`
      : phase === 'rest'
      ? `Work ${currentInterval + 1}`
      : 'Start';

  const timerTheme =
    phase === 'work'
      ? 'from-emerald-500 to-green-700'
      : phase === 'rest'
      ? 'from-amber-400 to-orange-600'
      : phase === 'done'
      ? 'from-slate-500 to-slate-700'
      : 'from-slate-600 to-slate-800';

  return (
    <IntervalTimerContext.Provider
      value={{
        workMinutes,
        setWorkMinutes,
        workSeconds,
        setWorkSeconds,
        restMinutes,
        setRestMinutes,
        restSeconds,
        setRestSeconds,
        intervals,
        setIntervals,
        phase,
        currentInterval,
        timeLeft,
        isRunning,
        isFullscreen,
        isPseudoFullscreen,
        isWidgetOpen,
        setIsWidgetOpen,
        timerRef,
        workTotal,
        restTotal,
        totalIntervals,
        totalSessionTime,
        currentPhaseTotal,
        progressPercent,
        phaseLabel,
        nextLabel,
        timerTheme,
        formatTime,
        startClock,
        pauseClock,
        resetClock,
        toggleFullscreen,
      }}
    >
      {children}
    </IntervalTimerContext.Provider>
  );
}

export function useIntervalTimer() {
  const ctx = useContext(IntervalTimerContext);
  if (!ctx) throw new Error('Must be used inside provider');
  return ctx;
}