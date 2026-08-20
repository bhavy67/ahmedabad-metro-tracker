import { useEffect, useRef, type RefObject, type DependencyList } from 'react';
import { createScope } from 'animejs';

/**
 * Runs an anime.js animation setup function scoped to a root element,
 * re-running (and properly reverting the previous run) whenever `deps`
 * change. Respects prefers-reduced-motion by skipping entirely.
 */
export function useAnimeScope<T extends HTMLElement>(
  setup: (root: T) => void,
  deps: DependencyList = []
): RefObject<T | null> {
  const root = useRef<T>(null);

  useEffect(() => {
    if (!root.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const scope = createScope({ root: root.current }).add(() => {
      setup(root.current as T);
    });
    return () => scope.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return root;
}
