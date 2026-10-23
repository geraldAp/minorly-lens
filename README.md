# Minorly Lens

A standalone Chrome extension for estimating transaction fees and how buyers and
sellers cover them. The interface currently remains the Vite starter.

## Progress

- Completed: inspected the project and installed Minorly 0.1.0 APIs.
- Completed: defined calculation types and money limits in `src/domain/`.
- Completed: added exact amount parsing with currency precision and boundary tests.
- Completed: added exact percentage parsing with precision, range and input tests.
- Completed: added exact output formatting using Minorly's currency metadata and
  integer/string operations.
- Completed: added provider-fee calculations with half-up rounding and bounds tests.
- Completed: added platform markup and combined-fee calculations with tests.
- Next: add buyer/seller allocation, seller-funds validation and accounting tests.
  UI and extension packaging follow in separate steps.

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
the original amount at this stage; seller-funds validation belongs to the later
allocation step.

`calculateFees` in the same module calculates the provider fee and platform markup
from the same original amount, then returns `providerFeeMinor`,
`platformMarkupMinor` and `combinedFeesMinor`. Markup supports none, fixed,
percentage, and percentage plus fixed. Each percentage fee is rounded separately
before the fees are added, and their combined total must stay within the prototype
limit. Markup is not applied to the amount remaining after provider fees. It is
platform revenue before other costs, not guaranteed profit. Buyer/seller allocation
is not implemented yet.

Run the domain tests with `npm test`. Tests use
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
