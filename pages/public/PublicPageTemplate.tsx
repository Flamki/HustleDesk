import React from 'react';
import SEO from '../../components/SEO';
import { PublicPageLayout } from './PublicPageLayout';

type Props = {
  title: string;
  description: string;
  path: string;
  heading: string;
  intro: string;
  bullets: string[];
  keywords?: string[];
};

export const PublicPageTemplate: React.FC<Props> = ({
  title,
  description,
  path,
  heading,
  intro,
  bullets,
  keywords,
}) => {
  const canonicalPath = path.startsWith('/') ? path : `/${path}`;
  const canonicalUrl = `https://getsolodesk.com${canonicalPath === '/' ? '' : canonicalPath}`;
  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `${title} | GetSoloDesk`,
      description,
      url: canonicalUrl,
      inLanguage: 'en-US',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://getsolodesk.com',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: title,
          item: canonicalUrl,
        },
      ],
    },
  ];

  return (
    <PublicPageLayout>
      <SEO
        title={title}
        description={description}
        path={path}
        keywords={keywords}
        structuredData={schema}
      />
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{heading}</h1>
        <p className="mt-4 text-lg text-slate-600 leading-relaxed">{intro}</p>
        <div className="mt-8 grid gap-3">
          {bullets.map((bullet) => (
            <div key={bullet} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700">
              {bullet}
            </div>
          ))}
        </div>
      </section>
    </PublicPageLayout>
  );
};
