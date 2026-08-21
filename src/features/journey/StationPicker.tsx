import { useMemo, useState } from 'react';
import { IconSearch, IconChevronRight, IconMapPin, IconFlag } from '@tabler/icons-react';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { allStations } from '@/src/lib/metro/network.ts';
import type { NetworkStation } from '@/src/lib/metro/types.ts';

export function StationPicker({
  label,
  value,
  onChange,
  exclude,
  icon = 'from',
}: {
  label: string;
  value: NetworkStation | null;
  onChange: (station: NetworkStation) => void;
  exclude?: string;
  icon?: 'from' | 'to';
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

  const Icon = icon === 'from' ? IconMapPin : IconFlag;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="press flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-left shadow-sm">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
          <Icon size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          <span className="block truncate font-display text-[15px] font-semibold text-foreground">
            {value ? value.name : 'Select a station'}
          </span>
        </span>
        <IconChevronRight size={18} className="text-muted-foreground" />
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85dvh] rounded-t-3xl">
        <SheetHeader className="pb-2">
          <SheetTitle className="font-display text-[17px] font-semibold">{label}</SheetTitle>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">
          <div className="relative mb-3 shrink-0">
            <IconSearch size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search stations…"
              className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-[15px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
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
                  className="press flex w-full items-center gap-3 py-3 text-left"
                >
                  <span className="flex shrink-0 gap-0.5">
                    {station.lines.map(line => (
                      <span key={line} className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: `var(--line-${line})` }} />
                    ))}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-foreground">{station.name}</span>
                    {station.isInterchange && (
                      <span className="block text-[12px] text-muted-foreground">Interchange</span>
                    )}
                  </span>
                  <IconChevronRight size={16} className="text-muted-foreground" />
                </button>
              </li>
            ))}
            {results.length === 0 && <li className="py-8 text-center text-[14px] text-muted-foreground">No stations match "{query}"</li>}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}
