/* Small, local Web Audio effects. Sound begins with a visitor gesture. */
(() => {
  let context;
  let enabled = true;
  try { enabled = localStorage.getItem('signal-lab-sound') !== 'off'; } catch {}
  function audio() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio || !enabled) return null;
    context ||= new Audio();
    if (context.state === 'suspended') context.resume().catch(() => {});
    return context;
  }
  function play(kind, bin) {
    const ctx = audio();
    if (!ctx) return;
    const now = ctx.currentTime;
    const note = (freq, start, duration, volume = .035, type = 'sine', end = freq) => {
      const osc = ctx.createOscillator(), amp = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + start);
      osc.frequency.exponentialRampToValueAtTime(end, now + start + duration);
      amp.gain.setValueAtTime(.001, now + start);
      amp.gain.linearRampToValueAtTime(volume, now + start + .006);
      amp.gain.exponentialRampToValueAtTime(.001, now + start + duration);
      osc.connect(amp); amp.connect(ctx.destination);
      osc.start(now + start); osc.stop(now + start + duration + .01);
      osc.onended = () => {osc.disconnect(); amp.disconnect();};
    };
    if (kind === 'print') {
      for (let i=0; i<8; i++) note(120 + (i%2)*50, i*.055, .035, .018, 'triangle');
      note(660, .5, .1);
    } else if (kind === 'file') {
      note(150, 0, .09, .03, 'triangle', 80);
      const pair = {useful:[540,700], proxy:[480,560], unknown:[600,480]}[bin] || [500,600];
      pair.forEach((f,i) => note(f,.06+i*.09,.13,.025));
    } else if (kind === 'scan') {
      note(180,0,.4,.022,'triangle',700); note(800,.3,.15,.018);
    } else note(440,0,.055,.018,'triangle',250);
  }
  window.SignalSounds = {
    get enabled() {return enabled;},
    setEnabled(value) {
      enabled = value;
      try {localStorage.setItem('signal-lab-sound',value?'on':'off');} catch {}
      if (value) play('tap');
    },
    play
  };
  document.addEventListener('pointerdown', () => {audio();}, {passive:true});
  document.addEventListener('click', event => {
    const button = event.target.closest?.('button');
    if (!button || button.disabled || button.classList.contains('sound-toggle')) return;
    if (button.matches('.filebtn,.bay__target')) return; // actual drop is sounded after placement
    play(button.matches('.btn-big,.feed') ? 'scan' : 'tap');
  });
  const reveal = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        reveal.unobserve(entry.target);
      }
    }
  }, {threshold:.35});
  const watch = new MutationObserver(() => {
    document.querySelectorAll('.interpretation-card:not([data-watched])').forEach(card => {
      card.dataset.watched = 'true'; reveal.observe(card);
    });
  });
  watch.observe(document.getElementById('root'), {childList:true, subtree:true});
})();
