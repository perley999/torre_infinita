# Prestige System Specification

## Purpose

Define the rebirth system: Renacer button, Legacy Essence calculation, partial progress reset, and the one-rebirth-per-run cap.

## Requirements

### Requirement: Renacer button visibility

The system MUST show a "Renacer" button only when `metaState.unlockedReforge === true` AND `!runState.active`.

#### Scenario: Visible post-floor 100 with no active run

- GIVEN `metaState.unlockedReforge` is true
- AND `runState.active` is false
- WHEN the action bar is rendered
- THEN a "Renacer" button SHALL be visible

#### Scenario: Hidden before floor 100 or during active run

- GIVEN `metaState.unlockedReforge` is false
- OR `runState.active` is true
- WHEN the action bar is rendered
- THEN the "Renacer" button MUST NOT appear

### Requirement: Confirmation modal

Clicking "Renacer" MUST open a confirmation modal summarising gains (Legacy Essence amount) and losses (almas, esencias, upgrades, heroLevel, specialization).

#### Scenario: Modal shows summary

- GIVEN the player clicks "Renacer"
- THEN a modal SHALL display the calculated Legacy Essence
- AND list all items that will be reset

#### Scenario: Cancel aborts

- GIVEN the confirmation modal is open
- WHEN the player clicks "Cancelar"
- THEN the modal SHALL close
- AND no state changes SHALL occur

### Requirement: Legacy Essence calculation

The system MUST calculate Legacy Essence at Renacer confirm, BEFORE any reset. Formula: `floor(sqrt(heroLevel) * max(maxFloor, 100) / 100)`. Result SHALL add to `metaState.legacyEssence`.

#### Scenario: Standard calculation

- GIVEN heroLevel 25 and maxFloor 120
- WHEN rebirth confirms
- THEN `floor(5 * 120 / 100) = 6` 🪶 SHALL be added

#### Scenario: Minimum floor

- GIVEN heroLevel 10 and maxFloor 105
- WHEN rebirth confirms
- THEN the formula SHALL use `max(105, 100)`

### Requirement: Progress reset on rebirth

The system MUST reset: almas to 0, esencias to 0, all metaUpgrades to level 0, heroLevel to 0, heroXp to 0, specialization to `''`. MUST preserve: equipment, class, maxFloor, Legacy Essence, artifact tree, leaderboard.

#### Scenario: Reset items zeroed

- GIVEN 5000 almas, 30 esencias, heroLevel 42
- WHEN rebirth completes
- THEN almas SHALL be 0, esencias SHALL be 0, heroLevel SHALL be 0
- AND all metaUpgrades SHALL be level 0, specialization unselected

#### Scenario: Persisted items survive

- GIVEN equipment, class, maxFloor 120
- WHEN rebirth completes
- THEN equipment SHALL remain, class SHALL persist, maxFloor SHALL stay
- AND Legacy Essence SHALL retain prior value plus new amount
- AND artifact tree levels SHALL be unchanged

### Requirement: One rebirth per run

The system MUST cap rebirth at 1 per run. The button SHALL be absent post-rebirth until a new run starts and completes.

#### Scenario: Cannot renacer twice

- GIVEN the player just rebirthed
- WHEN checking the action bar
- THEN the "Renacer" button SHALL be absent

### Requirement: Class passive and specialization re-unlock

After rebirth, class passive SHALL re-unlock at heroLevel 50. Specialization SHALL be re-choosable at heroLevel 100.

#### Scenario: Passive at level 50

- GIVEN rebirthed at level 49
- WHEN leveling to 50
- THEN the class passive SHALL become active

#### Scenario: Specialization at level 100

- GIVEN rebirthed and reaching heroLevel 100
- WHEN leveling up
- THEN the specialization selection modal SHALL appear
- AND no prior specialization SHALL be loaded
