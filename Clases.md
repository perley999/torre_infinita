# Clases — Torre Infinita

> 4 clases con 3 especializaciones cada una.  
> Las clases se desbloquean al **nivel 50 de héroe**.  
> Las especializaciones se desbloquean al **nivel 100**.  
> Las pasivas de clase y especialización escalan con el nivel de héroe.  
> Las stats de clase se suman por cada nivel por encima de 50.

---

## 🛡️ Guerrero `#f97316`

**Stats por nivel**: ❤️+20 HP · ⚔️+2 ATK · 🛡️+3 DEF · 🏃+1 AGI

### Pasiva de Clase: Ráfaga de Golpes
Cada 3 golpes consecutivos, el 4° hace daño ×N.  
`N = 2.0 + (nivel_héroe − 50) × 0.004`

| Nivel | Multiplicador |
|-------|:------------:|
| 50 | ×2.00 |
| 100 | ×2.20 |
| 500 | ×3.80 |

### Especializaciones

#### Armas
- **Pasiva**: Maestro de Armas — Al derrotar un enemigo, el próximo golpe hace ×N daño.
- `N = 3.0 + (nivel_héroe − 100) × 0.01`

| Nivel | Multiplicador |
|-------|:------------:|
| 100 | ×3.00 |
| 300 | ×5.00 |
| 500 | ×7.00 |

#### Furia
- **Pasiva**: Frenesí de Batalla — Cada golpe consecutivo: +X% ATK (máx 10 acumulaciones).
- `X = 2 + floor((nivel_héroe − 100) / 200)`

| Nivel | % ATK por golpe | Máx acumulado |
|-------|:---------------:|:-------------:|
| 100 | +2% | +20% |
| 300 | +3% | +30% |
| 500 | +4% | +40% |

#### Protección
- **Pasiva**: Muro de Escudo — +X% DEF, +Y% de DEF convertido a ATK.
- `X = 15 + floor((nivel_héroe − 100) / 20)`
- `Y = X − 5`

| Nivel | +% DEF | % DEF → ATK |
|-------|:------:|:-----------:|
| 100 | +15% | +10% |
| 200 | +20% | +15% |
| 500 | +35% | +30% |

---

## 👹 Brujo `#a855f7`

**Stats por nivel**: ❤️+5 HP · ⚔️+4 ATK · 🛡️+1 DEF · 🏃+1 AGI

### Pasiva de Clase: Pacto Oscuro
+X% robo de vida, +Y% daño a DoTs.  
`X = 8 + floor((nivel_héroe − 50) / 100) × 2`  
`Y = 10 + floor((nivel_héroe − 50) / 100) × 2`

| Nivel | Lifesteal | Daño DoTs |
|-------|:---------:|:----------:|
| 50 | +8% | +10% |
| 150 | +10% | +12% |
| 250 | +12% | +14% |
| 500 | +18% | +20% |

### Especializaciones

#### Aflicción
- **Pasiva**: Aflicción Eterna — Debuffs duran ×N tiempo, +Y% daño a DoTs.
- `N = 2.0 + (nivel_héroe − 100) × 0.005`
- `Y = 20 + floor((nivel_héroe − 100) / 100) × 10`

| Nivel | Duración | Daño DoTs |
|-------|:--------:|:---------:|
| 100 | ×2.00 | +20% |
| 300 | ×3.00 | +40% |
| 500 | ×4.00 | +60% |

#### Demonología
- **Pasiva**: Esencia Demoníaca — Al matar: X% de invocar un demonio que golpea Y veces.
- `X = 30 + floor((nivel_héroe − 100) / 100) × 5`
- `Y = 3 + floor((nivel_héroe − 100) / 100)`

| Nivel | % Invocar | Golpes |
|-------|:---------:|:------:|
| 100 | 30% | 3 |
| 200 | 35% | 4 |
| 500 | 50% | 7 |

#### Destrucción
- **Pasiva**: Caos Ardiente — +X% crit chance base, críticos hacen ×Y daño.
- `X = 10 + floor((nivel_héroe − 100) / 100) × 2`
- `Y = 3.5 + (nivel_héroe − 100) × 0.003`

