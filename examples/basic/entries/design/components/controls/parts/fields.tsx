import type { ActionProps } from "../../parts/action_props.js";

/** Native fields are operable in static, script-disabled design frames. */
export function ControlFields({
  props,
  invalid,
}: {
  props: ActionProps;
  invalid: boolean;
}) {
  return (
    <div className="ce-control-fields">
      <div className="ce-control-row">
        <label htmlFor="action-label">label</label>
        <input id="action-label" type="text" defaultValue={props.label} />
      </div>
      <div className="ce-control-row">
        <label htmlFor="action-disabled">disabled</label>
        <div className="ce-check-value">
          <input
            id="action-disabled"
            type="checkbox"
            defaultChecked={props.disabled}
          />
        </div>
      </div>
      <div className="ce-control-row">
        <label htmlFor="action-radius">cornerRadius</label>
        <div>
          <input
            id="action-radius"
            type="number"
            min={0}
            max={24}
            step={1}
            defaultValue={props.cornerRadius}
            aria-invalid={invalid ? "true" : undefined}
            aria-describedby={invalid ? "radius-error" : "radius-range"}
          />
          {!invalid ? (
            <span className="ce-control-hint" id="radius-range">
              0–24
            </span>
          ) : null}
          {invalid ? (
            <p id="radius-error" className="ce-field-error">
              Enter a number from 0 to 24.
            </p>
          ) : null}
        </div>
      </div>
      <div className="ce-control-row">
        <label htmlFor="action-emphasis">emphasis</label>
        <select id="action-emphasis" defaultValue={props.emphasis}>
          <option value="strong">Strong</option>
          <option value="quiet">Quiet</option>
        </select>
      </div>
      <div className="ce-control-row ce-optional-control">
        <label htmlFor="action-hint">
          hint <span aria-hidden="true">Optional</span>
        </label>
        <div>
          <label className="ce-check-value">
            <input type="checkbox" defaultChecked={props.hint !== undefined} />
            <span>Set hint</span>
          </label>
          <input
            className="ce-hint-value"
            id="action-hint"
            type="text"
            defaultValue={props.hint ?? ""}
          />
          <p className="ce-unset-value">Not set</p>
        </div>
      </div>
    </div>
  );
}
