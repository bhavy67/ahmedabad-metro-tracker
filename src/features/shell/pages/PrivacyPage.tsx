import { Bezel } from '@/components/Bezel.tsx';
import { BackButton } from '@/src/features/shell/BackButton.tsx';

const UPDATED = '9 October 2026';
const ISSUES_URL = 'https://github.com/bhavy67/ahmedabad-metro-tracker/issues';

/**
 * Privacy policy — required for the Play Store listing and linked from the
 * footer. Keep it in step with what the app actually does: if a new network
 * call, analytics or storage key is added, this page must change too.
 */
export function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-[760px] px-3.5 md:px-7">
      <header className="rise px-1.5 pb-6">
        <BackButton className="mb-6" />
        <span className="eyebrow">Privacy</span>
        <h1 className="mt-4 font-display text-[clamp(1.9rem,7vw,2.8rem)] leading-[1.05] font-medium tracking-[-0.04em]">
          Your data stays <span className="glow-text">on your phone.</span>
        </h1>
        <p className="mt-3 text-[14px] text-muted-foreground">Last updated {UPDATED}</p>
      </header>

      <Bezel className="rise" style={{ '--i': 1 } as React.CSSProperties} coreClassName="space-y-7 text-[15px] leading-relaxed text-muted-foreground">
        <Section title="The short version">
          MetroNow has no accounts, no ads, no analytics and no tracking. Nothing you do in the app is sent to us, because
          we don't run a server that collects anything. MetroNow is an unofficial app and is not affiliated with Gujarat
          Metro Rail Corporation (GMRC).
        </Section>

        <Section title="Your location">
          If you tap <b className="text-foreground">Use my location</b>, your device shares its position with the app so it
          can find the nearest metro station. That calculation happens entirely on your device. Your location is never
          sent to us or to anyone else, and it isn't stored. You can deny or revoke location access at any time in your
          phone or browser settings; the rest of the app keeps working.
        </Section>

        <Section title="What's saved on your device">
          Your favourite stations, your saved commute, your three most recent journeys and whether you dismissed the
          install prompt are kept in your device's local storage so they're there next time. They never leave your
          device, and clearing the app's storage (or using <b className="text-foreground">Clear cache &amp; reload</b>)
          removes them.
        </Section>

        <Section title="Services the app talks to">
          <ul className="mt-1 list-disc space-y-2 pl-5">
            <li>
              <b className="text-foreground">Place search</b> — when you search for a place, the text you type is sent to{' '}
              <a className="text-foreground underline" href="https://osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noopener noreferrer">
                OpenStreetMap's Nominatim
              </a>{' '}
              service to look it up. Your location is not included.
            </li>
            <li>
              <b className="text-foreground">Map</b> — the live map loads map tiles from{' '}
              <a className="text-foreground underline" href="https://openfreemap.org" target="_blank" rel="noopener noreferrer">
                OpenFreeMap
              </a>
              .
            </li>
            <li>
              <b className="text-foreground">Hosting</b> — the app is served by Vercel, which, like any web host, receives
              standard request information such as your IP address to deliver the app.
            </li>
          </ul>
          <p className="mt-3">
            Like any website, these services can see the request coming from your device (for example your IP address).
            Their own privacy policies apply.
          </p>
        </Section>

        <Section title="Timetable and accuracy">
          Train positions and times are computed from the published GMRC timetable on your device. They show where trains
          are scheduled to be, not live tracking, and can't reflect delays or disruptions.
        </Section>

        <Section title="Children">
          MetroNow doesn't collect personal information from anyone, including children.
        </Section>

        <Section title="Changes and contact">
          If this policy changes, the date at the top will change with it. Questions or concerns? Open an issue on{' '}
          <a className="text-foreground underline" href={ISSUES_URL} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          .
        </Section>
      </Bezel>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 font-display text-[17px] font-medium tracking-tight text-foreground">{title}</h2>
      <div>{children}</div>
    </section>
  );
}
