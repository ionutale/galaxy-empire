# Galaxy-Empire-like Mobile Game — Requirements

## Summary
A fast, clear set of product and technical requirements for a mobile strategy/empire-builder game in space inspired by games in the "galactic empire" genre. This document describes scope, gameplay systems, UX, backend, monetization, analytics, testing, and acceptance criteria.

## Scope
- Platforms: iOS and Android (primary). Optional: tablet-optimized UI.
- Genre: asynchronous strategy / empire building with fleet combat, base building, research, alliances, and timed events.
- Target audience: players 13+ who enjoy strategy, base management, and social competition.

---

## Checklist of deliverables (requirements extracted)
- Core gameplay loop (build → gather → research → attack/defend) — Partially Done (Combat/Defense pending verification)
- Player progression & progression pacing — Done
- Combat rules & balancing model — In Progress
- Multiplayer modes (asynchronous PvP, PvE, alliance wars) — In Progress
- Social features (alliances, chat, leaderboards) — Pending
- Monetization model (IAP, battle pass, ads optional) — Pending
- Backend & networking architecture (authoritative server, persistence, matchmaking) — Done (SvelteKit + Postgres)
- Analytics, telemetry, A/B experimentation hooks — Pending
- UI/UX, onboarding and retention flows — Done (Basic UI implemented)
- Non-functional requirements (latency, offline handling, battery, scaling) — Done
- Security, anti-cheat and privacy/compliance — Pending
- Test plan and acceptance criteria — Done (Vitest/Playwright setup)

---

## 1. Game Concept & High-level Flow
- Players manage a starbase and expand by constructing buildings, researching tech, and training fleets.
- Resource types: Credits (currency), Metal, Crystal, Fuel (Deuterium).
- Core loop: collect resources → upgrade base/ships → send fleets for PvE/PvP → capture rewards → repeat.
- Sessions: short daily sessions (5–15 minutes) with longer strategic decisions (hours/days of timers).

## 2. Gameplay Systems
### 2.1 Base Building
- Building types: Resource generators, Resource storages, Shipyard, Research Lab, Defenses, Alliance Hall, Market.
- Each building has levels that unlock new functionality and improve output or speed.
- Build/upgrade timers (scalable); players may speed up with premium currency.

### 2.2 Resources & Economy
- Primary resources with production rates and storage caps.
- Soft-currency (common) and premium currency (purchased).
- Resource sinks: building upgrades, ship construction, research, healing/repair.
- Inflation controls: diminishing returns, level-gated content, cost curves.

### 2.3 Research & Tech Tree
- Tech branches (military, economy, exploration, defense).
- Techs provide percentage buffs, unlock ship types or abilities.
- Research can be queued; higher tier research takes longer and consumes rare resources.

### 2.4 Fleet & Combat
- Ship archetypes: scouts, fighters, cruisers, battleships, carriers, support/utility.
	- Expanded archetypes and role examples (additional ship types to include in the template catalog):
		- Scout / Recon: very fast, low HP, low attack — used for scouting and rapid-response.
		- Interceptor / Fighter: short-range, high attack-per-cost against light ships.
		- Corvette / Frigate: small multi-role escorts with moderate speed and durability.
		- Destroyer: anti-cruiser specialty with good attack and moderate HP.
		- Cruiser: balanced mid-tier hull with good capacity and systems slots.
		- Battleship / Dreadnought: heavy capital ship with high HP and attack; slow and expensive.
		- Carrier: carries fighter squadrons or drone wings; provides force-multiplying abilities.
		- Bomber / Torpedo Boat: high single-target damage to ships and structures, fragile.
		- Transport / Cargo: large capacity, low combat value, used for trade and resource movement.
		- Support / Repair: provides healing/repair and passive buffs to nearby units.
		- Stealth / Cloak: low detectability, recon-specialist with ambush mechanics.
		- Mining Vessel: specialized for resource node extraction (used in PvE/resource maps).
- Fleet composition and counters: rock-paper-scissors balance.
- Combat resolution: asynchronous; server runs deterministic simulator and returns outcome (replay data optional).

