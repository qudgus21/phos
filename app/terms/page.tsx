import { Metadata } from "next";
import {
  LegalPageLayout,
  LegalSection,
} from "@/components/sections/legal/legal-page-layout";

export const metadata: Metadata = {
  title: "Terms of Service — Phos AI",
  description: "Terms of Service for Phos AI image editing and generation service.",
};

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout title="Terms of Service" lastUpdated="February 28, 2026">
      <LegalSection title="1. Acceptance of Terms">
        <p>
          By accessing or using the Phos AI service (&quot;Service&quot;) operated by Anelo (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree, you must not use the Service.
        </p>
      </LegalSection>

      <LegalSection title="2. Service Description">
        <p>
          Phos AI provides AI-powered image retouching, editing, and generation tools. The Service processes user-uploaded images through artificial intelligence models to produce enhanced or modified outputs. Results may vary and are not guaranteed to meet specific expectations.
        </p>
      </LegalSection>

      <LegalSection title="3. Account &amp; Eligibility">
        <ul className="list-disc pl-5 space-y-2">
          <li>You must be at least 14 years of age to use the Service.</li>
          <li>You are responsible for maintaining the security of your account credentials.</li>
          <li>You are solely responsible for all activities that occur under your account.</li>
          <li>We reserve the right to suspend or terminate accounts at our sole discretion for any violation of these Terms.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Credits &amp; Payments">
        <ul className="list-disc pl-5 space-y-2">
          <li>The Service operates on a credit-based system. Credits are required to process images and access certain features.</li>
          <li>Credit prices and allocations are subject to change at any time without prior notice.</li>
          <li>Credits are non-transferable between accounts.</li>
          <li>Purchased credits do not expire unless your account is terminated for violation of these Terms.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Refund Policy">
        <ul className="list-disc pl-5 space-y-2">
          <li>Refund requests must be submitted within 7 days of purchase.</li>
          <li>Only unused credits are eligible for refund. Credits that have been consumed (used for image processing) are non-refundable.</li>
          <li>Refunds will be processed to the original payment method within 5-10 business days.</li>
          <li>We reserve the right to deny refund requests in cases of suspected abuse or fraud.</li>
          <li>Free or promotional credits are not eligible for refund under any circumstances.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. User Content &amp; License">
        <p className="mb-3">By uploading content to the Service, you:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Represent and warrant that you own or have the necessary rights to use and upload such content.</li>
          <li>
            Grant us a worldwide, non-exclusive, royalty-free, sublicensable license to use, reproduce, modify, and process your uploaded content solely for the purpose of providing and improving the Service, including AI model training and quality enhancement.
          </li>
          <li>Acknowledge that AI-generated outputs may not be eligible for copyright protection in all jurisdictions.</li>
          <li>Retain ownership of your original uploaded content, subject to the license granted above.</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Prohibited Use">
        <p className="mb-3">You agree not to use the Service to:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Generate illegal, harmful, or offensive content.</li>
          <li>Create non-consensual intimate imagery or deepfakes of real individuals.</li>
          <li>Infringe upon intellectual property rights of others.</li>
          <li>Attempt to reverse-engineer, decompile, or extract the underlying AI models.</li>
          <li>Circumvent usage limits, credit systems, or security measures.</li>
          <li>Use automated tools (bots, scrapers) to access the Service without authorization.</li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Service Availability &amp; Modifications">
        <p>
          We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time, with or without notice. We are not liable for any modification, suspension, or discontinuation of the Service. We do not guarantee uninterrupted or error-free operation.
        </p>
      </LegalSection>

      <LegalSection title="9. Limitation of Liability">
        <p>
          To the maximum extent permitted by applicable law, the Company and its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or business opportunities, arising out of or in connection with your use of the Service, regardless of the theory of liability. Our total aggregate liability shall not exceed the amount you have paid to us in the twelve (12) months preceding the claim.
        </p>
      </LegalSection>

      <LegalSection title="10. Indemnification">
        <p>
          You agree to indemnify, defend, and hold harmless the Company and its affiliates from and against any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys&apos; fees) arising from your use of the Service, your violation of these Terms, or your infringement of any third-party rights.
        </p>
      </LegalSection>

      <LegalSection title="11. Disclaimer of Warranties">
        <p>
          The Service is provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; without warranties of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that AI processing results will be accurate, complete, or suitable for your specific needs.
        </p>
      </LegalSection>

      <LegalSection title="12. Changes to Terms">
        <p>
          We reserve the right to modify these Terms at any time. Changes will be effective upon posting to this page. We will make reasonable efforts to notify users of material changes via email or in-app notice. Your continued use of the Service after changes constitutes acceptance of the updated Terms.
        </p>
      </LegalSection>

      <LegalSection title="13. Governing Law &amp; Dispute Resolution">
        <p>
          These Terms shall be governed by and construed in accordance with the laws of the Republic of Korea. Any disputes arising out of or in connection with these Terms shall be submitted to the exclusive jurisdiction of the courts of Suwon, Gyeonggi Province, Republic of Korea.
        </p>
      </LegalSection>

      <LegalSection title="14. Contact">
        <p>
          For questions about these Terms, contact us at:<br />
          <a href="mailto:support@anelo.kr" className="text-primary hover:underline">support@anelo.kr</a>
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
