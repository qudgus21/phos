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
    <LegalPageLayout title="Privacy Policy" lastUpdated="April 2, 2026">
      <LegalSection title="1. Introduction">
        <p>
          This Privacy Policy explains how Phos AI (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses, discloses, and protects your information when you use the Phos AI service at phos.studio (&quot;Service&quot;). We are committed to protecting your privacy and handling your data transparently.
        </p>
        <p className="mt-3">
          By using the Service, you acknowledge that you have read and understood this Privacy Policy. If you do not agree, please discontinue use of the Service.
        </p>
      </LegalSection>

      <LegalSection title="2. Information We Collect">
        <p className="mb-3">We collect the following categories of information:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-foreground">Account Information:</strong> Name, email address, and profile information provided through third-party authentication (Google, Facebook, Kakao).
          </li>
          <li>
            <strong className="text-foreground">Uploaded Content:</strong> Images you upload to the Service for AI processing. We do not use your uploaded images to train AI models.
          </li>
          <li>
            <strong className="text-foreground">Usage Data:</strong> Features used, processing history, credit usage, timestamps, IP address, browser type, operating system, and device information.
          </li>
          <li>
            <strong className="text-foreground">Payment Information:</strong> Transaction records managed by our Merchant of Record, Polar. We do not directly collect or store your credit card or bank account details.
          </li>
          <li>
            <strong className="text-foreground">Cookies &amp; Similar Technologies:</strong> We use cookies and similar technologies to maintain sessions, remember preferences, and analyze usage. You can manage cookie preferences through your browser settings.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Legal Bases for Processing (GDPR)">
        <p className="mb-3">If you are in the EEA, UK, or Switzerland, we process your data based on the following legal grounds:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong className="text-foreground">Contractual Necessity:</strong> To provide the Service you requested (image processing, account management, credit system).</li>
          <li><strong className="text-foreground">Consent:</strong> Where you have given explicit consent, such as for marketing communications. You may withdraw consent at any time.</li>
          <li><strong className="text-foreground">Legitimate Interests:</strong> To improve and secure the Service, prevent fraud, and analyze usage patterns, where these interests are not overridden by your rights.</li>
          <li><strong className="text-foreground">Legal Obligation:</strong> To comply with applicable laws and regulations.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. How We Use Your Information">
        <ul className="list-disc pl-5 space-y-2">
          <li>To provide, operate, and maintain the Service.</li>
          <li>To process your image editing, retouching, and generation requests through AI models.</li>
          <li>To manage your account, credits, and subscriptions.</li>
          <li>To communicate with you regarding service updates and support inquiries.</li>
          <li>To analyze usage patterns and improve the Service.</li>
          <li>To detect and prevent fraud, abuse, and security threats.</li>
          <li>To comply with legal obligations and enforce our Terms of Service.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Data Sharing &amp; Third-Party Services">
        <p className="mb-3">
          We do not sell your personal information. We may share your data with the following categories of service providers, solely to operate and improve the Service:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-foreground">AI Processing Providers:</strong> Your uploaded images are transmitted to third-party AI providers (including Replicate) for processing. These providers process your data as sub-processors under their respective data processing agreements and may temporarily store images solely to complete the requested operation.
          </li>
          <li>
            <strong className="text-foreground">Payment Processor:</strong> Polar acts as our Merchant of Record, handling all billing, subscriptions, and refunds. Your payment information is collected and processed directly by Polar under their own privacy policy.
          </li>
          <li>
            <strong className="text-foreground">Infrastructure Providers:</strong> Cloud hosting, storage, authentication, and database services (e.g., Supabase, Vercel) that are essential to operating the Service.
          </li>
          <li>
            <strong className="text-foreground">Analytics Providers:</strong> Services that help us understand usage patterns in an aggregated and, where possible, anonymized manner.
          </li>
          <li>
            <strong className="text-foreground">Legal &amp; Compliance:</strong> We may disclose information if required by law, court order, or governmental authority, or to protect our rights, safety, or property.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="6. International Data Transfers">
        <p>
          We operate globally, and your data may be transferred to and processed in countries outside your country of residence, including South Korea and the United States. These countries may have different data protection laws. Where required by applicable law (e.g., GDPR), we use appropriate safeguards such as Standard Contractual Clauses (SCCs) or rely on adequacy decisions to ensure your data receives an equivalent level of protection.
        </p>
      </LegalSection>

      <LegalSection title="7. Data Retention">
        <p>
          We retain your personal data only for as long as necessary to fulfill the purposes described in this Privacy Policy, or as required by law. Upon account deletion, we will delete or anonymize your personal data within 30 days, except where retention is required for legal compliance (e.g., tax records, fraud prevention). Anonymized, aggregated data that cannot identify you may be retained indefinitely for analytical purposes.
        </p>
      </LegalSection>

      <LegalSection title="8. Data Security">
        <p>
          We implement commercially reasonable technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. These include encryption in transit (TLS), access controls, and regular security reviews. However, no system is completely secure, and we cannot guarantee absolute security.
        </p>
      </LegalSection>

      <LegalSection title="9. Your Privacy Rights">
        <p className="mb-3">Depending on your location, you may have the following rights:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong className="text-foreground">Access:</strong> Request a copy of the personal data we hold about you.</li>
          <li><strong className="text-foreground">Correction:</strong> Request correction of inaccurate or incomplete data.</li>
          <li><strong className="text-foreground">Deletion:</strong> Request deletion of your personal data (see our <a href="/data-deletion" className="text-primary hover:underline">Data Deletion Guide</a>).</li>
          <li><strong className="text-foreground">Restriction:</strong> Request that we restrict processing of your data in certain circumstances.</li>
          <li><strong className="text-foreground">Portability:</strong> Request a portable copy of your data where technically feasible.</li>
          <li><strong className="text-foreground">Objection:</strong> Object to processing based on legitimate interests.</li>
          <li><strong className="text-foreground">Withdraw Consent:</strong> Withdraw consent at any time where processing is based on consent.</li>
        </ul>

        <p className="mt-4 mb-2"><strong className="text-foreground">EEA/UK Residents (GDPR):</strong></p>
        <p>
          You have the right to lodge a complaint with your local supervisory authority if you believe your data has been processed unlawfully.
        </p>

        <p className="mt-4 mb-2"><strong className="text-foreground">California Residents (CCPA/CPRA):</strong></p>
        <p>
          You have the right to know what personal information we collect, request its deletion, and opt out of the sale or sharing of your personal information. We do not sell or share your personal information for cross-context behavioral advertising. You will not be discriminated against for exercising your privacy rights.
        </p>

        <p className="mt-4">
          To exercise any of these rights, contact us at <a href="mailto:phos.support@gmail.com" className="text-primary hover:underline">phos.support@gmail.com</a>. We will respond within the timeframe required by applicable law (typically 30 days).
        </p>
      </LegalSection>

      <LegalSection title="10. Children&apos;s Privacy">
        <p>
          The Service is not directed to individuals under the age of 16 (or the applicable age of digital consent in your jurisdiction). We do not knowingly collect personal information from children. If we become aware that we have collected data from a child without appropriate consent, we will promptly delete it. If you believe a child has provided us with personal data, please contact us.
        </p>
      </LegalSection>

      <LegalSection title="11. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal requirements. We will post the revised policy on this page with an updated &quot;Last updated&quot; date. For material changes, we will make reasonable efforts to provide notice via email or in-app notification. Your continued use of the Service after any changes constitutes your acceptance of the updated Privacy Policy.
        </p>
      </LegalSection>

      <LegalSection title="12. Contact Us">
        <p>
          If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us at:<br />
          <a href="mailto:phos.support@gmail.com" className="text-primary hover:underline">phos.support@gmail.com</a>
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
