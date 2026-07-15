# Refactor `separate-ui-logic` — Registro histórico

> Documento histórico del refactor. NO es un plan a seguir — es un registro de lo
> que se hizo, en qué orden, y por qué. La rama `refactor/separate-ui-logic`
> está pusheada a origin (18 commits) y la fase F4 está cerrada.

## Estado actual (post-F4b-4b)

**HTML**: 9700 → 503 líneas (-95%). Solo queda el init code inline (loadGame,
retro-check, render/updateButtons, showTutorial).

**Módulos JS**: 24 archivos, organizados en capas. Todos siguen el patrón IIFE
+ `window.X = X` mirrors + `Game.X = { ... }` namespace export.

```
Buried-gentle/
├── Torre_Infinita.html     503 líneas (entry point)
├── css/
│   ├── base.css            reset, variables, tipografía
│   ├── layout.css          grid, flexbox, media queries
│   └── components.css      botones, cards, modales (1193 líneas)
└── js/
    ├── controls.js         startRun, buyUpgrade, endTraining, restartRun (182)
    ├── core/
    │   ├── balance.js      objeto BALANCE (números del juego) (170)
    │   ├── state.js        metaState, runState, save/load (440)
    │   ├── constants.js    pools, talentos, clases, runas (344)
    │   ├── calc.js         cálculos puros, debuffs, ilvl (527)
    │   ├── equipment.js    selectDungeonDrop, generateItem, tryEquip (163)
    │   └── utilities.js    formatNum, formatRunTime, addLog, flashElement, spawnFloat (113)
    ├── game/
    │   ├── combat.js       startCombat, enemyDefeated, playerDied, calcTieredBonuses (751)
    │   ├── combat-tick.js  combatTick loop principal (1056)
    │   ├── classes.js      clases, specs, character screen (592)
    │   ├── talents.js      checkLevelUp, showTalentChoice, selectTalent (195)
    │   ├── runes.js        sistema de runas completo (1295)
    │   ├── dungeons.js     abismo, cámara ancestral, cámara rúnica (499)
    │   └── debuffs.js      placeholder (reservado para F6)
    └── ui/
        ├── render.js       render() principal (324)
        ├── dom.js          updateButtons (68)
        ├── modals-flow.js  training, recap, rebirth, artifact, leaderboard, tutorial (459)
        ├── modals-equipment.js  forja, reforge, maximize, equip comparison (535)
        ├── codex.js        codex de talentos y clases (314)
        ├── arena.js        ARENA_EMOJIS + 8 funciones de arena (75)
        ├── arena.js        ver arriba
        ├── character.js    placeholder (F6 cleanup)
        ├── codex.js        ver arriba
        ├── comparisons.js  placeholder (F6 cleanup)
        ├── death-recap.js  placeholder (F6 cleanup)
        ├── leaderboard.js  placeholder (F6 cleanup)
        ├── legacy-tree.js  placeholder (F6 cleanup)
        ├── rebirth.js      placeholder (F6 cleanup)
        ├── reforge.js      placeholder (F6 cleanup)
        ├── training.js     placeholder (F6 cleanup)
        └── upgrades.js     placeholder (F6 cleanup)
```

> Nota: `js/game/equipment.js` no existe. La generación de equipo vive en
> `js/core/equipment.js` (decisión del sub-agent F3, aceptada por el usuario).
> No hay `js/utils/` separado — utilities viven en `js/core/utilities.js`.
> El plan original preveía `js/utils/format.js` y `js/utils/math.js` separados,
> pero se aceptó la estructura consolidada.

## Orden de ejecución (lo que realmente se hizo)

### F0 — Scaffold y core

1. `8fedbb9` chore(refactor): scaffold file tree and IIFE skeletons
2. `7b7ec41` refactor(core): extract 6 core modules to js/core/
3. `8a7bf70` refactor(game): add debuffs.js placeholder module for F3 game logic

### F3 — Game logic

4. `62d04a0` refactor(game): extract classes and specializations to js/game/classes.js
5. `5b5c724` refactor(game): extract talent choices to js/game/talents.js
6. `0b05c4a` refactor(game): consolidate runes (definitions + 10 logic + 6 modal)
7. `ab55525` refactor(game): consolidate dungeons (4 sections) to js/game/dungeons.js
8. `500aa64` refactor(game): extract startCombat/enemyDefeated/playerDied/calcTieredBonuses

### Fixes durante F3

9. `02a3224` fix(refactor): remove orphan const declarations from PR 3
10. `84db1c7` fix(refactor): remove orphan duplicate functions from combat.js

### F4 — UI extraction

