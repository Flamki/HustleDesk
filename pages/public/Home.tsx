import React from 'react';
import SEO from '../../components/SEO';
import { LandingPage } from '../LandingPage';

const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'GetSoloDesk',
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'CRM',
  operatingSystem: 'Web',
  url: 'https://getsolodesk.com',
  description:
    'AI-powered freelancer CRM with proposal generation, job tracking, time tracking, portfolio builder, and personalized coaching. Built for independent professionals on Upwork, Fiverr, and direct clients.',
  featureList: [
    'AI Proposal Generator',
    'Job Pipeline Tracker',
    'Time Tracking',
    'Portfolio Builder',
    'Link-in-Bio Pages',
    'Email Marketing',
    'Follow-up Reminders',
    'Per-User AI Agent',
    'Client Management',
    'Analytics Dashboard',
  ],
  screenshot: 'https://getsolodesk.com/og-default.png',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free plan with all core features',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '120',
    bestRating: '5',
    worstRating: '1',
  },
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'GetSoloDesk',
  url: 'https://getsolodesk.com',
  logo: 'https://getsolodesk.com/logo-wordmark.svg',
  sameAs: [],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'noreply@getsolodesk.com',
    availableLanguage: 'English',
  },
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'GetSoloDesk',
  alternateName: 'Solo Desk',
  url: 'https://getsolodesk.com',
  inLanguage: 'en-US',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://getsolodesk.com/?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is GetSoloDesk?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'GetSoloDesk is an AI-powered CRM built specifically for freelancers. It helps you track jobs, generate winning proposals, manage clients, track time, build portfolio sites, and get personalized AI coaching to win more clients.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does GetSoloDesk apply to jobs for me?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. GetSoloDesk helps you manage your applications and generate proposals with AI, but you stay in control and submit yourself. Your AI agent learns from your wins and losses to make each proposal better.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I use it for Upwork and Fiverr?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. GetSoloDesk is platform-agnostic and supports workflows for Upwork, Fiverr, Freelancer.com, LinkedIn, Toptal, and direct clients. Track all your freelance work in one place.',
      },
    },
    {
      '@type': 'Question',
      name: 'What does GetSoloDesk include?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'It includes a freelancer CRM, AI-powered proposal generator, time tracking, job pipeline, analytics dashboard, portfolio builder, link-in-bio pages, email marketing, automated follow-up reminders, and a personal AI coaching agent that learns from your performance.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is GetSoloDesk free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, GetSoloDesk offers a generous free plan with all core features. You can manage jobs, generate AI proposals, track time, and build your portfolio without paying anything.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does the AI proposal generator work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Paste a job description and your AI agent generates a personalized, high-converting proposal based on your profile, skills, and past winning patterns. Each proposal improves as the agent learns from your outcomes.',
      },
    },
  ],
};

export const Home: React.FC = () => {
  return (
    <>
      <SEO
        title="AI-Powered Freelancer CRM — Win More Clients"
        description="GetSoloDesk is the AI-powered CRM for freelancers. Generate winning proposals, track jobs across Upwork & Fiverr, manage clients, and get personalized AI coaching — all free."
        path="/"
        keywords={[
          'freelancer crm',
          'crm for freelancers',
          'freelance crm software',
          'ai proposal generator',
          'freelance proposal generator',
          'upwork proposal generator',
          'time tracking for freelancers',
          'freelancer client management',
          'freelance portfolio builder',
          'freelance job tracker',
          'best crm for freelancers',
          'free freelancer tools',
          'ai freelance assistant',
          'freelance productivity tools',
        ]}
        structuredData={[softwareSchema, organizationSchema, websiteSchema, faqSchema]}
      />
      <LandingPage />
    </>
  );
};

export default Home;
