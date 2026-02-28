import { Metadata } from "next";
import {
  LegalPageLayout,
  LegalSection,
} from "@/components/sections/legal/legal-page-layout";

export const metadata: Metadata = {
  title: "User Data Deletion — Phos AI",
  description: "How to request deletion of your data from Phos AI.",
};

export default function DataDeletionPage() {
  return (
    <LegalPageLayout title="User Data Deletion" lastUpdated="February 28, 2026">
      <LegalSection title="1. Overview">
        <p>
          At Phos AI, we respect your right to control your personal data. This page explains how you can request deletion of your data from our systems and what to expect during the process.
        </p>
      </LegalSection>

      <LegalSection title="2. How to Request Data Deletion">
        <p className="mb-3">
          To request deletion of your account and associated data, send an email to:
        </p>
        <p className="mb-3">
          <a href="mailto:support@anelo.kr" className="text-primary hover:underline font-medium">
            support@anelo.kr
          </a>
        </p>
        <p className="mb-3">Please include the following in your request:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Subject line: &quot;Data Deletion Request&quot;</li>
          <li>The email address associated with your Phos AI account.</li>
          <li>Your full name as registered on the account.</li>
          <li>A brief statement requesting data deletion.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. What Gets Deleted">
        <p className="mb-3">Upon processing your request, we will delete:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Your account profile and login credentials.</li>
          <li>Uploaded images and generated outputs stored on our servers.</li>
          <li>Image processing history and credit usage records.</li>
          <li>Payment records (except where retention is required by tax or financial regulations).</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. What May Be Retained">
        <p className="mb-3">
          Certain data may be retained even after a deletion request:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-foreground">Anonymized &amp; Aggregated Data:</strong> Statistical and anonymized data derived from your usage that cannot be linked back to you.
          </li>
          <li>
            <strong className="text-foreground">Legal &amp; Regulatory Obligations:</strong> Data required to be retained under applicable laws (e.g., tax records, transaction logs for financial compliance).
          </li>
          <li>
            <strong className="text-foreground">AI Model Training Data:</strong> If your uploaded content was used to improve our AI models prior to your deletion request, such improvements are embedded within the model and cannot be individually extracted or removed.
          </li>
          <li>
            <strong className="text-foreground">Fraud Prevention:</strong> Limited records may be retained to prevent abuse and protect the integrity of the Service.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Processing Timeline">
        <ul className="list-disc pl-5 space-y-2">
          <li>We will acknowledge your request within 3 business days.</li>
          <li>Data deletion will be completed within 30 days of the request.</li>
          <li>You will receive a confirmation email once the deletion is complete.</li>
          <li>During the processing period, your account may be deactivated.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Third-Party Data">
        <p>
          Please note that data shared with third-party AI providers (such as Replicate and Stability AI) during image processing is subject to their respective data retention policies. We will make reasonable efforts to request deletion from these providers, but cannot guarantee their compliance timelines.
        </p>
      </LegalSection>

      <LegalSection title="7. Account Recovery">
        <p>
          Once your data has been deleted, the process is irreversible. You will not be able to recover your account, uploaded images, or unused credits. We recommend downloading any content you wish to keep before submitting a deletion request.
        </p>
      </LegalSection>

      <LegalSection title="8. Contact">
        <p>
          For questions about data deletion, contact us at:<br />
          <a href="mailto:support@anelo.kr" className="text-primary hover:underline">support@anelo.kr</a>
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
