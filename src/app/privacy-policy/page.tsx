import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for GazeFocus, including data collection, usage, retention, and user rights.",
  alternates: {
    canonical: "/privacy-policy",
  },
  openGraph: {
    title: "GazeFocus Privacy Policy",
    description: "Read how GazeFocus handles personal data, privacy rights, and security practices.",
    url: "https://gaze-focus.vercel.app/privacy-policy",
    type: "website",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-4xl px-6 py-14 md:py-20">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Privacy Policy</h1>
        <p className="mt-3 text-sm text-muted-foreground">Effective date: April 10, 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-7 text-foreground/90 md:text-base">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. Overview</h2>
            <p>
              This Privacy Policy explains how GazeFocus collects, uses, stores, and protects your information
              when you use our website, app, and related services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">2. Information We Collect</h2>
            <p>We may collect the following categories of information:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Account information such as name, email, and login credentials.</li>
              <li>Usage data such as session activity, progress, and interactions.</li>
              <li>Device and technical data such as browser type and operating system.</li>
              <li>Settings and preferences you configure in the app.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">3. How We Use Information</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>To provide, maintain, and improve the service.</li>
              <li>To personalize user experience and save account preferences.</li>
              <li>To secure accounts, prevent abuse, and detect suspicious activity.</li>
              <li>To communicate service updates and important notices.</li>
              <li>To comply with legal obligations.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">4. Legal Bases (Where Applicable)</h2>
            <p>
              Depending on your location, we process personal data based on one or more legal bases such as
              consent, performance of a contract, legitimate interests, and legal compliance.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">5. Data Sharing</h2>
            <p>
              We do not share, sell, rent, or trade your personal information with anyone.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">6. Data Retention</h2>
            <p>
              We retain personal data for as long as necessary to provide the service, meet legal obligations,
              resolve disputes, and enforce agreements.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">7. Security</h2>
            <p>
              We use reasonable administrative, technical, and organizational safeguards to protect your
              information. No method of transmission or storage is completely secure.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">8. Your Rights</h2>
            <p>Depending on local law, you may have rights to access, correct, delete, or export your data.</p>
            <p>You may also have the right to object to or restrict certain processing activities.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">9. Children's Privacy</h2>
            <p>
              The service is not intended for children under the age required by applicable law. If we learn that
              we have collected data from a child without valid consent, we will take appropriate steps to remove it.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. When material changes are made, we will update
              the effective date and provide notice where required.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">11. Contact</h2>
            <p>
              For privacy-related questions or requests, contact us at: <strong>puru0kadek@gmail.com</strong>
            </p>
            <p>
              Business/Controller name: <strong>Purujith Kadekar</strong>
            </p>
            <p>
              Address: <strong>Banglore, India</strong>
            </p>
          </section>
        </div>

        <div className="mt-10 border-t border-border/70 pt-6 text-sm text-muted-foreground">
          <p>
            Also review our <Link href="/terms-and-conditions" className="underline underline-offset-4">Terms and Conditions</Link>.
          </p>
        </div>
      </div>
    </main>
  );
}
