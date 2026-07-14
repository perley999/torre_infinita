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

  function showTalentChoice(floor) {
    runState.pendingChoice = 'ability';
    const isHeroic = floor % 20 === 0;
    const choices = [];

    function pickRandom(pool) {
      const eligible = pool.filter(t => {
        const currentLevel = runState.talentLevels[t.id] || 0;
        if (currentLevel === 0) return true;
        if (currentLevel < 3) return true;
        return false;
      });
      if (eligible.length === 0) return null;
      return eligible[Math.floor(Math.random() * eligible.length)];
    }

    // 1. Ofensivo (siempre)
    const ofensivo = pickRandom(TALENT_POOL.ofensivo);
    if (ofensivo) {
      const lvl = runState.talentLevels[ofensivo.id] || 0;
      const nextLvl = lvl + 1;
      choices.push({
        label: `${ofensivo.label} (Nv.${nextLvl})`,
        desc: ofensivo.desc,
        pool: 'ofensivo',
        action: () => { selectTalent(ofensivo.id, nextLvl); }
      });
    }

    // 2. Defensivo (siempre)
    const defensivo = pickRandom(TALENT_POOL.defensivo);
    if (defensivo) {
      const lvl = runState.talentLevels[defensivo.id] || 0;
      const nextLvl = lvl + 1;
      choices.push({
        label: `${defensivo.label} (Nv.${nextLvl})`,
        desc: defensivo.desc,
        pool: 'defensivo',
        action: () => { selectTalent(defensivo.id, nextLvl); }
      });
    }

    // 3. Estado o Sustain (combinados como 3ra opción)
    const estadoSustain = [...TALENT_POOL.estado, ...TALENT_POOL.sustain];
    const estadoOrSustain = pickRandom(estadoSustain);
    if (estadoOrSustain) {
      const lvl = runState.talentLevels[estadoOrSustain.id] || 0;
      const nextLvl = lvl + 1;
      const poolName = TALENT_POOL.estado.includes(estadoOrSustain) ? 'estado' : 'sustain';
      choices.push({
        label: `${estadoOrSustain.label} (Nv.${nextLvl})`,
        desc: estadoOrSustain.desc,
        pool: poolName,
        action: () => { selectTalent(estadoOrSustain.id, nextLvl); }
      });
    }

    // 4. Heroico (solo cada 20 niveles)
    if (isHeroic) {
      const heroico = pickRandom(TALENT_POOL.heroico);
      if (heroico) {
        const lvl = runState.talentLevels[heroico.id] || 0;
        const nextLvl = lvl + 1;
        choices.push({
          label: `⭐ ${heroico.label} (Nv.${nextLvl})`,
          desc: heroico.desc,
          pool: 'heroico',
          action: () => { selectTalent(heroico.id, nextLvl); }
        });
      }
    }

    const title = isHeroic
      ? `¡Talento Heroico — Piso ${floor}!`
      : `¡Talento — Piso ${floor}!`;
    const subtitle = isHeroic
      ? 'Elige un talento especial (¡opción heroica incluida!):'
      : 'Elige un talento especial:';

    renderChoices(title, subtitle, choices);
  }

  function selectTalent(id, level) {
    runState.talentLevels[id] = level;
    if (!runState.abilities.includes(id)) {
      runState.abilities.push(id);
    }
    closeChoice();
  }

  function renderChoices(title, desc, options) {
    document.getElementById('choice-title').textContent = title;
    document.getElementById('choice-desc').textContent = desc;
    const grid = document.getElementById('choice-grid');
    grid.innerHTML = '';
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.innerHTML = `<span class="title">${opt.label}</span><span class="desc">${opt.desc}</span>`;
      btn.onclick = opt.action;
      grid.appendChild(btn);
    });
    document.getElementById('choice-overlay').classList.add('visible');
  }

  function closeChoice() {
    document.getElementById('choice-overlay').classList.remove('visible');
    runState.pendingChoice = null;
    if (runState.active) {
      runState.floor++;
      runState.furiaStacks = 0;
      startCombat();
    }
    updateButtons();
  }

  // Expose public API
  Game.talents = {
    checkLevelUp: checkLevelUp,
    showTalentChoice: showTalentChoice,
    selectTalent: selectTalent,
    renderChoices: renderChoices,
    closeChoice: closeChoice
  };

  // Temporary window bridges
  window.checkLevelUp = checkLevelUp;
  window.showTalentChoice = showTalentChoice;
  window.selectTalent = selectTalent;
  window.renderChoices = renderChoices;
  window.closeChoice = closeChoice;
})();
