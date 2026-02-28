import { Metadata } from "next";
import {
  LegalPageLayout,
  LegalSection,
} from "@/components/sections/legal/legal-page-layout";

export const metadata: Metadata = {
  title: "Privacy Policy — Phos AI",
  description: "Privacy Policy for Phos AI image editing and generation service.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="February 28, 2026">
      <LegalSection title="1. Introduction">
        <p>
          This Privacy Policy describes how Anelo (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses, and shares information in connection with the Phos AI service (&quot;Service&quot;). By accessing or using our Service, you agree to this Privacy Policy.
        </p>
      </LegalSection>

      <LegalSection title="2. Information We Collect">
        <p className="mb-3">We collect the following types of information:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-foreground">Account Information:</strong> Name, email address, and profile information provided through social login (Google, Facebook, Kakao).
          </li>
          <li>
            <strong className="text-foreground">Uploaded Content:</strong> Images and other files you upload to the Service for processing.
          </li>
          <li>
            <strong className="text-foreground">Usage Data:</strong> Information about how you interact with the Service, including features used, processing history, credit usage, IP address, browser type, and device information.
          </li>
          <li>
            <strong className="text-foreground">Payment Information:</strong> Transaction records and billing details processed through our third-party payment providers.
          </li>
          <li>
            <strong className="text-foreground">Cookies &amp; Analytics:</strong> We use cookies and similar tracking technologies to analyze usage patterns, improve the Service, and deliver a personalized experience.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. How We Use Your Information">
        <ul className="list-disc pl-5 space-y-2">
          <li>To provide, maintain, and improve the Service.</li>
          <li>To process your image editing and generation requests through AI models.</li>
          <li>To manage your account, credits, and billing.</li>
          <li>To communicate with you about updates, promotions, and support.</li>
          <li>
            To improve our AI models and overall service quality. Uploaded images and associated metadata may be used to train, fine-tune, and enhance our AI processing capabilities.
          </li>
          <li>To detect and prevent fraud, abuse, and security threats.</li>
          <li>To comply with legal obligations.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Data Sharing &amp; Third-Party Services">
        <p className="mb-3">
          We may share your information with the following categories of third parties:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-foreground">AI Processing Providers:</strong> Your uploaded images are transmitted to third-party AI service providers, including but not limited to Replicate and Stability AI, for processing. These providers may temporarily store your data as necessary to complete the processing.
          </li>
          <li>
            <strong className="text-foreground">Infrastructure Providers:</strong> Cloud hosting, storage, and database services (e.g., Supabase, Vercel) that help us operate the Service.
          </li>
          <li>
            <strong className="text-foreground">Analytics Providers:</strong> Services that help us understand usage patterns and improve the Service.
          </li>
          <li>
            <strong className="text-foreground">Legal Requirements:</strong> We may disclose information when required by law, regulation, or legal process.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Data Retention">
        <p>
          We retain your personal information for as long as your account is active or as needed to provide the Service. Upon account deletion, we will delete or anonymize your personal data within 30 days, except where retention is required by law or for legitimate business purposes (e.g., fraud prevention, dispute resolution). Anonymized and aggregated data may be retained indefinitely.
        </p>
      </LegalSection>

      <LegalSection title="6. Data Security">
        <p>
          We implement commercially reasonable technical and organizational measures to protect your information. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
        </p>
      </LegalSection>

      <LegalSection title="7. Your Rights">
        <p className="mb-3">Depending on your jurisdiction, you may have the right to:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Access the personal data we hold about you.</li>
          <li>Request correction of inaccurate data.</li>
          <li>Request deletion of your data (see our <a href="/data-deletion" className="text-primary hover:underline">Data Deletion Guide</a>).</li>
          <li>Object to or restrict certain processing activities.</li>
          <li>Data portability where technically feasible.</li>
        </ul>
        <p className="mt-3">
          To exercise these rights, contact us at <a href="mailto:support@anelo.kr" className="text-primary hover:underline">support@anelo.kr</a>.
        </p>
      </LegalSection>

      <LegalSection title="8. International Data Transfers">
        <p>
          Your information may be transferred to and processed in countries other than your country of residence, including South Korea, the United States, and other jurisdictions where our service providers operate. By using the Service, you consent to such transfers.
        </p>
      </LegalSection>

      <LegalSection title="9. Children&apos;s Privacy">
        <p>
          The Service is not intended for users under the age of 14. We do not knowingly collect personal information from children. If we become aware of such collection, we will take steps to delete the information promptly.
        </p>
      </LegalSection>

      <LegalSection title="10. Changes to This Policy">
        <p>
          We may update this Privacy Policy at any time. We will notify you of material changes by posting the updated policy on this page with a revised &quot;Last updated&quot; date. Your continued use of the Service after changes constitutes acceptance of the updated policy.
        </p>
      </LegalSection>

      <LegalSection title="11. Contact Us">
        <p>
          For questions about this Privacy Policy, contact us at:<br />
          <a href="mailto:support@anelo.kr" className="text-primary hover:underline">support@anelo.kr</a>
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
