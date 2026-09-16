import { cache } from 'react';
import { PortfolioView } from '@/components/portfolio-view';
import { getPublished } from '@/lib/storage';
export const dynamic = 'force-dynamic';
// Metadata and the page share a single storage read per request.
const getContent = cache(getPublished);
export async function generateMetadata() {
  const { seo } = await getContent();
  return {
    title: { absolute: seo.title },
    description: seo.description,
    openGraph: { title: seo.title, description: seo.description },
    twitter: { title: seo.title, description: seo.description },
  };
}
export default async function Home() {
  return <PortfolioView content={await getContent()} />;
}
