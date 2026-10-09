import { cn } from '@/lib/utils';

/**
 * Pulse "double-bezel" card: a hairline glass shell holding an inner core.
 * `className` styles the shell (grid placement, etc.), `coreClassName` the content.
 */
export function Bezel({
  className,
  coreClassName,
  children,
  ...props
}: React.ComponentProps<'div'> & { coreClassName?: string }) {
  return (
    <div className={cn('bezel', className)} {...props}>
      <div className={cn('bezel-core h-full p-5 md:p-6', coreClassName)}>{children}</div>
    </div>
  );
}
