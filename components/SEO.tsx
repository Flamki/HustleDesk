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
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
};

const SITE_NAME = 'GetSoloDesk';
const SITE_URL = 'https://getsolodesk.com';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;
const TWITTER_HANDLE = '@getsolodesk';

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  path,
  image,
  keywords,
  noindex = false,
  type = 'website',
  structuredData,
  publishedTime,
  modifiedTime,
  author,
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
      <meta name="googlebot" content={robots} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Alternate language */}
      <link rel="alternate" hrefLang="en" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      {/* App meta */}
      <meta name="application-name" content={SITE_NAME} />
      <meta name="apple-mobile-web-app-title" content={SITE_NAME} />
      <meta name="theme-color" content="#0f172a" />
      <meta name="author" content={author || SITE_NAME} />
      <meta name="generator" content="GetSoloDesk" />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:alt" content={`${title} - ${SITE_NAME}`} />

      {/* Article meta (for blog/content pages) */}
      {publishedTime ? <meta property="article:published_time" content={publishedTime} /> : null}
      {modifiedTime ? <meta property="article:modified_time" content={modifiedTime} /> : null}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:creator" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={`${title} - ${SITE_NAME}`} />

      {/* Structured Data (JSON-LD) */}
      {schemaItems.map((schema, index) => (
        <script key={`ld-json-${index}`} type="application/ld+json">
          {JSON.stringify(schema).replace(/</g, '\\u003c')}
        </script>
      ))}
    </Head>
  );
};

export default SEO;
