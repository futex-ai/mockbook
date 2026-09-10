import { useDesignStyle } from "../style_context.js";
import { DesignLink } from "../../parts/design_navigation.js";
import { TagIcon } from "../../parts/icons.js";
import type { TagChipProps } from "./tag-chip.js";

export function TagChipView({ label, selected, destination }: TagChipProps) {
  useDesignStyle("tag-chip");
  return (
    <DesignLink to={destination}>
      <span className={selected ? "mbk-chip tag active" : "mbk-chip tag"}>
        <TagIcon size={11} />
        {label}
      </span>
    </DesignLink>
  );
}
