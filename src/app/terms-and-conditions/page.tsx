import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "Terms and Conditions for using GazeFocus, including eligibility, permitted use, and legal obligations.",
  alternates: {
    canonical: "/terms-and-conditions",
  },
  openGraph: {
    title: "GazeFocus Terms and Conditions",
    description: "Read the terms of service and legal conditions for using GazeFocus.",
    url: "https://gaze-focus.vercel.app/terms-and-conditions",
    type: "website",
  },
};

export default function TermsAndConditionsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-4xl px-6 py-14 md:py-20">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Terms and Conditions</h1>
        <p className="mt-2 text-sm text-muted-foreground">Also referred to as Terms of Service</p>
        <p className="mt-1 text-sm text-muted-foreground">Effective date: April 10, 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-7 text-foreground/90 md:text-base">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
            <p>
              By accessing or using GazeFocus, you agree to be bound by these Terms and all applicable laws and
              regulations. If you do not agree, you must not use the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">2. Eligibility and Accounts</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>You must provide accurate account information and keep it up to date.</li>
              <li>You are responsible for activities under your account and safeguarding credentials.</li>
              <li>We may suspend or terminate accounts that violate these Terms or applicable law.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">3. Permitted Use</h2>
            <p>You agree to use the service only for lawful purposes and in a way that does not:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Infringe the rights of others.</li>
              <li>Interfere with or disrupt the service or related infrastructure.</li>
              <li>Attempt unauthorized access to data, systems, or accounts.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">4. Intellectual Property</h2>
            <p>
              Unless otherwise stated, the service content, branding, software, and materials are owned by or
              licensed to GazeFocus and protected by intellectual property laws.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">5. Third-Party Services</h2>
            <p>
              The service may integrate third-party platforms, APIs, or content. We are not responsible for
              third-party availability, policies, or practices.
            </p>
            <p>
              We do not share, sell, rent, or trade your personal information with anyone.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">6. Disclaimers</h2>
            <p>
              The service is provided on an "as is" and "as available" basis without warranties of any kind,
              express or implied, except where prohibited by law.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">7. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, GazeFocus and its affiliates will not be liable for indirect,
              incidental, special, consequential, or punitive damages arising from your use of the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">8. Indemnification</h2>
            <p>
              You agree to defend, indemnify, and hold harmless GazeFocus from claims, liabilities, damages,
              losses, and expenses arising out of your use of the service or breach of these Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">9. Termination</h2>
            <p>
              We may suspend or terminate access to the service at any time, with or without notice, if required to
              protect users, systems, or legal compliance.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">10. Governing Law</h2>
            <p>
              These Terms are governed by the laws of <strong>India</strong>, without regard to conflict
              of law principles.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">11. Changes to Terms</h2>
            <p>
              We may modify these Terms from time to time. Continued use of the service after updates means you
              accept the revised Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">12. Contact</h2>
            <p>
              For questions about these Terms, contact: <strong>gazefocus.app@gmail.com</strong>
            </p>
            <p>
              Legal entity: <strong>Purujith Kadekar</strong>
            </p>
          </section>
        </div>

        <div className="mt-10 border-t border-border/70 pt-6 text-sm text-muted-foreground">
          <p>
            Please also review our <Link href="/privacy-policy" className="underline underline-offset-4">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </main>
  );
}
