# Rune System Specification

## Purpose

Runas: 2 per equipment (condition + effect) = Runeword. Fabricated from 🔮 + 💀, rarity S/SS/SSS, enhance/reroll/upgrade.

## Requirements

### Requirement: 6 slots per piece

Each piece (weapon/armor/ring) MUST have upper=condition, lower=effect. Both filled = active Runeword.

#### Scenario: Equip

- GIVEN a condition rune in inventory
- WHEN assigned to an upper slot
- THEN the slot SHALL display the rune

#### Scenario: Duplicate blocked

- GIVEN "Golpe_Seco→Cortar" active on weapon
- WHEN assigning same to armor
- THEN system SHALL reject

### Requirement: Fabrication

Cost: 10🔮 + 100💀 per attempt. Player picks pool (condition/effect), result is random within pool.

#### Scenario: Success

- GIVEN 10🔮, 100💀
- WHEN fabricating a condition
- THEN random condition created, resources deducted

#### Scenario: Insufficient

- GIVEN <10🔮
- WHEN fabricating
- THEN rejected

### Requirement: Rarity and enhance

Enhance: `floor(1.5^n)` cost per level, +8% effect each level. Enhance resets on rarity upgrade.

| Rarity | Max Enh | Upgrade cost |
|--------|:-------:|--------------|
| S | +5 | →SS: 25🔮+250💀 |
| SS | +10 | →SSS: 100🔮+1000💀 |
| SSS | final | — |

Enhance costs per level: 0→1=1, 1→2=1, 2→3=2, 3→4=3, 4→5=5, 5→6=7, 6→7=11, 7→8=17, 8→9=25, 9→10=38.

#### Scenario: Enhance

- GIVEN S rune +0, 1🔮
- WHEN enhancing
- THEN +1, +8%, 1🔮 deducted

#### Scenario: Upgrade to SS

- GIVEN S+5, 25🔮, 250💀
- WHEN upgrading
- THEN SS at +0, resources deducted

### Requirement: Reroll

Random: 3🔮+30💀. Choose: 8🔮+80💀. Enhance resets to +0.

#### Scenario: Reroll

- GIVEN condition rune, 3🔮, 30💀
- WHEN rerolling
- THEN different condition at +0

### Requirement: Conditions (8)

| Condition | Triggers when | S | SS | SSS |
|-----------|:-------------|:--:|:--:|:---:|
| Golpe_Seco | N consecutive hits same enemy | 3 | 2 | 1 |
| Al_Limite | HP below threshold after dmg | 50% | 60% | 70% |
| Reflejos | Dodge or block | any | any | any |
| Cosecha | Kill enemy (cooldown ticks) | 20 (2s) | 15 (1.5s) | 10 (1s) |
| Castigo | Receive crit hit | crit | crit | <15%HP |
| Ritmo | X combat ticks elapsed | 6 | 5 | 4 |
| Tormenta | N debuffs applied | 3× | 2× | 1× |
| Presion | Enemy HP below after atk | 30% | 40% | 50% |

### Requirement: Effects (10)

| Effect | Applies | S | SS | SSS |
|--------|:--------|:--:|:--:|:---:|
| Cortar | Bleed %HP/tick ×3s | 2% | 3% | 5% |
| Avalancha | ATK×N 3s | 1.3 | 1.5 | 1.8 |
| Muro | Shield %maxHP | 12% | 18% | 25% |
| Pulso | Heal %HP | 8% | 12% | 18% |
| Marca | Vuln +%dmg 3s | 15% | 20% | 30% |
| Cuchilla | Bonus %ATK | 12% | 18% | 25% |
| Ventisca | −%speed 2s | 20% | 30% | 40% |
| Osmosis | Steal %enemyHP | 5% | 8% | 12% |
| Coraza | +%DEF 4s | 25% | 40% | 60% |
| Impetu | +%atkSpd 3s | 15% | 22% | 30% |

#### Scenario: Condition triggers effect

- GIVEN condition criteria met in combat
- THEN the linked effect SHALL apply with rarity-scaled values

### Requirement: UI

Character screen MUST show slots per piece post-100. Forge MUST have "Runas" tab with inventory + actions.

#### Scenario: Character view

- GIVEN player at floor 100+
- WHEN viewing character
- THEN each piece SHALL show 2 rune slots

#### Scenario: Forge tab

- GIVEN forge open post-100
- WHEN selecting "Runas" tab
- THEN inventory + equipped + actions SHALL be visible