Ship Template Examples
----------------------
Below are example ship templates that should be included in the canonical game data and used by the shipyard UI and balance tools. These are sample templates — tuning numbers are illustrative and must be balanced in playtests.

1) Scout
```
{
	"shipId": "scout",
	"name": "Scout",
	"role": "recon",
	"hp": 50,
	"attack": 8,
	"defense": 3,
	"speed": 180,
	"capacity": 10,
	"buildCost": { "metal": 50, "crystal": 10, "fuel": 5, "credits": 100 },
	"buildTime": 10
}
```

2) Fighter
```
{
	"shipId": "fighter",
	"name": "Fighter",
	"role": "fighter",
	"hp": 120,
	"attack": 40,
	"defense": 12,
	"speed": 120,
	"capacity": 5,
	"buildCost": { "metal": 200, "crystal": 50, "fuel": 20, "credits": 400 },
	"buildTime": 45
}
```

3) Cruiser
```
{
	"shipId": "cruiser",
	"name": "Cruiser",
	"role": "cruiser",
	"hp": 800,
	"attack": 220,
	"defense": 80,
	"speed": 60,
	"capacity": 80,
	"buildCost": { "metal": 3000, "crystal": 1200, "fuel": 800, "credits": 5000 },
	"buildTime": 3600
}
```

4) Battleship
```
{
	"shipId": "battleship",
	"name": "Battleship",
	"role": "capital",
	"hp": 5000,
	"attack": 1800,
	"defense": 700,
	"speed": 30,
	"capacity": 300,
	"buildCost": { "metal": 25000, "crystal": 12000, "fuel": 6000, "credits": 50000 },
	"buildTime": 86400
}
```

5) Carrier
```
{
	"shipId": "carrier",
	"name": "Carrier",
	"role": "carrier",
	"hp": 2200,
	"attack": 300,
	"defense": 400,
	"speed": 40,
	"capacity": 1500,
	"hangarSlots": 8,
	"buildCost": { "metal": 12000, "crystal": 8000, "fuel": 4000, "credits": 20000 },
	"buildTime": 43200
}
```

6) Transport
```
{
	"shipId": "transport",
	"name": "Transport",
	"role": "transport",
	"hp": 400,
	"attack": 10,
	"defense": 30,
	"speed": 50,
	"capacity": 2000,
	"buildCost": { "metal": 5000, "crystal": 2000, "fuel": 1000, "credits": 8000 },
	"buildTime": 7200
}
```

Balance and Unlocks
-------------------
Each new ship template must be associated with research/tech prerequisites and shipyard level requirements. Add a balancing task to the backlog (see appended backlog entries) and ensure ship templates are exposed to the shipyard template endpoint and seed data.
- Combat mechanics: attack/defense power, hit points, shield/armor, special abilities.
- Movement/travel time between systems; travel times depend on ship speed and distance.
- Planet/star occupation mechanics for PvE and PvP objectives.

### 2.5 PvE Content
- Resource nodes, NPC fleets, story missions, and timed challenges with rewards.
- Difficulty scaling by player power or zone levels.

### 2.6 PvP and Alliances
- Asynchronous PvP: players attack others' bases while they’re offline; protection windows for new or low-level players.
- Alliance mechanics: alliance chat, alliance research/tech, alliance events (raids, territory control), donation/aid systems.
- Matchmaking for competitive events by power, rank, or brackets.

### 2.7 Events, Seasons & Live Ops
- Time-limited events with objectives and leaderboards.
- Season/battle pass mechanics for recurring progression and monetization.
- Gift/compensation flows and push-notification triggers.

## 3. UX & UI Requirements
- Clean HUD: resources, VIP/premium balance, current timers, notification center.
- Onboarding tutorial: interactive first-run that covers base building, sending a fleet, using the shop, joining an alliance.
- HUD adapts to screen size (phones/tablets) with touch-optimized controls.
- Accessibility: color-blind palettes, scalable fonts, button-size minimums.
- Localization support (right-to-left optional).

