import React from 'react';
import { useParams } from 'react-router-dom';
import { ProposalGenerator } from '../components/proposals/ProposalGenerator';

export const ProposalGeneratorPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();

  if (!jobId) {
    return <div>Invalid Job ID</div>;
  }

  return <ProposalGenerator jobId={jobId} />;
};