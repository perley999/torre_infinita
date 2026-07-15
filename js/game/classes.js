// classes.js — class/spec helpers, selection modals, character screen.
// Extracted from Torre_Infinita.html (F3 game logic).
(function() {
  'use strict';
  window.Game = window.Game || {};

  function calcularClassBonuses(heroLevel, playerClass) {
    const result = { hp: 0, atk: 0, def: 0, agi: 0 };
    if (!playerClass || !CLASS_CONFIG[playerClass] || heroLevel < 50) return result;
    const config = CLASS_CONFIG[playerClass];
    const levels = Math.max(0, heroLevel - 50);
    result.hp = levels * config.statPerLevel.hp;
    result.atk = levels * config.statPerLevel.atk;
    result.def = levels * config.statPerLevel.def;
    result.agi = levels * config.statPerLevel.agi;
    return result;
  }

  function getClassConfig(classId) {
    return CLASS_CONFIG[classId] || null;
  }

  function getClassName(classId) {
    const cfg = CLASS_CONFIG[classId];
    return cfg ? cfg.name : 'Héroe';
  }

  function getSpecName(specId) {
    for (const specs of Object.values(SPECIALIZATIONS)) {
      const found = specs.find(s => s.id === specId);
      if (found) return found.name;
    }
    return null;
  }

  function getClassPassive(classId) {
    return CLASS_PASSIVES[classId] || null;
  }

  function getSpecPassive(specId) {
    return SPEC_PASSIVES[specId] || null;
  }

  // Expose public API
  Game.classes = {
    calcularClassBonuses: calcularClassBonuses,
    getClassConfig: getClassConfig,
    getClassName: getClassName,
    getSpecName: getSpecName,
    getClassPassive: getClassPassive,
    getSpecPassive: getSpecPassive
  };

  // Temporary window bridges for inline code that still references these directly
  window.calcularClassBonuses = calcularClassBonuses;
  window.getClassConfig = getClassConfig;
  window.getClassName = getClassName;
  window.getSpecName = getSpecName;
  window.getClassPassive = getClassPassive;
  window.getSpecPassive = getSpecPassive;
})();
