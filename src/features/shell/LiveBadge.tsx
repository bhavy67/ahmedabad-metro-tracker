import { IconBroadcast, IconClockHour4, IconAlertTriangle, type Icon as TablerIcon } from '@tabler/icons-react';
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function LiveBadge() {
  return (
    <Drawer showSwipeHandle>
      <DrawerTrigger className="press inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[12px] font-semibold text-foreground shadow-sm hover:bg-accent">
        <span className="relative inline-flex h-2 w-2">
          <span className="signal-ping absolute inset-0 text-primary" />
          <span className="relative inline-block h-2 w-2 rounded-full bg-primary" />
        </span>
        <span>Live</span>
      </DrawerTrigger>

      <DrawerContent>
        <div className="px-5 pt-4">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <IconBroadcast size={26} stroke={2} />
          </div>
          <DrawerHeader className="items-center px-0 text-center">
            <DrawerTitle className="font-display text-[22px] font-semibold tracking-tight">
              About live data
            </DrawerTitle>
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
        </div>

        <DrawerFooter className="pt-5">
          <DrawerClose render={<Button className="h-12 w-full text-[14px] font-semibold">Got it</Button>} />
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
    <div className="flex gap-3 rounded-xl border border-border bg-card px-3.5 py-3">
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
          tone === 'info' ? 'bg-primary/12 text-primary' : 'bg-destructive/12 text-destructive'
        )}
      >
        <Icon size={18} stroke={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
