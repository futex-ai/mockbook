/** Tag chips as a search control: selecting a chip writes the matching
 * `tag:<tag>` term into the search field, so one entered query drives both the
 * filtered catalogue tree and the chips that show which tag is selected. */

import { clearTagTerm, parseSearchQuery, setTagTerm } from "./search_query.js";

const CHIP = "[data-mokabook-tag]";
const SEARCH = "[data-mokabook-search]";

/** Mark every rendered tag chip active when the entered query names its tag. */
export function syncTagChips(doc: Document): void {
  const query = parseSearchQuery(searchField(doc)?.value ?? "");
  for (const chip of doc.querySelectorAll<HTMLElement>(CHIP)) {
    chip.classList.toggle("active", query.tags.includes(chipTag(chip)));
  }
}

/**
 * Handle one document click for the tag chips. Returns true when the click
 * belonged to a chip and further click handling should stop. Selecting a chip
 * replaces any entered tag term; selecting the selected chip clears it.
 */
export function handleTagChipClick(doc: Document, target: Element): boolean {
  const chip = target.closest<HTMLElement>(CHIP);
  if (!chip) return false;
  const tag = chipTag(chip);
  const search = searchField(doc);
  if (tag === "" || !search) return true;
  const selected = parseSearchQuery(search.value).tags.includes(tag);
  search.value = selected
    ? clearTagTerm(search.value, tag)
    : setTagTerm(search.value, tag);
  search.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
}

function chipTag(chip: Element): string {
  return (chip.getAttribute("data-mokabook-tag") ?? "").toLowerCase();
}

function searchField(doc: Document): HTMLInputElement | null {
  return doc.querySelector<HTMLInputElement>(SEARCH);
}
