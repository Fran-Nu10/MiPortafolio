import type { ReactNode } from "react";
import { getProject } from "@/data/projects";
import { RAYO_LAYERS, RAYO_STACK } from "@/data/rayo-layers";
import { SANTI_PHOTOS } from "@/data/santi-photos";
import { CHEF_PHOTOS } from "@/data/chef-photos";
import { SITE } from "@/data/site";
import type { Project } from "@/data/types";
import { resolveAsset } from "@/lib/assets";
import { proofCaption, stackLine } from "@/lib/content";
import { REEL_HREF, pathForSection } from "@/lib/route-sync";
import { TS_KEY_WORDS, splitField, splitList } from "@/lib/ts-world";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MinimalFooter } from "@/components/layout/MinimalFooter";
import { HumanMoment } from "@/components/moments/HumanMoment";
import { ProjectProof, type ProofView } from "@/components/worlds/ProjectProof";
import { ChefWorld, type ChefView } from "@/components/worlds/ChefWorld";
import { RayoWorld, type RayoView } from "@/components/worlds/RayoWorld";
import { SantiWorld, type SantiView } from "@/components/worlds/SantiWorld";
import { TravelSuiteWorld, type TsView } from "@/components/worlds/TravelSuiteWorld";
import { WorldScene, type WorldView } from "@/components/worlds/WorldScene";
import { JourneyClient } from "./JourneyClient";
import { FEATURES, RENDERED_AT } from "./features";
import { headerView, openLink } from "./shared";

/**
 * `/trabajo/{slug}` · a project's case (docs/25). Until THE SHIFT the four worlds were scenes of the
 * home journey; they are the evaluation now: one world and its proof per document, the same scenes,
 * copy and media as before (Spec §06–§11, Content Master 06–09), opened from the reel. The world
 * starts at the top (its SCREEN state: the reel's picture at the reel's rectangle), the proof ends
 * with «← Trabajo» (back to the reel) and «Siguiente →» (the next case; after the last, Capacidades
 * in the home journey). Every word is in the server HTML; motion is layered on top as before.
 */
export function CaseStudy({ project }: { project: Project }) {
  const p = project;
  return (
    <>
      <SiteHeader view={headerView()} />
      <main id="contenido" data-initial={p.id} data-case={p.id}>
        <ProjectWorld project={p} world={worldFor(p)} proof={proofFor(p)}>
          {p.id === "rayo-smash" && FEATURES.humanMoment ? <HumanMoment media={resolveAsset("moments.human")} /> : null}
        </ProjectWorld>
        <div className="case-foot">
          <MinimalFooter line={SITE.footer.line(new Date(RENDERED_AT).getFullYear())} />
        </div>
      </main>
      <JourneyClient initial={p.id} titles={{ [p.id]: p.meta.title }} homeTitle={p.meta.title} />
    </>
  );
}

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
  priority: true,
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
    back: { href: REEL_HREF, label: SITE.world.back },
    // the next case is another document; after the last one, the home journey resumes at Capacidades
    next: next
      ? { href: pathForSection(next.id), label: `${SITE.world.next} ${next.name}` }
      : { href: pathForSection("capacidades"), label: `${SITE.world.next} ${SITE.world.capabilitiesName}` },
    tone: p.theme.tone,
    aspect: p.reel.aspect,
    chapters: p.proof.chapters,
    // TravelSuite360: preload staged by its world (Spec §08). Its TS12 red seam led into the Rayo
    // world of the same document; a case ends on its own proof, so the seam is not drawn (docs/25 §4)
    stagedPreload: p.worldType === "ts-depth",
  };
};

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
