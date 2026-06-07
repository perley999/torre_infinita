# Dungeon System Specification

## Purpose

Define the dungeon system: access, the Torre de los Ancestros mode, difficulty scaling, daily attempts, and loot rules.

## Requirements

### Requirement: Mazmorra button appears in main menu after floor 100

The system MUST show a "Mazmorra" button in the main menu row once the player has reached floor 100 in normal mode (`metaState.unlockedReforge === true`). Clicking it opens the dungeon selection screen.

#### Scenario: Mazmorra button visible post-floor 100

- GIVEN the player has reached floor 100
- WHEN the main menu is rendered
- THEN a "Mazmorra" button SHALL be visible

#### Scenario: Mazmorra button hidden before floor 100

- GIVEN the player has NOT reached floor 100
- WHEN the main menu is rendered
- THEN the "Mazmorra" button MUST NOT appear

### Requirement: Selection screen shows 3 dungeon slots

The dungeon selection screen MUST display 3 slots. Slot 1 is always "Torre de los Ancestros" (active). Slot 2 SHALL show "Abismo del Legado" and be selectable when `metaState.unlockedReforge === true`; otherwise it SHALL show "Próximamente" (locked). Slot 3 SHALL show "Cámara de las Runas" and be selectable when `metaState.unlockedReforge === true`; otherwise it SHALL show "Próximamente" (locked).

#### Scenario: Pre-floor 100 — slot 1 only selectable

- GIVEN the player has NOT reached floor 100
- WHEN the dungeon selection screen is open
- THEN slot 1 SHALL read "Torre de los Ancestros" and be selectable
- AND slot 2 SHALL show "Próximamente" (locked)
- AND slot 3 SHALL show "Próximamente" (locked)

#### Scenario: Post-floor 100 — slots 2 and 3 unlocked

- GIVEN the player has reached floor 100
- WHEN the dungeon selection screen is open
- THEN slot 1 SHALL read "Torre de los Ancestros" and be selectable
- AND slot 2 SHALL read "Abismo del Legado" and be selectable
- AND slot 3 SHALL read "Cámara de las Runas" and be selectable

### Requirement: Torre de los Ancestros has 10 floors with bosses

The dungeon MUST have exactly 10 floors. Floor 5 is a mini-boss, floor 10 is the final boss. The player must clear all floors to complete the run. Dying before floor 10 ends the run.

#### Scenario: Mini-boss on floor 5

- GIVEN the player is on dungeon floor 5
- WHEN combat starts
- THEN the enemy SHALL be a mini-boss

#### Scenario: Final boss on floor 10

- GIVEN the player reaches dungeon floor 10
- WHEN combat starts
- THEN the enemy SHALL be the final boss

### Requirement: N-difficulty scales infinitely

Difficulty N1 starts at floor 100 equivalent (enemy stats = normal mode floor 100). Each N+1 increases enemy stats by one tier (10 floors' worth). The player MUST clear difficulty N to unlock N+1.

#### Scenario: Unlock progression

- GIVEN the player clears Torre de los Ancestros N1
- WHEN they return to the selection screen
- THEN N2 SHALL be unlocked and selectable

#### Scenario: N1 difficulty equals floor 100

- GIVEN the player starts Torre N1
- WHEN enemy stats are calculated
- THEN they MUST match normal mode floor 100 enemies

### Requirement: 3 daily free attempts, then soul cost

The system MUST grant 3 free attempts per day (reset at midnight). Further attempts cost souls: 500, 1000, 2000... (500 × 2^(n-4)). Attempts persist in `metaState.dungeon`.

#### Scenario: Free attempts used first

- GIVEN the player has made 2 attempts today
- WHEN they start a 3rd attempt
- THEN no souls SHALL be deducted

#### Scenario: Paid attempt deducts souls

- GIVEN the player has used 3 free attempts
- WHEN they start a 4th attempt
- THEN 500 souls SHALL be deducted from metaState

#### Scenario: Daily reset replenishes attempts

- GIVEN the player used 4 attempts yesterday
- WHEN they start the game on a new day
- THEN 3 free attempts SHALL be available

### Requirement: Drop chances scale with N-level

Drop rates scale from N1 to N9+:

- Boss: 100% drop. Rarity at N1: 97% common / 2% rare / 1% epic. At N9+: 85% / 10% / 5%. Legendary+ rates improve with N.
- Mini-boss: 60% drop chance.
- Normal enemies: 5% drop chance.

#### Scenario: Boss always drops

- GIVEN the player defeats the final boss on any N difficulty
- WHEN loot is calculated
- THEN at least one item SHALL drop

#### Scenario: Rarity improves at higher N

- GIVEN the player defeats a boss on N9
- WHEN loot rarity is rolled
- THEN the chance of Rare+ drops SHALL be higher than at N1
