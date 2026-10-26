import { CAPABILITIES } from "@/data/capabilities";
import { PROFILE } from "@/data/profile";
import { PROJECTS, getProject } from "@/data/projects";
import { RAYO_LAYERS, RAYO_STACK } from "@/data/rayo-layers";
import { SITE } from "@/data/site";
import { resolveAsset } from "@/lib/assets";
import { confirmed, indexLabel, liveLabel, miniLabel, routeErrorText } from "@/lib/content";
import { showreelOf } from "@/lib/showreel";
import { TS_KEY_WORDS, splitField } from "@/lib/ts-world";
import { splitPurchaseLine } from "@/lib/chef-world";
import { SCENE_FOR, wordsFromStatement } from "@/lib/capabilities-index";
import { splitFinal } from "@/lib/declaration";
import { GRID_COLUMNS } from "@/lib/shift";
import { CapabilitiesIndex, type CapabilityItemView, type SceneData } from "@/components/capabilities/CapabilitiesIndex";
import { FinalCta } from "@/components/contact/FinalCta";
import { Declaration } from "@/components/declaration/Declaration";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { FrancoAtWork } from "@/components/moments/FrancoAtWork";
import { OpeningHero } from "@/components/opening/OpeningHero";
import { Profile } from "@/components/profile/Profile";
import { ProjectReel, type ReelItemView } from "@/components/reel/ProjectReel";
import { Shift } from "@/components/shift/Shift";
import { Vision } from "@/components/vision/Vision";
import { JourneyClient } from "./JourneyClient";
import { FEATURES, RENDERED_AT } from "./features";
import { headerView, openLink } from "./shared";

/**
 * The home journey (Spec §01–§03, docs/25): one server-rendered document. Hero → reel (what is
 * built) → THE SHIFT (how complexity becomes product) → capabilities → the declaration → profile →
 * contact. The four project worlds are not scenes of it any more: each is its own case at
 * `/trabajo/{slug}` (CaseStudy), opened from the reel. Every word of copy is in the initial HTML;
 * motion is layered on top by each section's own client code. Copy flows server → client as props;
 * client components never import `data/`. Only confirmed claims are turned into props (Spec §21 rule 1).
 */
