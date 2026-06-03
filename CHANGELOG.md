# Changelog

Todos los cambios notables en este proyecto.

## [0.7.0] - 2026-06-03

### Añadido
- **Sistema de Renacer / Prestigio**: al alcanzar el piso 100, el jugador puede renacer para reiniciar su progreso a cambio de 🪶 Esencias de Legado.
- **Árbol de Artefacto (10 nodos)**: estadísticas ancestrales (⚔️🛡️❤️🏃 +3%/nv) y multiplicadores globales (💍 Herencia, 💥 Talento Innato, 📖 Sabiduría, 🍀 Fortuna, 🪶 Ciclo del Legado, 💀 Voluntad +5%/nv).
- **Abismo del Legado**: dungeon de 10 pisos que otorga 🪶 Esencias de Legado. 3 intentos/día. Desbloqueable al piso 100.
- **Prestigio.md**: documentación completa del sistema de Prestigio.
- **Codex actualizado**: nuevo bloque 🪶 Prestigio en el codex del juego con niveles actuales y costos dinámicos.
- **Slot 3 de mazmorra**: "Abismo del Legado" ahora visible y seleccionable en la pantalla de selección de mazmorras post-piso 100.

### Cambiado
- **Dungeon spec**: especificación actualizada para incluir Slot 3 (Abismo del Legado) en la pantalla de selección.
- **Migración de saves**: v4→v5 con nuevos campos `heroArtifact`, `hasRebirthed`, `dungeon.attemptsTodayLegacy`.

### Corregido
- `loadGame()` ahora restaura `metaState.heroArtifact` correctamente al cargar partida.
- Abismo del Legado: ajustada fórmula de esencias, removidos drops de equipo, hardcap de 3 intentos/día sin extras pagos.

## [0.6.0] - 2026-06-02

