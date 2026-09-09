/** Source-preserving HTML patches and static focus styling for child links. */

import {
  attribute,
  controlError,
  type ControlElement,
} from "./link_control_nodes.js";

export interface ControlPatch {
  end: number;
  start: number;
  text: string;
}

export const CONTROL_STYLES =
  '<style data-mokabook-link-control-styles="">' +
  ":where(a[data-mokabook-link-control]){color:inherit;text-decoration:none;display:inline}" +
  ':where(a[data-mokabook-link-control="button"]){display:inline-block;width:fit-content}' +
  ':where(a[data-mokabook-link-control="div"]){display:block}' +
  ":where(a[data-mokabook-link-control]):focus-visible{outline:2px solid currentColor!important;outline-offset:2px!important}" +
  "</style>";

const BUTTON_ATTRIBUTES = new Set([
  "type",
  "name",
  "value",
  "form",
  "formaction",
  "formenctype",
  "formmethod",
  "formnovalidate",
  "formtarget",
  "popovertarget",
  "popovertargetaction",
  "command",
  "commandfor",
]);

export function applyControlPatches(
  html: string,
  patches: readonly ControlPatch[],
): string {
  let output = html;
  for (const patch of [...patches].sort(
    (left, right) => right.start - left.start,
  )) {
    output =
      output.slice(0, patch.start) + patch.text + output.slice(patch.end);
  }
  return output;
}

/** Replace only the control's tags; preserve all applicable original attributes. */
export function controlPatches(
  html: string,
  node: ControlElement,
  target: string,
  inactive: boolean,
  route: string,
): ControlPatch[] {
  const location = node.sourceCodeLocation;
  if (!location?.startTag || !location.endTag)
    throw controlError(route, "requires explicit opening and closing tags");
  const tagStart = location.startTag.startOffset;
  const tagEnd = location.startTag.endOffset;
  const removed = new Set(["href", "data-nav-href"]);
  if (!inactive) removed.add("role");
  if (node.tagName === "button")
    for (const name of BUTTON_ATTRIBUTES) removed.add(name);
  const patches: ControlPatch[] = [];
  for (const name of removed) {
    const attr = location.attrs?.[name];
    if (attr)
      patches.push({
        start: attr.startOffset - tagStart,
        end: attr.endOffset - tagStart,
        text: "",
      });
  }
  if (!inactive)
    patches.push({ start: 1, end: 1 + node.tagName.length, text: "a" });
  let opening = applyControlPatches(html.slice(tagStart, tagEnd), patches);
  const destination = target.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
  const extra = inactive
    ? ` data-nav-href="${destination}"${node.tagName === "button" ? ' type="button"' : ""}`
    : ` href="${destination}" data-mokabook-link-control="${node.tagName}"`;
  opening = opening.replace(/>$/, `${extra}>`);
  if (attribute(node, "data-mokabook-link-control") !== undefined) {
    throw controlError(route, "contains reserved adaptation metadata");
  }
  return [
    { start: tagStart, end: tagEnd, text: opening },
    ...(!inactive
      ? [
          {
            start: location.endTag.startOffset,
            end: location.endTag.endOffset,
            text: "</a>",
          },
        ]
      : []),
  ];
}
