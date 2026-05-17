# Prompt para replicar Torre Infinita

Copiá todo el bloque de abajo como prompt para otro modelo.

---

```
Quiero crear un idle RPG incremental en un solo archivo HTML (sin build step, sin npm, sin frameworks). Todo va inline: HTML + CSS + JS vanilla.

## Concepto
Un héroe asciende por una torre infinita. Cada piso = 1 combate automático. Si muere → reinicia, pero conserva almas para mejoras permanentes.

## Mecánicas core

### Combate automático por velocidad
- Loop de combate con setInterval cada 100ms
- Cada fighter tiene un attackTimer que baja cada tick
- Cuando timer <= 0 → ataca y se resetea
- Fórmula: attackInterval = max(200, 2000 - (speed * 100))
  - Speed 5 → ataca cada 1500ms
  - Speed 10 → ataca cada 1000ms
  - Speed 15 → ataca cada 500ms
  - Speed 20+ → ataca cada 200ms (mínimo)
- Daño = max(1, Ataque - Defensa)

### Stats base del jugador
- HP: 100, ATK: 10, DEF: 5, SPD: 10

### Escalado de enemigos (exponencial)
Para pisos normales:
- HP = floor(10 * 1.15^(piso-1))
- ATK = floor(3 * 1.12^(piso-1))
- DEF = floor(1 * 1.10^(piso-1))
- SPD = floor(6 * (1 + piso * 0.02))

Para jefes (cada 10 pisos):
- HP = floor(50 * 1.20^(piso-1)) * 3
- ATK = floor(8 * 1.15^(piso-1))
- DEF = floor(3 * 1.12^(piso-1))
- SPD = floor(7 * (1 + piso * 0.02))

### Almas al morir
- almas = floor(piso * 2 + piso * nivel_mejora_almas * 1)

### Mejoras permanentes (5)
Cada una con level, baseCost, costScale, valuePerLevel:
- HP: +5% HP base, baseCost=10, scale=1.5
- ATK: +5% ATK base, baseCost=10, scale=1.5
- DEF: +5% DEF base, baseCost=15, scale=1.5
- SPD: +1% SPD base, baseCost=20, scale=1.6
- Almas: +1 alma/piso, baseCost=25, scale=1.7

Costo actual = floor(baseCost * costScale^level)

## Arquitectura JS
- Estado central: metaState (persistente) + runState (run actual)
- Una función render() que actualiza TODO el DOM desde el estado
- Nunca modificar DOM directamente fuera de render()
- Patrón: modificar estado → llamar render()

## UI
- Tema oscuro (#0a0a12 fondo)
- Header con piso y indicador de jefe
- Dos cards lado a lado: jugador (azul) y enemigo (rojo, dorado si es jefe)
- Barras de HP con transición y colores (verde/naranja/rojo)
- Stats visibles: ATK, DEF, SPD
- Log de combate con scroll (máx 50 entradas)
- Display de almas
- Grid de mejoras 2x2 con botones deshabilitados si no alcanza
- Botones: Iniciar Run / Reiniciar

## Tutorial
- Modal overlay que aparece la primera vez (localStorage flag)
- Botón "?" en header para reabrir
- Explica: combate, pisos, jefes, almas, mejoras, fórmula de daño

## Requisitos técnicos
- Un solo archivo index.html
- Sin dependencias externas
- localStorage para persistencia de almas y mejoras
- CSS inline en <style>
- JS inline en <script>
- Responsive, max-width 480px centrado
- Animación flash al recibir daño

Generá el archivo completo y funcional.
```
