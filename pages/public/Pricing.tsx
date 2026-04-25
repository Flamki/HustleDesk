import React from 'react';
import {
  CreditCard,
  Shield,
  Zap,
  Gift,
  Clock,
  Star,
  CheckCircle2,
  ArrowUpCircle,
  Heart,
} from 'lucide-react';
import { PublicPageTemplate } from './PublicPageTemplate';

export const Pricing: React.FC = () => (
  <PublicPageTemplate
    title="Pricing — Free Plan Available"
    description="GetSoloDesk is free for freelancers. Start with all core features at no cost. Upgrade only when you need advanced automation, analytics, and unlimited AI proposals."
    path="/pricing"
    keywords={[
      'freelancer crm pricing', 'free freelancer tools', 'freelance crm free plan',
      'freelancer software subscription', 'affordable freelance management tool',
      'getsolodesk pricing',
    ]}
    badge="Pricing"
    badgeColor="from-emerald-400 to-green-500"
    heading="Simple, "
    headingAccent="Fair Pricing"
    intro="Start free with everything you need to manage your freelance business. Upgrade when your business grows and you need advanced features."
    accentFrom="#10b981"
    accentTo="#22c55e"
    stats={[
      { value: '$0', label: 'To start' },
      { value: '0', label: 'Hidden fees' },
      { value: '30s', label: 'Setup time' },
      { value: '∞', label: 'Core features' },
    ]}
    features={[
      { icon: Gift, title: 'Generous Free Plan', desc: 'Job tracking, AI proposals, time tracking, templates, and portfolio builder — all included free.' },
      { icon: Zap, title: 'Instant Setup', desc: 'Sign up with Google and start in 30 seconds. No credit card required, no lengthy onboarding.' },
      { icon: ArrowUpCircle, title: 'Pro When You\'re Ready', desc: 'Unlock unlimited AI proposals, advanced analytics, and priority support when your business grows.' },
      { icon: CreditCard, title: 'Global Payments', desc: 'Razorpay checkout with international card, UPI, and wallet support. Pay from anywhere.' },
      { icon: Shield, title: 'No Hidden Fees', desc: 'No setup costs, no surprise charges, cancel anytime. What you see is what you pay.' },
      { icon: Heart, title: 'Built for Solo', desc: 'Priced for one person running their own business. Not enterprise pricing forced on freelancers.' },
      { icon: Clock, title: 'Cancel Anytime', desc: 'No contracts, no lock-in. Downgrade or cancel whenever you want with one click.' },
      { icon: Star, title: 'Priority Support', desc: 'Pro users get priority access to support, feature requests, and early access to new tools.' },
      { icon: CheckCircle2, title: 'Everything Included', desc: 'CRM, proposals, time tracking, analytics, portfolio, link-in-bio — one subscription covers all.' },
    ]}
    bullets={[
      'Free plan includes: job tracking, AI proposals, time tracking, templates, and portfolio builder',
      'No credit card required — sign up with Google and start in 30 seconds',
      'Pro plan unlocks: unlimited AI proposals, advanced analytics, priority support',
      'Razorpay checkout with international card, UPI, and wallet support',
      'No hidden fees, no setup costs, cancel anytime',
      'Solo freelancer friendly — built for one person, priced for one person',
    ]}
    ctaHeading="Start free. Upgrade when you're ready."
    ctaSub="No credit card. No pressure. Just better freelancing."
  />
);

export default Pricing;
