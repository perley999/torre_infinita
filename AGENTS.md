# Torre Infinita — AGENTS.md

> Contexto rápido para agentes que trabajan en este proyecto. Para
> arquitectura técnica, fórmulas, decisiones de diseño y referencia de
> subsistemas, ver [PROYECTO.md](PROYECTO.md) y los docs de cada
> subsistema.

## Proyecto

Juego idle/roguelike web (idle + tower). Single-player, persistente,
vanilla JS, sin backend. El usuario juega subiendo pisos, eligiendo
talentos cada 5 pisos, equipando items, y progresando entre runs.

## Stack

- **Lenguaje**: Vanilla JS, HTML, CSS. Sin TypeScript, sin frameworks.
- **Build**: ninguno. El archivo se abre directamente en el browser.
- **Tests**: ninguno. No hay runner, no hay infraestructura de testing.
- **Persistencia**: `localStorage` (key `torre_infinita_save_v1`,
  dataVersion 3, no migrar saves viejos).
- **Sin package manager**: no existe `package.json`. NO correr `npm` /
  `pnpm` / `yarn` — no hay nada que instalar.

## File layout

| Path | Rol |
|---------|-----|
| `Torre_Infinita.html` | Entry point. HTML + inline init code (loadGame, retro-check, render/updateButtons, showTutorial) + 20 `<script src>` que cargan los módulos. |
| `css/base.css` | Reset, variables CSS, tipografía. |
| `css/layout.css` | Grid principal, media queries. |
| `css/components.css` | Combat, modales, equipment, runes, debuffs, talents, upgrades, reforge, codex, training, leaderboard. |
| `js/core/` | 6 módulos sin dependencias entre ellos: `balance.js`, `state.js`, `constants.js`, `calc.js`, `equipment.js`, `utilities.js`. |
| `js/game/` | 7 módulos que dependen de `core/`: `combat.js`, `combat-tick.js`, `classes.js`, `talents.js`, `runes.js`, `dungeons.js`, `debuffs.js` (placeholder reservado). |
| `js/ui/` | 10 módulos con contenido (`render.js`, `dom.js`, `modals-flow.js`, `modals-equipment.js`, `codex.js`, `arena.js`, `character.js`, `talents.js`, `dungeons.js`, `runes.js`). Dependen de `game/`. |
| `js/controls.js` | startRun, buyUpgrade, endTraining, restartRun. Orquestador de controles de flujo. |
| `PROYECTO.md` | Arquitectura técnica, decisiones, fórmulas, referencia de subsistemas. **Doc principal de referencia.** |
| `REFACTOR-PLAN.md` | **Histórico** del refactor `separate-ui-logic`. NO es un plan a seguir. |
| `README.md` | Docs para jugadores humanos. |
| `CHANGELOG.md` | Historial de versiones. |
| `Talentos.md` | Referencia de los 37 talentos. |
| `Clases.md` | Referencia de las 4 clases y 12 especializaciones. |
| `Maestrias.md` | Referencia de las maestrías de equipo. |
| `Runas.md` | Sistema de Runas (Cámara Rúnica). |
| `Prestigio.md` | Sistema de Prestigio (Renacer + Árbol de Legado). |
| `PROMPT.md` | Prompt para regenerar el MVP con otros modelos. |
| `openspec/specs/*` | Specs SDD archivados de features implementadas. |

> `BETA-GUIA.md` y `ANALIZADOR-PROGRESION.html` están en `.gitignore` — no commitear.

## Dev workflow

1. **Probar el juego**: abrir `Torre_Infinita.html` directo en el
   browser (o servirlo con cualquier static server local, ej
   `python -m http.server`).
2. **Hacer un cambio**: identificar el módulo correcto (ver
   **Subsystems map** abajo), editar el archivo, refresh, probar. La
   mayoría de cambios visuales tocan `js/ui/render.js` o
   `js/ui/dom.js`. Cambios de balance tocan `js/core/balance.js`.
3. **Validar**: no hay tests automáticos. La validación es manual —
   jugar un par de runs, verificar que las mecánicas afectadas
   funcionan.
4. **Commit**: conventional commits, sin `Co-Authored-By`, sin emojis
   en el mensaje, sin `--force` salvo acuerdo explícito.

