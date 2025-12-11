# Galaxy Empire Expansion Plan

This document outlines the roadmap for implementing advanced features in Galaxy Empire.

## Phase 1: Fleet System (The Engine of War)

**Objective**: Allow players to send ships on missions.

- [ ] **Database Schema**: Create `fleets` table (id, owner, origin, destination, arrival_time, mission_type, cargo, ship_composition).
- [ ] **Backend Logic**: Implement `processFleets` in `processor.ts` to handle fleet movement, arrival, and return trips.
- [ ] **UI**: Create a "Fleet Command" interface to select ships, target coordinates, and mission type.
- [ ] **Visualization**: Show active fleets in transit with progress bars.

## Phase 2: Galaxy Map (The World)

**Objective**: Create a spatial context for the game.

- [ ] **Database Schema**: Create `galaxy_map` table (system_id, x, y, planet_id, owner_id, planet_type).
- [ ] **Generation**: Script to generate a random galaxy with stars and planets.
- [ ] **UI**: Interactive Grid/Hex map where players can click systems to view details.
- [ ] **Integration**: Link Map clicks to Fleet Command (e.g., "Attack this planet").

## Phase 3: Combat Engine (The Conflict)

**Objective**: Make battles meaningful and visible.

- [ ] **Database Schema**: Create `combat_reports` table to store detailed battle logs.
- [ ] **Simulation**: Enhance `simulateCombat` to handle multiple ship types, shielding, and rapid-fire mechanics.
- [ ] **UI**: "Battle Report" view showing round-by-round combat details, losses, and loot.

## Phase 4: Tech Tree (The Progression)

**Objective**: Visualize player advancement.

- [ ] **UI**: Interactive node graph showing technology dependencies.
- [ ] **Logic**: Enforce requirements strictly (already partially done, needs audit).

## Phase 5: Alliance System (The Community)

**Objective**: Enable cooperative gameplay.

- [ ] **Database Schema**: `alliances` (id, name, tag) and `alliance_members` tables.
- [ ] **Features**: Alliance Chat, Shared Fleet View, Resource Trading.

## Phase 6: Polish & Optimization

- [ ] **Type Safety**: Strict TypeScript definitions for all game entities.
- [ ] **Performance**: Optimize the game loop to handle hundreds of concurrent fleets.