| Nivel | Crit base | Multiplicador crítico |
|-------|:---------:|:--------------------:|
| 100 | +10% | ×3.50 |
| 300 | +14% | ×4.10 |
| 500 | +18% | ×4.70 |

---

## ☠️ Pícaro `#10b981`

**Stats por nivel**: ❤️+10 HP · ⚔️+2 ATK · 🛡️+1 DEF · 🏃+4 AGI

### Pasiva de Clase: Golpe Sigiloso
Primer ataque contra cada enemigo siempre es crítico y hace +X% daño.  
`X = 25 + floor((nivel_héroe − 50) / 100) × 10`

| Nivel | Daño bonus |
|-------|:----------:|
| 50 | +25% |
| 150 | +35% |
| 250 | +45% |
| 500 | +70% |

### Especializaciones

#### Asesinato
- **Pasiva**: Venenos Letales — X% de aplicar veneno: Y% HP cada 3 ticks.
- `X = 30 + floor((nivel_héroe − 100) / 100) × 5`
- `Y = 5 + floor((nivel_héroe − 100) / 100)`

| Nivel | % Aplicar | Daño/tick |
|-------|:---------:|:---------:|
| 100 | 30% | 5% HP |
| 300 | 40% | 7% HP |
| 500 | 50% | 9% HP |

#### Forajido
- **Pasiva**: Golpe de Oportunidad — X% de atacar dos veces.
- `X = 20 + floor((nivel_héroe − 100) / 100) × 5`

| Nivel | % Doble ataque |
|-------|:--------------:|
| 100 | 20% |
| 300 | 30% |
| 500 | 40% |

#### Sutileza
- **Pasiva**: Danza de Sombras — Al esquivar, el próximo golpe hace ×N daño.
- `N = 3.0 + (nivel_héroe − 100) × 0.005`

| Nivel | Multiplicador |
|-------|:------------:|
| 100 | ×3.00 |
| 300 | ×4.00 |
| 500 | ×5.00 |

---

## 🐉 Monje `#f59e0b`

**Stats por nivel**: ❤️+15 HP · ⚔️+2 ATK · 🛡️+2 DEF · 🏃+3 AGI

### Pasiva de Clase: Flujo de Chi
Velocidad de ataque +X% post-cap (mín 750ms), +Y% de evasión.  
`X = 15 + floor((nivel_héroe − 50) / 100) × 5`  
`Y = 5 + floor((nivel_héroe − 50) / 100)`

| Nivel | Velocidad | Evasión |
|-------|:---------:|:-------:|
| 50 | +15% | +5% |
| 150 | +20% | +6% |
| 250 | +25% | +7% |
| 500 | +40% | +10% |

### Especializaciones

#### Maestro Cervecero
- **Pasiva**: Cuerpo de Jade — X% de daño diferido 2s, +Y% reducción plana.
- `X = 15 + floor((nivel_héroe − 100) / 100) × 5`
- `Y = 5 + floor((nivel_héroe − 100) / 200) × 2`

| Nivel | Daño diferido | Reducción plana |
|-------|:-------------:|:---------------:|
| 100 | 15% | 5% |
| 300 | 25% | 7% |
| 500 | 35% | 9% |

#### Tejedor de Bruma
- **Pasiva**: Armonía Celestial — Cada 5 ataques: curás X% de tu HP máximo.
- `X = 8 + floor((nivel_héroe − 100) / 100) × 2`

| Nivel | Curación |
|-------|:--------:|
| 100 | 8% |
| 300 | 12% |
| 500 | 16% |

#### Vagabundo del Viento
- **Pasiva**: Tormenta de Patadas — Cada 3 golpes no esquivados, el 4° hace +X% daño.
- `X = 30 + floor((nivel_héroe − 100) / 100) × 20`

| Nivel | Daño bonus |
|-------|:----------:|
| 100 | +30% |
| 300 | +70% |
| 500 | +110% |