## Code conventions

### Naming

- `metaState` → progreso persistente (almas, equipo, mejoras, esencias,
  legado, leaderboard).
- `runState` → estado de la run actual (piso, HP, enemigo, talentos,
  debuffs).
- `BALANCE` → objeto global con todos los números del juego. **Para
  tocar balance, siempre editar `BALANCE`, nunca hardcodear valores.**
- `p` → `runState.player` (abreviado en `combatTick`).
- `e` → `runState.enemy`.
- `u` → `metaState.upgrades[key]`.
- `tl` → `runState.talentLevels`.
- `t(id)` → `tl[id] || 0` (helper para nivel de talento).
- `saveGame()` / `loadGame()` → persistencia. Toda mutación de
  `metaState` que deba sobrevivir entre sesiones va seguida de
  `saveGame()`.

### Patrón de actualización del DOM

**Regla de oro**: estado central → `render()` → DOM actualizado.

- NUNCA tocar el DOM directamente fuera de `render()`.
- Excepciones permitidas (performance): `spawnFloat()`,
  `flashElement()`, sistema de debuffs en combate. Todo lo demás pasa
  por `render()`.
- Si necesitás actualizar un valor en pantalla, mutar el state y dejar
  que `render()` lo muestre — no leer/escribir `.textContent` directo.
- `render()` vive en `js/ui/render.js`. `updateButtons()` vive en
  `js/ui/dom.js`.

### Estructura modular

El JS está dividido en módulos. Cada uno sigue este patrón:

```js
(function() {
  'use strict';
  // ...funciones y estado privado...
  Game.modulo = { fn1, fn2 };
  window.fn1 = fn1; // window bridge para onclick inline
})();
```

**Conventions de módulos**:
- Cada archivo expone su API pública como `Game.{module}`.
- Para funciones que el HTML body llama via `onclick="X()"`,
  también se exporta como `window.X = X;` al final del IIFE
  (window bridge pattern). Esto sacrifica encapsulación estricta
  a cambio de no reescribir 88 handlers del HTML body.
- Si una variable necesita ser leída por otros scripts (como
  `combatLoop` o `isFirstAttack`), se declara con `var` a nivel
  top-level del archivo, **fuera del IIFE**. `let` dentro de un IIFE
  strict NO se filtra al script-global lexical env.
- Cross-module calls funcionan via global lookup: una función
  expuesta a `window.X` puede ser llamada como `X()` desde otros
  archivos sin prefijo.
- `Game` es el namespace global; NO redeclarar `window.Game` (ya
  existe desde `js/game/classes.js:5`).

**Orden de carga** (en `Torre_Infinita.html`):

```html
<!-- 1. Core (sin dependencias internas) -->
<script src="js/core/balance.js"></script>
<script src="js/core/state.js"></script>
<script src="js/core/constants.js"></script>
<script src="js/core/calc.js"></script>
<script src="js/core/equipment.js"></script>
<script src="js/core/utilities.js"></script>

<!-- 2. Game (dependen de core) -->
<script src="js/game/debuffs.js"></script>
<script src="js/game/classes.js"></script>
<script src="js/game/talents.js"></script>
<script src="js/game/runes.js"></script>
<script src="js/game/dungeons.js"></script>
<script src="js/game/combat.js"></script>
<script src="js/game/combat-tick.js"></script>

<!-- 3. UI (dependen de game) -->
<script src="js/ui/modals-flow.js"></script>
<script src="js/ui/modals-equipment.js"></script>
<script src="js/ui/character.js"></script>
<script src="js/ui/talents.js"></script>
<script src="js/ui/dungeons.js"></script>
<script src="js/ui/runes.js"></script>
<script src="js/ui/codex.js"></script>
<script src="js/ui/arena.js"></script>
<script src="js/ui/dom.js"></script>
<script src="js/ui/render.js"></script>

<!-- 4. Controls (orquestador, cargado último) -->
<script src="js/controls.js"></script>
```

NO cambiar este orden sin entender el grafo de dependencias — si
`combat.js` carga antes que `debuffs.js`, las llamadas internas
rompen con `TypeError`. El grafo es estrictamente acíclico:
`core → game → ui → controls`.

