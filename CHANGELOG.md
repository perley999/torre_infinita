# Changelog

Todos los cambios notables en este proyecto.

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
