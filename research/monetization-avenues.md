# Research: every legal monetization avenue for mipin

**Ticket:** [#2](https://github.com/sapr160/mipin/issues/2) · **Date:** 2026-07-22 · **Status:** resolved

**Context:** mipin is a free, unofficial web app (pin-exchange marketplace + swipe-matching) for athletes at the Central American and Caribbean Games Santo Domingo 2026 (July 24 – August 8, 2026 — ~17 days of window left as of this writing; ~6,200 athletes from 40 countries per [Wikipedia](https://en.wikipedia.org/wiki/2026_Central_American_and_Caribbean_Games) / [olympics.com](https://www.olympics.com/es/noticias/centroamericanos-santo-domingo-2026-sedes)). Ceiling ~8,000 users, realistic capture a few hundred. Solo unaffiliated operator in the Dominican Republic (DR), no company. Stack: Next.js + Supabase + Vercel free tiers. MVP is 100% free.

**Honest headline:** total expected revenue across *everything* is **US$75–400 for the whole event**. The binding constraint is not ideas — it is (a) payment rails available to a DR individual within days, and (b) the 17-day clock.

---

## Part 1 — Payment rails for a DR-based individual (verified against primary sources)

This gates everything else, so it comes first.

### PayPal in the DR: works, including withdrawal to DR banks

- The DR is a full send/receive PayPal market. PayPal's own DR pages ("Withdraw Funds from Your Sales") state you can withdraw USD or pesos "from your sales quickly and easily from your PayPal account directly to most major local banks." — [PayPal DO withdrawal options](https://www.paypal.com/do/webapps/mpp/withdrawal-options?locale.x=en_DO)
- Withdrawal paths: **local DR bank in DOP** (e.g., Banco Popular; ~5, up to 7 business days) or a **US bank account** if you have one. — [PayPal DO / Banco Popular](https://www.paypal.com/do/webapps/mpp/withdraw-funds/banco-popular?locale.x=en_DO), [How do I withdraw (DO)](https://www.paypal.com/do/webapps/mpp/withdraw-funds?locale.x=en_DO)
- Cost caveat: cross-border receiving fees (~4.4–5.4% + fixed fee) plus USD→DOP conversion spread bite hard on $1–$10 payments.

### PayPal freeze risk: real, documented, and exactly this scenario

The operator asked whether PayPal has risks beyond "setting up a link." Yes:

- **180-day holds:** PayPal's User Agreement lets it hold funds up to 180 days after a permanent limitation to cover reversals; AUP violations likewise. — [PayPal User Agreement](https://www.paypal.com/us/legalhub/paypal/useragreement-full)
- **21-day new-seller holds** per payment, extendable to 180 days. — [PayPal: why is your payment on hold](https://www.paypal.com/us/brc/article/funds-availability)
- **Reserves** (rolling/minimum) on accounts flagged as risky. — [PayPal: account reserves](https://www.paypal.com/us/brc/article/account-reserves)
- A **brand-new personal account suddenly receiving many small cross-border payments** is the classic automated-limitation trigger. Mitigations: open a **Business** account, complete identity + bank verification on day one, label payments honestly, respond to any verification demand immediately, withdraw frequently so the balance at risk stays small.

### Stripe: not available in the DR

- The DR is **not** on Stripe's supported-country list. — [stripe.com/global](https://stripe.com/global)
- Workaround is **Stripe Atlas** (US Delaware LLC): $500 one-time + $100/yr registered agent + ~$300/yr Delaware LLC franchise tax + US filings; account usable within days of incorporation. — [stripe.com/atlas](https://stripe.com/atlas), [Atlas docs](https://docs.stripe.com/atlas/signup). Disproportionate for tip-scale revenue; not recommended for this event.

### Buy Me a Coffee: NOT feasible from the DR

BMC pays creators only via Stripe Express, and its official payout-country list **does not include the Dominican Republic**. — [BMC supported payout countries](https://help.buymeacoffee.com/en/articles/6258038-supported-countries-for-payouts-on-buy-me-a-coffee)

### Ko-fi: feasible (rides on your own PayPal)

Ko-fi routes payments directly to the creator's own PayPal or Stripe; where Stripe is unavailable, "you can still use PayPal to accept payments." Ko-fi takes **0% platform fee on one-time tips** (only PayPal processing applies). Inherits all PayPal risks above. — [Ko-fi: how do I get paid](https://help.ko-fi.com/hc/en-us/articles/115003980093-How-do-I-get-paid), [Ko-fi: Stripe country support](https://help.ko-fi.com/hc/en-us/articles/360009265834-Can-I-use-Stripe-in-my-country)

### Local DR processors: possible for a persona física, but weeks not days

- **Azul (Grupo Popular):** requires DGII registration (natural or legal person), business documents, sales-officer process; e-commerce links via PagAzul. Timeline: weeks. — [azul.com.do](https://www.azul.com.do/Pages/es/conocenos.aspx), [pagazul.app](https://pagazul.app/)
- **CardNET:** has an explicit "Afiliación para personas" track (cédula/RNC required); payment links / button / WhatsApp payments; commercial underwriting applies. — [cardnet.com.do/afiliate/personal](https://www.cardnet.com.do/afiliate/personal)
- **Fygaro** (DR-active aggregator) still needs an underlying acquirer set up. — [fygaro.com](https://www.fygaro.com/)
- **tPago** and DR interbank ACH: local payers with DR bank accounts only — useless for foreign athletes. — [tpago.com](https://tpago.com/terminos-de-uso/)

### Other rails

- **Payoneer:** supports DR (local receiving accounts, withdrawal to DR banks in 3–5 business days) but is a *payout endpoint*, not a consumer checkout — useful only to receive Paddle/marketplace payouts. — [Payoneer receiving accounts FAQ](https://payoneer.custhelp.com/app/answers/detail/a_id/18786/~/receiving-accounts---faq)
- **Wise:** no accounts for DR residents (send-to only). — [wise.com](https://wise.com/us/send-money/send-money-to-dominican-republic)
- **Paddle (merchant of record):** supports DR sellers, pays monthly (~15th) via wire/Payoneer; approval possible in 1–2 days with ToS/privacy pages; digital products only, no tips/donations. — [Paddle: getting paid](https://www.paddle.com/help/manage/get-paid/when-and-how-do-i-get-paid)
- **Lemon Squeezy:** PayPal payouts could reach DR, but new-store approvals are restricted post-Stripe-acquisition — not reliable in days. — [LS docs: getting paid](https://docs.lemonsqueezy.com/help/getting-started/getting-paid)
- **Crypto (e.g., USDC link):** DR Central Bank says crypto is not legal tender and not backed, but there is no prohibition — legal gray zone, near-zero uptake expected. — [eldinero.com.do (BCRD communiqué)](https://eldinero.com.do/174512/banco-central-criptomonedas-no-estan-avaladas-como-medio-de-pago-en-republica-dominicana/)

**Rails bottom line:** for money flowing within days, the operator realistically has **one rail — PayPal (optionally fronted by Ko-fi)**, with Paddle+Payoneer as a slower second rail for productized unlocks. Treat PayPal hold/limitation risk as the main operational hazard.

---

## Part 2 — Monetization avenues, one by one

| # | Avenue | Realistic revenue | Setup | Rail feasibility (DR) | Key risks |
|---|--------|------------------|-------|----------------------|-----------|
| 1 | Ko-fi tip jar | $5–75 | <1 hour | Yes (Ko-fi→PayPal) | ~none |
| 2 | Local flat-fee sponsors | $0–300 | 2–5 days selling | Cash/local transfer | Ambush-marketing framing; time sink |
| 3 | Freemium unlock ($5 reveal) | $20–125 | 1–2 days | PayPal (or Paddle) | Kills network growth if too early |
| 4 | Promoted pin listings | $10–60 | ~1 day | Same as #3 | Near-zero value at tiny scale |
| 5 | Print-on-demand merch | $0–100 | 1–2 days | Storefront handles | Shipping outlives event; IP drift |
| 6 | Affiliates (Airalo etc.) | $0–30 | hours + approval lag | Payout thresholds | Window already passing |
| 7 | Sell list / user data | $0 | — | — | **Illegal without consent (Law 172-13)** |
| 8 | Sell the app later | ~$0 now | — | — | Value expires Aug 8; keep code as playbook |

### 1. Donations / tips — **best effort-to-return ratio**
Ko-fi: 0% platform fee on one-time tips vs Buy Me a Coffee's 5% ([The Podcast Host](https://www.thepodcasthost.com/monetisation/ko-fi-vs-buy-me-a-coffee/)) — and BMC can't pay out to the DR anyway. Documented tip conversion for free tools is brutal (one measured case: 1 donation per 4,206 users, ~0.02% — [Indie Hackers](https://www.indiehackers.com/post/1-4206-conversion-rate-on-buy-me-a-coffee-1ed21a2288)); a warm community of athletes who got matches might do 1–3% at $3–5. Frame: "keep mipin free."

### 2. Sponsorships / local advertisers — **highest ceiling**
Newsletter/micro-app benchmarks are CPM-driven ($20–100 CPM — [Admailr](https://www.admailr.com/email-advertising-tips/newsletter-advertising-rates/), [beehiiv](https://www.beehiiv.com/blog/newsletter-sponsorship-cost)), which at 300–500 users yields only $10–50 per placement; tiny hyper-targeted audiences sell **flat-fee** instead. Defensible pitch: **US$50–150 per sponsor** for a banner + pinned listing, sold as "exclusive access to international athletes physically in your city for two weeks." There is real commercial energy around the Games (Banreservas, Arajet, Hyundai, Gatorade sponsor officially; 100k+ tourists projected — [Diario Libre](https://www.diariolibre.com/deportes/olimpismo/2026/05/27/santo-domingo-2026-recibe-impulso-de-banreservas/3548244), [Sin Cortapisa](https://sincortapisa.com/-santo-domingo-2026-genera-un-importante-impulso-economico-con-la-llegada-de-delegaciones-y-turistas-/)). Targets: restaurants/shops near the Villa Centroamericana; expect in-person + WhatsApp selling, cash/local transfer collection, 2–5 days to close 1–2 deals. **Sell "reach athletes visiting Santo Domingo," never "advertise at the Games"** (see Part 3). A sponsor paying $100+ may ask for a comprobante fiscal → requires a free RNC from DGII.

### 3. Freemium unlock ($5 "see who liked you") — **timed for week 2**
Freemium conversion benchmarks: ~2% typical for consumer apps (RevenueCat data via [daydream](https://www.withdaydream.com/library/insights/freemium-conversion-rate)); dating-style apps 3–8%, peaking after weeks of use and much higher among users who already have matches ([Linkrunner](https://linkrunner.io/blog/metrics-that-matter-dating-community-edition), [Lenny's Newsletter](https://www.lennysnewsletter.com/p/what-is-a-good-free-to-paid-conversion)). Math: 300 users × 3% × $5 ≈ **$45**; optimistic 500 × 5% = $125. PayPal fees eat ~9% of a $5 charge. **Do not gate the core loop at launch** — in a network-effect app with a 17-day life, paywalling early strangles the only growth window. Flip it on around Aug 1 when engagement peaks. If framed as a digital product, Paddle (merchant of record, DR-supported) is a cleaner rail than raw PayPal.

### 4. Promoted / featured pin listings — **bundle or skip**
Marketplace precedents (eBay Promoted Listings 2–8% ad rates — [EcomCalcTools](https://ecomcalctools.com/blog/ebay-promoted-listings-guide/); Etsy $0.20 + 6.5% — [Voolist](https://www.voolist.com/blog/etsy-fees-explained-2026)) work because of huge search volume. With a few hundred users every listing is already visible; a $2–3 "feature my pin" boost sells maybe 5–20 times. Only worth doing if the payment rail already exists for #3; otherwise it's a "support the app" vanity badge.

### 5. Merch (print-on-demand) — **defer to post-event**
POD nets $5–12 profit per shirt ([Printful](https://www.printful.com/blog/what-is-a-good-profit-margin-for-print-on-demand)), setup 1–2 days — but Caribbean POD shipping is 5–10+ business days, so athletes leave before merch arrives. If done, ship to home addresses as a post-event "memories" drop. Designs must be generic pin-trading culture ("Pin Trader", crossed pins, national flags, "I traded pins in the Caribbean, Summer 2026") — zero Games marks/mascot/wordmark.

### 6. Affiliate / referral — **mostly missed window**
Airalo eSIM is the only real product-market fit (~10% commission, PayPal payout — [Airalo](https://www.airalo.com/blog/the-airalo-affiliate-program-everything-you-need-to-know)), but athletes bought connectivity before arriving. Booking.com (~4%) irrelevant (lodging arranged); Amazon Associates has payout thresholds ($10 deposit/$100 check — [Amazon Associates Help](https://affiliate-program.amazon.com/help/node/topic/GP8Z3AZ27ZFHTEUL)) and a 3-sales-in-180-days rule, plus no meaningful DR delivery. Honest ceiling: $0–30, and affiliate approval lag can outlast the event.

### 7. Selling the email list / user data — **never**
DR **Law 172-13** requires prior, unequivocal, specific, revocable consent for personal-data processing and specifically penalizes offering email databases without express consent ([RIPD summary](https://www.redipd.org/documentos/la-legislacion-dominicana-sobre-proteccion-de-datos-personales-principios-consentimiento), [law text — ONE](https://www.one.gob.do/media/u5ohmfyp/ley-172-13.pdf)). Foreign (incl. EU) athletes add GDPR exposure. The only compliant flavor is an opt-in sponsor newsletter. Legal liability far exceeds any possible revenue.

### 8. Selling the app / asset later — **option value only**
Pre-revenue micro-apps fetch low hundreds at best on Flippa-class markets, and this asset's value expires August 8. Real value: keep the codebase as a proven playbook for the next multi-sport event (Pan Am Games, etc.).

---

## Part 3 — Legal / compliance overlay (applies to every avenue)

- **Rights holders:** Centro Caribe Sports owns the Games properties; COSADO (Decree 450-22) runs Santo Domingo 2026 with a dedicated commercialization commission ([centrocaribesports.org](https://centrocaribesports.org/)). Olympic-family bodies actively enforce against marks, mascots, emblems, and *implied endorsement* — not just logo copying ([Vondran Legal](https://www.vondranlegal.com/olympic-trademark-and-copyright-infringement-don-t-get-disqualified), [Dinsmore](https://www.dinsmore.com/publications/slippery-slope-when-are-companies-allowed-to-use-the-olympic-trademarks/)).
- **Safe posture (nominative fair use):** factual, text-only references to the event; no logos/mascot/emblems ever, and never in the app name, domain, logo, or merch ([nominative use](https://en.wikipedia.org/wiki/Nominative_use)). Footer disclaimer on every page: *"Aplicación independiente y no oficial. No está afiliada a, ni patrocinada o avalada por COSADO, Centro Caribe Sports ni los XXV Juegos Centroamericanos y del Caribe."* A disclaimer helps but doesn't immunize — selling sponsorships "around the Games" raises ambush-marketing risk, so the sales pitch is "athletes visiting Santo Domingo," never the Games.
- **DR tax:** individuals are income-tax-exempt up to RD$416,220/yr (~US$7,000) ([DGII](https://dgii.gov.do/cicloContribuyente/obligacionesTributarias/principalesImpuestos/Paginas/impuestoSobreRenta.aspx)); realistic revenue here is 1–3% of that. RNC registration (free, online, days — [DGII RNC](https://dgii.gov.do/cicloContribuyente/registroRNC/Paginas/default.aspx)) becomes necessary only if a sponsor wants a comprobante fiscal.

---

## Ranked recommendation

1. **Ko-fi tip jar routed to a fully-verified DR PayPal *Business* account — do today (<1 hr).** 0% platform fee, zero growth risk, zero legal risk. Verify identity + bank on day one, withdraw frequently, expect possible 21-day holds. ($5–75)
2. **1–2 local flat-fee sponsors at $50–150 each.** Highest ceiling; ~2 days of walk-in/WhatsApp selling near the athlete village. Sell "athletes in your city," never "the Games"; get an RNC if they want an invoice. ($0–300)
3. **$5 "see who liked you" unlock — enabled only around Aug 1** (week 2, engagement peak), via PayPal or Paddle-as-merchant-of-record. ($20–125)
4. **$2–3 featured-listing badge — bundle with #3** if the rail already exists; skip otherwise. ($10–60)
5. **Defer:** merch (post-event home-address drop only), affiliates (apply to Airalo now, expect ~nothing), asset sale (keep code for the next Games).
6. **Never:** selling the email list or user data (Law 172-13), any use of official Games marks, Buy Me a Coffee (no DR payouts), Stripe direct (DR unsupported), Stripe Atlas (cost/overhead disproportionate).

**PayPal, answered directly:** yes, there are real risks beyond "setting up a link" — new accounts receiving bursts of small international payments are the textbook trigger for 21-day payment holds, reserves, and limitations with funds frozen up to 180 days, all per PayPal's own User Agreement. But it is also the *only* rail a DR individual can stand up in a day, and DR PayPal accounts *can* withdraw to local banks in pesos. Use it — as a verified Business account, with balances swept often.
