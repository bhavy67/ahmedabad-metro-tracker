import { IconInfoCircle } from '@tabler/icons-react';
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { timetable } from '@/src/lib/metro/network.ts';

export function LiveBadge() {
  return (
    <Drawer showSwipeHandle>
      <DrawerTrigger className="press inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-1.5 text-[12px] font-medium text-secondary-foreground">
        <span className="relative inline-flex h-2 w-2">
          <span className="signal-ping absolute inset-0 text-primary" />
          <span className="relative inline-block h-2 w-2 rounded-full bg-primary" />
        </span>
        <span>Live</span>
        <IconInfoCircle size={13} className="text-muted-foreground" />
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="font-display text-lg font-semibold">What "live" means here</DrawerTitle>
          <DrawerDescription className="text-sm">
            Ahmedabad Metro (GMRC) does not publish a real-time train feed — no public API, no GPS
            tracking. What you're seeing is calculated from the official published timetable against
            the current time, the same way a printed schedule would tell you where a train "should"
            be.
          </DrawerDescription>
        </DrawerHeader>
        <div className="space-y-3 px-4 py-4 text-[14px] leading-relaxed text-foreground/90">
          <p>
            Positions and countdowns reflect the <strong>planned</strong> schedule, not
            an actual train's GPS location. If a train is running late, delayed, or a service is
            disrupted, this app has no way to know.
          </p>
          <div className="rounded-lg border border-border bg-muted/60 px-3 py-2.5 font-mono text-[12px] text-muted-foreground">
            Timetable source: {timetable.sourceEffective}
          </div>
        </div>
        <DrawerFooter>
          <DrawerClose render={<Button className="h-11 w-full text-sm">Got it</Button>} />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
