import React from 'react';
import { Globe } from 'lucide-react';
import { SiFiverr, SiLinkedin, SiUpwork } from 'react-icons/si';

export type PlatformKey = 'upwork' | 'fiverr' | 'linkedin' | 'other';

const normalizePlatform = (platform?: string): PlatformKey => {
  const p = (platform || '').trim().toLowerCase();
  if (p === 'upwork') return 'upwork';
  if (p === 'fiverr') return 'fiverr';
  if (p === 'linkedin') return 'linkedin';
  return 'other';
};

export const PlatformIcon: React.FC<{
  platform?: string;
  className?: string;
  title?: string;
}> = ({ platform, className = 'w-4 h-4', title }) => {
  const key = normalizePlatform(platform);
  const common = { className, title: title || platform || key } as const;

  if (key === 'upwork') return <SiUpwork {...common} />;
  if (key === 'fiverr') return <SiFiverr {...common} />;
  if (key === 'linkedin') return <SiLinkedin {...common} />;
  return <Globe {...common} />;
};

