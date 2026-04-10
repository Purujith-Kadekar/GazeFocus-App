import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FYQ | GazeFocus",
  description: "Frequently asked questions for GazeFocus.",
};

const qaItems = [
  {
    q: "What is GazeFocus?",
    a: "GazeFocus is a learning-focused platform designed to help users stay attentive and organized while studying video-based content.",
  },
  {
    q: "Do I need an account to use GazeFocus?",
    a: "Yes. An account is required to use all GazeFocus functionalities. No feature is publicly available without signing in.",
  },
  {
    q: "How is my data used?",
    a: "We use your data to provide and improve the service, personalize your experience, and maintain platform security. See the Privacy Policy for full details.",
  },
  {
    q: "Can I delete my account and data?",
    a: "Yes. You can request account deletion, and we will process it according to applicable laws and our retention obligations.",
  },
  {
    q: "Where can I read your legal terms?",
    a: "You can review the Terms and Conditions and Privacy Policy on their dedicated pages.",
  },
];

export default function FYQPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-4xl px-6 py-14 md:py-20">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">FYQ</h1>
        <p className="mt-3 text-sm text-muted-foreground md:text-base">Frequently asked questions.</p>

        <div className="mt-10 space-y-6">
          {qaItems.map((item) => (
            <section key={item.q} className="rounded-lg border border-border/70 bg-card/40 p-5">
              <h2 className="text-base font-semibold md:text-lg">{item.q}</h2>
              {item.q === "Where can I read your legal terms?" ? (
                <p className="mt-2 text-sm leading-7 text-foreground/90 md:text-base">
                  You can review the{" "}
                  <Link href="/terms-and-conditions" className="underline underline-offset-4">
                    Terms and Conditions
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy-policy" className="underline underline-offset-4">
                    Privacy Policy
                  </Link>{" "}
                  on their dedicated pages.
                </p>
              ) : item.q === "How is my data used?" ? (
                <p className="mt-2 text-sm leading-7 text-foreground/90 md:text-base">
                  We use your data to provide and improve the service, personalize your experience, and maintain
                  platform security. See the{" "}
                  <Link href="/privacy-policy" className="underline underline-offset-4">
                    Privacy Policy
                  </Link>{" "}
                  for full details.
                </p>
              ) : (
                <p className="mt-2 text-sm leading-7 text-foreground/90 md:text-base">{item.a}</p>
              )}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
