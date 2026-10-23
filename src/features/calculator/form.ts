import { CURRENCIES, MoneyError } from "minorly";
import type { SupportedCurrency } from "minorly";
import { CALCULATION_MODES, FEE_MODE_VALUES } from "../../domain/constants";
import { parseAmount } from "../../domain/money";
import { parsePercentage } from "../../domain/percentage";
import type {
  CalculationInput,
  FeeAllocation,
  FeeRule,
  PlatformMarkupRule,
} from "../../domain/types";
import { FEE_SOURCE } from "./constants";
import type { FeeSource } from "./constants";

export interface CalculatorFormValues {
  currency: string;
  originalAmount: string;

  providerMode: FeeRule["mode"];
  providerPercentage: string;
  providerFixed: string;

  markupMode: PlatformMarkupRule["mode"];
  markupPercentage: string;
  markupFixed: string;

  allocationMode: FeeAllocation["mode"];
  buyerPercentage: string;
}

export const defaultValues: CalculatorFormValues = {
  currency: "GHS",
  originalAmount: "",

  providerMode: CALCULATION_MODES.fee.PERCENTAGE_PLUS_FIXED,
  providerPercentage: "",
  providerFixed: "",

  markupMode: CALCULATION_MODES.markup.NONE,
  markupPercentage: "",
  markupFixed: "",

  allocationMode: CALCULATION_MODES.allocation.BUYER_PAYS_ALL,
  buyerPercentage: "50",
};

export type FormErrors = Partial<Record<keyof CalculatorFormValues, string>>;

type ParsedForm =
  | { ok: true; input: CalculationInput }
  | { ok: false; errors: FormErrors };

// CONVERT ACTIVE FORM FIELDS INTO CALCULATOR INPUTS OR RETURN FIELD ERRORS.
export function parseCalculatorForm(values: CalculatorFormValues): ParsedForm {
  const errors: FormErrors = {};

  if (!Object.hasOwn(CURRENCIES, values.currency)) {
    return { ok: false, errors: { currency: "Choose a supported currency." } };
  }

  const currency = values.currency as SupportedCurrency;

  // PARSE ONE FIELD AND RECORD EXPECTED VALIDATION ERRORS AGAINST THAT FIELD.
  function read(
    field: keyof CalculatorFormValues,
    parse: (value: string) => bigint,
  ) {
    try {
      return parse(values[field]);
    } catch (error) {
      if (!(error instanceof MoneyError)) throw error;

      errors[field] = error.message;
      return undefined;
    }
  }

  // CONVERT AN AMOUNT STRING INTO EXACT MINOR UNITS FOR THE SELECTED CURRENCY.
  const amount = (value: string) => parseAmount(value, currency);
  const originalAmountMinor = read("originalAmount", amount);

  // BUILD A PROVIDER OR MARKUP RULE USING ONLY THE SELECTED FEE TYPE'S FIELDS.
  function fee(prefix: FeeSource): PlatformMarkupRule | undefined {
    const mode = values[`${prefix}Mode`];

    if (mode === CALCULATION_MODES.markup.NONE && prefix === FEE_SOURCE.MARKUP) {
      return { mode: CALCULATION_MODES.markup.NONE };
    }

    if (!FEE_MODE_VALUES.includes(mode)) {
      errors[`${prefix}Mode`] = "Choose a supported fee type.";
      return undefined;
    }

    const fixed = mode === CALCULATION_MODES.fee.PERCENTAGE ? 0n : read(`${prefix}Fixed`, amount);
    const percentage =
      mode === CALCULATION_MODES.fee.FIXED ? 0n : read(`${prefix}Percentage`, parsePercentage);

    if (fixed === undefined || percentage === undefined) return undefined;

    if (mode === CALCULATION_MODES.fee.FIXED) return { mode, amountMinor: fixed };

    if (mode === CALCULATION_MODES.fee.PERCENTAGE) return { mode, percentageScaled: percentage };

    return {
      mode: CALCULATION_MODES.fee.PERCENTAGE_PLUS_FIXED,
      amountMinor: fixed,
      percentageScaled: percentage,
    };
  }

  const providerFee = fee(FEE_SOURCE.PROVIDER);
  const platformMarkup = fee(FEE_SOURCE.MARKUP);

  let allocation: FeeAllocation | undefined;

  switch (values.allocationMode) {
    case CALCULATION_MODES.allocation.BUYER_PAYS_ALL:
    case CALCULATION_MODES.allocation.SELLER_PAYS_ALL:
      allocation = { mode: values.allocationMode };
      break;

    case CALCULATION_MODES.allocation.CUSTOM: {
      const buyerPercentageScaled = read("buyerPercentage", parsePercentage);
      if (buyerPercentageScaled !== undefined)
        allocation = { mode: CALCULATION_MODES.allocation.CUSTOM, buyerPercentageScaled };
      break;
    }

    default:
      errors.allocationMode = "Choose who pays the fees.";
  }

  if (
    Object.keys(errors).length ||
    originalAmountMinor === undefined ||
    !providerFee ||
    providerFee.mode === CALCULATION_MODES.markup.NONE ||
    !platformMarkup ||
    !allocation
  ) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    input: {
      currency,
      originalAmountMinor,
      providerFee,
      platformMarkup,
      allocation,
    },
  };
}
