const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const tabs = $$('.nav button');
let chatStarted = false;

function showView(id) {
  const birthdayUnlocked = Date.now() >= target.getTime();
  if (id !== 'countdown' && !birthdayUnlocked) {
    toast('ล็อกอยู่! กลับมาเมื่อเริ่มอีเวนต์วันเกิด 🔒');
    return;
  }
  if (id === 'gift' && !isRewardUnlocked()) {
    toast('ทำภารกิจเป่าเทียนให้สำเร็จก่อนรับรางวัล 🎂');
    return;
  }

  $$('.view').forEach((view) => {
    view.classList.toggle('active', view.id === id);
    view.hidden = view.id !== id;
  });

  tabs.forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.view === id);
  });

  if (id === 'chat' && !chatStarted) {
    startChat();
  }

  if (id === 'cake') {
    document.body.dataset.scene = 'cake';
  } else {
    delete document.body.dataset.scene;
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => showView(tab.dataset.view));
});

$$('[data-go]').forEach((button) => {
  button.addEventListener('click', () => showView(button.dataset.go));
});

// Birthday countdown
const dateInput = $('#birthday');

function fixedBirthday() {
  // Lock the countdown to 30 October 2026 at midnight (local time).
  return new Date(2026, 9, 30, 0, 0, 0, 0);
}

function localInputValue(date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date - offset).toISOString().slice(0, 16);
}

let target = fixedBirthday();
dateInput.value = localInputValue(target);
dateInput.disabled = true;
// Keep this progress for the current tab session only; old saved values must not unlock Reward.
let wishCompletedFor = sessionStorage.getItem('wishCompletedFor') || '';
let celebrationShownFor = '';

function isRewardUnlocked() {
  return wishCompletedFor === target.toISOString();
}

function celebrateBirthday() {
  const canvas = document.createElement('canvas');
  canvas.className = 'birthday-fireworks';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);

  const context = canvas.getContext('2d');
  const particles = [];
  const colors = ['#ff78c8', '#ffd166', '#a9e7d2', '#c3a5ff', '#fff2a8', '#7ee7ff'];
  const startedAt = performance.now();
  let nextBurst = 0;
  let frameId;

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * ratio);
    canvas.height = Math.round(window.innerHeight * ratio);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const burst = () => {
    const x = window.innerWidth * (0.15 + Math.random() * 0.7);
    const y = window.innerHeight * (0.12 + Math.random() * 0.42);
    const color = colors[Math.floor(Math.random() * colors.length)];
    const count = 46 + Math.floor(Math.random() * 20);
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count;
      const speed = 1.1 + Math.random() * 3.2;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 55 + Math.random() * 35,
        age: 0,
        size: 1.5 + Math.random() * 2,
        color,
      });
    }
  };

  const draw = (now) => {
    const elapsed = now - startedAt;
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);

    if (elapsed >= nextBurst && elapsed < 4400) {
      burst();
      nextBurst += 480 + Math.random() * 360;
    }

    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      particle.age += 1;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.035;
      particle.vx *= 0.985;
      const opacity = Math.max(0, 1 - particle.age / particle.life);
      context.globalAlpha = opacity;
      context.fillStyle = particle.color;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fill();
      if (particle.age >= particle.life) particles.splice(index, 1);
    }
    context.globalAlpha = 1;

    if (elapsed < 5400 || particles.length) {
      frameId = requestAnimationFrame(draw);
    } else {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      canvas.remove();
    }
  };

  resize();
  window.addEventListener('resize', resize);
  frameId = requestAnimationFrame(draw);
}

const pad = (number, length = 2) => String(number).padStart(length, '0');

