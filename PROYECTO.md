# Torre Infinita — Resumen del Proyecto

## Estado actual
✅ Juego completo en un solo archivo `Torre_Infinita.html` — ~8.350 líneas  
✅ Versión: **0.8.0** — Cámara de las Runas + Tutorial Completo

## Decisiones de diseño

### Stack: Vanilla JS + HTML + CSS
- **Por qué**: El juego es 90% estado → render. No necesita routing, componentes anidados, ni gestión de formularios.
- **Patrón clave**: Estado central único + función `render()` que actualiza todo el DOM. Nunca tocar el DOM directamente fuera de render.
- **Excepciones**: `spawnFloat()`, `flashElement()`, y el sistema de debuffs (actualizan DOM directamente por rendimiento).

### Balance centralizado (objeto BALANCE)
- **Decisión**: Todos los números del juego viven en un solo objeto `BALANCE` al inicio del script.
- **Por qué**: Permite re-balancear cambiando un solo lugar sin buscar valores hardcodeados.
- **Estructura actual**:
  - `player` → stats base del héroe
  - `levelUp` → tiered stat gain cada 50 niveles
  - `metaUpgrades` → mejoras permanentes con almas (HP, ATK, DEF, AGI, almas/piso, crítico, bossDmg)
  - `enemy` → stats base, tier scaling, jefes dinámicos P20+
  - `equipment` → drop chances, rarezas, presupuesto logarítmico, maestrías
  - `combat` → fórmula de velocidad, DR, caps, debuffs
  - `souls` → fórmula de recompensa al morir
  - `essence` → esencias (reforja, maximize, reroll)
  - `enhance` → mejora de equipo (+10% por nivel, +1 a +10)
  - `heroArtifact` → árbol de artefacto del Prestigio (10 nodos)

### Equipamiento con budget logarítmico
- **Decisión**: El budget de stats por pieza usa `budgetBase × log2(floor + 1) × statMult(rareza)` en vez de lineal por piso.
- **Budget base**: 5.
- **Rarezas actuales**: Poco común (×1.0, 1 stat), Raro (×1.5, 2 stats + maestría Nv1), Épico (×2.0, 3 stats + maestría Nv2), Legendario (×3.0, 4 stats + maestría Nv3), Ancestral (×3.0, 4 stats + maestría Nv3 + enhance +15), Mítico (×4.0, 5 stats + maestría Nv4 fija + enhance +15).
- **Maestrías**: 3 por slot, cada una con 4 niveles (Nv4 exclusivo de Mítico).
- **Enhance**: +10% por nivel a TODAS las stats, máximo +10. Bonus stat en +5 y +10.
- **Reforja**: 3🩸 aleatorio, 8🩸 elegido. Reroll de bonus stat: 5🩸.

### Sistema de Esencias (🩸)
- Drop 50% en enemigos normales, 100% en jefes.
- Se usan para Reforjar maestrías, Maximizar equipo (enhance), y Rerolear bonus stat.
- Persisten entre runs.

### Sistema de Runas (🔮 — v0.8.0)
- Condiciones (8): Golpe Crítico, Bajo HP, Golpe Recibido, Enemigo con Debuff, Esquivar, Matar Enemigo, Usar Habilidad, Inicio de Combate.
- Efectos (8): Daño Extra, Escudo, Curación, Aceleración, Cadena de Rayo, Robo de Vida, Explosión de Sangre, Maldición.
- Se fabrican en la Forja con 🔮 Polvo de Runas (Cámara de las Runas) + 💀 Almas.
- Rarezas: S → SS → SSS. Mejora individual por componente.
- Se equipan en slots del personaje.

### Sistema de Prestigio (🪶 — v0.7.0)
- Renacer al piso 100: `🪶 = floor(sqrt(heroLevel) × max(maxFloor, 100) / 100)`.
- Árbol de Artefacto con 10 nodos: 4 de stats (+3%/nv) y 6 multiplicadores (+5%/nv).
- Abismo del Legado: dungeon de 10 pisos que da 🪶 adicionales.
- Esencias de Legado persisten entre renacimientos.

