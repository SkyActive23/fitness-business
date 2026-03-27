'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useIntervalTimer } from '@/app/Context/IntervalTimerComplex';

export default function IntervalClockPage() {
  const pageTimerRef = useRef<HTMLDivElement | null>(null);
  const [isPageFullscreen, setIsPageFullscreen] = useState(false);

  const {
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
    totalIntervals,
    timeLeft,
    isRunning,
    totalSessionTime,
    progressPercent,
    nextLabel,
    timerTheme,
    formatTime,
    startClock,
    pauseClock,
    resetClock,
  } = useIntervalTimer();

  const handlePageFullscreen = async () => {
    try {
      if (document.fullscreenElement === pageTimerRef.current) {
        await document.exitFullscreen();
      } else {
        await pageTimerRef.current?.requestFullscreen();
      }
    } catch (error) {
      console.error('Page fullscreen error:', error);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsPageFullscreen(document.fullscreenElement === pageTimerRef.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const phaseLabel =
    phase === 'idle'
      ? 'READY'
      : phase === 'work'
      ? 'WORK'
      : phase === 'rest'
      ? 'REST'
      : 'COMPLETE';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-400 to-slate-700 text-white px-4 py-10 pt-24 mt-5">
      <div className="max-w-4xl mx-auto">
        {!isPageFullscreen && (
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

            <h1 className="text-4xl font-bold text-center mt-8 mb-8">Interval Clock</h1>

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
                    className="px-3 py-3 rounded bg-slate-700 border border-white text-lg disabled:opacity-60"
                    placeholder="Minutes"
                  />
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={workSeconds}
                    onChange={(e) => setWorkSeconds(e.target.value)}
                    disabled={isRunning}
                    className="px-3 py-3 rounded bg-slate-700 border border-white text-lg disabled:opacity-60"
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
                    className="px-3 py-3 rounded bg-slate-700 border border-white text-lg disabled:opacity-60"
                    placeholder="Minutes"
                  />
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={restSeconds}
                    onChange={(e) => setRestSeconds(e.target.value)}
                    disabled={isRunning}
                    className="px-3 py-3 rounded bg-slate-700 border border-white text-lg disabled:opacity-60"
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
                  className="w-full px-3 py-3 rounded bg-slate-700 border border-white text-lg disabled:opacity-60"
                />
              </div>
            </div>
          </>
        )}

        <div
          ref={pageTimerRef}
          className={
            isPageFullscreen
              ? `fixed inset-0 z-[200] bg-gradient-to-br ${timerTheme}`
              : ''
          }
        >
          <div
            className={`rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-gradient-to-br ${timerTheme} ${
              isPageFullscreen
                ? 'w-full h-full rounded-none border-0 flex items-center justify-center p-6 md:p-12'
                : 'mt-10 p-6 md:p-10'
            }`}
          >
            <div
              className={`w-full ${
                isPageFullscreen ? 'max-w-none' : 'max-w-3xl mx-auto'
              }`}
            >
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
                  onClick={handlePageFullscreen}
                  className="bg-black/25 backdrop-blur-sm px-4 py-2 md:px-5 md:py-3 rounded-xl font-bold text-sm md:text-base hover:bg-white hover:text-slate-900 transition"
                >
                  {isPageFullscreen ? 'Exit Full Screen' : 'Full Screen'}
                </button>
              </div>

              <div className="w-full bg-black/20 rounded-full h-4 md:h-5 overflow-hidden mb-8">
                <div
                  className="h-full bg-white transition-all duration-500"
                  style={{ width: `${Math.max(0, Math.min(progressPercent, 100))}%` }}
                />
              </div>

              <div className="text-center py-6 md:py-10">
                <div
                  className={`text-white/80 font-semibold tracking-[0.3em] mb-4 ${
                    isPageFullscreen ? 'text-lg md:text-2xl' : 'text-base md:text-xl'
                  }`}
                >
                  {phase === 'done' ? 'SESSION COMPLETE' : `NEXT: ${nextLabel.toUpperCase()}`}
                </div>

                <div
                  className={`font-black leading-none tracking-tight ${
                    isPageFullscreen
                      ? 'text-[5rem] sm:text-[7rem] md:text-[10rem] lg:text-[12rem]'
                      : 'text-[4rem] sm:text-[5rem] md:text-[7rem]'
                  }`}
                >
                  {formatTime(timeLeft)}
                </div>

                <div
                  className={`mt-6 text-white/85 ${
                    isPageFullscreen ? 'text-xl md:text-2xl' : 'text-lg'
                  }`}
                >
                  Total Session: {formatTime(totalSessionTime)}
                </div>
              </div>

              <div
                className={`grid gap-4 mt-8 ${
                  isPageFullscreen ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-3'
                }`}
              >
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}