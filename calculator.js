import { evaluateExpression } from './mathEngine.js';

let elements;
let state;
let clearPresses = [];
let specialTriggered = false;

document.addEventListener('DOMContentLoaded', () => {
  elements = {
    display: {
      previousOperand: document.querySelector('.previous-operand'),
      currentOperand: document.querySelector('.current-operand')
    },
    expression: document.getElementById('expression'),
    calculateBtn: document.getElementById('calculate'),
    logToggle: document.getElementById('logToggle'),
    historyPanel: document.getElementById('historyPanel'),
    historyList: document.getElementById('historyList'),
    clearHistoryBtn: document.getElementById('clearHistory')
  };

  state = {
    current: '0',
    previous: '',
    operation: null,
    shouldResetScreen: false,
    logging: false,
    history: []
  };

  // Initialize from localStorage
  state.logging = localStorage.getItem('calculatorLogging') === 'true';
  state.history = JSON.parse(localStorage.getItem('calculatorHistory') || '[]');
  elements.logToggle.checked = state.logging;
  updateHistoryPanel();

  initializeEventListeners();

  // Settings event listeners
  const settingsToggle = document.getElementById('settingsToggle');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettings = document.getElementById('closeSettings');
  const themeSelect = document.getElementById('themeSelect');

  settingsToggle.addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
  });

  closeSettings.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
  });

  settingsModal.addEventListener('click', (e) => {
    if(e.target === settingsModal) {
      settingsModal.classList.add('hidden');
    }
  });

  themeSelect.addEventListener('change', (e) => {
    document.body.classList.remove('dark-theme', 'light-theme', 'red-theme', 'rainbow-theme');
    if(e.target.value === 'dark') {
      document.body.classList.add('dark-theme');
    } else if(e.target.value === 'light') {
      document.body.classList.add('light-theme');
    } else if(e.target.value === 'red') {
      document.body.classList.add('red-theme');
    } else if(e.target.value === 'rainbow') {
      document.body.classList.add('rainbow-theme');
    }
    localStorage.setItem('interfaceTheme', e.target.value);
  });

  // Load saved theme from localStorage
  const savedTheme = localStorage.getItem('interfaceTheme') || 'default';
  themeSelect.value = savedTheme;
  if(savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
  } else if(savedTheme === 'light') {
    document.body.classList.add('light-theme');
  } else if(savedTheme === 'red') {
    document.body.classList.add('red-theme');
  } else if(savedTheme === 'rainbow') {
    document.body.classList.add('rainbow-theme');
  }
});

// Utility functions
const factorial = n => {
  if (n < 0) return NaN;
  if (n <= 1) return 1;
  return n * factorial(n - 1);
};

const mathFunctions = {
  sin: x => Math.sin(x * Math.PI / 180),
  cos: x => Math.cos(x * Math.PI / 180),
  tan: x => Math.tan(x * Math.PI / 180),
  log: x => Math.log10(x),
  ln: x => Math.log(x),
  sqrt: x => Math.sqrt(x),
  pow: (x, y) => Math.pow(x, y),
  factorial: x => factorial(Math.round(x))
};

