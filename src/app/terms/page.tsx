import type { Metadata } from 'next';

import { LegalPageShell } from '@/components/legal/legal-page-shell';

export const metadata: Metadata = {
  title: 'Terms of Service — Family Finances',
  description: 'Terms for using the Family Finances household money tracker.',
};

export default function TermsPage() {
  return (
    <LegalPageShell title="Terms of Service" lastUpdated="25 June 2025">
      <p>
        These terms govern your use of Family Finances (&quot;the app&quot;), a
        private household money tracker. By signing in, you agree to these
        terms.
      </p>

      <h2>Eligibility and access</h2>
      <p>
        The app is intended for invited household members. Access is granted
        through Google sign-in and, where applicable, a household invitation
        from an existing member. You must use the app only for lawful personal
        or household financial management.
      </p>

      <h2>Your responsibilities</h2>
      <ul>
        <li>Keep your Google account secure.</li>
        <li>
          Only connect bank accounts you are authorized to access.
        </li>
        <li>
          Review imported and synced transactions for accuracy before relying on
          them for decisions.
        </li>
        <li>
          Do not attempt to access another household&apos;s data or disrupt the
          service.
        </li>
      </ul>

      <h2>Household data</h2>
      <p>
        When you join a household, financial data you add or import may be
        visible to other members of that household. The household owner controls
        membership and invites.
      </p>

      <h2>Bank connections</h2>
      <p>
        Optional bank sync provides read-only access to account information
        through Enable Banking and your bank&apos;s authorization flow. We do
        not execute payments or move money on your behalf. Bank availability,
        consent duration, and data freshness depend on your bank and Enable
        Banking.
      </p>

      <h2>Disclaimer</h2>
      <p>
        The app is provided &quot;as is&quot; for household budgeting and
        record-keeping. It is not financial, tax, or legal advice. Balances,
        categories, and reports may be incomplete or incorrect due to import
        errors, bank API limits, or user edits. Verify important figures
        against official bank statements.
      </p>

      <h2>Availability</h2>
      <p>
        We may update, suspend, or discontinue features at any time. We try to
        keep the service available but do not guarantee uninterrupted access.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, the app operators are not liable
        for indirect or consequential losses arising from use of the service,
        including decisions made based on displayed balances or categories.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. Continued use after changes are posted
        constitutes acceptance of the updated terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms should be directed to the administrator of
        your household or the person who invited you to the app.
      </p>
    </LegalPageShell>
  );
}
