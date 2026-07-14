// constants.js — pools, talents, masteries, classes, specializations.
// NOTE: Rune conditions/effects stay inline until a later phase.
// Extracted from Torre_Infinita.html (F2 core extraction).
(function() {
  'use strict';
  window.Game = window.Game || {};
const ENEMY_NAMES = ['Slime', 'Esqueleto', 'Murciélago', 'Goblin', 'Araña', 'Fantasma', 'Orco', 'Troll'];
const BOSS_NAMES = ['Guardián', 'Señor de la Torre', 'Dragón', 'Lich', 'Titán', 'Demonio', 'El Segador', 'El Devorador de Mundos', 'El Primigenio', 'El Enterrador'];

// Pool icons for talent display
const POOL_ICONS = {
    ofensivo: '⚔️',
    defensivo: '🛡️',
    estado: '💀',
    sustain: '💚',
    utilitario: '✨',
    heroico: '👑'
};

// TALENT POOLS — 37 talentos en 5 bloques
// Cada talento: { id, label, desc, levels: [{values}, {values}, {values}] }
const TALENT_POOL = {
    ofensivo: [
        { id: 'multiataque', label: 'Multiataque', desc: 'Probabilidad de atacar múltiples veces',
          levels: [{ chance: 20, hits: 2 }, { chance: 20, hits: 3 }, { chance: 20, hits: 4 }] },
{ id: 'primer_golpe', label: 'Primer Golpe', desc: 'Daño bonus en el primer ataque del combate',
           levels: [{ dmgMult: 1.50 }, { dmgMult: 1.80 }, { dmgMult: 2.20 }] },
        { id: 'golpe_preciso', label: 'Golpe Preciso', desc: 'Aumento de probabilidad crítica',
          levels: [{ flatCrit: 10 }, { flatCrit: 15 }, { flatCrit: 20 }] },
        { id: 'golpe_brutal', label: 'Golpe Brutal', desc: 'Probabilidad de hacer ×3 daño',
          levels: [{ chance: 8 }, { chance: 12 }, { chance: 16 }] },
        { id: 'ejecucion', label: 'Ejecución', desc: 'Si el enemigo tiene poco HP, tu daño se multiplica',
          levels: [{ threshold: 0.20, mult: 2 }, { threshold: 0.25, mult: 2.5 }, { threshold: 0.30, mult: 3 }] },
{ id: 'canon_cristal', label: 'Cañón de Cristal', desc: 'Aumento de daño recibiendo más daño con HP<50%',
           levels: [{ dmgBonus: 20, dmgTaken: 10 }, { dmgBonus: 30, dmgTaken: 15 }, { dmgBonus: 40, dmgTaken: 20 }] },
        { id: 'sangre_fria', label: 'Sangre Fría', desc: 'Cada X ataques, tu sangre fría te garantiza un golpe crítico',
          levels: [{ everyN: 7 }, { everyN: 5 }, { everyN: 3 }] },
        { id: 'golpe_penetrante', label: 'Golpe Penetrante', desc: 'Tus ataques ignoran % de la DEF del enemigo',
          levels: [{ penPct: 10 }, { penPct: 20 }, { penPct: 30 }] },
        { id: 'furia_creciente', label: 'Furia Creciente', desc: 'Cada ataque consecutivo hace +X% daño (máx acumulativo)',
          levels: [{ perHit: 10, maxStack: 10 }, { perHit: 20, maxStack: 10 }, { perHit: 30, maxStack: 10 }],
          note: 'Se resetea entre pisos.' },
        { id: 'eco_combate', label: 'Eco de Combate', desc: 'Probabilidad de replicar el ataque con daño reducido',
          levels: [{ chance: 15, dmgPct: 40 }, { chance: 20, dmgPct: 50 }, { chance: 25, dmgPct: 60 }] },
    ],
    defensivo: [
{ id: 'contraataque', label: 'Contraataque', desc: 'Al recibir daño, probabilidad de contraatacar con un ataque completo',
           levels: [{ chance: 15 }, { chance: 20 }, { chance: 25 }] },
        { id: 'escudo_vital', label: 'Escudo Vital', desc: 'Al entrar en combate, escudo = % de tu HP máximo',
          levels: [{ shieldPct: 8 }, { shieldPct: 12 }, { shieldPct: 16 }] },
        { id: 'indestructible', label: 'Indestructible', desc: 'Reducción de daño a costa de menos daño propio',
          levels: [{ dmgReduction: 15, selfDmgPenalty: 10 }, { dmgReduction: 22, selfDmgPenalty: 15 }, { dmgReduction: 30, selfDmgPenalty: 20 }] },
        { id: 'reflejos_felinos', label: 'Reflejos Felinos', desc: 'Probabilidad de evasión aumentada',
          levels: [{ flatDodge: 8 }, { flatDodge: 12 }, { flatDodge: 16 }] },
        { id: 'sangre_gigante', label: 'Sangre de Gigante', desc: 'Más HP máximo pero menos velocidad de ataque',
          levels: [{ hpBonus: 15, speedPenalty: 10 }, { hpBonus: 25, speedPenalty: 15 }, { hpBonus: 35, speedPenalty: 20 }] },
        { id: 'piel_piedra', label: 'Piel de Piedra', desc: 'Al recibir un golpe ≥15% HP máx, ganás vida temporal (3s)',
          levels: [{ shieldPct: 10, duration: 3 }, { shieldPct: 15, duration: 3 }, { shieldPct: 20, duration: 3 }] },
        { id: 'furia_ardiente', label: 'Furia Ardiente', desc: 'Aura - aplica daño de fuego cada segundo y tiene 20% probabilidad de quemar al enemigo',
          levels: [{ dmgPctPerTick: 1, chance: 20, atkReductionPct: 10 }, { dmgPctPerTick: 2, chance: 20, atkReductionPct: 15 }, { dmgPctPerTick: 3, chance: 20, atkReductionPct: 20 }] },
        { id: 'escudo_magico', label: 'Escudo Mágico', desc: 'Cada 3 ataques del enemigo, el próximo golpe se reduce el daño',
          levels: [{ everyN: 3, reduction: 30 }, { everyN: 3, reduction: 40 }, { everyN: 3, reduction: 50 }] },
        { id: 'veterano_batalla', label: 'Veterano de Batalla', desc: 'Cada 5 pisos completados, +reducción de daño acumulativa',
          levels: [{ per5Floors: 3, maxDr: 15 }, { per5Floors: 4, maxDr: 20 }, { per5Floors: 5, maxDr: 25 }] },
        { id: 'golpe_rapido', label: 'Golpe Rápido', desc: 'Al esquivar, tu próximo golpe hace daño aumentado',
          levels: [{ dmgBonus: 20 }, { dmgBonus: 30 }, { dmgBonus: 40 }] },
    ],
    estado: [
        { id: 'hemorragia', label: 'Hemorragia', desc: 'Probabilidad de aplicar sangrado al enemigo',
          levels: [{ chance: 20, dmgPctPerTick: 1, ticks: 3, maxStack: 3 }, { chance: 20, dmgPctPerTick: 2, ticks: 3, maxStack: 3 }, { chance: 20, dmgPctPerTick: 3, ticks: 3, maxStack: 3 }] },
        { id: 'marca_muerte', label: 'Marca de Muerte', desc: 'Tus ataques aplican vulnerabilidad: enemigo recibe +daño',
          levels: [{ vulnPct: 10, duration: 3 }, { vulnPct: 15, duration: 3 }, { vulnPct: 20, duration: 3 }],
          note: 'Se aplica en CADA golpe (sin chequeo de probabilidad).' },
        { id: 'golpe_cegador', label: 'Golpe Cegador', desc: 'Probabilidad de cegar al enemigo: falla su próximo ataque',
          levels: [{ chance: 8 }, { chance: 12 }, { chance: 16 }] },
        { id: 'hoja_toxica', label: 'Hoja Tóxica', desc: 'Probabilidad de envenenar: DoT + reduce DEF del enemigo',
          levels: [{ chance: 20, dmgPctPerTick: 2, ticks: 3, defReductionPct: 5, maxStack: 1 }, { chance: 20, dmgPctPerTick: 4, ticks: 3, defReductionPct: 10, maxStack: 1 }, { chance: 20, dmgPctPerTick: 6, ticks: 3, defReductionPct: 15, maxStack: 1 }] },
        { id: 'golpe_helado', label: 'Golpe Helado', desc: 'Probabilidad de congelar al boss (no ataca 2s). CD 3s',
          levels: [{ chance: 10 }, { chance: 15 }, { chance: 20 }] },
        { id: 'toque_helado', label: 'Toque Helado', desc: 'Tus ataques ralentizan la velocidad del enemigo',
          levels: [{ slowPct: 10, duration: 5 }, { slowPct: 15, duration: 6 }, { slowPct: 20, duration: 8 }] },
        { id: 'desgaste', label: 'Desgaste', desc: 'Cada 2s en combate, el enemigo pierde % de ATK y DEF (acumulativo)',
          levels: [{ perTick: 2, maxStack: 10 }, { perTick: 3, maxStack: 15 }, { perTick: 4, maxStack: 20 }] },
    ],
    sustain: [
        { id: 'toque_runico', label: 'Toque Rúnico', desc: 'Cada 5to ataque, curás % de tu HP máximo',
          levels: [{ healPct: 5 }, { healPct: 8 }, { healPct: 12 }] },
        { id: 'asalto_vampirico', label: 'Asalto Vampírico', desc: 'Aumenta robo de vida a TODAS las fuentes de daño',
          levels: [{ flatLifesteal: 5 }, { flatLifesteal: 8 }, { flatLifesteal: 12 }],
          note: 'Aplica a auto-ataques, DoTs, Furia Ardiente, Eco y Contraataque.' },
        { id: 'fortaleza', label: 'Fortaleza', desc: 'Cuando tu HP <50%, recibes menos daño',
          levels: [{ dmgReduction: 10 }, { dmgReduction: 20 }, { dmgReduction: 30 }] },
        { id: 'regeneracion', label: 'Regeneración', desc: 'Regenerás HP cada 2 segundos durante el combate',
          levels: [{ hpPctPer2s: 5 }, { hpPctPer2s: 10 }, { hpPctPer2s: 15 }] },
        { id: 'segundo_aliento', label: 'Segundo Aliento', desc: 'Cuando tu HP baja del 30%, cura instantánea de vida (una vez por combate)',
          levels: [{ healPct: 15 }, { healPct: 20 }, { healPct: 25 }] },
    ],
    heroico: [
        { id: 'dominio', label: 'Dominio', desc: 'Bonus a todos tus stats base (HP, ATK, DEF, AGI)',
          levels: [{ statBonus: 15 }, { statBonus: 30 }, { statBonus: 45 }] },
        { id: 'legado_heroe', label: 'Legado del Héroe', desc: 'Aumento de estadísticas por cada jefe derrotado en esta run',
          levels: [{ perBoss: 5 }, { perBoss: 6 }, { perBoss: 7 }] },
        { id: 'trinidad', label: 'Trinidad', desc: 'Bonus a prob. crítica, dodge y bloqueo',
          levels: [{ flatEach: 8 }, { flatEach: 12 }, { flatEach: 16 }] },
        { id: 'maestro_elemental', label: 'Maestro Elemental', desc: 'Más daño vs enemigos con DoT + tus DoT duran más',
          levels: [{ dmgBonus: 20, extraTicks: 1 }, { dmgBonus: 30, extraTicks: 1 }, { dmgBonus: 40, extraTicks: 2 }] },
        { id: 'resurreccion', label: 'Resurrección', desc: 'Revives una vez por combate',
          levels: [{ healPct: 25 }, { healPct: 50 }, { healPct: 75 }] },
    ],
};

// Helper: obtener todos los talentos de un pool como array plano
function getAllTalents() {
    const all = [];
    for (const pool of Object.values(TALENT_POOL)) {
        for (const t of pool) all.push(t);
    }
    return all;
}

// Helper: encontrar un talento por ID (incluye pool)
function findTalent(id) {
    const pools = ['ofensivo', 'defensivo', 'estado', 'sustain', 'heroico'];
    for (const pool of pools) {
        const found = TALENT_POOL[pool]?.find(t => t.id === id);
        if (found) return { ...found, pool };
    }
    return null;
}

const MASTERIES = {
    weapon: [
        { id: 'crit_mastery', label: 'Maestría Crítica', desc: 'Aumenta tu probabilidad crítica de forma plana (post-DR)', values: [5, 10, 15, 20] },
        { id: 'vampiric', label: 'Maestría Vampírica', desc: 'Aumenta el robo de vida de forma plana (post-DR)', values: [5, 7.5, 10, 15] },
        { id: 'fury', label: 'Maestría Furiosa', desc: 'Cada X ataques, tu golpe hace daño ×2', thresholds: [7, 5, 3, 2] },
    ],
    armor: [
        { id: 'block_mastery', label: 'Maestría Bloqueo', desc: 'Aumenta tu probabilidad de bloqueo de forma plana (post-DR)', values: [2.5, 5, 7.5, 10] },
        { id: 'regen_mastery', label: 'Maestría Regenerativa', desc: 'Regenerás % de tu HP máximo cada 1s durante el combate', values: [5, 7.5, 10, 15] },
        { id: 'tough_mastery', label: 'Maestría Resistente', desc: 'Cada 5 golpes recibidos, reducís % del daño de ese golpe', values: [5, 10, 15, 20] },
    ],
    ring: [
        { id: 'dodge_mastery', label: 'Maestría Evasiva', desc: 'Aumenta tu probabilidad de evasión de forma plana (post-DR)', values: [2.5, 5, 7.5, 10] },
        { id: 'pen_mastery', label: 'Maestría Perforante', desc: 'Aumenta tu penetración de forma plana (post-DR)', values: [5, 7.5, 10, 15] },
        { id: 'fortune_mastery', label: 'Maestría Afortunada', desc: 'Probabilidad de duplicar las almas obtenidas al morir', values: [10, 20, 30, 40] },
    ],
};

const CLASS_CONFIG = {
    warrior: { id: 'warrior', name: 'Guerrero', emoji: '🛡️', color: '#f97316',
        statPerLevel: { hp: 20, atk: 2, def: 3, agi: 1 } },
    warlock: { id: 'warlock', name: 'Brujo', emoji: '👹', color: '#a855f7',
        statPerLevel: { hp: 5, atk: 4, def: 1, agi: 1 } },
    rogue: { id: 'rogue', name: 'Pícaro', emoji: '☠️', color: '#10b981',
        statPerLevel: { hp: 10, atk: 2, def: 1, agi: 4 } },
    monk: { id: 'monk', name: 'Monje', emoji: '🐉', color: '#f59e0b',
        statPerLevel: { hp: 15, atk: 2, def: 2, agi: 3 } },
};

const CLASS_PASSIVES = {
    warrior: {
        id: 'rafaga_golpes', name: 'Ráfaga de Golpes',
        desc: 'Cada 3 golpes consecutivos, el 4° hace ×2~×3.8 daño',
        eval: (hl) => ({ mult: 2.0 + Math.max(0, hl - 50) * 0.004 }),
    },
    warlock: {
        id: 'pacto_oscuro', name: 'Pacto Oscuro',
        desc: '+8~12% lifesteal y +10~14% daño DoTs',
        eval: (hl) => ({
            lifestealPct: 8 + Math.floor(Math.max(0, hl - 50) / 100) * 2,
            dotDmgPct: 10 + Math.floor(Math.max(0, hl - 50) / 100) * 2,
        }),
    },
    rogue: {
        id: 'golpe_sigiloso', name: 'Golpe Sigiloso',
        desc: 'Primer ataque de cada combate: crítico garantizado con +25~+65% daño',
        eval: (hl) => ({ bonusDmg: 25 + Math.floor(Math.max(0, hl - 50) / 100) * 10 }),
    },
    monk: {
        id: 'flujo_chi', name: 'Flujo de Chi',
        desc: '+15~35% velocidad de ataque y +5~9% evasión',
        eval: (hl) => ({
            speedPct: 15 + Math.floor(Math.max(0, hl - 50) / 100) * 5,
            dodgePct: 5 + Math.floor(Math.max(0, hl - 50) / 100),
        }),
    },
};

const SPECIALIZATIONS = {
    warrior: [
        { id: 'arms', name: 'Armas', desc: 'Al derrotar un enemigo, el próximo golpe hace ×3~×5 daño' },
        { id: 'fury', name: 'Furia', desc: 'Cada golpe consecutivo acumula +2~+4% ATK (máx 10)' },
        { id: 'protection', name: 'Protección', desc: '+15~+40% DEF y convierte parte de tu DEF en ATK' },
    ],
    warlock: [
        { id: 'affliction', name: 'Aflicción', desc: 'Debuffs duran ×2~×3 más y DoTs hacen +20~+40% daño' },
        { id: 'demonology', name: 'Demonología', desc: '30~40% de invocar un demonio que golpea 3~4 veces al matar' },
        { id: 'destruction', name: 'Destrucción', desc: '+10~+14% crit base y críticos hacen ×3.5~×4.1 daño' },
    ],
    rogue: [
        { id: 'assassination', name: 'Asesinato', desc: '30~40% de aplicar veneno: 5~6% HP cada 3 ticks' },
        { id: 'outlaw', name: 'Forajido', desc: '20~30% de atacar dos veces en un mismo golpe' },
        { id: 'subtlety', name: 'Sutileza', desc: 'Al esquivar, el próximo golpe hace ×3~×4 daño' },
    ],
    monk: [
        { id: 'brewmaster', name: 'Maestro Cervecero', desc: 'Difiere 15~25% del daño recibido 2s y reduce daño plano' },
        { id: 'mistweaver', name: 'Tejedor de Bruma', desc: 'Cada 5 ataques curás 8~12% de tu HP máximo' },
        { id: 'windwalker', name: 'Vagabundo del Viento', desc: 'Cada 3 golpes conectados, el 4° hace +30~+50% daño' },
    ],
};

const SPEC_PASSIVES = {
    // Guerrero
    'arms': {
        id: 'maestro_armas', name: 'Maestro de Armas',
        desc: 'Al derrotar un enemigo, el próximo golpe hace ×N daño',
        eval: (hl) => ({ mult: 3.0 + Math.max(0, hl - 100) * 0.01 }),
    },
    'fury': {
        id: 'frenesi_batalla', name: 'Frenesí de Batalla',
        desc: 'Cada golpe consecutivo: +X% ATK (máx 10 acumulaciones)',
        eval: (hl) => ({ atkPerHit: 2 + Math.floor(Math.max(0, hl - 100) / 200) }),
    },
    'protection': {
        id: 'muro_escudo', name: 'Muro de Escudo',
        desc: '+X% DEF, +Y% de DEF convertido a ATK',
        eval: (hl) => {
            const x = 15 + Math.floor(Math.max(0, hl - 100) / 20);
            return { defPct: x, defToAtkPct: x - 5 };
        },
    },
    // Brujo
    'affliction': {
        id: 'afliccion_eterna', name: 'Aflicción Eterna',
        desc: 'Debuffs duran ×N tiempo, +Y% daño DoTs',
        eval: (hl) => ({
            durationMult: 2.0 + Math.max(0, hl - 100) * 0.005,
            dotDmgPct: 20 + Math.floor(Math.max(0, hl - 100) / 100) * 10,
        }),
    },
    'demonology': {
        id: 'esencia_demoníaca', name: 'Esencia Demoníaca',
        desc: 'Al matar: X% de invocar un demonio que golpea Y veces',
        eval: (hl) => ({
            chance: 30 + Math.floor(Math.max(0, hl - 100) / 100) * 5,
            hits: 3 + Math.floor(Math.max(0, hl - 100) / 100),
        }),
    },
    'destruction': {
        id: 'caos_ardiente', name: 'Caos Ardiente',
        desc: '+X% crit chance base, críticos hacen ×Y daño',
        eval: (hl) => ({
            critPct: 10 + Math.floor(Math.max(0, hl - 100) / 100) * 2,
            critMult: 3.5 + Math.max(0, hl - 100) * 0.003,
        }),
    },
    // Pícaro
    'assassination': {
        id: 'venenos_letales', name: 'Venenos Letales',
        desc: 'X% de aplicar veneno: Y% HP cada 3 ticks',
        eval: (hl) => ({
            chance: 30 + Math.floor(Math.max(0, hl - 100) / 100) * 5,
            dmgPct: 5 + Math.floor(Math.max(0, hl - 100) / 100),
        }),
    },
    'outlaw': {
        id: 'golpe_oportunidad', name: 'Golpe de Oportunidad',
        desc: 'X% de atacar dos veces',
        eval: (hl) => ({ chance: 20 + Math.floor(Math.max(0, hl - 100) / 100) * 5 }),
    },
    'subtlety': {
        id: 'danza_sombras', name: 'Danza de Sombras',
        desc: 'Al esquivar, el próximo golpe hace ×N daño',
        eval: (hl) => ({ mult: 3.0 + Math.max(0, hl - 100) * 0.005 }),
    },
    // Monje
    'brewmaster': {
        id: 'cuerpo_jade', name: 'Cuerpo de Jade',
        desc: 'X% de daño diferido 2s, +Y% reducción plana',
        eval: (hl) => ({
            staggerPct: 15 + Math.floor(Math.max(0, hl - 100) / 100) * 5,
            flatReduction: 5 + Math.floor(Math.max(0, hl - 100) / 200) * 2,
        }),
    },
    'mistweaver': {
        id: 'armonia_celestial', name: 'Armonía Celestial',
        desc: 'Cada 5 ataques: curás X% de tu HP máximo',
        eval: (hl) => ({ healPct: 8 + Math.floor(Math.max(0, hl - 100) / 100) * 2 }),
    },
    'windwalker': {
        id: 'tormenta_patadas', name: 'Tormenta de Patadas',
        desc: 'Cada 3 golpes no esquivados, el 4° hace +X% daño',
        eval: (hl) => ({ dmgPct: 30 + Math.floor(Math.max(0, hl - 100) / 100) * 20 }),
    },
};

function getClassPassiveValue(passiveId, key, heroLevel) {
    for (const cls of Object.values(CLASS_PASSIVES)) {
        if (cls.id === passiveId) {
            const vals = cls.eval(heroLevel);
            return vals[key] !== undefined ? vals[key] : vals;
        }
    }
    return null;
}

function getSpecPassiveValue(specId, key, heroLevel) {
    const spec = SPEC_PASSIVES[specId];
    if (!spec) return null;
    const vals = spec.eval(heroLevel);
    return key ? (vals[key] !== undefined ? vals[key] : vals) : vals;
}


  // Expose to namespace and global scope
  Game.constants = {
    ENEMY_NAMES: ENEMY_NAMES,
    BOSS_NAMES: BOSS_NAMES,
    POOL_ICONS: POOL_ICONS,
    TALENT_POOL: TALENT_POOL,
    MASTERIES: MASTERIES,
    CLASS_CONFIG: CLASS_CONFIG,
    CLASS_PASSIVES: CLASS_PASSIVES,
    SPECIALIZATIONS: SPECIALIZATIONS,
    SPEC_PASSIVES: SPEC_PASSIVES,
    getAllTalents: getAllTalents,
    findTalent: findTalent,
    getClassPassiveValue: getClassPassiveValue,
    getSpecPassiveValue: getSpecPassiveValue
  };
  window.ENEMY_NAMES = ENEMY_NAMES;
  window.BOSS_NAMES = BOSS_NAMES;
  window.POOL_ICONS = POOL_ICONS;
  window.TALENT_POOL = TALENT_POOL;
  window.MASTERIES = MASTERIES;
  window.CLASS_CONFIG = CLASS_CONFIG;
  window.CLASS_PASSIVES = CLASS_PASSIVES;
  window.SPECIALIZATIONS = SPECIALIZATIONS;
  window.SPEC_PASSIVES = SPEC_PASSIVES;
  window.getAllTalents = getAllTalents;
  window.findTalent = findTalent;
  window.getClassPassiveValue = getClassPassiveValue;
  window.getSpecPassiveValue = getSpecPassiveValue;
})();