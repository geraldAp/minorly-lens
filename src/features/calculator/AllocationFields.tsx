import { useId } from "react";
import { useWatch } from "react-hook-form";
import { MAX_PERCENTAGE_SCALED, PERCENTAGE_SCALE } from "../../domain/limits";
import { parsePercentage } from "../../domain/percentage";
import { Field } from "./Field";
import type { CalculatorFormControls } from "./useCalculatorForm";

function sellerPercentage(buyer: string) {
  try {
    const remainder = MAX_PERCENTAGE_SCALED - parsePercentage(buyer);
    const whole = remainder / PERCENTAGE_SCALE;
    const fraction = (remainder % PERCENTAGE_SCALE)
      .toString()
      .padStart(4, "0")
      .replace(/0+$/, "");
    return `${whole}${fraction ? `.${fraction}` : ""}%`;
  } catch {
    return "—";
  }
}

export function AllocationFields({ form }: { form: CalculatorFormControls }) {
  const id = useId();
  const mode = useWatch({ control: form.control, name: "allocationMode" });
  const buyer = useWatch({ control: form.control, name: "buyerPercentage" });
  const error = form.formState.errors.allocationMode?.message;
  return (
    <fieldset className="input-section">
      <legend>Who pays the fees?</legend>
      <div className="field">
        <label htmlFor={id}>Combined fee allocation</label>
        <select
          id={id}
          {...form.register("allocationMode")}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        >
          <option value="buyer-pays-all">Buyer pays all</option>
          <option value="seller-pays-all">Seller pays all</option>
          <option value="custom">Split between buyer and seller</option>
        </select>
        {error && (
          <p className="field-error" id={`${id}-error`}>
            {error}
          </p>
        )}
      </div>
      {mode === "custom" && (
        <div className="field-pair allocation-pair">
          <Field
            form={form}
            name="buyerPercentage"
            label="Buyer share (%)"
            percentage
            id={`${id}-buyer`}
          />
          <div className="seller-remainder">
            <span>Seller share</span>
            <output
              htmlFor={`${id}-buyer`}
              aria-label="Seller percentage share"
              aria-live="off"
            >
              {sellerPercentage(buyer)}
            </output>
            <span className="field-hint">Calculated remainder</span>
          </div>
        </div>
      )}
      <p className="section-note">
        Applies to the provider fee and platform markup together.
      </p>
    </fieldset>
  );
}