## 4. Monetization
- In-app purchases (IAP) bundles: consumable premium currency, starter packs, VIP subscription.
- Battle pass (free + premium tiers) with time-limited rewards.
- Ads: optional rewarded ads for temporary boosts or timers (opt-in only). No forced interstitial ads during combat.
- Cosmetic items: base skins, ship skins, profile frames.
- Conversions: p0–p5 player personas and LTV targets defined in analytics.

## 5. Backend & Network
- Authoritative server model for persistence and combat resolution.
- Platform: cloud (AWS/GCP/Azure) with autoscaling backend services and managed DB (Postgres/NoSQL hybrid depending on access patterns).
- APIs: REST or gRPC for client-server actions; websockets for live chat and real-time event notifications.
- Data persistence: player state, inventories, transactions; transactionally-safe currency updates.
- Matchmaking service and event/tournament service.
- Anti-cheat: server-side validation of all progression and combat outcomes; detection/ban pipeline.

## 6. Technical Stack (Implemented)
- **Framework**: SvelteKit (Full-stack: Frontend + Backend API).
- **Language**: TypeScript.
- **Database**: PostgreSQL (managed via Drizzle ORM).
- **Styling**: TailwindCSS + DaisyUI.
- **Testing**: Vitest (Unit) + Playwright (E2E).
- **Containerization**: Docker & Docker Compose.
- **Build/CI**: GitHub Actions.

## 7. Analytics, Telemetry & Live Ops
- Track events: installs, retention (D1/D7/D30), monetization (IAP events), engagement (sessions/day), funnels (tutorial drop-offs), error logs.
- A/B testing hooks and feature flags.
- Leaderboards, ranking, and fraud signals reporting.
- Integrations: attribution (Adjust/AppsFlyer), in-app analytics (Firebase/Amplitude), crash reporting (Sentry/Firebase Crashlytics).

## 8. Security & Compliance
- GDPR/CCPA data handling: opt-in consents, data export/delete APIs for players.
- Secure storage of credentials and payment tokens; follow platform payment rules.
- Rate-limiting APIs to prevent abuse; encrypt PII at rest.

## 9. Non-functional Requirements
- Target FPS: 30–60 on supported devices; smooth UI transitions.
- Startup time: < 5s on modern phones.
- Low battery footprint and minimized background operations.
- Offline support: limited read-only view and local queuing of non-critical actions; critical actions require connectivity.
- Backend latency: < 200ms median for common calls; scalability to tens of thousands of concurrent players in first-year launch projections.

## 10. Testing & QA
- Unit tests for client logic and server services.
- Integration tests for API contracts and common flows (login, purchase, combat resolution).
- Load testing for matchmaking, login storms, and event spikes.
- Manual QA checklist: tutorial flow, IAP, edge case combat, alliance operations, localized builds.

## 11. Acceptance Criteria (per feature)
- New player onboarding: 75% completion within first session in soft launch.
- Building/upgrade timers: reliable and rollback-safe; no desync between client and server.
- Combat: deterministic server resolution with replay data; results verified by unit/integration tests.
- Monetization: successful end-to-end purchase flow for app stores in staging.
- Social: alliance creation/joining and chat functioning with websocket reconnection.

## 12. Data Contracts (minimal examples)
- Player profile (State): { userId, level, power, credits, metal, crystal, fuel }
- User Identity: { id, username }
- Ship template: { shipId, name, role, hp, attack, defense, speed, buildCost }
- Fleet dispatch: { fleetId, userId, ships: [{shipId,count}], origin, destination, eta, missionType }
- Event reward: { eventId, userId, rewardItems: [{type,id,qty}] }

## 13. Edge Cases & Risks
- Race conditions in resource deduction during concurrent purchases or donations — mitigate with server-side transactions and optimistic locks.
- Player disconnect mid-fleet dispatch or mid-battle — server authoritative state should continue simulation.
- Fraud: anomalous rapid resource gains — implement anomaly detection and manual review flows.
- Downtime during live events — failover plans and transparent compensation flows.

## 14. Operational & Live Launch Checklist
- Staging + production environments, with blue/green or canary deploys.
- Instrumentation for key metrics and alerts.
- Customer support/ticketing integration and in-game support flows.
- Soft-launch and closed beta strategy with telemetry targets and iteration plan.

