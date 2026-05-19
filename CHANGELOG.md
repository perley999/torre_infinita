# Changelog

Todos los cambios notables en este proyecto.

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

## [Unreleased]

### Cambiado
- Equipamiento: budget de stats ahora usa fórmula logarítmica `budgetBase × log2(floor + 1) × statMult` en vez de lineal por piso.
- Equipamiento: corregido bug donde `rarity.length` (longitud del string) se usaba como multiplicador, haciendo que "Poco común" y "Legendario" tuvieran el mismo budget.
- `budgetPerFloor: 1.0` → `budgetBase: 5` con curva logarítmica.

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