function tick() {
  let remaining = Math.max(0, target.getTime() - Date.now());
  const days = Math.floor(remaining / 86400000);
  remaining %= 86400000;

  $('#days').textContent = pad(days, 3);
  $('#hours').textContent = pad(Math.floor(remaining / 3600000));
  remaining %= 3600000;

  $('#minutes').textContent = pad(Math.floor(remaining / 60000));
  remaining %= 60000;
  $('#seconds').textContent = pad(Math.floor(remaining / 1000));

  if (target.getTime() <= Date.now()) {
    const celebrationKey = target.toISOString();
    if (celebrationShownFor !== celebrationKey) {
      celebrationShownFor = celebrationKey;
      celebrateBirthday();
    }
    $('#playerLabel').textContent = 'MAPRANG: Birthday Girl';
    $('#heroTitleLine').textContent = "IT'S YOUR DAY.";
    $('#heroGreeting').textContent = 'Your special birthday quest begins now!';
    $('#heroSubline').textContent = 'Ready to take on your quest?';

    const birthdayTitle = $('.count-copy h2');
    if (!birthdayTitle.querySelector('.birthday-title-icon')) {
      birthdayTitle.replaceChildren(
        document.createTextNode('LEVEL UP 21 !!! HAPPY BIRTHDAY! '),
      );

      const birthdayIcon = document.createElement('img');
      birthdayIcon.className =
        'game-icon game-icon--small birthday-title-icon';
      birthdayIcon.src = 'assets/icons/icons8-birthday-94.png';
      birthdayIcon.alt = '';
      birthdayTitle.append(birthdayIcon);
    }
  } else {
    $('#playerLabel').textContent = 'MAPRANG: Birthday Girl';
    $('#heroTitleLine').textContent = "IT'S YOUR LIFT.";
    $('#heroGreeting').textContent = "Even on an ordinary day, you're still special.";
    $('#heroSubline').textContent = 'Just remember that.';
    $('.count-copy h2').textContent = 'Countdown to Level Up!';
  }

  updateBirthdayAccess();
}

function updateBirthdayAccess() {
  const unlocked = Date.now() >= target.getTime();

  tabs.forEach((tab) => {
    const locked = (tab.dataset.view !== 'countdown' && !unlocked)
      || (tab.dataset.view === 'gift' && !isRewardUnlocked());
    tab.disabled = locked;
    tab.classList.toggle('locked', locked);
    tab.setAttribute('aria-disabled', String(locked));
  });

  $$('[data-go]').forEach((button) => {
    button.hidden = (button.dataset.go !== 'countdown' && !unlocked)
      || (button.dataset.go === 'gift' && !isRewardUnlocked());
  });

  $('#lockedNotice').hidden = unlocked;
  $('#questStatus').textContent = unlocked
    ? 'QUEST STATUS: ACTIVE'
    : 'QUEST STATUS: WAITING';

  const activeView = $('.view.active')?.id;
  if ((!unlocked && activeView !== 'countdown')
    || (activeView === 'gift' && !isRewardUnlocked())) {
    showView(unlocked ? 'cake' : 'countdown');
  }
}

tick();
setInterval(tick, 1000);

// Birthday chat
const wishes = [
  [
    '🌷',
    '2004(oak)',
    'สุขสันต์วันเกิดน้องมะปราง ขอได้เล่นเกมที่ชอบ แล้วก็มีเรื่องดี ๆ เข้ามาเต็มไปหมดเลยนะ รักที่สุด 💚',
  ],
  [
    '🐻',
    'ESTHR',
    'สุขสันต์วันเกิด! รวยๆเฮงๆ สุขภาพแข็งแรงนะ 🎮',
  ],

  [
    '🐒',
    'น้องคิว',
    'สุขสันต์วันเกิดมะปราง 🩷 ',
  ],
  [
    '🐶',
    'Tao',
    'สุขสันต์วันเกิดครับน้องมะปราง ขอให้สุขภาพแข็งแรง กินของอร่อยๆ พบเจอคนดีๆครับน้อง🎮',
  ],
  [
    '🐱',
    'Agnes Tachyon',
    'สุขสันต์วันเกิดนะน้อง! ขอให้ร่ำรวย พบเจอแต่สิ่งๆครับ💙',
  ],
  [
    '🦊',
    'giji',
    'สุขสันต์วันเกิดนะครับ น้องมะปราง ขอให้ไม่เจ็บป่วย นอนหลับเพียงพอ เป็นปีที่อายุ21 ที่มีแต่เรื่องดีๆและน่าจดจำครับ 💚🎮',
  ],
];