11. `35de93e` refactor(game): extract combatTick loop to js/game/combat-tick.js
12. `57e4aa9` refactor(controls): extract endTraining/restartRun + expose combatLoop
13. `3f17287` refactor(ui): extract flow modals to js/ui/modals-flow.js
14. `39229bf` refactor(ui): extract equipment modals to js/ui/modals-equipment.js
15. `99a6914` refactor(ui): extract codex and arena to js/ui/codex.js and js/ui/arena.js
16. `8958b1a` refactor(cleanup): move startRun, buyUpgrade, updateButtons, formatRunTime
17. `2599f6f` refactor(ui): extract render() to js/ui/render.js

### F1 — CSS (intercalado)

- `3fd2b8c` refactor(css): extract inline styles to base.css, layout.css, components.css

## Decisiones arquitectónicas tomadas durante el refactor

### `var` top-level para variables que cruzan scripts

`let` dentro de un IIFE strict no se filtra al script-global lexical env. Si un
módulo expone una variable que otros módulos o handlers inline necesitan leer
(como `combatLoop` o `isFirstAttack`), se declara con `var` a nivel top-level
del archivo, fuera del IIFE. Esto fue necesario en `js/game/combat-tick.js` y
`js/controls.js`.

### Cross-module calls via global lookup

Los módulos llaman a funciones de otros módulos sin prefijo (`arenaIdle()`,
`enemyDefeated()`, `formatRunTime()`). Esto funciona porque todos los scripts
comparten el script-global lexical env. Las funciones se exponen con
`window.X = X;` al final de cada IIFE. Es robusto pero implícito — si alguien
borra una `window.X = X` pensando que es código muerto, rompe call sites.

### Patrón de exposición para `onclick="X()"`

El HTML body usa `onclick="showXxx()"` en muchos botones. Las funciones movidas
a módulos DEBEN seguir accesibles desde el global. Por eso cada módulo exporta
con `window.X = X;` además del namespace `Game.X = { ... }`.

### Init code se queda inline

El bloque al final del inline `<script>` que llama a `loadGame()`,
`checkTrainingUnlock()`, retro-check de reforge, arena hide default, y
finalmente `render(); updateButtons(); showTutorial();` permanece en el HTML.
Es el entry point legítimo del script inline.

## Lo que NO se hizo (deuda pendiente)

### F4c — Separar handlers de modales de `js/game/*`

Varios archivos en `js/game/` mezclan lógica pura con handlers de modales:

- `js/game/runes.js` (1295 líneas) tiene `showRuneModal`, `renderRuneModal`,
  `showFabricateConfirm`, `doFabricate` mezclados con lógica de runas.
- `js/game/classes.js` (592 líneas) tiene `showClassSelection`, `showSpecSelection`,
  `showCharacterScreen`, `renderCharacterScreen` mezclados con clases.
- `js/game/dungeons.js` (499 líneas) tiene `showDungeonSelection`,
  `showDungeonComplete` mezclados con lógica de dungeons.
- `js/game/talents.js` (195 líneas) tiene `showTalentChoice`, `renderChoices`
  mezclados con `checkLevelUp`.

Mover estos handlers a `js/ui/*` sería cosmética — el código funciona, pero
queda más coherente por dominio.

### Placeholders vacíos en `js/ui/`

Nueve archivos placeholder quedaron vacíos del scaffold inicial y nunca se
llenaron (sus funciones se pusieron en otros archivos):
`arena.js`, `character.js`, `codex.js`, `comparisons.js`, `death-recap.js`,
`leaderboard.js`, `legacy-tree.js`, `rebirth.js`, `reforge.js`,
`training.js`, `upgrades.js`. **Nota**: `arena.js` y `codex.js` SÍ se llenaron
después (F4b-3) — los demás siguen vacíos.

### `js/utils/` no creado

El plan original preveía `js/utils/format.js` y `js/utils/math.js`. Se aceptó
la estructura consolidada: `formatNum` y `formatRunTime` en
`js/core/utilities.js`, cálculos puros en `js/core/calc.js`.

### `index.html` separado de `Torre_Infinita.html`

No se creó. El entry point sigue siendo `Torre_Infinita.html` (503 líneas).

### Validación manual en browser

No se hizo. Los commits son byte-faithful (verificado con `git show` y
`node --check` por sub-agent), pero conviene abrir el juego y jugar una run
para validar end-to-end.

## Cómo se ejecutó este refactor

Este refactor se ejecutó **fuera del flujo SDD formal** (sin phases
`propose/spec/design/tasks/apply/verify/archive`). Las decisiones se tomaron en
chat pregunta a pregunta, y cada commit fue revisado y aprobado por el usuario
antes del siguiente. La sub-delegación fue con el sub-agent `general` nativo
de OpenCode, no con los agentes específicos de SDD (`sdd-apply-balanceado`,
etc.).

Si en la próxima sesión querés retomar el resto del refactor (F4c, F5 utils,
F6 cleanup) con SDD proper, hay que abrir un nuevo change formal con
`sdd-propose-balanceado` y un SDD session preflight.
