// talents.js — level-up, talent choices, and choice rendering.
// Extracted from Torre_Infinita.html (F3 game logic).
(function() {
  'use strict';
  window.Game = window.Game || {};

  function checkLevelUp() {
    if (runState.level >= BALANCE.levelUp.maxLevel) {
      startCombat();
      return;
    }
    if (runState.xp >= runState.xpToNext) {
      runState.xp -= runState.xpToNext;
      runState.level++;

      // Auto-apply all stats on every level up (tiered cada 50 niveles)
      const levelTier = Math.ceil(runState.level / 50);
      const hpGain = 10 * levelTier;
      const statGain = 1 * levelTier;
      runState.runBonuses.hp  += hpGain;
      runState.runBonuses.atk += statGain;
      runState.runBonuses.def += statGain;
      runState.runBonuses.agi += statGain;
      addLog(`⬆️ ¡Nivel ${runState.level}! ❤️+${hpGain} HP ⚔️+${statGain} ATK 🛡️+${statGain} DEF 🏃+${statGain} AGI`, 'system');

      runState.xpToNext = BALANCE.levelUp.xpScale * runState.level;

      // Clase: añadir stats por nivel (primer bonus al pasar a nivel 51)
      if (metaState.playerClass && runState.level > 50) {
        const cfg = CLASS_CONFIG[metaState.playerClass];
        if (cfg) {
          runState.runBonuses.hp += cfg.statPerLevel.hp;
          runState.runBonuses.atk += cfg.statPerLevel.atk;
          runState.runBonuses.def += cfg.statPerLevel.def;
          runState.runBonuses.agi += cfg.statPerLevel.agi;
        }
      }

      // Persistir nivel y bonuses a metaState
      metaState.heroLevel = runState.level;
      metaState.heroXp = runState.xp;
      metaState.heroBonuses = { ...runState.runBonuses };
      saveGame();

      // Desbloquear clase al nivel 50
      if (runState.level === 50 && !metaState.playerClass) {
        startCombat();
        showClassSelection();
        return;
      }
      // Desbloquear especialización al nivel 100
      if (runState.level === 100 && metaState.playerClass && !metaState.playerSpec) {
        startCombat();
        showSpecSelection();
        return;
      }

      startCombat();
    } else {
      startCombat();
    }
  }

  function selectTalent(id, level) {
    runState.talentLevels[id] = level;
    if (!runState.abilities.includes(id)) {
      runState.abilities.push(id);
    }
    closeChoice();
  }

  // Expose public API
  Game.talents = {
    checkLevelUp: checkLevelUp,
    selectTalent: selectTalent
  };

  // Temporary window bridges
  window.checkLevelUp = checkLevelUp;
  window.selectTalent = selectTalent;
})();
