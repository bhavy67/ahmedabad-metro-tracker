import { Link } from 'react-router';
import { IconArrowUpRight, IconMap2, IconMapPin } from '@tabler/icons-react';
import { Bezel } from '@/components/Bezel.tsx';

export function NotFoundPage() {
  return (
    <div className="mx-auto w-full max-w-[640px] px-3.5 md:px-7">
      <Bezel className="rise" coreClassName="flex flex-col items-center px-6 py-14 text-center">
        <span className="eyebrow">404</span>
        <h1 className="mt-5 font-display text-[clamp(1.8rem,7vw,2.6rem)] leading-[1.05] font-medium tracking-[-0.04em]">
          This stop isn't <span className="glow-text">on the map.</span>
        </h1>
        <p className="mt-3 max-w-[34ch] text-[14px] text-muted-foreground">
          The page you were looking for doesn't exist. Pick up the journey from one of these instead.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <Link to="/" className="pill-btn">
            Back to now
            <span className="knob">
              <IconArrowUpRight size={17} stroke={1.75} />
            </span>
          </Link>
          <Link to="/map" className="pill-btn ghost">
            Live map
            <span className="knob">
              <IconMap2 size={16} stroke={1.75} />
            </span>
          </Link>
          <Link to="/plan" className="pill-btn ghost">
            Plan
            <span className="knob">
              <IconMapPin size={16} stroke={1.75} />
            </span>
          </Link>
        </div>
      </Bezel>
    </div>
  );
}
