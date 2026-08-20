import { IconBroadcast } from '@tabler/icons-react';
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { timetable } from '@/src/lib/metro/network.ts';

export function LiveBadge() {
  return (
    <Drawer showSwipeHandle>
      <DrawerTrigger className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2 py-1 text-[10px] font-medium text-secondary-foreground transition-colors active:bg-accent">
        <IconBroadcast size={12} className="text-primary" stroke={2.25} />
        <span className="tracking-tight">Scheduled live</span>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="font-display text-base">What "live" means here</DrawerTitle>
          <DrawerDescription>
            Ahmedabad Metro (GMRC) does not publish a real-time train feed — no public API, no GPS
            tracking. What you're seeing is calculated from the official published timetable against
            the current time, the same way a printed schedule would tell you where a train "should"
            be.
          </DrawerDescription>
        </DrawerHeader>
        <div className="space-y-3 px-4 py-4 text-sm text-foreground/90">
          <p>
            That means positions and countdowns reflect the <strong>planned</strong> schedule, not
            an actual train's GPS location. If a train is running late, delayed, or a service is
            disrupted, this app has no way to know.
          </p>
          <div className="rounded-lg border border-border bg-muted/60 px-3 py-2.5 font-mono text-[11px] text-muted-foreground">
            Timetable source: {timetable.sourceEffective}
          </div>
        </div>
        <DrawerFooter>
          <DrawerClose render={<Button className="w-full">Got it</Button>} />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
