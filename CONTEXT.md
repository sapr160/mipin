# mipin

Pin-exchange marketplace (core) plus swipe-matching for athletes at the Central American and Caribbean Games Santo Domingo 2026. Unofficial, free, bilingual ES (default) / EN.

## Language

### App structure

**Landing**:
The logged-out homepage — the page the QR code and share links open. Pitches both features and carries the sign-in CTA.
_Avoid_: landing page (as a separate route), splash, home

**Shell**:
The logged-in frame around every feature: header (logo, language toggle, share button), bottom tab bar, and footer. Owns the tab-badge mechanism; features plug into it.
_Avoid_: layout, chrome, nav

**Tab**:
One of the four bottom-bar destinations: Pines, Intercambios, Matches, Perfil.

**Tab badge**:
The unread count on a tab, cleared by opening the tab. Counts events newer than the tab's last-seen time; the only notification channel in the MVP.
_Avoid_: notification, alert

### Identity & profile

**Onboarded**:
A signed-in user who has completed their profile; the Shell admits only onboarded users.
_Avoid_: registered, activated, complete profile

**Age wall**:
The permanent refusal screen shown to an auth account that ever submitted an under-18 date of birth. Sticks to the account forever.
_Avoid_: age gate (that's the DOB question itself), block, ban

**WhatsApp number**:
A user's phone number, stored once and visible to no one else until both sides of a match or trade consent to reveal it.
_Avoid_: phone, contact info

### Distribution

**Share prompt**:
The one-tap WhatsApp share carrying the pre-written bilingual message. Appears once after onboarding ("comparte con tu equipo") and persistently in the header.
_Avoid_: invite, referral

**First-touch source**:
Where a visitor first came from — `qr` or `share` — captured on their first visit and never overwritten.
_Avoid_: UTM, campaign
