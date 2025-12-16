import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

interface SEOProps {
  titleKey?: string;
  descriptionKey?: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  noIndex?: boolean;
}

const BASE_URL = 'https://carnexo.app';

const SEO = ({
  titleKey = 'seo.home.title',
  descriptionKey = 'seo.home.description',
  path = '',
  image = '/pwa-192x192.png',
  type = 'website',
  noIndex = false,
}: SEOProps) => {
  const { t, i18n } = useTranslation();

  const title = t(titleKey);
  const description = t(descriptionKey);
  const canonicalUrl = `${BASE_URL}${path}`;
  const imageUrl = image.startsWith('http') ? image : `${BASE_URL}${image}`;
  const currentLang = i18n.language;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <html lang={currentLang} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:locale" content={currentLang} />
      <meta property="og:site_name" content="CarNexo" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {/* Alternate Languages */}
      <link rel="alternate" hrefLang="en" href={`${BASE_URL}${path}`} />
      <link rel="alternate" hrefLang="es" href={`${BASE_URL}${path}`} />
      <link rel="alternate" hrefLang="pt" href={`${BASE_URL}${path}`} />
      <link rel="alternate" hrefLang="x-default" href={`${BASE_URL}${path}`} />
    </Helmet>
  );
};

export default SEO;
