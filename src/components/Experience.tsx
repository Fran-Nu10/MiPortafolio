"use client";

import dynamic from "next/dynamic";
import { Frame } from "@/components/system/Frame";
import { Opening } from "@/components/scenes/Opening";
import { Work } from "@/components/scenes/Work";
import { Capabilities } from "@/components/scenes/Capabilities";
import { Process } from "@/components/scenes/Process";
import { Lab } from "@/components/scenes/Lab";
import { About } from "@/components/scenes/About";
import { Technology } from "@/components/scenes/Technology";
import { Final } from "@/components/scenes/Final";
import { Preloader } from "@/components/system/Preloader";
import { LiveWindow } from "@/components/system/LiveWindow";

const Cursor = dynamic(() => import("@/components/system/Cursor").then((m) => m.Cursor), { ssr: false });

/**
 * The whole site is one continuous system: every scene is pinned and scrubbed through
 * the same hook, the Frame (T0) and the counter read one store, the cursor is one instrument.
 */
export function Experience() {
  return (
    <main id="main" className="relative">
      <a href="#build-05" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-orange focus:px-3 focus:py-2 focus:text-graphite">Skip to Build 05 · contact</a>
      <div className="scenes">
        <Opening />
        <Work />
        <Capabilities />
        <Process />
        <Lab />
        <About />
        <Technology />
        <div id="build-05">
          <Final />
        </div>
      </div>
      <Frame />
      <LiveWindow />
      <Cursor />
      <Preloader />
    </main>
  );
}
