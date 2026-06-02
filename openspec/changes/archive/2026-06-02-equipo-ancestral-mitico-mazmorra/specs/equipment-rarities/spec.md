# Equipment Rarities Specification

## Purpose

Define Ancestral and Mythic rarity tiers: stats, mastery, enhance cap, and drop rules. These rarities are exclusive to the dungeon and cannot be obtained in normal mode.

## Requirements

### Requirement: Ancestral rarity uses statMult ×3.0 with 4 maxed stats

Ancestral items MUST use `statMult = 3.0`, roll exactly 4 stats, each at 100% of allocated budget (no variance), and roll a random Nv3 mastery from the slot's pool. The mastery SHALL be reforjeable normally.

#### Scenario: Ancestral stats are always maxed

- GIVEN an Ancestral weapon is generated with 10 ATK budget
- WHEN the stats are rolled
- THEN ATK SHALL be exactly 10 (no 90-110% variance)

#### Scenario: Ancestral has exactly 4 stats

- GIVEN an Ancestral item
- WHEN it is generated
- THEN it MUST have exactly 4 non-zero stats

#### Scenario: Ancestral mastery is random and reforjeable

- GIVEN an Ancestral item with a mastery slot
- WHEN the item is generated
- THEN it SHALL roll a random Nv3 mastery
- AND the player MAY reforge or reroll it like any other item

### Requirement: Mythic rarity uses statMult ×4.0 with 5 fixed stats

Mythic items MUST use `statMult = 4.0`, roll exactly 5 stats, each at 100% of allocated budget, and come with a fixed Nv4 mastery determined at generation time.

#### Scenario: Mythic has 5 maxed stats

- GIVEN a Mythic armor is generated with 12 DEF budget
- WHEN the stats are rolled
- THEN DEF SHALL be exactly 12 AND the item MUST have 5 non-zero stats

#### Scenario: Mythic mastery is fixed and non-changeable

- GIVEN a Mythic item with a mastery
- WHEN the player attempts to reforge it
- THEN reforging MUST be blocked or the mastery slot disabled

### Requirement: Ancestral and Mythic cannot drop in normal mode

The system MUST prevent Ancestral and Mythic items from appearing in normal (non-dungeon) runs. They are exclusive to dungeon drops.

#### Scenario: Normal mode never drops high rarities

- GIVEN the player is in normal mode
- WHEN an enemy is defeated
- THEN no drop SHALL be Ancestral or Mythic

#### Scenario: Dungeon can drop high rarities

- GIVEN the player is in the Torre de los Ancestros dungeon
- WHEN a boss is defeated
- THEN the drop MAY be Ancestral or Mythic

### Requirement: Ancestral and Mythic items have enhance cap +15

Ancestral and Mythic items MUST support enhance levels up to +15 (was +10 for lower rarities).

#### Scenario: Enhance to +15 on Mythic

- GIVEN a Mythic weapon at enhance +14
- WHEN the player maximizes it
- THEN the item SHALL reach enhance +15

#### Scenario: Lower rarities cap at +10

- GIVEN a Legendary item at enhance +10
- WHEN the player attempts to maximize it
- THEN the system MUST prevent going above +10

### Requirement: Bonus stats unlock at +5, +10, and +15

Ancestral and Mythic items MUST grant a bonus stat at enhance levels +5, +10, and +15 (instead of the standard +5 and +10).

#### Scenario: Three bonus stats on Ancestral

- GIVEN an Ancestral item with enhance +15
- WHEN inspected
- THEN it SHALL have bonus stats at levels +5, +10, and +15

#### Scenario: Lower rarities have two bonus stats max

- GIVEN a Legendary item with enhance +10
- WHEN inspected
- THEN it SHALL have bonus stats only at +5 and +10
