import type { ReactNode } from "react";

import { ComparisonStage } from "./compare.js";
import type { DesignDestination } from "./destinations.js";
import { DetailsPanel } from "./details.js";
import { ReviewNav, type ReviewState } from "./review.js";
import {
  ScreenHead,
  Shell,
  ViewSwitch,
  type ShellColorScheme,
} from "./shell.js";
import { BrowserFrame, PhoneFrame } from "./stage.js";
import type { ScreenSubject } from "./subjects.js";
import { SchemeSwitch } from "./top_bar.js";

export type CompareViewport = "desktop" | "mobile";

interface ComparePageProps {
  design: DesignDestination;
  subject: ScreenSubject;
  activeTitle: string;
  children: ReactNode;
  colorScheme?: ShellColorScheme | undefined;
  idChip: string;
  mode?: "difference" | "overlay" | "side-by-side";
  state: ReviewState;
  title: string;
  viewport: CompareViewport;
}

export function ComparePage({
  design,
  activeTitle,
  subject,
  children,
  colorScheme,
  idChip,
  mode,
  state,
  title,
  viewport,
}: ComparePageProps) {
  return (
    <Shell
      design={design}
      viewport={viewport}
      colorScheme={colorScheme}
      nav={
        viewport === "desktop" ? <ReviewNav activeTitle={activeTitle} /> : null
      }
    >
      <ScreenHead
        action={
          <>
            <ViewSwitch active={viewport} />
            {colorScheme && viewport === "mobile" ? (
              <SchemeSwitch active={colorScheme} />
            ) : null}
          </>
        }
        comparisonMode={mode ?? "side-by-side"}
        crumbs={["Example", "Screens"]}
        idChip={idChip}
        title={title}
      />
      <ComparisonStage state={state} viewport={viewport}>
        {children}
      </ComparisonStage>
      <DetailsPanel subject={subject} />
    </Shell>
  );
}

export function FramedShot({
  address,
  children,
  dark,
  viewport,
}: {
  address: string;
  children: ReactNode;
  dark?: boolean;
  viewport: CompareViewport;
}) {
  if (viewport === "desktop") {
    return (
      <BrowserFrame address={address} dark={dark} expandable={false}>
        {children}
      </BrowserFrame>
    );
  }
  return (
    <PhoneFrame dark={dark} small>
      {children}
    </PhoneFrame>
  );
}