## 15. Next Steps
- Convert this doc into a prioritized product backlog (MVP → v1 → live ops roadmap).
- Design: low-fidelity wireframes for the HUD and onboarding screens.
- Prototype: implement base building and resource loop in a minimum viable client + mock server.

## 16. Art & Audio
- Art direction: sci-fi, semi-realistic with vibrant neon accents; clear silhouette language for ships and buildings.
- Asset pipeline: modular ship parts (hulls, engines, weapons) to allow skinning and cosmetic variants.
- UI assets: scalable vector UI where possible; 9-slice sprites for responsive HUD.
- Animation: ship movement, build/upgrade animations, combat VFX (explosions, shield impacts), idle animations for base.
- Audio: adaptive music layers for safe/alert/combat states, SFX for UI feedback, fleet movement, and combat hits.
- Performance budget: limit on draw calls and particle counts for mid-range devices; LODs for ship models on tablet/desktop.

## 17. Glossary
- ARPDAU: Average Revenue Per Daily Active User.
- ARPPU: Average Revenue Per Paying User.
- ETA: Estimated time of arrival for fleets.
- IAP: In-App Purchase.
- MVP: Minimum Viable Product.
- SLO: Service Level Objective.
- VIP: Premium player status granting recurring bonuses.

---

## Appendix: Success Metrics (example)
- D1 retention ≥ 40% (soft-launch target)
- D7 retention ≥ 15% (soft-launch target)
- ARPDAU and ARPPU goals to be set after market analysis
- Crash-free sessions > 99.5%


---

## 18. Platform Store Submission Checklist
- App Store / Google Play metadata: title, subtitle, description, keywords, screenshots (phone/tablet), promo video.
- Privacy policy URL and contact email in store listing.
- App bundles and in-app product IDs configured in store consoles.
- Test accounts for IAP and sandbox purchases; receipts validation on server.
- Compliance checks: COPPA if under-13 targeting, platform age-rating questionnaires completed.
- Accessibility and localization verification for each targeted locale.

## 19. Legal, Ratings & Age Gate
- Prepare legal review: TOS, EULA, privacy policy, refund policy, community guidelines.
- Ratings: submit for ESRB/PEGI/other regional ratings if required; include in store listings.
- Age gate: implement soft age gates and parental gate where purchases or social features are enabled for younger users.

