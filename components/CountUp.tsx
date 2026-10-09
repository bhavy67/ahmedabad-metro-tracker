import { useEffect, useRef } from 'react';

/**
 * Counts from the previously shown value (0 on first mount) up/down to `to`
 * with an ease-out curve. Writes textContent directly so the tween never
 * re-renders React. Jumps straight to the value under reduced motion.
 */
export default function CountUp({ to, duration = 0.6, className }: { to: number; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const from = shown.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || from === to) {
      shown.current = to;
      el.textContent = String(to);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      const value = Math.round(from + (to - from) * (1 - (1 - t) ** 3));
      shown.current = value;
      el.textContent = String(value);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [to, duration]);

  return <span ref={ref} className={className} />;
}