function startChat() {
  chatStarted = true;
  const root = $('#messages');

  wishes.forEach((wish, index) => {
    setTimeout(() => {
      const row = document.createElement('div');
      row.className = 'message';
      row.innerHTML = `
        <div class="msg-ava">${wish[0]}</div>
        <div class="msg-content">
          <div class="msg-meta">
            <b>${wish[1]}</b>
            <time>หลังเที่ยงคืน 00:${pad(5 + index * 2)} น.</time>
          </div>
          <div class="msg-text">${wish[2]}</div>
        </div>
      `;
      root.append(row);
    }, 450 + index * 850);
  });
}

$('#messageForm').addEventListener('submit', (event) => {
  event.preventDefault();

  const input = $('#messageInput');
  const messageText = input.value.trim();
  if (!messageText) return;

  const message = document.createElement('div');
  message.className = 'message user-message';

  const avatar = document.createElement('div');
  avatar.className = 'msg-ava';
  avatar.textContent = '🎮';

  const content = document.createElement('div');
  content.className = 'msg-content';

  const metadata = document.createElement('div');
  metadata.className = 'msg-meta';

  const username = document.createElement('b');
  username.textContent = 'น้องมะปรางwant2playz';

  const time = document.createElement('time');
  time.textContent = `Today, ${new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  const text = document.createElement('div');
  text.className = 'msg-text';
  text.textContent = messageText;

  metadata.append(username, time);
  content.append(metadata, text);
  message.append(avatar, content);
  $('#messages').append(message);

  input.value = '';
  input.focus();
  message.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

// Cake candles and wish timer
const candleRoot = $('#candles');

for (const digit of ['2', '1']) {
  const candle = document.createElement('div');
  candle.className = 'candle candle-number';
  candle.innerHTML = `<span class="candle-digit">${digit}</span><i class="wick"></i><i class="flame"></i>`;
  candleRoot.append(candle);
}

const duration = $('#duration');
let wishTimer = null;
let toastTimer = null;

duration.addEventListener('input', () => {
  $('#durationValue').textContent = `${duration.value} วินาที`;
});

function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('show'), 2500);
}

$('#wishButton').addEventListener('click', () => {
  const button = $('#wishButton');
  const status = $('#wishStatus');

  if (wishTimer) {
    clearInterval(wishTimer);
    wishTimer = null;
  }

  if (button.dataset.mode === 'done') {
    $$('.candle').forEach((candle) => candle.classList.remove('out'));
    button.dataset.mode = '';
    button.innerHTML = '▶ &nbsp; เริ่มอธิษฐาน';
    status.innerHTML = '<strong>พร้อมเมื่อเธอพร้อม</strong><br>พรนั้นไม่ต้องบอกใครก็ได้นะ 🤍';
    return;
  }

  $$('.candle').forEach((candle) => candle.classList.remove('out'));

  let secondsLeft = Number(duration.value);
  status.innerHTML = `<strong>กำลังขอพร...</strong><br>เทียนจะดับใน ${secondsLeft} วินาที`;
  button.textContent = 'กำลังอธิษฐาน...';
  button.disabled = true;

  wishTimer = setInterval(() => {
    secondsLeft -= 1;

    if (secondsLeft > 0) {
      status.innerHTML = `<strong>กำลังขอพร...</strong><br>เทียนจะดับใน ${secondsLeft} วินาที`;
      return;
    }

    clearInterval(wishTimer);
    wishTimer = null;

    $$('.candle').forEach((candle, index) => {
      setTimeout(() => candle.classList.add('out'), index * 160);
    });

    status.innerHTML = '<strong>ภารกิจสำเร็จ! สุขสันต์วันเกิดนะ!</strong><br>ขอให้พรของเธอเป็นจริงทุกข้อ';
    button.disabled = false;
    button.dataset.mode = 'done';
    button.innerHTML = '↻ &nbsp; เริ่มอธิษฐานอีกครั้ง';
    wishCompletedFor = target.toISOString();
    sessionStorage.setItem('wishCompletedFor', wishCompletedFor);
    updateBirthdayAccess();

    celebrate();
    celebrateBirthday();
    toast('QUEST CLEAR! ขอให้พรเป็นจริงนะ 🩷');
  }, 1000);
});

// Celebration effects
const layer = $('#burstLayer');

function celebrate() {
  for (let index = 0; index < 9; index += 1) {
    setTimeout(() => {
      const balloon = document.createElement('i');
      const hues = [270, 300, 330, 45, 175];
      const hue = hues[Math.floor(Math.random() * hues.length)];

      balloon.className = 'balloon';
      balloon.style.cssText = `
        left: ${Math.random() * 100}%;
        background: hsl(${hue} 75% 75%);
        color: hsl(${hue} 75% 75%);
        --drift: ${Math.random() * 100 - 50}px;
        animation-duration: ${6 + Math.random() * 3}s;
      `;

      layer.append(balloon);
      setTimeout(() => balloon.remove(), 10000);
    }, index * 220);
  }

  const colors = ['#ffe3a4', '#f6a9d4', '#c3a5ff', '#a9e7d2'];

  for (let index = 0; index < 6; index += 1) {
    setTimeout(() => {
      const firework = document.createElement('i');
      firework.className = 'firework';
      firework.style.cssText = `
        left: ${12 + Math.random() * 76}%;
        top: ${12 + Math.random() * 45}%;
        --color: ${colors[index % colors.length]};
      `;

      layer.append(firework);
      setTimeout(() => firework.remove(), 1400);
    }, index * 300);
  }
}

const giftItems = [
  {
    icon: 'assets/icons/cocoa-mug.svg',
    title: 'ice coco HP+200',
    description: 'น้ำโกโก้เย็นที่หวานกำลังดี หอมเข้ม ที่ปลูกจากดาว E616',
  },
  {
    icon: 'assets/icons/kanom-chan.svg',
    title: 'ขนมชั้นนำโชค luck+777',
    description: 'ขนมชั้นปลุกเสกทั่วประเทศ ทำให้ทุกชั้นที่ก้าวในปีนี้มีแต่เรื่องดี ๆ',
  },
  {
    icon: 'assets/icons/gold-coupon.svg',
    title: 'คู่ปองพิเศษ ',
    description: 'อยากถามหรือขออะไรก็ได้ 1อย่าง(ที่สามารถให้ได้หรือตอบได้ เลือกได้อันเดียวนะ) และสามารถขอคำปรึกษาหรือเล่าเรื่องอะไรก็ได้ตลอดชีพ ไทยแท้555555',
  },
];
let nextGiftItem = 0;

function revealGiftItem() {
  const item = giftItems[nextGiftItem];
  const itemIcon = $('#giftItemIcon');
  if (item.icon.endsWith('.svg')) {
    const image = document.createElement('img');
    image.className = 'game-icon game-icon--large';
    image.src = item.icon;
    image.alt = '';
    itemIcon.replaceChildren(image);
  } else {
    itemIcon.textContent = item.icon;
  }
  $('#giftItemTitle').textContent = item.title;
  $('#giftItemDescription').textContent = item.description;
  $('#giftItemCount').textContent = `ITEM ${String(nextGiftItem + 1).padStart(2, '0')} / ${String(giftItems.length).padStart(2, '0')}`;
  $('#giftItem').hidden = false;
  nextGiftItem += 1;

  if (nextGiftItem === giftItems.length) {
    $('#giftMessage').hidden = false;
    $('#openGift').textContent = '✦ รับไอเทมครบแล้ว';
    $('#openGift').disabled = true;
  } else {
    $('#openGift').textContent = `รับไอเทมชิ้นถัดไป (${nextGiftItem + 1}/${giftItems.length})`;
  }
}

function openGiftReward() {
  if ($('#giftBox').classList.contains('open')) return;

  if (Date.now() < target.getTime()) {
    toast('รางวัลจะเปิดได้เมื่อเริ่มอีเวนต์วันเกิด 🔒');
    return;
  }

  $('#giftBox').classList.add('open');
  $('#giftBox').setAttribute('aria-disabled', 'true');
  revealGiftItem();
  celebrate();
}

$('#openGift').addEventListener('click', () => {
  if ($('#giftBox').classList.contains('open')) {
    revealGiftItem();
    return;
  }
  openGiftReward();
});
$('#giftBox').addEventListener('click', openGiftReward);
$('#giftBox').addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    openGiftReward();
  }
});
