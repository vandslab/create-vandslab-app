import { ThemeToggle } from "@/components/theme-toggle";

const system = [
  { k: "framework", v: "Next.js 16" },
  { k: "runtime", v: "React 19 · TypeScript" },
  { k: "styling", v: "Tailwind 4" },
  { k: "rendering", v: "App Router · RSC" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-paper text-ink font-sans flex items-center px-6 py-16">
      <div className="mx-auto w-full max-w-xl">
        {/* top bar: wordmark + theme toggle */}
        <header className="flex items-center justify-between">
          <div className="text-2xl font-display font-extrabold tracking-tight">
            <span>Vands</span>
            <span className="ml-px rounded-md bg-ink px-1.5 text-paper">LAB</span>
          </div>
          <ThemeToggle />
        </header>

        {/* hero thesis */}
        <h1 className="mt-16 font-display text-5xl sm:text-6xl font-extrabold leading-[0.95] tracking-tight">
          Your stack
          <br />
          is live.
        </h1>
        <p className="mt-5 text-lg text-ink/55 max-w-md">
          A Vandslab starter, rendered with Next.js. Wired and ready — now make
          it yours.
        </p>

        {/* signature: system readout */}
        <section className="mt-12 overflow-hidden rounded-xl border border-line bg-panel">
          <div className="h-0.5 bg-linear-to-r from-aqua to-aqua-deep" />
          <div className="px-5 pt-4 pb-5">
            <p className="font-mono text-[11px] uppercase tracking-widest text-ink/35">
              // system
            </p>
            <dl className="mt-3 font-mono text-sm">
              {system.map((row) => (
                <div
                  key={row.k}
                  className="flex items-center justify-between border-b border-line/70 py-2.5 last:border-0"
                >
                  <dt className="text-ink/45">{row.k}</dt>
                  <dd className="text-ink">{row.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* orient: next step */}
        <p className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink/55">
          <span>Edit</span>
          <code className="rounded bg-ink/5 px-1.5 py-0.5 font-mono text-ink/80">
            src/app/page.tsx
          </code>
          <span>to begin.</span>
          <a
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener"
            className="ml-auto inline-flex items-center gap-1 font-medium text-aqua-deep underline decoration-aqua/40 underline-offset-4 transition hover:decoration-aqua"
          >
            Next.js docs
            <span aria-hidden="true">↗</span>
          </a>
        </p>
      </div>
    </main>
  );
}
