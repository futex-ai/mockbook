import { ScreenHead, ViewSwitch } from "./shell.js";
import { SchemeSwitch } from "./top_bar.js";

/** The head band of the example Welcome screen with its viewport control. */
export function WelcomeHead({
  active,
  scheme,
}: {
  active: "both" | "desktop" | "mobile";
  scheme?: "light";
}) {
  return (
    <ScreenHead
      action={
        <>
          <ViewSwitch active={active} />
          {scheme ? <SchemeSwitch active={scheme} /> : null}
        </>
      }
      crumbs={["Example", "Screens"]}
      idChip="example-welcome"
      title="Welcome"
    />
  );
}