## Subsystems map

Cada subsistema apunta al archivo principal. Los detalles profundos
están en PROYECTO.md o en el doc del subsistema.

- **Combate** → `js/game/combat.js` (startCombat, enemyDefeated,
  playerDied, calcTieredBonuses) + `js/game/combat-tick.js` (loop
  principal, ~1000 líneas). Timers por velocidad, no turnos alternos.
  Ver PROYECTO.md.
- **Talentos** → `js/game/talents.js` (checkLevelUp, selectTalent) +
  modales en `js/ui/talents.js` (showTalentChoice, renderChoices,
  closeChoice). 37 talentos, 5 bloques, 3 niveles. Ver `Talentos.md`.
- **Equipo (generación + comparación)** → `js/core/equipment.js`
  (generateItem, selectDungeonDrop, tryEquip) + modales de forja/
  reforge/ maximize en `js/ui/modals-equipment.js`. Slots, rarezas,
  maestrías, enhance, bonus stat. Ver `Maestrias.md` y PROYECTO.md.
- **Runas** → `js/game/runes.js` (RUNE_CONDITIONS, RUNE_EFFECTS,
  equipRune, fabricateRune, enhance, upgrade — 791 líneas) + modales
  en `js/ui/runes.js` (showRuneModal, closeRuneModal, renderRuneModal,
  showFabricateConfirm, doFabricate, showRuneEquipPicker,
  renderRuneEquipPicker, confirmManualEquip, cancelRuneEquip).
  Rarity S/SS/SSS. Ver `Runas.md`.
- **Clases y especializaciones** → `js/game/classes.js`
  (CLASS_CONFIG, SPECIALIZATIONS, getClass*, getSpec*,
  getClassPassiveValue, getSpecPassiveValue, calcularClassBonuses,
  61 líneas) + modales en `js/ui/character.js` (showClassSelection,
  showSpecSelection, showSpecChangeConfirm, confirmSpecChange,
  showClassChangeConfirm, confirmClassChange, cancelClassChange,
  showCharacterScreen, closeCharacterScreen, renderCharacterScreen,
  renderRuneCharacterSection, doUnequipRune). 4 clases × 3 specs.
  Ver `Clases.md`.
- **Mazmorras** → `js/game/dungeons.js` (startTowerRun,
  startRuneChamberRun, startLegacyAbyssRun, startDungeonRun, calc*,
  check*Reset — 403 líneas) + modales en `js/ui/dungeons.js`
  (showDungeonSelection, closeDungeonSelection, showDungeonComplete,
  closeDungeonComplete). 3 dungeons: Torre Ancestral, Cámara Rúnica,
  Abismo Eterno. Ver PROYECTO.md.
- **Debuffs** → funciones de debuff viven en `js/core/calc.js`
  (mezcladas con cálculos puros). `js/game/debuffs.js` está como
  placeholder vacío. Ver PROYECTO.md.
- **Prestigio** → Renacer al piso 100 + Árbol de Legado. Modales
  (showRebirthModal, performRebirth, showArtifactTree,
  buyArtifactNode) en `js/ui/modals-flow.js`. Ver `Prestigio.md`.
- **Leaderboard** → top 10 local, persistido en `localStorage`. Modal
  (showLeaderboard) en `js/ui/modals-flow.js`. Solo aplica a modo
  Torre.
- **Codex** → `js/ui/codex.js` (5 funciones: showCodex, buildCodexHTML,
  toggleCodexBlock, toggleCodexTalentCat, closeCodex). Guía in-game
  de talentos y clases.
- **Arena** → `js/ui/arena.js` (8 funciones + constante `ARENA_EMOJIS`).
  Visuales del combate (toggleArena, updateArena, arenaLunge,
  arenaHurt, arenaEnemyDefeated, arenaPlayerDied, arenaIdle,
  getArenaEmoji).
- **Tutorial** → `js/ui/modals-flow.js` (showTutorial, closeTutorial,
  toggleAdvancedStats). Aparece solo en el primer arranque.
- **Render y UI helpers** → `js/ui/render.js` (función `render()`,
  324 líneas) + `js/ui/dom.js` (`updateButtons`).
