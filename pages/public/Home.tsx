import React from 'react';
import SEO from '../../components/SEO';
import { LandingPage } from '../LandingPage';

export const Home: React.FC = () => {
  return (
    <>
      <SEO
        title="Freelancer CRM & Time Tracking"
        description="Manage clients, proposals, time tracking, portfolio and link-in-bio pages in one platform."
        path="/"
      />
      <LandingPage />
    </>
  );
};

export default Home;