### Combate por velocidad (no turnos alternos)
- **Decisión**: Cada fighter tiene un timer que baja según su velocidad. Cuando llega a 0, ataca y se resetea.
- **Fórmula**: `attackInterval = max(750, 3000 - (agi × 100))`.
- **DR en stats**: crit (70/100), dodge (40/80), block (50/100), lifesteal (25/80), pen (50/100), critDmg (600/200), bossDmg (100/150).

### Escalado de enemigos (tier-based)
- **Decisión**: Enemigos escalan por tier (cada 10 pisos) + sub-escala dentro del tier.
- **Jefes**: Piso 10 con stats fijas. P20+ con escalado dinámico basado en stats del jugador.

### Cuatro monedas
- **💀 Almas**: moneda principal para mejoras permanentes.
- **🩸 Esencias**: moneda secundaria para mejora de equipo (reforja, enhance).
- **🔮 Polvo de Runas**: moneda del sistema de Runas (Cámara de las Runas).
- **🪶 Esencias de Legado**: moneda premium del sistema de Prestigio.

## Estado del juego actual

### Stats base del jugador
| Stat | Valor |
|------|-------|
| HP | 100 |
| ATK | 10 |
| DEF | 5 |
| AGI | 10 |

### Sistema de Clases (v0.5.0)
4 clases con stats por nivel de héroe, pasivas que escalan, y 3 especializaciones c/u (12 total):
- ⚔️ Guerrero (Fuerza) — tanque, daño por escudo, daño cada 5 golpes
- 🔮 Brujo (Sombras) — DoTs, alma, daño por debuff
- 🗡️ Pícaro (Agilidad) — crítico, combo, evasión
- 🧘 Monje (Equilibrio) — velocidad, curación, daño por velocidad

### Sistema de Talentos (37 talentos)
5 bloques: Ofensivo (10), Defensivo (10), Estado (7), Sustain (5), Heroico (5).  
3 niveles cada uno. Se eligen cada 5 pisos.

### Mazmorras (v0.6.0)
- **Torre de los Ancestros**: N1 = piso 100, +10 por nivel. Drops de Ancestral y Mítico. 3 intentos/día.
- **Abismo del Legado** (v0.7.0): 10 pisos, recompensa 🪶. 3 intentos/día.
- **Cámara de las Runas** (v0.8.0): oleadas de enemigos, recompensa 🔮 Polvo de Runas. 3 intentos/día.

### Persistencia
- **localStorage** key: `torre_infinita_save_v1`
- dataVersion v5 con migraciones automáticas.

### Enemigos
- 8 nombres rotativos para enemigos normales.
- 6 nombres rotativos para jefes.
- Jefe P10 con stats fijas: HP 150, ATK 15, DEF 5.
- Jefes P20+ con escalado dinámico basado en stats del jugador (primer intento).

## Pendientes / Ideas futuras
- [x] 🔒 Cámara de las Runas — tercer dungeon ✅
- [ ] Recompensas AFK / offline
- [ ] Segunda capa de Prestige (Transcender)
- [ ] Habilidades activas / Barra de Rage
- [ ] Mascotas / Compañeros
- [ ] Eventos temporales / Temporadas
- [ ] Torre del Caos (segundo modo)
- [ ] Reroll de stats (Psiónico)
- [ ] Daño flotante animado
- [ ] Logros que desbloquean buffs
- [ ] Eventos entre pisos (cofre, trampa, descanso)
- [ ] Animaciones de entrada/salida de pisos
- [ ] Sonidos básicos
- [ ] Spreadsheet/calculadora de balance

## Archivos generados
| Archivo | Propósito |
|---------|-----------|
| `Torre_Infinita.html` | Juego completo funcional |
| `Talentos.md` | Referencia de los 37 talentos |
| `Clases.md` | Referencia de clases y especializaciones |
| `Maestrias.md` | Referencia de maestrías de equipo |
| `Runas.md` | Documentación del sistema de Runas |
| `Prestigio.md` | Documentación del sistema de Prestigio |
| `PROMPT.md` | Prompt para replicar el MVP con otros modelos |
| `PROYECTO.md` | Este resumen |
| `README.md` | Documentación general |
| `CHANGELOG.md` | Historial de versiones |
| `AGENTS.md` | Contexto para IA |
