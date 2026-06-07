# Runas — Torre Infinita

> Sistema de runas. Se fabrican en la Forja con 🔮 Polvo de Runas y 💀 Almas.  
> Se combinan (Condición + Efecto) y se equipan en un slot de equipo.  
> Se desbloquean al alcanzar el **piso 100**.

---

## ⚡ Condiciones

Se activan automáticamente cuando se cumple la condición en combate.  
Los valores varían según rareza: **S / SS / SSS**.

| Condición | Descripción | S | SS | SSS |
|-----------|------------|:-:|:--:|:---:|
| **Golpe Seco** | Golpes consecutivos mismo enemigo | 3 | 2 | 1 |
| **Al Límite** | HP del jugador bajo el umbral | 50% | 60% | 70% |
| **Reflejos** | Esquivás o bloqueás un ataque | 1 | 1 | 1 |
| **Cosecha** | Matás un enemigo (CD: ticks) | 20t | 15t | 10t |
| **Castigo** | Recibís golpe crítico (SSS: >15% HP) | 1 | 1 | 1 |
| **Ritmo** | Ticks de combate transcurridos | 6 | 5 | 4 |
| **Tormenta** | Debuffs aplicados al enemigo | 3 | 2 | 1 |
| **Presión** | Enemigo está bajo de HP | 30% | 40% | 50% |

---

## ✨ Efectos

Se aplican al activarse la condición correspondiente.  
Los valores varían según rareza: **S / SS / SSS**.

| Efecto | Descripción | S | SS | SSS |
|--------|------------|:-:|:--:|:---:|
| **Cortar** | Sangrado %HP/tick ×3s | 2% | 3% | 5% |
| **Avalancha** | Multiplicador ATK 3s | ×1.3 | ×1.5 | ×1.8 |
| **Muro** | Escudo %HP máx | 12% | 18% | 25% |
| **Pulso** | Curación %HP | 8% | 12% | 18% |
| **Marca** | Vulnerabilidad +% daño 3s | 15% | 20% | 30% |
| **Cuchilla** | Daño bonus %ATK | 12% | 18% | 25% |
| **Ventisca** | -% velocidad enemigo 2s | 20% | 30% | 40% |
| **Ósmosis** | Robás %HP del enemigo | 5% | 8% | 12% |
| **Coraza** | +%DEF 4s | 25% | 40% | 60% |
| **Ímpetu** | +% velocidad ataque 3s | 15% | 22% | 30% |

---

## Mecánicas

- **Fabricar**: 10🔮 + 100💀 por pieza (condición o efecto). Nunca se repite una que ya tengas.
- **Equipar**: Combinás una condición + un efecto del inventario en un slot de equipo con item.
- **Mejorar**: Subís el nivel de la runa equipada (+8% poder por nivel). Costo escala con `floor(1.5^enhance)`.
- **Subir Rareza**: Al alcanzar el máximo enhance, podés subir de S → SS → SSS (resetea a +0).
- **Rarezas y máximo enhance**: S+5, SS+10, SSS+0 (fijo).
