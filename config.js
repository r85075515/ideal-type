/*
 * config.js — M0 prototype site configuration.
 * Edit these values in ONE place; nothing audience- or payment-related is
 * hard-coded in the page copy or logic.
 */
window.M0_CONFIG = {
  // Audience wording is CONFIGURABLE on purpose (minipool spec §2 / O1).
  // DECIDED 2026-10-27 by Ray: M0 runs a single female track — 200 adult
  // women faces; landing copy states the audience openly (spec §2.1).
  audienceLabel: 'your ideal woman',
  audiencePrompt: 'Answer honestly — there are no wrong picks.',
  audienceNote: 'This round of testing is for people looking for their ideal woman. All faces are AI-generated adults (18+).',

  // Paywall (v2 §1.2 / v2.1 §4.2: M0 test price, Stripe Payment Link).
  priceUSD: 6.99,
  // Live Stripe Payment Link (created 2026-10-27, product "Ideal Type
  // Finder — Full Result", USD 6.99 one-time, status Active). Checkout flow
  // verified end-to-end in Stripe test mode with a test card.
  stripePaymentLink: 'https://buy.stripe.com/3cI28j0Tl5xwdBj5fvbjW00',

  productName: 'Ideal Type Finder',
  aiDisclosure: 'All faces and the generated preview are AI-generated. No real people, no user photos are uploaded or used.'
};
