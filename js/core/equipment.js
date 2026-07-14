// equipment.js — item generation and auto-equip logic.
// Extracted from Torre_Infinita.html (F2 core extraction).
(function() {
  'use strict';
  window.Game = window.Game || {};
function selectDungeonDrop(dungeonLevel, isBoss, isMiniboss) {
    if (isBoss) {
        // Boss (floor 10): always drop, cascade from high to low
        const ancestralPct = Math.min(2 + (dungeonLevel - 1) * 1, BALANCE.dungeon.dropRates.ancestralCap);
        const mythicPct = Math.min(1 + (dungeonLevel - 1) * 0.5, BALANCE.dungeon.dropRates.mythicCap);
        const legendarioPct = 100 - ancestralPct - mythicPct;
        const roll = Math.random() * 100;
        if (roll < mythicPct) return 'Mítico';
        if (roll < mythicPct + ancestralPct) return 'Ancestral';
        return 'Legendario';
    } else if (isMiniboss) {
        // Miniboss (floor 5): rates at half of boss (60% chance already checked by caller)
        const ancestralPct = Math.min(1 + (dungeonLevel - 1) * 0.5, BALANCE.dungeon.dropRates.ancestralCap / 2);
        const mythicPct = Math.min(0.5 + (dungeonLevel - 1) * 0.25, BALANCE.dungeon.dropRates.mythicCap / 2);
        const legendarioPct = 100 - ancestralPct - mythicPct;
        const roll = Math.random() * 100;
        if (roll < mythicPct) return 'Mítico';
        if (roll < mythicPct + ancestralPct) return 'Ancestral';
        return 'Legendario';
    } else {
        // Normal enemies: always Legendario, fixed 5% chance (checked by caller)
        return 'Legendario';
    }
}

function generateItem(floor, isBoss, opts = {}) {
    const { isDungeon, isMiniboss, dungeonLevel } = opts;
    let rarity;
    if (isDungeon) {
        // Dungeon: use selectDungeonDrop to determine rarity
        rarity = selectDungeonDrop(dungeonLevel || 1, isBoss, isMiniboss);
    } else {
        // Normal mode: use standard weights
        const rarities = BALANCE.equipment.rarities.map(r => r.name);
        const weights = isBoss
            ? [0, 65, 30, 5, 0, 0]
            : [70, 25, 5, 0, 0, 0];
        let rand = Math.random() * 100;
        rarity = 'Poco común';
        for (let i = 0; i < rarities.length; i++) {
            rand -= weights[i];
            if (rand <= 0) { rarity = rarities[i]; break; }
        }
    }

    const slots = BALANCE.equipment.slots;
    const slot = slots[Math.floor(Math.random() * slots.length)];
    const rarityData = BALANCE.equipment.rarities.find(r => r.name === rarity);
    const budget = Math.floor(BALANCE.equipment.budgetBase * Math.log2(floor + 1) * rarityData.statMult);

    // Stat pools & budget multipliers from BALANCE
    const statPools = BALANCE.equipment.statPools;
    const budgetMult = BALANCE.equipment.budgetMult;
    const pool = statPools[slot];

    // Ancestral/Mythic overrides
    const isAncestral = rarity === 'Ancestral';
    const isMythic = rarity === 'Mítico';
    const maxStats = isAncestral || isMythic; // Ambos con stats perfectas
    const statCount = (isAncestral || isMythic) ? 4 : (rarity === 'Poco común' ? 0 : rarity === 'Raro' ? 1 : rarity === 'Épico' ? 2 : 3);
    const hasMastery = ['Raro', 'Épico', 'Legendario', 'Ancestral', 'Mítico'].includes(rarity);
    const masteryLevel = isMythic ? 4 : isAncestral ? 3 : rarity === 'Raro' ? 1 : rarity === 'Épico' ? 2 : rarity === 'Legendario' ? 3 : 0;
    const masteryLocked = isMythic;

    const stats = {};
    const usedStats = new Set();

    const primaryStat = pool.primary[Math.floor(Math.random() * pool.primary.length)];
    const primaryMult = budgetMult.primary;
    if (maxStats) {
        // Ancestral/Mítico: máximo del rango del Legendario (×1.1)
        stats[primaryStat] = Math.floor(budget * primaryMult * 1.1);
    } else {
        stats[primaryStat] = Math.floor(budget * primaryMult * (0.9 + Math.random() * 0.2));
    }
    usedStats.add(primaryStat);

    const availableSecondary = pool.secondary.filter(s => !usedStats.has(s));
    for (let i = 0; i < statCount && availableSecondary.length > 0; i++) {
        const idx = Math.floor(Math.random() * availableSecondary.length);
        const secStat = availableSecondary.splice(idx, 1)[0];
        const mult = budgetMult[secStat] ?? budgetMult.flat;
        if (maxStats) {
            // Ancestral/Mítico: máximo del rango del Legendario (×1.2)
            stats[secStat] = Math.floor(budget * mult * 1.2);
        } else {
            stats[secStat] = Math.floor(budget * mult * (0.8 + Math.random() * 0.4));
        }
        usedStats.add(secStat);
    }

    const masteryPool = MASTERIES[slot] || [];
    let mastery = null;
    if (hasMastery && masteryPool.length > 0) {
        const picked = masteryPool[Math.floor(Math.random() * masteryPool.length)];
        mastery = { id: picked.id, level: masteryLevel, label: picked.label, locked: masteryLocked };
    }

    const item = {
        id: Date.now() + Math.random(),
        name: `${slot === 'weapon' ? 'Arma' : slot === 'armor' ? 'Armadura' : 'Anillo'}`,
        slot, rarity, stats,
        mastery,
        enhance: 0,
        bonusStat: null,
    };

    return item;
}

function tryEquip(item) {
    const current = metaState.equipment[item.slot];
    if (!current) {
        // Sin equipo previo: auto-equipar
        metaState.equipment[item.slot] = item;
        addLog(`✨ ¡Equipo mejorado! ${item.name}`, 'loot');
        render();
        return true;
    }

    const newIlvl = calcIlvl(item);
    const curIlvl = calcIlvl(current, true); // Base ilvl (no enhance)

    // Si ilvl >= actual → siempre mostrar modal, sin importar rareza
    if (newIlvl >= curIlvl) {
        showEquipComparison(current, item);
        return null;
    }

    // Rareza inferior + ilvl menor → descartar directo
    const rarityOrder = BALANCE.equipment.rarities;
    const curRarityIdx = rarityOrder.findIndex(r => r.name === current.rarity);
    const newRarityIdx = rarityOrder.findIndex(r => r.name === item.rarity);
    if (newRarityIdx < curRarityIdx) {
        return false;
    }

    // Umbral de ilvl al 90%
    if (newIlvl < curIlvl * 0.9) {
        return false;
    }

    // Mostrar comparación
    showEquipComparison(current, item);
    return null; // pendiente, el jugador decide
}


  // Expose to namespace and global scope
  Game.equipment = {
    selectDungeonDrop: selectDungeonDrop,
    generateItem: generateItem,
    tryEquip: tryEquip
  };
  window.selectDungeonDrop = selectDungeonDrop;
  window.generateItem = generateItem;
  window.tryEquip = tryEquip;
})();