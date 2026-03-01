import React from 'react';
import { Head } from 'vite-react-ssg';

type StructuredData = Record<string, unknown> | Array<Record<string, unknown>>;

type SEOProps = {
  title: string;
  description: string;
  path: string;
  image?: string;
  keywords?: string[];
  noindex?: boolean;
  type?: 'website' | 'article';
  structuredData?: StructuredData;
};

const SITE_NAME = 'GetSoloDesk';
const SITE_URL = 'https://getsolodesk.com';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.svg`;

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  path,
  image,
  keywords,
  noindex = false,
  type = 'website',
  structuredData,
}) => {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const canonicalUrl = `${SITE_URL}${normalizedPath === '/' ? '' : normalizedPath}`;
  const ogImage = image || DEFAULT_OG_IMAGE;
  const robots = noindex
    ? 'noindex, nofollow, noarchive'
    : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
  const schemaItems = !structuredData
    ? []
    : Array.isArray(structuredData)
      ? structuredData
      : [structuredData];

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && keywords.length > 0 ? <meta name="keywords" content={keywords.join(', ')} /> : null}
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonicalUrl} />
      <meta name="application-name" content={SITE_NAME} />
      <meta name="apple-mobile-web-app-title" content={SITE_NAME} />
      <meta name="theme-color" content="#0f172a" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={`${SITE_NAME} preview`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      {schemaItems.map((schema, index) => (
        <script key={`ld-json-${index}`} type="application/ld+json">
          {JSON.stringify(schema).replace(/</g, '\\u003c')}
        </script>
      ))}
    </Head>
  );
};

export default SEO;

