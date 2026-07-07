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
- **Persistencia**: `localStorage`.
- **Sin package manager**: no existe `package.json`. NO correr `npm` /
  `pnpm` / `yarn` — no hay nada que instalar.

## File layout

| Archivo | Rol |
|---------|-----|
| `Torre_Infinita.html` | El juego completo (HTML + CSS + JS inline). |
| `PROYECTO.md` | Arquitectura técnica, decisiones, fórmulas, referencia de subsistemas. **Doc principal de referencia.** |
| `README.md` | Docs para jugadores humanos. |
| `CHANGELOG.md` | Historial de versiones. |
| `Talentos.md` | Referencia de los 37 talentos. |
| `Clases.md` | Referencia de las 4 clases y 12 especializaciones. |
| `Maestrias.md` | Referencia de las maestrías de equipo. |
| `Runas.md` | Sistema de Runas (Cámara Rúnica). |
| `Prestigio.md` | Sistema de Prestigio (Renacer + Árbol de Legado). |
| `PROMPT.md` | Prompt para regenerar el MVP con otros modelos. |
| `openspec/specs/*` | Specs SDD archivados de features implementadas. |

> `BETA-GUIA.md` y `ANALIZADOR-PROGRESION.md` están en `.gitignore` — no commitear.

## Dev workflow

1. **Probar el juego**: abrir `Torre_Infinita.html` directo en el
   browser (o servirlo con cualquier static server local, ej
   `python -m http.server`).
2. **Hacer un cambio**: editar el archivo, refresh, probar.
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

### Estructura del script

El JS dentro de `Torre_Infinita.html` sigue este orden (ver
[PROYECTO.md](PROYECTO.md) para el detalle de cada sección):

1. `BALANCE` — objeto central de números.
2. Estado (`metaState` + `runState` + persistencia).
3. Constantes y pools (nombres, talentos, clases, runas).
4. Cálculos puros (daño, speed, stats, ilvl).
5. Generación de equipo.
6. Combate (incluye debuffs).
7. Talentos.
8. Modales (comparación equipo, reforzar, maximizar).
9. Controles (start run, restart, buy upgrade).
10. `render()` + UI.
11. Leaderboard.
12. Reforja y Maximizar.

## Subsystems map (con docs de referencia)

- **Combate** → timers por velocidad, no turnos alternos. Ver
  PROYECTO.md.
- **Talentos** → 37 talentos, 5 bloques, 3 niveles. Ver `Talentos.md`.
- **Equipo** → slots, rarezas, maestrías, enhance, bonus stat. Ver
  `Maestrias.md` y PROYECTO.md.
- **Runas** → conditions + effects, rarezas S/SS/SSS. Ver `Runas.md`.
- **Clases y especializaciones** → 4 clases × 3 specs. Ver `Clases.md`.
- **Mazmorras** → 3 dungeons, cada una con su pool de intentos. Ver
  PROYECTO.md.
- **Prestigio** → Renacer al piso 100 + Árbol de Legado. Ver
  `Prestigio.md`.
- **Leaderboard** → top 10 local, persistido en `localStorage`. Solo
  aplica a modo Torre.

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
