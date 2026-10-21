import type { ReactNode } from "react";
import { CAPABILITIES } from "@/data/capabilities";
import { PROFILE } from "@/data/profile";
import { PROJECTS, getProject } from "@/data/projects";
import { RAYO_LAYERS, RAYO_STACK } from "@/data/rayo-layers";
import { SANTI_PHOTOS } from "@/data/santi-photos";
import { CHEF_PHOTOS } from "@/data/chef-photos";
import { SITE } from "@/data/site";
import type { Project, ProjectSlug } from "@/data/types";
import { resolveAsset } from "@/lib/assets";
import { confirmed, indexLabel, liveLabel, miniLabel, proofCaption, rangeLabel, routeErrorText, stackLine } from "@/lib/content";
import type { SectionId } from "@/lib/journey-store";
import { pathForSection } from "@/lib/route-sync";
import { showreelOf } from "@/lib/showreel";
import { TS_KEY_WORDS, splitField, splitList } from "@/lib/ts-world";
import { splitPurchaseLine } from "@/lib/chef-world";
import { resolveEvidence } from "@/lib/capabilities-rail";
import { splitFinal } from "@/lib/declaration";
import { CapabilitiesRail, type CapabilityCardView } from "@/components/capabilities/CapabilitiesRail";
import type { EvidenceData } from "@/components/capabilities/EvidenceElement";
import { FinalCta } from "@/components/contact/FinalCta";
import { Declaration } from "@/components/declaration/Declaration";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { FrancoAtWork } from "@/components/moments/FrancoAtWork";
import { HumanMoment } from "@/components/moments/HumanMoment";
import { OpeningHero } from "@/components/opening/OpeningHero";
import { Profile } from "@/components/profile/Profile";
import { ProjectReel, type ReelItemView } from "@/components/reel/ProjectReel";
import { ProjectProof, type ProofView } from "@/components/worlds/ProjectProof";
import { ChefWorld, type ChefView } from "@/components/worlds/ChefWorld";
import { RayoWorld, type RayoView } from "@/components/worlds/RayoWorld";
import { SantiWorld, type SantiView } from "@/components/worlds/SantiWorld";
import { TravelSuiteWorld, type TsView } from "@/components/worlds/TravelSuiteWorld";
import { WorldScene, type WorldView } from "@/components/worlds/WorldScene";
import { JourneyClient } from "./JourneyClient";

/**
 * When this module was evaluated (build time for the static routes): the form's timing
 * check falls back to it without JavaScript, and the footer year comes from it.
 */
const RENDERED_AT = Date.now();

/**
 * The optional sections (Spec §13): off until their media is approved. A preview build may show
 * their placeholders (`PREVIEW_MOMENTS=1` at build time, never on Vercel production) — the
 * sections carry no copy and no evidence claim, so a placeholder there is honest.
 */
const PREVIEW_MOMENTS = process.env.PREVIEW_MOMENTS === "1" && process.env.VERCEL_ENV !== "production";
const FEATURES = {
  humanMoment: SITE.features.humanMoment || PREVIEW_MOMENTS,
  francoAtWork: SITE.features.francoAtWork || PREVIEW_MOMENTS,
};

/**
 * The journey (Spec §01–§03): one server-rendered document, identical on `/` and on every
 * `/trabajo/{slug}`. Every word of copy is in the initial HTML; motion is layered on top by
 * each section's own client code. Copy flows server → client as props; client components
 * never import `data/`. Only confirmed claims are turned into props (Spec §21 rule 1).
 */
