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
import { resolveEvidence } from "@/lib/capabilities-rail";
import { splitFinal } from "@/lib/declaration";
import { GRID_COLUMNS } from "@/lib/shift";
import { CapabilitiesRail, type CapabilityCardView } from "@/components/capabilities/CapabilitiesRail";
import type { EvidenceData } from "@/components/capabilities/EvidenceElement";
import { FinalCta } from "@/components/contact/FinalCta";
import { Declaration } from "@/components/declaration/Declaration";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { FrancoAtWork } from "@/components/moments/FrancoAtWork";
import { OpeningHero } from "@/components/opening/OpeningHero";
import { Profile } from "@/components/profile/Profile";
import { ProjectReel, type ReelItemView } from "@/components/reel/ProjectReel";
import { Shift } from "@/components/shift/Shift";
import { JourneyClient } from "./JourneyClient";
import { FEATURES, RENDERED_AT } from "./features";
import { headerView, openLink, reelName } from "./shared";

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
          label={reelName()}
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
            concept: SITE.shift.concept,
            notes: {
              grid: { wide: SITE.shift.notes.grid(GRID_COLUMNS.wide), tablet: SITE.shift.notes.grid(GRID_COLUMNS.tablet), phone: SITE.shift.notes.grid(GRID_COLUMNS.phone) },
              type: SITE.shift.notes.type,
              state: SITE.shift.notes.state,
            },
            ui: { ...SITE.shift.ui, nav: [...SITE.shift.ui.nav], headline: [...SITE.shift.ui.headline], cards: [...SITE.shift.ui.cards] },
          }}
        />
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
      <JourneyClient initial={null} titles={{}} homeTitle={SITE.meta.title} />
    </>
  );
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
