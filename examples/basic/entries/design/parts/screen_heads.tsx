import { ScreenHead, ViewSwitch } from "./shell.js";

/** The head band of the example Welcome screen with shared preview controls. */
export function WelcomeHead({
  active,
}: {
  active: "both" | "desktop" | "mobile";
}) {
  return (
    <ScreenHead
      action={<ViewSwitch active={active} />}
      crumbs={["Example", "Screens"]}
      idChip="example-welcome"
      title="Welcome"
    />
  );
}
