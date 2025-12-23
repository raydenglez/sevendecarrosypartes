import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

interface ProductJsonLd {
  name: string;
  description: string;
  image: string[];
  offers: {
    price: number;
    priceCurrency: string;
    availability: 'InStock' | 'OutOfStock' | 'SoldOut';
    seller?: {
      name: string;
    };
  };
  brand?: string;
  model?: string;
  vehicleIdentificationNumber?: string;
  mileageFromOdometer?: {
    value: number;
    unitCode: string;
  };
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface SEOProps {
  titleKey?: string;
  descriptionKey?: string;
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article' | 'product' | 'profile';
  noIndex?: boolean;
  productJsonLd?: ProductJsonLd;
  breadcrumbs?: BreadcrumbItem[];
}

const BASE_URL = 'https://carnetworx.app';

const SEO = ({
  titleKey,
  descriptionKey,
  title: directTitle,
  description: directDescription,
  path = '',
  image = '/pwa-192x192.png',
  type = 'website',
  noIndex = false,
  productJsonLd,
  breadcrumbs,
}: SEOProps) => {
  const { t, i18n } = useTranslation();

  const title = directTitle || (titleKey ? t(titleKey) : t('seo.home.title'));
  const description = directDescription || (descriptionKey ? t(descriptionKey) : t('seo.home.description'));
  const canonicalUrl = `${BASE_URL}${path}`;
  const imageUrl = image.startsWith('http') ? image : `${BASE_URL}${image}`;
  const currentLang = i18n.language;

  // Generate Product JSON-LD for listings
  const generateProductJsonLd = () => {
    if (!productJsonLd) return null;

    const jsonLd: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: productJsonLd.name,
      description: productJsonLd.description,
      image: productJsonLd.image,
      offers: {
        '@type': 'Offer',
        price: productJsonLd.offers.price,
        priceCurrency: productJsonLd.offers.priceCurrency,
        availability: `https://schema.org/${productJsonLd.offers.availability}`,
        ...(productJsonLd.offers.seller && {
          seller: {
            '@type': 'Organization',
            name: productJsonLd.offers.seller.name,
          },
        }),
      },
    };

    if (productJsonLd.brand) {
      jsonLd.brand = {
        '@type': 'Brand',
        name: productJsonLd.brand,
      };
    }

    if (productJsonLd.model) {
      jsonLd.model = productJsonLd.model;
    }

    if (productJsonLd.vehicleIdentificationNumber) {
      jsonLd.vehicleIdentificationNumber = productJsonLd.vehicleIdentificationNumber;
    }

    if (productJsonLd.mileageFromOdometer) {
      jsonLd.mileageFromOdometer = {
        '@type': 'QuantitativeValue',
        value: productJsonLd.mileageFromOdometer.value,
        unitCode: productJsonLd.mileageFromOdometer.unitCode,
      };
    }

    return JSON.stringify(jsonLd);
  };

  // Generate Breadcrumb JSON-LD
  const generateBreadcrumbJsonLd = () => {
    if (!breadcrumbs || breadcrumbs.length === 0) return null;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`,
      })),
    };

    return JSON.stringify(jsonLd);
  };

  const productJsonLdScript = generateProductJsonLd();
  const breadcrumbJsonLdScript = generateBreadcrumbJsonLd();

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
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content={currentLang} />
      <meta property="og:site_name" content="CarNetworx" />

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

      {/* JSON-LD Structured Data */}
      {productJsonLdScript && (
        <script type="application/ld+json">{productJsonLdScript}</script>
      )}
      {breadcrumbJsonLdScript && (
        <script type="application/ld+json">{breadcrumbJsonLdScript}</script>
      )}
    </Helmet>
  );
};

export default SEO;
