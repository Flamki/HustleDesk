import React from 'react';
import SEO from '../../components/SEO';
import { PublicPageLayout } from './PublicPageLayout';

export const TermsOfService: React.FC = () => {
  return (
    <PublicPageLayout>
      <SEO
        title="Terms of Service"
        description="GetSoloDesk terms of service — rules and conditions for using our platform."
        path="/terms"
      />
      <section className="bg-white py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">Terms of Service</h1>
          <p className="text-sm text-slate-500 mb-12">Last updated: April 28, 2026</p>

          <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-6 prose-p:leading-relaxed prose-p:text-slate-600 prose-li:text-slate-600 prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline">
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing or using GetSoloDesk ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service.</p>

            <h2>2. Description of Service</h2>
            <p>GetSoloDesk is a SaaS platform that provides freelancer CRM, AI-powered proposal generation, time tracking, invoicing, and related tools. The Service is provided "as is" and is continually evolving.</p>

            <h2>3. Accounts</h2>
            <p>You must provide accurate information when creating an account. You are responsible for maintaining the security of your account credentials. You must be at least 18 years old to use the Service.</p>
            <p>One person or legal entity may maintain no more than one free account.</p>

            <h2>4. Free and Paid Plans</h2>
            <p>GetSoloDesk offers a free tier with core features and a paid Pro tier ($9/month) with additional capabilities. We reserve the right to modify pricing with 30 days' notice to existing subscribers.</p>
            <p>Payments are processed through Razorpay. Subscriptions auto-renew monthly unless cancelled. Refunds are handled on a case-by-case basis within 14 days of charge.</p>

            <h2>5. AI-Generated Content</h2>
            <p>The AI Proposal Generator creates content based on your inputs. You own all AI-generated proposals. However:</p>
            <ul>
              <li>AI-generated content may contain inaccuracies. You are responsible for reviewing and editing all proposals before sending them.</li>
              <li>GetSoloDesk does not guarantee that AI-generated proposals will win contracts.</li>
              <li>We do not claim ownership of your proposals, job data, or client information.</li>
            </ul>

            <h2>6. Your Data</h2>
            <p>You retain ownership of all data you input into GetSoloDesk (jobs, clients, time entries, proposals, invoices). We do not sell your data. See our <a href="/privacy">Privacy Policy</a> for details on how we handle your information.</p>

            <h2>7. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to access other users' data</li>
              <li>Reverse-engineer, decompile, or disassemble the Service</li>
              <li>Use the AI features to generate spam, fraudulent proposals, or misleading content</li>
              <li>Exceed reasonable usage limits (automated scraping, bulk API calls)</li>
            </ul>

            <h2>8. Service Availability</h2>
            <p>We aim for high availability but do not guarantee uninterrupted service. We may perform maintenance, deploy updates, or experience downtime. We will make reasonable efforts to notify users of planned maintenance.</p>

            <h2>9. Limitation of Liability</h2>
            <p>GetSoloDesk is provided "as is" without warranties of any kind. To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service.</p>
            <p>Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.</p>

            <h2>10. Termination</h2>
            <p>You may delete your account at any time. We may suspend or terminate accounts that violate these terms. Upon termination, your data will be deleted within 30 days per our data retention policy.</p>

            <h2>11. Changes to Terms</h2>
            <p>We may update these terms from time to time. We will notify you of material changes via email. Continued use of the Service after changes constitutes acceptance.</p>

            <h2>12. Governing Law</h2>
            <p>These terms are governed by the laws of India. Any disputes shall be resolved in the courts of India.</p>

            <h2>13. Contact</h2>
            <p>For questions about these terms, contact us at <a href="mailto:legal@getsolodesk.com">legal@getsolodesk.com</a>.</p>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
};