export function Journey({ initial }: { initial: ProjectSlug | null }) {
  const total = PROJECTS.length;
  // "Trabajo · 01–NN": the range follows the real number of projects
  const reelName = rangeLabel(SITE.reel.label, total);

  const reelItems: ReelItemView[] = PROJECTS.map((p) => {
    const show = showreelOf(p);
    return {
      id: p.id,
      indexLabel: indexLabel(p.index, total),
      miniLabel: miniLabel(p.index, p.name),
      liveLabel: liveLabel(p.index, total, p.name),
      name: p.name,
      reelLine: p.reelLine,
      relationLine: p.relationLine,
      aspect: p.reel.aspect,
      loop: resolveAsset(p.reel.loop),
      reelLabel: p.a11y.reelLabel,
      enter: { href: show.route, label: SITE.reel.enter },
      open: openLink(p),
    };
  });

  const worldFor = (p: Project): WorldView => ({
    id: p.id,
    name: p.name,
    worldType: p.worldType,
    anchor: anchorOf(p),
    object: objectFor(p),
    env: p.theme.env,
    tone: p.theme.tone,
    aspect: p.reel.aspect,
    poster: resolveAsset(p.screen.poster),
    copy: Object.entries(p.worldCopy).map(([key, text]) => ({ key, text })),
    credit: p.credit ? `${p.credit.label} · ${p.credit.holder}` : undefined,
    priority: initial === p.id,
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
      aspect: p.reel.aspect,
      chapters: p.proof.chapters,
      // TravelSuite360: preload staged by its world; TS12 red seam toward Rayo (Spec §07, §08)
      stagedPreload: p.worldType === "ts-depth",
      exit: p.worldType === "ts-depth" && p.next === "rayo-smash" ? "seam" : undefined,
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
          overlay: {
            title: reelName,
            close: SITE.nav.close,
            items: PROJECTS.map((p) => ({ id: p.id, label: miniLabel(p.index, p.name), href: pathForSection(p.id), poster: resolveAsset(p.reel.poster) })),
          },
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
        <OpeningHero hero={SITE.hero} portrait={resolveAsset("franco.hero")} grain={resolveAsset("site.grain")} skipOpening={initial !== null} />
        <ProjectReel
          label={reelName}
          heading={SITE.reel.heading}
          items={reelItems}
          copy={{ hint: SITE.reel.hint, restHint: SITE.reel.restHint(total), prev: SITE.reel.prev, next: SITE.reel.next, a11y: SITE.reel.a11y, cursor: SITE.reel.cursor }}
        />
        {/* no Suspense boundaries here (tried in Phase 12 for progressive hydration): React outlines
            large boundaries into hidden nodes revealed by a script, which empties the no-JS document */}
        {PROJECTS.map((p) => (
          <ProjectWorld key={p.id} project={p} world={worldFor(p)} proof={proofFor(p)}>
            {p.id === "rayo-smash" && FEATURES.humanMoment ? <HumanMoment media={resolveAsset("moments.human")} /> : null}
          </ProjectWorld>
        ))}
        <CapabilitiesRail
          view={{
            heading: SITE.capabilities.heading,
            seam: SITE.capabilities.seam,
            kicker: SITE.capabilities.kicker,
            subKicker: SITE.capabilities.subKicker,
            bust: resolveAsset("franco.bust"),
            items: CAPABILITIES.map(capabilityCard),
          }}
        />
        {/* the bridge from what was built to what can be built for the visitor (docs/22 §2) */}
        <Declaration
          view={{
            heading: SITE.declaration.heading,
            acts: SITE.declaration.acts.map((a) => ({ title: a.title, words: [...a.words], line: a.line })),
            final: splitFinal(SITE.declaration.acts[2].line),
            close: SITE.declaration.close,
          }}
        />
        <Profile
          view={{
            label: PROFILE.label,
            core: PROFILE.core,
            body: PROFILE.body,
            ads: PROFILE.ads,
            stack: confirmed(PROFILE.stack),
            contacts,
          }}
        />
        {FEATURES.francoAtWork ? <FrancoAtWork media={resolveAsset("franco.atWork")} /> : null}
        <FinalCta
          renderedAt={RENDERED_AT}
          view={{
            eyebrow: SITE.cta.eyebrow,
            title: SITE.cta.title,
            support: SITE.cta.support,
            aside: SITE.cta.aside,
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
function ProjectWorld({ project, world, proof, children }: { project: Project; world: WorldView; proof: ProofView; children?: ReactNode }) {
  return (
    <>
      {project.worldType === "ts-depth" ? (
        <TravelSuiteWorld world={world} ts={tsView(project)} summary={project.a11y.worldSummary} />
      ) : project.worldType === "rayo-layers" && world.object.kind === "cutout" ? (
        <RayoWorld world={world} rayo={rayoView(project)} />
      ) : project.worldType === "santi-editorial" && world.object.kind === "cutout" ? (
        <SantiWorld world={world} santi={santiView(project)} />
      ) : project.worldType === "chef-commerce" && world.object.kind === "cutout" ? (
        <ChefWorld world={world} chef={chefView(project)} />
      ) : (
        <WorldScene world={world} />
      )}
      <ProjectProof proof={proof} />
      {children}
    </>
  );
}

/** the escaping object: TS's message, a project's real cutout, or (until it exists) a crop of the poster */
function objectFor(p: Project): WorldView["object"] {
  if (p.worldType === "ts-depth") return { kind: "text", text: p.worldCopy["TS01.message"] };
  const asset = p.screen.object ? resolveAsset(p.screen.object) : null;
  return asset && asset.status !== "placeholder" && asset.kind === "cutout" ? { kind: "cutout", asset } : { kind: "crop" };
}

/** where the escaping object sits in the SCREEN poster (its contract), centered if unknown */
function anchorOf(p: Project): WorldView["anchor"] {
  const a = resolveAsset(p.screen.poster).meta.anchorRect;
  const fallback = { x: 0.3, y: 0.3, w: 0.4, h: 0.4 };
  return { desktop: a?.desktop ?? fallback, mobile: a?.mobile ?? a?.desktop ?? fallback };
}

/** "Abrir ↗" only when the live URL is confirmed */
function openLink(p: Project) {
  const href = confirmed(p.liveUrl);
  return href ? { href, label: SITE.reel.open, aria: p.a11y.openLabel } : undefined;
}

/**
 * A capability card: its copy and its evidence (Spec §12). Live elements reuse the worlds' own
 * copy and material; material variants are resolved here (never a placeholder, metrics only
 * when authorized), so the client gets only what may be shown.
 */
function capabilityCard(c: (typeof CAPABILITIES)[number]): CapabilityCardView {
  const base = { index: c.index, name: c.name, statement: c.statement, group: c.group, attribution: c.attribution };
  if (c.evidence.variant === "element") return { ...base, evidence: { kind: "element", data: evidenceData(c.evidence.element) } };
  const media = "media" in c.evidence ? c.evidence.media.map((k) => resolveAsset(k)) : [];
  const variant = resolveEvidence(c.evidence, media.every((m) => m.status !== "placeholder"), process.env.NODE_ENV === "production");
  return { ...base, evidence: { kind: "slot", variant, media: variant.variant === "typographic" ? [] : media } };
}

/** the live elements' data, straight from the worlds (Content Master 06/07/09 copy, real layers and posters) */
function evidenceData(id: EvidenceData["id"]): EvidenceData {
  const ts = getProject("travelsuite360")!;
  const chef = getProject("chef-arturo")!;
  const fields = (["TS03.dest", "TS03.date", "TS03.pax"] as const).map((k) => splitField(ts.worldCopy[k]));
  switch (id) {
    case "ts-flow":
      return { id, message: ts.worldCopy["TS01.message"], fields, reservation: ts.worldCopy["TS07.reservation"] };
    case "posters":
      return {
        id,
        posters: (["santi-nuca", "rayo-smash", "chef-arturo"] as const).map((slug) => {
          const p = getProject(slug)!;
          return { name: p.name, asset: resolveAsset(p.reel.poster) };
        }),
      };
    case "chef-commerce": {
      const { stepper, add, pay } = splitPurchaseLine(chef.worldCopy["C06.purchase"]);
      return { id, stepper, add, pay };
    }
    case "ts-extraction":
      return {
        id,
        message: ts.worldCopy["TS01.message"],
        words: [
          { word: TS_KEY_WORDS.dest, label: fields[0].label },
          { word: TS_KEY_WORDS.date, label: fields[1].label },
          { word: TS_KEY_WORDS.pax, label: fields[2].label },
        ],
      };
    case "rayo-layers":
      return { id, layers: RAYO_LAYERS.map((l) => ({ name: l.name, asset: resolveAsset(l.key), offset: l.offset })), aspect: RAYO_STACK.aspect };
  }
}

/** TravelSuite360's world copy (Content Master 06), split into what each state shows */
function tsView(p: Project): TsView {
  const c = p.worldCopy;
  const fields = { dest: splitField(c["TS03.dest"]), date: splitField(c["TS03.date"]), pax: splitField(c["TS03.pax"]) };
  const known = new Map(Object.values(fields).map((f) => [f.label, f.value]));
  const rows = splitList(c["TS04.fields"]).map((label) => ({ label, value: known.get(label) }));
  const [tripLabel, tripValue, ...cells] = splitList(c["TS06.trip"]);
  return {
    input: c["TS01.label"],
    message: c["TS01.message"],
    words: TS_KEY_WORDS,
    origin: c["TS01.origin"],
    interpretado: c["TS03.label"],
    fields,
    quote: { titles: [c["TS04.q1"], c["TS04.q2"]], rows, tag: c["TS05.tag"] },
    // fields without a known value (vuelo, hotel, traslados, estado) carry none (Spec §08)
    trip: { label: tripLabel, value: tripValue, cells: cells.map((label) => ({ label, value: known.get(label) })) },
    reservation: c["TS07.reservation"],
    report: c["TS08.report"],
    name: p.name,
    close: c["TS10.close"],
  };
}

/** Rayo Smash's world: its copy (Content Master 07) and the six real layer cutouts (Spec §09) */
function rayoView(p: Project): RayoView {
  return {
    title: p.worldCopy["R03.title"],
    menuLine: p.worldCopy["R07.menu"],
    layers: RAYO_LAYERS.map((l) => ({ name: l.name, asset: resolveAsset(l.key), offset: l.offset })),
    stack: { aspect: RAYO_STACK.aspect },
    through: resolveAsset("rayo.through"),
  };
}

/** Santi Nuca's world: its three words, the page numbers, the credit and the six photographs */
function santiView(p: Project): SantiView {
  return {
    views: p.worldCopy["N04.views"],
    pages: p.worldCopy["N04.pages"],
    credit: p.credit ? `${p.credit.label} · ${p.credit.holder}` : "",
    photos: SANTI_PHOTOS.map((ph) => ({ n: ph.n, asset: resolveAsset(ph.key), aspect: ph.aspect })),
  };
}

/** Chef Arturo's world: its copy (Content Master 09), the product and the catalog siblings */
function chefView(p: Project): ChefView {
  const [productPhoto, ...siblings] = CHEF_PHOTOS.map((ph) => ({ asset: resolveAsset(ph.key), aspect: ph.aspect, label: ph.label, price: ph.price }));
  return {
    catalogLine: p.worldCopy["C04.catalog"],
    productLine: p.worldCopy["C05.product"],
    purchaseLine: p.worldCopy["C06.purchase"],
    close: p.worldCopy["C07.close"],
    productPhoto,
    siblings,
    macroLoop: resolveAsset("chef.macro.loop"),
    purchaseAria: "Vista de compra de Chef Arturo: Cookie levain de pistacho y chocolate blanco, $ 120, agregar al carrito, Mercado Pago o WhatsApp",
  };
}
