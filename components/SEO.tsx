import React from 'react';
import { Head } from 'vite-react-ssg';

type SEOProps = {
  title: string;
  description: string;
  path: string;
  image?: string;
};

const SITE_NAME = 'GetSoloDesk';
const SITE_URL = 'https://getsolodesk.com';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.svg`;

export const SEO: React.FC<SEOProps> = ({ title, description, path, image }) => {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const canonicalUrl = `${SITE_URL}${normalizedPath === '/' ? '' : normalizedPath}`;
  const ogImage = image || DEFAULT_OG_IMAGE;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Head>
  );
};

export default SEO;

