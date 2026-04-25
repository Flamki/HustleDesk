import React from 'react';
import {
  Sparkles,
  Brain,
  Globe,
  FileText,
  Zap,
  Target,
  Award,
  BarChart3,
  Lightbulb,
} from 'lucide-react';
import { PublicPageTemplate } from './PublicPageTemplate';

export const ProposalGenerator: React.FC = () => (
  <PublicPageTemplate
    title="AI Proposal Generator for Freelancers"
    description="Generate winning freelance proposals in seconds with AI. Personalized to each job, learns from your wins, and works for Upwork, Fiverr, and direct clients."
    path="/proposal-generator"
    keywords={[
      'ai proposal generator', 'freelance proposal generator', 'upwork proposal generator',
      'ai proposal writer', 'freelance cover letter generator',
      'proposal templates for freelancers', 'best proposal generator',
    ]}
    badge="AI-Powered"
    badgeColor="from-violet-400 to-purple-500"
    heading="AI Proposals That "
    headingAccent="Win Clients"
    intro="Stop spending 30 minutes writing each proposal. Your personal AI agent generates tailored, high-converting proposals in seconds — learning from your wins to get better every time."
    accentFrom="#8b5cf6"
    accentTo="#a855f7"
    stats={[
      { value: '5s', label: 'Average generation time' },
      { value: '3x', label: 'Higher response rate' },
      { value: '36+', label: 'Proven templates' },
      { value: '10x', label: 'Faster than manual' },
    ]}
    features={[
      { icon: Sparkles, title: 'AI-Powered Generation', desc: 'Paste a job description, click generate, and get a tailored proposal in seconds. Every word optimized for conversion.' },
      { icon: Brain, title: 'Learns From Your Wins', desc: 'The AI studies your successful proposals and adapts tone, length, and structure to match what actually works for you.' },
      { icon: Globe, title: 'Multi-Platform Support', desc: 'Works for Upwork, Fiverr, Freelancer.com, LinkedIn, and direct email outreach. Platform-specific formatting included.' },
      { icon: FileText, title: '36+ Proven Templates', desc: 'Start from battle-tested templates covering web development, design, writing, marketing, and consulting.' },
      { icon: Target, title: 'Skill Highlighting', desc: 'AI automatically highlights your most relevant skills and experience for each specific job posting.' },
      { icon: Zap, title: 'Tone & Length Control', desc: 'Choose Professional, Friendly, or Bold tone. Set length to Short, Medium, or Long. Full control over the output.' },
      { icon: Award, title: 'Optimal Pricing Suggestions', desc: 'Based on your win data, AI suggests the pricing sweet spot for each type of project.' },
      { icon: BarChart3, title: 'Proposal Analytics', desc: 'Track which proposals get responses and which don\'t. Refine your approach with data.' },
      { icon: Lightbulb, title: 'Smart Suggestions', desc: 'Get AI-powered tips on what to add, remove, or rephrase before you send. Real-time coaching.' },
    ]}
    bullets={[
      'AI-powered proposals personalized to each job description and your unique skills',
      'Learns from your wins and losses — every proposal gets smarter over time',
      'Works for Upwork, Fiverr, Freelancer.com, LinkedIn, and direct clients',
      '36 proven proposal templates you can customize and copy-paste instantly',
      'Highlights your strongest skills and optimal pricing based on win data',
      'Generate proposals 10x faster and respond to leads before competitors',
    ]}
    ctaHeading="Write proposals that actually get responses."
    ctaSub="Let AI do the heavy lifting while you focus on doing great work."
  />
);

export default ProposalGenerator;
