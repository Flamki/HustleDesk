import React from 'react';
import SEO from '../../components/SEO';
import { PublicPageLayout } from './PublicPageLayout';

export const PrivacyPolicy: React.FC = () => {
  return (
    <PublicPageLayout>
      <SEO
        title="Privacy Policy"
        description="GetSoloDesk privacy policy — how we collect, use, and protect your data."
        path="/privacy"
      />
      <section className="bg-white py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-slate-500 mb-12">Last updated: April 28, 2026</p>

          <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-6 prose-p:leading-relaxed prose-p:text-slate-600 prose-li:text-slate-600 prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline">
            <h2>1. Introduction</h2>
            <p>GetSoloDesk ("we," "our," or "us") operates the getsolodesk.com website and platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.</p>

            <h2>2. Information We Collect</h2>
            <h3>Account Information</h3>
            <p>When you create an account, we collect your email address and name (via Google OAuth or email signup). We do not store passwords — authentication is handled by Supabase Auth.</p>
            
            <h3>Usage Data</h3>
            <p>We collect information about how you use the platform: jobs added, proposals generated, time entries logged, and feature interactions. This data is used to improve the product and power AI features.</p>
            
            <h3>AI-Generated Content</h3>
            <p>When you use our AI Proposal Generator, we send job descriptions and your profile data to our AI provider (Fireworks AI) to generate proposals. We do not use your proposal data to train third-party AI models.</p>
            
            <h3>Cookies & Analytics</h3>
            <p>We use Vercel Analytics for anonymous usage metrics. We use essential cookies for authentication only. We do not use advertising cookies or trackers.</p>

            <h2>3. How We Use Your Information</h2>
            <ul>
              <li>To provide and maintain the GetSoloDesk platform</li>
              <li>To generate AI-powered proposals personalized to your profile</li>
              <li>To train your personal AI agent memory (per-user, never shared)</li>
              <li>To send follow-up reminders and transactional emails via Resend</li>
              <li>To process payments through Razorpay</li>
              <li>To improve our product based on aggregate usage patterns</li>
            </ul>

            <h2>4. Data Storage & Security</h2>
            <p>Your data is stored in Supabase (PostgreSQL) with Row Level Security (RLS) enabled on all tables. This means your data is cryptographically isolated — no other user can access your records, even through API errors.</p>
            <p>All data is encrypted in transit (TLS 1.2+) and at rest. We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>

            <h2>5. AI Agent Memory</h2>
            <p>Your AI agent memory (win/loss patterns, winning skills, tone preferences) is stored per-user and is never shared with other users or used to train models for other accounts. Your agent learns exclusively from your data.</p>

            <h2>6. Third-Party Services</h2>
            <p>We use the following third-party services that may process your data:</p>
            <ul>
              <li><strong>Supabase</strong> — Database, authentication, and file storage</li>
              <li><strong>Vercel</strong> — Hosting and serverless functions</li>
              <li><strong>Fireworks AI</strong> — AI proposal generation (processes job descriptions)</li>
              <li><strong>Resend</strong> — Transactional email delivery</li>
              <li><strong>Razorpay</strong> — Payment processing (we do not store card details)</li>
              <li><strong>Vercel Analytics</strong> — Anonymous usage analytics</li>
            </ul>

            <h2>7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal data at any time through the platform</li>
              <li>Export your data (jobs, time entries, proposals)</li>
              <li>Delete your account and all associated data</li>
              <li>Opt out of non-essential emails</li>
            </ul>
            <p>To exercise these rights, contact us at <a href="mailto:privacy@getsolodesk.com">privacy@getsolodesk.com</a>.</p>

            <h2>8. Data Retention</h2>
            <p>We retain your data for as long as your account is active. If you delete your account, all personal data is permanently removed within 30 days.</p>

            <h2>9. Children's Privacy</h2>
            <p>GetSoloDesk is not intended for users under 18. We do not knowingly collect data from minors.</p>

            <h2>10. Changes to This Policy</h2>
            <p>We may update this policy from time to time. We will notify you of material changes via email or in-app notification.</p>

            <h2>11. Contact</h2>
            <p>For privacy-related questions, contact us at <a href="mailto:privacy@getsolodesk.com">privacy@getsolodesk.com</a>.</p>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
};
