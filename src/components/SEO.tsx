import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  author?: string;
  publishedTime?: string;
}

export function SEO({
  title = "Conexão na Cidade - Notícias da sua região",
  description = "Seu portal de notícias regional com informações relevantes da sua cidade e região.",
  image = "/icons/icon-512.png",
  url,
  type = "website",
  author,
  publishedTime,
}: SEOProps) {
  const fullTitle = title.includes("Conexão na Cidade") ? title : `${title} | Conexão na Cidade`;
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Conexão na Cidade" />
      <meta property="og:locale" content="pt_BR" />

      {type === "article" && author && (
        <>
          <meta property="article:author" content={author} />
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
        </>
      )}

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={currentUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      {/* Canonical */}
      <link rel="canonical" href={currentUrl} />
    </Helmet>
  );
}
