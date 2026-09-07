import { TagIcon } from "./icons.js";
import { CATALOGUE_TAGS } from "./tags.js";

/**
 * Tag pills. The chip whose tag the entered query names carries the accent
 * active state, so the chips and the query describe one selection.
 */
export function TagChips({ activeTag }: { activeTag?: string | undefined }) {
  return (
    <span className="mbk-chips">
      {CATALOGUE_TAGS.map((tag) => (
        <span
          key={tag}
          className={tag === activeTag ? "mbk-chip tag active" : "mbk-chip tag"}
        >
          <TagIcon size={11} />
          {tag}
        </span>
      ))}
    </span>
  );
}

/**
 * The tag control at the trailing edge of the search field, which opens the
 * tag picker. A catalogue that declares no tags draws no control.
 */
export function SearchTagButton() {
  if (CATALOGUE_TAGS.length === 0) {
    return null;
  }
  return (
    <span className="mbk-search-tag" role="button" aria-label="Filter by tag">
      <TagIcon size={13} />
    </span>
  );
}

/**
 * The panel the tag control drops under the search field, listing every tag
 * the catalogue declares.
 */
export function TagPicker({ activeTag }: { activeTag?: string | undefined }) {
  if (CATALOGUE_TAGS.length === 0) {
    return null;
  }
  return (
    <div className="mbk-tag-picker" role="group" aria-label="Tags">
      <div className="mbk-tag-picker-head">Tags</div>
      <TagChips activeTag={activeTag} />
    </div>
  );
}
