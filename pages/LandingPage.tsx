
import React from 'react';
import { Navbar } from '../components/landing/Navbar';
import { Hero } from '../components/landing/Hero';
import { Manifesto } from '../components/landing/Manifesto';
import { Features } from '../components/landing/Features';
import { Testimonials } from '../components/landing/Testimonials';
import { Workflow } from '../components/landing/Workflow';
import { RoiCalculator } from '../components/landing/RoiCalculator';
import { Pricing } from '../components/landing/Pricing';
import { FAQ } from '../components/landing/FAQ';
import { Footer } from '../components/landing/Footer';

export const LandingPage: React.FC = () => {
  return (
    <div className="landing-premium-grain min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
      <Navbar />
      <main>
        <Hero />
        <Manifesto />
        {/* Workflow moved up for better flow */}
        <Workflow />
        <Features />
        <Testimonials />
        <RoiCalculator />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
};
