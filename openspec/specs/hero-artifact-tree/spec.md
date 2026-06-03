# Hero Artifact Tree Specification

## Purpose

Define the artifact tree: 10 purchasable nodes with 5 levels each, providing permanent multiplicative bonuses paid with Legacy Essence (🪶). No prerequisites between nodes.

## Requirements

### Requirement: Tree has 10 linear nodes with 5 levels each

The artifact tree MUST display exactly 10 nodes in a gridded modal overlay. Each node MUST have 5 purchasable levels (1 through 5). There SHALL be NO prerequisite relationships between nodes — any node can be purchased at any time.

#### Scenario: All 10 nodes visible

- GIVEN the player opens the artifact tree modal
- THEN 10 distinct nodes SHALL be rendered
- AND each node SHALL show its current level (0-5) and cost for the next level

#### Scenario: Any node purchasable regardless of other nodes

- GIVEN the player has enough Legacy Essence
- WHEN they attempt to purchase level 1 of node 10
- THEN the purchase SHALL succeed
- AND no other node levels are required as prerequisites

### Requirement: Node effects provide multiplicative bonuses

Each node MUST grant a specific % bonus per level, applied as a multiplicative layer in `calcPlayerStats()` AFTER metaUpgrades.

| # | Node | Bonus per level |
|---|------|-----------------|
| 1 | Fuerza Ancestral | +3% ATK |
| 2 | Coraza Ancestral | +3% DEF |
| 3 | Vitalidad Ancestral | +3% HP |
| 4 | Pasos Ancestrales | +3% AGI |
| 5 | Talento Innato | +5% talent damage |
| 6 | Herencia del Equipo | +5% equipment stats |
| 7 | Sabiduría Eterna | +5% XP gained |
| 8 | Fortuna del Héroe | +5% equipment drop rate |
| 9 | Ciclo del Legado | +5% Legacy Essence gained (rebirth only) |
| 10 | Voluntad del Héroe | +5% souls gained |

#### Scenario: Bonus applies post-metaUpgrades

- GIVEN the player has metaUpgrade ATK +50% and artifact Fuerza Ancestral level 3 (+9%)
- WHEN calcPlayerStats computes ATK
- THEN the artifact bonus SHALL multiply AFTER the metaUpgrade bonus: `baseAtk * 1.5 * 1.09`

#### Scenario: Level 5 shows MAX

- GIVEN a node has been purchased to level 5
- THEN the node SHALL display "MAX" instead of a cost
- AND the purchase button SHALL be disabled

### Requirement: Costs scale with sqrt

The cost for each level SHALL be `floor(5 * sqrt(level))` 🪶. Level 1 costs 5, level 2 costs 7, level 3 costs 8, level 4 costs 10, level 5 costs 11. Total per node: 41 🪶.

#### Scenario: Cost increases per level

- GIVEN a node is at level 0
- WHEN the player views the cost for level 1
- THEN the cost SHALL be `floor(5 * sqrt(1)) = 5` 🪶
- AND level 5 SHALL cost `floor(5 * sqrt(5)) = 11` 🪶

#### Scenario: Insufficient essence blocks purchase

- GIVEN the player has 4 Legacy Essence
- AND an artifact node costs 5 🪶 for the next level
- WHEN they click purchase
- THEN the purchase SHALL be rejected
- AND a "Legacy Essence insuficiente" message SHALL display

### Requirement: Artifact tree persists across rebirths

All artifact node levels MUST survive rebirth. The tree is permanent meta-progression.

#### Scenario: Node levels unchanged after rebirth

- GIVEN the player has Fuerza Ancestral level 3 and Ciclo del Legado level 2
- WHEN they complete a rebirth
- THEN both nodes SHALL remain at their purchased levels
