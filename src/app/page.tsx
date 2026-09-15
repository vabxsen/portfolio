import { PortfolioView } from '@/components/portfolio-view';
import { getPublished } from '@/lib/storage';
export const dynamic = 'force-dynamic';
export async function generateMetadata() {
  const { seo } = await getPublished();
  return {
    title: { absolute: seo.title },
    description: seo.description,
    openGraph: { title: seo.title, description: seo.description },
    twitter: { title: seo.title, description: seo.description },
  };
}
export default async function Home() {
  return <PortfolioView content={await getPublished()} />;
}
