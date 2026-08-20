import { useMemo, useState } from 'react';
import { IconSearch, IconChevronRight } from '@tabler/icons-react';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { allStations } from '@/src/lib/metro/network.ts';
import type { NetworkStation } from '@/src/lib/metro/types.ts';

export function StationPicker({
  label,
  value,
  onChange,
  exclude,
}: {
  label: string;
  value: NetworkStation | null;
  onChange: (station: NetworkStation) => void;
  exclude?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allStations()
      .filter(s => s.id !== exclude)
      .filter(s => !q || s.name.toLowerCase().includes(q) || s.nameGu.includes(q) || s.nameHi.includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [query, exclude]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-3.5 py-3 text-left">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="font-display text-sm font-semibold">{value ? value.name : 'Select a station'}</p>
        </div>
        <IconChevronRight size={16} className="text-muted-foreground" />
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85dvh]">
        <SheetHeader>
          <SheetTitle>{label}</SheetTitle>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">
          <div className="relative mb-2 shrink-0">
            <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search stations…"
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
            {results.map(station => (
              <li key={station.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(station);
                    setOpen(false);
                    setQuery('');
                  }}
                  className="flex w-full items-center gap-2.5 py-2.5 text-left"
                >
                  <span className="flex gap-0.5">
                    {station.lines.map(line => (
                      <span key={line} className="h-2 w-2 rounded-full" style={{ backgroundColor: `var(--line-${line})` }} />
                    ))}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{station.name}</span>
                  </span>
                </button>
              </li>
            ))}
            {results.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">No stations match "{query}"</li>}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}
