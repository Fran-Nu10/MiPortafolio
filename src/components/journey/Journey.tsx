import type { ReactNode } from "react";
import { CAPABILITIES } from "@/data/capabilities";
import { PROFILE } from "@/data/profile";
import { PROJECTS, getProject } from "@/data/projects";
import { SITE } from "@/data/site";
import type { Project, ProjectSlug } from "@/data/types";
import { resolveAsset } from "@/lib/assets";
import { confirmed, indexLabel, proofCaption, routeErrorText, stackLine } from "@/lib/content";
import type { SectionId } from "@/lib/journey-store";
import { pathForSection } from "@/lib/route-sync";
import { CapabilitiesRail } from "@/components/capabilities/CapabilitiesRail";
import { FinalCta } from "@/components/contact/FinalCta";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { FrancoAtWork } from "@/components/moments/FrancoAtWork";
import { HumanMoment } from "@/components/moments/HumanMoment";
import { OpeningHero } from "@/components/opening/OpeningHero";
import { Profile } from "@/components/profile/Profile";
import { ProjectReel, type ReelItemView } from "@/components/reel/ProjectReel";
import { ProjectProof, type ProofView } from "@/components/worlds/ProjectProof";
import { WorldScene, type WorldView } from "@/components/worlds/WorldScene";
import { JourneyClient } from "./JourneyClient";

/**
 * When this module was evaluated (build time for the static routes): the form's timing
 * check falls back to it without JavaScript, and the footer year comes from it.
 */
const RENDERED_AT = Date.now();

/**
 * The journey (Spec §01–§03): one server-rendered document, identical on `/` and on every
 * `/trabajo/{slug}`. Every word of copy is in the initial HTML; motion is layered on top by
 * each section's own client code. Copy flows server → client as props; client components
 * never import `data/`. Only confirmed claims are turned into props (Spec §21 rule 1).
 */
export function Journey({ initial }: { initial: ProjectSlug | null }) {
  const total = PROJECTS.length;

  const reelItems: ReelItemView[] = PROJECTS.map((p) => ({
    id: p.id,
    indexLabel: indexLabel(p.index, total),
    name: p.name,
    reelLine: p.reelLine,
    relationLine: p.relationLine,
    aspect: p.reel.aspect,
    poster: resolveAsset(p.reel.poster),
    reelLabel: p.a11y.reelLabel,
    enter: { href: pathForSection(p.id), label: SITE.reel.enter },
    open: openLink(p),
  }));

  const worldFor = (p: Project): WorldView => ({
    id: p.id,
    name: p.name,
    env: p.theme.env,
    tone: p.theme.tone,
    aspect: p.reel.aspect,
    poster: resolveAsset(p.screen.poster),
    copy: Object.entries(p.worldCopy).map(([key, text]) => ({ key, text })),
    credit: p.credit ? `${p.credit.label} · ${p.credit.holder}` : undefined,
  });

  const proofFor = (p: Project): ProofView => {
    const next = p.next === "capacidades" ? null : getProject(p.next);
    return {
      id: p.id,
      name: p.name,
      media: resolveAsset(p.proof.media),
      videoLabel: p.a11y.proofVideoLabel,
      caption: proofCaption(p),
      microCase: p.microCase,
      relationLine: p.relationLine,
      role: p.role,
      credit: p.credit ? `${p.credit.label} · ${p.credit.holder}` : undefined,
      stack: stackLine(p, SITE.world.stackLabel),
      open: openLink(p),
      next: next
        ? { href: pathForSection(next.id), label: `${SITE.world.next} ${next.name}` }
        : { href: pathForSection("capacidades"), label: `${SITE.world.next} ${SITE.world.capabilitiesName}` },
      tone: p.theme.tone,
    };
  };

  const email = confirmed(PROFILE.contacts.email);
  const linkedin = confirmed(PROFILE.contacts.linkedin);
  const contacts = [
    ...(email ? [{ label: email, href: `mailto:${email}` }] : []),
    ...(linkedin ? [{ label: "LinkedIn", href: linkedin }] : []),
  ];

  const titles: Partial<Record<SectionId, string>> = Object.fromEntries(PROJECTS.map((p) => [p.id, p.meta.title]));
  const initialProject = initial ? getProject(initial) : undefined;

  return (
    <>
      <SiteHeader
        view={{
          brand: SITE.nav.brand,
          firma: SITE.nav.firma,
          work: SITE.nav.work,
          profile: SITE.nav.profile,
          cta: SITE.nav.cta,
          projects: PROJECTS.map((p) => ({ id: p.id, index: p.index, name: p.name })),
        }}
      />
      <main id="contenido" data-initial={initial ?? undefined}>
        {initialProject ? (
          // no-JS deep link: jump to the world in the full document (Spec §20)
          <p className="no-js-only deep-link">
            <a href={`#${initialProject.id}`} className="link">
              {SITE.world.goTo} {initialProject.name}
            </a>
          </p>
        ) : null}
        <OpeningHero hero={SITE.hero} portrait={resolveAsset("franco.hero")} />
        <ProjectReel label={SITE.reel.label} heading={SITE.reel.heading} items={reelItems} />
        {PROJECTS.map((p) => (
          <ProjectWorld key={p.id} world={worldFor(p)} proof={proofFor(p)}>
            {p.id === "rayo-smash" && SITE.features.humanMoment ? <HumanMoment media={resolveAsset("moments.human")} /> : null}
          </ProjectWorld>
        ))}
        <CapabilitiesRail
          view={{
            heading: SITE.capabilities.heading,
            seam: SITE.capabilities.seam,
            kicker: SITE.capabilities.kicker,
            subKicker: SITE.capabilities.subKicker,
            bust: resolveAsset("franco.bust"),
            items: CAPABILITIES,
          }}
        />
        <Profile
          view={{
            label: PROFILE.label,
            core: PROFILE.core,
            extension: PROFILE.extension,
            stack: confirmed(PROFILE.stack),
            contacts,
          }}
        />
        {SITE.features.francoAtWork ? <FrancoAtWork media={resolveAsset("franco.atWork")} /> : null}
        <FinalCta
          renderedAt={RENDERED_AT}
          view={{
            title: SITE.cta.title,
            support: SITE.cta.support,
            footer: SITE.footer.line(new Date(RENDERED_AT).getFullYear()),
            form: {
              fields: SITE.cta.fields,
              button: SITE.cta.button,
              errors: { missing: SITE.cta.errors.missing, invalid: SITE.cta.errors.invalid },
              routeError: routeErrorText(SITE.cta.errors.route, SITE.cta.errors.routeEmail, email),
              success: SITE.cta.success,
              end: SITE.cta.end,
            },
          }}
        />
      </main>
      <JourneyClient initial={initial} titles={titles} homeTitle={SITE.meta.title} />
    </>
  );
}

/** a world, its proof, and whatever breath follows them */
function ProjectWorld({ world, proof, children }: { world: WorldView; proof: ProofView; children?: ReactNode }) {
  return (
    <>
      <WorldScene world={world} />
      <ProjectProof proof={proof} />
      {children}
    </>
  );
}

/** "Abrir ↗" only when the live URL is confirmed */
function openLink(p: Project) {
  const href = confirmed(p.liveUrl);
  return href ? { href, label: SITE.reel.open, aria: p.a11y.openLabel } : undefined;
}
