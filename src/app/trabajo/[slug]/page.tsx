import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PROJECTS, getProject } from "@/data/projects";
import { Journey } from "@/components/journey/Journey";

/**
 * `/trabajo/{slug}` (Spec §20): the same journey as `/`, starting at the world, with the
 * project's own metadata (Content Master 17). Unknown slugs are a 404.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) return {};
  return {
    title: p.meta.title,
    description: p.meta.description,
    openGraph: { title: p.meta.title, description: p.meta.description, type: "website", locale: "es" },
    twitter: { card: "summary", title: p.meta.title, description: p.meta.description },
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) notFound();
  return <Journey initial={p.id} />;
}
