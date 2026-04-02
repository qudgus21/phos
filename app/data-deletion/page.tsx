import { Metadata } from "next";
import {
  LegalPageLayout,
  LegalSection,
} from "@/components/sections/legal/legal-page-layout";

export const metadata: Metadata = {
  title: "Data Deletion — Phos AI",
  description: "How to request deletion of your data from Phos AI.",
};

export default function DataDeletionPage() {
  return (
    <LegalPageLayout title="Data Deletion" lastUpdated="April 2, 2026">
      <LegalSection title="1. Your Right to Deletion">
        <p>
          You have the right to request deletion of your personal data at any time. This right is guaranteed under various data protection laws, including the GDPR (EU/UK), CCPA (California), and PIPA (South Korea). We are committed to processing your request promptly and transparently.
        </p>
      </LegalSection>

      <LegalSection title="2. How to Request Data Deletion">
        <p className="mb-3">
          To request deletion of your account and associated data, send an email to:
        </p>
        <p className="mb-3">
          <a href="mailto:hbh4231@gmail.com" className="text-primary hover:underline font-medium">
            hbh4231@gmail.com
          </a>
        </p>
        <p className="mb-3">Please include the following information so we can verify and process your request:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Subject line: &quot;Data Deletion Request&quot;</li>
          <li>The email address associated with your Phos AI account.</li>
          <li>Your name as it appears on the account.</li>
        </ul>
        <p className="mt-3">
          We may ask you to verify your identity before processing the request to protect your account security.
        </p>
      </LegalSection>

      <LegalSection title="3. What Will Be Deleted">
        <p className="mb-3">Upon processing your request, we will permanently delete:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Your account profile, login credentials, and authentication data.</li>
          <li>All uploaded images and AI-generated outputs stored on our servers.</li>
          <li>Image processing history and credit usage records.</li>
          <li>Any personal preferences and settings.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. What May Be Retained">
        <p className="mb-3">
          In certain cases, limited data may be retained after your deletion request:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-foreground">Legal &amp; Regulatory Obligations:</strong> Transaction records and financial data required by tax, accounting, or other applicable laws (typically retained for the legally mandated period).
          </li>
          <li>
            <strong className="text-foreground">Anonymized Data:</strong> Aggregated, statistical data that has been irreversibly anonymized and cannot be linked back to you.
          </li>
          <li>
            <strong className="text-foreground">Fraud &amp; Abuse Prevention:</strong> Minimal records necessary to prevent repeated abuse of the Service, in accordance with our legitimate interests.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Processing Timeline">
        <ul className="list-disc pl-5 space-y-2">
          <li>We will acknowledge your request within 3 business days.</li>
          <li>Deletion will be completed within 30 days, as required by GDPR and other applicable laws.</li>
          <li>You will receive a confirmation email once the deletion is complete.</li>
          <li>Your account will be deactivated immediately upon receiving the request. You will not be charged during the processing period.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Third-Party Data">
        <p className="mb-3">
          Your data may also be held by third-party service providers we use to operate the Service:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-foreground">AI Providers (Replicate):</strong> Images sent for AI processing may be temporarily stored by the provider. We will request deletion in accordance with our data processing agreements.
          </li>
          <li>
            <strong className="text-foreground">Payment Processor (Polar):</strong> Payment records are managed by Polar as our Merchant of Record and are subject to Polar&apos;s own data retention and legal obligations.
          </li>
          <li>
            <strong className="text-foreground">Infrastructure (Supabase, Vercel):</strong> Data stored on our infrastructure providers will be deleted as part of the standard deletion process.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Before You Delete">
        <p>
          Account and data deletion is <strong className="text-foreground">permanent and irreversible</strong>. Once completed, you will not be able to recover your account, uploaded images, generated outputs, or any remaining credits. We strongly recommend downloading any content you wish to keep before submitting a deletion request.
        </p>
      </LegalSection>

      <LegalSection title="8. Contact">
        <p>
          If you have questions about the data deletion process or need assistance, contact us at:<br />
          <a href="mailto:hbh4231@gmail.com" className="text-primary hover:underline">hbh4231@gmail.com</a>
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
