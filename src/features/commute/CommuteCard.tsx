import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  IconBriefcase, IconHome2, IconArrowRight, IconArrowsExchange,
  IconTrain, IconPencil, IconX, IconArrowUpRight,
} from '@tabler/icons-react';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
  DrawerFooter, DrawerClose,
} from '@/components/ui/drawer';
import { Bezel } from '@/components/Bezel.tsx';
import { StationPicker } from '@/src/features/journey/StationPicker.tsx';
import { useCommute, type CommuteDirection } from '@/src/hooks/useCommute.ts';
import { useMetroClock } from '@/src/hooks/useMetroClock.ts';
import { planJourney } from '@/src/lib/metro/plan.ts';
import { getStation } from '@/src/lib/metro/network.ts';
import { formatClockShort12 } from '@/src/lib/metro/clock.ts';
import type { NetworkStation } from '@/src/lib/metro/types.ts';

/** Countdown ring is full at this many seconds before departure and drains to zero. */
const RING_WINDOW_SECONDS = 15 * 60;
const RING_CIRCUMFERENCE = 2 * Math.PI * 48;

export function CommuteCard({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const { commute, save, setDirection, clear } = useCommute();
  const { secondsOfDay, dayOfWeek } = useMetroClock();

  // The card always opens on the leg the user configured (home → work) and
  // otherwise on whichever leg they last flipped to. It deliberately does not
  // guess from the clock: a commute saved as A → B that renders as B → A
  // reads as a bug, not as a convenience.
  const direction: CommuteDirection = commute?.direction ?? 'to-work';
  const [setupOpen, setSetupOpen] = useState(false);

  // Setup drawer state
  const [draftHome, setDraftHome] = useState<NetworkStation | null>(null);
  const [draftWork, setDraftWork] = useState<NetworkStation | null>(null);

  function openSetup() {
    if (commute) {
      setDraftHome(getStation(commute.homeStationId) ?? null);
      setDraftWork(getStation(commute.workStationId) ?? null);
    } else {
      setDraftHome(null);
      setDraftWork(null);
    }
    setSetupOpen(true);
  }

  function handleSave() {
    if (!draftHome || !draftWork) return;
    save(draftHome.id, draftWork.id);
    setSetupOpen(false);
  }

  const setupDrawer = (
    <SetupDrawer
      open={setupOpen}
      onOpenChange={setSetupOpen}
      draftHome={draftHome}
      draftWork={draftWork}
      setDraftHome={setDraftHome}
      setDraftWork={setDraftWork}
      onSave={handleSave}
    />
  );

  const homeStation = commute ? getStation(commute.homeStationId) : undefined;
  const workStation = commute ? getStation(commute.workStationId) : undefined;

  if (!homeStation || !workStation) {
    return (
      <>
        <Bezel className={className} style={style} coreClassName="flex flex-col items-center justify-center px-6 py-9 text-center">
          <span
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/14 text-primary"
            style={{ boxShadow: '0 0 40px -6px var(--primary)' }}
          >
            <IconTrain size={22} stroke={1.5} />
          </span>
          <p className="font-display text-[18px] font-medium tracking-tight">Set up your commute</p>
          <p className="mx-auto mt-1.5 mb-5 max-w-[30ch] text-[13px] text-muted-foreground">
            Save your home and work stations for a one-tap countdown to your next train.
          </p>
          <button type="button" onClick={openSetup} className="pill-btn">
            Set up commute
            <span className="knob">
              <IconArrowUpRight size={17} stroke={1.75} />
            </span>
          </button>
        </Bezel>
        {setupDrawer}
      </>
    );
  }

  const origin = direction === 'to-work' ? homeStation : workStation;
  const dest = direction === 'to-work' ? workStation : homeStation;

  return (
    <>
      <ActiveCommute
        className={className}
        style={style}
        origin={origin}
        dest={dest}
        direction={direction}
        secondsOfDay={secondsOfDay}
        dayOfWeek={dayOfWeek}
        onFlip={() => setDirection(direction === 'to-work' ? 'to-home' : 'to-work')}
        onEdit={openSetup}
        onClear={clear}
      />
      {setupDrawer}
    </>
  );
}

function ActiveCommute({
  className, style, origin, dest, direction, secondsOfDay, dayOfWeek, onFlip, onEdit, onClear,
}: {
  className?: string;
  style?: React.CSSProperties;
  origin: NetworkStation;
  dest: NetworkStation;
  direction: CommuteDirection;
  secondsOfDay: number;
  dayOfWeek: number;
  onFlip: () => void;
  onEdit: () => void;
  onClear: () => void;
}) {
  const plan = useMemo(
    () => planJourney(origin.id, dest.id, secondsOfDay, dayOfWeek),
    [origin.id, dest.id, secondsOfDay, dayOfWeek]
  );

  const secondsUntil = plan && !plan.isTomorrow ? Math.max(0, plan.departSeconds - secondsOfDay) : null;
  const minutesUntil = secondsUntil !== null ? Math.round(secondsUntil / 60) : null;
  const line = plan?.legs[0]?.line ?? 'blue';
  const ringFill = secondsUntil !== null ? Math.min(1, secondsUntil / RING_WINDOW_SECONDS) : 0;

  return (
    <Bezel className={className} style={style}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="font-display text-[20px] font-medium tracking-tight">Commute</h2>
        <div className="flex items-center gap-1">
          <span className="eyebrow mr-1">
            {direction === 'to-work' ? <IconBriefcase size={11} /> : <IconHome2 size={11} />}
            {direction === 'to-work' ? 'To work' : 'To home'}
          </span>
          <IconButton label="Edit commute" onClick={onEdit}>
            <IconPencil size={15} stroke={1.75} />
          </IconButton>
          <IconButton label="Remove commute" onClick={onClear}>
            <IconX size={15} stroke={1.75} />
          </IconButton>
        </div>
      </div>

      <div className="flex items-center gap-5">
        {/* Countdown ring — drains as departure approaches. */}
        <div className="relative h-[104px] w-[104px] shrink-0 md:h-[116px] md:w-[116px]">
          <svg viewBox="0 0 112 112" className="h-full w-full -rotate-90">
            <circle cx="56" cy="56" r="48" fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth="7" />
            <circle
              cx="56"
              cy="56"
              r="48"
              fill="none"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={RING_CIRCUMFERENCE * (1 - ringFill)}
              className="transition-[stroke-dashoffset] duration-1000 ease-(--spring)"
              style={{ stroke: `var(--line-${line})`, filter: `drop-shadow(0 0 6px var(--line-${line}))` }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            {minutesUntil !== null ? (
              <span>
                <b className="tnum block font-display text-[32px] leading-none font-medium tracking-[-0.04em]">
                  {minutesUntil === 0 ? 'Now' : minutesUntil}
                </b>
                <small className="mt-1 block text-[10px] font-bold tracking-[0.14em] text-muted-foreground">
                  {minutesUntil === 0 ? 'BOARD' : 'MIN'}
                </small>
              </span>
            ) : (
              <IconTrain size={26} stroke={1.5} className="text-muted-foreground" />
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-display text-[18px] leading-snug font-medium tracking-[-0.02em] md:text-[20px]">
            {origin.name} <span style={{ color: `var(--line-${line})` }}>→</span> {dest.name}
          </p>
          {!plan ? (
            <p className="mt-2 text-[13px] text-muted-foreground">No more trains today on this route.</p>
          ) : plan.isTomorrow ? (
            <p className="mt-2 text-[13px] text-muted-foreground">
              First train tomorrow at{' '}
              <span className="tnum font-mono font-semibold text-foreground">{formatClockShort12(plan.departSeconds)}</span>
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
              <span>
                Departs <b className="tnum font-mono font-medium text-foreground">{formatClockShort12(plan.departSeconds)}</b>
              </span>
              <span>
                <b className="tnum font-mono font-medium text-foreground">{plan.durationMinutes}</b> min ride
              </span>
              <span>{plan.transferCount === 0 ? 'Direct' : `${plan.transferCount} change${plan.transferCount > 1 ? 's' : ''}`}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link to={`/plan?from=${origin.id}&to=${dest.id}`} className="pill-btn">
          Plan journey
          <span className="knob">
            <IconArrowUpRight size={17} stroke={1.75} />
          </span>
        </Link>
        <button type="button" onClick={onFlip} className="pill-btn ghost">
          Reverse
          <span className="knob">
            <IconArrowsExchange size={16} stroke={1.75} />
          </span>
        </button>
      </div>
    </Bezel>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="press flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-white/8 hover:text-foreground"
    >
      {children}
    </button>
  );
}

function SetupDrawer({
  open, onOpenChange, draftHome, draftWork, setDraftHome, setDraftWork, onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftHome: NetworkStation | null;
  draftWork: NetworkStation | null;
  setDraftHome: (s: NetworkStation) => void;
  setDraftWork: (s: NetworkStation) => void;
  onSave: () => void;
}) {
  const canSave = draftHome !== null && draftWork !== null && draftHome.id !== draftWork.id;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Set up commute</DrawerTitle>
        </DrawerHeader>
        <div className="space-y-4 px-4 pt-3 pb-2">
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
              <IconHome2 size={12} /> Home station
            </p>
            <StationPicker label="Home" icon="from" value={draftHome} onChange={setDraftHome} exclude={draftWork?.id} />
          </div>
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
              <IconBriefcase size={12} /> Work station
            </p>
            <StationPicker label="Work" icon="to" value={draftWork} onChange={setDraftWork} exclude={draftHome?.id} />
          </div>
        </div>
        <DrawerFooter className="pt-4">
          <button type="button" onClick={onSave} disabled={!canSave} className="pill-btn w-full">
            Save commute
            <span className="knob">
              <IconArrowRight size={17} stroke={1.75} />
            </span>
          </button>
          <DrawerClose className="pill-btn ghost w-full justify-center px-5">Cancel</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
