# Chrome Web Store listing draft

Copy for the version 0.1.0 popup release. Review it alongside the packaged build
before submission. Side-panel support and website fee detection are future work.

## Product details

**Name:** Minorly Lens

**Short description:** Estimate provider fees, platform markup and how buyers and sellers cover them.

**Suggested category:** Tools (select the matching option in the dashboard).

**Language:** English

## Detailed description

See what the buyer pays and what the seller receives before a transaction.

Minorly Lens is a compact fee calculator in your Chrome toolbar. Enter a
transaction amount, your provider's fee and an optional platform markup, then
choose how the combined fees are shared.

- Use fixed fees, percentages, or a percentage plus a fixed amount.
- Choose buyer pays all, seller pays all, or a custom fee split.
- See buyer total, seller proceeds and a complete fee breakdown.
- Calculate in USD, EUR, GBP, GHS, NGN or JPY.
- Use percentage inputs with up to four decimal places.
- Work locally with no account, analytics or server transmission.

The calculator uses exact integer minor units. Percentage fees and the buyer's
fee share round half up to the currency's smallest unit; the seller gets the
remaining fee share. Provider fees and markup percentages use the original
transaction amount as their base.

Enter the applicable fees yourself. Estimates do not include unsupported provider
rules such as fee caps, minimum fees, or percentages calculated on the final
increased buyer charge. Platform markup is revenue before other costs.

Closing the popup resets its inputs. Version 0.1.0 does not save calculation
history, inspect websites or automatically find provider fees.

## Privacy practices draft

**Single purpose:** Estimate transaction fees and show how provider fees and
platform markup affect buyer payments and seller proceeds.

**Permissions:** None requested. No website or browsing-history access.

**Remote code:** None. Executable code and fonts are bundled in the package.

**Data handling:** Inputs are processed in popup memory for the calculation.
The extension does not transmit inputs/results, persist drafts, collect analytics,
share or sell user data. Answer the dashboard's current questions according to
their definitions and the final build; local processing is described in the
privacy policy.

**Privacy policy URL after this PR is merged:**
https://github.com/geraldAp/minorly-lens/blob/main/docs/PRIVACY.md

Open this URL while signed out and confirm it is accessible before using it in
the listing. It will not exist on main until the PR is merged.

**Support URL:** https://github.com/geraldAp/minorly-lens/issues

**Homepage/source:** https://github.com/geraldAp/minorly-lens

## Reviewer instructions

No login, payment or external service is needed.

1. Open the toolbar popup.
2. Set GHS and enter original amount 100.
3. Set the provider fee to percentage plus fixed: 2% and GHS 1.
4. Set platform markup to percentage: 1%.
5. Select custom allocation and enter buyer percentage 50.
6. Calculate. Buyer pays GHS 102.00; seller receives GHS 98.00. Combined fees are
   GHS 4.00, shared GHS 2.00 each.
7. Edit inputs to return to the form. Close and reopen to start a new calculation.

## Listing images

- Store icon: `public/icons/icon-128.png`.
- Screenshots: capture the real released UI at 1280×800; at least one is required.
  Show the calculator input and result states using the GHS example above.
- Do not depict side-panel support, saved history or automatic fee detection in
  this release's screenshots.

See [Chrome listing requirements](https://developer.chrome.com/docs/webstore/cws-dashboard-listing)
and [image specifications](https://developer.chrome.com/docs/webstore/images).
