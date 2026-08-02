import React, { useState, useEffect, useRef, useCallback } from 'react';
import { listRecentEvents, createEvent as apiCreateEvent } from '@/api/timestampEvents';
import { getIdentity, clearIdentity } from '@/api/portalAuth';
import { Clock, LogIn, LogOut, Coffee, Play, User } from 'lucide-react';

const DOUBLE_TAP_WINDOW = 350;

export default function Home() {
  const [identity, setIdentity] = useState(null);
  const [phase, setPhase] = useState('loading');
  const [sessionNumber, setSessionNumber] = useState(1);
  const [breakCount, setBreakCount] = useState(0);
  const [lastEvent, setLastEvent] = useState('None');
  const [lastDateTime, setLastDateTime] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const phaseRef = useRef('loading');
  const sessionRef = useRef(1);
  const breakRef = useRef(0);
  const logIdRef = useRef(1);
  const pendingTimerRef = useRef(null);
  const flashTimerRef = useRef(null);
  const flashShownRef = useRef(true);
  const stampoutTimerRef = useRef(null);
  const stampoutRef = useRef(false);
  const containerRef = useRef(null);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { sessionRef.current = sessionNumber; }, [sessionNumber]);
  useEffect(() => { breakRef.current = breakCount; }, [breakCount]);

  // Portal auth guard
  useEffect(() => {
    const id = getIdentity();
    if (!id) {
      window.location.href = '/login';
      return;
    }
    setIdentity(id);
  }, []);

  const handleSignOut = () => {
    clearIdentity();
    window.location.href = '/login';
  };

  // Load state from DB
  useEffect(() => {
    (async () => {
      try {
        const events = await listRecentEvents(200);
        if (events.length === 0) {
          phaseRef.current = 'idle';
          setPhase('idle');
          sessionRef.current = 1;
          setSessionNumber(1);
          logIdRef.current = 1;
        } else {
          const latest = events[0];
          logIdRef.current = (latest.log_sequence || 0) + 1;
          const latestSession = latest.session_number;
          const sessionEvents = events.filter((e) => e.session_number === latestSession);

          if (latest.event_name === 'Stamp Out') {
            phaseRef.current = 'idle';
            setPhase('idle');
            sessionRef.current = latestSession + 1;
            setSessionNumber(latestSession + 1);
            breakRef.current = 0;
            setBreakCount(0);
            setLastEvent('Stamp Out');
            setLastDateTime(new Date(latest.full_timestamp));
          } else {
            sessionRef.current = latestSession;
            setSessionNumber(latestSession);
            const starts = sessionEvents.filter((e) => e.event_name === 'Break Start').length;
            breakRef.current = starts;
            setBreakCount(starts);
            setLastEvent(formatEventLabel(latest));
            setLastDateTime(new Date(latest.full_timestamp));
            if (latest.event_name === 'Break Start') {
              phaseRef.current = 'on_break';
              setPhase('on_break');
            } else {
              phaseRef.current = 'working';
              setPhase('working');
            }
          }
        }
      } catch (e) {
        console.error(e);
        setError('Failed to load session data');
        phaseRef.current = 'idle';
        setPhase('idle');
      }
    })();
  }, []);

  const createEvent = useCallback(async (eventName, breakNumber, statusAfter) => {
    setSaving(true);
    const now = new Date();
    const record = {
      session_number: sessionRef.current,
      event_name: eventName,
      break_number: breakNumber ?? null,
      full_timestamp: now.toISOString(),
      status_after: statusAfter,
      date: now.toISOString().slice(0, 10),
      time: now.toLocaleTimeString('en-US', { hour12: false }),
      log_sequence: logIdRef.current,
    };
    logIdRef.current += 1;
    try {
      await apiCreateEvent(record);
      setLastEvent(formatEventLabel({ event_name: eventName, break_number: breakNumber }));
      setLastDateTime(now);
    } catch (e) {
      console.error(e);
      setError('Failed to save timestamp');
    } finally {
      setSaving(false);
    }
  }, []);

  const doSingleAction = useCallback(() => {
    const p = phaseRef.current;
    if (p === 'working') {
      const n = breakRef.current + 1;
      createEvent('Break Start', n, 'On Break');
      breakRef.current = n;
      setBreakCount(n);
      phaseRef.current = 'on_break';
      setPhase('on_break');
    } else if (p === 'on_break') {
      createEvent('Break End', breakRef.current, 'Working');
      phaseRef.current = 'working';
      setPhase('working');
    }
  }, [createEvent]);

  const doStampOut = useCallback(() => {
    createEvent('Stamp Out', null, 'Stamped Out');
    phaseRef.current = 'stamped_out';
    setPhase('stamped_out');
    stampoutRef.current = true;
    breakRef.current = 0;
    setBreakCount(0);
    // Auto-reset to idle after 1.5s
    stampoutTimerRef.current = setTimeout(() => {
      stampoutRef.current = false;
      const next = sessionRef.current + 1;
      sessionRef.current = next;
      setSessionNumber(next);
      phaseRef.current = 'idle';
      setPhase('idle');
    }, 1500);
  }, [createEvent]);

  const doStampIn = useCallback(() => {
    createEvent('Stamp In', null, 'Working');
    breakRef.current = 0;
    setBreakCount(0);
    phaseRef.current = 'working';
    setPhase('working');
  }, [createEvent]);

  const triggerFlash = useCallback(() => {
    flashShownRef.current = true;
    setFlash(true);
    clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => {
      flashShownRef.current = false;
      setFlash(false);
    }, 250);
  }, []);

  const handleSpace = useCallback(() => {
    setError(null);
    triggerFlash();
    const p = phaseRef.current;

    // From idle or stamped_out: Stamp In immediately
    if (p === 'idle' || p === 'stamped_out') {
      // Clear stamp out timer so it doesn't reset phase mid-stamp-in
      if (stampoutTimerRef.current) {
        clearTimeout(stampoutTimerRef.current);
        stampoutTimerRef.current = null;
        stampoutRef.current = false;
      }
      doStampIn();
      return;
    }

    // From working or on_break: double-tap detection
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
      doStampOut();
    } else {
      pendingTimerRef.current = setTimeout(() => {
        pendingTimerRef.current = null;
        doSingleAction();
      }, DOUBLE_TAP_WINDOW);
    }
  }, [triggerFlash, doStampIn, doStampOut, doSingleAction]);

  // Key listener
  useEffect(() => {
    if (!isFocused) return;
    const handleKey = (e) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        handleSpace();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isFocused, handleSpace]);

  const config = getConfig(phase);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="text-center mb-6 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-2">
          {identity && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <User className="w-4 h-4" />
              <span className="font-medium">{identity.employee_name}</span>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
          Steve's Timestamp System
        </h1>
        <p className="mt-3 text-slate-500 text-sm sm:text-base max-w-md mx-auto">
          Click inside the window and press the Space Bar to timestamp.
        </p>
      </div>

      {/* Main interactive card */}
      <div
        ref={containerRef}
        tabIndex={0}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onClick={() => containerRef.current?.focus()}
        className={`relative w-full max-w-2xl rounded-3xl border-2 transition-all duration-300 cursor-pointer overflow-hidden ${
          config.border
        } ${
          isFocused ? 'shadow-2xl scale-[1.01]' : 'shadow-lg'
        } ${flash ? 'ring-4 ring-white/50' : ''}`}
      >
        {/* Background gradient */}
        <div className={`absolute inset-0 ${config.bg} transition-colors duration-500`} />

        {/* Flash overlay */}
        <div
          className={`absolute inset-0 bg-white transition-opacity duration-150 pointer-events-none ${
            flash ? 'opacity-20' : 'opacity-0'
          }`}
        />

        {/* Content */}
        <div className="relative px-6 sm:px-12 py-10 sm:py-14 flex flex-col items-center text-center">
          <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full ${config.iconBg} flex items-center justify-center mb-5 ${config.iconRing} ${flash ? 'scale-110' : 'scale-100'} transition-transform`}>
            {config.icon}
          </div>

          <p className="text-xs sm:text-sm uppercase tracking-widest font-semibold mb-2" style={{ color: config.textColor }}>
            Current Status
          </p>
          <h2 className="text-3xl sm:text-5xl font-extrabold mb-1" style={{ color: config.headingColor }}>
            {config.label}
          </h2>

          {saving && (
            <p className="text-sm mt-2 font-medium opacity-80" style={{ color: config.textColor }}>
              Saving...
            </p>
          )}

          {/* Hint */}
          <div className="mt-4 mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/10 text-xs sm:text-sm font-medium" style={{ color: config.textColor }}>
            <kbd className="px-2 py-0.5 rounded bg-white/80 text-slate-800 font-mono font-bold text-xs">Space</kbd>
            {config.hint}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-md mt-2">
            <StatCard label="Session #" value={`#${sessionNumber}`} color={config.textColor} />
            <StatCard label="Total Breaks" value={breakCount} color={config.textColor} />
            <StatCard label="Last Event" value={lastEvent} color={config.textColor} />
            <StatCard
              label="Last Timestamp"
              value={lastDateTime ? formatDateTime(lastDateTime) : '—'}
              color={config.textColor}
            />
          </div>
        </div>
      </div>

      {/* Focus indicator */}
      <div className="mt-5 flex items-center gap-2 text-sm">
        <span className={`w-2.5 h-2.5 rounded-full ${isFocused ? 'bg-green-500' : 'bg-slate-300'} animate-pulse`} />
        <span className={isFocused ? 'text-green-600 font-medium' : 'text-slate-400'}>
          {isFocused ? 'Window active — press Space Bar to timestamp' : 'Click inside the window to activate'}
        </span>
      </div>

      {/* Session guide */}
      <div className="mt-8 w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Play className="w-4 h-4" /> How it works
        </h3>
        <ul className="text-sm text-slate-500 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-cyan-500 font-bold mt-0.5">1.</span>
            <span><strong>First</strong> Space Bar press → Stamp In</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-500 font-bold mt-0.5">2.</span>
            <span>Each press after alternates: Break 1 Start → End → Break 2 Start → End → etc.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-500 font-bold mt-0.5">3.</span>
            <span><strong>Double-tap</strong> Space Bar (within 1 second) → Stamp Out &amp; reset</span>
          </li>
        </ul>
      </div>

      {error && (
        <div className="mt-4 px-4 py-2 rounded-lg bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-left">
      <p className="text-xs uppercase tracking-wide opacity-70 font-medium" style={{ color }}>
        {label}
      </p>
      <p className="text-base font-bold mt-0.5 truncate" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

function getConfig(phase) {
  switch (phase) {
    case 'idle':
      return {
        label: 'Not Clocked In',
        bg: 'bg-gradient-to-br from-slate-100 to-slate-200',
        border: 'border-slate-300',
        iconBg: 'bg-slate-200',
        iconRing: 'ring-4 ring-slate-300/50',
        icon: <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-slate-500" />,
        hint: 'to Stamp In',
        textColor: '#475569',
        headingColor: '#1e293b',
      };
    case 'working':
      return {
        label: 'Working',
        bg: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
        border: 'border-emerald-500',
        iconBg: 'bg-emerald-500',
        iconRing: 'ring-4 ring-emerald-300/50',
        icon: <LogIn className="w-10 h-10 sm:w-12 sm:h-12 text-white" />,
        hint: 'to start a break (double-tap to Stamp Out)',
        textColor: '#ffffff',
        headingColor: '#ffffff',
      };
    case 'on_break':
      return {
        label: 'On Break',
        bg: 'bg-gradient-to-br from-amber-400 to-orange-500',
        border: 'border-amber-500',
        iconBg: 'bg-amber-500',
        iconRing: 'ring-4 ring-amber-300/50',
        icon: <Coffee className="w-10 h-10 sm:w-12 sm:h-12 text-white" />,
        hint: 'to end break (double-tap to Stamp Out)',
        textColor: '#ffffff',
        headingColor: '#ffffff',
      };
    case 'stamped_out':
      return {
        label: 'Stamped Out',
        bg: 'bg-gradient-to-br from-rose-400 to-rose-600',
        border: 'border-rose-500',
        iconBg: 'bg-rose-500',
        iconRing: 'ring-4 ring-rose-300/50',
        icon: <LogOut className="w-10 h-10 sm:w-12 sm:h-12 text-white" />,
        hint: 'Session closed — next press starts a new session',
        textColor: '#ffffff',
        headingColor: '#ffffff',
      };
    default:
      return {
        label: 'Loading...',
        bg: 'bg-gradient-to-br from-slate-100 to-slate-200',
        border: 'border-slate-300',
        iconBg: 'bg-slate-200',
        iconRing: 'ring-4 ring-slate-300/50',
        icon: <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 animate-pulse" />,
        hint: '',
        textColor: '#475569',
        headingColor: '#1e293b',
      };
  }
}

function formatEventLabel(event) {
  const name = event.event_name;
  const bn = event.break_number;
  if ((name === 'Break Start' || name === 'Break End') && bn) {
    return `${name} ${bn}`;
  }
  return name;
}

function formatDateTime(date) {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}