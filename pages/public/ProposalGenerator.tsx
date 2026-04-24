import React from 'react';
import { PublicPageTemplate } from './PublicPageTemplate';

export const ProposalGenerator: React.FC = () => (
  <PublicPageTemplate
    title="AI Proposal Generator for Freelancers"
    description="Generate winning freelance proposals in seconds with AI. Personalized to each job, learns from your wins, and works for Upwork, Fiverr, and direct clients."
    path="/proposal-generator"
    keywords={[
      'ai proposal generator',
      'freelance proposal generator',
      'upwork proposal generator',
      'ai proposal writer',
      'freelance cover letter generator',
      'proposal templates for freelancers',
      'how to write freelance proposals',
      'best proposal generator',
    ]}
    heading="AI Proposal Generator"
    intro="Stop spending 30 minutes writing each proposal. Your personal AI agent generates tailored, high-converting proposals in seconds — learning from your wins to get better every time."
    bullets={[
      'AI-powered proposals personalized to each job description and your unique skills',
      'Learns from your wins and losses — every proposal gets smarter over time',
      'Works for Upwork, Fiverr, Freelancer.com, LinkedIn, and direct clients',
      '36 proven proposal templates you can customize and copy-paste instantly',
      'Highlights your strongest skills and optimal pricing based on win data',
      'Generate proposals 10x faster and respond to leads before competitors',
    ]}
  />
);

export default ProposalGenerator;
