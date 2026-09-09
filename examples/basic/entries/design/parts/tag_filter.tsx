import { DesignLink, useDesignNavigation } from "./design_navigation.js";
import { TagIcon } from "./icons.js";
import { tagPickerTarget, tagTarget } from "./navigation_states.js";
import { CATALOGUE_TAGS, type CatalogueTag } from "./tags.js";

/**
 * Tag pills. The chip whose tag the entered query names carries the accent
 * active state, so the chips and the query describe one selection.
 */
export function TagChips({
  activeTag,
  tags = CATALOGUE_TAGS,
}: {
  activeTag?: string | undefined;
  tags?: readonly CatalogueTag[];
}) {
  const navigation = useDesignNavigation();
  return (
    <span className="mbk-chips">
      {tags.map((tag) => (
        <DesignLink key={tag} to={tagTarget(navigation.tags, tag)}>
          <span
            className={
              tag === activeTag ? "mbk-chip tag active" : "mbk-chip tag"
            }
          >
            <TagIcon size={11} />
            {tag}
          </span>
        </DesignLink>
      ))}
    </span>
  );
}

/**
 * The tag control at the trailing edge of the search field, which opens the
 * tag picker. A catalogue that declares no tags draws no control.
 */
export function SearchTagButton() {
  const navigation = useDesignNavigation();
  if (CATALOGUE_TAGS.length === 0) {
    return null;
  }
  return (
    <DesignLink to={tagPickerTarget(navigation.tags)}>
      <span
        className="mbk-search-tag"
        aria-label={
          navigation.tags?.picker ? "Close tag picker" : "Filter by tag"
        }
      >
        <TagIcon size={13} />
      </span>
    </DesignLink>
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
