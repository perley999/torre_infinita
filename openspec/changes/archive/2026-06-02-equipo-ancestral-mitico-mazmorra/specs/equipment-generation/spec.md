# Equipment Generation Specification

## Purpose

Define how equipment stats are generated: budget allocation, stat pools per slot, and stat range variance. This spec covers the full equipment generation system including the tighter stat ranges and ring pool changes.

## Requirements

### Requirement: Primary stat rolls within 90-110% of budget

The system MUST roll each primary stat value between 90% and 110% of the allocated budget for that stat. Primary stats are the main stat for each slot: ATK for weapon, DEF for armor, and the chosen primary for ring (HP, ATK, DEF, or AGI).

#### Scenario: Primary stat within range

- GIVEN an item is being generated for the weapon slot
- WHEN the budget allocates 10 ATK as the primary stat
- THEN the generated ATK SHALL be between 9 and 11 (inclusive)

#### Scenario: Primary stat at range boundaries

- GIVEN a ring with HP as primary stat and budget allocates 20 HP
- WHEN the item is generated
- THEN the HP value SHALL be exactly 18, 19, 20, 21, or 22

### Requirement: Secondary stat rolls within 80-120% of budget

The system MUST roll each secondary stat value between 80% and 120% of the allocated budget for that stat.

#### Scenario: Secondary stat within range

- GIVEN an armor item with a Dodge secondary stat allocated 5 budget
- WHEN the item is generated
- THEN the Dodge value SHALL be between 4 and 6 (inclusive)

#### Scenario: Multiple secondary stats each use individual range

- GIVEN a weapon with CRIT (budget 3) and Lifesteal (budget 4)
- WHEN the item is generated
- THEN CRIT SHALL be 2-4 AND Lifesteal SHALL be 3-5 independently

### Requirement: HP is excluded from the ring stat pool

The ring slot MUST NOT generate HP as a primary, secondary, or bonus stat. HP SHALL only appear on armor items.

#### Scenario: Ring never rolls HP

- GIVEN a ring item being generated
- WHEN the stat pool is selected
- THEN HP MUST NOT appear in any stat slot (primary, secondary, or bonus)

#### Scenario: Armor still rolls HP

- GIVEN an armor item being generated
- WHEN the stat pool is selected
- THEN HP MAY appear as expected

### Requirement: Budget calculation uses floor formula

The system MUST calculate total stat budget as `floor(budgetBase * log2(floor + 1) * statMult(rarity))`, with `budgetBase = 5`.

#### Scenario: Budget scales with floor and rarity

- GIVEN floor 100 and a Rare item (statMult 1.5)
- WHEN the budget is calculated
- THEN budget = floor(5 * log2(101) * 1.5)

### Requirement: Stat pools follow slot-specific rules

Each equipment slot MUST have its own primary stat and allowed secondary stat pools as defined in `BALANCE.equipment.statPools`.

- **Weapon**: primary = ATK, secondaries = [CRIT, Lifesteal, PEN, CRIT DMG, Boss DMG]
- **Armor**: primary = DEF, secondaries = [HP, Dodge, HP REGEN]
- **Ring**: primary = [HP, ATK, DEF, AGI], secondaries = any (including repeats of primaries)

#### Scenario: Valid ring primary stats

- GIVEN a ring item
- WHEN the primary stat is selected
- THEN it MUST be one of: HP, ATK, DEF, or AGI

#### Scenario: HP excluded from ring secondaries

- GIVEN a ring item
- WHEN secondary stats are rolled
- THEN HP MUST NOT appear among them
