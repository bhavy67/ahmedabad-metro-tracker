import { IconSun, IconMoon } from '@tabler/icons-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useTheme } from '@/src/hooks/useTheme.ts';

export function ThemeToggle() {
  const { preference, toggle } = useTheme();
  const isDark = preference === 'dark';
  const Icon = isDark ? IconSun : IconMoon;
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={toggle}
            aria-label={label}
            className="press inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Icon size={18} stroke={2} />
          </button>
        }
      />
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
