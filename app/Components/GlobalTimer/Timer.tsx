'use client';

import { useEffect, useRef, useState } from 'react';
import { useIntervalTimer } from '@/app/Context/IntervalTimerComplex';

export default function GlobalIntervalClock() {
  const {
    isFullscreen,
    isPseudoFullscreen,
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

  const fullscreenActive = isFullscreen || isPseudoFullscreen;
  const hasActiveTimer = phase !== 'idle';

  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingWidget, setIsDraggingWidget] = useState(false);
  const [isDraggingClosed, setIsDraggingClosed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [shouldOpenMobileFullscreen, setShouldOpenMobileFullscreen] = useState(false);

  const closedButtonRef = useRef<HTMLButtonElement | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    if (!shouldOpenMobileFullscreen) return;
    if (!isWidgetOpen) return;
    if (!timerRef.current) return;
    if (fullscreenActive) return;

    const id = window.requestAnimationFrame(() => {
      toggleFullscreen();
      setShouldOpenMobileFullscreen(false);
    });

    return () => window.cancelAnimationFrame(id);
  }, [
    isMobile,
    shouldOpenMobileFullscreen,
    isWidgetOpen,
    timerRef,
    toggleFullscreen,
    fullscreenActive,
  ]);

  const defaultClosedStyle = isMobile
    ? undefined
    : ({
        left: '50%',
        bottom: '24px',
        transform: 'translateX(-50%)',
      } as const);

  const handleWidgetMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (fullscreenActive || isMobile) return;
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
    if (fullscreenActive || isMobile) return;
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
    if (isMobile) return;
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
  }, [isDraggingWidget, isDraggingClosed, isMobile, timerRef]);

  const widgetDefaultClasses =
    'bottom-24 left-1/2 -translate-x-1/2 w-[420px] max-w-[calc(100vw-2rem)] rounded-3xl p-6';

  const widgetDraggedStyle =
    !fullscreenActive && !isMobile && position
      ? {
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'none',
          width: '420px',
          maxWidth: 'calc(100vw - 2rem)',
        }
      : undefined;

  const closedDraggedStyle =
    !fullscreenActive && !isMobile && position
      ? {
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'none',
        }
      : defaultClosedStyle;

  const mobileClosedClasses =
    'fixed bottom-0 left-0 right-0 z-[100] bg-slate-800 px-5 py-4 text-white font-bold shadow-2xl transition';

  const desktopClosedClasses =
    'fixed z-[100] rounded-full bg-slate-800 px-5 py-3 text-white font-bold shadow-2xl hover:bg-slate-700 transition cursor-move select-none';

  return (
    <>
      {!fullscreenActive && hasActiveTimer && (
        <>
          {isMobile ? (
            <button
              onClick={() => {
                setIsWidgetOpen(true);
                setShouldOpenMobileFullscreen(true);
              }}
              className={mobileClosedClasses}
            >
              <div className="flex items-center justify-center">
                <span className="text-lg font-bold">
                  {phaseLabel} {formatTime(timeLeft)}
                </span>
              </div>
            </button>
          ) : (
            !isWidgetOpen && (
              <button
                ref={closedButtonRef}
                onMouseDown={handleClosedMouseDown}
                onClick={() => {
                  if (!hasMovedRef.current) {
                    setIsWidgetOpen(true);
                  }
                }}
                style={closedDraggedStyle}
                className={desktopClosedClasses}
              >
                {phaseLabel} {formatTime(timeLeft)}
              </button>
            )
          )}
        </>
      )}

      {((isMobile && fullscreenActive) || (!isMobile && isWidgetOpen && hasActiveTimer)) && (
        <div
          ref={timerRef}
          style={widgetDraggedStyle}
          className={`fixed z-[100] bg-gradient-to-br ${timerTheme} text-white shadow-2xl border border-white/20 ${
            fullscreenActive
              ? 'inset-0 rounded-none border-0 p-6 md:p-12'
              : position
              ? 'rounded-3xl p-6'
              : widgetDefaultClasses
          }`}
        >
          <div
            className={`w-full ${
              fullscreenActive
                ? 'h-full flex flex-col justify-center max-w-none'
                : 'max-w-none'
            }`}
          >
            <div
              onMouseDown={handleWidgetMouseDown}
              className={`flex items-center justify-between mb-5 ${
                !fullscreenActive && !isMobile ? 'cursor-move select-none' : ''
              }`}
            >
              <div>
                <p
                  className={`uppercase tracking-[0.35em] text-white/80 ${
                    fullscreenActive ? 'text-sm md:text-base' : 'text-xs md:text-sm'
                  }`}
                >
                  {phaseLabel}
                </p>
                <p
                  className={`text-white/75 mt-2 ${
                    fullscreenActive ? 'text-base md:text-lg' : 'text-sm'
                  }`}
                >
                  Interval {Math.min(currentInterval, totalIntervals)} / {totalIntervals}
                </p>
                {!fullscreenActive && !isMobile && (
                  <p className="text-xs text-white/60 mt-1">Drag to move</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={toggleFullscreen}
                  className="rounded-xl bg-black/25 px-4 py-2 font-bold hover:bg-white hover:text-slate-900 transition"
                >
                  {fullscreenActive ? 'Exit Full Screen' : 'Full'}
                </button>

                {!fullscreenActive && !isMobile && (
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
                fullscreenActive ? 'h-4 md:h-5 mb-8' : 'h-3'
              }`}
            >
              <div
                className="h-full bg-white transition-all duration-500"
                style={{ width: `${Math.max(0, Math.min(progressPercent, 100))}%` }}
              />
            </div>

            <div className={`text-center ${fullscreenActive ? 'py-8 md:py-12' : 'py-4'}`}>
              <div
                className={`text-white/80 font-semibold tracking-[0.3em] mb-4 ${
                  fullscreenActive ? 'text-base md:text-2xl' : 'text-sm md:text-lg'
                }`}
              >
                {phase === 'done' ? 'SESSION COMPLETE' : `NEXT: ${nextLabel.toUpperCase()}`}
              </div>

              <div
                className={`font-black leading-none tracking-tight ${
                  fullscreenActive
                    ? 'text-[5rem] sm:text-[7rem] md:text-[10rem] lg:text-[12rem]'
                    : 'text-[3.5rem] sm:text-[4.5rem]'
                }`}
              >
                {formatTime(timeLeft)}
              </div>

              <div
                className={`mt-4 text-white/85 ${
                  fullscreenActive ? 'text-xl md:text-2xl mt-6' : 'text-base'
                }`}
              >
                Total Session: {formatTime(totalSessionTime)}
              </div>
            </div>

            <div className="grid gap-3 mt-6 grid-cols-3">
              <button
                onClick={startClock}
                className={`rounded-2xl bg-black/25 font-black hover:bg-white hover:text-slate-900 transition ${
                  fullscreenActive ? 'py-5 text-xl md:text-2xl' : 'py-4 text-lg'
                }`}
              >
                START
              </button>

              <button
                onClick={pauseClock}
                className={`rounded-2xl bg-black/25 font-black hover:bg-white hover:text-slate-900 transition ${
                  fullscreenActive ? 'py-5 text-xl md:text-2xl' : 'py-4 text-lg'
                }`}
              >
                PAUSE
              </button>

              <button
                onClick={resetClock}
                className={`rounded-2xl bg-black/25 font-black hover:bg-white hover:text-slate-900 transition ${
                  fullscreenActive ? 'py-5 text-xl md:text-2xl' : 'py-4 text-lg'
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