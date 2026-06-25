import type { Metadata } from 'next';

import { LegalPageShell } from '@/components/legal/legal-page-shell';

export const metadata: Metadata = {
  title: 'Privacy Policy — Family Finances',
  description: 'How Family Finances collects, uses, and protects your data.',
};

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Privacy Policy" lastUpdated="25 June 2025">
      <p>
        Family Finances (&quot;the app&quot;) is a household money tracker for
        families and invited members. This policy explains what data we process
        and why.
      </p>

      <h2>Who operates the app</h2>
      <p>
        The app is operated for private household use. If you were invited to a
        household, the household owner is responsible for who can access shared
        financial data inside that household.
      </p>

      <h2>Data we collect</h2>
      <ul>
        <li>
          <strong>Account data</strong> — name, email address, and profile image
          from Google when you sign in.
        </li>
        <li>
          <strong>Financial data you add</strong> — transactions, categories,
          budgets, notes, import files, bank account labels, and saved reports
          for your household.
        </li>
        <li>
          <strong>Bank connection data</strong> — if you connect a bank through
          our read-only bank sync, we receive account identifiers and transaction
          data authorized by you at your bank. We do not store your bank login
          credentials.
        </li>
        <li>
          <strong>Technical data</strong> — standard request metadata (such as
          IP address and browser type) needed to run the service and satisfy
          regulatory requirements for bank data access.
        </li>
      </ul>

      <h2>How we use data</h2>
      <p>We use your data only to:</p>
      <ul>
        <li>authenticate you and keep you signed in;</li>
        <li>store and display your household finances;</li>
        <li>import and categorize transactions;</li>
        <li>sync transactions from banks you explicitly connect;</li>
        <li>share data with other members of the same household.</li>
      </ul>
      <p>
        We do not sell your personal or financial data. We do not use your data
        for advertising.
      </p>

      <h2>Who we share data with</h2>
      <p>Data is shared only as needed to run the app:</p>
      <ul>
        <li>
          <strong>Household members</strong> — people in the same household can
          see shared transactions, categories, budgets, and related records.
        </li>
        <li>
          <strong>Google</strong> — for sign-in (OAuth).
        </li>
        <li>
          <strong>Enable Banking</strong> — to initiate read-only bank
          connections and retrieve account information you authorize. See{' '}
          <a
            href="https://enablebanking.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-4 hover:underline"
          >
            Enable Banking
          </a>
          .
        </li>
        <li>
          <strong>Neon</strong> — PostgreSQL database hosting.
        </li>
        <li>
          <strong>Vercel</strong> — application hosting.
        </li>
      </ul>

      <h2>Retention</h2>
      <p>
        We keep your data while your account and household records exist. If you
        need data removed, contact the household owner or the app administrator.
      </p>

      <h2>Security</h2>
      <p>
        Access is protected by Google sign-in and database-backed sessions.
        Bank connections use industry-standard OAuth flows through Enable
        Banking. Secrets and credentials are stored in secure environment
        configuration, not in the application source code.
      </p>

      <h2>Your rights</h2>
      <p>
        Depending on where you live, you may have rights to access, correct, or
        delete personal data. Because financial records are shared inside a
        household, please coordinate requests with your household owner when
        applicable.
      </p>

      <h2>Contact</h2>
      <p>
        For privacy questions or data protection requests, contact the
        administrator of your household or the person who invited you to the app.
      </p>
    </LegalPageShell>
  );
}
