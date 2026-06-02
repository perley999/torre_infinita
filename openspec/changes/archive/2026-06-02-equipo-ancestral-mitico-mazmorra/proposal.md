# Proposal: Equipo Ancestral / Mítico + Mazmorra

## Intent

Endgame past floor 100 feels flat — random stat ranges make drops unrewarding. Add a dungeon with guaranteed-quality gear (Ancestral, Mythic) as alternative progression.

## Scope

### In Scope
- Stat ranges: primary 90-110%, secondary 80-120%
- HP removed from ring pool
- Ancestral (×3.0, max stats, Nv3 mastery reforjeable, +15 enhance)
- Mythic (×4.0, 5 stats, Nv4 locked mastery, +15 enhance)
- Mastery Nv4 values for all 9
- Mazmorra button in main menu
- Torre de los Ancestros: 10 floors, miniboss P5, boss P10
- N-level difficulty (N1=P100, N2=P110...) infinite
- 3 daily attempts, extra cost souls (500, 1000, 2000...)
- Drop rates: boss 100%, miniboss 60%, normal 5%

### Out of Scope
- Legacy Essence dungeon, Runa system, artifact tree nodes

## Capabilities

### New Capabilities
- `equipment-rarities`: Ancestral/Mythic with enhanced max +15, stat rules
- `mastery-4`: Level 4 values for all 9 masteries
- `dungeon-system`: Torre de los Ancestros, N-difficulty, daily attempts

### Modified Capabilities
- `equipment-generation`: Tighter stat ranges, HP removed from ring

## Approach

Extend BALANCE + generateItem() + render() patterns. Dungeon runs reuse runState with `dungeonType/dungeonDifficulty/dungeonFloor`. Daily attempts in `metaState.dungeon`. All in `Torre_Infinita.html`.

## Affected Areas

| Area | Impact |
|------|--------|
| BALANCE object | New rarities, mastery Nv4, dungeon config |
| generateItem() | Ancestral/Mythic logic, HP exclusion |
| render() | Dungeon UI, buttons, run display |
| metaState/runState | Dungeon fields, daily attempts |
| saveGame() | Dungeon persistence |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Save format breaks existing saves | Med | Read with fallback defaults |
| N-level dungeon balance | Low | N1 = P100 benchmark |
| Daily timer edge cases | Low | Date string check, no complex timer |

## Rollback Plan

Revert git commit. Old code safely ignores `metaState.dungeon` fields.

## Dependencies

None. All in `Torre_Infinita.html`.

## Success Criteria

- [ ] Stats roll 90-110% primary / 80-120% secondary
- [ ] Ring never drops HP
- [ ] Ancestral: max stats + Nv3 mastery reforjeable
- [ ] Mythic: ×4.0, 5 stats, Nv4 locked mastery
- [ ] Mazmorra button visible, opens selection
- [ ] Torre de los Ancestros: 10 floors, correct drops
- [ ] N-difficulty scales correctly (N1-N9+)
- [ ] 3 free dailies, 4th+ costs souls
- [ ] Save/load preserves dungeon progress
