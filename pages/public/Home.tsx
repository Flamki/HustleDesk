import React from 'react';
import SEO from '../../components/SEO';
import { LandingPage } from '../LandingPage';

const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'GetSoloDesk',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://getsolodesk.com',
  description:
    'Freelancer CRM platform to manage clients, proposals, time tracking, portfolio pages, and link-in-bio sites.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'GetSoloDesk',
  url: 'https://getsolodesk.com',
  logo: 'https://getsolodesk.com/logo-wordmark.svg',
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'GetSoloDesk',
  url: 'https://getsolodesk.com',
  inLanguage: 'en-US',
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Does GetSoloDesk apply to jobs for me?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. GetSoloDesk helps you manage your applications and generate proposals, but you stay in control and submit yourself.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I use it for Upwork and Fiverr?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. GetSoloDesk is platform-agnostic and supports workflows for Upwork, Fiverr, Freelancer, LinkedIn, and direct clients.',
      },
    },
    {
      '@type': 'Question',
      name: 'What does GetSoloDesk include?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'It includes freelancer CRM, AI proposals, time tracking, analytics, portfolio pages, and link-in-bio publishing.',
      },
    },
  ],
};

export const Home: React.FC = () => {
  return (
    <>
      <SEO
        title="Freelancer CRM & Time Tracking"
        description="Manage clients, proposals, time tracking, portfolio and link-in-bio pages in one platform."
        path="/"
        keywords={[
          'freelancer crm',
          'crm for freelancers',
          'proposal generator',
          'time tracking for freelancers',
          'client management software',
          'portfolio builder',
        ]}
        structuredData={[softwareSchema, organizationSchema, websiteSchema, faqSchema]}
      />
      <LandingPage />
    </>
  );
};

export default Home;
