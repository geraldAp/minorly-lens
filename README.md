# Minorly Lens

A standalone Chrome extension for estimating transaction fees and how buyers and
sellers cover them. The calculator UI currently runs as a local Vite app; Chrome
extension packaging is the next step.

## Progress

- Completed: inspected the project and installed Minorly 0.1.0 APIs.
- Completed: defined calculation types and money limits in `src/domain/`.
- Completed: added exact amount parsing with currency precision and boundary tests.
- Completed: added exact percentage parsing with precision, range and input tests.
- Completed: added exact output formatting using Minorly's currency metadata and
  integer/string operations.
- Completed: added provider-fee calculations with half-up rounding and bounds tests.
- Completed: added platform markup and combined-fee calculations with tests.
- Completed: added buyer/seller fee allocation with remainder and total-preservation tests.
- Completed: shared half-up rounding between fee and allocation calculations.
- Completed: composed the full calculator with payment totals, seller-funds
  validation and accounting-invariant tests.
- Completed: built calculator inputs and an exact result breakdown with React Hook
  Form, conditional fields, field errors and keyboard focus management.
- Next: package and verify the unpacked Chrome extension.

## Calculator UI

Run `npm run dev` for the calculator. Enter an original amount and provider fee;
optional markup starts at none and the buyer initially covers all fees. Zero is
valid, but active fields must be filled explicitly. Choose a custom allocation to
enter the buyer percentage; the seller percentage is calculated as the remainder.

Calculate estimate opens a separate result screen with both final totals and all
six breakdown rows. Edit inputs preserves the form values, clears the displayed
result and returns focus to the amount. Invalid submissions stay on the form;
field errors link to their controls, and cross-field calculation failures appear
above the Calculate button. Inactive fee fields never block calculation.

The compact layout uses rounded soft sections, borderless fields, a filled primary
action and a charcoal/lavender palette with a light appearance for systems that
prefer it. Figtree is bundled locally under its SIL Open Font License; no runtime
font request or additional permission is needed. There is no account, network
request or persistent form storage.

### Structure

- `src/App.tsx`: composes the calculator feature.
- `src/features/calculator/Calculator.tsx`: owns the input/result flow and calls the
  pure domain calculator.
- `form.ts`: declares raw string inputs and maps active fields into domain inputs
  or field-specific errors, using the existing parsers.
- `useCalculatorForm.ts`: connects that parsing boundary to React Hook Form with a
  typed resolver. It does not coerce strings into floating-point numbers.
- `CalculatorForm`, `FeeFields`, `AllocationFields`, `Field` and
  `CalculationResult`: focused form and presentation components.
- `src/domain/`: remains independent of React and form-library code.

React Hook Form is the only added JavaScript dependency. No Zod schema, global
store, routing layer or duplicate money-validation implementation is needed.

Verification includes parser tests and browser checks for the GHS example, JPY
precision, the exact maximum amount, half-up fees and allocation, conditional
fields, seller-funds errors, focus transitions, linked labels/IDs, text/control contrast and reflow at
320/420/1024 pixels in light and dark appearances. Assets load locally and the
checked flows produce no browser runtime errors. These checks do not establish
screen-reader interoperability or complete WCAG conformance; an actual VoiceOver
pass and toolbar-popup sizing remain to be verified.

## Agreed calculation boundaries

- Form inputs stay strings. Parsed monetary values use `bigint` minor units and
  currency precision comes from Minorly's `CURRENCIES` metadata.
- Input amounts and all monetary outputs must stay between zero and
  `9_007_199_254_740_991` minor units (`Number.MAX_SAFE_INTEGER`). This is a
  prototype limit matching Minorly's conversion boundary.
- Amount inputs are limited to 32 characters. Percentage inputs are limited to
  8 characters, with up to four decimal places and a range of 0% to 100%.
- A scaled percentage of `10_000n` means 1%; `1_000_000n` means 100%.
- Every percentage fee uses the original transaction amount as its base.
- One allocation rule distributes the combined provider fee and platform markup.
  The buyer's fee share is rounded half up; the seller's share is the remainder.
- Each percentage fee is rounded half up to the currency's minor unit before its
  fixed component is added. Seller fees exceeding the original amount are invalid;
  a seller net of zero is valid.
- Half-up rounding is the prototype's fixed business rule. The calculator UI must
  show: "Fee rounding: half up to the currency's smallest unit. A half-unit tie
  rounds upward." Strategy selection can follow a suitable Minorly rounding API.
- These are configurable estimates, not guaranteed provider quotes. Platform
  markup is revenue before other costs, not guaranteed profit.

