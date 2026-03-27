'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';

type Phase = 'idle' | 'work' | 'rest' | 'done';

export default function IntervalClockPage() {
  const timerRef = useRef<HTMLDivElement | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);

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
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await timerRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-400 to-slate-700 text-white px-4 py-10 pt-24 mt-5">
      <div className="max-w-4xl mx-auto">
        {!isFullscreen && (
          <>
            <div className="flex justify-center mb-8">
              <div className="w-full max-w-md aspect-[4/3] bg-slate-800 rounded-lg shadow-2xl flex items-center justify-center p-6">
                <Image
                  src="/images/logos/logoFT.png"
                  alt="FineTuned Logo"
                  width={250}
                  height={250}
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <hr className="border-t border-4 rounded-full border-slate-200 w-4/5 mx-auto my-12" />

            <h1 className="text-4xl font-bold text-center mt-8 mb-8">
              Interval Clock
            </h1>

            <div className="space-y-6">
              <div>
                <label className="block mb-2 text-lg font-medium">Work Time</label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    min={0}
                    value={workMinutes}
                    onChange={(e) => setWorkMinutes(e.target.value)}
                    disabled={isRunning}
                    className="px-3 py-3 rounded bg-slate-700 border border-white text-lg"
                    placeholder="Minutes"
                  />
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={workSeconds}
                    onChange={(e) => setWorkSeconds(e.target.value)}
                    disabled={isRunning}
                    className="px-3 py-3 rounded bg-slate-700 border border-white text-lg"
                    placeholder="Seconds"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-lg font-medium">Rest Time</label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    min={0}
                    value={restMinutes}
                    onChange={(e) => setRestMinutes(e.target.value)}
                    disabled={isRunning}
                    className="px-3 py-3 rounded bg-slate-700 border border-white text-lg"
                    placeholder="Minutes"
                  />
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={restSeconds}
                    onChange={(e) => setRestSeconds(e.target.value)}
                    disabled={isRunning}
                    className="px-3 py-3 rounded bg-slate-700 border border-white text-lg"
                    placeholder="Seconds"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-lg font-medium">Intervals</label>
                <input
                  type="number"
                  min={1}
                  value={intervals}
                  onChange={(e) => setIntervals(e.target.value)}
                  disabled={isRunning}
                  className="w-full px-3 py-3 rounded bg-slate-700 border border-white text-lg"
                />
              </div>
            </div>
          </>
        )}

        <div
          ref={timerRef}
          className={`mt-10 rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-gradient-to-br ${timerTheme} ${
            isFullscreen
              ? 'min-h-screen flex flex-col justify-center px-6 md:px-12'
              : 'p-6 md:p-10'
          }`}
        >
          <div className={`${isFullscreen ? 'max-w-none' : 'max-w-3xl mx-auto w-full'}`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm md:text-base uppercase tracking-[0.35em] text-white/80">
                  {phaseLabel}
                </p>
                <p className="text-sm md:text-base text-white/70 mt-2">
                  Interval {Math.min(currentInterval, totalIntervals)} / {totalIntervals}
                </p>
              </div>

              <button
                onClick={toggleFullscreen}
                className="bg-black/25 backdrop-blur-sm px-4 py-2 md:px-5 md:py-3 rounded-xl font-bold text-sm md:text-base hover:bg-white hover:text-slate-900 transition"
              >
                {isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
              </button>
            </div>

            <div className="w-full bg-black/20 rounded-full h-4 md:h-5 overflow-hidden mb-8">
              <div
                className="h-full bg-white transition-all duration-500"
                style={{ width: `${Math.max(0, Math.min(progressPercent, 100))}%` }}
              />
            </div>

            <div className="text-center py-6 md:py-10">
              <div className="text-white/80 font-semibold tracking-[0.3em] text-base md:text-xl mb-4">
                {phase === 'done' ? 'SESSION COMPLETE' : `NEXT: ${nextLabel.toUpperCase()}`}
              </div>

              <div
                className={`font-black leading-none tracking-tight ${
                  isFullscreen
                    ? 'text-[6rem] sm:text-[8rem] md:text-[11rem] lg:text-[13rem]'
                    : 'text-[4rem] sm:text-[5rem] md:text-[7rem]'
                }`}
              >
                {formatTime(timeLeft)}
              </div>

              <div className={`${isFullscreen ? 'mt-8 text-xl md:text-2xl' : 'mt-6 text-lg'} text-white/85`}>
                Total Session: {formatTime(totalSessionTime)}
              </div>
            </div>

            <div className={`grid gap-4 ${isFullscreen ? 'grid-cols-3 mt-10' : 'grid-cols-1 sm:grid-cols-3 mt-8'}`}>
              <button
                onClick={startClock}
                className="w-full rounded-2xl bg-black/25 backdrop-blur-sm py-4 md:py-5 font-black text-lg md:text-2xl hover:bg-white hover:text-slate-900 transition"
              >
                START
              </button>

              <button
                onClick={pauseClock}
                className="w-full rounded-2xl bg-black/25 backdrop-blur-sm py-4 md:py-5 font-black text-lg md:text-2xl hover:bg-white hover:text-slate-900 transition"
              >
                PAUSE
              </button>

              <button
                onClick={resetClock}
                className="w-full rounded-2xl bg-black/25 backdrop-blur-sm py-4 md:py-5 font-black text-lg md:text-2xl hover:bg-white hover:text-slate-900 transition"
              >
                RESET
              </button>
            </div>

            {!isFullscreen && phase === 'done' && (
              <div className="mt-8 text-center text-2xl font-bold">
                Workout Complete
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}