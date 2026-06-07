# Dungeon Cámara de las Runas Specification

## Purpose

Define the Cámara de las Runas dungeon: endless 1v1 waves with a boss every 10, rewarding only 🔮 Polvo de Runas. Shares 3-attempts/day with other dungeons.

## Requirements

### Requirement: Unlocked at floor 100

The dungeon MUST unlock when `metaState.unlockedReforge === true`. It SHALL appear as slot 3 in selection.

#### Scenario: Hidden before 100

- GIVEN player NOT at floor 100
- WHEN viewing dungeon selection
- THEN slot 3 SHALL show "Próximamente" (locked)

#### Scenario: Visible post-100

- GIVEN player reached floor 100
- WHEN viewing dungeon selection
- THEN slot 3 SHALL read "Cámara de las Runas" and be selectable

### Requirement: Endless wave format

Enemies appear 1v1 with 0.5s between waves. No floors, no transitions, no shops.

#### Scenario: Automatic progression

- GIVEN player defeats wave 1
- THEN after 0.5s, wave 2 enemy SHALL appear and combat resume

### Requirement: Boss every 10 waves

Boss appears on waves 10, 20, 30... with boss HP multiplier applied.

#### Scenario: Wave 10 boss

- GIVEN player reaches wave 10
- WHEN enemy spawns
- THEN it SHALL be a boss

### Requirement: Stats scale with player power

Enemy stats scale from hero level + equipped stats + class, using a derived `playerPower`. Scaling uses diminishing returns to prevent blowup.

#### Scenario: Increasing difficulty

- GIVEN two consecutive waves N and N+1
- THEN wave N+1 SHALL have ≥ stats of wave N
- AND increases SHALL diminish as waves grow

### Requirement: Reward only 🔮

No equipment, souls, or essences. Formula: `floor(wave/3) + floor(wave/5) + bosses×2`.

#### Scenario: Reward at wave 15

- GIVEN player reaches wave 15, 1 boss defeated
- WHEN run ends
- THEN reward = `5 + 3 + 2 = 10🔮`

#### Scenario: Pre-boss death

- GIVEN player dies on wave 9
- THEN reward = `3 + 1 = 4🔮` (no boss bonus)

### Requirement: Shared daily attempt counter

Uses same `metaState.dungeon` counter as other dungeons: 3 free/day, then 500×2^(n-4) souls.

#### Scenario: Attempt consumed

- GIVEN 3 free attempts
- WHEN starting a run
- THEN free count SHALL decrease by 1

#### Scenario: Shared pool

- GIVEN 2 free attempts used in Torre
- WHEN starting Cámara run
- THEN 1 free attempt SHALL remain

### Requirement: Run ends on death or manual exit

Both cases calculate rewards from waves reached.

#### Scenario: Manual exit

- GIVEN player reaches wave 12
- WHEN manually exiting
- THEN 🔮 for wave 12 SHALL be awarded
