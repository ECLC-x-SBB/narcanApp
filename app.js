    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
        .catch(err => console.error('SW registration failed:', err));
      });
    }
    const isiOS = /iP(hone|ad|od)/.test(navigator.userAgent) && !window.MSStream;
    let deferredPrompt;
    const installBtn = document.getElementById('install-btn');
    const isMobile = /Mobi|Android|iPhone|iPad|iPod|/i.test(navigator.userAgent);
    
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (isMobile) {
        installBtn.style.display = 'inline-block';
      }
    });
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      installBtn.disabled = true;
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      console.log('PWA install choice:', choice.outcome);
      deferredPrompt = null;
      installBtn.style.display = 'none'
    });
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbxRVZcd0nZnjTBvwPTaHIsUck5wKHU8iEfmYaazWHIuqR0p8kLG6BrwqC-VCwNlHwRERg/exec'; 
    function handleImpact(data) {
      document.getElementById('impact-stats').innerHTML = `
        <p>Total Boxes Picked Up: ${data.pickedUp}</p>
        <p>Total Doses Used: ${data.dosesUsed}</p>
        <p>Lives Saved: ${data.livesSaved}</p>
        <p>Hospitalizations After Use: ${data.hospitalizations}</p>
      `;
    }
    function showPage(pageId) {
      const current = document.querySelector('.page.active');
      if (current) {
        current.classList.remove('active');
      }
      const next = document.getElementById(pageId);
      next.classList.add('active', 'fade-in');
      next.addEventListener(
        'animationend',
        () => next.classList.remove('fade-in'),
        {once: true}
      );
    }
    function pickupSuccess() {
      const name = document.querySelector('#pickup-form input[name="name"]').value;
      alert(name ? `Thank you, ${name}, for connecting and supporting your community!` :
                   'Thank you for connecting and supporting your community!');
      document.getElementById('pickup-form').reset();
      showPage('home-page');
    }
    function reportSuccess() {
      const name = document.querySelector('#report-form input[name="name"]').value;
      alert(name ? `Thank you, ${name}, for helping save lives!` :
                   'Thank you for helping save lives!');
      document.getElementById('report-form').reset();
      showPage('home-page');
    }
    function volunteerSuccess() {
      const name = document.querySelector('#volunteer-form input[name="name"]').value
      alert(name ? `Thank you, ${name}, for reaching out to volunteer!` :
                   'Thank you for reaching out to volunteer!');
      document.getElementById('volunteer-form').reset();
      showPage('home-page');
    }
    function toggleExclusive(id) {
      ['reversal','death'].forEach(i => { if (i !== id) document.getElementById(i).checked = false; });
    }
    function updateImpact() {
      const range = document.getElementById('impact-range').value
      const s = document.createElement('script');
      s.src = `${GAS_URL}?action=impact&range=${range}&callback=handleImpact`;
      document.body.appendChild(s);
    };
function wire(formId, onSuccess) {
  const form = document.getElementById(formId);
  form.addEventListener('submit', e => {
    e.preventDefault();
    fetch(GAS_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: new FormData(form)
    })
    .then(() => onSuccess())
    .catch(err => {
      console.error(err);
      alert('Sorry, there was an error submitting the form');
    });
  });
}
document.addEventListener('DOMContentLoaded', () => {
  wire('pickup-form', pickupSuccess);
  wire('report-form', reportSuccess);
  wire('volunteer-form', volunteerSuccess);
  updateImpact();  
});
const phoneInput = document.getElementById('vol-phone');
phoneInput.addEventListener('input', () => {
  let digits = phoneInput.value.replace(/\D/g, '');
  if (digits.length > 10) digits = digits.slice(0, 10);
  
  const part1 = digits.substring(0, 3);
  const part2 = digits.substring(3, 6);
  const part3 = digits.substring(6,10);

  if (digits.length <= 3) {
    phoneInput.value = part1 ? `(${part1}` : '';
  }
  else if (digits.length <= 6) {
    phoneInput.value = `(${part1})${part2}`;
  }
  else {
    phoneInput.value = `(${part1})${part2}-${part3}`;
  }
});
let devosData = null;
let currentDate = new Date();
async function loadDevotional(d = new Date()) {
  try {
    if (!devosData) {
      const resp = await fetch('/devotions.json');
      devosData = await resp.json();
    }
    const key = `${d.getMonth()+1}-${d.getDate()}`;
    const today = devosData[key] || {
      verse: '"God is our refuge..." (Psalm 46:1)',
      text: "Unable to find today's devotional. Please check back later."
    };
    document.getElementById('devotional-verse').textContent = today.verse;
    const container = document.getElementById('devotional-text');
    container.innerHTML = '';
    today.text.split('\\n\\n').forEach(para => {
      const p = document.createElement('p');
      p.textContent = para;
      container.appendChild(p);
    });   
    document.getElementById('dev-date').textContent = 
      d.toLocaleDateString(undefined, {
        month: 'long', 
        day: 'numeric'
      });
  } catch (err) {
    console.error('Error loading devotional:', err);
    document.getElementById('dev-date').textContent = '';
    document.getElementById('devotional-verse').textContent =
      'Error loading devotional';
    document.getElementById('devotional-text').innerHTML = 
      "<p>Sorry, we couldn't load today's devotional. Please try again later.</p>";
  }
}
function shiftDay(offset) {
  currentDate.setDate(currentDate.getDate() + offset);
  loadDevotional(currentDate);
}
document.addEventListener('DOMContentLoaded', () => {
  loadDevotional(currentDate);
  document.getElementById('prev-day')
    .addEventListener('click', () => shiftDay(-1));
  document.getElementById('next-day')
    .addEventListener('click', () => shiftDay(1));
});
window.addEventListener('DOMContentLoaded', () => {
  if (isiOS && !window.navigator.standalone) {
    const tip = document.createElement('div');
    tip.className = 'ios-install-tip';
    tip.textContent = 'To install: tap Share → Add to Home Screen';
    document.body.append(tip);
    setTimeout(() => tip.remove(), 15000);
  }
});
document.querySelectorAll('.button').forEach(btn => {
  console.log('attaching ripple listener to', btn);
  
  btn.addEventListener('click', function(e) {
    console.log('ripple click on', this);
    
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    
    const size = Math.max(this.offsetWidth, this.offsetHeight);
    ripple.style.width = ripple.style.height = `${size}px`;
    
    const rect = this.getBoundingClientRect();
    ripple.style.left = `${e.clientX - rect.left - size/2}px`;
    ripple.style.top = `${e.clientY - rect.top - size/2}px`;
    
    this.appendChild(ripple);
    
    ripple.addEventListener('animationend', () => ripple.remove());
  });
});
