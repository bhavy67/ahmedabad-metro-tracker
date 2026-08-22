import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  IconBriefcase, IconHome2, IconArrowRight, IconArrowsExchange,
  IconTrain, IconPencil, IconX,
} from '@tabler/icons-react';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
  DrawerFooter, DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { StationPicker } from '@/src/features/journey/StationPicker.tsx';
import { useCommute } from '@/src/hooks/useCommute.ts';
import { useMetroClock } from '@/src/hooks/useMetroClock.ts';
import { planJourney } from '@/src/lib/metro/plan.ts';
import { getStation } from '@/src/lib/metro/network.ts';
import { formatClockShort12 } from '@/src/lib/metro/clock.ts';
import type { NetworkStation } from '@/src/lib/metro/types.ts';

type Direction = 'to-work' | 'to-home';

export function CommuteCard() {
  const { commute, save, clear } = useCommute();
  const { secondsOfDay, dayOfWeek } = useMetroClock();

  // Smart default: morning → go to work, afternoon/evening → go home
  const [direction, setDirection] = useState<Direction>(() =>
    secondsOfDay < 13 * 3600 ? 'to-work' : 'to-home'
  );
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

  if (!commute) {
    return (
      <>
        <div className="rounded-2xl border border-dashed border-border-strong bg-card-muted/50 px-5 py-6 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <IconTrain size={22} />
          </div>
          <p className="mb-1 text-[15px] font-semibold text-foreground">Set up your commute</p>
          <p className="mx-auto mb-4 max-w-[28ch] text-[13px] text-muted-foreground">
            Save your home and work stations for instant one-tap journey planning.
          </p>
          <Button onClick={openSetup} className="h-11 px-5 text-sm">Set up commute</Button>
        </div>
        <SetupDrawer
          open={setupOpen}
          onOpenChange={setSetupOpen}
          draftHome={draftHome}
          draftWork={draftWork}
          setDraftHome={setDraftHome}
          setDraftWork={setDraftWork}
          onSave={handleSave}
        />
      </>
    );
  }

  const homeStation = getStation(commute.homeStationId);
  const workStation = getStation(commute.workStationId);
  if (!homeStation || !workStation) return null;

  const origin = direction === 'to-work' ? homeStation : workStation;
  const dest   = direction === 'to-work' ? workStation : homeStation;

  return (
    <>
      <ActiveCommute
        origin={origin}
        dest={dest}
        direction={direction}
        secondsOfDay={secondsOfDay}
        dayOfWeek={dayOfWeek}
        onFlip={() => setDirection(d => d === 'to-work' ? 'to-home' : 'to-work')}
        onEdit={openSetup}
        onClear={clear}
      />
      <SetupDrawer
        open={setupOpen}
        onOpenChange={setSetupOpen}
        draftHome={draftHome}
        draftWork={draftWork}
        setDraftHome={setDraftHome}
        setDraftWork={setDraftWork}
        onSave={handleSave}
      />
    </>
  );
}

function ActiveCommute({
  origin, dest, direction, secondsOfDay, dayOfWeek, onFlip, onEdit, onClear,
}: {
  origin: NetworkStation;
  dest: NetworkStation;
  direction: Direction;
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

  const minutesUntil = plan ? Math.round((plan.departSeconds - secondsOfDay) / 60) : null;
  const line = plan?.legs[0]?.line;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
          {direction === 'to-work' ? <IconBriefcase size={20} /> : <IconHome2 size={20} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Commute
          </p>
          <p className="flex items-center gap-1 truncate font-display text-[15px] font-semibold leading-tight">
            {origin.name}
            <IconArrowRight size={13} className="shrink-0 text-muted-foreground" />
            {dest.name}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onFlip}
            aria-label="Flip direction"
            className="press flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
          >
            <IconArrowsExchange size={16} />
          </button>
          <button
            type="button"
            onClick={onEdit}
            aria-label="Edit commute"
            className="press flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
          >
            <IconPencil size={15} />
          </button>
        </div>
      </div>

      {/* Plan summary */}
      <div className="border-t border-border px-4 py-3">
        {!plan ? (
          <p className="text-[13px] text-muted-foreground">No more trains today on this route.</p>
        ) : plan.isTomorrow ? (
          <p className="text-[13px] text-muted-foreground">
            First train tomorrow at{' '}
            <span className="font-semibold text-foreground">{formatClockShort12(plan.departSeconds)}</span>
          </p>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="tnum font-mono text-[20px] font-bold text-foreground">
                  {formatClockShort12(plan.departSeconds)}
                </span>
                {minutesUntil !== null && minutesUntil >= 0 && (
                  <span className="text-[12px] text-muted-foreground">
                    in {minutesUntil} min
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[12px] text-muted-foreground">
                {line && (
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: `var(--line-${line})` }}
                  />
                )}
                <span>{plan.durationMinutes} min</span>
                {plan.transferCount > 0 && <span>· {plan.transferCount} transfer{plan.transferCount > 1 ? 's' : ''}</span>}
                {plan.transferCount === 0 && <span>· direct</span>}
              </div>
            </div>
            <Link
              to={`/plan?from=${origin.id}&to=${dest.id}`}
              className="press flex items-center gap-0.5 rounded-full bg-accent px-3 py-1.5 text-[13px] font-medium text-foreground"
            >
              Plan <IconArrowRight size={13} />
            </Link>
          </div>
        )}
      </div>

      {/* Clear option */}
      <button
        type="button"
        onClick={onClear}
        className="flex w-full items-center justify-center gap-1.5 border-t border-border py-2 text-[12px] text-muted-foreground hover:bg-accent/50"
      >
        <IconX size={12} /> Remove commute
      </button>
    </div>
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
          <DrawerTitle className="font-display text-[17px] font-semibold">Set up commute</DrawerTitle>
        </DrawerHeader>
        <div className="space-y-3 px-4 pt-2 pb-2">
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <IconHome2 size={12} /> Home station
            </p>
            <StationPicker
              label="Home"
              icon="from"
              value={draftHome}
              onChange={setDraftHome}
              exclude={draftWork?.id}
            />
          </div>
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <IconBriefcase size={12} /> Work station
            </p>
            <StationPicker
              label="Work"
              icon="to"
              value={draftWork}
              onChange={setDraftWork}
              exclude={draftHome?.id}
            />
          </div>
        </div>
        <DrawerFooter className="pt-3">
          <Button onClick={onSave} disabled={!canSave} className="h-12 w-full text-[14px] font-semibold">
            Save commute
          </Button>
          <DrawerClose render={<Button variant="outline" className="h-11 w-full text-[14px]">Cancel</Button>} />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
