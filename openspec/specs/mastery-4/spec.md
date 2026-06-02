# Mastery Level 4 Specification

## Purpose

Define Nv4 values for all 9 masteries. Mastery Nv4 is exclusive to Mythic items and cannot be reforged.

## Requirements

### Requirement: Nv4 mastery values are defined for all 9 masteries

Each mastery MUST have a Nv4 value, extending the existing Nv1-Nv3 progression. The system MUST display Nv4 masteries correctly in all UI elements.

| Slot | Mastery | Nv1 | Nv2 | Nv3 | Nv4 |
|------|---------|:---:|:---:|:---:|:---:|
| Arma | Crítica (flat crit) | +5 | +10 | +15 | +20 |
| Arma | Vampírica (flat lifesteal) | +5% | +7.5% | +10% | +15% |
| Arma | Furiosa (hits for ×2 dmg) | 7 hits | 5 hits | 3 hits | 2 hits |
| Armadura | Bloqueo (flat block) | +2.5% | +5% | +7.5% | +10% |
| Armadura | Regenerativa (% HP REGEN) | +5% | +7.5% | +10% | +15% |
| Armadura | Resistente (% dmg reduction) | 5% | 10% | 15% | 20% |
| Anillo | Evasiva (flat dodge) | +2.5% | +5% | +7.5% | +10% |
| Anillo | Perforante (flat PEN) | +5% | +7.5% | +10% | +15% |
| Anillo | Afortunada (% soul dupe) | 10% | 20% | 30% | 40% |

#### Scenario: Mythic item shows Nv4 mastery

- GIVEN a Mythic ring with Afortunada mastery
- WHEN the player inspects the item
- THEN the tooltip SHALL display "Afortunada Nv4 (40%)"

#### Scenario: Nv4 effect applies in combat

- GIVEN a Mythic weapon with Crítica Nv4
- WHEN the player attacks
- THEN the crit chance SHALL include +20 flat post-DR

### Requirement: Nv4 is exclusive to Mythic items

Mastery Nv4 MUST only appear on Mythic-quality items. Lower rarities (including Ancestral) MUST cap at Nv3.

#### Scenario: Ancestral caps at Nv3

- GIVEN an Ancestral armor with Bloqueo mastery
- WHEN inspected
- THEN the mastery level SHALL be Nv3, not Nv4

#### Scenario: Mythic always has Nv4

- GIVEN a Mythic item
- WHEN generated
- THEN its mastery SHALL be exactly Nv4

### Requirement: Nv4 mastery cannot be reforged or changed

Mastery on Mythic items MUST be fixed at generation time. The reforging system MUST disable the mastery slot for Mythic items.

#### Scenario: Reforge modal blocks Mythic mastery

- GIVEN a Mythic item selected in the reforge modal
- WHEN the player tries to reforge its mastery
- THEN the reforge option SHALL be disabled or show "cannot be reforged"

#### Scenario: Random reforge skip on Mythic

- GIVEN a Mythic item
- WHEN the player calls `reforgeRandom()`
- THEN the system MUST leave the mastery unchanged