export function Journey() {
  const total = PROJECTS.length;

  const reelItems: ReelItemView[] = PROJECTS.map((p) => {
    const show = showreelOf(p);
    // with its film the card takes the film's own aspect (docs/26 §F3): the picture is never cropped
    const loop = resolveAsset(p.reel.loop);
    const film = loop.status !== "placeholder";
    return {
      id: p.id,
      indexLabel: indexLabel(p.index, total),
      miniLabel: miniLabel(p.index, p.name),
      liveLabel: liveLabel(p.index, total, p.name),
      name: p.name,
      reelLine: p.reelLine,
      relationLine: p.relationLine,
      aspect: film ? { desktop: loop.aspect.desktop, mobile: loop.aspect.mobile ?? p.reel.aspect.mobile } : p.reel.aspect,
      loop,
      reelLabel: p.a11y.reelLabel,
      enter: { href: show.route, label: SITE.reel.enter },
      open: openLink(p),
    };
  });

  const email = confirmed(PROFILE.contacts.email);
  const linkedin = confirmed(PROFILE.contacts.linkedin);
  const contacts = [
    ...(email ? [{ label: email, href: `mailto:${email}` }] : []),
    ...(linkedin ? [{ label: "LinkedIn", href: linkedin }] : []),
  ];

  return (
    <>
      <SiteHeader view={headerView()} />
      <main id="contenido">
        <OpeningHero hero={SITE.hero} portrait={resolveAsset("franco.hero")} grain={resolveAsset("site.grain")} skipOpening={false} />
        <ProjectReel
          heading={SITE.reel.heading}
          items={reelItems}
          copy={{ hint: SITE.reel.hint, restHint: SITE.reel.restHint(total), prev: SITE.reel.prev, next: SITE.reel.next, a11y: SITE.reel.a11y, cursor: SITE.reel.cursor }}
        />
        {/* no Suspense boundaries here (tried in Phase 12 for progressive hydration): React outlines
            large boundaries into hidden nodes revealed by a script, which empties the no-JS document */}
        {/* THE SHIFT (docs/25): how complexity becomes product, between what is built and the disciplines */}
        <Shift
          view={{
            heading: SITE.shift.heading,
            acts: SITE.shift.acts.map((a) => ({ ...a })),
            ui: { ...SITE.shift.ui, nav: [...SITE.shift.ui.nav], headline: [...SITE.shift.ui.headline], cards: [...SITE.shift.ui.cards] },
          }}
        />
        {/* how the work is done (docs/27 §3): one figure through Pensar → Diseñar → Construir */}
        <Vision view={{ heading: SITE.vision.heading, stages: SITE.vision.stages.map((s) => ({ ...s })), close: SITE.vision.close }} />
        <CapabilitiesIndex
          view={{
            heading: SITE.capabilities.heading,
            kicker: SITE.capabilities.kicker,
            subKicker: SITE.capabilities.subKicker,
            items: CAPABILITIES.map(capabilityItem),
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
            body: [PROFILE.body[0], PROFILE.body[1]],
            facets: {
              phrases: [...PROFILE.facets.phrases],
              projects: PROFILE.facets.projects.map((f) => ({
                kind: f.kind,
                // the projects' own material: Chef Arturo's product, TravelSuite360's interface (demo data)
                asset: resolveAsset(f.slug === "chef-arturo" ? "chef.product" : "ts.reel.film.poster"),
              })),
            },
            ads: { title: PROFILE.ads.title, steps: PROFILE.ads.steps.map((s) => ({ ...s })), paragraph: PROFILE.ads.paragraph, emphasis: PROFILE.ads.emphasis },
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
      <JourneyClient initial={null} titles={{}} homeTitle={SITE.meta.title} />
    </>
  );
}

/**
 * A capability of the live index (docs/26 §C): its copy (Content Master 22) and its scene. Every
 * scene reuses the projects' own approved copy and real material — no metric, no invented result;
 * the few words a scene adds come from its capability's own statement.
 */
function capabilityItem(c: (typeof CAPABILITIES)[number]): CapabilityItemView {
  const key = c.evidence.variant === "element" ? c.evidence.element : "typographic";
  return { index: c.index, name: c.name, statement: c.statement, group: c.group, attribution: c.attribution, scene: sceneData(SCENE_FOR[key], c.statement) };
}

function sceneData(id: SceneData["id"], statement: string): SceneData {
  const ts = getProject("travelsuite360")!;
  const chef = getProject("chef-arturo")!;
  const santi = getProject("santi-nuca")!;
  const fields = (["TS03.dest", "TS03.date", "TS03.pax"] as const).map((k) => splitField(ts.worldCopy[k]));
  switch (id) {
    case "product":
      return {
        id,
        message: ts.worldCopy["TS01.message"],
        interpreted: ts.worldCopy["TS03.label"],
        fields,
        quote: `${ts.worldCopy["TS04.q1"]} · ${ts.worldCopy["TS04.q2"]}`,
        reservation: ts.worldCopy["TS07.reservation"],
      };
    case "engineering":
      // Santi Nuca's real interface (its film's first frame) over the layers its statement names
      return { id, poster: resolveAsset(santi.reel.loop).poster ?? resolveAsset(santi.reel.poster), layers: wordsFromStatement(statement, ["Front", "Back", "Datos"]) };
    case "commerce": {
      const { stepper, add, pay } = splitPurchaseLine(chef.worldCopy["C06.purchase"]);
      const [product, price] = chef.worldCopy["C05.product"].split(" · ");
      return { id, photo: resolveAsset("chef.product"), product: `${product} · ${price}`, stepper, add, pay };
    }
    case "ai":
      return {
        id,
        message: ts.worldCopy["TS01.message"],
        words: [
          { word: TS_KEY_WORDS.dest, label: fields[0].label, value: fields[0].value },
          { word: TS_KEY_WORDS.date, label: fields[1].label, value: fields[1].value },
          { word: TS_KEY_WORDS.pax, label: fields[2].label, value: fields[2].value },
        ],
      };
    case "interactive":
      return { id, layers: RAYO_LAYERS.map((l) => ({ name: l.name, asset: resolveAsset(l.key), offset: l.offset })), aspect: RAYO_STACK.aspect };
    case "growth":
      return { id, stations: wordsFromStatement(statement, ["Negocios", "Personas", "Próximos clientes"]) };
  }
}
