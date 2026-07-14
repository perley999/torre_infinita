// calc.js — damage, stats, debuffs, item level calculations.
// Extracted from Torre_Infinita.html (F2 core extraction).
(function() {
  'use strict';
  window.Game = window.Game || {};
function speedToInterval(speed) {
    const interval = BALANCE.combat.speedBase - (speed * BALANCE.combat.speedPerAgi);
    return Math.max(BALANCE.combat.speedMin, interval);
}

function getUpgradeCost(key) {
    const u = metaState.upgrades[key];
    return Math.floor(u.baseCost * Math.pow(u.scale, u.level));
}

function calcDamage(atk, def, k) {
    // Defensa relativa: DR = DEF / (DEF + ATK × K)
    // La DEF siempre reduce un %, nunca anula el daño por completo
    // K controla eficacia de DEF (más K = DEF más efectiva)
    const K = k ?? 0.6;
    const dr = def / (def + atk * K);
    return Math.max(BALANCE.combat.minDamage, Math.floor(atk * (1 - dr)));
}

function getDerivedStats(atk, def, agi) {
    const c = BALANCE.combat;
    // Diminishing returns: cap × (stat / (stat + K))
    // Crit base is now 0% (no longer derived from ATK)
    const crit = 0;
    const block = Math.floor(c.blockCap * (def / (def + c.blockK)));
    const dodge = Math.floor(c.dodgeCap * (agi / (agi + c.dodgeK)));
    return { crit, block, dodge };
}

function calcPlayerStats() {
    const u = metaState.upgrades;
    const base = BALANCE.player;

    const r = runState.runBonuses;
    let hp = base.hp + r.hp;
    let atk = base.atk + r.atk;
    let def = base.def + r.def;
    let agi = base.agi + r.agi;

    // Equipment bonuses: flat stats + percent multipliers over base
    // Lifesteal is flat from equipment only (no base stat)
    let equipLifesteal = 0;
    let equipCritMult = 0, equipDodgeRating = 0;
    let equipPen = 0, equipCritDmg = 0, equipBossDmg = 0;
    let equipHpRegen = 0;

    for (const slot of ['weapon', 'armor', 'ring']) {
        const item = metaState.equipment[slot];
        if (item) {
            const enhMult = 1 + (item.enhance || 0) * 0.1;
            const stats = item.stats;
            // Primary stats with enhance multiplier + bonus stat
            let stathp = (stats.hp || 0) * enhMult;
            let statatk = (stats.atk || 0) * enhMult;
            let statdef = (stats.def || 0) * enhMult;
            let statagi = (stats.agi || 0) * enhMult;
            // Secondary stats with enhance multiplier
            let sLifesteal = (stats.lifesteal || 0) * enhMult;
            let sCrit = (stats.crit || 0) * enhMult;
            let sDodge = (stats.dodge || 0) * enhMult;
            let sPen = (stats.pen || 0) * enhMult;
            let sCritDmg = (stats.critDamage || 0) * enhMult;
            let sBossDmg = (stats.bossDamage || 0) * enhMult;
            let sHpRegen = (stats.hpRegen || 0) * enhMult;
            // Block stat (tracked for completeness, used in derived stats)
            let sBlock = (stats.block || 0) * enhMult;
            // Bonus stat: add after multiplier (can be any stat)
            if (item.bonusStat) {
                const bs = item.bonusStat;
                if (bs.stat === 'hp') stathp += bs.bonus;
                else if (bs.stat === 'atk') statatk += bs.bonus;
                else if (bs.stat === 'def') statdef += bs.bonus;
                else if (bs.stat === 'agi') statagi += bs.bonus;
                else if (bs.stat === 'lifesteal') sLifesteal += bs.bonus;
                else if (bs.stat === 'crit') sCrit += bs.bonus;
                else if (bs.stat === 'dodge') sDodge += bs.bonus;
                else if (bs.stat === 'pen') sPen += bs.bonus;
                else if (bs.stat === 'critDamage') sCritDmg += bs.bonus;
                else if (bs.stat === 'bossDamage') sBossDmg += bs.bonus;
                else if (bs.stat === 'hpRegen') sHpRegen += bs.bonus;
                else if (bs.stat === 'block') sBlock += bs.bonus;
            }
            hp += Math.floor(stathp);
            atk += Math.floor(statatk);
            def += Math.floor(statdef);
            agi += Math.floor(statagi);
            equipLifesteal += sLifesteal;
            equipCritMult += sCrit;
            equipDodgeRating += sDodge;
            equipPen += sPen;
            equipCritDmg += sCritDmg;
            equipBossDmg += sBossDmg;
            equipHpRegen += sHpRegen;
        }
    }

    hp *= (1 + u.hp.percent * u.hp.level);
    atk *= (1 + u.atk.percent * u.atk.level);
    def *= (1 + u.def.percent * u.def.level);
    agi *= (1 + u.agi.percent * u.agi.level);

    const tl = runState.talentLevels;
    const t = (id) => tl[id] || 0; // nivel del talento (0 = no elegido)

    // Dominio: +X% a todos los stats base
    if (t('dominio') > 0) {
        const bonus = TALENT_POOL.heroico.find(x => x.id === 'dominio').levels[t('dominio') - 1].statBonus / 100;
        hp *= (1 + bonus); atk *= (1 + bonus); def *= (1 + bonus); agi *= (1 + bonus);
    }

    // Sangre de Gigante: +X% HP, -X% velocidad
    let speedPenaltyPct = 0;
    if (t('sangre_gigante') > 0) {
        const d = TALENT_POOL.defensivo.find(x => x.id === 'sangre_gigante').levels[t('sangre_gigante') - 1];
        hp *= (1 + d.hpBonus / 100);
        speedPenaltyPct = d.speedPenalty;
    }

    // Legado del Héroe: +X% por boss derrotado
    let legacyBonus = 0;
    if (t('legado_heroe') > 0) {
        const perBoss = TALENT_POOL.heroico.find(x => x.id === 'legado_heroe').levels[t('legado_heroe') - 1].perBoss;
        const bossesKilled = runState.bossesKilledThisRun || 0;
        legacyBonus = perBoss * bossesKilled;
        hp *= (1 + legacyBonus / 100);
        atk *= (1 + legacyBonus / 100);
        def *= (1 + legacyBonus / 100);
        agi *= (1 + legacyBonus / 100);
    }

    const artifact = metaState.heroArtifact;
    const a = (id) => (artifact.nodes[id] || 0) * (BALANCE.heroArtifact.nodes.find(n => n.id === id)?.bonus || 0);
    // Nodos de estadísticas planas (sin límite de nivel)
    for (const n of BALANCE.heroArtifact.nodes) {
        if (n.flatBonus) {
            const lvl = artifact.nodes[n.id] || 0;
            if (lvl > 0) {
                if (n.id === 'fuerza_ancestral')      atk += lvl * n.flatBonus;
                else if (n.id === 'coraza_ancestral') def += lvl * n.flatBonus;
                else if (n.id === 'vitalidad_ancestral') hp += lvl * n.flatBonus;
                else if (n.id === 'pasos_ancestrales') agi += lvl * n.flatBonus;
            }
        }
    }

    // Herencia del Equipo: multiplica stats del equipo (ya incluidas en hp/atk/def/agi)
    const herenciaLvl = artifact.nodes.herencia_equipo || 0;
    if (herenciaLvl > 0) {
        const herenciaMult = 1 + herenciaLvl * 0.05;
        // He already applied to hp/atk/def/agi which include equipment
        // Re-apply as global multiplier on top
        hp *= herenciaMult;
        atk *= herenciaMult;
        def *= herenciaMult;
        agi *= herenciaMult;
    }

    // Talento Innato: talentDmgMult para DoTs y efectos
    const talentoInnatoLvl = artifact.nodes.talento_innato || 0;
    const talentDmgMult = 1 + talentoInnatoLvl * 0.05;

    // Sabiduría Eterna: XP multiplier
    const sabiduriaLvl = artifact.nodes.sabiduria_eterna || 0;
    const xpMult = 1 + sabiduriaLvl * 0.05;

    // Fortuna del Héroe: drop rate multiplier
    const fortunaLvl = artifact.nodes.fortuna_heroe || 0;
    const dropMult = 1 + fortunaLvl * 0.05;

    // Voluntad del Héroe: souls multiplier
    const voluntadLvl = artifact.nodes.voluntad_heroe || 0;
    const soulsMult = 1 + voluntadLvl * 0.05;

    // ─── RUNE SYSTEM BUFFS ───────────────────────────────
    // Rune buffs are applied post-meta to simulate temporary combat buffs
    // atkMult (Avalancha): multiplies ATK
    // atkFlat (Drenaje): adds flat ATK
    // defMult (Coraza): multiplies DEF
    if (runState.runeBuffs && runState.runeBuffs.length > 0) {
        for (const buff of runState.runeBuffs) {
            if (buff.type === 'atkMult' && buff.value > 0) {
                atk = Math.floor(atk * buff.value);
            }
            if (buff.type === 'atkFlat' && buff.value > 0) {
                atk += Math.floor(buff.value);
            }
            if (buff.type === 'defMult' && buff.value > 0) {
                def = Math.floor(def * (1 + buff.value));
            }
        }
    }

    return {
        maxHp: Math.floor(hp),
        atk: Math.floor(atk),
        def: Math.floor(def),
        agi: Math.floor(agi),
        lifesteal: equipLifesteal,
        critRating: equipCritMult,
        dodgeRating: equipDodgeRating,
        pen: equipPen,
        critDamage: equipCritDmg,
        bossDamage: equipBossDmg,
        hpRegen: equipHpRegen,
        // Talent-derived stats (used by combatTick and render)
        speedPenaltyPct: speedPenaltyPct,
        // Artefacto: multipliers
        xpMult: xpMult || 1,
        dropMult: dropMult || 1,
        soulsMult: soulsMult || 1,
        talentDmgMult: talentDmgMult || 1,
    };
}

function calcEnemyStats(floor, playerStats, isFirstBossAttempt) {
    const isBoss = floor % 10 === 0;
    const b = isBoss ? BALANCE.enemy.boss : BALANCE.enemy.normal;
    const t = isBoss ? BALANCE.enemy.tierScale.boss : BALANCE.enemy.tierScale.normal;
    const s = isBoss ? BALANCE.enemy.subScale.boss : BALANCE.enemy.subScale.normal;
    const tier = Math.floor((floor - 1) / 10);
    const sub = ((floor - 1) % 10) + 1;

    let hp = Math.floor(b.hp * Math.pow(t.hp, tier) * Math.pow(s.hp, sub - 1));
    let atk = Math.floor(b.atk * Math.pow(t.atk, tier) * Math.pow(s.atk, sub - 1));
    let def = Math.floor(b.def * Math.pow(t.def, tier) * Math.pow(s.def, sub - 1));
    const agi = Math.floor(b.agi * Math.pow(BALANCE.enemy.agiScale, floor - 1));

    if (isBoss) {
        hp = Math.floor(hp * BALANCE.enemy.bossHpMult);
        // Dificultad dinámica en el PRIMER intento: el jefe escala con tus stats
        if (isFirstBossAttempt && playerStats) {
            const d = BALANCE.enemy.dynamicBoss;
            hp = Math.max(hp, Math.floor(playerStats.maxHp * d.hpMult));
            atk = Math.max(atk, Math.floor(playerStats.atk * d.atkMult));
            def = Math.max(def, Math.floor(playerStats.def * d.defMult));
        }
    }

    return { hp, atk, def, agi, isBoss };
}


// T3 — clearDebuffs()
function clearDebuffs() {
    // Restore DEF if Hoja Tóxica was active
    const toxica = runState.enemyDebuffs.find(d => d.id === 'hoja_toxica');
    if (toxica && toxica.originalDef !== undefined && runState.enemy) {
        runState.enemy.def = toxica.originalDef;
    }
    // Restore ATK if Quemadura was active
    const quemadura = runState.enemyDebuffs.find(d => d.id === 'quemadura');
    if (quemadura && quemadura.originalAtk !== undefined && runState.enemy) {
        runState.enemy.atk = quemadura.originalAtk;
    }
    // Restore DEF if runa Quebrantar was active
    if (runState.enemy && runState.enemy._runeQuebrantarOrigDef !== undefined) {
        runState.enemy.def = runState.enemy._runeQuebrantarOrigDef;
        delete runState.enemy._runeQuebrantarOrigDef;
    }
    runState.enemyDebuffs = [];
    runState._staggerDmg = 0;
    runState._staggerTick = 0;
}

// T4 — applyDebuff()
function applyDebuff(def) {
    // def: { id, type, ticksLeft, duration, dmgPctPerTick?, defReductionPct?, maxStack?, stack?, perTick?, vulnPct? }
    const tl = runState.talentLevels || {};
    const applyMaestroTicks = (d) => {
        if ((d.type === 'dot' || d.type === 'def_reduction') && tl['maestro_elemental']) {
            const me = TALENT_POOL.heroico.find(x => x.id === 'maestro_elemental').levels[tl['maestro_elemental'] - 1];
            d.ticksLeft = (d.ticksLeft || 0) + me.extraTicks;
            d.duration = (d.duration || 0) + me.extraTicks;
        }
        // Aflicción spec: debuffs last ×N time
        if (d.type === 'dot' && metaState.playerSpec === 'affliction' && metaState.heroLevel >= 100) {
            const afflDuration = getSpecPassiveValue('affliction', 'durationMult', metaState.heroLevel);
            if (afflDuration > 1) {
                d.ticksLeft = Math.floor((d.ticksLeft || 0) * afflDuration);
                d.duration = Math.floor((d.duration || 0) * afflDuration);
            }
        }
        return d;
    };

    // DoTs con stacks independientes (maxStack > 1): crear entradas separadas
    if (def.type === 'dot' && (def.maxStack || 1) > 1) {
        const active = runState.enemyDebuffs.filter(d => d.id === def.id);
        if (active.length >= def.maxStack) return; // ya hay máximas entradas
        runState.enemyDebuffs.push(applyMaestroTicks({ ...def }));
        return;
    }

    // Debuffs que refrescan en vez de stackear
    const existing = runState.enemyDebuffs.find(d => d.id === def.id);
    if (existing) {
        if (def.type === 'stat_drain') {
            existing.stack = Math.min(existing.stack + (def.stack || 1), existing.maxStack);
            existing.ticksLeft = existing.duration;
        } else {
            existing.ticksLeft = def.ticksLeft;
            existing.duration = def.duration;
        }
        // Tormenta tracking on refresh (skip rune-originated debuffs)
        if (def.id && !def.id.startsWith('rune_')) {
            runState.runeDebuffsSinceProc = (runState.runeDebuffsSinceProc || 0) + 1;
        }
        return;
    }

    // Nuevo debuff
    runState.enemyDebuffs.push(applyMaestroTicks({ ...def }));

    // Tormenta tracking: increment debuff counter for rune conditions (skip rune-originated debuffs)
    if (def.id && !def.id.startsWith('rune_')) {
        runState.runeDebuffsSinceProc = (runState.runeDebuffsSinceProc || 0) + 1;
    }
}

// T5 — processDebuffs()
function processDebuffs(lifestealPct, warlockDotBonusPct, talentDmgMult) {
    const tl = runState.talentLevels || {};
    // ─── AFLICCIÓN (spec): +Y% DoT damage ───
    let afflictionDotBonus = 0;
    if (metaState.playerSpec === 'affliction' && metaState.heroLevel >= 100) {
        afflictionDotBonus = getSpecPassiveValue('affliction', 'dotDmgPct', metaState.heroLevel) || 0;
    }
    const t = (id) => tl[id] || 0;
    const p = runState.player;
    const e = runState.enemy;
    if (!e) return;

    // Track which debuffs to remove
    const toRemove = [];

    for (let i = 0; i < runState.enemyDebuffs.length; i++) {
        const db = runState.enemyDebuffs[i];

        if (db.type === 'dot') {
            // DoT damage every 1 second (10 ticks of 100ms)
            if (db._dotTickCounter === undefined) db._dotTickCounter = 0;
            db._dotTickCounter++;
            if (db._dotTickCounter >= 10) {
                db._dotTickCounter = 0;
                db.ticksLeft--;
                // Percentage-based damage from enemy max HP
                if (db.dmgPctPerTick > 0) {
                    let dotDmg = Math.max(1, Math.floor(e.maxHp * db.dmgPctPerTick / 100));
                    // Warlock Pacto Oscuro: +Y% DoT damage
                    if (warlockDotBonusPct > 0) {
                        dotDmg = Math.floor(dotDmg * (1 + warlockDotBonusPct / 100));
                    }
                    // Aflicción spec: +Y% DoT damage
                    if (afflictionDotBonus > 0) {
                        dotDmg = Math.floor(dotDmg * (1 + afflictionDotBonus / 100));
                    }
                    // Talento Innato (artefacto): multiplicador global de daño de talentos
                    if (talentDmgMult && talentDmgMult > 1) {
                        dotDmg = Math.floor(dotDmg * talentDmgMult);
                    }
                    e.hp -= dotDmg;
                    const rc = runState.recap;
                    if (rc) {
                        if (db.id === 'hemorragia') rc.dmg.hemorragia += dotDmg;
                        if (db.id === 'hoja_toxica') rc.dmg.hoja_toxica += dotDmg;
                    }
                    // Lifesteal applies to ALL damage sources (Asalto Vampírico)
                    if (lifestealPct > 0) {
                        const heal = Math.floor(dotDmg * lifestealPct / 100);
                        if (heal > 0) {
                            p.hp = Math.min(p.maxHp, p.hp + heal);
                            spawnFloat('player-floats', `+${formatNum(heal)} (DoT)`, 'heal');
                            if (rc) rc.heal.dot_lifesteal += heal;
                        }
                    }
                    spawnFloat('enemy-floats', `-${formatNum(dotDmg)} (DoT)`, 'crit', 'left');
                }
            }
            if (db.ticksLeft <= 0) {
                toRemove.push(i);
                // Restore DEF if this debuff had defReductionPct
                if (db.defReductionPct && db.originalDef !== undefined) {
                    e.def = db.originalDef;
                }
                continue;
            }
            // Apply DEF reduction for hoja_toxica type (percentage-based)
            if (db.defReductionPct && db.originalDef === undefined) {
                db.originalDef = e.def;
            }
            if (db.defReductionPct && db.originalDef !== undefined) {
                e.def = Math.max(0, Math.floor(db.originalDef * (1 - db.defReductionPct / 100)));
            }
        } else if (db.type === 'vulnerability') {
            // Decrement ticksLeft every tick
            db.ticksLeft--;
            if (db.ticksLeft <= 0) {
                toRemove.push(i);
            }
        } else if (db.type === 'stat_drain') {
            // Desgaste: add stack every 2 seconds (20 ticks)
            if (db._tickCounter === undefined) db._tickCounter = 0;
            db._tickCounter++;
            if (db._tickCounter >= 20) {
                db._tickCounter = 0;
                if (db.stack < db.maxStack) {
                    db.stack = Math.min(db.stack + 1, db.maxStack);
                    db.ticksLeft = db.duration; // refresh duration
                }
            }
            db.ticksLeft--;
            if (db.ticksLeft <= 0) {
                toRemove.push(i);
            }
        } else if (db.type === 'burn') {
            // Quemadura: reduce ATK del enemigo mientras dura
            if (db.atkReductionPct && db.originalAtk === undefined) {
                db.originalAtk = e.atk;
            }
            if (db.atkReductionPct && db.originalAtk !== undefined) {
                e.atk = Math.max(0, Math.floor(db.originalAtk * (1 - db.atkReductionPct / 100)));
            }
            db.ticksLeft--;
            if (db.ticksLeft <= 0) {
                toRemove.push(i);
                if (db.atkReductionPct && db.originalAtk !== undefined) {
                    e.atk = db.originalAtk;
                }
            }
        }
    }

    // Remove expired debuffs (reverse order to preserve indices)
    for (let i = toRemove.length - 1; i >= 0; i--) {
        runState.enemyDebuffs.splice(toRemove[i], 1);
    }

    // Desgaste: apply stat drain from stacks
    const desgaste = runState.enemyDebuffs.find(d => d.type === 'stat_drain');
    if (desgaste && t('desgaste') > 0) {
        const d = TALENT_POOL.estado.find(x => x.id === 'desgaste').levels[t('desgaste') - 1];
        const drainPct = d.perTick * desgaste.stack / 100;
        // Apply multiplicative drain on base stats (stored in baseAtk/baseDef)
        if (desgaste.baseAtk === undefined) {
            desgaste.baseAtk = e.atk;
            desgaste.baseDef = e.def;
        }
        e.atk = Math.max(1, Math.floor(desgaste.baseAtk * (1 - drainPct)));
        e.def = Math.max(0, Math.floor(desgaste.baseDef * (1 - drainPct)));
    }
}

// T6 — getActiveDebuffIds()
function getActiveDebuffIds() {
    return runState.enemyDebuffs.map(d => d.id);
}

// Helper: check if a specific debuff type is active
function hasActiveDebuff(type) {
    return runState.enemyDebuffs.some(d => d.type === type);
}

// Diminishing returns: cap × (raw / (raw + K))
function diminishingReturns(raw, cap, k) {
    return cap * (raw / (raw + k));
}

function calcIlvl(item, useBase = false) {
    const enhMult = useBase ? 1 : (1 + (item.enhance || 0) * 0.1);
    const s = item.stats;
    let ilvl = (s.atk || 0) * enhMult * 1.0
         + (s.def || 0) * enhMult * 1.0
         + (s.agi || 0) * enhMult * 1.0
         + (s.hp || 0) * enhMult * 0.4
         + (s.crit || 0) * enhMult * 0.5
         + (s.lifesteal || 0) * enhMult * 0.5
         + (s.dodge || 0) * enhMult * 0.5
         + (s.block || 0) * enhMult * 0.4
         + (s.critDamage || 0) * enhMult * 0.4
         + (s.hpRegen || 0) * enhMult * 0.4
         + (s.bossDamage || 0) * enhMult * 0.3
         + (s.pen || 0) * enhMult * 0.3
         + (item.mastery ? item.mastery.level * 3 : 0);
    // Bonus stat contributes weighted by its stat's weight
    if (item.bonusStat && !useBase) {
        const w = { hp: 0.4, atk: 1.0, def: 1.0, agi: 1.0, crit: 0.5, lifesteal: 0.5, dodge: 0.5, block: 0.4, critDamage: 0.4, hpRegen: 0.4, bossDamage: 0.3, pen: 0.3 };
        ilvl += (item.bonusStat.bonus || 0) * (w[item.bonusStat.stat] || 0.4);
    }
    return ilvl;
}


  // Expose to namespace and global scope
  Game.calc = {
    speedToInterval: speedToInterval,
    getUpgradeCost: getUpgradeCost,
    calcDamage: calcDamage,
    getDerivedStats: getDerivedStats,
    calcPlayerStats: calcPlayerStats,
    calcEnemyStats: calcEnemyStats,
    clearDebuffs: clearDebuffs,
    applyDebuff: applyDebuff,
    processDebuffs: processDebuffs,
    getActiveDebuffIds: getActiveDebuffIds,
    hasActiveDebuff: hasActiveDebuff,
    diminishingReturns: diminishingReturns,
    calcIlvl: calcIlvl
  };
  window.speedToInterval = speedToInterval;
  window.getUpgradeCost = getUpgradeCost;
  window.calcDamage = calcDamage;
  window.getDerivedStats = getDerivedStats;
  window.calcPlayerStats = calcPlayerStats;
  window.calcEnemyStats = calcEnemyStats;
  window.clearDebuffs = clearDebuffs;
  window.applyDebuff = applyDebuff;
  window.processDebuffs = processDebuffs;
  window.getActiveDebuffIds = getActiveDebuffIds;
  window.hasActiveDebuff = hasActiveDebuff;
  window.diminishingReturns = diminishingReturns;
  window.calcIlvl = calcIlvl;
})();