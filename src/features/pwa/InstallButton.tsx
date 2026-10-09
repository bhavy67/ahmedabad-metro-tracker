import { useState } from 'react';
import { IconDownload, IconShare2, IconSquarePlus } from '@tabler/icons-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { useInstallPrompt } from '@/src/hooks/useInstallPrompt.ts';
import { cn } from '@/lib/utils';

/**
 * Install entry point. Chromium browsers get the native prompt once they fire
 * `beforeinstallprompt`; iOS Safari has no such API, so there the same button
 * opens a short "Share → Add to Home Screen" guide instead.
 */
export function InstallButton({ className }: { className?: string }) {
  const { status, install } = useInstallPrompt();
  const [iosHelpOpen, setIosHelpOpen] = useState(false);

  if (status !== 'ready' && status !== 'ios') return null;

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              onClick={status === 'ios' ? () => setIosHelpOpen(true) : install}
              aria-label="Install app"
              className={cn(
                'press inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/6 text-muted-foreground hover:bg-white/10 hover:text-foreground',
                className
              )}
            >
              <IconDownload size={17} stroke={1.75} />
            </button>
          }
        />
        <TooltipContent side="bottom">Install app</TooltipContent>
      </Tooltip>

      {status === 'ios' && (
        <Drawer open={iosHelpOpen} onOpenChange={setIosHelpOpen} showSwipeHandle>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Install MetroNow</DrawerTitle>
              <DrawerDescription className="text-[14px]">
                Add it to your Home Screen for one-tap access and offline timetables.
              </DrawerDescription>
            </DrawerHeader>
            <ol className="flex flex-col gap-2 px-4 pt-4">
              <IosStep n={1} icon={<IconShare2 size={18} stroke={1.75} />}>
                Tap <b className="text-foreground">Share</b> in Safari's toolbar
              </IosStep>
              <IosStep n={2} icon={<IconSquarePlus size={18} stroke={1.75} />}>
                Choose <b className="text-foreground">Add to Home Screen</b>
              </IosStep>
            </ol>
            <DrawerFooter className="pt-5">
              <DrawerClose className="pill-btn w-full justify-center px-5">Got it</DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}

function IosStep({ n, icon, children }: { n: number; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="surface flex items-center gap-3 rounded-[20px] px-4 py-3 text-[14px] text-muted-foreground">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/14 text-primary">{icon}</span>
      <span className="flex-1">{children}</span>
      <span className="tnum font-mono text-[12px]">{n}</span>
    </li>
  );
}
