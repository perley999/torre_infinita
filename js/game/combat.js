// combat.js — combat start, enemy defeat, player death, tiered bonuses.
// PARTIAL: combatTick stays inline until F6.
// Extracted from Torre_Infinita.html (F3 game logic).
(function() {
  'use strict';
  window.Game = window.Game || {};

function startCombat() {
            const stats = calcPlayerStats();
            const p = runState.player;
            p.maxHp = stats.maxHp;
            p.hp = stats.maxHp;
            p.atk = stats.atk;
            p.def = stats.def;
            p.agi = stats.agi;
            p.critRating = stats.critRating;
            p.dodgeRating = stats.dodgeRating;
            p.lifesteal = stats.lifesteal;
            p.pen = stats.pen;
            p.critDamage = stats.critDamage;
            p.bossDamage = stats.bossDamage;
            p.hpRegen = stats.hpRegen;
            p.attackTimer = speedToInterval(p.agi);

            // Artefacto multipliers (used in combat/defeat logic)
            runState.artifactMult = {
                xp: stats.xpMult || 1,
                drop: stats.dropMult || 1,
                souls: stats.soulsMult || 1,
                talentDmg: stats.talentDmgMult || 1,
            };

            // Masteries: flat bonuses sobre stats base
            runState.masteryFlatCrit = 0;
            runState.masteryFlatLifesteal = 0;
            runState.masteryFlatBlock = 0;
            runState.masteryFlatRegen = 0;
            runState.masteryToughPct = 0;
            runState.masteryFlatDodge = 0;
            runState.masteryFlatPen = 0;
            runState.masteryFortuneChance = 0;
            const weaponMastery = metaState.equipment.weapon?.mastery;
            if (weaponMastery) {
                const masteryDef = MASTERIES.weapon.find(m => m.id === weaponMastery.id);
                if (masteryDef) {
                    if (masteryDef.id === 'crit_mastery') runState.masteryFlatCrit = masteryDef.values[weaponMastery.level - 1];
                    if (masteryDef.id === 'vampiric') runState.masteryFlatLifesteal = masteryDef.values[weaponMastery.level - 1];
                }
            }
            const armorMastery = metaState.equipment.armor?.mastery;
            if (armorMastery) {
                const masteryDef = MASTERIES.armor.find(m => m.id === armorMastery.id);
                if (masteryDef) {
                    if (masteryDef.id === 'block_mastery') runState.masteryFlatBlock = masteryDef.values[armorMastery.level - 1];
                    if (masteryDef.id === 'regen_mastery') runState.masteryFlatRegen = masteryDef.values[armorMastery.level - 1];
                    if (masteryDef.id === 'tough_mastery') runState.masteryToughPct = masteryDef.values[armorMastery.level - 1];
                }
            }
            const ringMastery = metaState.equipment.ring?.mastery;
            if (ringMastery) {
                const masteryDef = MASTERIES.ring.find(m => m.id === ringMastery.id);
                if (masteryDef) {
                    if (masteryDef.id === 'dodge_mastery') runState.masteryFlatDodge = masteryDef.values[ringMastery.level - 1];
                    if (masteryDef.id === 'pen_mastery') runState.masteryFlatPen = masteryDef.values[ringMastery.level - 1];
                    if (masteryDef.id === 'fortune_mastery') runState.masteryFortuneChance = masteryDef.values[ringMastery.level - 1];
                }
            }

            // ─── DUNGEON MODE: enemy stats ─────────────────
            let eStats;
            if (runState.dungeonMode && runState.runeChamberMode) {
                // Rune Chamber: scale enemies by wave number and player power
                eStats = calcRuneChamberEnemyStats(runState.runeWave || 1, stats);
                runState.enemy = {
                    ...eStats,
                    maxHp: eStats.hp,
                    attackTimer: speedToInterval(eStats.agi),
                    name: eStats.isBoss
                        ? BOSS_NAMES[Math.floor(((runState.runeWave || 1) / 10 - 1) % BOSS_NAMES.length)]
                        : ENEMY_NAMES[Math.floor(((runState.runeWave || 1) - 1) % ENEMY_NAMES.length)],
                };
                // Apply shields etc.
                const tl = runState.talentLevels || {};
                const t2 = (id) => tl[id] || 0;
                if (t2('escudo_vital') > 0) {
                    const shieldPct = TALENT_POOL.defensivo.find(x => x.id === 'escudo_vital').levels[t2('escudo_vital') - 1].shieldPct;
                    const newShield = Math.floor(stats.maxHp * shieldPct / 100);
                    const maxShield = Math.floor(stats.maxHp * 0.35);
                    runState.vitalShield = Math.min(maxShield, (runState.vitalShield || 0) + newShield);
                }
                const totalShield = (runState.vitalShield || 0) + (runState.piedraShield?.amount || 0);
                p.maxHp += totalShield;
                p.hp += totalShield;
                runState.shieldMax = totalShield;
                runState.enemyDebuffs = [];
                runState.enemyBlinded = false;
                runState.frozenTicks = 0;
                runState.freezeCooldown = 0;
                runState.enemySlowTicks = 0;
                runState.enemySlowPct = 0;
                if (t2('desgaste') > 0) {
                    const d = TALENT_POOL.estado.find(x => x.id === 'desgaste').levels[t2('desgaste') - 1];
                    applyDebuff({ id: 'desgaste', type: 'stat_drain', stack: 0, maxStack: d.maxStack, perTick: d.perTick, ticksLeft: 9999, duration: 9999 });
                }
                isFirstAttack = true;
                addLog(`── 🌊 Oleada ${runState.runeWave || 1} ${eStats.isBoss ? '— ⚔️ JEFE ⚔️' : ''} ──`, 'system');
                render();
                if (combatLoop) clearInterval(combatLoop);
                combatLoop = setInterval(combatTick, BALANCE.combat.tickMs);
                updateArena();
                return;
            } else if (runState.dungeonMode) {
                // Tower mode (wave-based)
                if (runState.towerMode) {
                    const wave = runState.towerWave || 1;
                    const enemyPos = runState.towerEnemy || 1;
                    const floorEquivalent = 100 + (wave - 1) * 10 + (enemyPos - 1);
                    const isBossEnemy = enemyPos === 10;
                    const statsForEnemy = calcEnemyStats(floorEquivalent, runState.player, false);
                    const eStatsLocal = { ...statsForEnemy, isBoss: isBossEnemy };
                    runState.enemy = {
                        ...eStatsLocal,
                        maxHp: eStatsLocal.hp,
                        attackTimer: speedToInterval(eStatsLocal.agi),
                        name: eStatsLocal.isBoss
                            ? BOSS_NAMES[Math.floor((floorEquivalent / 10 - 1) % BOSS_NAMES.length)]
                            : ENEMY_NAMES[Math.floor((floorEquivalent - 1) % ENEMY_NAMES.length)],
                    };
                    // Apply shields and initial debuff state
                    const tl = runState.talentLevels || {};
                    const t2 = (id) => tl[id] || 0;
                    if (t2('escudo_vital') > 0) {
                        const shieldPct = TALENT_POOL.defensivo.find(x => x.id === 'escudo_vital').levels[t2('escudo_vital') - 1].shieldPct;
                        const newShield = Math.floor(stats.maxHp * shieldPct / 100);
                        const maxShield = Math.floor(stats.maxHp * 0.35);
                        runState.vitalShield = Math.min(maxShield, (runState.vitalShield || 0) + newShield);
                    }
                    const totalShield = (runState.vitalShield || 0) + (runState.piedraShield?.amount || 0);
                    p.maxHp += totalShield;
                    p.hp += totalShield;
                    runState.shieldMax = totalShield;
                    runState.enemyDebuffs = [];
                    runState.enemyBlinded = false;
                    runState.frozenTicks = 0;
                    runState.freezeCooldown = 0;
                    runState.enemySlowTicks = 0;
                    runState.enemySlowPct = 0;
                    if (t2('desgaste') > 0) {
                        const d = TALENT_POOL.estado.find(x => x.id === 'desgaste').levels[t2('desgaste') - 1];
                        applyDebuff({ id: 'desgaste', type: 'stat_drain', stack: 0, maxStack: d.maxStack, perTick: d.perTick, ticksLeft: 9999, duration: 9999 });
                    }
                    isFirstAttack = true;
                    addLog(`── 🏰 Torre Oleada ${wave} · Enemigo ${enemyPos} ${eStatsLocal.isBoss ? '— ⚔️ JEFE ⚔️' : ''} ──`, 'system');
                    render();
                    if (combatLoop) clearInterval(combatLoop);
                    combatLoop = setInterval(combatTick, BALANCE.combat.tickMs);
                    updateArena();
                    return;
                }
                // Standard dungeon mode (floor-based)
                const floorEquivalent = runState.legacyAbyssMode
                    ? Math.max(100, (metaState.maxFloor || 100) - 20) + (runState.floor - 1) * 8
                    : 100 + (runState.dungeonDifficulty - 1) * 10 + (runState.floor - 1);
                const isBossDungeon = runState.floor === 10;
                const isMinibossDungeon = runState.floor === 5;
                const isBossEnemy = isBossDungeon || isMinibossDungeon;
                eStats = calcEnemyStats(floorEquivalent, runState.player, false);
                // Legacy Abyss: clamp para que nunca sea un paseo
                if (runState.legacyAbyssMode) {
                    eStats.hp = Math.max(eStats.hp, Math.floor(runState.player.maxHp * 0.6));
                    eStats.atk = Math.max(eStats.atk, Math.floor(runState.player.atk * 0.6));
                    eStats.def = Math.max(eStats.def, Math.floor(runState.player.def * 0.6));
                }
                eStats.isBoss = isBossEnemy;
                if (isBossDungeon) eStats.isBoss = true;
            } else {
                // ─── NORMAL MODE: boss tracking ────────────────
                const isBossFloor = !runState.trainingMode && runState.floor % 10 === 0;
                const isFirstBossAttempt = isBossFloor
                    && !metaState.bossAttempted.includes(runState.floor);
                if (isFirstBossAttempt) {
                    metaState.bossAttempted.push(runState.floor);
                    saveGame();
                }

                // Stats del jefe: guardamos las del PRIMER intento y las reusamos siempre.
                if (isBossFloor && metaState.bossStats[runState.floor]) {
                    eStats = metaState.bossStats[runState.floor];
                } else if (isBossFloor && runState.floor === 10 && isFirstBossAttempt) {
                    const fb = BALANCE.enemy.firstBoss;
                    eStats = {
                        hp: fb.hp, atk: fb.atk, def: fb.def,
                        agi: Math.floor(7 * Math.pow(BALANCE.enemy.agiScale, 9)),
                        isBoss: true,
                    };
                    metaState.bossStats[10] = eStats;
                    saveGame();
                } else if (isBossFloor && isFirstBossAttempt) {
                    eStats = calcEnemyStats(runState.floor, runState.player, true);
                    metaState.bossStats[runState.floor] = eStats;
                    saveGame();
                } else {
                    eStats = calcEnemyStats(runState.floor, runState.player, false);
                    if (isBossFloor && !metaState.bossStats[runState.floor]) {
                        metaState.bossStats[runState.floor] = eStats;
                        saveGame();
                    }
                }
            }

            const enemyIsBoss = eStats.isBoss || false;
            runState.enemy = {
                ...eStats,
                maxHp: eStats.hp,
                attackTimer: speedToInterval(eStats.agi),
                name: enemyIsBoss
                    ? BOSS_NAMES[Math.floor((runState.floor / 10 - 1) % BOSS_NAMES.length)]
                    : ENEMY_NAMES[Math.floor((runState.floor - 1) % ENEMY_NAMES.length)],
            };

            // Escudo Vital: persistente entre combates, capped al 35% del HP base
            const tl = runState.talentLevels || {};
            const t = (id) => tl[id] || 0;
            if (t('escudo_vital') > 0) {
                const shieldPct = TALENT_POOL.defensivo.find(x => x.id === 'escudo_vital').levels[t('escudo_vital') - 1].shieldPct;
                const newShield = Math.floor(stats.maxHp * shieldPct / 100);
                const maxShield = Math.floor(stats.maxHp * 0.35);
                runState.vitalShield = Math.min(maxShield, (runState.vitalShield || 0) + newShield);
            }
            // Aplicar escudos al HP (vitalShield + piedraShield)
            const totalShield = (runState.vitalShield || 0) + (runState.piedraShield?.amount || 0);
            p.maxHp += totalShield;
            p.hp += totalShield;
            // Track shield max for bar percentage
            runState.shieldMax = totalShield;

            // W1 — Clear debuffs at start of each combat (safety for edge cases)
            runState.enemyDebuffs = [];
            // Clear estado talent flags between fights (Golpe Cegador, Golpe Helado, Toque Helado)
            runState.enemyBlinded = false;
            runState.frozenTicks = 0;
            runState.freezeCooldown = 0;
            runState.enemySlowTicks = 0;
            runState.enemySlowPct = 0;

            // T11 — Desgaste: initialize stat_drain debuff at combat start
            if (t('desgaste') > 0) {
                const d = TALENT_POOL.estado.find(x => x.id === 'desgaste').levels[t('desgaste') - 1];
                applyDebuff({
                    id: 'desgaste',
                    type: 'stat_drain',
                    stack: 0,
                    maxStack: d.maxStack,
                    perTick: d.perTick,
                    ticksLeft: 9999, // indefinite duration, stacks grow over time
                    duration: 9999,
                });
            }

            isFirstAttack = true;
            addLog(`── Piso ${runState.floor} ${runState.enemy.isBoss ? '— ⚔️ JEFE ⚔️' : ''} ──`, 'system');
            render();

            if (combatLoop) clearInterval(combatLoop);
            combatLoop = setInterval(combatTick, BALANCE.combat.tickMs);
            updateArena();
        }


// Helper: calcula heroBonuses acumulados con sistema escalonado (cada 50 niveles)
function enemyDefeated() {
            arenaEnemyDefeated();
            clearInterval(combatLoop); combatLoop = null;
            addLog(`¡${runState.enemy.name} derrotado!`, 'victory');

            // T17 — Clear debuffs on enemy defeat
            clearDebuffs();

            // Contar bosses derrotados en esta run (para Legado del Héroe)
            if (runState.enemy.isBoss) {
                runState.bossesKilledThisRun = (runState.bossesKilledThisRun || 0) + 1;
            }

            // ─── RUNE SYSTEM: Cosecha proc on kill ────────────
            // Check all equipped runes for Cosecha condition
            const cosechaSlots = ['weapon', 'armor', 'ring'];
            for (const slot of cosechaSlots) {
                const item = metaState.equipment[slot];
                if (!item || !item.runas || !item.runas.conditionId || !item.runas.effectId) continue;
                const rn = item.runas;
                const condDef = findRuneCondition(rn.conditionId);
                if (!condDef || condDef.solve !== 'checkCosecha') continue;
                // Check cooldown
                const cdKey = `${slot}_${rn.effectId}`;
                if (runState.runeCooldowns[cdKey] && runState.runeCooldowns[cdKey] > (runState.tickCount || 0)) continue;
                // Cosecha on kill: grant bonus XP based on enemy max HP
                const effVal = getRuneEffectValue(rn.effectId, rn.effRarity || rn.rarity, rn.effEnhance ?? rn.enhance);
                const bonusXp = Math.max(1, Math.floor((runState.enemy.maxHp || 100) * effVal / 10000));
                addLog(`💀 Cosecha: +${formatNum(bonusXp)} XP extra`, 'rune');
                // Set cooldown from condition values array (S=20, SS=15, SSS=10 ticks)
                const cdTicks = getRuneConditionValue(rn.conditionId, rn.condRarity || rn.rarity);
                runState.runeCooldowns[cdKey] = (runState.tickCount || 0) + (cdTicks || 20);
            }

            // ─── DUNGEON MODE ──────────────────────────────
            if (runState.dungeonMode) {
                // XP (con multiplicador de artefacto)
                const baseXpGain = runState.runeChamberMode ? (runState.runeWave || 1) : (runState.towerMode ? (runState.towerWave || 1) : runState.floor);
                const dXpMult = runState.artifactMult?.xp || 1;
                const xpGain = Math.floor(baseXpGain * dXpMult);
                runState.xp += xpGain;
                const xpLog = dXpMult > 1 ? `+${formatNum(xpGain)} XP (×${dXpMult.toFixed(2)})` : `+${formatNum(xpGain)} XP`;
                addLog(xpLog, 'system');

                // Legacy Abyss: award Legacy Essence on floor completion (NO multiplied by Ciclo del Legado)
                if (runState.legacyAbyssMode) {
                    const hl = metaState.heroLevel;
                    const baseEssence = Math.floor(Math.sqrt(hl) * runState.floor / 50);
                    const isBossFloor = runState.floor === 10;
                    const amount = isBossFloor ? baseEssence * 2 : baseEssence;
                    if (amount > 0) {
                        metaState.heroArtifact.legacyEssence += amount;
                        addLog(`+${amount} 🪶 Esencias de Legado`, 'loot');
                    }
                }

                // Souls display (nothing awarded in dungeon)
                addLog(`+${formatNum(runState.floor * BALANCE.souls.baseMult)} 💀 (display)`, 'system');

                // ─── RUNE CHAMBER MODE ────────────────────────────
                if (runState.runeChamberMode) {
                    // Award rune powder on defeat
                    const isBossWave = (runState.runeWave || 1) % 10 === 0;
                    if (isBossWave) runState.runeChamberBosses = (runState.runeChamberBosses || 0) + 1;
                    const wavePowder = awardRunePowder(runState.runeWave || 1, runState.runeChamberBosses || 0);
                    const gained = wavePowder - (runState.runeAccumulatedPowder || 0);
                    runState.runeAccumulatedPowder = wavePowder;
                    if (gained > 0) {
                        addLog(`🔮 +${gained} Polvo de Runas (total acumulado: ${wavePowder})`, 'loot');
                    }

                    // Advance to next wave with delay
                    runState.runeWave = (runState.runeWave || 1) + 1;
                    runState.furiaStacks = 0;
                    addLog(`⏳ Siguiente oleada en breve...`, 'system');
                    // 0.5s pause then new enemy
                    setTimeout(() => {
                        if (!runState.active) return;
                        startCombat();
                    }, 500);
                    return;
                }

                // ─── TOWER MODE (Cámara Ancestral) ─────────────
                if (runState.towerMode) {
                    const wave = runState.towerWave || 1;
                    const enemyPos = runState.towerEnemy || 1;
                    const floorEquivalent = 100 + (wave - 1) * 10 + (enemyPos - 1);

                    // Essence drop (same as normal mode: boss always, normal 50%)
                    if (!runState.trainingMode) {
                        const essenceDrop = enemyPos === 10 ? 1 : (Math.random() < 0.5 ? 1 : 0);
                        if (essenceDrop > 0) {
                            metaState.essence += essenceDrop;
                            addLog(`+${essenceDrop} 🩸 Esencia`, 'loot');
                        }
                    }

                    // Drop equipment based on enemy position in wave
                    let dropItem = null;
                    if (enemyPos === 10) {
                        // Boss siempre dropea
                        dropItem = generateItem(floorEquivalent, true, { isDungeon: true, isMiniboss: false, dungeonLevel: Math.min(wave, 9) });
                        addLog(`🎁 Drop: ${dropItem.name} (${dropItem.rarity})`, 'loot');
                    } else if (enemyPos === 5) {
                        // Miniboss: 60% chance
                        if (Math.random() * 100 < BALANCE.dungeon.dropRates.minibossChance) {
                            dropItem = generateItem(floorEquivalent, false, { isDungeon: true, isMiniboss: true, dungeonLevel: Math.min(wave, 9) });
                            addLog(`🎁 Drop: ${dropItem.name} (${dropItem.rarity})`, 'loot');
                        }
                    } else {
                        // Normal enemy: 5% drop, siempre Legendario
                        if (Math.random() * 100 < BALANCE.dungeon.dropRates.normalChance) {
                            dropItem = generateItem(floorEquivalent, false, { isDungeon: true, isMiniboss: false, dungeonLevel: Math.min(wave, 9) });
                            addLog(`🎁 Drop: ${dropItem.name} (${dropItem.rarity})`, 'loot');
                        }
                    }
                    if (dropItem) {
                        const result = tryEquip(dropItem);
                        if (result === null) {
                            // Equip comparison modal will handle continuation
                            return;
                        } else if (result) {
                            saveGame();
                        }
                    }

                    // Advance enemy position or complete wave
                    if (enemyPos >= 10) {
                        // Wave complete — show completion message and advance
                        runState.towerWave = wave + 1;
                        runState.towerEnemy = 1;
                        runState.furiaStacks = 0;
                        checkLevelUp();
                        addLog(`✅ ¡Oleada ${wave} completada! Pasando a oleada ${wave + 1}...`, 'victory');
                        setTimeout(() => {
                            if (!runState.active) return;
                            startCombat();
                        }, 500);
                    } else {
                        // Next enemy in same wave
                        runState.towerEnemy = enemyPos + 1;
                        runState.furiaStacks = 0;
                        checkLevelUp();
                        setTimeout(() => {
                            if (!runState.active) return;
                            startCombat();
                        }, 500);
                    }
                    return;
                }

                // Drop (equipment drops only in old Cámara Ancestral floors, not in Tower Mode/Legacy Abyss/Rune Chamber)
                if (!runState.legacyAbyssMode && !runState.runeChamberMode && !runState.towerMode) {
                    const isMiniboss = runState.floor === 5;
                    const isBossFloor = runState.floor === 10;
                    let dropItem = null;
                    if (isBossFloor) {
                        // Boss always drops
                        const floorEquivalent = 100 + (runState.dungeonDifficulty - 1) * 10;
                        dropItem = generateItem(floorEquivalent, true, { isDungeon: true, isMiniboss: false, dungeonLevel: runState.dungeonDifficulty });
                        addLog(`🎁 Drop: ${dropItem.name} (${dropItem.rarity})`, 'loot');
                    } else if (isMiniboss) {
                        // Miniboss: 60% chance
                        if (Math.random() * 100 < BALANCE.dungeon.dropRates.minibossChance) {
                            const floorEquivalent = 100 + (runState.dungeonDifficulty - 1) * 10;
                            dropItem = generateItem(floorEquivalent, false, { isDungeon: true, isMiniboss: true, dungeonLevel: runState.dungeonDifficulty });
                            addLog(`🎁 Drop: ${dropItem.name} (${dropItem.rarity})`, 'loot');
                        }
                    } else {
                        // Normal enemy: 5% drop, always Legendario
                        if (Math.random() * 100 < BALANCE.dungeon.dropRates.normalChance) {
                            const floorEquivalent = 100 + (runState.dungeonDifficulty - 1) * 10;
                            dropItem = generateItem(floorEquivalent, false, { isDungeon: true, isMiniboss: false, dungeonLevel: runState.dungeonDifficulty });
                            addLog(`🎁 Drop: ${dropItem.name} (${dropItem.rarity})`, 'loot');
                        }
                    }
                    if (dropItem) {
                        const result = tryEquip(dropItem);
                        if (result === null) {
                            // Equip comparison modal will handle continuation
                            return;
                        } else if (result) {
                            saveGame();
                        }
                    }
                }

                // Floor 10: dungeon complete!
                if (!runState.runeChamberMode && runState.floor >= 10) {
                    if (runState.legacyAbyssMode) {
                        addLog('🌌 ¡Abismo Eterno completado!', 'victory');
                        runState.active = false;
                        runState.legacyAbyssMode = false;
                        saveGame();
                        render();
                        showDungeonSelection();
                    } else {
                        addLog('🎉 ¡Mazmorra completada!', 'victory');
                        runState.active = false;
                        // Unlock next level
                        const diff = runState.dungeonDifficulty;
                        if (!metaState.dungeon.unlockedLevels.includes(diff)) {
                            metaState.dungeon.unlockedLevels.push(diff);
                        }
                        metaState.dungeon.completedToday = true;
                        saveGame();
                        render();
                        showDungeonComplete();
                    }
                    return;
                }

                // Next floor (for non-rune-chamber dungeons)
                if (!runState.runeChamberMode) {
                    runState.floor++;
                    runState.furiaStacks = 0;
                    checkLevelUp();
                    return;
                }
                return;
            }

            // ─── NORMAL MODE ───────────────────────────────

            // XP (con multiplicador de artefacto)
            const baseXpGain = runState.floor;
            const xpMult = runState.artifactMult?.xp || 1;
            const xpGain = Math.floor(baseXpGain * xpMult);
            runState.xp += xpGain;
            const xpLog = xpMult > 1 ? `+${formatNum(xpGain)} XP (×${xpMult.toFixed(2)})` : `+${formatNum(xpGain)} XP`;
            addLog(xpLog, 'system');

            // Souls per floor (display only — awarded at death, not accumulated)
            const floor = runState.trainingMode ? runState.trainingFloor : runState.floor;
            let soulsPerKill;
            if (runState.trainingMode) {
                // Training: base only, no upgrades, 25%
                soulsPerKill = Math.floor(floor * BALANCE.souls.baseMult * 0.25);
            } else {
                soulsPerKill = Math.floor(floor * BALANCE.souls.baseMult + (floor * metaState.upgrades.souls.level * metaState.upgrades.souls.flat));
            }
            addLog(`+${formatNum(soulsPerKill)} 💀`, 'system');

            // ─── ARMAS (spec): Maestro de Armas — next hit ×N on kill ───
            if (metaState.playerSpec === 'arms' && metaState.heroLevel >= 100) {
                const armsMult = getSpecPassiveValue('arms', 'mult', metaState.heroLevel);
                if (armsMult > 1) {
                    runState.nextHitMult = armsMult;
                    addLog('⚔️ Maestro de Armas: próximo golpe potenciado.', 'system');
                }
            }

            // ─── DEMONOLOGÍA (spec): Esencia Demoníaca — invocar demonio ───
            if (metaState.playerSpec === 'demonology' && metaState.heroLevel >= 100 && !runState.trainingMode) {
                const demoChance = getSpecPassiveValue('demonology', 'chance', metaState.heroLevel);
                const demoHits = getSpecPassiveValue('demonology', 'hits', metaState.heroLevel);
                if (demoChance > 0 && Math.random() * 100 < demoChance) {
                    runState.demonActive = true;
                    runState.demonHitsLeft = demoHits;
                    addLog(`👹 ¡Demonio invocado! (${demoHits} golpes)`, 'system');
                }
            }

            // Essence drop (solo modo normal — jefe siempre, normal 50%)
            if (!runState.trainingMode) {
                const essenceDrop = runState.enemy.isBoss ? 1 : (Math.random() < 0.5 ? 1 : 0);
                if (essenceDrop > 0) {
                    metaState.essence += essenceDrop;
                    addLog(`+${essenceDrop} 🩸`, 'loot');
                }
            }

            // Drop de equipo
            let equipPending = false;
            if (metaState.unlockedEquipment) {
                const dropMult = runState.artifactMult?.drop || 1;
                const dropChance = Math.min(100, BALANCE.equipment.dropBaseChance * dropMult);
                if (Math.random() * 100 < dropChance || runState.enemy.isBoss) {
                    const item = generateItem(runState.floor, runState.enemy.isBoss);
                    addLog(`🎁 Drop: ${item.name}`, 'loot');
                    const result = tryEquip(item);
                    if (result === null) {
                        equipPending = true; // esperando decisión del jugador
                    } else if (result) {
                        saveGame();
                    }
                }
            }

            // Desbloquear equipo tras Boss 1
            if (runState.floor === 10 && !metaState.unlockedEquipment) {
                metaState.unlockedEquipment = true;
                addLog('🔓 ¡SISTEMA DE EQUIPO DESBLOQUEADO!', 'victory');
                saveGame();
            }

            if (equipPending) return; // el modal de comparación reanudará después

            // Training mode: no talents, no floor up, just increment counter
            if (runState.trainingMode) {
                runState.enemiesDefeated++;
                runState.furiaStacks = 0;
                checkLevelUp();
                return;
            }

            // Talento basado en piso (cada 5 pisos)
            if (runState.floor % 5 === 0) {
                showTalentChoice(runState.floor);
                return; // floor++ y reanudar se difieren a closeChoice()
            }

            runState.floor++;
            runState.furiaStacks = 0; // Furia Creciente se resetea entre pisos
            checkLevelUp();
        }


function playerDied() {
            // Talento: Resurrección (revivir una vez por combate)
            if (runState.talentLevels['resurreccion'] > 0 && !runState.hasRevived) {
                const res = TALENT_POOL.heroico.find(x => x.id === 'resurreccion').levels[runState.talentLevels['resurreccion'] - 1];
                runState.hasRevived = true;
                runState.player.hp = Math.floor(runState.player.maxHp * res.healPct / 100);
                addLog(`✨ ¡Resurrección! Reviviste con ${res.healPct}% HP.`, 'system');
                spawnFloat('player-floats', '✨RESUCITA!', 'heal');
                render();
                return; // No morir, continuar combate
            }

            clearInterval(combatLoop); combatLoop = null;
            runState.active = false;
            arenaPlayerDied();

            if (runState.trainingMode) {
                // Training mode: base only, 25% per kill, no upgrades
                const killed = runState.enemiesDefeated;
                let totalSouls = 0;
                if (killed > 0) {
                    const soulsPerEnemy = Math.floor(runState.trainingFloor * BALANCE.souls.baseMult * 0.25);
                    totalSouls = soulsPerEnemy * killed;
                    // Maestría Afortunada: chance de duplicar almas
                    if (runState.masteryFortuneChance > 0 && Math.random() * 100 < runState.masteryFortuneChance) {
                        totalSouls = Math.floor(totalSouls * 2);
                        addLog('🍀 ¡Maestría Afortunada duplica las almas!', 'loot');
                    }
                    metaState.souls += totalSouls;
                    addLog(`💀 Entrenamiento terminado. Enemigos derrotados: ${killed}. +${formatNum(totalSouls)} almas.`, 'death');
                } else {
                    addLog(`💀 Entrenamiento terminado. No derrotaste ningún enemigo.`, 'death');
                }
                runState.trainingMode = false;
                runState.enemiesDefeated = 0;
                render();
                saveGame();
                updateButtons();
                return;
            }

            // Dungeon mode: return to dungeon selection (no souls/leaderboard/essence)
            if (runState.dungeonMode) {
                // Rune Chamber: award accumulated powder on death
                if (runState.runeChamberMode) {
                    const finalPowder = runState.runeAccumulatedPowder || 0;
                    if (finalPowder > 0) {
                        metaState.runePowder += finalPowder;
                        addLog(`🔮 Cámara terminada. Ganaste ${finalPowder} Polvo de Runas.`, 'loot');
                        saveGame();
                    } else {
                        addLog(`🔮 Cámara terminada. No acumulaste Polvo de Runas.`, 'system');
                    }
                } else if (runState.towerMode) {
                    const wave = runState.towerWave || 1;
                    const enemyPos = runState.towerEnemy || 1;
                    addLog(`💀 Caíste en la Cámara Ancestral (Oleada ${wave} · Enemigo ${enemyPos}/10).`, 'death');
                } else {
                    addLog(`💀 Caíste en la mazmorra (piso ${runState.floor}).`, 'death');
                }
                runState.dungeonMode = false;
                runState.legacyAbyssMode = false;
                runState.runeChamberMode = false;
                runState.towerMode = false;
                runState.dungeonDifficulty = 0;
                render();
                updateButtons();
                showDungeonSelection();
                return;
            }

            // Tower mode: original formula — souls based on floor reached, one-time payment at death
            const soulsMult = runState.artifactMult?.souls || 1;
            let totalSouls = Math.floor((runState.floor * BALANCE.souls.baseMult + (runState.floor * metaState.upgrades.souls.level * metaState.upgrades.souls.flat)) * soulsMult);
            // Maestría Afortunada: chance de duplicar almas
            if (runState.masteryFortuneChance > 0 && Math.random() * 100 < runState.masteryFortuneChance) {
                totalSouls = Math.floor(totalSouls * 2);
                addLog('🍀 ¡Maestría Afortunada duplica las almas!', 'loot');
            }
            metaState.souls += totalSouls;
            metaState.maxFloor = Math.max(metaState.maxFloor, runState.floor);
            // Unlock training mode when reaching floor 30
            if (metaState.maxFloor >= 30 && !metaState.unlockedTraining) {
                metaState.unlockedTraining = true;
                addLog('🏋️ ¡Sala de Entrenamiento desbloqueada!', 'victory');
            }
            // Unlock reforge when reaching floor 100
            if (metaState.maxFloor >= 100 && !metaState.unlockedReforge) {
                metaState.unlockedReforge = true;
                addLog('🔨 ¡Forja desbloqueada! Ahora podés reforjar maestrías y maximizar equipo.', 'victory');
                saveGame();
            }
            addLog(`💀 Caíste en el piso ${runState.floor}. +${formatNum(totalSouls)} almas.`, 'death');

            // Leaderboard entry (tower mode only) — una entrada por persona
            if (runState.runStartTime) {
                const elapsed = Date.now() - runState.runStartTime;
                const existing = metaState.leaderboard.find(e => e.name === metaState.playerName);
                if (existing) {
                    if (metaState.maxFloor > existing.maxFloor) {
                        // Nuevo récord de piso — siempre actualiza
                        existing.maxFloor = metaState.maxFloor;
                        existing.heroLevel = metaState.heroLevel;
                        existing.runTime = formatRunTime(elapsed);
                        existing.runTimeMs = elapsed;
                        existing.date = Date.now();
                    } else if (metaState.maxFloor === existing.maxFloor) {
                        // Mismo piso — solo actualiza si el tiempo es mejor
                        if (existing.runTimeMs === undefined || elapsed < existing.runTimeMs) {
                            existing.runTime = formatRunTime(elapsed);
                            existing.runTimeMs = elapsed;
                            existing.date = Date.now();
                        }
                    }
                } else {
                    const lbClass = metaState.playerClass ? getClassName(metaState.playerClass) : 'Héroe';
                    metaState.leaderboard.push({
                        name: metaState.playerName,
                        class: lbClass,
                        heroLevel: metaState.heroLevel,
                        maxFloor: metaState.maxFloor,
                        runTime: formatRunTime(elapsed),
                        runTimeMs: elapsed,
                        date: Date.now(),
                    });
                }
                // Sort by maxFloor desc, then date desc (most recent first on ties)
                metaState.leaderboard.sort((a, b) => b.maxFloor - a.maxFloor || b.date - a.date);
                // Keep only top 10
                metaState.leaderboard = metaState.leaderboard.slice(0, 10);
            }

            render();
            saveGame();
            // Show death recap overlay (normal mode only)
            showRecap();
        }

        // Helper: calcula heroBonuses acumulados con sistema escalonado (cada 50 niveles)

function calcTieredBonuses(level) {
            let hp = 0, atk = 0, def = 0, agi = 0;
            for (let i = 1; i <= level; i++) {
                const tier = Math.ceil(i / 50);
                hp += 10 * tier;
                atk += 1 * tier;
                def += 1 * tier;
                agi += 1 * tier;
            }
            return { hp, atk, def, agi };
        }  Game.combat = {
    startCombat: startCombat,
    enemyDefeated: enemyDefeated,
    playerDied: playerDied,
    calcTieredBonuses: calcTieredBonuses
  };

  window.startCombat = startCombat;
  window.enemyDefeated = enemyDefeated;
  window.playerDied = playerDied;
  window.calcTieredBonuses = calcTieredBonuses;
})();
