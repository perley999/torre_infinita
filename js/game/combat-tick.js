// combat-tick.js — main combat resolution loop (formerly inline in Torre_Infinita.html).
// Extracted in F4a of the separate-ui-logic refactor.
// PARTIAL: combatTick was the only combat section that stayed inline after F3.
// combat.js handles startCombat / enemyDefeated / playerDied / calcTieredBonuses.
//
// combatLoop e isFirstAttack deben ser accesibles desde otros scripts
// (combat.js los asigna, inline HTML los lee/limpia en endTraining y restartRun,
// state.js los limpia en resetGame). Se declaran con `var` a nivel top-level
// del archivo (no dentro del IIFE) para que vivan en el script-global lexical
// env y en `window`, igual que cuando eran `let` en el inline script.
var combatLoop = null;
var isFirstAttack = true;

(function() {
  'use strict';
  window.Game = window.Game || {};

function combatTick() {
            if (!runState.active || !runState.enemy || runState.pendingChoice) return;

            const p = runState.player;
            const e = runState.enemy;
            const derived = getDerivedStats(p.atk, p.def, p.agi);
            const tl = runState.talentLevels;
            const t = (id) => tl[id] || 0;

            // Lifesteal: equipment (DR) + maestría vampírica (flat post-DR) + asalto vampírico (flat post-DR, aplica a TODO)
            const baseLifestealDR = diminishingReturns((p.lifesteal || 0), BALANCE.combat.lifestealCap, BALANCE.combat.lifestealK);
            const masteryLifesteal = (runState.masteryFlatLifesteal || 0);
            let currentLifesteal = Math.min(baseLifestealDR + masteryLifesteal, BALANCE.combat.lifestealCap);
            if (t('asalto_vampirico') > 0) {
                const av = TALENT_POOL.sustain.find(x => x.id === 'asalto_vampirico').levels[t('asalto_vampirico') - 1];
                currentLifesteal = Math.min(currentLifesteal + av.flatLifesteal, BALANCE.combat.lifestealCap);
            }

            // ─── CLASE: Pacto Oscuro (Warlock) — lifesteal boost ───
            let warlockDotDmgPct = 0;
            if (metaState.playerClass === 'warlock' && metaState.heroLevel >= 50) {
                const pacto = getClassPassiveValue('pacto_oscuro', null, metaState.heroLevel);
                if (pacto) {
                    currentLifesteal = Math.min(currentLifesteal + (pacto.lifestealPct || 0), BALANCE.combat.lifestealCap);
                    warlockDotDmgPct = pacto.dotDmgPct || 0;
                }
            }

            // ─── CLASE: Flujo de Chi (Monk) — dodge boost ───
            let monkDodgeBonus = 0;
            if (metaState.playerClass === 'monk' && metaState.heroLevel >= 50) {
                const flujo = getClassPassiveValue('flujo_chi', null, metaState.heroLevel);
                if (flujo) {
                    monkDodgeBonus = flujo.dodgePct || 0;
                }
            }

            // T5 — Process debuffs at TOP of combatTick (pass warlockDotDmgPct for DoT boost, talentDmgMult)
            const talentDmgMult = runState.artifactMult?.talentDmg || 1;
            processDebuffs(currentLifesteal, warlockDotDmgPct, talentDmgMult);

            // ─── RUNE SYSTEM: tick counter, conditions and buffs ───
            runState.tickCount = (runState.tickCount || 0) + 1;
            processRuneConditions(p, e, runState.tickCount);
            processRuneBuffs(runState.tickCount);

            // ─── Stagger damage over time (Maestro Cervecero spec) ───
            if (runState._staggerDmg && runState._staggerDmg > 0) {
                if (!runState._staggerTick) runState._staggerTick = 0;
                runState._staggerTick++;
                if (runState._staggerTick >= 2) { // Every 2 ticks (200ms) apply stagger
                    runState._staggerTick = 0;
                    const perTick = Math.max(1, Math.floor(runState._staggerDmg / 20));
                    const actual = Math.min(perTick, runState._staggerDmg);
                    runState._staggerDmg -= actual;
                    p.hp -= actual;
                    spawnFloat('player-floats', `-${formatNum(actual)} 🍺`, 'normal');
                    if (runState._staggerDmg <= 0) {
                        runState._staggerDmg = 0;
                        runState._staggerTick = 0;
                    }
                }
            }

            // Golpe Helado: decrement frozen ticks and cooldown every tick
            if (runState.frozenTicks > 0) runState.frozenTicks--;
            if (runState.freezeCooldown > 0) runState.freezeCooldown--;
            // Toque Helado: decrement slow ticks
            if (runState.enemySlowTicks > 0) runState.enemySlowTicks--;

            // Piel de Piedra: decrement shield ticks
            if (runState.piedraShield && runState.piedraShield.ticksLeft > 0) {
                runState.piedraShield.ticksLeft--;
                if (runState.piedraShield.ticksLeft <= 0) {
                    runState.piedraShield.amount = 0;
                    runState.piedraShield.ticksLeft = 0;
                }
            }

            // Equipment crit rating converts to % with ratio 13 (linear conversion)
            const equipCritPct = (p.critRating || 0) / 13;
            const baseCrit = derived.crit + equipCritPct;
            let preciseBonus = 0;
            if (t('golpe_preciso') > 0) {
                preciseBonus = TALENT_POOL.ofensivo.find(x => x.id === 'golpe_preciso').levels[t('golpe_preciso') - 1].flatCrit;
            }

            // Talento: Sangre Fría (crit garantizado cada N ataques)
            let sangreFriaProc = false;
            let masteryCritFlat = runState.masteryFlatCrit || 0;
            if (t('sangre_fria') > 0) {
                const everyN = TALENT_POOL.ofensivo.find(x => x.id === 'sangre_fria').levels[t('sangre_fria') - 1].everyN;
                if (!runState.critMasteryCounter) runState.critMasteryCounter = 0;
                runState.critMasteryCounter++;
                if (runState.critMasteryCounter >= everyN) {
                    runState.critMasteryCounter = 0;
                    masteryCritFlat = 100; // garantizado
                    sangreFriaProc = true;
                }
            }

            const rawCrit = baseCrit + preciseBonus;
            const critBonus = metaState.upgrades.crit.level * metaState.upgrades.crit.percent * 100;
            const totalCrit = Math.floor(diminishingReturns(rawCrit, BALANCE.combat.critCap, BALANCE.combat.critK)) + masteryCritFlat + critBonus;

            // Talento: Trinidad (flat crit, dodge, block)
            let trinityFlat = 0;
            if (t('trinidad') > 0) {
                trinityFlat = TALENT_POOL.heroico.find(x => x.id === 'trinidad').levels[t('trinidad') - 1].flatEach;
            }

            const baseDodge = derived.dodge;
            const equipDodgePct = (p.dodgeRating || 0) / BALANCE.combat.dodgeRatingRatio;
            const rawDodge = baseDodge + equipDodgePct;
            const totalDodge = Math.floor(diminishingReturns(rawDodge, BALANCE.combat.dodgeCap, BALANCE.combat.dodgeK)) + (runState.masteryFlatDodge || 0) + (t('reflejos_felinos') > 0 ? TALENT_POOL.defensivo.find(x => x.id === 'reflejos_felinos').levels[t('reflejos_felinos') - 1].flatDodge : 0) + trinityFlat + (monkDodgeBonus || 0);
            const totalBlock = Math.floor(diminishingReturns(derived.block, BALANCE.combat.blockCap, BALANCE.combat.blockK)) + (runState.masteryFlatBlock || 0) + trinityFlat;

            // Diminishing returns for percentage stats
            const penMetaBonus = metaState.upgrades.pen.level * metaState.upgrades.pen.percent * 100;
            const effPen = diminishingReturns(p.pen || 0, BALANCE.combat.penCap, BALANCE.combat.penK) + (runState.masteryFlatPen || 0) + penMetaBonus;
            const effCritDmg = diminishingReturns(p.critDamage || 0, BALANCE.combat.critDmgCap, BALANCE.combat.critDmgK);
            const effBossDmg = diminishingReturns(p.bossDamage || 0, BALANCE.combat.bossDmgCap, BALANCE.combat.bossDmgK)
                + (metaState.upgrades.bossDmg.level * metaState.upgrades.bossDmg.percent * 100);
            const effHpRegen = diminishingReturns(p.hpRegen || 0, 15, 150) // 15% max regen cap (solo equipo)
                + (runState.masteryFlatRegen || 0); // Maestría Regenerativa: flat post-DR, sin cap

            // HP Regeneration (each second = 10 ticks)
            if (effHpRegen > 0 && p.tickCount === undefined) p.tickCount = 0;
            if (effHpRegen > 0) {
                p.tickCount = (p.tickCount || 0) + 1;
                if (p.tickCount >= 10) {
                    p.tickCount = 0;
                    const regen = Math.floor(p.maxHp * effHpRegen / 100);
                    if (regen > 0 && p.hp < p.maxHp) {
                        p.hp = Math.min(p.maxHp, p.hp + regen);
                        spawnFloat('player-floats', `+${formatNum(regen)}`, 'heal');
                        if (runState.recap) runState.recap.heal.hp_regen += regen;
                    }
                }
            }

            // T8 — Furia Ardiente: every 1s, fire damage + chance to burn
            if (t('furia_ardiente') > 0) {
                if (p.furiaArdienteTick === undefined) p.furiaArdienteTick = 0;
                p.furiaArdienteTick++;
                if (p.furiaArdienteTick >= 10) { // 10 ticks = 1 second
                    p.furiaArdienteTick = 0;
                    const fa = TALENT_POOL.defensivo.find(x => x.id === 'furia_ardiente').levels[t('furia_ardiente') - 1];

                    // Fire damage based on enemy max HP
                    const fireDmg = Math.floor(e.maxHp * fa.dmgPctPerTick / 100);
                    e.hp -= fireDmg;
                    if (runState.recap) runState.recap.dmg.furia_ardiente += fireDmg;
                    if (currentLifesteal > 0) {
                        const heal = Math.floor(fireDmg * currentLifesteal / 100);
                        if (heal > 0) {
                            p.hp = Math.min(p.maxHp, p.hp + heal);
                            spawnFloat('player-floats', `+${formatNum(heal)} 🔥`, 'heal');
                            if (runState.recap) runState.recap.heal.lifesteal += heal;
                        }
                    }
                    spawnFloat('enemy-floats', `-${formatNum(fireDmg)} 🔥`, 'crit', 'left');

                    // 20% chance to apply/refresh burn (3s = 30 ticks)
                    if (Math.random() * 100 < fa.chance) {
                        const existing = runState.enemyDebuffs.filter(d => d.id === 'quemadura');
                        if (existing.length > 0) {
                            existing[0].ticksLeft = 30;
                            existing[0].duration = 30;
                        } else {
                            applyDebuff({
                                id: 'quemadura',
                                type: 'burn',
                                ticksLeft: 30,
                                duration: 30,
                                atkReductionPct: fa.atkReductionPct,
                                maxStack: 1,
                            });
                        }
                    }
                }
            }

            // ─── CLASE: Flujo de Chi (Monk) — speed override post-cap ───
            let monkSpeedPct = 0;
            if (metaState.playerClass === 'monk' && metaState.heroLevel >= 50) {
                const flujo = getClassPassiveValue('flujo_chi', null, metaState.heroLevel);
                if (flujo) monkSpeedPct = flujo.speedPct || 0;
            }

            // ─── CLASE: Ráfaga de Golpes (Warrior) — count hits ───
            // Reset classHits if enemy changed (new enemy)
            if (!runState._lastEnemyId || runState._lastEnemyId !== runState.enemy?.name + runState.floor) {
                runState.classHits = 0;
                runState.runeComboHits = 0;
                runState._lastEnemyId = runState.enemy?.name + runState.floor;
            }

            // ─── CLASE: Golpe Sigiloso (Rogue) — track per enemy ───
            if (!runState._rogueEnemyId || runState._rogueEnemyId !== runState.enemy?.name + runState.floor) {
                runState.firstHitDone = false;
                runState._rogueEnemyId = runState.enemy?.name + runState.floor;
            }

            // Jugador ataca
            p.attackTimer -= BALANCE.combat.tickMs;
            if (p.attackTimer <= 0) {
                // Visual feedback: player is attacking
                triggerAttackEffect('player-card');
                
                // Apply Monk Flujo de Chi: speed% post-cap with 750ms floor
                let attackInterval = speedToInterval(p.agi);
                if (monkSpeedPct > 0) {
                    attackInterval = Math.floor(attackInterval * (1 - monkSpeedPct / 100));
                    attackInterval = Math.max(750, attackInterval);
                }
                // Rune system: Ímpetu speed buff
                const impetuBuff = runState.runeBuffs.find(b => b.effectId === 'impetu' && b.type === 'atkSpd');
                if (impetuBuff) {
                    attackInterval = Math.floor(attackInterval * (1 - impetuBuff.value));
                    attackInterval = Math.max(750, attackInterval);
                }
                p.attackTimer = attackInterval;

                // ─── Forajido (spec): Golpe de Oportunidad — extra attack chance ───
                let extraAttacks = 0;
                if (metaState.playerSpec === 'outlaw' && metaState.heroLevel >= 100) {
                    const outlawVal = getSpecPassiveValue('outlaw', 'chance', metaState.heroLevel);
                    if (outlawVal && Math.random() * 100 < outlawVal) {
                        extraAttacks = 1;
                    }
                }
                
                let attacks = 1 + extraAttacks;
                // Talento: Multiataque
                if (t('multiataque') > 0) {
                    const m = TALENT_POOL.ofensivo.find(x => x.id === 'multiataque').levels[t('multiataque') - 1];
                    if (Math.random() * 100 < m.chance) attacks += m.hits - 1;
                }

                // ─── Tejedor de Bruma (spec): Armonía Celestial — heal every 5 attacks ───
                if (metaState.playerSpec === 'mistweaver' && metaState.heroLevel >= 100) {
                    runState.attackCounter++;
                    if (runState.attackCounter >= 5) {
                        runState.attackCounter = 0;
                        const mistHealPct = getSpecPassiveValue('mistweaver', 'healPct', metaState.heroLevel);
                        if (mistHealPct > 0) {
                            const heal = Math.floor(p.maxHp * mistHealPct / 100);
                            p.hp = Math.min(p.maxHp, p.hp + heal);
                            spawnFloat('player-floats', `+${formatNum(heal)} (bruma)`, 'heal');
                        }
                    }
                }

                // ─── Demonología (spec): demonio activo pega ───
                if (runState.demonActive && runState.demonHitsLeft > 0) {
                    const demonDmg = Math.floor(p.atk * 0.5);
                    e.hp -= demonDmg;
                    runState.demonHitsLeft--;
                    spawnFloat('enemy-floats', `-${formatNum(demonDmg)} 👹`, 'crit', 'right');
                    if (runState.demonHitsLeft <= 0) runState.demonActive = false;
                }

                for (let i = 0; i < attacks; i++) {
                    // Apply penetration: ignore % of enemy DEF
                    let penPct = effPen;
                    if (t('golpe_penetrante') > 0) {
                        penPct += TALENT_POOL.ofensivo.find(x => x.id === 'golpe_penetrante').levels[t('golpe_penetrante') - 1].penPct;
                    }
                    const effectiveDef = Math.max(0, Math.floor(e.def * (1 - penPct / 100)));
                    let dmg = calcDamage(p.atk, effectiveDef);
                    let type = 'normal';

                    // RECAP: normal base damage (first hit)
                    const rc = runState.recap;
                    if (i === 0 && rc) rc.dmg.normal += dmg;
                    // RECAP: extra multiataque hits go to multiataque counter
                    if (i > 0 && rc) rc.dmg.multiataque += dmg;

                    // Talento: Primer Golpe
                    if (isFirstAttack && t('primer_golpe') > 0) {
                        const preDmg = dmg;
                        const mult = TALENT_POOL.ofensivo.find(x => x.id === 'primer_golpe').levels[t('primer_golpe') - 1].dmgMult;
                        dmg = Math.floor(dmg * mult);
                        if (rc) rc.dmg.primer_golpe += dmg - preDmg;
                    }

                    // Talento: Furia Creciente
                    if (t('furia_creciente') > 0) {
                        const preDmg = dmg;
                        const f = TALENT_POOL.ofensivo.find(x => x.id === 'furia_creciente').levels[t('furia_creciente') - 1];
                        if (!runState.furiaStacks) runState.furiaStacks = 0;
                        runState.furiaStacks++;
                        const stacks = Math.min(runState.furiaStacks, f.maxStack);
                        const bonus = f.perHit * stacks;
                        if (bonus > 0) dmg = Math.floor(dmg * (1 + bonus / 100));
                        if (rc) rc.dmg.furia_creciente += dmg - preDmg;
                    }

// Talento: Golpe Rápido (bonus tras esquivar, un solo golpe)
                     if (runState.golpeBonus > 0) {
                         const preDmg = dmg;
                         dmg = Math.floor(dmg * (1 + runState.golpeBonus / 100));
                         runState.golpeBonus = 0;
                         if (rc) rc.dmg.golpe_rapido += dmg - preDmg;
                     }

                    // Crit: base 1.5x + bonus from equipment (capped at 650% total = 6.5x)
                    if (Math.random() * 100 < totalCrit) {
                        const preDmg = dmg;
                        const critDmgBonus = metaState.upgrades.critDmg.level * metaState.upgrades.critDmg.percent * 100;
                        const critMult = 1.5 + (effCritDmg + critDmgBonus) / 100;
                        dmg = Math.floor(dmg * critMult);
                        type = 'crit';
                        if (rc) {
                            if (sangreFriaProc) {
                                rc.dmg.sangre_fria += dmg - preDmg;
                            } else {
                                rc.dmg.crit += dmg - preDmg;
                            }
                        }
                    }

                    // ─── CLASE: Ráfaga de Golpes (Warrior) — 4th hit ×N ───
                    if (metaState.playerClass === 'warrior' && metaState.heroLevel >= 50) {
                        runState.classHits++;
                        if (runState.classHits >= 4) {
                            runState.classHits = 0;
                            const rafaga = getClassPassiveValue('rafaga_golpes', 'mult', metaState.heroLevel);
                            if (rafaga > 1) {
                                const preDmg = dmg;
                                dmg = Math.floor(dmg * rafaga);
                                spawnFloat('enemy-floats', '🌪️RÁFAGA!', 'crit', 'left');
                                if (rc) dmg = dmg; // track if needed
                            }
                        }
                    }

                    // ─── CLASE: Golpe Sigiloso (Rogue) — first hit always crit + bonus ───
                    if (metaState.playerClass === 'rogue' && metaState.heroLevel >= 50 && !runState.firstHitDone) {
                        runState.firstHitDone = true;
                        const sigiloso = getClassPassiveValue('golpe_sigiloso', 'bonusDmg', metaState.heroLevel);
                        // Force this hit to be a crit with bonus damage
                        const preDmg = dmg;
                        const critDmgBonus = metaState.upgrades.critDmg.level * metaState.upgrades.critDmg.percent * 100;
                        const rogueCritMult = 1.5 + (effCritDmg + critDmgBonus) / 100 + (sigiloso || 0) / 100;
                        dmg = Math.floor(dmg * rogueCritMult);
                        type = 'crit';
                        spawnFloat('enemy-floats', '🗡️SIGILO!', 'crit', 'left');
                        if (rc) rc.dmg.crit += dmg - preDmg;
                    }

                    // ─── ARMAS (spec): Maestro de Armas — next hit ×N ───
                    if (runState.nextHitMult > 1) {
                        const preDmg = dmg;
                        dmg = Math.floor(dmg * runState.nextHitMult);
                        runState.nextHitMult = 1;
                        spawnFloat('enemy-floats', '⚔️MAESTRO!', 'crit', 'left');
                    }

                    // ─── FURIA (spec): Frenesí de Batalla — +X% ATK per hit, max 10 ───
                    if (metaState.playerSpec === 'fury' && metaState.heroLevel >= 100) {
                        runState.classComboStacks = Math.min((runState.classComboStacks || 0) + 1, 10);
                        const furyAtk = getSpecPassiveValue('fury', 'atkPerHit', metaState.heroLevel);
                        if (furyAtk > 0 && runState.classComboStacks > 1) {
                            const preDmg = dmg;
                            const furyMult = 1 + (furyAtk * runState.classComboStacks) / 100;
                            dmg = Math.floor(dmg * furyMult);
                        }
                    }

                    // ─── PROTECCIÓN (spec): Muro de Escudo — DEF→ATK conversion ───
                    if (metaState.playerSpec === 'protection' && metaState.heroLevel >= 100) {
                        const muro = getSpecPassiveValue('protection', null, metaState.heroLevel);
                        if (muro && muro.defToAtkPct > 0) {
                            const preDmg = dmg;
                            const defToAtk = Math.floor(p.def * muro.defToAtkPct / 100);
                            if (defToAtk > 0) {
                                dmg += defToAtk;
                            }
                        }
                    }

                    // ─── DESTRUCCIÓN (spec): Caos Ardiente — +crit chance, crits ×Y ───
                    if (metaState.playerSpec === 'destruction' && metaState.heroLevel >= 100) {
                        const caos = getSpecPassiveValue('destruction', null, metaState.heroLevel);
                        if (caos) {
                            // Add to effective crit chance and crit multiplier
                            const destrCritChance = caos.critPct || 0;
                            if (Math.random() * 100 < destrCritChance) {
                                const preDmg = dmg;
                                const critDmgBonus = metaState.upgrades.critDmg.level * metaState.upgrades.critDmg.percent * 100;
                                const destrCritMult = 1.5 + (effCritDmg + critDmgBonus) / 100;
                                const caosMult = caos.critMult || 3.5;
                                dmg = Math.floor(dmg * Math.max(destrCritMult, caosMult));
                                type = 'crit';
                                if (rc) rc.dmg.crit += dmg - preDmg;
                            }
                        }
                    }

                    // ─── VAGABUNDO DEL VIENTO (spec): Tormenta de Patadas ───
                    if (metaState.playerSpec === 'windwalker' && metaState.heroLevel >= 100) {
                        runState.dodgeStreak = (runState.dodgeStreak || 0) + 1;
                        if (runState.dodgeStreak >= 4) {
                            runState.dodgeStreak = 0;
                            const windBonus = getSpecPassiveValue('windwalker', 'dmgPct', metaState.heroLevel);
                            if (windBonus > 0) {
                                const preDmg = dmg;
                                dmg = Math.floor(dmg * (1 + windBonus / 100));
                                spawnFloat('enemy-floats', '🌪️PATADA!', 'crit', 'left');
                            }
                        }
                    }

                    // ─── SUTILEZA (spec): Danza de Sombras — from dodge bonus ───
                    // (Handled in enemy attack section, but apply the stored multiplier here)
                    if (runState.nextHitMult > 1) {
                        // Already handled above, but check if from Sutileza
                        // nextHitMult is consumed above in Armas check. Use separate tracker.
                    }

                    // ─── ASESINATO (spec): Venenos Letales — poison on hit ───
                    if (metaState.playerSpec === 'assassination' && metaState.heroLevel >= 100) {
                        const asesinato = getSpecPassiveValue('assassination', null, metaState.heroLevel);
                        if (asesinato && Math.random() * 100 < (asesinato.chance || 0)) {
                            const poisonDmg = Math.max(1, Math.floor(e.maxHp * (asesinato.dmgPct || 0) / 100 / 3));
                            e.hp -= poisonDmg;
                            spawnFloat('enemy-floats', `-${formatNum(poisonDmg)} ☠️`, 'crit', 'right');
                        }
                    }

                    // Maestría Furiosa: contador por ataque del héroe, proc en el mismo golpe
                    const furyMastery = metaState.equipment.weapon?.mastery;
                    if (furyMastery?.id === 'fury') {
                        const thresholds = [7, 5, 3];
                        const threshold = thresholds[furyMastery.level - 1];
                        runState.furyCounter++;
                        if (runState.furyCounter >= threshold) {
                            const preDmg = dmg;
                            runState.furyCounter = 0;
                            dmg = Math.floor(dmg * 2);
                            spawnFloat('enemy-floats', 'FURIA!', 'crit', 'left');
                            if (rc) rc.dmg.furia_mastery += dmg - preDmg;
                        }
                    }

                    // Talento: Golpe Brutal
                    if (t('golpe_brutal') > 0) {
                        const chance = TALENT_POOL.ofensivo.find(x => x.id === 'golpe_brutal').levels[t('golpe_brutal') - 1].chance;
                        if (Math.random() * 100 < chance) {
                            const preDmg = dmg;
                            dmg *= 3;
                            type = 'crit';
                            if (rc) rc.dmg.golpe_brutal += dmg - preDmg;
                        }
                    }

                    // Talento: Ejecución
                    if (t('ejecucion') > 0) {
                        const ex = TALENT_POOL.ofensivo.find(x => x.id === 'ejecucion').levels[t('ejecucion') - 1];
                        if (e.hp < e.maxHp * ex.threshold) {
                            const preDmg = dmg;
                            dmg = Math.floor(dmg * ex.mult);
                            type = 'crit';
                            if (rc) rc.dmg.ejecucion += dmg - preDmg;
                        }
                    }

                    // Talento: Cañón de Cristal (bonus de daño siempre)
                    if (t('canon_cristal') > 0) {
                        const preDmg = dmg;
                        const cc = TALENT_POOL.ofensivo.find(x => x.id === 'canon_cristal').levels[t('canon_cristal') - 1];
                        dmg = Math.floor(dmg * (1 + cc.dmgBonus / 100));
                        if (rc) rc.dmg.canon_cristal += dmg - preDmg;
                    }

                    // Boss damage bonus
                    if (e.isBoss && effBossDmg > 0) {
                        const preDmg = dmg;
                        dmg = Math.floor(dmg * (1 + effBossDmg / 100));
                        if (rc) rc.dmg.boss_dmg += dmg - preDmg;
                    }

                    // T12 — Vulnerability multiplier (Marca de Muerte)
                    const vulnDebuff = runState.enemyDebuffs.find(d => d.type === 'vulnerability');
                    if (vulnDebuff && vulnDebuff.vulnPct) {
                        dmg = Math.floor(dmg * (1 + vulnDebuff.vulnPct / 100));
                    }

                    // T13 — Maestro Elemental: bonus damage vs enemies with active DoT
                    if (t('maestro_elemental') > 0 && hasActiveDebuff('dot')) {
                        const preDmg = dmg;
                        const me = TALENT_POOL.heroico.find(x => x.id === 'maestro_elemental').levels[t('maestro_elemental') - 1];
                        dmg = Math.floor(dmg * (1 + me.dmgBonus / 100));
                        if (rc) rc.dmg.maestro_elemental += dmg - preDmg;
                    }

                    // Rune system: track consecutive hits on same enemy (Golpe Seco)
                    runState.runeComboHits = (runState.runeComboHits || 0) + 1;

                    e.hp -= dmg;
                    const dmgText = type === 'crit' ? `-${formatNum(dmg)}!` : `-${formatNum(dmg)}`;
                    spawnFloat('enemy-floats', dmgText, type);
                    flashElement('enemy-card');
                    arenaLunge('hero');
                    arenaHurt('enemy');
                    
                    // Lifesteal (ya incluye equipo + maestría + asalto vampírico, flat post-DR)
                    if (currentLifesteal > 0) {
                        const heal = Math.floor(dmg * currentLifesteal / 100);
                        if (heal > 0) {
                            p.hp = Math.min(p.maxHp, p.hp + heal);
                            spawnFloat('player-floats', `+${formatNum(heal)}`, 'heal');
                            if (rc) rc.heal.lifesteal += heal;


                        }
                    }

                    // Talento: Toque Rúnico (cura cada 5to ataque)
                    if (t('toque_runico') > 0) {
                        if (!runState.runeTapCounter) runState.runeTapCounter = 0;
                        runState.runeTapCounter++;
                        if (runState.runeTapCounter >= 5) {
                            runState.runeTapCounter = 0;
                            const healPct = TALENT_POOL.sustain.find(x => x.id === 'toque_runico').levels[t('toque_runico') - 1].healPct;
                            const heal = Math.floor(p.maxHp * healPct / 100);
                            p.hp = Math.min(p.maxHp, p.hp + heal);
                            spawnFloat('player-floats', `+${heal} (runa)`, 'heal');
                            if (rc) rc.heal.toque_runico += heal;
                        }
                    }

                    // Talento: Eco de Combate (chance de repetir ataque)
                    if (t('eco_combate') > 0) {
                        const ec = TALENT_POOL.ofensivo.find(x => x.id === 'eco_combate').levels[t('eco_combate') - 1];
                        if (Math.random() * 100 < ec.chance) {
                            const echoDmg = Math.floor(dmg * ec.dmgPct / 100);
                            e.hp -= echoDmg;
                            if (rc) rc.dmg.eco_combate += echoDmg;
                            if (currentLifesteal > 0) {
                                const heal = Math.floor(echoDmg * currentLifesteal / 100);
                                if (heal > 0) {
                                    p.hp = Math.min(p.maxHp, p.hp + heal);
                                    spawnFloat('player-floats', `+${formatNum(heal)} (eco)`, 'heal');
                                    if (rc) rc.heal.echo_lifesteal += heal;
                                }
                            }
                            spawnFloat('enemy-floats', `-${formatNum(echoDmg)} (eco)`, 'crit', 'right');
                        }
                    }

                    // T14 — Golpe Cegador: chance to blind enemy (next attack misses)
                    if (t('golpe_cegador') > 0) {
                        const gc = TALENT_POOL.estado.find(x => x.id === 'golpe_cegador').levels[t('golpe_cegador') - 1];
                        if (Math.random() * 100 < gc.chance) {
                            runState.enemyBlinded = true;
                        }
                    }

                    // T7 — Hemorragia: chance to apply bleeding DoT (stacks independientes hasta maxStack)
                    if (t('hemorragia') > 0) {
                        const h = TALENT_POOL.estado.find(x => x.id === 'hemorragia').levels[t('hemorragia') - 1];
                        if (Math.random() * 100 < h.chance) {
                            applyDebuff({
                                id: 'hemorragia',
                                type: 'dot',
                                dmgPctPerTick: h.dmgPctPerTick,
                                ticksLeft: h.ticks,
                                duration: h.ticks,
                                maxStack: h.maxStack,
                            });
                        }
                    }

                    // T9 — Hoja Tóxica: chance to apply poison DoT + DEF reduction on hit
                    if (t('hoja_toxica') > 0) {
                        const ht = TALENT_POOL.estado.find(x => x.id === 'hoja_toxica').levels[t('hoja_toxica') - 1];
                        if (Math.random() * 100 < ht.chance) {
                            const existing = runState.enemyDebuffs.filter(d => d.id === 'hoja_toxica');
                            if (existing.length < ht.maxStack) {
                                applyDebuff({
                                    id: 'hoja_toxica',
                                    type: 'dot',
                                    dmgPctPerTick: ht.dmgPctPerTick,
                                    ticksLeft: ht.ticks,
                                    duration: ht.ticks,
                                    defReductionPct: ht.defReductionPct,
                                    maxStack: ht.maxStack,
                                });
                            }
                        }
                    }

                    // T10 — Marca de Muerte: always applies vulnerability on hit (no chance check)
                    if (t('marca_muerte') > 0) {
                        const mm = TALENT_POOL.estado.find(x => x.id === 'marca_muerte').levels[t('marca_muerte') - 1];
                        applyDebuff({
                            id: 'marca_muerte',
                            type: 'vulnerability',
                            vulnPct: mm.vulnPct,
                            ticksLeft: mm.duration * 10, // duration in seconds → ticks (10 ticks/sec)
                            duration: mm.duration * 10,
                        });
                    }

                    // T16 — Toque Helado: slow enemy attack speed on hit
                    if (t('toque_helado') > 0) {
                        const th = TALENT_POOL.estado.find(x => x.id === 'toque_helado').levels[t('toque_helado') - 1];
                        runState.enemySlowPct = th.slowPct;
                        runState.enemySlowTicks = th.duration * 10;
                    }

                    // T15 — Golpe Helado: freeze boss for 2s (20 ticks), 3s CD (30 ticks)
                    if (t('golpe_helado') > 0 && runState.enemy?.isBoss && (runState.freezeCooldown || 0) <= 0) {
                        const gh = TALENT_POOL.estado.find(x => x.id === 'golpe_helado').levels[t('golpe_helado') - 1];
                        if (Math.random() * 100 < gh.chance) {
                            runState.frozenTicks = 20; // 2 seconds at 100ms/tick
                            runState.freezeCooldown = 30; // 3 seconds cooldown
                            addLog('❄️ ¡Jefe congelado!', 'system');
                        }
                    }
                }
                isFirstAttack = false;
            }

            // Enemigo ataca
            e.attackTimer -= BALANCE.combat.tickMs;
            if (e.attackTimer <= 0) {
                // Visual feedback: enemy is attacking
                triggerAttackEffect('enemy-card');
                
                // Apply slow if active (Toque Helado + Ventisca runa)
                let enemySlowPct = 0;
                if ((runState.enemySlowTicks || 0) > 0) {
                    enemySlowPct = Math.max(enemySlowPct, (runState.enemySlowPct || 0));
                }
                if (e._runeSlow && e._runeSlowExpire && runState.tickCount <= e._runeSlowExpire) {
                    enemySlowPct = Math.max(enemySlowPct, e._runeSlow);
                } else {
                    e._runeSlow = 0;
                    e._runeSlowExpire = 0;
                }
                if (enemySlowPct > 0) {
                    e.attackTimer = speedToInterval(e.agi) * (1 + enemySlowPct / 100);
                } else {
                    e.attackTimer = speedToInterval(e.agi);
                }

                // Golpe Helado: frozen boss doesn't attack
                if ((runState.frozenTicks || 0) > 0) {
                    spawnFloat('enemy-floats', '❄️', 'miss');
                    return;
                }

                // Golpe Cegador: blinded enemy misses
                if (runState.enemyBlinded) {
                    runState.enemyBlinded = false;
                    spawnFloat('player-floats', 'MISS', 'miss');
                    return;
                }

                    // Pre-calc post-DEF damage for dodge tracking
                    const dodgePotentialDmg = calcDamage(e.atk, p.def);
                    // Dodge check
                    if (Math.random() * 100 < totalDodge) {
                        runState.runeJustDodged = true; // Reflejos trigger
                        spawnFloat('player-floats', 'MISS', 'miss');
                        if (runState.recap) {
                            runState.recap.mitigation.dodge_hits++;
                            runState.recap.mitigation.dodge_dmg += dodgePotentialDmg;
                        }
                        // Talento: Golpe Rápido (bonus dmg tras esquivar)
                        if (t('golpe_rapido') > 0) {
                            runState.golpeBonus = TALENT_POOL.defensivo.find(x => x.id === 'golpe_rapido').levels[t('golpe_rapido') - 1].dmgBonus;
                        }
                        // ─── SUTILEZA (spec): Danza de Sombras — on dodge, next hit ×N ───
                        if (metaState.playerSpec === 'subtlety' && metaState.heroLevel >= 100) {
                            const sutileza = getSpecPassiveValue('subtlety', 'mult', metaState.heroLevel);
                            if (sutileza > 1) {
                                runState.nextHitMult = sutileza;
                                spawnFloat('player-floats', '🌑SOMBRA!', 'heal');
                            }
                        }
                        return;
                    }

                const rcMit = runState.recap;
                let dmg = calcDamage(e.atk, p.def);
                const preDefDmg = e.atk;
                let type = 'normal';
                if (rcMit) {
                    rcMit.mitigation.total_raw += preDefDmg;
                    rcMit.mitigation.def += preDefDmg - dmg;
                }

                // Crítico enemigo (solo bosses o variantes)
                if (e.isBoss && Math.random() < 0.10) { dmg *= 2; type = 'crit'; }

                // Castigo tracking: set flag if hit is crit OR deals >15% maxHP
                if (type === 'crit' || (!e.isBoss && dmg > p.maxHp * 0.15)) {
                    runState.runeJustCritHit = true;
                }

                // ─── PROTECCIÓN (spec): Muro de Escudo — DEF boost ───
                let protectionDefBonus = 0;
                if (metaState.playerSpec === 'protection' && metaState.heroLevel >= 100) {
                    const muro = getSpecPassiveValue('protection', null, metaState.heroLevel);
                    if (muro) {
                        protectionDefBonus = Math.floor(p.def * (muro.defPct || 0) / 100);
                        // DEF→ATK handled in player attack phase
                    }
                }

                // Block check
                if (Math.random() * 100 < totalBlock) {
                    runState.runeJustDodged = true; // Reflejos trigger (block also counts)
                    const preDmg = dmg;
                    dmg = Math.floor(dmg * 0.5);
                    type = 'block';
                    if (rcMit) rcMit.mitigation.block += preDmg - dmg;
                }

                // ─── MAESTRO CERVECERO (spec): Cuerpo de Jade — stagger ───
                if (metaState.playerSpec === 'brewmaster' && metaState.heroLevel >= 100) {
                    const cuerpo = getSpecPassiveValue('brewmaster', null, metaState.heroLevel);
                    if (cuerpo) {
                        // Flat reduction first
                        const flatRed = cuerpo.flatReduction || 0;
                        if (flatRed > 0) {
                            const preDmg = dmg;
                            dmg = Math.max(1, dmg - flatRed);
                            if (rcMit) rcMit.mitigation.indestructible += preDmg - dmg;
                        }
                        // Stagger: defer X% damage over 2s (20 ticks)
                        const staggerPct = cuerpo.staggerPct || 0;
                        if (staggerPct > 0 && dmg > 0) {
                            const staggered = Math.floor(dmg * staggerPct / 100);
                            dmg -= staggered;
                            // Apply staggered damage over 20 ticks
                            if (staggered > 0) {
                                const dotPerTick = Math.max(1, Math.floor(staggered / 20));
                                // Simulate as a debuff over time
                                runState._staggerDmg = (runState._staggerDmg || 0) + staggered;
                                if (!runState._staggerTick) runState._staggerTick = 0;
                            }
                        }
                    }
                }

                // Maestría Resistente: contador + reducción en el MISMO ataque cada 5 golpes
                const toughMastery = metaState.equipment.armor?.mastery;
                if (toughMastery?.id === 'tough_mastery') {
                    runState.toughCounter++;
                    if (runState.toughCounter >= 5) {
                        const preDmg = dmg;
                        runState.toughCounter = 0;
                        const reduction = runState.masteryToughPct;
                        dmg = Math.floor(dmg * (1 - reduction / 100));
                        spawnFloat('player-floats', '🛡️Bloq', 'block');
                        if (rcMit) rcMit.mitigation.resistente += preDmg - dmg;
                    }
                }

                // Talento: Indestructible (reducción de daño + penalty propio)
                if (t('indestructible') > 0) {
                    const preDmg = dmg;
                    const ind = TALENT_POOL.defensivo.find(x => x.id === 'indestructible').levels[t('indestructible') - 1];
                    dmg = Math.floor(dmg * (1 - ind.dmgReduction / 100));
                    if (rcMit) rcMit.mitigation.indestructible += preDmg - dmg;
                }

                // Talento: Fortaleza (reducción bajo 50% HP)
                if (t('fortaleza') > 0 && p.hp < p.maxHp * 0.50) {
                    const preDmg = dmg;
                    const fort = TALENT_POOL.sustain.find(x => x.id === 'fortaleza').levels[t('fortaleza') - 1];
                    dmg = Math.floor(dmg * (1 - fort.dmgReduction / 100));
                    if (rcMit) rcMit.mitigation.fortaleza += preDmg - dmg;
                }

// Talento: Cañón de Cristal (más daño recibido bajo 50% HP)
                 if (t('canon_cristal') > 0 && p.hp < p.maxHp * 0.50) {
                    const preDmg = dmg;
                    const cc = TALENT_POOL.ofensivo.find(x => x.id === 'canon_cristal').levels[t('canon_cristal') - 1];
                    dmg = Math.floor(dmg * (1 + cc.dmgTaken / 100));
                    if (rcMit) rcMit.mitigation.canon_recibido += dmg - preDmg;
                }

                // Talento: Escudo Mágico (reduce cada N ataques del enemigo)
                if (t('escudo_magico') > 0) {
                    const sm = TALENT_POOL.defensivo.find(x => x.id === 'escudo_magico').levels[t('escudo_magico') - 1];
                    if (!runState.spellShieldCounter) runState.spellShieldCounter = 0;
                    runState.spellShieldCounter++;
                    if (runState.spellShieldCounter >= sm.everyN) {
                        const preDmg = dmg;
                        runState.spellShieldCounter = 0;
                        dmg = Math.floor(dmg * (1 - sm.reduction / 100));
                        spawnFloat('player-floats', '🛡️Mitigado', 'block');
                        if (rcMit) rcMit.mitigation.escudo_magico += preDmg - dmg;
                    }
                }

                // Talento: Veterano de Batalla (DR por pisos completados)
                if (t('veterano_batalla') > 0) {
                    const preDmg = dmg;
                    const vb = TALENT_POOL.defensivo.find(x => x.id === 'veterano_batalla').levels[t('veterano_batalla') - 1];
                    const floorsCompleted = Math.max(0, runState.floor - 1);
                    const stacks = Math.floor(floorsCompleted / 5);
                    const dr = Math.min(stacks * vb.per5Floors, vb.maxDr);
                    if (dr > 0) dmg = Math.floor(dmg * (1 - dr / 100));
                    if (rcMit) rcMit.mitigation.veterano += preDmg - dmg;
                }

                // Escudos: absorben daño antes que el HP (piedraShield primero, luego vitalShield)
                const rawDmg = dmg; // save original for threshold check
                let totalAbsorbed = 0;
                // 1. piedraShield absorbs first
                if (runState.piedraShield && runState.piedraShield.amount > 0) {
                    const absorbed = Math.min(dmg, runState.piedraShield.amount);
                    runState.piedraShield.amount -= absorbed;
                    dmg -= absorbed;
                    totalAbsorbed += absorbed;
                    if (rcMit) rcMit.mitigation.piedra_shield += absorbed;
                }
                // 2. vitalShield absorbs remainder
                if (dmg > 0 && runState.vitalShield > 0) {
                    const absorbed = Math.min(dmg, runState.vitalShield);
                    runState.vitalShield -= absorbed;
                    dmg -= absorbed;
                    totalAbsorbed += absorbed;
                    if (rcMit) rcMit.mitigation.vital_shield += absorbed;
                }
                if (totalAbsorbed > 0 && dmg > 0) {
                    spawnFloat('player-floats', `-${formatNum(totalAbsorbed)}🛡️`, 'block');
                }
                if (rcMit) rcMit.mitigation.total_taken += dmg;

                // Talento: Piel de Piedra — shield on big hits (>= 15% maxHp)
                if (t('piel_piedra') > 0 && rawDmg >= p.maxHp * 0.15) {
                    const pp = TALENT_POOL.defensivo.find(x => x.id === 'piel_piedra').levels[t('piel_piedra') - 1];
                    const shieldAmount = Math.floor(p.maxHp * pp.shieldPct / 100);
                    const current = runState.piedraShield?.amount || 0;
                    if (shieldAmount > current) {
                        // New shield is stronger: replace
                        runState.piedraShield = { amount: shieldAmount, ticksLeft: pp.duration * 10 };
                        runState.shieldMax = (runState.vitalShield || 0) + shieldAmount;
                        spawnFloat('player-floats', `🛡️+${formatNum(shieldAmount)}`, 'block');
                    } else {
                        // Current shield is better: just refresh duration
                        runState.piedraShield.ticksLeft = pp.duration * 10;
                    }
                }

                p.hp -= dmg;
                const playerDmgText = type === 'crit' ? `-${formatNum(dmg)}!` : `-${formatNum(dmg)}`;
                spawnFloat('player-floats', playerDmgText, type);
                flashElement('player-card');
                arenaLunge('enemy');
                arenaHurt('hero');

// Talento: Contraataque
                 if (t('contraataque') > 0) {
                     const ca = TALENT_POOL.defensivo.find(x => x.id === 'contraataque').levels[t('contraataque') - 1];
                     if (Math.random() * 100 < ca.chance) {
                         // Contraataque: perform a full player attack using current stats
                         let attacks = 1;
                         // Handle Multiataque for counterattacks too
                         if (t('multiataque') > 0) {
                             const m = TALENT_POOL.ofensivo.find(x => x.id === 'multiataque').levels[t('multiataque') - 1];
                             if (Math.random() * 100 < m.chance) attacks = m.hits;
                         }

                         for (let counterAttackIndex = 0; counterAttackIndex < attacks; counterAttackIndex++) {
                             // Apply penetration: ignore % of enemy DEF
                             let penPct = effPen;
                             if (t('golpe_penetrante') > 0) {
                                 penPct += TALENT_POOL.ofensivo.find(x => x.id === 'golpe_penetrante').levels[t('golpe_penetrante') - 1].penPct;
                             }
                             const effectiveDef = Math.max(0, Math.floor(e.def * (1 - penPct / 100)));
                             let counterDmg = calcDamage(p.atk, effectiveDef);
                             let counterType = 'normal';

                             // Talento: Primer Golpe (only applies to first counterattack hit)
                             if (counterAttackIndex === 0 && t('primer_golpe') > 0) {
                                 const preDmg = counterDmg;
                                 const mult = TALENT_POOL.ofensivo.find(x => x.id === 'primer_golpe').levels[t('primer_golpe') - 1].dmgMult;
                                 counterDmg = Math.floor(counterDmg * mult);
                                 if (runState.recap) runState.recap.dmg.contraataque += counterDmg - preDmg;
                             }

                             // Talento: Furia Creciente
                             if (t('furia_creciente') > 0) {
                                 const preDmg = counterDmg;
                                 const f = TALENT_POOL.ofensivo.find(x => x.id === 'furia_creciente').levels[t('furia_creciente') - 1];
                                 if (!runState.furiaStacks) runState.furiaStacks = 0;
                                 runState.furiaStacks++;
                                 const stacks = Math.min(runState.furiaStacks, f.maxStack);
                                 const bonus = f.perHit * stacks;
                                 if (bonus > 0) counterDmg = Math.floor(counterDmg * (1 + bonus / 100));
                                 if (runState.recap) runState.recap.dmg.contraataque += counterDmg - preDmg;
                             }

// Talento: Golpe Rápido (bonus tras esquivar, un solo golpe)
                              if (runState.golpeBonus > 0) {
                                  const preDmg = counterDmg;
                                  counterDmg = Math.floor(counterDmg * (1 + runState.golpeBonus / 100));
                                  runState.golpeBonus = 0;
                                  if (runState.recap) runState.recap.dmg.contraataque += counterDmg - preDmg;
                              }

                             // Crit: base 1.5x + bonus from equipment (capped at 650% total = 6.5x)
                             if (Math.random() * 100 < totalCrit) {
                                 const preDmg = counterDmg;
                                 const critDmgBonus = metaState.upgrades.critDmg.level * metaState.upgrades.critDmg.percent * 100;
                                 const critMult = 1.5 + (effCritDmg + critDmgBonus) / 100;
                                 counterDmg = Math.floor(counterDmg * critMult);
                                 counterType = 'crit';
                                 if (runState.recap) runState.recap.dmg.contraataque += counterDmg - preDmg;
                             }

                             // Talento: Golpe Brutal
                             if (t('golpe_brutal') > 0) {
                                 const chance = TALENT_POOL.ofensivo.find(x => x.id === 'golpe_brutal').levels[t('golpe_brutal') - 1].chance;
                                 if (Math.random() * 100 < chance) {
                                     const preDmg = counterDmg;
                                     counterDmg *= 3;
                                     counterType = 'crit';
                                     if (runState.recap) runState.recap.dmg.contraataque += counterDmg - preDmg;
                                 }
                             }

                             // Talento: Ejecución
                             if (t('ejecucion') > 0) {
                                 const ex = TALENT_POOL.ofensivo.find(x => x.id === 'ejecucion').levels[t('ejecucion') - 1];
                                 if (e.hp < e.maxHp * ex.threshold) {
                                     const preDmg = counterDmg;
                                     counterDmg = Math.floor(counterDmg * ex.mult);
                                     counterType = 'crit';
                                     if (runState.recap) runState.recap.dmg.contraataque += counterDmg - preDmg;
                                 }
                             }

                             // Talento: Cañón de Cristal (bonus de daño siempre)
                             if (t('canon_cristal') > 0) {
                                 const preDmg = counterDmg;
                                 const cc = TALENT_POOL.ofensivo.find(x => x.id === 'canon_cristal').levels[t('canon_cristal') - 1];
                                 counterDmg = Math.floor(counterDmg * (1 + cc.dmgBonus / 100));
                                 if (runState.recap) runState.recap.dmg.contraataque += counterDmg - preDmg;
                             }

                             // Boss damage bonus
                             if (e.isBoss && effBossDmg > 0) {
                                 const preDmg = counterDmg;
                                 counterDmg = Math.floor(counterDmg * (1 + effBossDmg / 100));
                                 if (runState.recap) runState.recap.dmg.contraataque += counterDmg - preDmg;
                             }

                             // T12 — Vulnerability multiplier (Marca de Muerte)
                             const vulnDebuff = runState.enemyDebuffs.find(d => d.type === 'vulnerability');
                             if (vulnDebuff && vulnDebuff.vulnPct) {
                                 counterDmg = Math.floor(counterDmg * (1 + vulnDebuff.vulnPct / 100));
                                 if (runState.recap) runState.recap.dmg.contraataque += counterDmg - preDmg;
                             }

                             // T13 — Maestro Elemental: bonus damage vs enemies with active DoT
                             if (t('maestro_elemental') > 0 && hasActiveDebuff('dot')) {
                                 const preDmg = counterDmg;
                                 const me = TALENT_POOL.heroico.find(x => x.id === 'maestro_elemental').levels[t('maestro_elemental') - 1];
                                 counterDmg = Math.floor(counterDmg * (1 + me.dmgBonus / 100));
                                 if (runState.recap) runState.recap.dmg.contraataque += counterDmg - preDmg;
                             }

                             e.hp -= counterDmg;
                              const dmgText = counterType === 'crit' ? `-${formatNum(counterDmg)}!` : `-${formatNum(counterDmg)}`;
                              spawnFloat('enemy-floats', dmgText, counterType);

                             // Lifesteal (ya incluye equipo + maestría + asalto vampírico, flat post-DR)
                             if (currentLifesteal > 0) {
                                 const heal = Math.floor(counterDmg * currentLifesteal / 100);
                                 if (heal > 0) {
                                     p.hp = Math.min(p.maxHp, p.hp + heal);
                                     spawnFloat('player-floats', `+${formatNum(heal)}`, 'heal');
                                      if (runState.recap) runState.recap.heal.contraataque += heal;


                                 }
                             }

                             // Talento: Toque Rúnico (cura cada 5to ataque)
                             if (t('toque_runico') > 0) {
                                 if (!runState.runeTapCounter) runState.runeTapCounter = 0;
                                 runState.runeTapCounter++;
                                 if (runState.runeTapCounter >= 5) {
                                     runState.runeTapCounter = 0;
                                     const healPct = TALENT_POOL.sustain.find(x => x.id === 'toque_runico').levels[t('toque_runico') - 1].healPct;
                                     const heal = Math.floor(p.maxHp * healPct / 100);
                                     p.hp = Math.min(p.maxHp, p.hp + heal);
                            spawnFloat('player-floats', `+${formatNum(heal)} (runa)`, 'heal');
                                     if (runState.recap) runState.recap.heal.contraataque += heal;
                                 }
                             }

                             // Talento: Eco de Combate (chance de repetir ataque)
                             if (t('eco_combate') > 0) {
                                 const ec = TALENT_POOL.ofensivo.find(x => x.id === 'eco_combate').levels[t('eco_combate') - 1];
                                 if (Math.random() * 100 < ec.chance) {
                                     const echoDmg = Math.floor(counterDmg * ec.dmgPct / 100);
                                     e.hp -= echoDmg;
                                     if (runState.recap) runState.recap.dmg.contraataque += echoDmg;
                                     if (currentLifesteal > 0) {
                                         const heal = Math.floor(echoDmg * currentLifesteal / 100);
                                         if (heal > 0) {
                                             p.hp = Math.min(p.maxHp, p.hp + heal);
                                             spawnFloat('player-floats', `+${formatNum(heal)} (eco)`, 'heal');
                                             if (runState.recap) runState.recap.heal.contraataque += heal;
                                         }
                                     }
                                     spawnFloat('enemy-floats', `-${formatNum(echoDmg)} (eco)`, 'crit', 'right');
                                 }
                             }

                             // T14 — Golpe Cegador: chance to blind enemy (next attack misses)
                             if (t('golpe_cegador') > 0) {
                                 const gc = TALENT_POOL.estado.find(x => x.id === 'golpe_cegador').levels[t('golpe_cegador') - 1];
                                 if (Math.random() * 100 < gc.chance) {
                                     runState.enemyBlinded = true;
                                     if (runState.recap) runState.recap.dmg.contraataque += 0; // No damage, but track the proc
                                 }
                             }

                             // T7 — Hemorragia: chance to apply bleeding DoT (stacks independientes hasta maxStack)
                             if (t('hemorragia') > 0) {
                                 const h = TALENT_POOL.estado.find(x => x.id === 'hemorragia').levels[t('hemorragia') - 1];
                                 if (Math.random() * 100 < h.chance) {
                                     applyDebuff({
                                         id: 'hemorragia',
                                         type: 'dot',
                                         dmgPctPerTick: h.dmgPctPerTick,
                                         ticksLeft: h.ticks,
                                         duration: h.ticks,
                                         maxStack: h.maxStack,
                                     });
                                     if (runState.recap) runState.recap.dmg.contraataque += 0; // Track proc
                                 }
                             }

                             // T9 — Hoja Tóxica: chance to apply poison DoT + DEF reduction on hit
                             if (t('hoja_toxica') > 0) {
                                 const ht = TALENT_POOL.estado.find(x => x.id === 'hoja_toxica').levels[t('hoja_toxica') - 1];
                                 if (Math.random() * 100 < ht.chance) {
                                     const existing = runState.enemyDebuffs.filter(d => d.id === 'hoja_toxica');
                                     if (existing.length < ht.maxStack) {
                                         applyDebuff({
                                             id: 'hoja_toxica',
                                             type: 'dot',
                                             dmgPctPerTick: ht.dmgPctPerTick,
                                             ticksLeft: ht.ticks,
                                             duration: ht.ticks,
                                             defReductionPct: ht.defReductionPct,
                                             maxStack: ht.maxStack,
                                         });
                                         if (runState.recap) runState.recap.dmg.contraataque += 0; // Track proc
                                     }
                                 }
                             }

                             // T10 — Marca de Muerte: always applies vulnerability on hit (no chance check)
                             if (t('marca_muerte') > 0) {
                                 const mm = TALENT_POOL.estado.find(x => x.id === 'marca_muerte').levels[t('marca_muerte') - 1];
                                 applyDebuff({
                                     id: 'marca_muerte',
                                     type: 'vulnerability',
                                     vulnPct: mm.vulnPct,
                                     ticksLeft: mm.duration * 10, // duration in seconds → ticks (10 ticks/sec)
                                     duration: mm.duration * 10,
                                 });
                                 if (runState.recap) runState.recap.dmg.contraataque += 0; // Track proc
                             }

                             // T16 — Toque Helado: slow enemy attack speed on hit
                             if (t('toque_helado') > 0) {
                                 const th = TALENT_POOL.estado.find(x => x.id === 'toque_helado').levels[t('toque_helado') - 1];
                                 runState.enemySlowPct = th.slowPct;
                                 runState.enemySlowTicks = th.duration * 10;
                                 if (runState.recap) runState.recap.dmg.contraataque += 0; // Track proc
                             }

                             // T15 — Golpe Helado: freeze boss for 2s (20 ticks), 3s CD (30 ticks)
                             if (t('golpe_helado') > 0 && runState.enemy?.isBoss && (runState.freezeCooldown || 0) <= 0) {
                                 const gh = TALENT_POOL.estado.find(x => x.id === 'golpe_helado').levels[t('golpe_helado') - 1];
                                 if (Math.random() * 100 < gh.chance) {
                                     runState.frozenTicks = 20; // 2 seconds at 100ms/tick
                                     runState.freezeCooldown = 30; // 3 seconds cooldown
                                     addLog('❄️ ¡Jefe congelado! (Contraataque)', 'system');
                                     if (runState.recap) runState.recap.dmg.contraataque += 0; // Track proc
                                 }
                             }
                         }

                         // Track total counterattack damage in recap
                         if (runState.recap) {
                             // We already tracked individual components above, but we need the total
                             // For simplicity, we'll calculate it here or rely on the individual tracking
                             // Since we tracked components individually, we don't need to add the total again
                         }
                     }
                 }
            }

            // Talento: Segundo Aliento (burst heal al bajar de 30% HP, una vez por combate)
            if (t('segundo_aliento') > 0 && !runState.segundoAlientoUsed && p.hp > 0 && p.hp < p.maxHp * 0.30) {
                runState.segundoAlientoUsed = true;
                const sa = TALENT_POOL.sustain.find(x => x.id === 'segundo_aliento').levels[t('segundo_aliento') - 1];
                const heal = Math.floor(p.maxHp * sa.healPct / 100);
                p.hp = Math.min(p.maxHp, p.hp + heal);
                addLog(`💨 ¡Segundo Aliento! +${formatNum(heal)} HP`, 'system');
                spawnFloat('player-floats', `+${formatNum(heal)} (2A)`, 'heal');
                if (runState.recap) runState.recap.heal.segundo_aliento += heal;
            }

            // Talento: Regeneración (% HP cada 2s = 20 ticks)
            if (t('regeneracion') > 0) {
                if (p.regenTalentTick === undefined) p.regenTalentTick = 0;
                p.regenTalentTick++;
                if (p.regenTalentTick >= 20) {
                    p.regenTalentTick = 0;
                    const hpPctPer2s = TALENT_POOL.sustain.find(x => x.id === 'regeneracion').levels[t('regeneracion') - 1].hpPctPer2s;
                    if (p.hp < p.maxHp) {
                        const heal = Math.floor(p.maxHp * hpPctPer2s / 100);
                        p.hp = Math.min(p.maxHp, p.hp + heal);
                        spawnFloat('player-floats', `+${formatNum(heal)}`, 'heal');
                        if (runState.recap) runState.recap.heal.regeneracion += heal;


                    }
                }
            }

            if (e.hp <= 0) { e.hp = 0; enemyDefeated(); }
            else if (p.hp <= 0) { p.hp = 0; playerDied(); }
            render();
        }

  Game.combatTick = {
    combatTick: combatTick,
    combatLoop: combatLoop,
    isFirstAttack: isFirstAttack
  };

  window.combatTick = combatTick;
  window.combatLoop = combatLoop;
})();