- **Controles de flujo** → `js/controls.js` (startRun, buyUpgrade,
  endTraining, restartRun). `combatLoop` vive en
  `js/game/combat-tick.js` como `var` top-level.
- **Persistencia y estado** → `js/core/state.js` (metaState, runState,
  saveGame, loadGame, resetGame, initRecap, checkTrainingUnlock,
  spendEssence, flashSaveIndicator).
- **Constantes y pools** → `js/core/constants.js` (ENEMY_NAMES,
  BOSS_NAMES, POOL_ICONS, TALENT_POOL, CLASS_CONFIG, CLASS_PASSIVES,
  SPECIALIZATIONS, SPEC_PASSIVES, MASTERIES, SAVE_KEY, getAllTalents,
  findTalent).
- **Cálculos puros** → `js/core/calc.js` (calcDamage, calcPlayerStats,
  calcEnemyStats, calcIlvl, diminishingReturns, speedToInterval,
  getUpgradeCost, calcTieredBonuses, funciones de debuff).
- **Utilidades y DOM effects** → `js/core/utilities.js` (formatNum,
  formatRunTime, addLog, flashElement, flashSaveIndicator,
  spawnFloat, triggerAttackEffect).

## Things to AVOID

- **NO agregar build step ni package manager.** El proyecto es
  intencionalmente zero-dep. Cualquier `npm install` está mal.
- **NO introducir frameworks** (React, Vue, etc.). Vanilla JS por
  decisión de diseño.
- **NO tocar el DOM fuera de `render()`** salvo las excepciones
  documentadas.
- **NO hardcodear números del juego.** Todo va en `BALANCE`.
- **NO usar neón / glow / text-shadow con colores brillantes / backdrop
  blur en el CSS.** El tema es oscuro y sutil — preferencia explícita
  del usuario, mantenida entre sesiones.
- **NO agregar emojis en mensajes de commit, código, o docs** salvo
  que el usuario lo pida explícitamente. Los emojis visibles en el
  juego (💀, 🩸, 🔮, 🪶) son contenido del juego, no del repo.
- **NO usar `Co-Authored-By: ...` en commits.** Regla del workspace,
  no del proyecto.
- **NO crear nuevas variables globales a top-level** fuera de un
  módulo. Si una variable necesita ser leída por otros scripts
  (como `combatLoop`), declarala como `var X` dentro del archivo del
  módulo que la posee y exponela con `window.X = X;`. NO usar `let`
  para esto — se queda en el lexical env del IIFE.
- **NO reordenar los `<script src>`** sin entender el grafo de
  dependencias. Ver **Estructura modular** arriba. Si invertís el
  orden de `core/`, `game/`, `ui/`, `controls`, las llamadas internas
  rompen con `TypeError`.
- **NO redefinir el namespace `Game`.** Ya está definido en
  `js/game/classes.js:5`. Los módulos nuevos lo usan directamente
  (`Game.X = { ... }`) sin redeclarar `window.Game = window.Game || {}`.
- **Ante cualquier duda sobre lo que pide el usuario, PREGUNTAR antes
  de decidir por cuenta propia.** Es preferible una pregunta de más a
  implementar algo que no era lo que se quería.

## PR / commit conventions

- Conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`,
  `chore:`).
- Mensaje en presente, sin punto final, < 72 chars en el subject.
- Body opcional con contexto y referencia a spec si aplica.
- Un commit = un cambio lógico. No amontonar.
- Antes de pushear: revisar `git diff` completo, no solo el último
  commit. Si el cambio toca balance, validar con el simulador
  (`analizador-progresion.html`, gitignored).

## Pointer a docs profundos

- Arquitectura, fórmulas, decisiones → [PROYECTO.md](PROYECTO.md)
- Para jugar → [README.md](README.md)
- Para regenerar el MVP → [PROMPT.md](PROMPT.md)
- Para spec formal de features → `openspec/specs/*`
- Para historial → [CHANGELOG.md](CHANGELOG.md)
- Histórico del refactor `separate-ui-logic` (qué se hizo, qué
  desviaciones hubo, qué deuda queda) → [REFACTOR-PLAN.md](REFACTOR-PLAN.md)
