import React from 'react';
import { useParams } from 'react-router-dom';
import { ProposalGenerator } from '../components/proposals/ProposalGenerator';

export const ProposalGeneratorPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const normalizedJobId = (() => {
    const raw = String(jobId || '');
    if (!raw) return '';
    try {
      return decodeURIComponent(raw).trim();
    } catch {
      return raw.trim();
    }
  })();

  if (!normalizedJobId) {
    return <div>Invalid Job ID</div>;
  }

  return <ProposalGenerator jobId={normalizedJobId} />;
};
