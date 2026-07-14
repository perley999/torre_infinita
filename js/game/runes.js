// runes.js — rune system: conditions, effects, fabrication, enhancement, equip, and modal UI.
// Consolidated from Torre_Infinita.html (F3 game logic).
(function() {
  'use strict';
  window.Game = window.Game || {};

// ─── RUNAS: condiciones y efectos ─────────────────
        // Cada runa tiene una condición (trigger) y un efecto (acción).
        // values: [S, SS, SSS] — valor base según rareza, luego escalado por enhance (× (1 + enhance * 0.08))

        const RUNE_CONDITIONS = [
            { id: 'golpe_seco', label: 'Golpe Seco', desc: 'Golpes consecutivos mismo enemigo',
              values: [3, 2, 1], solve: 'checkGolpeSeco' },
            { id: 'al_limite', label: 'Al Límite', desc: 'HP del jugador bajo el umbral',
              values: [50, 60, 70], solve: 'checkAlLimite' },
            { id: 'reflejos', label: 'Reflejos', desc: 'Esquivás o bloqueás un ataque',
              values: [1, 1, 1], solve: 'checkReflejos' },
            { id: 'cosecha', label: 'Cosecha', desc: 'Matás un enemigo (CD: ticks)',
              values: [20, 15, 10], solve: 'checkCosecha' },
            { id: 'castigo', label: 'Castigo', desc: 'Recibís golpe crítico (SSS: también >15% HP)',
              values: [1, 1, 1], solve: 'checkCastigo' },
            { id: 'ritmo', label: 'Ritmo', desc: 'Ticks de combate transcurridos',
              values: [6, 5, 4], solve: 'checkRitmo' },
            { id: 'tormenta', label: 'Tormenta', desc: 'Debuffs aplicados al enemigo',
              values: [3, 2, 1], solve: 'checkTormenta' },
            { id: 'presion', label: 'Presión', desc: 'Enemigo está bajo de HP',
              values: [30, 40, 50], solve: 'checkPresion' },
        ];

        const RUNE_EFFECTS = [
            { id: 'cortar', label: 'Cortar', desc: 'Sangrado %HP/tick ×3s',
              values: [2, 3, 5], solve: 'applyCortar' },
            { id: 'avalancha', label: 'Avalancha', desc: 'Multiplicador ATK 3s',
              values: [1.3, 1.5, 1.8], solve: 'applyAvalancha' },
            { id: 'muro', label: 'Muro', desc: 'Escudo %HP máx',
              values: [12, 18, 25], solve: 'applyMuro' },
            { id: 'pulso', label: 'Pulso', desc: 'Curación %HP',
              values: [8, 12, 18], solve: 'applyPulso' },
            { id: 'marca', label: 'Marca', desc: 'Vulnerabilidad +% daño 3s',
              values: [15, 20, 30], solve: 'applyMarca' },
            { id: 'cuchilla', label: 'Cuchilla', desc: 'Daño bonus %ATK',
              values: [12, 18, 25], solve: 'applyCuchilla' },
            { id: 'ventisca', label: 'Ventisca', desc: '-% velocidad enemigo 2s',
              values: [20, 30, 40], solve: 'applyVentisca' },
            { id: 'osmosis', label: 'Ósmosis', desc: 'Robás %HP del enemigo',
              values: [5, 8, 12], solve: 'applyOsmosis' },
            { id: 'coraza', label: 'Coraza', desc: '+%DEF 4s',
              values: [25, 40, 60], solve: 'applyCoraza' },
            { id: 'impetu', label: 'Ímpetu', desc: '+% velocidad ataque 3s',
              values: [15, 22, 30], solve: 'applyImpetu' },
        ];

        // Helper: encontrar una condición por ID
        function findRuneCondition(id) {
            return RUNE_CONDITIONS.find(c => c.id === id) || null;
        }

        // Helper: encontrar un efecto por ID
        function findRuneEffect(id) {
            return RUNE_EFFECTS.find(e => e.id === id) || null;
        }


        // ════════════════════════════════════════════════
        // SISTEMA DE RUNAS — Condiciones, Efectos y Helpers
        // ════════════════════════════════════════════════

        // ─── Helpers de valor ───────────────────────────────────

        function getRuneEffectValue(effectId, rarity, enhance) {
            const effect = findRuneEffect(effectId);
            if (!effect) return 0;
            const rarityIdx = { S: 0, SS: 1, SSS: 2 }[rarity] || 0;
            const base = effect.values[rarityIdx] || 0;
            return base * (1 + (enhance || 0) * BALANCE.runas.enhanceMultPerLevel);
        }

        function getRuneConditionValue(conditionId, rarity) {
            const cond = findRuneCondition(conditionId);
            if (!cond) return 0;
            const rarityIdx = { S: 0, SS: 1, SSS: 2 }[rarity] || 0;
            return cond.values[rarityIdx] || 0;
        }

        function getRuneMaxEnhance(rarity) {
            const cfg = BALANCE.runas.rarityConfig[rarity];
            return cfg ? cfg.maxEnhance : 5;
        }

        // ─── Condition trigger checks ───────────────────────────
        // Cada condición recibe (player, enemy, tickCount, threshold) y retorna booleano.
        // threshold = valor de la condición según rareza S/SS/SSS

        function checkGolpeSeco(p, e, tickCount, threshold) {
            // threshold: golpes consecutivos mismo enemigo (3/2/1)
            // Usa runState.runeComboHits, se resetea si cambia enemigo o pasan 3s sin golpe
            const hits = runState.runeComboHits || 0;
            return hits > 0 && hits >= threshold;
        }

        function checkAlLimite(p, e, tickCount, threshold) {
            // threshold: % HP del jugador (50/60/70)
            if (!p || !p.maxHp) return false;
            return (p.hp / p.maxHp) <= (threshold / 100);
        }

        function checkReflejos(p, e, tickCount, threshold) {
            // Se activa cuando el jugador acaba de esquivar o bloquear
            // runState.runeJustDodged se setea en combatTick al esquivar/bloquear
            if (runState.runeJustDodged) {
                runState.runeJustDodged = false;
                return true;
            }
            return false;
        }

        function checkCosecha(p, e, tickCount, threshold) {
            // threshold: CD en ticks (20/15/10)
            // Se llama desde enemyDefeated con el cooldown apropiado
            return true;
        }

        function checkCastigo(p, e, tickCount, threshold) {
            // Se activa cuando recibís un golpe crítico
            // SSS: también cuando el golpe supera 15% del HP máximo
            if (runState.runeJustCritHit) {
                runState.runeJustCritHit = false;
                return true;
            }
            return false;
        }

        function checkRitmo(p, e, tickCount, threshold) {
            // threshold: ticks transcurridos (6/5/4)
            if (tickCount <= 0) return false;
            const lastProc = runState.runeLastTickProc || 0;
            if (tickCount - lastProc >= threshold) {
                runState.runeLastTickProc = tickCount;
                return true;
            }
            return false;
        }

        function checkTormenta(p, e, tickCount, threshold) {
            // threshold: debuffs aplicados (3/2/1)
            const applied = runState.runeDebuffsSinceProc || 0;
            if (applied >= threshold) {
                runState.runeDebuffsSinceProc = 0;
                return true;
            }
            return false;
        }

        function checkPresion(p, e, tickCount, threshold) {
            // threshold: % HP del enemigo (30/40/50)
            if (!e || !e.maxHp) return false;
            return (e.hp / e.maxHp) <= (threshold / 100);
        }

        // ─── Effect application functions ───────────────────────
        // Cada efecto recibe (player, enemy, effectValue, runState, tickCount)
        // effectValue = getRuneEffectValue(id, rarity, enhance)

        function applyCortar(p, e, effectValue, rarity, enhance, tickCount) {
            if (!e) return;
            // effectValue: % maxHP per tick for 3s (S=2%, SS=3%, SSS=5% base × enhance)
            applyDebuff({
                id: 'rune_cortar',
                type: 'dot',
                dmgPctPerTick: effectValue,
                ticks: 3,
                maxStack: 1,
                duration: 30,
                ticksLeft: 3,
            });
            addLog(`🩸 Cortar: sangrado ${effectValue.toFixed(1)}%/tick ×3s`, 'rune');
        }

        function applyAvalancha(p, e, effectValue, rarity, enhance, tickCount) {
            // effectValue: ATK multiplier 3s (×1.3/×1.5/×1.8 base × enhance)
            runState.runeBuffs = runState.runeBuffs.filter(b => b.effectId !== 'avalancha');
            runState.runeBuffs.push({
                effectId: 'avalancha',
                expireTick: tickCount + 30, // 3 seconds
                value: effectValue,
                type: 'atkMult',
            });
            addLog(`🗻 Avalancha: ATK ×${effectValue.toFixed(2)} por 3s`, 'rune');
        }

        function applyMuro(p, e, effectValue, rarity, enhance, tickCount) {
            // effectValue: % de HP máximo como escudo (12/18/25% base × enhance)
            const shieldAmount = Math.floor(p.maxHp * effectValue / 100);
            runState.vitalShield += shieldAmount;
            runState.shieldMax = (runState.shieldMax || 0) + shieldAmount;
            addLog(`🧱 Muro: +${formatNum(shieldAmount)} escudo (${effectValue.toFixed(1)}% HP)`, 'rune');
        }

        function applyPulso(p, e, effectValue, rarity, enhance, tickCount) {
            // effectValue: % de HP curado (8/12/18% base × enhance)
            const heal = Math.floor(p.maxHp * effectValue / 100);
            p.hp = Math.min(p.maxHp, p.hp + heal);
            addLog(`💚 Pulso: +${formatNum(heal)} vida (${effectValue.toFixed(1)}%)`, 'rune');
        }

        function applyMarca(p, e, effectValue, rarity, enhance, tickCount) {
            if (!e) return;
            // effectValue: % daño extra recibido 3s (+15%/+20%/+30% base × enhance)
            applyDebuff({
                id: 'rune_marca',
                type: 'vulnerability',
                vulnPct: effectValue,
                duration: 30,
                ticksLeft: 30,
            });
            addLog(`🏷️ Marca: enemigo +${effectValue.toFixed(1)}% daño 3s`, 'rune');
        }

        function applyCuchilla(p, e, effectValue, rarity, enhance, tickCount) {
            if (!e) return;
            // effectValue: % de ATK como daño bonus (12/18/25% base × enhance)
            const dmg = Math.max(1, Math.floor(p.atk * effectValue / 100));
            e.hp = Math.max(0, e.hp - dmg);
            addLog(`🗡️ Cuchilla: +${formatNum(dmg)} daño extra (${effectValue.toFixed(1)}% ATK)`, 'rune');
        }

        function applyVentisca(p, e, effectValue, rarity, enhance, tickCount) {
            if (!e) return;
            // effectValue: -% velocidad enemigo 2s (-20%/-30%/-40% base × enhance)
            const slowPct = Math.min(80, effectValue);
            if (!e._runeSlow) e._runeSlow = 0;
            e._runeSlow = Math.max(e._runeSlow, slowPct);
            // Store expiry tick to clear slow after 2s (20 ticks)
            e._runeSlowExpire = tickCount + 20;
            addLog(`❄️ Ventisca: enemigo ralentizado ${Math.floor(slowPct)}% por 2s`, 'rune');
        }

        function applyOsmosis(p, e, effectValue, rarity, enhance, tickCount) {
            if (!e) return;
            // effectValue: % del HP actual del enemigo robado (5/8/12% base × enhance)
            const steal = Math.floor(e.hp * effectValue / 100);
            if (steal > 0) {
                e.hp = Math.max(0, e.hp - steal);
                p.hp = Math.min(p.maxHp, p.hp + steal);
                addLog(`💧 Ósmosis: robás ${formatNum(steal)} HP (${effectValue.toFixed(1)}%)`, 'rune');
            }
        }

        function applyCoraza(p, e, effectValue, rarity, enhance, tickCount) {
            // effectValue: +%DEF buff 4s (+25%/+40%/+60% base × enhance)
            runState.runeBuffs = runState.runeBuffs.filter(b => b.effectId !== 'coraza');
            runState.runeBuffs.push({
                effectId: 'coraza',
                expireTick: tickCount + 40, // 4 seconds
                value: effectValue / 100,   // 0.25 / 0.40 / 0.60
                type: 'defMult',
            });
            addLog(`🛡️ Coraza: DEF +${Math.floor(effectValue)}% por 4s`, 'rune');
        }

        function applyImpetu(p, e, effectValue, rarity, enhance, tickCount) {
            // effectValue: +% velocidad ataque 3s (+15%/+22%/+30% base × enhance)
            runState.runeBuffs = runState.runeBuffs.filter(b => b.effectId !== 'impetu');
            runState.runeBuffs.push({
                effectId: 'impetu',
                expireTick: tickCount + 30, // 3 seconds
                value: effectValue / 100,   // 0.15 / 0.22 / 0.30
                type: 'atkSpd',
            });
            addLog(`💨 Ímpetu: velocidad ataque +${Math.floor(effectValue)}% por 3s`, 'rune');
        }

        // ─── Dispatcher de runas ───────────────────────────────
        // Evalúa TODAS las runas equipadas y dispara efectos si las condiciones se cumplen

        function processRuneConditions(p, e, tickCount) {
            if (!p || !e) return;
            const slots = ['weapon', 'armor', 'ring'];
            for (const slot of slots) {
                const item = metaState.equipment[slot];
                if (!item || !item.runas || !item.runas.conditionId || !item.runas.effectId) continue;
                const rn = item.runas;
                const condDef = findRuneCondition(rn.conditionId);
                const effDef = findRuneEffect(rn.effectId);
                if (!condDef || !effDef) continue;

                // Cosecha is handled entirely in enemyDefeated with its own cooldown
                if (condDef.solve === 'checkCosecha') continue;

                // Cooldown check
                const cdKey = `${slot}_${rn.effectId}`;
                if (runState.runeCooldowns[cdKey] && runState.runeCooldowns[cdKey] > tickCount) continue;

                const threshold = getRuneConditionValue(rn.conditionId, rn.condRarity || rn.rarity);
                const checkFnName = condDef.solve;
                let conditionMet = false;

                // Dispatch condition check
                switch (checkFnName) {
                    case 'checkGolpeSeco': conditionMet = checkGolpeSeco(p, e, tickCount, threshold); break;
                    case 'checkAlLimite': conditionMet = checkAlLimite(p, e, tickCount, threshold); break;
                    case 'checkReflejos': conditionMet = checkReflejos(p, e, tickCount, threshold); break;
                    case 'checkCastigo': conditionMet = checkCastigo(p, e, tickCount, threshold); break;
                    case 'checkRitmo': conditionMet = checkRitmo(p, e, tickCount, threshold); break;
                    case 'checkTormenta': conditionMet = checkTormenta(p, e, tickCount, threshold); break;
                    case 'checkPresion': conditionMet = checkPresion(p, e, tickCount, threshold); break;
                }

                if (!conditionMet) continue;

                // Condition met: apply effect
                const effectValue = getRuneEffectValue(rn.effectId, rn.effRarity || rn.rarity, rn.effEnhance ?? rn.enhance);
                const applyFnName = effDef.solve;

                switch (applyFnName) {
                    case 'applyCortar': applyCortar(p, e, effectValue, rn.rarity, rn.enhance, tickCount); break;
                    case 'applyAvalancha': applyAvalancha(p, e, effectValue, rn.rarity, rn.enhance, tickCount); break;
                    case 'applyMuro': applyMuro(p, e, effectValue, rn.rarity, rn.enhance, tickCount); break;
                    case 'applyPulso': applyPulso(p, e, effectValue, rn.rarity, rn.enhance, tickCount); break;
                    case 'applyMarca': applyMarca(p, e, effectValue, rn.rarity, rn.enhance, tickCount); break;
                    case 'applyCuchilla': applyCuchilla(p, e, effectValue, rn.rarity, rn.enhance, tickCount); break;
                    case 'applyVentisca': applyVentisca(p, e, effectValue, rn.rarity, rn.enhance, tickCount); break;
                    case 'applyOsmosis': applyOsmosis(p, e, effectValue, rn.rarity, rn.enhance, tickCount); break;
                    case 'applyCoraza': applyCoraza(p, e, effectValue, rn.rarity, rn.enhance, tickCount); break;
                    case 'applyImpetu': applyImpetu(p, e, effectValue, rn.rarity, rn.enhance, tickCount); break;
                }

                // Set cooldown: 2 seconds (20 ticks) default
                runState.runeCooldowns[cdKey] = tickCount + 20;
            }
        }

        // ─── Limpiar runeBuffs expirados ────────────────────────
        function processRuneBuffs(tickCount) {
            runState.runeBuffs = runState.runeBuffs.filter(b => {
                if (b.expireTick && tickCount >= b.expireTick) {
                    return false;
                }
                return true;
            });
        }

        // ─── Fabricación ──────────────────────────────────────
        function spendPowder(amount) {
            if (metaState.runePowder < amount) return false;
            metaState.runePowder -= amount;
            saveGame();
            render();
            return true;
        }

        function spendSouls(amount) {
            if (metaState.souls < amount) return false;
            metaState.souls -= amount;
            saveGame();
            render();
            return true;
        }

        function spendResources(powder, souls) {
            if (metaState.runePowder < powder || metaState.souls < souls) return false;
            metaState.runePowder -= powder;
            metaState.souls -= souls;
            saveGame();
            render();
            return true;
        }

        function fabricateRune(poolType) {
            // poolType: 'condition' | 'effect'
            const cost = BALANCE.runas.fabricateCost;
            if (metaState.runePowder < cost.powder || metaState.souls < cost.souls) {
                addLog(`❌ No tenés suficientes recursos (${cost.powder}🔮 + ${cost.souls}💀)`, 'system');
                return null;
            }

            // Collect IDs the user already owns (inventory + equipped)
            const ownedIds = new Set();
            // From inventory
            for (const r of Object.values(metaState.runeInventory)) {
                if (poolType === 'condition' && r.conditionId) ownedIds.add(r.conditionId);
                if (poolType === 'effect' && r.effectId) ownedIds.add(r.effectId);
            }
            // From equipped items
            for (const slot of ['weapon', 'armor', 'ring']) {
                const item = metaState.equipment[slot];
                if (item && item.runas && item.runas.conditionId) {
                    if (poolType === 'condition') ownedIds.add(item.runas.conditionId);
                    if (poolType === 'effect') ownedIds.add(item.runas.effectId);
                }
            }

            let pool;
            if (poolType === 'condition') {
                pool = RUNE_CONDITIONS;
            } else if (poolType === 'effect') {
                pool = RUNE_EFFECTS;
            } else {
                return null;
            }

            // Filter to only unowned runes
            const available = pool.filter(entry => !ownedIds.has(entry.id));
            if (available.length === 0) {
                const label = poolType === 'condition' ? '⚡ condiciones' : '✨ efectos';
                addLog(`❌ Ya tenés todas las ${label} disponibles. No podés fabricar más.`, 'system');
                return null;
            }

            const picked = available[Math.floor(Math.random() * available.length)];
            const runa = {
                conditionId: poolType === 'condition' ? picked.id : null,
                effectId: poolType === 'effect' ? picked.id : null,
                rarity: 'S',
                enhance: 0,
            };

            // Generar key única para inventory
            const key = `${runa.conditionId || '?'}_${runa.effectId || '?'}`;
            metaState.runeInventory[key] = runa;
            metaState.runePowder -= cost.powder;
            metaState.souls -= cost.souls;
            saveGame();
            render();

            const label = poolType === 'condition' ? 'Condición' : 'Efecto';
            addLog(`✨ Runa fabricada: ${label} — ${picked.label} (S+0)`, 'loot');
            return runa;
        }

        // ─── Enhance (reemplazado por enhanceEffectInSlot) ───

        // ─── Mejora individual: Cálculos ──────────────────────
        function calcCumulativeEnhanceCost(maxEnhance) {
            let total = 0;
            for (let i = 0; i < maxEnhance; i++) {
                total += Math.floor(Math.pow(BALANCE.runas.enhanceCostScale, i));
            }
            return total;
        }

        // ─── Mejora individual: Efecto en inventario ──────────
        function enhanceEffectInInventory(key) {
            const runa = metaState.runeInventory[key];
            if (!runa || !runa.effectId) return false;

            const maxEnh = getRuneMaxEnhance(runa.rarity);
            if (runa.enhance >= maxEnh) {
                addLog(`✅ Efecto ya está al máximo (+${maxEnh}) para rareza ${runa.rarity}`, 'system');
                return false;
            }

            const cost = Math.floor(Math.pow(BALANCE.runas.enhanceCostScale, runa.enhance));
            if (metaState.runePowder < cost) {
                addLog(`❌ No tenés suficiente polvo (${cost}🔮)`, 'system');
                return false;
            }

            metaState.runePowder -= cost;
            runa.enhance++;
            saveGame();
            render();
            const def = findRuneEffect(runa.effectId);
            addLog(`⬆️ ${def ? def.label : 'Efecto'} +${runa.enhance} (${cost}🔮)`, 'system');
            return true;
        }

        function upgradeEffectInInventory(key) {
            const runa = metaState.runeInventory[key];
            if (!runa || !runa.effectId) return false;

            const currentMax = getRuneMaxEnhance(runa.rarity);
            if (runa.enhance < currentMax) {
                const def = findRuneEffect(runa.effectId);
                addLog(`❌ Necesitás +${currentMax} para subir rareza (actual: +${runa.enhance})`, 'system');
                return false;
            }

            let targetRarity;
            if (runa.rarity === 'S') {
                targetRarity = 'SS';
            } else if (runa.rarity === 'SS') {
                targetRarity = 'SSS';
            } else {
                addLog(`✅ Efecto ya es SSS — rareza máxima`, 'system');
                return false;
            }

            const upgradeCost = BALANCE.runas.rarityConfig[targetRarity]?.upgradeCost;
            if (!upgradeCost) return false;

            if (metaState.runePowder < upgradeCost.powder || metaState.souls < upgradeCost.souls) {
                addLog(`❌ No tenés suficientes recursos (${upgradeCost.powder}🔮 + ${upgradeCost.souls}💀)`, 'system');
                return false;
            }

            metaState.runePowder -= upgradeCost.powder;
            metaState.souls -= upgradeCost.souls;
            runa.rarity = targetRarity;
            runa.enhance = 0;
            saveGame();
            render();
            const def = findRuneEffect(runa.effectId);
            addLog(`⬆️ ${def ? def.label : 'Efecto'} subido a ${targetRarity}`, 'loot');
            return true;
        }

        // ─── Mejora individual: Condición en inventario ────────
        function upgradeConditionRarity(key) {
            const runa = metaState.runeInventory[key];
            if (!runa || !runa.conditionId) return false;

            let targetRarity;
            if (runa.rarity === 'S') {
                targetRarity = 'SS';
            } else if (runa.rarity === 'SS') {
                targetRarity = 'SSS';
            } else {
                addLog(`✅ Condición ya es SSS — rareza máxima`, 'system');
                return false;
            }

            // Costo acumulado: enhance total de la rareza actual + upgrade cost
            const currentMaxEnh = getRuneMaxEnhance(runa.rarity);
            const enhanceTotal = calcCumulativeEnhanceCost(currentMaxEnh);
            const upgradeCost = BALANCE.runas.rarityConfig[targetRarity]?.upgradeCost;
            if (!upgradeCost) return false;

            const totalPowder = enhanceTotal + upgradeCost.powder;
            const totalSouls = upgradeCost.souls;

            if (metaState.runePowder < totalPowder || metaState.souls < totalSouls) {
                addLog(`❌ No tenés suficientes recursos (${totalPowder}🔮 + ${totalSouls}💀)`, 'system');
                return false;
            }

            metaState.runePowder -= totalPowder;
            metaState.souls -= totalSouls;
            runa.rarity = targetRarity;
            runa.enhance = 0;
            saveGame();
            render();
            const def = findRuneCondition(runa.conditionId);
            addLog(`⬆️ ${def ? def.label : 'Condición'} subida a ${targetRarity}`, 'loot');
            return true;
        }

        // ─── Mejora individual: Efecto equipado ─────────────────
        function enhanceEffectInSlot(slot) {
            const item = metaState.equipment[slot];
            if (!item || !item.runas || !item.runas.conditionId) return false;
            const rn = item.runas;

            const effRarity = rn.effRarity || rn.rarity;
            const effEnh = rn.effEnhance ?? rn.enhance;
            const maxEnh = getRuneMaxEnhance(effRarity);
            if (effEnh >= maxEnh) {
                addLog(`✅ Efecto ya está al máximo (+${maxEnh}) para rareza ${effRarity}`, 'system');
                return false;
            }
            const cost = Math.floor(Math.pow(BALANCE.runas.enhanceCostScale, effEnh));
            if (metaState.runePowder < cost) {
                addLog(`❌ No tenés suficiente polvo (${cost}🔮)`, 'system');
                return false;
            }
            metaState.runePowder -= cost;
            rn.effEnhance = effEnh + 1;
            rn.enhance = rn.effEnhance; // combined enhance = effect enhance
            saveGame();
            render();
            const effDef = findRuneEffect(rn.effectId);
            addLog(`⬆️ ${effDef ? effDef.label : 'Efecto'} +${rn.effEnhance} en ${slot} (${cost}🔮)`, 'system');
            return true;
        }

        // ─── Mejora individual: rareza de condición equipada ────
        function upgradeConditionInSlot(slot) {
            const item = metaState.equipment[slot];
            if (!item || !item.runas || !item.runas.conditionId) return false;
            const rn = item.runas;

            const condRarity = rn.condRarity || rn.rarity;
            let targetRarity;
            if (condRarity === 'S') {
                targetRarity = 'SS';
            } else if (condRarity === 'SS') {
                targetRarity = 'SSS';
            } else {
                addLog(`✅ Condición ya es SSS — rareza máxima`, 'system');
                return false;
            }
            // Costo acumulado: enhance total de la rareza actual + upgrade cost
            const currentMaxEnh = getRuneMaxEnhance(condRarity);
            const enhanceTotal = calcCumulativeEnhanceCost(currentMaxEnh);
            const upgradeCost = BALANCE.runas.rarityConfig[targetRarity]?.upgradeCost;
            if (!upgradeCost) return false;
            const totalPowder = enhanceTotal + upgradeCost.powder;
            if (metaState.runePowder < totalPowder || metaState.souls < upgradeCost.souls) {
                addLog(`❌ No tenés suficientes recursos (${totalPowder}🔮 + ${upgradeCost.souls}💀)`, 'system');
                return false;
            }
            metaState.runePowder -= totalPowder;
            metaState.souls -= upgradeCost.souls;
            rn.condRarity = targetRarity;
            rn.rarity = computeRuneRarity(rn.condRarity, rn.effRarity || rn.rarity);
            saveGame();
            render();
            const condDef = findRuneCondition(rn.conditionId);
            addLog(`⬆️ ${condDef ? condDef.label : 'Condición'} subida a ${targetRarity} en ${slot}`, 'loot');
            return true;
        }

        // ─── Mejora individual: rareza de efecto equipado ───────
        function upgradeEffectInSlot(slot) {
            const item = metaState.equipment[slot];
            if (!item || !item.runas || !item.runas.conditionId) return false;
            const rn = item.runas;

            const effRarity = rn.effRarity || rn.rarity;
            const effEnh = rn.effEnhance ?? rn.enhance;
            let targetRarity;
            if (effRarity === 'S') {
                targetRarity = 'SS';
            } else if (effRarity === 'SS') {
                targetRarity = 'SSS';
            } else {
                addLog(`✅ Efecto ya es SSS — rareza máxima`, 'system');
                return false;
            }
            const requireMax = getRuneMaxEnhance(effRarity);
            if (effEnh < requireMax) {
                addLog(`❌ Necesitás +${requireMax} para subir rareza (actual: +${effEnh})`, 'system');
                return false;
            }
            const upgradeCost = BALANCE.runas.rarityConfig[targetRarity]?.upgradeCost;
            if (!upgradeCost) return false;
            if (metaState.runePowder < upgradeCost.powder || metaState.souls < upgradeCost.souls) {
                addLog(`❌ No tenés suficientes recursos (${upgradeCost.powder}🔮 + ${upgradeCost.souls}💀)`, 'system');
                return false;
            }
            metaState.runePowder -= upgradeCost.powder;
            metaState.souls -= upgradeCost.souls;
            rn.effRarity = targetRarity;
            rn.effEnhance = 0;
            rn.enhance = 0;
            rn.rarity = computeRuneRarity(rn.condRarity || rn.rarity, rn.effRarity);
            saveGame();
            render();
            const effDef = findRuneEffect(rn.effectId);
            addLog(`⬆️ ${effDef ? effDef.label : 'Efecto'} subido a ${targetRarity} en ${slot}`, 'loot');
            return true;
        }

        // ─── Helper: combina rarezas ──────────────────────────
        function computeRuneRarity(condRarity, effRarity) {
            const order = { 'S': 0, 'SS': 1, 'SSS': 2 };
            return order[condRarity] >= order[effRarity] ? condRarity : effRarity;
        }

        // ─── Equipar y Desequipar ─────────────────────────────

        function isRuneCombinationUnique(conditionId, effectId, excludeSlot) {
            const slots = ['weapon', 'armor', 'ring'];
            for (const slot of slots) {
                if (slot === excludeSlot) continue;
                const item = metaState.equipment[slot];
                if (item && item.runas && item.runas.conditionId) {
                    if (item.runas.conditionId === conditionId && item.runas.effectId === effectId) {
                        return false; // Combination already exists in another slot
                    }
                }
            }
            return true;
        }

        function equipRune(slot, conditionId, effectId) {
            const item = metaState.equipment[slot];
            if (!item) {
                addLog(`❌ No hay equipo en ${slot}`, 'system');
                return false;
            }

            // Check unique combination
            if (!isRuneCombinationUnique(conditionId, effectId, slot)) {
                addLog(`❌ Esta combinación de runa ya está equipada en otra pieza`, 'system');
                return false;
            }

            // Remove from inventory
            const invKey = `${conditionId}_${effectId}`;
            const invRuna = metaState.runeInventory[invKey];
            if (!invRuna) {
                addLog(`❌ Runa no encontrada en el inventario`, 'system');
                return false;
            }

            delete metaState.runeInventory[invKey];

            // Assign to equipment slot
            item.runas = {
                conditionId: invRuna.conditionId,
                effectId: invRuna.effectId,
                rarity: invRuna.rarity || 'S',
                enhance: invRuna.enhance || 0,
            };

            saveGame();
            render();
            const condDef = findRuneCondition(conditionId);
            const effDef = findRuneEffect(effectId);
            addLog(`🔮 Runa equipada: ${condDef ? condDef.label : '?'} → ${effDef ? effDef.label : '?'}`, 'loot');
            return true;
        }

        function unequipRune(slot) {
            const item = metaState.equipment[slot];
            if (!item || !item.runas || !item.runas.conditionId) {
                addLog(`❌ No hay runa equipada en ${slot}`, 'system');
                return false;
            }

            const rn = item.runas;
            // Add back to inventory
            const key = `${rn.conditionId}_${rn.effectId}`;
            metaState.runeInventory[key] = {
                conditionId: rn.conditionId,
                effectId: rn.effectId,
                rarity: rn.rarity,
                enhance: rn.enhance,
                // Preserve individual component states (fallback for old saves)
                condRarity: rn.condRarity || rn.rarity,
                effRarity: rn.effRarity || rn.rarity,
                effEnhance: rn.effEnhance || rn.enhance,
            };

            // Remove from equipment
            item.runas = null;
            saveGame();
            render();
            addLog(`🔮 Runa desequipada de ${slot}`, 'system');
            return true;
        }

// ============================================
        // 7b. RUNAS — MODAL Y ACCIONES UI
        // ============================================

        let _runeModalStep = null; // 'main' | 'equip'
        let _runeEquipSlot = null;

        function showRuneModal() {
            if (!metaState.unlockedReforge) return;
            _runeModalStep = 'main';
            _runeEquipSlot = null;
            renderRuneModal();
            document.getElementById('rune-overlay').classList.add('visible');
        }

        function closeRuneModal() {
            document.getElementById('rune-overlay').classList.remove('visible');
            _runeModalStep = null;
            _runeEquipSlot = null;
        }

        function renderRuneModal() {
            const content = document.getElementById('rune-content');

            if (_runeModalStep === 'equip') {
                content.innerHTML = renderRuneEquipPicker();
                return;
            }

            const slots = ['weapon', 'armor', 'ring'];
            const slotIcons = { weapon: '🗡️', armor: '🛡️', ring: '💍' };
            const slotLabels = { weapon: 'Arma', armor: 'Armadura', ring: 'Anillo' };

            // ── Section 1: Fabricar ──────────────────────
            const fabricarHTML = `
                <div class="rune-section">
                    <h3>🔨 Fabricar Runa</h3>
                    <div class="desc">Elegí fabricar una Condición o un Efecto. La runa se guarda en tu inventario para equipar después.</div>
                    <div class="rune-fabricate-row">
                        <div class="rune-fab-btn" onclick="showFabricateConfirm('condition')">
                            <span class="fab-icon">⚡</span>
                            <span class="fab-label">Condición</span>
                            <span class="fab-cost">10🔮 + 100💀</span>
                        </div>
                        <div class="rune-fab-btn" onclick="showFabricateConfirm('effect')">
                            <span class="fab-icon">✨</span>
                            <span class="fab-label">Efecto</span>
                            <span class="fab-cost">10🔮 + 100💀</span>
                        </div>
                    </div>
                </div>
            `;

            // ── Section 2: Mejorar (Enhance) — solo efectos ────
            let enhanceHTML = '';
            for (const slot of slots) {
                const item = metaState.equipment[slot];
                if (!item || !item.runas || !item.runas.conditionId) continue;
                const rn = item.runas;
                const effDef = findRuneEffect(rn.effectId);
                const effRarity = rn.effRarity || rn.rarity;
                const effEnh = rn.effEnhance ?? rn.enhance;
                const maxEnh = getRuneMaxEnhance(effRarity);
                const isMax = effEnh >= maxEnh;
                const cost = isMax ? 0 : Math.floor(Math.pow(BALANCE.runas.enhanceCostScale, effEnh));
                const canEnhance = !isMax && metaState.runePowder >= cost;
                enhanceHTML += `
                    <div class="rune-slot-row">
                        <div class="rune-info">
                            <div class="rune-name">${slotIcons[slot]} ${slotLabels[slot]} ✨</div>
                            <div class="rune-detail">
                                ${effDef ? effDef.label : '?'} <span class="rarity-${effRarity}">${effRarity}+${effEnh}</span>
                            </div>
                            <div style="font-size:0.6rem;color:#6b7280;margin-top:1px;">
                                ${effDef ? effDef.desc : ''}
                            </div>
                        </div>
                        <div class="rune-actions">
                            ${isMax
                                ? `<span style="color:#4ade80;font-size:0.7rem;">✅ MAX</span>`
                                : `<button class="rune-action-btn primary" onclick="enhanceEffectInSlot('${slot}');renderRuneModal();" ${canEnhance ? '' : 'disabled'}>
                                    +1 (${cost}🔮)
                                   </button>`
                            }
                        </div>
                    </div>
                `;
            }
            if (!enhanceHTML) {
                enhanceHTML = `<div class="rune-empty">No hay efectos equipados para mejorar. Mejorálos desde el inventario o equipá runas primero.</div>`;
            }
            const mejorarHTML = `
                <div class="rune-section">
                    <h3>⬆️ Mejorar Efecto</h3>
                    <div class="desc">Subí el nivel de mejora de un efecto equipado (+8% poder por nivel).</div>
                    ${enhanceHTML}
                </div>
            `;

            // ── Section 3: Subir Rareza (individual) ──────
            let upgradeHTML = '';
            for (const slot of slots) {
                const item = metaState.equipment[slot];
                if (!item || !item.runas || !item.runas.conditionId) continue;
                const rn = item.runas;
                const condDef = findRuneCondition(rn.conditionId);
                const effDef = findRuneEffect(rn.effectId);
                const condRarity = rn.condRarity || rn.rarity;
                const effRarity = rn.effRarity || rn.rarity;

                // ── Condición ──
                let condTarget, condUpgCost;
                if (condRarity === 'S') {
                    condTarget = 'SS';
                    condUpgCost = BALANCE.runas.rarityConfig.SS?.upgradeCost;
                } else if (condRarity === 'SS') {
                    condTarget = 'SSS';
                    condUpgCost = BALANCE.runas.rarityConfig.SSS?.upgradeCost;
                }
                if (condTarget) {
                    const curMaxEnh = getRuneMaxEnhance(condRarity);
                    const enhTotal = calcCumulativeEnhanceCost(curMaxEnh);
                    const totalPowder = enhTotal + (condUpgCost?.powder ?? 0);
                    const canAffordCond = condUpgCost && metaState.runePowder >= totalPowder && metaState.souls >= condUpgCost.souls;
                    upgradeHTML += `
                        <div class="rune-slot-row">
                            <div class="rune-info">
                                <div class="rune-name">${slotIcons[slot]} ${slotLabels[slot]} ⚡</div>
                                <div class="rune-detail">
                                    ${condDef ? condDef.label : '?'} <span class="rarity-${condRarity}">${condRarity}</span>
                                </div>
                                <div style="font-size:0.6rem;color:#6b7280;margin-top:1px;">
                                    ${condDef ? condDef.desc : ''}
                                </div>
                            </div>
                            <div class="rune-actions">
                                <button class="rune-action-btn primary" onclick="upgradeConditionInSlot('${slot}');renderRuneModal();" ${canAffordCond ? '' : 'disabled'}>
                                    → ${condTarget} (${totalPowder}🔮+${condUpgCost?.souls ?? 0}💀)
                                </button>
                            </div>
                        </div>
                    `;
                }

                // ── Efecto ──
                let effTarget, effUpgCost, requireMax;
                if (effRarity === 'S') {
                    effTarget = 'SS';
                    effUpgCost = BALANCE.runas.rarityConfig.SS?.upgradeCost;
                    requireMax = getRuneMaxEnhance('S');
                } else if (effRarity === 'SS') {
                    effTarget = 'SSS';
                    effUpgCost = BALANCE.runas.rarityConfig.SSS?.upgradeCost;
                    requireMax = getRuneMaxEnhance('SS');
                }
                if (effTarget) {
                    const effEnh = rn.effEnhance ?? rn.enhance;
                    const meetsReq = effEnh >= requireMax;
                    const canAffordEff = effUpgCost && metaState.runePowder >= effUpgCost.powder && metaState.souls >= effUpgCost.souls;
                    upgradeHTML += `
                        <div class="rune-slot-row">
                            <div class="rune-info">
                                <div class="rune-name">${slotIcons[slot]} ${slotLabels[slot]} ✨</div>
                                <div class="rune-detail">
                                    ${effDef ? effDef.label : '?'} <span class="rarity-${effRarity}">${effRarity}+${effEnh}</span>
                                    ${meetsReq ? '' : `<span style="color:#ef4444;font-size:0.7rem;"> (requiere +${requireMax})</span>`}
                                </div>
                                <div style="font-size:0.6rem;color:#6b7280;margin-top:1px;">
                                    ${effDef ? effDef.desc : ''}
                                </div>
                            </div>
                            <div class="rune-actions">
                                ${effUpgCost ? `<button class="rune-action-btn primary" onclick="upgradeEffectInSlot('${slot}');renderRuneModal();" ${(meetsReq && canAffordEff) ? '' : 'disabled'}>
                                    → ${effTarget} (${effUpgCost.powder}🔮+${effUpgCost.souls}💀)
                                </button>` : ''}
                            </div>
                        </div>
                    `;
                }
            }
            if (!upgradeHTML) {
                upgradeHTML = `<div class="rune-empty">No hay runas elegibles para subir de rareza.</div>`;
            }
            const upgradeSectionHTML = `
                <div class="rune-section">
                    <h3>⬆️ Subir Rareza</h3>
                    <div class="desc">Mejorá la rareza de condición o efecto. La condición paga costo acumulado (sin enhance). El efecto requiere máximo +enhance de su rareza actual y se resetea a +0.</div>
                    ${upgradeHTML}
                </div>
            `;

            // ── Section 4: Inventario ────────────────────
            const invKeys = Object.keys(metaState.runeInventory);
            let invHTML = '';
            const conds = {};
            const effs = {};
            for (const key of invKeys) {
                const r = metaState.runeInventory[key];
                if (r.conditionId) conds[key] = r;
                if (r.effectId) effs[key] = r;
            }
            const condKeys = Object.keys(conds);
            const effKeys = Object.keys(effs);
            if (condKeys.length > 0 || effKeys.length > 0) {
                invHTML = `<div class="rune-section">
                    <h3>📦 Inventario</h3>
                    <div class="desc">Runas disponibles. Equipalas desde la pantalla de personaje.</div>`;
                if (condKeys.length > 0) {
                    invHTML += `<div style="font-size:0.75rem;color:#9ca3af;margin-bottom:4px;">⚡ Condiciones:</div>`;
                    for (const key of condKeys) {
                        const r = conds[key];
                        const def = findRuneCondition(r.conditionId);
                        const isSss = r.rarity === 'SSS';
                        let actionBtn = '';
                        if (isSss) {
                            actionBtn = `<span style="color:#4ade80;font-size:0.65rem;">✅ MAX</span>`;
                        } else {
                            const targetRarity = r.rarity === 'S' ? 'SS' : 'SSS';
                            const currentMax = getRuneMaxEnhance(r.rarity);
                            const enhanceTotal = calcCumulativeEnhanceCost(currentMax);
                            const upgCost = BALANCE.runas.rarityConfig[targetRarity]?.upgradeCost;
                            if (upgCost) {
                                const totalPowder = enhanceTotal + upgCost.powder;
                                actionBtn = `<button class="rune-action-btn primary" style="font-size:0.65rem;padding:2px 8px;" onclick="upgradeConditionRarity('${key}');renderRuneModal();">⬆️ ${targetRarity} (${totalPowder}🔮)</button>`;
                            }
                        }
                        invHTML += `<div class="rune-inv-item" style="display:block;width:100%;margin:0 0 4px 0;padding:6px 10px;">
                            <div style="display:flex;justify-content:space-between;align-items:center;">
                                <div style="font-weight:600;font-size:0.75rem;">${def ? def.label : '?'} <span class="rarity-${r.rarity}">${r.rarity}</span></div>
                                ${actionBtn}
                            </div>
                            <div style="font-size:0.65rem;color:#6b7280;">${def ? def.desc : ''}</div>
                        </div>`;
                    }
                }
                if (effKeys.length > 0) {
                    invHTML += `<div style="font-size:0.75rem;color:#9ca3af;margin-top:4px;margin-bottom:4px;">✨ Efectos:</div>`;
                    for (const key of effKeys) {
                        const r = effs[key];
                        const def = findRuneEffect(r.effectId);
                        const maxEnh = getRuneMaxEnhance(r.rarity);
                        const isMax = r.enhance >= maxEnh;
                        const isSss = r.rarity === 'SSS';
                        let actionBtn = '';
                        if (isSss) {
                            actionBtn = `<span style="color:#4ade80;font-size:0.65rem;">✅ MAX</span>`;
                        } else if (!isMax) {
                            const cost = Math.floor(Math.pow(BALANCE.runas.enhanceCostScale, r.enhance));
                            const canAfford = metaState.runePowder >= cost;
                            actionBtn = `<button class="rune-action-btn primary" style="font-size:0.65rem;padding:2px 8px;" ${canAfford ? '' : 'disabled'} onclick="enhanceEffectInInventory('${key}');renderRuneModal();">+1 (${cost}🔮)</button>`;
                        } else {
                            // At max enhance, can upgrade rarity
                            const targetRarity = r.rarity === 'S' ? 'SS' : 'SSS';
                            const upgCost = BALANCE.runas.rarityConfig[targetRarity]?.upgradeCost;
                            if (upgCost) {
                                const canAffordUpg = metaState.runePowder >= upgCost.powder && metaState.souls >= upgCost.souls;
                                actionBtn = `<button class="rune-action-btn primary" style="font-size:0.65rem;padding:2px 8px;" ${canAffordUpg ? '' : 'disabled'} onclick="upgradeEffectInInventory('${key}');renderRuneModal();">⬆️ ${targetRarity} (${upgCost.powder}🔮+${upgCost.souls}💀)</button>`;
                            }
                        }
                        invHTML += `<div class="rune-inv-item" style="display:block;width:100%;margin:0 0 4px 0;padding:6px 10px;">
                            <div style="display:flex;justify-content:space-between;align-items:center;">
                                <div style="font-weight:600;font-size:0.75rem;">${def ? def.label : '?'} <span class="rarity-${r.rarity}">${r.rarity}+${r.enhance}</span></div>
                                ${actionBtn}
                            </div>
                            <div style="font-size:0.65rem;color:#6b7280;">${def ? def.desc : ''}</div>
                        </div>`;
                    }
                }
                invHTML += `</div>`;
            }

            content.innerHTML = fabricarHTML + mejorarHTML + upgradeSectionHTML + invHTML;
        }

        // ─── Confirmación: Fabricar ───────────────────
        function showFabricateConfirm(poolType) {
            const cost = BALANCE.runas.fabricateCost;
            const label = poolType === 'condition' ? '⚡ Condición' : '✨ Efecto';
            const canAfford = metaState.runePowder >= cost.powder && metaState.souls >= cost.souls;

            // Check if there are any unowned runes of this type
            const ownedIds = new Set();
            for (const r of Object.values(metaState.runeInventory)) {
                if (poolType === 'condition' && r.conditionId) ownedIds.add(r.conditionId);
                if (poolType === 'effect' && r.effectId) ownedIds.add(r.effectId);
            }
            for (const slot of ['weapon', 'armor', 'ring']) {
                const item = metaState.equipment[slot];
                if (item && item.runas && item.runas.conditionId) {
                    if (poolType === 'condition') ownedIds.add(item.runas.conditionId);
                    if (poolType === 'effect') ownedIds.add(item.runas.effectId);
                }
            }
            const pool = poolType === 'condition' ? RUNE_CONDITIONS : RUNE_EFFECTS;
            const available = pool.filter(e => !ownedIds.has(e.id));
            const noMore = available.length === 0;
            const poolLabel = poolType === 'condition' ? 'condiciones' : 'efectos';

            const content = document.getElementById('rune-content');
            content.innerHTML = `
                <div class="rune-confirm-box">
                    <div class="confirm-question">¿Fabricar ${label}?</div>
                    <div class="confirm-cost">Costo: ${cost.powder}🔮 + ${cost.souls}💀</div>
                    ${noMore ? `<div style="color:#ef4444;font-size:0.8rem;margin-bottom:8px;">❌ Ya tenés todas las ${poolLabel} disponibles.</div>` : ''}
                    ${!canAfford && !noMore ? `<div style="color:#ef4444;font-size:0.8rem;margin-bottom:8px;">❌ No tenés suficientes recursos</div>` : ''}
                    <div class="confirm-btns">
                        <button class="btn-confirm" onclick="doFabricate('${poolType}')" ${(canAfford && !noMore) ? '' : 'disabled'}>✅ Fabricar</button>
                        <button class="btn-cancel" onclick="renderRuneModal()">❌ Cancelar</button>
                    </div>
                </div>
            `;
        }

        function doFabricate(poolType) {
            fabricateRune(poolType);
            renderRuneModal();
        }

        // ─── Equipar: selector manual de condición + efecto ──
        let _runePickSlot = null;      // slot destino
        let _runePickCond = null;      // conditionId elegido
        let _runePickEff = null;       // effectId elegido

        function showRuneEquipPicker(slot) {
            _runePickSlot = slot;
            _runePickCond = null;
            _runePickEff = null;
            _runeModalStep = 'equip';
            renderRuneModal();
            document.getElementById('rune-overlay').classList.add('visible');
        }

        function renderRuneEquipPicker() {
            const slotLabels = { weapon: '🗡️ Arma', armor: '🛡️ Armadura', ring: '💍 Anillo' };
            const invEntries = Object.entries(metaState.runeInventory);
            const condEntries = invEntries.filter(([, r]) => r.conditionId);
            const effEntries = invEntries.filter(([, r]) => r.effectId);

            // Step: pick condition
            if (!_runePickCond) {
                let html = `<p style="text-align:center;color:#9ca3af;font-size:0.85rem;margin-bottom:10px;">Paso 1: Elegí una Condición para ${slotLabels[_runePickSlot] || _runePickSlot}</p>`;
                if (condEntries.length === 0) {
                    html += `<p style="text-align:center;color:#ef4444;font-size:0.8rem;">❌ No tenés condiciones en el inventario. Fabricá una en "🔮 Runas".</p>`;
                } else {
                    for (const [key, r] of condEntries) {
                        const def = findRuneCondition(r.conditionId);
                        html += `<button class="rune-inv-item block" onclick="_runePickCond='${r.conditionId}';renderRuneModal();" style="padding:8px 10px;">
                            <div style="font-weight:600;font-size:0.75rem;">⚡ ${def ? def.label : r.conditionId} <span class="rarity-${r.rarity}">${r.rarity}+${r.enhance}</span></div>
                            <div style="font-size:0.65rem;color:#6b7280;margin-top:2px;">${def ? def.desc : ''}</div>
                        </button>`;
                    }
                }
                html += `<br><button class="modal-close" onclick="closeRuneModal()" style="background:#4a4a6a;font-size:0.8rem;padding:6px 16px;">← Cancelar</button>`;
                return html;
            }

            // Step: pick effect
            if (!_runePickEff) {
                const condDef = findRuneCondition(_runePickCond);
                let html = `<p style="text-align:center;color:#9ca3af;font-size:0.85rem;margin-bottom:10px;">Paso 2: Elegí un Efecto para ${condDef ? condDef.label : _runePickCond}</p>`;
                if (effEntries.length === 0) {
                    html += `<p style="text-align:center;color:#ef4444;font-size:0.8rem;">❌ No tenés efectos en el inventario. Fabricá uno en "🔮 Runas".</p>`;
                } else {
                    for (const [key, r] of effEntries) {
                        const def = findRuneEffect(r.effectId);
                        const isDuplicate = !isRuneCombinationUnique(_runePickCond, r.effectId, _runePickSlot);
                        if (isDuplicate) continue; // skip combos already used
                        html += `<button class="rune-inv-item block" onclick="_runePickEff='${r.effectId}';renderRuneModal();" style="padding:8px 10px;">
                            <div style="font-weight:600;font-size:0.75rem;">✨ ${def ? def.label : r.effectId} <span class="rarity-${r.rarity}">${r.rarity}+${r.enhance}</span></div>
                            <div style="font-size:0.65rem;color:#6b7280;margin-top:2px;">${def ? def.desc : ''}</div>
                        </button>`;
                    }
                }
                html += `<br><button class="modal-close" onclick="_runePickCond=null;renderRuneModal();" style="background:#4a4a6a;font-size:0.8rem;padding:6px 16px;">← Volver</button>`;
                return html;
            }

            // Step: confirm
            const condDef = findRuneCondition(_runePickCond);
            const effDef = findRuneEffect(_runePickEff);
            // Find actual inventory items to get rarity/enhance
            const condInvEntry = Object.entries(metaState.runeInventory).find(([, r]) => r.conditionId === _runePickCond);
            const effInvEntry = Object.entries(metaState.runeInventory).find(([, r]) => r.effectId === _runePickEff);
            const condRuna = condInvEntry ? condInvEntry[1] : null;
            const effRuna = effInvEntry ? effInvEntry[1] : null;
            // Use the better rarity/enhance from both pieces
            const rarityOrder = { 'S': 0, 'SS': 1, 'SSS': 2 };
            let finalRarity = 'S', finalEnhance = 0;
            if (condRuna && effRuna) {
                finalRarity = rarityOrder[condRuna.rarity] >= rarityOrder[effRuna.rarity] ? condRuna.rarity : effRuna.rarity;
                finalEnhance = Math.max(condRuna.enhance, effRuna.enhance);
            } else if (condRuna) {
                finalRarity = condRuna.rarity; finalEnhance = condRuna.enhance;
            } else if (effRuna) {
                finalRarity = effRuna.rarity; finalEnhance = effRuna.enhance;
            }

            return `
                <div class="rune-confirm-box">
                    <p style="text-align:center;color:#9ca3af;font-size:0.85rem;margin-bottom:10px;">Confirmar equipamiento</p>
                    <div style="text-align:center;font-size:0.9rem;margin-bottom:2px;">
                        ⚡ ${condDef ? condDef.label : '?'} → ✨ ${effDef ? effDef.label : '?'}
                    </div>
                    <div style="text-align:center;font-size:0.65rem;color:#6b7280;margin-bottom:6px;">
                        ${condDef ? condDef.desc : ''} → ${effDef ? effDef.desc : ''}
                    </div>
                    <div style="text-align:center;font-size:0.75rem;color:#60a5fa;margin-bottom:10px;">
                        Rareza: ${finalRarity} | Enhance: +${finalEnhance}
                    </div>
                    <div class="confirm-btns">
                        <button class="btn-confirm" onclick="confirmManualEquip('${_runePickSlot}', '${_runePickCond}', '${_runePickEff}')">✅ Equipar</button>
                        <button class="btn-cancel" onclick="_runePickEff=null;renderRuneModal();">← Volver</button>
                    </div>
                </div>
            `;
        }

        function confirmManualEquip(slot, conditionId, effectId) {
            const item = metaState.equipment[slot];
            if (!item) {
                addLog(`❌ No hay equipo en ${slot}`, 'system');
                closeRuneModal();
                return;
            }

            // Find inventory items
            const condKey = Object.keys(metaState.runeInventory).find(k => metaState.runeInventory[k].conditionId === conditionId);
            const effKey = Object.keys(metaState.runeInventory).find(k => metaState.runeInventory[k].effectId === effectId);
            if (!condKey || !effKey) {
                addLog(`❌ Runa no encontrada en inventario`, 'system');
                closeRuneModal();
                return;
            }

            const condRuna = metaState.runeInventory[condKey];
            const effRuna = metaState.runeInventory[effKey];

            // Check unique combination
            if (!isRuneCombinationUnique(conditionId, effectId, slot)) {
                addLog(`❌ Esta combinación de runa ya está equipada en otra pieza`, 'system');
                return;
            }

            // Determine final rarity/enhance (best of both)
            const rarityOrder = { 'S': 0, 'SS': 1, 'SSS': 2 };
            const finalRarity = rarityOrder[condRuna.rarity] >= rarityOrder[effRuna.rarity] ? condRuna.rarity : effRuna.rarity;
            const finalEnhance = Math.max(condRuna.enhance, effRuna.enhance);

            // Remove from inventory
            delete metaState.runeInventory[condKey];
            delete metaState.runeInventory[effKey];

            // Assign to equipment — store individual component states
            item.runas = {
                conditionId: conditionId,
                effectId: effectId,
                rarity: finalRarity,
                enhance: finalEnhance,
                condRarity: condRuna.rarity || 'S',
                effRarity: effRuna.rarity || 'S',
                effEnhance: effRuna.enhance || 0,
            };

            saveGame();
            render();
            const condDef = findRuneCondition(conditionId);
            const effDef = findRuneEffect(effectId);
            addLog(`🔮 Runa equipada: ${condDef ? condDef.label : '?'} → ${effDef ? effDef.label : '?'}`, 'loot');

            _runeModalStep = null;
            _runePickSlot = null;
            _runePickCond = null;
            _runePickEff = null;
            closeRuneModal();
            if (runState.characterScreenActive) {
                setTimeout(renderCharacterScreen, 50);
            }
        }

        function cancelRuneEquip() {
            _runeModalStep = 'main';
            _runeEquipSlot = null;
            renderRuneModal();
        }
  // Expose public API
  Game.runes = {
    RUNE_CONDITIONS: RUNE_CONDITIONS,
    RUNE_EFFECTS: RUNE_EFFECTS,
    findRuneCondition: findRuneCondition,
    findRuneEffect: findRuneEffect,
    getRuneEffectValue: getRuneEffectValue,
    getRuneConditionValue: getRuneConditionValue,
    getRuneMaxEnhance: getRuneMaxEnhance,
    processRuneConditions: processRuneConditions,
    processRuneBuffs: processRuneBuffs,
    fabricateRune: fabricateRune,
    calcCumulativeEnhanceCost: calcCumulativeEnhanceCost,
    enhanceEffectInInventory: enhanceEffectInInventory,
    upgradeEffectInInventory: upgradeEffectInInventory,
    upgradeConditionRarity: upgradeConditionRarity,
    enhanceEffectInSlot: enhanceEffectInSlot,
    upgradeConditionInSlot: upgradeConditionInSlot,
    upgradeEffectInSlot: upgradeEffectInSlot,
    computeRuneRarity: computeRuneRarity,
    isRuneCombinationUnique: isRuneCombinationUnique,
    equipRune: equipRune,
    unequipRune: unequipRune,
    showRuneModal: showRuneModal,
    closeRuneModal: closeRuneModal,
    renderRuneModal: renderRuneModal,
    showFabricateConfirm: showFabricateConfirm,
    doFabricate: doFabricate,
    showRuneEquipPicker: showRuneEquipPicker,
    renderRuneEquipPicker: renderRuneEquipPicker,
    confirmManualEquip: confirmManualEquip,
    cancelRuneEquip: cancelRuneEquip
  };

  // Temporary window bridges
  window.RUNE_CONDITIONS = RUNE_CONDITIONS;
  window.RUNE_EFFECTS = RUNE_EFFECTS;
  window.findRuneCondition = findRuneCondition;
  window.findRuneEffect = findRuneEffect;
  window.getRuneEffectValue = getRuneEffectValue;
  window.getRuneConditionValue = getRuneConditionValue;
  window.getRuneMaxEnhance = getRuneMaxEnhance;
  window.processRuneConditions = processRuneConditions;
  window.processRuneBuffs = processRuneBuffs;
  window.fabricateRune = fabricateRune;
  window.calcCumulativeEnhanceCost = calcCumulativeEnhanceCost;
  window.enhanceEffectInInventory = enhanceEffectInInventory;
  window.upgradeEffectInInventory = upgradeEffectInInventory;
  window.upgradeConditionRarity = upgradeConditionRarity;
  window.enhanceEffectInSlot = enhanceEffectInSlot;
  window.upgradeConditionInSlot = upgradeConditionInSlot;
  window.upgradeEffectInSlot = upgradeEffectInSlot;
  window.computeRuneRarity = computeRuneRarity;
  window.isRuneCombinationUnique = isRuneCombinationUnique;
  window.equipRune = equipRune;
  window.unequipRune = unequipRune;
  window.showRuneModal = showRuneModal;
  window.closeRuneModal = closeRuneModal;
  window.renderRuneModal = renderRuneModal;
  window.showFabricateConfirm = showFabricateConfirm;
  window.doFabricate = doFabricate;
  window.showRuneEquipPicker = showRuneEquipPicker;
  window.renderRuneEquipPicker = renderRuneEquipPicker;
  window.confirmManualEquip = confirmManualEquip;
  window.cancelRuneEquip = cancelRuneEquip;
  window._runePickCond = _runePickCond;
  window._runePickEff = _runePickEff;
})();
