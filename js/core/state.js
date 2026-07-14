// state.js — metaState, runState, save/load, persistence.
// Extracted from Torre_Infinita.html (F2 core extraction).
(function() {
  'use strict';
  window.Game = window.Game || {};
const SAVE_KEY = 'torre_infinita_save_v1';

const metaState = {
    souls: 0,
    essence: 0,
    maxFloor: 0,
    unlockedEquipment: false,
    unlockedTraining: false,
    unlockedReforge: false,
    equipment: { weapon: null, armor: null, ring: null },
    runePowder: 0,
    runeInventory: {},
    upgrades: {},
    bossAttempted: [], // pisos de jefe YA intentados (persistente entre runs)
    bossStats: {},    // stats guardadas del PRIMER intento de cada jefe
    dataVersion: 4,   // Para migraciones futuras
    heroLevel: 0,     // Nivel persistente del héroe (no se resetea al morir, arranca en 0)
    heroXp: 0,        // XP persistente del héroe
    heroBonuses: { hp: 0, atk: 0, def: 0, agi: 0 }, // Stats acumuladas por nivel
    playerName: 'Héroe', // Nombre del jugador (persistente)
    playerClass: null,   // 'warrior' | 'warlock' | 'rogue' | 'monk' | null
    playerSpec: null,    // id de especialización o null
    leaderboard: [],      // Top 10 mejores runs [{name, class, heroLevel, maxFloor, runTime, date}]
    heroArtifact: {
        nodes: {},
        legacyEssence: 0,
        rebirthCount: 0,
    },
    hasRebirthed: false,
    dungeon: {
        unlockedLevels: [],
        attemptsToday: 0,
        attemptsTodayLegacy: 0,
        lastAttemptDate: '',
        currentDifficulty: 0,
        currentFloor: 0,
        completedToday: false,
    },
};

// Inicializar upgrades desde BALANCE
for (const [key, u] of Object.entries(BALANCE.metaUpgrades)) {
    metaState.upgrades[key] = { level: 0, ...u };
}

// Inicializar nodos del árbol de legado
for (const n of BALANCE.heroArtifact.nodes) {
    metaState.heroArtifact.nodes[n.id] = 0;
}

function saveGame() {
    const data = {
        dataVersion: metaState.dataVersion,
        souls: metaState.souls,
        essence: metaState.essence,
        maxFloor: metaState.maxFloor,
        unlockedEquipment: metaState.unlockedEquipment,
        unlockedTraining: metaState.unlockedTraining,
        unlockedReforge: metaState.unlockedReforge,
        equipment: metaState.equipment,
        upgrades: {},
        bossAttempted: metaState.bossAttempted,
        bossStats: metaState.bossStats,
        heroLevel: metaState.heroLevel,
        heroXp: metaState.heroXp,
        heroBonuses: metaState.heroBonuses,
        playerName: metaState.playerName,
        playerClass: metaState.playerClass,
        playerSpec: metaState.playerSpec,
        heroArtifact: metaState.heroArtifact,
        hasRebirthed: metaState.hasRebirthed,
        leaderboard: metaState.leaderboard,
        dungeon: { ...metaState.dungeon },
        runePowder: metaState.runePowder,
        runeInventory: metaState.runeInventory,
    };
    for (const [key, u] of Object.entries(metaState.upgrades)) {
        data.upgrades[key] = { level: u.level };
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    flashSaveIndicator();
}

function flashSaveIndicator() {
    const el = document.getElementById('save-indicator');
    if (!el) return;
    el.style.opacity = '1';
    setTimeout(() => el.style.opacity = '0', 1500);
}

function loadGame() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    try {
        const data = JSON.parse(raw);
        metaState.souls = data.souls ?? 0;
        metaState.essence = data.essence ?? 0;
        metaState.maxFloor = data.maxFloor ?? 0;
        metaState.unlockedEquipment = data.unlockedEquipment ?? false;
        metaState.unlockedTraining = data.unlockedTraining ?? false;
        metaState.unlockedReforge = data.unlockedReforge ?? false;
        metaState.equipment = data.equipment ?? { weapon: null, armor: null, ring: null };
        metaState.bossAttempted = data.bossAttempted ?? [];
        metaState.bossStats = data.bossStats ?? {};
        metaState.heroLevel = data.heroLevel ?? 0;
        metaState.heroXp = data.heroXp ?? 0;
        metaState.heroBonuses = data.heroBonuses ?? { hp: 0, atk: 0, def: 0, agi: 0 };
        metaState.playerName = data.playerName ?? 'Héroe';
        metaState.playerClass = data.playerClass ?? null;
        metaState.playerSpec = data.playerSpec ?? null;
        metaState.leaderboard = data.leaderboard ?? [];
        metaState.dataVersion = data.dataVersion ?? 0;
        metaState.dungeon = data.dungeon ?? { unlockedLevels: [], attemptsToday: 0, lastAttemptDate: '', currentDifficulty: 0, currentFloor: 0, completedToday: false };
        metaState.heroArtifact = data.heroArtifact ?? { nodes: {}, legacyEssence: 0, rebirthCount: 0 };
        metaState.hasRebirthed = data.hasRebirthed ?? false;
        metaState.runePowder = data.runePowder ?? 0;
        metaState.runeInventory = data.runeInventory ?? {};
        // Asegurar que todos los nodos del árbol existen (saves parciales)
        if (BALANCE.heroArtifact) {
            for (const n of BALANCE.heroArtifact.nodes) {
                if (metaState.heroArtifact.nodes[n.id] === undefined) {
                    metaState.heroArtifact.nodes[n.id] = 0;
                }
            }
        }
        // Migración v0→v1: recalcular heroBonuses con sistema escalonado
        let needsMigration = false;
        if (metaState.dataVersion < 1) {
            metaState.heroBonuses = calcTieredBonuses(metaState.heroLevel);
            metaState.dataVersion = 1;
            needsMigration = true;
        }
        // Migración v1→v2: agregar playerName y leaderboard
        if (metaState.dataVersion < 2) {
            metaState.playerName = metaState.playerName || 'Héroe';
            metaState.leaderboard = metaState.leaderboard || [];
            metaState.dataVersion = 2;
            needsMigration = true;
        }
        // Migración v2→v3: agregar enhance y bonusStat a items
        if (metaState.dataVersion < 3) {
            for (const slot of ['weapon', 'armor', 'ring']) {
                const item = metaState.equipment[slot];
                if (item) {
                    if (item.enhance === undefined) item.enhance = 0;
                    if (item.bonusStat === undefined) item.bonusStat = null;
                }
            }
            metaState.unlockedReforge = metaState.unlockedReforge ?? false;
            metaState.dataVersion = 3;
            needsMigration = true;
        }
        // Migración v3→v4: agregar playerClass y playerSpec
        if (metaState.dataVersion < 4) {
            metaState.playerClass = null;
            metaState.playerSpec = null;
            metaState.dataVersion = 4;
            needsMigration = true;
        }
        // Migración v4→v5: prestigio / renacimiento
        if (metaState.dataVersion < 5) {
            metaState.heroArtifact = {
                nodes: {},
                legacyEssence: 0,
                rebirthCount: 0,
            };
            for (const n of BALANCE.heroArtifact.nodes) {
                metaState.heroArtifact.nodes[n.id] = 0;
            }
            metaState.hasRebirthed = false;
            if (!metaState.dungeon.attemptsTodayLegacy) {
                metaState.dungeon.attemptsTodayLegacy = 0;
            }
            if (!metaState.dungeon.attemptsTodayAncestral) {
                metaState.dungeon.attemptsTodayAncestral = 0;
            }
            metaState.dataVersion = 5;
            needsMigration = true;
        }
        // Migración v5→v6: runas en equipo
        if (metaState.dataVersion < 6) {
            for (const slot of ['weapon', 'armor', 'ring']) {
                const item = metaState.equipment[slot];
                if (item && item.runas === undefined) {
                    item.runas = null;
                }
            }
            metaState.runePowder = metaState.runePowder ?? 0;
            metaState.runeInventory = metaState.runeInventory ?? {};
            metaState.dataVersion = 6;
            needsMigration = true;
        }
        // Inicialización incondicional: campos de dungeon faltantes
        if (metaState.dungeon.attemptsTodayAncestral === undefined) {
            metaState.dungeon.attemptsTodayAncestral = 0;
        }
        if (metaState.dungeon.attemptsTodayLegacy === undefined) {
            metaState.dungeon.attemptsTodayLegacy = 0;
        }
        if (data.upgrades) {
            for (const [key, saved] of Object.entries(data.upgrades)) {
                if (metaState.upgrades[key]) {
                    metaState.upgrades[key].level = saved.level ?? 0;
                }
            }
        }
        // Guardar SOLO después de restaurar upgrades para no pisarlos con 0
        if (needsMigration) {
            saveGame();
        }
        return true;
    } catch {
        return false;
    }
}

function checkTrainingUnlock() {
    if (metaState.maxFloor >= 30 && !metaState.unlockedTraining) {
        metaState.unlockedTraining = true;
        saveGame();
    }
}

function spendEssence(amount) {
    if (metaState.essence < amount) return false;
    metaState.essence -= amount;
    saveGame();
    render();
    return true;
}

function resetGame() {
    if (!confirm('¿Seguro que quieres borrar TODO el progreso? Esta acción no se puede deshacer.')) return;
    localStorage.removeItem(SAVE_KEY);
    // Reset metaState
    metaState.souls = 0;
    metaState.essence = 0;
    metaState.maxFloor = 0;
    metaState.unlockedEquipment = false;
    metaState.unlockedTraining = false;
    metaState.unlockedReforge = false;
    metaState.equipment = { weapon: null, armor: null, ring: null };
    metaState.runePowder = 0;
    metaState.runeInventory = {};
    metaState.bossAttempted = [];
    metaState.bossStats = {};
    metaState.dataVersion = 6;
    metaState.heroLevel = 0;
    metaState.heroXp = 0;
    metaState.heroBonuses = { hp: 0, atk: 0, def: 0, agi: 0 };
    metaState.playerName = 'Héroe';
    metaState.playerClass = null;
    metaState.playerSpec = null;
    metaState.leaderboard = [];
    metaState.heroArtifact = { nodes: {}, legacyEssence: 0, rebirthCount: 0 };
    for (const n of BALANCE.heroArtifact.nodes) {
        metaState.heroArtifact.nodes[n.id] = 0;
    }
    metaState.hasRebirthed = false;
    metaState.dungeon = { unlockedLevels: [], attemptsToday: 0, attemptsTodayLegacy: 0, attemptsTodayAncestral: 0, lastAttemptDate: '', currentDifficulty: 0, currentFloor: 0, completedToday: false };
    for (const key of Object.keys(metaState.upgrades)) {
        metaState.upgrades[key].level = 0;
    }
    if (combatLoop) clearInterval(combatLoop);
    runState.active = false;
    runState.floor = 1;
    runState.level = 0;
    runState.xp = 0;
    runState.xpToNext = BALANCE.levelUp.xpBase;
    runState.runBonuses = { hp: 0, atk: 0, def: 0, agi: 0 };
    runState.enemy = null;
    runState.recap = initRecap();
    runState.runeBuffs = [];
    runState.runeCooldowns = {};
    runState.runeConditionsTick = 0;
    if (runState.enemy && runState.enemy._runeQuebrantarOrigDef !== undefined) {
        runState.enemy.def = runState.enemy._runeQuebrantarOrigDef;
        delete runState.enemy._runeQuebrantarOrigDef;
    }
    document.getElementById('combat-log').innerHTML = '';
    addLog('🗼 Progreso borrado. Nueva run iniciada.', 'system');
    render();
    updateButtons();
    saveGame();
}

const runState = {
    active: false,
    floor: 1,
    runStartTime: null,
    level: 0,
    xp: 0,
    xpToNext: BALANCE.levelUp.xpBase,
    runBonuses: { hp: 0, atk: 0, def: 0, agi: 0 },
    player: { hp: 0, maxHp: 0, atk: 0, def: 0, agi: 0, attackTimer: 0 },
    enemy: null,
    combatInterval: BALANCE.combat.tickMs,
    pendingChoice: null,
    characterScreenActive: false,
    classHits: 0,
    firstHitDone: false,
    nextHitMult: 1,
    dodgeStreak: 0,
    attackCounter: 0,
    demonHits: 0,
    demonActive: false,
    demonHitsLeft: 0,
    classComboStacks: 0,
    furyCounter: 0,
    toughCounter: 0,
    abilities: [], // Talentos activos en esta run (se resetean al morir/reiniciar)
    talentLevels: {}, // { talentId: nivel (1, 2, 3) } — rastrea progreso de cada talento
    enemyDebuffs: [], // Debuffs activos sobre el enemigo (DoT, vulnerabilidad, etc.)
    vitalShield: 0, // Escudo Vital acumulado (persiste entre combates, se resetea al morir)
    piedraShield: { amount: 0, ticksLeft: 0 }, // Escudo temporal de Piel de Piedra (3s)
    shieldMax: 0, // Para calcular el % de la barra de escudo
    // Training mode
    trainingMode: false,
    trainingFloor: 30,
    enemiesDefeated: 0,
    hasRevived: false,
    furiaStacks: 0,
    critMasteryCounter: 0,
    runeTapCounter: 0,
    golpeBonus: 0,
    spellShieldCounter: 0,
    segundoAlientoUsed: false,
    bossesKilledThisRun: 0,
    _staggerDmg: 0,
    _staggerTick: 0,
    // Rune system
    runeBuffs: [],
    runeCooldowns: {},
    runeConditionsTick: 0,
    runeComboHits: 0,
    runeJustDodged: false,
    runeJustCritHit: false,
    runeLastTickProc: 0,
    runeDebuffsSinceProc: 0,
    tickCount: 0,
    recap: null,
    // Dungeon mode
    dungeonMode: false,
    dungeonDifficulty: 0,
    legacyAbyssMode: false,
    // Rune Chamber mode
    runeChamberMode: false,
    runeWave: 0,
    // Cámara Ancestral (wave-based)
    towerMode: false,
    towerWave: 0,
    towerEnemy: 0,
    runeAccumulatedPowder: 0,
    runeChamberBosses: 0,
    artifactMult: { xp: 1, drop: 1, souls: 1, talentDmg: 1 },
};

function initRecap() {
    return {
        dmg: {
            normal: 0,        // base auto-attack damage (before any multiplier)
            crit: 0,          // bonus damage from crits
            multiataque: 0,   // damage from extra Multiataque hits
            primer_golpe: 0,  // bonus from Primer Golpe
            golpe_brutal: 0,  // damage from Golpe Brutal procs
            ejecucion: 0,     // bonus from Ejecución
            furia_creciente: 0, // bonus from Furia Creciente
            canon_cristal: 0, // bonus from Cañón de Cristal
            boss_dmg: 0,      // bonus from boss damage %
            eco_combate: 0,   // damage from Eco de Combate echoes
            hemorragia: 0,    // Hemorragia DoT ticks
            hoja_toxica: 0,   // Hoja Tóxica DoT ticks
            furia_ardiente: 0, // Furia Ardiente fire damage
            contraataque: 0,  // Counterattack damage
            maestro_elemental: 0, // Maestro Elemental bonus
            furia_mastery: 0, // Maestría Furiosa bonus
            sangre_fria: 0,   // Sangre Fría guaranteed crit bonus
            golpe_rapido: 0, // Golpe Rápido bonus
            reflected: 0,     // damage reflected (reserve)
        },
        mitigation: {
            def: 0,           // damage prevented by DEF calc
            block: 0,         // damage prevented by block (50% reduction)
            dodge_hits: 0,    // number of enemy attacks dodged
            dodge_dmg: 0,     // damage prevented by dodge (post-DEF value)
            vital_shield: 0,  // damage absorbed by Vital Shield
            piedra_shield: 0, // damage absorbed by Piel de Piedra
            indestructible: 0, // damage reduced by Indestructible
            fortaleza: 0,     // damage reduced by Fortaleza
            escudo_magico: 0, // damage reduced by Escudo Mágico
            veterano: 0,      // damage reduced by Veterano de Batalla
            resistente: 0,    // damage reduced by Maestría Resistente
            canon_recibido: 0, // extra damage taken from Cañón de Cristal
            total_raw: 0,     // total raw enemy attack BEFORE any mitigation
            total_taken: 0,   // total damage actually taken (after all mitigation)
        },
        heal: {
            lifesteal: 0,     // healing from lifesteal
            asalto_vampirico: 0, // bonus lifesteal from Asalto Vampírico
            toque_runico: 0,  // healing from Toque Rúnico
            segundo_aliento: 0, // healing from Segundo Aliento
            regeneracion: 0,  // healing from Regeneración talent
            hp_regen: 0,      // healing from equipment HP REGEN + Maestría Regenerativa
            dot_lifesteal: 0, // lifesteal from DoT damage
            echo_lifesteal: 0, // lifesteal from Eco de Combate
            counter_lifesteal: 0, // lifesteal from Contraataque
        },
    };
}


  // Expose to namespace and global scope
  Game.state = {
    SAVE_KEY: SAVE_KEY,
    metaState: metaState,
    runState: runState,
    initRecap: initRecap,
    saveGame: saveGame,
    loadGame: loadGame,
    flashSaveIndicator: flashSaveIndicator,
    checkTrainingUnlock: checkTrainingUnlock,
    spendEssence: spendEssence,
    resetGame: resetGame
  };
  window.SAVE_KEY = SAVE_KEY;
  window.metaState = metaState;
  window.runState = runState;
  window.initRecap = initRecap;
  window.saveGame = saveGame;
  window.loadGame = loadGame;
  window.flashSaveIndicator = flashSaveIndicator;
  window.checkTrainingUnlock = checkTrainingUnlock;
  window.spendEssence = spendEssence;
  window.resetGame = resetGame;
})();