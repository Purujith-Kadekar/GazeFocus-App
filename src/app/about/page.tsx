import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | GazeFocus",
  description: "Learn about GazeFocus and our mission.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-4xl px-6 py-14 md:py-20">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">About GazeFocus</h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">
          GazeFocus is a distraction-free learning companion designed to help learners stay engaged while studying
          video content. Our focus is simple: help you build better learning consistency through intentional,
          user-friendly tools.
        </p>

        <div className="mt-10 space-y-8 text-sm leading-7 text-foreground/90 md:text-base">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Our Mission</h2>
            <p>
              We aim to make online learning more focused, effective, and measurable by reducing distractions and
              helping users maintain meaningful study sessions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">What We Build</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>Tools to support focused video-based learning.</li>
              <li>Progress and organization features for study content.</li>
              <li>User settings that adapt the platform to your workflow.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Our Commitment</h2>
            <p>
              We are committed to improving product reliability, user experience, and privacy practices as the
              platform evolves.
            </p>
          </section>

          <section className="space-y-4 rounded-xl border border-border/70 bg-card/40 p-5 md:p-6">
            <h2 className="text-xl font-semibold">Founder</h2>
            <div className="flex flex-col gap-5 md:flex-row md:items-start">
              <img
                src="/creator.jpg"
                alt="Creator"
                className="h-36 w-36 rounded-xl border border-[#D4870A]/30 object-cover grayscale saturate-0 contrast-110 transition duration-300 hover:grayscale-0 hover:saturate-100"
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold">Purujith Kadekar</h3>
                <p className="mt-2">
                  GazeFocus was founded to solve a simple but important problem: learners lose focus quickly while
                  studying online. The goal is to build tools that make deep focus easier, learning progress clearer,
                  and consistency sustainable.
                </p>
                <a
                  href="https://www.linkedin.com/in/purujith-kadekar/"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  LinkedIn
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
