import { IconDownload } from '@tabler/icons-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useInstallPrompt } from '@/src/hooks/useInstallPrompt.ts';

export function InstallButton() {
  const { status, install } = useInstallPrompt();

  // Only show when the browser has a native install prompt ready.
  // iOS Safari never fires beforeinstallprompt, so nothing shows there.
  if (status !== 'ready') return null;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={install}
            aria-label="Install app"
            className="press inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <IconDownload size={18} stroke={2} />
          </button>
        }
      />
      <TooltipContent side="bottom">Install app</TooltipContent>
    </Tooltip>
  );
}
