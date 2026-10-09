import { IconBroadcast, IconClockHour4, IconAlertTriangle, IconCalendarEvent, type Icon as TablerIcon } from '@tabler/icons-react';
import { timetableInfo } from '@/src/lib/metro/network.ts';
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function LiveBadge() {
  return (
    <Drawer showSwipeHandle>
      <Tooltip>
        <TooltipTrigger
          render={
            <DrawerTrigger className="press inline-flex h-9 items-center gap-2 rounded-full bg-white/6 px-3.5 text-[12px] font-bold hover:bg-white/10" />
          }
        >
          <span className="live-dot" />
          <span>Live</span>
        </TooltipTrigger>
        <TooltipContent side="bottom">About live data</TooltipContent>
      </Tooltip>

      <DrawerContent>
        <div className="px-5 pt-4">
          <div
            className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-live/12 text-live"
            style={{ boxShadow: '0 0 40px -6px var(--live)' }}
          >
            <IconBroadcast size={26} stroke={1.5} />
          </div>
          <DrawerHeader className="items-center px-0 text-center md:text-center">
            <DrawerTitle className="text-[20px]">About live data</DrawerTitle>
            <DrawerDescription className="text-[14px] leading-relaxed">
              Ahmedabad Metro doesn't publish a real-time train feed. Positions and countdowns
              are computed from the official GMRC timetable against the current time.
            </DrawerDescription>
          </DrawerHeader>
        </div>

        <div className="space-y-2 px-4 pt-4">
          <InfoRow
            icon={IconClockHour4}
            tone="info"
            title="Scheduled positions"
            body="Everything you see reflects the planned schedule — the same way a printed timetable would tell you where a train should be."
          />
          <InfoRow
            icon={IconAlertTriangle}
            tone="warning"
            title="Can't detect delays"
            body="If a train is running late or a service is disrupted, this app has no way to know."
          />
          <InfoRow
            icon={IconCalendarEvent}
            tone={timetableInfo.verified ? 'info' : 'warning'}
            title={`Timetable effective ${timetableInfo.effective}`}
            body={
              timetableInfo.verified
                ? 'Matches the official GMRC timetable for this date.'
                : "Not yet checked against GMRC's official timetable, so some timings may differ slightly."
            }
          />
        </div>

        <DrawerFooter className="pt-5">
          <DrawerClose className="pill-btn w-full justify-center px-5">Got it</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function InfoRow({
  icon: Icon,
  title,
  body,
  tone = 'info',
}: {
  icon: TablerIcon;
  title: string;
  body: string;
  tone?: 'info' | 'warning';
}) {
  return (
    <div className="surface flex gap-3 rounded-[20px] px-3.5 py-3">
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          tone === 'info' ? 'bg-primary/14 text-primary' : 'bg-destructive/14 text-destructive'
        )}
      >
        <Icon size={18} stroke={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold text-foreground">{title}</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
