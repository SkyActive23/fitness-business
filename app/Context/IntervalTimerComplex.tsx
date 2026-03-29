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
  toggleFullscreen: () => Promise<void>;
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
    const mins = Number(workMinutes) || 0;
    const secs = Number(workSeconds) || 0;
    return mins * 60 + secs;
  }, [workMinutes, workSeconds]);

  const restTotal = useMemo(() => {
    const mins = Number(restMinutes) || 0;
    const secs = Number(restSeconds) || 0;
    return mins * 60 + secs;
  }, [restMinutes, restSeconds]);

  const totalIntervals = useMemo(() => {
    const value = Number(intervals) || 1;
    return Math.max(1, value);
  }, [intervals]);

  const totalSessionTime = useMemo(() => {
    return workTotal * totalIntervals + restTotal * Math.max(totalIntervals - 1, 0);
  }, [workTotal, restTotal, totalIntervals]);

  const currentPhaseTotal = useMemo(() => {
    if (phase === 'work') return workTotal;
    if (phase === 'rest') return restTotal;
    if (phase === 'idle') return workTotal;
    return 0;
  }, [phase, workTotal, restTotal]);

  const progressPercent = useMemo(() => {
    if (currentPhaseTotal <= 0) return 0;
    return ((currentPhaseTotal - timeLeft) / currentPhaseTotal) * 100;
  }, [currentPhaseTotal, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startClock = () => {
    if (workTotal <= 0) return;

    if (phase === 'idle' || phase === 'done') {
      setPhase('work');
      setCurrentInterval(1);
      setTimeLeft(workTotal);
    }

    setIsRunning(true);
  };

  const pauseClock = () => {
    setIsRunning(false);
  };

  const resetClock = () => {
    setIsRunning(false);
    setPhase('idle');
    setCurrentInterval(1);
    setTimeLeft(workTotal > 0 ? workTotal : 0);
    setIsWidgetOpen(false);
    setIsPseudoFullscreen(false);

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  const toggleFullscreen = async () => {
    const el = timerRef.current;
    if (!el) return;

    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isIPhoneLike = /iPhone|iPod/i.test(ua);

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsPseudoFullscreen(false);
        return;
      }

      if (isPseudoFullscreen) {
        setIsPseudoFullscreen(false);
        return;
      }

      if (typeof el.requestFullscreen === 'function' && !isIPhoneLike) {
        await el.requestFullscreen();
        setIsPseudoFullscreen(false);
        return;
      }

      setIsPseudoFullscreen(true);
    } catch (error) {
      console.error('Fullscreen error:', error);
      setIsPseudoFullscreen((prev) => !prev);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement) {
        setIsPseudoFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (phase === 'idle') {
      setTimeLeft(workTotal > 0 ? workTotal : 0);
    }
  }, [workTotal, phase]);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev > 1) return prev - 1;

        if (phase === 'work') {
          if (currentInterval >= totalIntervals) {
            setPhase('done');
            setIsRunning(false);
            return 0;
          }

          if (restTotal > 0) {
            setPhase('rest');
            return restTotal;
          }

          setCurrentInterval((old) => old + 1);
          setPhase('work');
          return workTotal;
        }

        if (phase === 'rest') {
          setCurrentInterval((old) => old + 1);
          setPhase('work');
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
  const context = useContext(IntervalTimerContext);
  if (!context) {
    throw new Error('useIntervalTimer must be used within IntervalTimerProvider');
  }
  return context;
}