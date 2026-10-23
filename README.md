# Minorly Lens

A standalone Chrome extension for estimating transaction fees and how buyers and
sellers cover them. The interface currently remains the Vite starter.

## Progress

- Completed: inspected the project and installed Minorly 0.1.0 APIs.
- Completed: defined calculation types and money limits in `src/domain/`.
- Completed: added exact amount parsing with currency precision and boundary tests.
- Next: add percentage parsing, then exact output formatting. Fee calculations,
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
- These are configurable estimates, not guaranteed provider quotes. Platform
  markup is revenue before other costs, not guaranteed profit.

`parseAmount` in `src/domain/money.ts` validates plain decimal strings before
calling Minorly's conversion API and returns integer `bigint` minor units. It
rejects negative values, whitespace, commas, currency symbols, exponent notation,
excess precision and oversized inputs. Zero is valid. JPY accepts whole numbers
only. Minorly enforces the safe-integer monetary boundary during conversion.

Percentage parsing, exact output formatting and calculation functions have not
been implemented yet. Minorly's formatter precision issue is
tracked [upstream](https://github.com/geraldAp/minorly/issues/7). Lens will use exact
formatting from integer minor units unless a suitable corrected API is available.

Run the amount parsing tests with `npm test`. Tests use
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