`parseAmount` in `src/domain/money.ts` returns integer `bigint` minor units. Lens
enforces the 32-character raw input limit and rejects negative values and commas.
Minorly handles surrounding whitespace, validates decimal syntax and currency
precision, and enforces the safe-integer monetary boundary during conversion.
Surrounding whitespace is accepted; whitespace inside a number is invalid. Currency
symbols and exponent notation are invalid. Zero is valid. JPY accepts whole numbers
only.

`parsePercentage` in `src/domain/percentage.ts` converts decimal strings directly
into scaled `bigint` percentages: `"1.275"` becomes `12_750n`. It accepts 0% to 100%
inclusive and at most four decimal places; excess precision is rejected, not
rounded. Surrounding whitespace is accepted but counts toward the eight-character
raw input limit. Negative values, commas, `%` symbols and malformed input are
invalid. This function lives in Lens until Minorly provides a suitable public API.

`formatAmount` in `src/domain/money.ts` accepts `bigint` minor units, checks the
prototype bounds, and uses Minorly's currency metadata to place the decimal point
in the integer's string representation. Output uses a currency code and plain
decimal text, such as `GHS 100.25` or `JPY 100`, with no thousands separators.
Monetary values never pass through a floating-point `number` during formatting;
the maximum supported USD amount displays exactly as `USD 90071992547409.91`.

Minorly remains responsible for amount conversion, currency metadata and
`MoneyError`. Lens formats output locally while Minorly's
[formatter precision fix](https://github.com/geraldAp/minorly/issues/7) is pending.
Once a corrected release is available, we can verify it and consider adopting it
behind the same `formatAmount` API.

`calculateFee` in `src/domain/fees.ts` applies a fixed, percentage, or percentage
plus fixed provider-fee rule to the original transaction amount. All arithmetic
uses `bigint` minor units. The percentage component is rounded half up before
the fixed component is added. Inputs and the calculated fee must respect the
prototype bounds; rates range from 0% to 100%. Zero transaction amounts produce
zero percentage fees, while configured fixed fees still apply. A fee can exceed
the original amount at this stage; seller-funds validation belongs to the composed
transaction calculator.

`calculateFees` in the same module calculates the provider fee and platform markup
from the same original amount, then returns `providerFeeMinor`,
`platformMarkupMinor` and `combinedFeesMinor`. Markup supports none, fixed,
percentage, and percentage plus fixed. Each percentage fee is rounded separately
before the fees are added, and their combined total must stay within the prototype
limit. Markup is not applied to the amount remaining after provider fees. It is
platform revenue before other costs, not guaranteed profit.

`allocateFees` in `src/domain/allocation.ts` assigns the combined fees to the buyer,
the seller, or a custom buyer percentage from 0% to 100%. The buyer's share rounds
half up; the seller's share is the exact remainder. The two non-negative shares
always sum to the combined fees. For a one-minor-unit fee split 50/50, the buyer
covers one unit and the seller covers zero. The helper validates combined fee and
percentage bounds. Final payments and seller-funds validation belong to the
transaction calculator.

`roundHalfUp` in `src/domain/rounding.ts` rounds a non-negative integer numerator
divided by a positive integer denominator, using `bigint` throughout. Fee and
allocation calculations share this helper. Monetary bounds remain the callers'
responsibility. A future suitable Minorly rounding API can replace the helper's
implementation while preserving Lens's half-up business rule; the broader library
work is tracked in [Minorly's rounding issue](https://github.com/geraldAp/minorly/issues/1).

`calculateTransaction` in `src/domain/calculator.ts` composes the fee and allocation
helpers into a complete `CalculationResult`. Buyer total is the original amount
plus the buyer's fee share; seller net is the original amount minus the seller's
fee share. A seller share above the original amount is rejected without clamping,
while a seller receipt of zero is valid. Buyer totals above the prototype limit
are rejected. The result preserves:

```text
buyer total = seller net + provider fee + platform markup
```

For GHS 100, a provider fee of 2% plus GHS 1, markup of 1%, and a 50/50 allocation,
the buyer pays GHS 102 and the seller receives GHS 98. Domain tests cover the full
flow from input strings to formatted results for both GHS and zero-decimal JPY.
The UI uses this same domain flow. Chrome extension packaging remains outstanding.

Run the domain and form-parser tests with `npm test`. Tests use
[Vitest](https://vitest.dev/guide/) with one worker to keep local resource use low.

## Development workflow

Build one approved step at a time on a `feat/` branch and open a pull request
against `main` for review. Keep each pull request small and include the relevant
verification results in its description.

## Vite starter notes

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
