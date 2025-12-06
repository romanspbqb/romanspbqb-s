// Хранение в localStorage под одним ключом
const STORAGE_KEY = 'evaStatusSite_v1';

let state = {
  currentStatus: null,
  history: [],
  walkCount: 0,
  photos: [] // dataURL строка
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    state = Object.assign(state, parsed);
  } catch (e) {
    console.error('Ошибка загрузки состояния', e);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Обновление UI
function renderCurrentStatus() {
  const container = document.getElementById('current-status');
  const textEl = container.querySelector('.status-text');
  const flagsEl = container.querySelector('.status-flags');
  const metaEl = container.querySelector('.status-meta');

  if (!state.currentStatus) {
    textEl.textContent = 'Статус ещё не задан.';
    flagsEl.innerHTML = '';
    metaEl.textContent = '';
    return;
  }

  const s = state.currentStatus;
  textEl.textContent = s.text || '(без текста)';
  flagsEl.innerHTML = '';

  const flagNames = [];
  if (s.walk) flagNames.push('Хочет гулять');
  if (s.eat) flagNames.push('Хочет есть');
  if (s.drink) flagNames.push('Хочет пить');
  if (s.play) flagNames.push('Хочет играть');
  if (s.cold) flagNames.push('Нужен костюм (холодно)');

  flagNames.forEach(name => {
    const li = document.createElement('li');
    li.textContent = name;
    flagsEl.appendChild(li);
  });

  const moodText = (s.mood !== null && s.mood !== '' && !Number.isNaN(s.mood))
    ? `Настроение: ${s.mood}/10. `
    : '';

  metaEl.textContent = `${moodText}Обновлено: ${s.time}`;
}

function renderHistory() {
  const list = document.getElementById('history-list');
  list.innerHTML = '';
  state.history.slice().reverse().forEach(item => {
    const li = document.createElement('li');
    const time = document.createElement('div');
    time.className = 'history-time';
    time.textContent = item.time;
    const text = document.createElement('div');
    text.className = 'history-text';
    text.textContent = item.text || '(без текста)';
    li.appendChild(time);
    li.appendChild(text);
    list.appendChild(li);
  });
}

function renderWalks() {
  document.getElementById('walk-count').textContent = state.walkCount;
}

function renderPhotos() {
  const grid = document.getElementById('photo-grid');
  grid.innerHTML = '';
  state.photos.forEach(src => {
    const img = document.createElement('img');
    img.src = src;
    grid.appendChild(img);
  });
}

// Helpers
function nowString() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Обработчики
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  renderCurrentStatus();
  renderHistory();
  renderWalks();
  renderPhotos();

  // Форма статуса
  const form = document.getElementById('status-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = document.getElementById('status-text').value.trim();
    const walk = document.getElementById('flag-walk').checked;
    const eat = document.getElementById('flag-eat').checked;
    const drink = document.getElementById('flag-drink').checked;
    const play = document.getElementById('flag-play').checked;
    const cold = document.getElementById('flag-cold').checked;
    const moodVal = document.getElementById('mood').value;
    const mood = moodVal === '' ? null : Number(moodVal);

    const entry = {
      text,
      walk,
      eat,
      drink,
      play,
      cold,
      mood,
      time: nowString()
    };

    state.currentStatus = entry;
    state.history.push(entry);
    // Ограничим историю, чтобы не раздувать
    if (state.history.length > 100) state.history.shift();

    saveState();
    renderCurrentStatus();
    renderHistory();
  });

  // Очистка истории
  document.getElementById('clear-history').addEventListener('click', () => {
    if (!confirm('Точно очистить историю на этом устройстве?')) return;
    state.history = [];
    saveState();
    renderHistory();
  });

  // Прогулки
  document.getElementById('walk-plus').addEventListener('click', () => {
    state.walkCount += 1;
    saveState();
    renderWalks();
  });

  document.getElementById('walk-reset').addEventListener('click', () => {
    if (!confirm('Сбросить счётчик прогулок на этом устройстве?')) return;
    state.walkCount = 0;
    saveState();
    renderWalks();
  });

  // Фото
  const photoInput = document.getElementById('photo-input');
  photoInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const maxPhotos = 20;
    const readers = [];

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        state.photos.push(evt.target.result);
        if (state.photos.length > maxPhotos) {
          state.photos = state.photos.slice(-maxPhotos);
        }
        saveState();
        renderPhotos();
      };
      reader.readAsDataURL(file);
      readers.push(reader);
    });
    // очищаем выбор
    photoInput.value = '';
  });

  document.getElementById('clear-photos').addEventListener('click', () => {
    if (!confirm('Удалить фото Евы на этом устройстве?')) return;
    state.photos = [];
    saveState();
    renderPhotos();
  });

  // Псевдо-погода (заглушка)
  const weatherTempEl = document.getElementById('weather-temp');
  const weatherDescEl = document.getElementById('weather-desc');
  const weatherBtn = document.getElementById('weather-refresh');

  function fakeWeather() {
    // Просто случайная температура и текст
    const temp = Math.round(Math.random() * 25 - 5); // -5..20
    weatherTempEl.textContent = `${temp} °C`;
    if (temp <= -5) {
      weatherDescEl.textContent = 'Очень холодно — точно нужен костюм';
    } else if (temp <= 0) {
      weatherDescEl.textContent = 'Холодно — костюм и недолгая прогулка';
    } else if (temp <= 10) {
      weatherDescEl.textContent = 'Прохладно — можно гулять дольше';
    } else {
      weatherDescEl.textContent = 'Тепло — Ева будет счастлива на улице';
    }
  }

  weatherBtn.addEventListener('click', fakeWeather);
  fakeWeather();
});
