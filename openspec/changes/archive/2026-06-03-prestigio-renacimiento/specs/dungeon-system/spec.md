# Delta for Dungeon System

## MODIFIED Requirements

### Requirement: Selection screen shows 3 dungeon slots

The dungeon selection screen MUST display 3 slots. Slot 1 is always "Torre de los Ancestros" (active). Slot 2 SHALL show "Próximamente" (locked). Slot 3 SHALL show "Abismo del Legado" and be selectable when `metaState.unlockedReforge === true`; otherwise it SHALL show "Próximamente" (locked).
(Previously: Slot 1 active, slots 2 and 3 both "Próximamente" locked)

#### Scenario: Pre-floor 100 — slot 1 only selectable

- GIVEN the player has NOT reached floor 100
- WHEN the dungeon selection screen is open
- THEN slot 1 SHALL read "Torre de los Ancestros" and be selectable
- AND slot 2 SHALL show "Próximamente" (locked)
- AND slot 3 SHALL show "Próximamente" (locked)

#### Scenario: Post-floor 100 — slot 3 unlocked

- GIVEN the player has reached floor 100
- WHEN the dungeon selection screen is open
- THEN slot 1 SHALL read "Torre de los Ancestros" and be selectable
- AND slot 2 SHALL show "Próximamente" (locked)
- AND slot 3 SHALL read "Abismo del Legado" and be selectable