### Añadido
- **Sistema de Mazmorras**: Torre de los Ancestros — 3 intentos gratis/día, niveles escalables (N1=piso100, +10 por nivel), drops exclusivos de Ancestral y Mítico.
- **Rareza Ancestral** (×3.0): 4 stats maxeadas, maestría Nv3 aleatoria reforjeable, enhance +15.
- **Rareza Mítica** (×4.0): 5 stats, maestría Nv4 fija no reforjeable, enhance +15.
- **Maestrías Nv4**: cada maestría ahora tiene 4 niveles (Nv4 es exclusivo de Mítico).
- **Bonus Stat**: al llegar a enhance +5 y +10, el item obtiene un stat bonus (+25%) reroleable por 5🩸.
- **Rejugar niveles de mazmorra**: todos los niveles desbloqueados son seleccionables para farmear.
- **Colores de rareza**: Ancestral (#c2410c ámbar rojizo), Mítico (#818cf8 azul violáceo).
- **SDD completo**: 4 specs, design, 21 tasks, verify, archive documentados en `openspec/`.

### Cambiado
- **Enhance máximo**: de +10 a +15 (costo escala `floor(1.5^enhance)`).
- **Esencias**: drop 50% en normales, 100% en jefes de mazmorra.

## [0.5.1] - 2026-06-01

### Añadido
- **Barra de acciones compacta**: 5 botones en una sola fila (Iniciar, Reiniciar, Training, Forja, Personaje) con 3 estados visuales (sin run, run activa, training mode).
- **Modal de Forja unificado**: un solo botón abre modal con Reforjar y Maximizar.
- **Equipo horizontal en Personaje**: el bloque de equipo ahora usa el mismo layout horizontal que tenía en la pantalla principal.

### Cambiado
- **Pantalla Personaje**: mismo ancho que el menú principal (padding fuera del max-width).
- **Botón "Volver al juego" superior eliminado**: solo queda el botón inferior renombrado a "🔙 Volver".
- **Equipo removido del menú principal**: ahora solo se ve desde la pantalla Personaje.

### Corregido
- El bloque de equipo en Personaje mostraba mensaje de bloqueo en lugar de slots vacíos si no estaba desbloqueado.

## [0.5.0] - 2026-05-31

### Añadido
- **Sistema de Clases**: 4 clases (Guerrero, Brujo, Pícaro, Monje) con stats por nivel de héroe, pasivas escalables y colores/emojis dinámicos. Se desbloquean al nivel 50.
- **Sistema de Especializaciones**: 3 especializaciones por clase (12 total), cada una con pasiva única que escala con nivel de héroe. Se desbloquean al nivel 100.
- **Pantalla Personaje**: overlay dedicado con desglose de stats por fuente (Base + Héroe + Clase + Equipo + Mejoras), stats derivadas, pasivas activas, equipo clickeable.
- **Cambio de Clase**: modal con costo del 50% de almas, confirmación en dos pasos, resetea especialización.
- **Cambio de Especialización**: modal con costo del 10% de almas, disponible desde la pantalla Personaje.
- **Clases.md**: documentación completa de clases y especializaciones siguiendo el estilo de Talentos.md.
- **Clases en el Codex**: nuevo bloque 🏛️ Clases en el codex del juego con valores a Nv.50/100/500.

### Cambiado
- **Speed cap global**: `BALANCE.combat.speedMin` 750ms → 1000ms. Monje Flujo de Chi permite 750ms post-cap.
- **formatNum()**: ahora soporta M (millones) y B (billones) además de k.
- **Codex**: título cambiado a "📖 Codex" con intro genérica para incluir talentos, maestrías y clases.
- **dataVersion**: migración v3→v4 con nuevos campos `playerClass` y `playerSpec`.
- **Warrior color**: #ef4444 → #f97316 para diferenciar de enemigos rojos.

### Corregido
- `closeChoice()` ya no se usa en selección de clase/especialización (evita floor++ espurio y doble startCombat).
- Al cargar partida con nivel ≥ 100 y sin especialización, ahora pregunta por una.
- Al elegir clase con nivel ≥ 100 (partida guardada), ahora encadena la selección de especialización.
- `confirmClassChange()` ya no incrementaba el piso incorrectamente.

## [0.4.4] - 2026-05-25

### Añadido
- **Sangre Fría**: nuevo nombre para el talento antes llamado Maestría Crítica. Crítico garantizado cada 7/5/3 ataques. Ahora con línea propia en el death recap en vez de mezclarse con críticos normales.
- **Mejora permanente Daño vs Boss**: +10% por nivel, 10 niveles máx, costo base 40 (×2.0). Se aplica flat post-DR como la mejora de crítico.

### Cambiado
- **Multiataque**: chance plana 20% en todos los niveles, golpes escalan: 1→2, 2→3, 3→4. Ya no encadena.
- **Furia Creciente**: buff sustancial — +10/20/30% por golpe (antes +5/10/15%). Máximo +300% en nivel 3.
- **Drop base**: chance de drop de objetos en enemigos normales subió de 50% a 70%.
- **Mejora de Drop eliminada**: removida del juego. Reemplazada por la mejora de Daño vs Boss.

### Técnico
- **id del talento**: `maestria_critica` → `sangre_fria` para evitar conflictos con la maestría de arma "Maestría Crítica".
- **Recap**: nuevo campo `sangre_fria` para tracking separado de críticos garantizados por talento.
- **Saves**: las partidas viejas con la mejora `drop` la ignoran silenciosamente al cargar.

## [0.4.3] - 2026-05-25

### Añadido
- **Death recap completo**: pantalla post-mortem con 3 tabs (Daño/Mitigación/Curación), desglose por fuente, niveles de talento mostrados, ordenado por valor. Incluye seguimiento de evasión (golpes esquivados y daño evitado).
- **Contraataque rework**: ahora ejecuta un ataque completo del jugador con todas las sinergias de talentos (multiataque, penetración, crítico, golpe brutal, ejecución, furia creciente, debuffs, eco de combate, etc.) en vez de reflejar % del daño recibido.

### Cambiado
- **Primer Golpe**: buff sustancial — +50/80/120% de daño en primer golpe (antes ×1.25/1.40/1.60).
- **Cañón de Cristal**: el bonus de daño ahora aplica siempre (no solo bajo 30% HP). El umbral de daño recibido extra subió a 50% HP (antes 30%).
- **Reflejo Rápido renombrado a Golpe Rápido**: consistencia interna en naming.
- **Contraataque**: ahora escala con lifesteal, debuffs y pasivas del jugador.
- **Death recap**: talentos ahora muestran su nivel junto al nombre, filas ordenadas de mayor a menor valor.

### Técnico
- Variable `reflejoBonus` → `golpeBonus` en runState, `reflejo_rapido` → `golpe_rapido` en recap tracking.
- Nuevos campos en recap.mitigation: `dodge_hits`, `dodge_dmg` para tracking de evasión.

## [0.4.2] - 2026-05-24

### Añadido
- **T14 Golpe Cegador**: probabilidad de cegar al enemigo — falla su próximo ataque (8/12/16% por nivel). Badge 👁️ Cegado
- **T15 Golpe Helado**: probabilidad de congelar al boss 2s con CD 3s (10/15/20% por nivel). Badge ❄️ Congelado con barra de duración
- **T16 Toque Helado**: ralentiza la velocidad de ataque del enemigo al golpear (-10/15/20%, duración 5/6/8s). Badge 🧊 Ralentizado con barra de duración
- **Death recap** (idea guardada): pantalla post-mortem con desglose de daño/mitigación/curaciones

### Cambiado
- **Golpe Helado**: CD reducido de 15s a 3s
- **Desgaste**: ahora apila cada 2s en vez de 3s (tick 30 → 20)
- **Héroe nivel 0**: ahora arranca en nivel 0 con tiered stat gain cada 50 niveles
- **Maestría Regenerativa**: fusionada con hpRegen (flat post-DR, sin cap), cura cada 1s
- **Save migration**: sistema dataVersion para migrar saves antiguos (v0 → v1 recalcula heroBonuses)

### Corregido
- **SaveGame crash**: restaurado `upgrades: {}` faltante en el objeto data
- **Estado talent flags**: se limpian entre combates para evitar herencia de estados (blinded/frozen/slow)
- **Descripción Golpe Helado**: actualizada de "CD 15s" a "CD 3s" en codex y Talentos.md
- **Descripción Desgaste**: actualizada de "Cada 3s" a "Cada 2s"
- **Dead code**: eliminado `slowDuration` que no se usaba

## [0.4.0] - 2026-05-24

### Cambiado
- **Pesos de ilvl**: AGI baja de ×1.5 a ×1.0 (igual que ATK/DEF). PEN y Boss DMG bajan a ×0.3. HP baja de ×0.5 a ×0.4. Añadido Block con ×0.4.
- **budgetMult de HP**: sube de ×0.4 (flat) a ×1.5 para que los objetos den valores de HP significativos
- **tryEquip()**: umbral de ilvl subido de 80% a 90%. Nuevo filtro: rareza inferior + ilvl menor → descarte directo. Si ilvl >= actual → modal siempre

### Añadido
- **Quemadura (Furia Ardiente)**: nuevo debuff tipo `burn` que reduce ATK del enemigo -10/15/20% durante 3s

### Corregido
- **Dodge de equipo**: ahora usa rating + DR única como crítico (eliminada la doble DR con multiplicador)
- **Furia Ardiente**: daño fijo → %HP por segundo. Quemadura ahora dura 30 ticks (3s) en vez de 3 ticks (300ms)

## [0.3.1] - 2026-05-20

### Eliminado
- **Thorns (espinas)**: removido completamente del sistema de equipo (stat pools, budgetMult, caps, calcIlvl, combate, UI)
- **Soul Bonus del equipo**: removido de pools de anillo, budgetMult, calcIlvl, cálculo de almas al morir, UI. La mejora permanente de almas por piso (`metaUpgrades.souls`) se conserva intacta

### Cambiado
- **Anillo**: HP removido del pool de stats primarios (ahora solo ATK, DEF, AGI)
- **Maestría Regenerativa**: cambió de flat (+5/+10/+15 HP cada 2s) a porcentaje (+5%/+7.5%/+10% del HP máximo cada 2s)

## [0.3.0] - 2026-05-19

### Añadido
- **Sistema de DoTs en combate**: 5 talentos de daño over time implementados
  - **Hemorragia**: probabilidad de aplicar sangrado (3-5 daño/tick × 3 ticks)
  - **Furia Ardiente**: aura que quema al enemigo cada segundo (chance por nivel)
  - **Hoja Tóxica**: envenenar con DoT + reducción de DEF plana
  - **Marca de Muerte**: vulnerabilidad multiplicativa (+10-20% daño recibido)
  - **Desgaste**: cada 5s el enemigo pierde % de ATK y DEF (acumulativo, con tope)
- **Maestro Elemental**: sinergia heroica — +20-40% daño vs enemigos con DoT + ticks extra
- **UI de debuffs activos**: badges con colores y barra de progreso en la tarjeta del enemigo
- **UI de talentos activos**: badges en el HUD con colores por pool (ofensivo=rojo, defensivo=azul, estado=verde, sustain=verde claro, heroico=dorado con glow)
- **Piel de Piedra**: al recibir golpe ≥20% HP máx, escudo temporal que absorbe daño

### Cambiado
- **Nivel de héroe persistente**: nivel, XP y stats acumuladas ya no se pierden al morir (guardado en `metaState` / localStorage)
- **Talentos ligados a pisos**: se eligen cada 5 pisos (5, 10, 15, 20...) en vez de por nivel de héroe
- **Pools de talento**: ofensivo + defensivo + estado/sustain en cada milestone; heroico adicional cada 20 pisos (20, 40, 60...)
- **Estado y sustain fusionados** para selección de talentos

### Corregido
- **Bug crítico**: `startRun()` congelaba la pantalla por `t('escudo_vital')` sin `t` definido en scope de `startCombat()`

## [0.2.5] - 2026-05-19

### Cambiado
- **Crit chance rework**: el stat de crit del equipo ahora se convierte linealmente con ratio 13 (estilo WoW). +65 crit = 5%. Ya no es multiplicador sobre base diminuto.
- **Meta upgrade crit**: ahora da +2% por nivel (antes +1%) y se aplica **post-DR** (flat), igual que la maestría.
- **Crit base**: cambiado de 1% a 0%. Sin mejoras ni equipo, no hay crítico.
- **Talento Precise**: descripción genérica "Aumenta la prob. de golpe crítico" (sin revelar el +15 flat).

### Corregido
- **Talentos se resetean entre runs**: las habilidades de nivel 5/10/15/20 ahora viven en `runState.abilities` (RAM) en vez de `metaState.abilities` (localStorage). Se pierden al morir/reiniciar y se eligen de nuevo cada run.
- **Orden UI**: bloque de almas movido justo antes de Mejoras Permanentes.

## [0.2.2] - 2026-05-18

### Cambiado
- **Nivel automático**: al subir de nivel ya no hay pantalla de elección de stat. Se suman **+5 HP, +1 ATK, +1 DEF, +1 AGI** automáticamente.
- Las habilidades de nivel 5, 10, 15, 20 se mantienen como pantalla de elección.
- Nuevo bloque **"📊 Estadísticas acumuladas"** debajo del equipo que muestra las stats ganadas por nivel durante la run.

## [0.2.1] - 2026-05-18

### Cambiado
- **Meta upgrades rework**: el % de HP, ATK, DEF y AGI ahora es un **multiplicador global** que se aplica al final sobre todas las fuentes flat (base + run + equipo). Ya no aplica solo sobre la stat base.
- **Meta upgrades simplificadas**: eliminado el componente flat de HP, ATK, DEF y AGI. Ahora solo tienen %.
- Las mejoras de run (elecciones de nivel) y el equipo ahora escalan con el % de meta — más invertís en meta, más rinden.
- Impacto visual: los botones de mejora ya no muestran acumulado flat para stats (solo %).

## [0.2.0] - 2026-05-17

### Añadido
- Sistema de niveles de héroe (1-20) con XP por piso derrotado.
- Elección de mejoras flat en cada level up (+8 HP, +2 ATK, +2 DEF, +2 AGI).
- Habilidades especiales en niveles 5, 10, 15 y 20 (3 opciones por nivel).
- Sistema de equipamiento con 3 slots: Arma, Armadura, Anillo.
- Rarezas: Poco común (1 stat), Raro (2 stats), Épico (2 stats + pasiva), Legendario (3 stats + pasiva).
- Stats porcentuales en equipo: CRIT%, Dodge%, Lifesteal%.
- Pasivas de equipo: Veneno, Quemadura, Robo de Vida, Maestría Bloqueo.
- Objeto `BALANCE` centralizado para todos los valores del juego.
- Barra de HP del enemigo con colores según porcentaje (verde/naranja/rojo).
- Niveles y acumulados visibles en botones de mejoras permanentes.
- Iconos y colores por rareza en equipamiento.

### Cambiado
- Velocidad de ataque: héroe base ataca cada 2s (antes 1s), cap mínimo 0.75s.
- Mejoras permanentes: ahora flat mínimo + porcentual (ej: ATK +2 flat + 5%).
- Nombre "Común" renombrado a "Poco común".
- Equipamiento: stats por rareza y slot, sin repetición en anillos.
- Jefe piso 10 rebalanceado para requerir ~4 intentos con progresión natural.

### Técnico
- Refactor: objeto `BALANCE` centraliza player, levelUp, metaUpgrades, enemy, equipment, combat, souls.
- `calcPlayerStats()` ahora devuelve crit, dodge y lifesteal del equipo.
- Fórmulas de velocidad y daño leen desde `BALANCE.combat`.

## [0.1.0] - 2026-05-16

### Añadido
- MVP funcional en un solo archivo `index.html`.
- Combate automático por velocidad con setInterval.
- Escalado exponencial de enemigos (normales y jefes cada 10 pisos).
- Mejoras permanentes con almas: HP, ATK, DEF, SPD, Almas/piso.
- Modal tutorial con flag en localStorage.
- Log de combate con scroll y colores por tipo.
- Animación flash al recibir daño.
- Diseño responsive oscuro con tema #0a0a12.
