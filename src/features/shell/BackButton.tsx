import { useLocation, useNavigate } from 'react-router';
import { IconArrowLeft } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

/**
 * Goes back one step in the app's history. On a cold deep link there is no
 * in-app entry to return to (react-router marks that first location with the
 * key 'default'), so it falls back to Home instead of leaving the site.
 */
export function BackButton({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { key } = useLocation();
  const canGoBack = key !== 'default';

  return (
    <button
      type="button"
      onClick={() => (canGoBack ? navigate(-1) : navigate('/'))}
      aria-label={canGoBack ? 'Go back' : 'Back to home'}
      className={cn('press surface surface-hover flex h-10 w-10 items-center justify-center rounded-full', className)}
    >
      <IconArrowLeft size={18} stroke={1.75} />
    </button>
  );
}
