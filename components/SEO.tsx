import React from 'react';
import { Head } from 'vite-react-ssg';

type SEOProps = {
  title: string;
  description: string;
};

const SITE_NAME = 'HustleDesk';
const SITE_URL = 'https://hustledesk.com';

export const SEO: React.FC<SEOProps> = ({ title, description }) => {
  const fullTitle = `${title} | ${SITE_NAME}`;
  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:url" content={SITE_URL} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
    </Head>
  );
};

export default SEO;
