if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => console.log('Service Worker registered:', registration.scope))
        .catch(error => console.error('Service Worker registration failed:', error));
    });
  }

let scores = {
    red: 0,
    blue: 0
  };
  
  let autonomousBonus = {
    red: false,
    blue: false
  };
  
  let highStakeState = 'transparent'; // Can be 'transparent', 'red', or 'blue'
  
  // Ring counters
  let ringCounts = {
    red: 0,
    blue: 0
  };
  
  const RING_LIMIT = 24; // Maximum number of rings per color
  
  // Function to cycle the high stake ring state
  function cycleHighStakeRing() {
    const ring = document.getElementById('highStakeRing');
    if (highStakeState === 'transparent') {
      highStakeState = 'red';
      ring.classList.add('red');
      ring.classList.remove('blue');
      ringCounts['red']++;
      updateAddRingButtons();
    } else if (highStakeState === 'red') {
      highStakeState = 'blue';
      ring.classList.add('blue');
      ring.classList.remove('red');
      ringCounts['red']--;
      ringCounts['blue']++;
      updateAddRingButtons();
    } else {
      highStakeState = 'transparent';
      ring.classList.remove('red', 'blue');
      ringCounts['blue']--;
      updateAddRingButtons();
    }
    calculateScore(); // Recalculate the score when the ring state changes
  }
  
  // Add click event listener to the high stake ring
  document.getElementById('highStakeRing').addEventListener('click', cycleHighStakeRing);
  
  function calculateScore() {
    scores = { red: 0, blue: 0 };
  
    // Add points from stakes (rings)
    Object.entries(stakes).forEach(([stakeId, rings]) => {
      const isPositive = cornerStates.positive.has(stakeId);
      const isNegative = cornerStates.negative.has(stakeId);
  
      let redRings = 0;
      for (let i = 0; i < rings.length; i++) {
        if (rings[i] == 'red') redRings++;
      }
      const blueRings = rings.length - redRings;
      const topRing = rings[rings.length - 1];
      let redPoints = redRings + (topRing == 'red' ? 2 : 0);
      let bluePoints = blueRings + (topRing == 'blue' ? 2 : 0);
  
      // Apply positive or negative multipliers only to ring points
      if (isPositive) {
        redPoints *= 2;
        bluePoints *= 2;
      }
      if (isNegative) {
        redPoints *= -1;
        bluePoints *= -1;
      }
  
      scores.red += redPoints;
      scores.blue += bluePoints;
    });
  
    // Add points from high stake ring
    if (highStakeState === 'red') scores.red += 6;
    else if (highStakeState === 'blue') scores.blue += 6;
  
    // Ensure scores do not go below 0
    scores.red = Math.max(scores.red, 0);
    scores.blue = Math.max(scores.blue, 0);
    
    // Add points from autonomous bonus (not affected by negative mogos)
    if (autonomousBonus.red && autonomousBonus.blue) {
      scores.red += 3;
      scores.blue += 3;
    } else if (autonomousBonus.red) {
      scores.red += 6;
    } else if (autonomousBonus.blue) {
      scores.blue += 6;
    }
    
    if (highStakeState === 'red') {
      // Bonus points if a red robot is hanging
      if (hangLevels.red1 > 0) scores.red += 2;
      if (hangLevels.red2 > 0) scores.red += 2;
    } 
    else if (highStakeState === 'blue') {
      // Bonus points if a blue robot is hanging
      if (hangLevels.blue1 > 0) scores.blue += 2;
      if (hangLevels.blue2 > 0) scores.blue += 2;
    }
    
    // Add points from hanging (not affected by negative mogos)
    scores.red += (hangLevels.red1 + hangLevels.red2) * 3;
    if (hangLevels.red1 == 3) scores.red += 3;
    if (hangLevels.red2 == 3) scores.red += 3;
    scores.blue += (hangLevels.blue1 + hangLevels.blue2) * 3;
    if (hangLevels.blue1 == 3) scores.blue += 3;
    if (hangLevels.blue2 == 3) scores.blue += 3;
    
    // Update the displayed scores
    document.getElementById('redPoints').textContent = scores.red;
    document.getElementById('bluePoints').textContent = scores.blue;
  }
  
  function toggleAutonomousBonus(color) {
    // Select the button element for the given color
    const button = document.getElementById(`auton-${color}`);
  
    // Toggle the 'selected' class to visually mark the button as toggled
    button.classList.toggle('selected');
  
    // If the button is selected, set the corresponding autonomous bonus to true
    autonomousBonus[color] = button.classList.contains('selected');
  
    // Recalculate the score based on the new state
    calculateScore();
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('stakesContainer');
    stakeIds.forEach(id => container.appendChild(createStakeColumn(id)));
    updateCornerButtons();
    updateAddRingButtons();
    
    // Existing autonomous button listeners
    document.getElementById('auton-red').addEventListener('click', () => toggleAutonomousBonus('red'));
    document.getElementById('auton-blue').addEventListener('click', () => toggleAutonomousBonus('blue'));
    
    // Add event listener for global reset
    document.getElementById('globalReset').addEventListener('click', resetEverything);
  });
  
  function updateAutonomousButtons() {
    // Automatically update the button states based on the autonomousBonus object
    ['red', 'blue'].forEach(color => {
      const button = document.getElementById(`auton-${color}`);
      if (autonomousBonus[color]) {
        button.classList.add('selected');
      } else {
        button.classList.remove('selected');
      }
    });
  }
  
  const stakes = {};
  const stakeIds = ['wall1', 'alliance1', 'alliance2', 'wall2', 'mogo1', 'mogo2', 'mogo3', 'mogo4', 'mogo5'];
  
  const cornerStates = {
    positive: new Set(),
    negative: new Set()
  };
  
  function createStakeColumn(id) {
    const column = document.createElement('div');
    column.className = `stake-column ${id.startsWith('alliance') ? 'alliance-column' : ''}`;
  
    let cornerControls = '';
    if (id.startsWith('mogo')) {
      cornerControls = `
        <div class="corner-controls">
          <button class="corner-btn positive" data-corner="positive" data-mogo="${id}">+</button>
          <button class="corner-btn negative" data-corner="negative" data-mogo="${id}">-</button>
        </div>
      `;
    }
  
    let colorButtons = '';
    if (id.startsWith('alliance')) {
      colorButtons = `
        ${id === 'alliance1' ? '<button class="button alliance-button red" data-action="add" data-color="red">+</button>' : ''}
        ${id === 'alliance2' ? '<button class="button alliance-button blue" data-action="add" data-color="blue">+</button>' : ''}
        <button class="button alliance-button reset" data-action="reset">🗑️</button>
      `;
    }
    else {
      colorButtons = `
        <button class="button red" data-action="add" data-color="red">+</button>
        <button class="button blue" data-action="add" data-color="blue">+</button>
        <button class="button gray" data-action="remove">-</button>
        <button class="button reset" data-action="reset">🗑️</button>
      `;
    }
  
    const buttonsHTML = `
      <div class="${id.startsWith('alliance') ? 'alliance-button-container' : id.startsWith('wall') ? 'wall-button-container' : 'button-container'}">
        ${colorButtons}
      </div>
    `;
  
    const stakeHTML = `
      <div class="stake-container">
        <div class="stake-box-column">
          <div class="stake" id="${id}">
            <div class="stake-cap"></div>
            <div class="stake-pole"></div>
            <div class="ring-container" id="${id}-rings"></div>
            ${!id.startsWith('mogo') ? '' : `<div class="stake-base"></div>`}
          </div>
          ${cornerControls}
          ${id.startsWith('alliance') ? buttonsHTML : ''}
        </div>
        ${!id.startsWith('alliance') ? `<div class="control-column">${buttonsHTML}</div>` : ''}
      </div>
    `;
  
    column.innerHTML = stakeHTML;
    column.querySelectorAll('button').forEach(button => {
      if (button.classList.contains('corner-btn')) {
        button.addEventListener('click', handleCornerSelection);
      } else {
        button.addEventListener('click', () => handleButtonClick(id, button.dataset));
      }
    });
  
    stakes[id] = [];
    return column;
  }
  
  function handleCornerSelection(event) {
    const button = event.target;
    const mogoId = button.dataset.mogo;
    const cornerType = button.dataset.corner;
    const oppositeType = cornerType === 'positive' ? 'negative' : 'positive';
  
    // Toggle selection
    if (button.classList.toggle('selected')) {
      // Remove opposite selection if exists
      const oppositeBtn = button.parentElement.querySelector(`.corner-btn.${oppositeType}`);
      if (oppositeBtn.classList.contains('selected')) {
        oppositeBtn.classList.remove('selected');
        cornerStates[oppositeType].delete(mogoId);
      }
      
      cornerStates[cornerType].add(mogoId);
    } else {
      cornerStates[cornerType].delete(mogoId);
    }
  
    updateCornerButtons();
    calculateScore();
  }
  
  function updateCornerButtons() {
    document.querySelectorAll('.corner-btn').forEach(button => {
      const cornerType = button.dataset.corner;
      const isSelected = cornerStates[cornerType].size >= 2;
      
      button.disabled = !button.classList.contains('selected') && 
        isSelected && 
        !cornerStates[cornerType].has(button.dataset.mogo);
    });
  }
  
  function addRing(stakeId, color) {
    const ringsContainer = document.getElementById(`${stakeId}-rings`);
    const maxRings = stakeId.startsWith('alliance') ? 2 : 6;
    
    if ((stakeId === 'alliance1' && color !== 'red') || 
      (stakeId === 'alliance2' && color !== 'blue')) {
      return;
    }
  
    if (stakes[stakeId].length >= maxRings) return;
  
    // Check if the ring limit for the color has been reached
    document.querySelectorAll('.button').forEach(button => {
      const allianceClr = button.color;
      button.disabled = (allianceClr == color) && ringCounts[color] >= RING_LIMIT
    });
  
    const ring = document.createElement('div');
    ring.className = `ring ${color}-ring`;
    ringsContainer.appendChild(ring);
    stakes[stakeId].push(color);
    ringCounts[color]++; // Increment the ring counter
    updateAddRingButtons(); // Disable buttons if necessary
    calculateScore();
  }
  
  function handleButtonClick(stakeId, { action, color }) {
    switch(action) {
      case 'add': addRing(stakeId, color); break;
      case 'remove': removeTopmostRing(stakeId); break;
      case 'reset': resetStake(stakeId); break;
    }
  }
  
  function removeTopmostRing(stakeId) {
    const rings = document.getElementById(`${stakeId}-rings`);
    if (rings.children.length > 0) {
      const removedRing = stakes[stakeId].pop();
      rings.lastChild.remove();
      ringCounts[removedRing]--; // Decrement the ring counter
      updateAddRingButtons(); // Re-enable buttons if necessary
    }
    calculateScore();
  }
  
  function resetStake(stakeId) {
    const rings = document.getElementById(`${stakeId}-rings`);
    const removedRings = stakes[stakeId];
    rings.innerHTML = '';
    stakes[stakeId] = [];
    
    // Decrement the ring counters for the removed rings
    removedRings.forEach(ring => {
      ringCounts[ring]--;
    });
    
    updateAddRingButtons(); // Re-enable buttons if necessary
    
    // Reset corner buttons for mogos
    if (stakeId.startsWith('mogo')) {
      cornerStates.positive.delete(stakeId); // Remove from positive set
      cornerStates.negative.delete(stakeId); // Remove from negative set
  
      // Reset the visual state of the corner buttons
      const cornerButtons = document.querySelectorAll(`.corner-btn[data-mogo="${stakeId}"]`);
      cornerButtons.forEach(button => {
        button.classList.remove('selected'); // Remove the 'selected' class
      });
  
      // Re-enable buttons if they were disabled
      updateCornerButtons();
    }
    
    calculateScore();
  }
  
  function updateAddRingButtons() {
    // Disable "add ring" buttons for a color if the limit is reached
    document.querySelectorAll('.button.red[data-action="add"]').forEach(button => {
      button.disabled = ringCounts.red >= RING_LIMIT;
    });
    document.querySelectorAll('.button.blue[data-action="add"]').forEach(button => {
      button.disabled = ringCounts.blue >= RING_LIMIT;
    });
  }
  
  let hangLevels = {
    red1: 0,
    red2: 0,
    blue1: 0,
    blue2: 0
  };
  
  document.querySelectorAll('.hang-tier').forEach(tier => {
    tier.addEventListener('click', () => {
      const alliance = tier.classList.contains('red') ? 'red' : 'blue';
      const tierNumber = tier.dataset.tier;
      const key = `${alliance}${tierNumber}`;
      hangLevels[key] = (hangLevels[key] + 1) % 4; // Cycles through 0, 1, 2, 3
      console.log(`Clicked ${key}, level: ${hangLevels[key]}`); // Debugging
      updateHangTierDisplay(tier, hangLevels[key]);
      calculateScore();
    });
  });
  
  function updateHangTierDisplay(tierElement, level) {
    const fill = tierElement.querySelector('.fill');
    const levelDisplay = tierElement.querySelector('.level');
    const heightPercentage = (level) * 25; // 0 → 0%, 1 → 25%, 2 → 50%, 3 → 75%
    console.log(`Updating ${tierElement.id} to ${heightPercentage}%`); // Debugging
    fill.style.height = `${heightPercentage}%`; // Update height
    levelDisplay.textContent = level;
  }
  
  function resetEverything() {
    // Reset scores
    scores = { red: 0, blue: 0 };
    
    // Reset autonomous bonuses
    autonomousBonus = { red: false, blue: false };
    updateAutonomousButtons();
    
    // Reset high stake ring
    highStakeState = 'transparent';
    const highStakeRing = document.getElementById('highStakeRing');
    highStakeRing.classList.remove('red', 'blue');
    
    // Reset ring counts
    ringCounts = { red: 0, blue: 0 };
    
    // Reset all stakes
    stakeIds.forEach(stakeId => resetStake(stakeId));
    
    // Reset corner states
    cornerStates.positive.clear();
    cornerStates.negative.clear();
    updateCornerButtons();
    
    // Reset hang levels
    hangLevels = {
      red1: 0,
      red2: 0,
      blue1: 0,
      blue2: 0
    };
    document.querySelectorAll('.hang-tier').forEach(tier => {
      updateHangTierDisplay(tier, 0);
    });
    
    // Update the score display
    calculateScore();
  }