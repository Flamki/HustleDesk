import React from 'react';
import type { PortfolioBuilderState } from '../builder/builderTypes';
import { PortfolioTemplateBase } from './PortfolioTemplateBase';

export const ModernGradientTemplate: React.FC<{ state: PortfolioBuilderState }> = ({ state }) => {
  return <PortfolioTemplateBase state={state} variant="gradient" />;
};