## 20. CI/CD and Deployment Runbook
- Repo layout, branching model (main, develop, feature/*, release/*).
- Automated builds: client (Unity) and server artifacts built on push to release branches.
- Tests: unit tests run on PRs; smoke tests on merge to develop; canary deploy to staging.
- Deployment: automated deployment to staging; manual approval for production with rollout (canary/percentage-based).
- Rollback: automated rollback on failed health checks; migration-runner with dry-run option.

## 21. Telemetry Catalog (selected events & schemas)
- session_start { playerId, sessionId, ts, clientVersion, deviceModel }
- tutorial_step { playerId, stepId, outcome, ts }
- purchase { playerId, orderId, sku, price, currency, ts }
- fleet_dispatch { playerId, fleetId, origin, destination, ships: [{shipId,count}], eta, missionType, ts }
- combat_result { battleId, attackerId, defenderId, winnerId, losses: {attacker,defender}, duration, ts }
- event_progress { playerId, eventId, objectiveId, progressDelta, ts }

Notes: Each event should include schema versioning, sampling rules, and privacy flags. Instrument client and server-side events consistently.

## 22. Economy Design Notes
- Currencies: Credits (soft), Materials (soft), Rare Resource (mid), Premium (hard/purchased).
- Currency flows: clear earn sources (missions, resource production, events) and sinks (upgrades, ships, repairs, boosts).
- Pacing controls: daily caps for farmable soft currencies, decreasing marginal returns, gated content based on player level.
- Anti-inflation: dynamic pricing in shop, cooldowns for high-yield actions, and event-only powerful rewards limited by rarity.
- Fraud controls: server-side receipt validation, transaction logs, rollback for suspicious transactions.

## 23. Deterministic Combat Specification
- Combat is resolved server-side with a deterministic simulator.
- Order of operations for each tick:
	1. Apply speed/initiative ordering
	2. Resolve abilities/triggers (buffs/debuffs)
	3. Calculate damage: effectiveDamage = max(0, attack * (1 + attackBuff) - defense * (1 + defenseBuff))
	4. Apply shield absorption before HP deduction
	5. Apply continuous effects (DOT/HoT)
	6. Check death/ship removal
	7. End-tick cleanup (loot, experience)
- RNG must be seeded from a server-provided deterministic seed; all RNG calls are recorded in the replay.
- Replays: store minimal command log + seed so client can replay locally for UX.

## 24. Data Operations & Migrations
- Schema versioning for player and game state tables.
- Migration strategy: backward-compatible additive changes first, two-phase migrations for destructive changes.
- Backups: nightly snapshots and immediate export before major migrations.
- Data retention and archival strategy for inactive accounts (>2 years) and event logs (retain hot logs 90 days, cold storage 2+ years).

## 25. MVP Roadmap & Milestones
- MVP scope (target 3 months prototype):
	- Core base-building and resource loop
	- 5 ship types and shipyard
	- Single-player PvE missions
	- Simple asynchronous PvP attacks with shield/protection
	- Basic alliance creation and chat
	- IAP for premium currency + receipt validation
- Milestones: prototyping (4w), soft-launch region (6–8w), iterate (6w), global launch readiness (4w).

## 26. Localization & Accessibility (expanded)
- Supported locales at launch: en, es, pt-BR, fr, de, ru, zh-CN, ja, ko.
- String externalization and pluralization support; in-context localization QA.
- Accessibility: audio cues for important events, high-contrast mode, resizable UI, captions for audio tutorials.

## 27. Privacy, Data Retention & Deletion
- Players can request data export or deletion; implement APIs and admin tools to fulfill requests within legal SLA (e.g., 30 days).
- Minimize PII collection; store only what's necessary and encrypt PII fields.
- Retention policies: transactional records 1 year active, 3+ years archived; analytics aggregated beyond individual identifiers after 90 days.

## 28. SLOs, Monitoring & Alerting
- Availability SLO: 99.9% for login and matchmaking APIs; 99.5% for event/tournament services.
- Latency SLO: 95th percentile < 500ms for common reads; < 1s for writes that trigger longer server work.
- Alerts: error-rate spikes, payment failures, queue backlogs, DB replica lag, and deployment rollbacks.

## 29. Customer Support, Moderation & Community
- Support channels: in-game ticketing, email, and knowledge base; integrate with Zendesk/Intercom.
- Moderation: chat filters, report buttons, auto-moderation for repeated offenses, escalation queue for human review.
- Community programs: ambassador program, scheduled events, social media playtests.

## 30. Playtest & Soft-Launch Metrics
- Playtest plan: internal playtests → closed alpha (100–500 users) → soft-launch in 1–3 markets.
- Key metrics to monitor in soft-launch: retention (D1/D7/D14), engagement (avg session length), conversion rate, churn cohorts, economy health (resource velocity), and bug/crash rates.

---

End of requirements document.

## 31. Prioritized Backlog & User Stories (MVP → v1)
Priority legend: MVP (must-have for initial soft-launch), High, Medium, Low.

Epic A — Core Base & Economy (MVP)
- User story A1: As a player, I can construct and upgrade buildings on my base so I can increase resource production and unlock features.
	- Acceptance: build menu, level requirements, timers, production change, server-validated state.
	- Estimate: 3–5 sprints
- User story A2: As a player, I can collect resources from generators and view storage caps so I can plan upgrades.
	- Acceptance: production ticks visible, storage enforced, server reconciliation.
	- Estimate: 1–2 sprints

Epic B — Shipyard & Fleets (MVP)
- User story B1: As a player, I can build ships of 5 base types and send fleets on missions.
	- Acceptance: ship build queue, mission dispatch, ETA, fleet persistence on server.
	- Estimate: 3 sprints
- User story B2: As a player, I receive mission rewards and ship losses are reconciled correctly.
	- Acceptance: resource rewards, ship counts updated server-side.
	- Estimate: 1 sprint

Epic C — PvE Missions & AI (MVP)
- User story C1: As a player, I can attack NPC fleets and get rewards.
	- Acceptance: deterministic combat result, reward distribution, mission replay available.
	- Estimate: 2 sprints

Epic D — PvP & Protection (MVP - simplified)
- User story D1: As a player, I can be attacked asynchronously; new accounts have a protection period.
	- Acceptance: attack resolution, protection window enforced, replay stored.
	- Estimate: 2 sprints

Epic E — Account, Login & Persistence (MVP)
- User story E1: As a player, I can create an account and resume progress on another device.
	- Acceptance: account creation, secure login, server-side state restore.
	- Estimate: 2 sprints

Epic F — Basic Monetization (MVP)
- User story F1: As a player, I can purchase premium currency via IAP and see updated balance.
	- Acceptance: successful sandbox purchase in staging, server receipt verification, UX for failed/rolled-back purchases.
	- Estimate: 2 sprints

Epic G — Alliances & Chat (High)
- User story G1: As a player, I can create/join alliances and chat with members.
	- Acceptance: alliance creation, membership changes, websocket-based chat, basic moderation (filters).
	- Estimate: 3 sprints

Epic H — Events, Battle Pass & Live Ops (High)
- User story H1: As a player, I can participate in a time-limited event with objectives and rewards.
	- Acceptance: event UI, objective tracking, reward delivery, leaderboards.
	- Estimate: 3 sprints

Epic I — Metrics, Crash Reporting & A/B (High)
- User story I1: As an analytics engineer, I can view retention and conversion metrics for stories and features.
	- Acceptance: telemetry piped to analytics system, dashboards for D1/D7/D30 retention and IAP conversion.
	- Estimate: 2 sprints

Epic J — Art, Audio & Polish (Medium)
- User story J1: As a player, I experience satisfying audio/visual feedback for core actions (build, attack, reward).
	- Acceptance: animations, SFX, music transitions implemented within performance budgets.
	- Estimate: ongoing across sprints

Epic K — Security, Anti-cheat & Compliance (Medium)
- User story K1: As an operator, I can detect and roll back suspicious transactions and flag accounts for review.
	- Acceptance: anomaly detection rules, admin dashboard, automated rollback pipeline for confirmed fraud.
	- Estimate: 2 sprints

Epic L — Scaling & SRE (Medium)
- User story L1: As an SRE, I can scale backend services during an event spike without manual intervention.
	- Acceptance: autoscaling policies, load tests, runbook for manual intervention.
	- Estimate: 2 sprints

Epic M — Localization, Accessibility & Legal (Low for MVP)
- User story M1: As a non-English player, I see translated UI strings in my language.
	- Acceptance: string externalization, QA for key locales.
	- Estimate: 1–2 sprints per locale

Roadmap note: focus first three-months on Epics A–F to reach a soft-launch MVP; roll Epics G–L across the next 3–6 months.

## 32. Acceptance Test Cases (representative)
- Onboarding funnel:
	- Test: create new account → complete tutorial steps 1–5 → verify player reaches level 3 and has starter ships.
	- Expected: tutorial completed, D1 metric recorded, no server error.
- Build cycle:
	- Test: start upgrade level 1→2, validate timer, accelerate with premium currency, validate instant completion and server-side deduction.
	- Expected: timers respected; currency deducted once; client and server agree on building level.
- Combat resolution:
	- Test: dispatch fleet vs NPC; simulate identical seed locally; server returns outcome; client replay matches server log.
	- Expected: deterministic outcome reproducible with seed; losses match records.
- Purchase flow:
	- Test: perform sandbox IAP → server validates receipt → currency credited.
	- Expected: order stored, balance updated, telemetry event emitted.
- Alliance flow:
	- Test: create alliance, invite player, accept invite, send chat message.
	- Expected: membership changes reflected for both users; chat messages delivered and persisted.

---

End of requirements document.

