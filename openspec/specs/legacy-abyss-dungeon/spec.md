# Legacy Abyss Dungeon Specification

## Purpose

Define the Abyss of Legacy dungeon: a 10-floor dungeon unlocked at floor 100 that rewards Legacy Essence (🪶). Reuses the existing dungeon combat engine and shares daily attempts with Torre de los Ancestros.

## Requirements

### Requirement: Third dungeon slot unlocked at floor 100

The dungeon selection screen MUST display "Abismo del Legado" as the third slot when `metaState.unlockedReforge === true`. Before that, it SHALL show "Próximamente" (locked).

#### Scenario: Unlocked after floor 100

- GIVEN the player has reached floor 100
- WHEN the dungeon selection screen opens
- THEN slot 3 SHALL read "Abismo del Legado"
- AND SHALL be selectable

#### Scenario: Locked before floor 100

- GIVEN the player has NOT reached floor 100
- WHEN the dungeon selection screen opens
- THEN slot 3 SHALL show "Próximamente" (locked)

### Requirement: 10 floors with mini-boss and final boss

The dungeon MUST have exactly 10 floors. Floor 5 is a mini-boss, floor 10 is the final boss. Dying before floor 10 ends the run. Reuses the same combat engine as Torre de los Ancestros.

#### Scenario: Mini-boss on floor 5

- GIVEN the player is on dungeon floor 5 in Abismo del Legado
- WHEN combat starts
- THEN the enemy SHALL be a mini-boss

#### Scenario: Final boss on floor 10

- GIVEN the player reaches dungeon floor 10 in Abismo del Legado
- WHEN combat starts
- THEN the enemy SHALL be the final boss

### Requirement: Legacy Essence drops on floor completion

The system MUST award Legacy Essence when the player completes a floor or defeats the boss. Formula for floor completion: `floor(sqrt(heroLevel) * floorNum / 50)` 🪶. The final boss SHALL award double the floor 10 amount. No equipment drops — the Abismo only rewards Legacy Essence.

#### Scenario: Floor completion awards essence

- GIVEN the player has heroLevel 100 and clears floor 10
- WHEN the floor is completed
- THEN `floor(sqrt(100) * 10 / 50) = 2` 🪶 SHALL be added

#### Scenario: Boss kill awards bonus essence

- GIVEN the player kills the final boss on floor 10 with heroLevel 646
- THEN `floor(sqrt(646) * 10 / 50) * 2 = floor(25.4 * 10 / 50) * 2 = 10` 🪶 SHALL be awarded

#### Scenario: No equipment drops

- GIVEN the player defeats any enemy in Abismo del Legado
- THEN no equipment item SHALL drop

### Requirement: Hardcap of 3 daily attempts, no paid extras

The Abismo del Legado MUST have its own separate pool of 3 attempts per day, independent from Torre de los Ancestros. After the 3 attempts are used, no more runs are possible until the daily reset. Souls CANNOT be spent to purchase extra attempts. `metaState.dungeon` SHALL track `attemptsTodayLegacy` separately.

#### Scenario: Independent attempt counter

- GIVEN the player has used all 3 free attempts in Torre de los Ancestros today
- WHEN they start an Abismo del Legado run
- THEN it SHALL be their 1st attempt in Abismo del Legado
- AND 3 attempts SHALL be available

#### Scenario: Hardcap blocks extra attempts

- GIVEN the player has used 3 attempts in Abismo del Legado today
- WHEN they try to start a 4th Abismo del Legado run
- THEN the run SHALL be rejected
- AND a message SHALL say "Ya usaste todos los intentos"
- AND no souls SHALL be deducted

### Requirement: Legacy Essence drops not multiplied by artifact bonuses

The Ciclo del Legado artifact node (+5% Legacy Essence per level) MUST NOT affect Abismo del Legado drops. That bonus ONLY applies to the Legacy Essence gained at rebirth.

#### Scenario: No artifact multiplier on dungeon drops

- GIVEN the player has Ciclo del Legado level 5 (+25%)
- WHEN they complete a floor in Abismo del Legado
- THEN the Legacy Essence awarded SHALL NOT include the Ciclo bonus
