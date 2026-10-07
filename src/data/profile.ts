import type { Gated } from "./types";

interface Profile {
  label: string;
  core: string;
  extension: string;
  stack: Gated<string>;
  /** href values; the email also completes the form's route error */
  contacts: { email: Gated<string>; linkedin: Gated<string> };
}

/** Perfil (Content Master 00-C and 13, corrected in ronda 1). No photo, no title beyond the label. */
export const PROFILE: Profile = {
  label: "Perfil",
  core:
    "Diseño y construyo productos digitales: la idea, la interfaz, el código y lo que pasa después de publicar. Soy socio de TravelSuite360 y llevo toda su área de software: un sistema que hoy operan tres agencias de viaje. Los otros tres productos de acá arriba los hice de punta a punta. Trabajo desde Uruguay con equipos en cualquier lugar.",
  extension:
    "Construir es una parte. Que llegue a la gente es otra: cuando corresponde, también trabajo la adquisición de clientes con publicidad en Meta Ads.",
  stack: {
    status: "pending",
    value: "Stack habitual: Next.js · React · TypeScript · Supabase · PostgreSQL · Vercel. IA integrada donde ahorra trabajo real.",
    note: "Content Master 19 · pregunta 8: confirmar que los seis nombres se usan en al menos dos de los cuatro productos.",
  },
  contacts: {
    email: { status: "pending", note: "hola@… [CONFIRMAR email]" },
    linkedin: { status: "pending", note: "[CONFIRMAR URL]" },
  },
};
