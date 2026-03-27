'use client';

import { useEffect, useRef, useState } from 'react';
import { useIntervalTimer } from '@/app/Context/IntervalTimerComplex';

export default function GlobalIntervalClock() {
  const {
    isFullscreen,
    isWidgetOpen,
    setIsWidgetOpen,
    phase,
    phaseLabel,
    currentInterval,
    totalIntervals,
    timeLeft,
    totalSessionTime,
    progressPercent,
    nextLabel,
    timerTheme,
    formatTime,
    startClock,
    pauseClock,
    resetClock,
    toggleFullscreen,
    timerRef,
  } = useIntervalTimer();

  const hasActiveTimer = phase !== 'idle';

  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingWidget, setIsDraggingWidget] = useState(false);
  const [isDraggingClosed, setIsDraggingClosed] = useState(false);

  const closedButtonRef = useRef<HTMLButtonElement | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);

  const defaultClosedStyle = {
    left: '50%',
    bottom: '24px',
    transform: 'translateX(-50%)',
  } as const;

  const handleWidgetMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isFullscreen) return;
    if (!timerRef.current) return;

    const rect = timerRef.current.getBoundingClientRect();

    dragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
    };

    hasMovedRef.current = false;

    setPosition({
      x: rect.left,
      y: rect.top,
    });

    setIsDraggingWidget(true);
  };

  const handleClosedMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isFullscreen) return;
    if (!closedButtonRef.current) return;

    const rect = closedButtonRef.current.getBoundingClientRect();

    dragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
    };

    hasMovedRef.current = false;

    setPosition({
      x: rect.left,
      y: rect.top,
    });

    setIsDraggingClosed(true);
  };

  useEffect(() => {
    if (!isDraggingWidget && !isDraggingClosed) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = Math.abs(e.clientX - dragStartRef.current.x);
      const dy = Math.abs(e.clientY - dragStartRef.current.y);

      if (dx > 6 || dy > 6) {
        hasMovedRef.current = true;
      }

      const activeWidth = isDraggingWidget
        ? (timerRef.current?.offsetWidth ?? 420)
        : (closedButtonRef.current?.offsetWidth ?? 180);

      const activeHeight = isDraggingWidget
        ? (timerRef.current?.offsetHeight ?? 300)
        : (closedButtonRef.current?.offsetHeight ?? 56);

      const nextX = e.clientX - dragOffsetRef.current.x;
      const nextY = e.clientY - dragOffsetRef.current.y;

      const maxX = window.innerWidth - activeWidth;
      const maxY = window.innerHeight - activeHeight;

      setPosition({
        x: Math.max(0, Math.min(nextX, maxX)),
        y: Math.max(0, Math.min(nextY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDraggingWidget(false);
      setIsDraggingClosed(false);

      setTimeout(() => {
        hasMovedRef.current = false;
      }, 0);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingWidget, isDraggingClosed, timerRef]);

  const widgetDefaultClasses =
    'bottom-24 left-1/2 -translate-x-1/2 w-[420px] max-w-[calc(100vw-2rem)] rounded-3xl p-6';

  const widgetDraggedStyle =
    !isFullscreen && position
      ? {
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'none',
          width: '420px',
          maxWidth: 'calc(100vw - 2rem)',
        }
      : undefined;

  const closedDraggedStyle =
    !isFullscreen && position
      ? {
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'none',
        }
      : defaultClosedStyle;

  return (
    <>
      {!isFullscreen && hasActiveTimer && !isWidgetOpen && (
        <button
          ref={closedButtonRef}
          onMouseDown={handleClosedMouseDown}
          onClick={() => {
            if (!hasMovedRef.current) {
              setIsWidgetOpen(true);
            }
          }}
          style={closedDraggedStyle}
          className="fixed z-[100] rounded-full bg-slate-800 px-5 py-3 text-white font-bold shadow-2xl hover:bg-slate-700 transition cursor-move select-none"
        >
          {phaseLabel} {formatTime(timeLeft)}
        </button>
      )}

      {isWidgetOpen && hasActiveTimer && (
        <div
          ref={timerRef}
          style={widgetDraggedStyle}
          className={`fixed z-[100] bg-gradient-to-br ${timerTheme} text-white shadow-2xl border border-white/20 ${
            isFullscreen
              ? 'inset-0 rounded-none border-0 p-6 md:p-12'
              : position
              ? 'rounded-3xl p-6'
              : widgetDefaultClasses
          }`}
        >
          <div
            className={`w-full ${
              isFullscreen ? 'h-full flex flex-col justify-center max-w-none' : 'max-w-none'
            }`}
          >
            <div
              onMouseDown={handleWidgetMouseDown}
              className={`flex items-center justify-between mb-5 ${
                !isFullscreen ? 'cursor-move select-none' : ''
              }`}
            >
              <div>
                <p
                  className={`uppercase tracking-[0.35em] text-white/80 ${
                    isFullscreen ? 'text-sm md:text-base' : 'text-xs md:text-sm'
                  }`}
                >
                  {phaseLabel}
                </p>
                <p
                  className={`text-white/75 mt-2 ${
                    isFullscreen ? 'text-base md:text-lg' : 'text-sm'
                  }`}
                >
                  Interval {Math.min(currentInterval, totalIntervals)} / {totalIntervals}
                </p>
                {!isFullscreen && (
                  <p className="text-xs text-white/60 mt-1">Drag to move</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={toggleFullscreen}
                  className="rounded-xl bg-black/25 px-4 py-2 font-bold hover:bg-white hover:text-slate-900 transition"
                >
                  {isFullscreen ? 'Exit Full Screen' : 'Full'}
                </button>

                {!isFullscreen && (
                  <button
                    onClick={() => setIsWidgetOpen(false)}
                    className="rounded-xl bg-black/25 px-4 py-2 font-bold hover:bg-white hover:text-slate-900 transition"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>

            <div
              className={`w-full bg-black/20 rounded-full overflow-hidden mb-6 ${
                isFullscreen ? 'h-4 md:h-5 mb-8' : 'h-3'
              }`}
            >
              <div
                className="h-full bg-white transition-all duration-500"
                style={{ width: `${Math.max(0, Math.min(progressPercent, 100))}%` }}
              />
            </div>

            <div className={`text-center ${isFullscreen ? 'py-8 md:py-12' : 'py-4'}`}>
              <div
                className={`text-white/80 font-semibold tracking-[0.3em] mb-4 ${
                  isFullscreen ? 'text-base md:text-2xl' : 'text-sm md:text-lg'
                }`}
              >
                {phase === 'done' ? 'SESSION COMPLETE' : `NEXT: ${nextLabel.toUpperCase()}`}
              </div>

              <div
                className={`font-black leading-none tracking-tight ${
                  isFullscreen
                    ? 'text-[5rem] sm:text-[7rem] md:text-[10rem] lg:text-[12rem]'
                    : 'text-[3.5rem] sm:text-[4.5rem]'
                }`}
              >
                {formatTime(timeLeft)}
              </div>

              <div
                className={`mt-4 text-white/85 ${
                  isFullscreen ? 'text-xl md:text-2xl mt-6' : 'text-base'
                }`}
              >
                Total Session: {formatTime(totalSessionTime)}
              </div>
            </div>

            <div
              className={`grid gap-3 mt-6 ${
                isFullscreen ? 'grid-cols-3 mt-10' : 'grid-cols-3'
              }`}
            >
              <button
                onClick={startClock}
                className={`rounded-2xl bg-black/25 font-black hover:bg-white hover:text-slate-900 transition ${
                  isFullscreen ? 'py-5 text-xl md:text-2xl' : 'py-4 text-lg'
                }`}
              >
                START
              </button>

              <button
                onClick={pauseClock}
                className={`rounded-2xl bg-black/25 font-black hover:bg-white hover:text-slate-900 transition ${
                  isFullscreen ? 'py-5 text-xl md:text-2xl' : 'py-4 text-lg'
                }`}
              >
                PAUSE
              </button>

              <button
                onClick={resetClock}
                className={`rounded-2xl bg-black/25 font-black hover:bg-white hover:text-slate-900 transition ${
                  isFullscreen ? 'py-5 text-xl md:text-2xl' : 'py-4 text-lg'
                }`}
              >
                RESET
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}