function initializeEventListeners() {
  elements.logToggle.addEventListener('change', (e) => {
    state.logging = e.target.checked;
    localStorage.setItem('calculatorLogging', state.logging);
    updateHistoryPanel();
  });

  elements.calculateBtn.addEventListener('click', () => {
    const expression = elements.expression.value;
    if (!expression) return;
    
    try {
      const result = evaluateExpression(expression);
      state.current = result.toString();
      state.previous = expression;
      updateDisplay();
      
      if (state.logging) {
        addToHistory(expression, result);
      }
    } catch (error) {
      state.current = 'Error';
      updateDisplay();
    }
  });

  elements.clearHistoryBtn.addEventListener('click', () => {
    state.history = [];
    localStorage.setItem('calculatorHistory', JSON.stringify(state.history));
    updateHistoryPanel();
  });

  // Quick function buttons
  document.querySelectorAll('.fn').forEach(button => {
    button.addEventListener('click', () => {
      const fn = button.dataset.fn;
      const current = elements.expression.value;
      elements.expression.value = `${fn}(${current})`;
    });
  });

  // Operation buttons
  document.querySelectorAll('.operation').forEach(button => {
    button.addEventListener('click', () => {
      const operation = button.dataset.operation;
      const current = elements.expression.value;
      elements.expression.value = current + operation;
    });
  });

  document.querySelectorAll('.number').forEach(button => {
    button.addEventListener('click', () => {
      const number = button.textContent;
      if (state.shouldResetScreen) {
        elements.expression.value = '';
        state.shouldResetScreen = false;
      }
      
      if (number === '.' && elements.expression.value.includes('.')) return;
      if (elements.expression.value === '0' && number !== '.') elements.expression.value = '';
    
      elements.expression.value += number;
    });
  });

  // Modified Clear event for both clearing the display and the easter egg trigger
  document.querySelector('[data-action="clear"]').addEventListener('click', () => {
    elements.expression.value = '';
    state.current = '0';
    state.previous = '';
    updateDisplay();

    // Easter Egg: track clear button presses
    const now = Date.now();
    // Remove clears older than 5 seconds
    clearPresses = clearPresses.filter(t => now - t < 5000);
    clearPresses.push(now);
    if (clearPresses.length >= 10 && !specialTriggered) {
      specialTriggered = true;
      triggerWhiteCircle();
    }
  });

  document.querySelector('[data-action="delete"]').addEventListener('click', () => {
    elements.expression.value = elements.expression.value.slice(0, -1) || '0';
  });

  // Keyboard support
  document.addEventListener('keydown', e => {
    // If the focus is on the input box, allow native behavior except for Enter key
    if (document.activeElement === elements.expression) {
      if (e.key === 'Enter') {
        e.preventDefault();
        elements.calculateBtn.click();
      }
      return;
    }
    
    if ((e.key >= '0' && e.key <= '9') || e.key === '.') {
      if (state.shouldResetScreen) {
        elements.expression.value = '';
        state.shouldResetScreen = false;
      }
      
      if (e.key === '.' && elements.expression.value.includes('.')) return;
      if (elements.expression.value === '0' && e.key !== '.') elements.expression.value = '';
    
      elements.expression.value += e.key;
    }
    if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
      const operation = e.key === '*' ? '×' : e.key === '/' ? '÷' : e.key;
      const current = elements.expression.value;
      elements.expression.value = current + operation;
    }
    if (e.key === 'Enter') {
      elements.calculateBtn.click();
    }
    if (e.key === 'Escape') {
      document.querySelector('[data-action="clear"]').click();
    }
    if (e.key === 'Backspace') {
      elements.expression.value = elements.expression.value.slice(0, -1) || '0';
    }
  });
}

function addToHistory(expression, result) {
  const historyItem = { expression, result, timestamp: new Date().toISOString() };
  state.history.unshift(historyItem);
  localStorage.setItem('calculatorHistory', JSON.stringify(state.history));
  updateHistoryPanel();
}

function updateHistoryPanel() {
  elements.historyPanel.style.display = state.logging ? 'block' : 'none';
  
  if (!state.logging) return;
  
  elements.historyList.innerHTML = state.history
    .map((item, index) => `
      <div class="history-item">
        <div>
          <div>${item.expression} = ${item.result}</div>
          <small>${new Date(item.timestamp).toLocaleString()}</small>
        </div>
        <button class="danger" onclick="deleteHistoryItem(${index})">×</button>
      </div>
    `)
    .join('');
}

function updateDisplay() {
  elements.display.currentOperand.textContent = state.current;
  elements.display.previousOperand.textContent = state.previous;
}

// Make deleteHistoryItem available globally
window.deleteHistoryItem = function(index) {
  state.history.splice(index, 1);
  localStorage.setItem('calculatorHistory', JSON.stringify(state.history));
  updateHistoryPanel();
};

// Easter Egg Functions
function triggerWhiteCircle() {
  const overlay = document.createElement('div');
  overlay.id = 'whiteCircleOverlay';
  overlay.style.width = '100px';
  overlay.style.height = '100px';
  document.body.appendChild(overlay);

  // Animate growing circle
  requestAnimationFrame(() => {
    overlay.style.transform = 'translate(-50%, -50%) scale(10)';
  });

  // After animation, add the password box (smaller than before)
  setTimeout(() => {
    const input = document.createElement('input');
    input.type = 'password';
    input.id = 'passwordBox';
    input.placeholder = 'Enter password...';
    // Make the password box a lot smaller
    input.style.fontSize = '0.6rem';
    input.style.padding = '0.1rem';
    input.style.width = '60px';
    overlay.appendChild(input);
    input.focus();

    input.addEventListener('keydown', function(e) {
      if(e.key === 'Enter') {
        // Remove the password box immediately
        overlay.removeChild(input);
        // Shrink the circle
        overlay.style.transform = 'translate(-50%, -50%) scale(0)';
        // After the shrink animation completes, handle based on input
        setTimeout(() => {
          document.body.contains(overlay) && document.body.removeChild(overlay);
          if (input.value === '😈') {
            // Correct password: let UI elements fall out separately with delay
            siteCollapse();
          }
          // If password is invalid, do nothing (UI remains intact)
        }, 1000);
      }
    });
  }, 1000);
}

function siteCollapse() {
  // Make UI elements fall out separately with a short delay between each one
  const container = document.querySelector('.container');
  Array.from(container.children).forEach((child, index) => {
    setTimeout(() => {
      child.classList.add('fall');
    }, index * 200);
  });
}