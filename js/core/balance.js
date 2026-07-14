// balance.js — BALANCE: centralized game numbers.
// Extracted from Torre_Infinita.html (F2 core extraction).
(function() {
  'use strict';
  window.Game = window.Game || {};
const BALANCE = {
    // --- PLAYER BASE ---
    player: { hp: 100, atk: 10, def: 5, agi: 10 },

    // --- RUN LEVEL (flat por level up) ---
    levelUp: {
        choices: [
            { id: 'hp',  label: '+10 HP',  flat: 10, desc: 'Aumenta tu vida máxima en 10.' },
            { id: 'atk', label: '+1 ATK', flat: 1, desc: 'Aumenta tu ataque en 1.' },
            { id: 'def', label: '+1 DEF', flat: 1, desc: 'Aumenta tu defensa en 1.' },
            { id: 'agi', label: '+1 AGI', flat: 1, desc: 'Aumenta tu agilidad en 1.' },
        ],
        xpBase: 10,
        xpScale: 10,
        maxLevel: Infinity,
        abilityLevels: [5, 10, 15, 20],
    },

    // --- META PROGRESSION (% global sobre todo lo flat) ---
    metaUpgrades: {
        hp:   { baseCost: 10, scale: 1.5, percent: 0.05, label: '+5% HP', icon: '❤️' },
        atk:  { baseCost: 10, scale: 1.5, percent: 0.05, label: '+5% ATK', icon: '⚔️' },
        def:  { baseCost: 15, scale: 1.5, percent: 0.05, label: '+5% DEF', icon: '🛡️' },
        agi:  { baseCost: 20, scale: 1.6, percent: 0.02, label: '+2% AGI', icon: '🏃' },
        souls:{ baseCost: 25, scale: 1.7, flat: 1, percent: 0, label: '+1 alma/piso', icon: '💀', maxLevel: 10 },
        crit: { baseCost: 30, scale: 1.8, flat: 0, percent: 0.02, label: '+2% Crítico', icon: '🎯', maxLevel: 15 },
        pen:  { baseCost: 35, scale: 1.9, flat: 0, percent: 0.01, label: '+1% Penetración', icon: '💥', maxLevel: 10 },
        bossDmg: { baseCost: 40, scale: 2.0, flat: 0, percent: 0.10, label: '+10% Daño vs Boss', icon: '👑', maxLevel: 10 },
        critDmg: { baseCost: 30, scale: 1.8, flat: 0, percent: 0.20, label: '+20% Daño Crítico', icon: '💢', maxLevel: 10 },
    },

    // --- ENEMIES ---
    enemy: {
        normal: { hp: 10, atk: 3, def: 1, agi: 6 },
        boss:   { hp: 50, atk: 8, def: 3, agi: 7 },
        // Escalado por TIERS (cada 10 pisos = un salto de dificultad)
        tierScale: {
            normal: { hp: 2.2, atk: 2.0, def: 1.8 },
            boss:   { hp: 1.8, atk: 1.7, def: 1.6 },
        },
        // Escalado SUAVE dentro del mismo tier (piso a piso)
        subScale: {
            normal: { hp: 1.06, atk: 1.05, def: 1.04 },
            boss:   { hp: 1.04, atk: 1.05, def: 1.04 },
        },
        agiScale: 1.02,
        bossHpMult: 1.6,
        // Stats FIJOS para primera vez en piso 10 (caso especial: sin equipo)
        // Suficientemente duro para matarte la primera vez,
        // pero vencible tras 2-3 runs de meta-progresión.
        firstBoss: { hp: 150, atk: 15, def: 5 },
        // Escalado dinámico en PRIMER intento vs cada jefe (20+)
        dynamicBoss: {
            hpMult: 2.5,
            atkMult: 1.3,
            defMult: 1.2,
        },
    },

    // --- EQUIPMENT ---
    equipment: {
        dropBaseChance: 70,
        slots: ['weapon', 'armor', 'ring'],
        // Stat pools per slot
        statPools: {
            weapon: { primary: ['atk'], secondary: ['crit', 'lifesteal', 'pen', 'critDamage', 'bossDamage'] },
            armor: { primary: ['def'], secondary: ['hp', 'dodge', 'hpRegen', 'block'] },
            ring: { primary: ['atk', 'def', 'agi'], secondary: ['atk', 'def', 'agi', 'crit', 'dodge', 'pen', 'critDamage', 'bossDamage', 'hpRegen'] },
        },
        // Budget multipliers per stat type
        budgetMult: {
            crit: 1.5, lifesteal: 1.5, dodge: 1.5,
            pen: 1.5, critDamage: 1.5,
            bossDamage: 1.2, hpRegen: 1.2,
            hp: 1.5,
            flat: 0.4, // atk, def, agi as secondary
            primary: 1.0, // atk, def as primary
        },
        rarities: [
            { name: 'Poco común', weights: [70, 0, 0, 0, 0, 0],  statMult: 1.0 },
            { name: 'Raro',         weights: [25, 60, 0, 0, 0, 0], statMult: 1.5 },
            { name: 'Épico',        weights: [5, 30, 0, 0, 0, 0],  statMult: 2.0 },
            { name: 'Legendario',   weights: [0, 10, 0, 0, 0, 0],  statMult: 3.0 },
            { name: 'Ancestral',    weights: [0, 0, 0, 0, 0, 0],  statMult: 3.0 },
            { name: 'Mítico',       weights: [0, 0, 0, 0, 0, 0],  statMult: 4.0 },
        ],
        budgetBase: 5,
    },

    // --- COMBAT ---
    combat: {
        tickMs: 100,
        speedBase: 3000,
        speedPerAgi: 100,
        speedMin: 1000,
        minDamage: 1,
        // Diminishing returns: cap × (stat / (stat + K))
        critCap: 80, critK: 100,
        dodgeCap: 40, dodgeK: 80, dodgeRatingRatio: 5,
        blockCap: 50, blockK: 100,
        lifestealCap: 25, lifestealK: 80,
        // New stat caps with diminishing returns
        penCap: 50, penK: 100,
        critDmgBase: 50, critDmgCap: 600, critDmgK: 200,
        bossDmgCap: 100, bossDmgK: 150,
    },

    // --- SOULS ---
    souls: {
        baseMult: 2,
    },

    // --- DUNGEON ---
    dungeon: {
        maxFloors: 10,
        dailyAttempts: 3,
        soulCostBase: 500,
        soulCostMult: 2,
        dropRates: {
            boss: { legendario: 97, ancestral: 2, mythic: 1 },
            minibossChance: 100,
            minibossMult: 0.5,
            normalChance: 50,
            ancestralCap: 10,
            mythicCap: 5,
            capLevel: 9,
        },
    },
    // --- DoT COMBAT ---
    // --- PRESTIGE / RENACIMIENTO ---
    heroArtifact: {
        nodes: [
            { id: 'fuerza_ancestral',  label: '⚔️ Fuerza Ancestral',  flatBonus: 100 },
            { id: 'coraza_ancestral',  label: '🛡️ Coraza Ancestral',   flatBonus: 100 },
            { id: 'vitalidad_ancestral', label: '❤️ Vitalidad Ancestral', flatBonus: 1000 },
            { id: 'pasos_ancestrales',  label: '🏃 Pasos Ancestrales',  flatBonus: 50 },
            { id: 'talento_innato',    label: '💥 Talento Innato',     bonus: 0.05 },
            { id: 'herencia_equipo',   label: '💍 Herencia del Equipo', bonus: 0.05 },
            { id: 'sabiduria_eterna',  label: '📖 Sabiduría Eterna',   bonus: 0.05 },
            { id: 'fortuna_heroe',     label: '🍀 Fortuna del Héroe',  bonus: 0.05 },
            { id: 'ciclo_legado',      label: '🪶 Ciclo del Legado',    bonus: 0.05 },
            { id: 'voluntad_heroe',    label: '💀 Voluntad del Héroe',  bonus: 0.05 },
        ],
        costBase: 5,
    },

    // --- RUNAS ---
    runas: {
        fabricateCost: { powder: 10, souls: 100 },
        enhanceCostScale: 1.5,
        enhanceMultPerLevel: 0.08,
        rerollCosts: { random: { powder: 3, souls: 30 }, choose: { powder: 8, souls: 80 } },
        rarityConfig: {
            S: { maxEnhance: 5, effectMult: 1.0, upgradeCost: null },
            SS: { maxEnhance: 10, effectMult: 1.5, upgradeCost: { powder: 25, souls: 250 } },
            SSS: { maxEnhance: 0, effectMult: 2.5, upgradeCost: { powder: 100, souls: 1000 } },
        },
    },
};


  // Expose to namespace and global scope (temporary — inline code still references BALANCE directly)
  Game.balance = { BALANCE: BALANCE };
  window.BALANCE = BALANCE;
})();