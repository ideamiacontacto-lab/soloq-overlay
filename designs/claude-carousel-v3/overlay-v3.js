const { useState, useEffect, useRef, useCallback } = React;
const { motion, animate: fmAnimate } = window.Motion || window.FramerMotion || {};

// Sample data ---------------------------------------------------------------

const OPTIONS = [
  { id: 'autofill-3', label: 'Autofill 3 partidas', weight: 0.22, tone: 'pain',
    description: 'Tres partidas seguidas con el rol que te dé el matchmaking.',
    imageUrl: 'https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Teemo_0.jpg' },
  { id: 'rol-sup-2', label: 'Jugar SUPPORT 2 partidas', weight: 0.18, tone: 'pain',
    description: 'Dos partidas obligatorias en la línea de soporte.',
    imageUrl: 'https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Soraka_0.jpg' },
  { id: 'letra-k', label: 'Champ que empiece por K', weight: 0.15,
    description: 'Tu próxima partida con un champ que empiece por K.',
    imageUrl: 'https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Kayn_0.jpg' },
  { id: 'champ-yuumi', label: 'Jugar Yuumi 1 partida', weight: 0.10, tone: 'pain',
    description: 'Una partida con Yuumi, sí o sí.',
    imageUrl: 'https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Yuumi_0.jpg' },
  { id: 'safe', label: 'No pasa nada', weight: 0.20, tone: 'mercy',
    description: 'La ruleta se apiada de ti. Sigue con tu vida.', imageUrl: null },
  { id: 'first-pick-random', label: 'Primer pick = random', weight: 0.15,
    description: 'Tu siguiente partida bloqueas el primer champ random.',
    imageUrl: 'https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Jinx_0.jpg' },
];

const TRIGGER_NICK = 'Werlyb';
const TARGET_NICK = 'JavierrLol';

const PENDING = [
  { id: 'p1', nick: 'Pelukass', label: 'Autofill', remaining: 2,
    img: 'https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Lucian_0.jpg' },
  { id: 'p2', nick: 'Knekro', label: 'Champ por K', remaining: 1,
    img: 'https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Kindred_0.jpg' },
  { id: 'p3', nick: 'Skain', label: 'Yuumi', remaining: 1,
    img: 'https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Yuumi_0.jpg' },
];

// Geometry — overlay card is 920px wide, 22px horizontal padding
const CARD_W = 152, GAP = 14;
const STEP = CARD_W + GAP;
const STRIP_W = 920 - 22 * 2;
const CENTER_X = STRIP_W / 2;
const CARD_HALF = CARD_W / 2;

function buildStrip(options, repeats = 8) {
  const weighted = [];
  options.forEach(o => {
    const copies = Math.max(2, Math.round(o.weight * 24));
    for (let i = 0; i < copies; i++) weighted.push(o);
  });
  function shuffled(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const out = [];
  for (let r = 0; r < repeats; r++) {
    const sh = shuffled(weighted);
    for (const o of sh) out.push(o);
  }
  return out.map((o, i) => ({ ...o, _key: o.id + '-' + i }));
}

function Card({ opt }) {
  const cls = ['card', !opt.imageUrl ? 'no-splash' : ''].filter(Boolean).join(' ');
  const pct = Math.round(opt.weight * 100);
  const tagText = opt.tone === 'pain' ? 'Castigo' : (opt.tone === 'mercy' ? 'Piedad' : 'Opción');
  const tagCls = 'tag ' + (opt.tone || '');
  return (
    <div className={cls}>
      <div className="splash" style={opt.imageUrl ? { backgroundImage: `url(${opt.imageUrl})` } : null} />
      <div className="pct-badge">{pct}%</div>
      <div className="body">
        <div className="label">{opt.label}</div>
        <div className={tagCls}>{tagText}</div>
      </div>
    </div>
  );
}

function Carousel({ strip, stripX }) {
  return (
    <div className="carousel-wrap">
      <div className="strip-mask">
        <div className="strip" style={{ transform: `translateX(${stripX}px)` }}>
          {strip.map(o => <Card key={o._key} opt={o} />)}
        </div>
      </div>
      <div className="fade left" />
      <div className="fade right" />
      <div className="pointer">
        <div className="top-line" />
        <div className="arrow-down" />
        <div className="arrow-up" />
        <div className="bot-line" />
      </div>
    </div>
  );
}

function championNameFromUrl(url) {
  if (!url) return 'Mercy';
  const m = url.match(/\/([A-Za-z]+)_0\.jpg$/);
  return m ? m[1] : 'Champ';
}

function ResultRow({ option }) {
  if (!option) return null;
  const champName = championNameFromUrl(option.imageUrl);
  return (
    <motion.div
      className="result-row"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {option.imageUrl && (
        <div className="right-splash" style={{ backgroundImage: `url(${option.imageUrl})` }} />
      )}
      <div className="avatar-wrap">
        <motion.div
          className="name-bubble"
          initial={{ scale: 0, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ delay: 0.45, type: 'spring', stiffness: 380, damping: 14 }}
        >
          {champName}
        </motion.div>
        {option.imageUrl ? (
          <div className="avatar" style={{ backgroundImage: `url(${option.imageUrl})` }} />
        ) : (
          <div className="avatar no-splash">✓</div>
        )}
      </div>
      <div className="res-info">
        <div className="kicker">Castigo Asignado</div>
        <div className="ttl">{option.label}</div>
        <div className="desc">{option.description}</div>
      </div>
      <div className="vsep" />
      <div className="res-block">
        <div className="lbl">Para</div>
        <div className="val">{TARGET_NICK}</div>
      </div>
      <div className="vsep" />
      <div className="res-block">
        <div className="lbl">De parte de</div>
        <div className="val gold">{TRIGGER_NICK}</div>
      </div>
    </motion.div>
  );
}

function Pending() {
  return (
    <div className="pending">
      <div className="head">
        <div className="ttl"><span className="seal" />Castigos Pendientes</div>
        <div className="count">{PENDING.length}</div>
      </div>
      {PENDING.map(p => (
        <div key={p.id} className="pending-row">
          <div className="thumb"><img src={p.img} alt="" /></div>
          <div>
            <div className="nick">{p.nick}</div>
            <div className="sub">{p.label} · <b>{p.remaining} restantes</b></div>
          </div>
          <div className="icons">
            <span>S</span><span>K</span><span>Y</span><span>R</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function App() {
  const [strip, setStrip] = useState(() => buildStrip(OPTIONS));
  const [winnerId, setWinnerId] = useState('rol-sup-2');
  const [stripX, setStripX] = useState(0);
  const [phase, setPhase] = useState('idle'); // idle | spinning | result
  const [resultOption, setResultOption] = useState(null);
  const [timer, setTimer] = useState(0);
  const [bgOn, setBgOn] = useState(true);
  const animRef = useRef(null);
  const spinIdRef = useRef(0);
  const resultTimerRef = useRef(null);

  const targetXFor = (idx) => CENTER_X - idx * STEP - CARD_HALF;
  const pickWinnerIndex = (s, wid) => {
    const min = Math.floor(s.length * 0.7);
    const max = s.length - 4;
    const candidates = [];
    for (let i = min; i <= max; i++) if (s[i].id === wid) candidates.push(i);
    if (candidates.length) return candidates[Math.floor(candidates.length / 2)];
    for (let i = min; i < s.length; i++) if (s[i].id === wid) return i;
    return s.findIndex(x => x.id === wid);
  };

  const stopAnim = () => { if (animRef.current) { try { animRef.current.stop(); } catch(e) {} animRef.current = null; } };
  const clearResultTimer = () => { if (resultTimerRef.current) { clearTimeout(resultTimerRef.current); resultTimerRef.current = null; } };

  const spin = useCallback((winId) => {
    const wid = winId || winnerId;
    clearResultTimer();
    setResultOption(null);
    const fresh = buildStrip(OPTIONS);
    setStrip(fresh);
    const idx = pickWinnerIndex(fresh, wid);
    if (idx < 0) return;
    const targetX = targetXFor(idx);
    setStripX(0);
    setPhase('spinning');
    setTimer(7);

    const myId = ++spinIdRef.current;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (myId !== spinIdRef.current) return;
        stopAnim();
        animRef.current = fmAnimate(0, targetX, {
          duration: 6.5,
          ease: [0.12, 0.72, 0.12, 1],
          onUpdate: (v) => setStripX(v),
          onComplete: () => {
            if (myId !== spinIdRef.current) return;
            setTimeout(() => {
              if (myId !== spinIdRef.current) return;
              const opt = OPTIONS.find(o => o.id === wid);
              setResultOption(opt);
              setPhase('result');
              resultTimerRef.current = setTimeout(() => {
                if (myId !== spinIdRef.current) return;
                setPhase('idle');
                setResultOption(null);
              }, 8000);
            }, 600);
          }
        });
      });
    });
  }, [winnerId]);

  const reset = () => {
    spinIdRef.current++;
    clearResultTimer();
    stopAnim();
    setPhase('idle');
    setResultOption(null);
    setStripX(0);
  };

  const toggleBg = () => {
    const newBg = !bgOn;
    setBgOn(newBg);
    if (newBg) document.body.classList.add('preview');
    else document.body.classList.remove('preview');
  };

  // Initial spin (slight delay so fonts settle)
  useEffect(() => {
    const t = setTimeout(() => spin('rol-sup-2'), 800);
    return () => { clearTimeout(t); clearResultTimer(); stopAnim(); };
    // eslint-disable-next-line
  }, []);

  // Timer countdown during spin
  useEffect(() => {
    if (phase !== 'spinning') return;
    const start = performance.now();
    const total = 7;
    const id = setInterval(() => {
      const elapsed = (performance.now() - start) / 1000;
      setTimer(Math.max(0, total - elapsed));
    }, 100);
    return () => clearInterval(id);
  }, [phase]);

  // R key: random spin
  useEffect(() => {
    const handler = (e) => {
      if ((e.key === 'r' || e.key === 'R') && phase !== 'spinning') {
        const total = OPTIONS.reduce((a, o) => a + o.weight, 0);
        let r = Math.random() * total;
        let chosen = OPTIONS[0];
        for (const o of OPTIONS) {
          r -= o.weight;
          if (r <= 0) { chosen = o; break; }
        }
        setWinnerId(chosen.id);
        spin(chosen.id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [spin, phase]);

  const onPickWinner = (e) => setWinnerId(e.target.value);
  const onGirar = () => spin(winnerId);
  const showOverlay = phase === 'spinning' || phase === 'result';
  const isObs = typeof document !== 'undefined' && document.body.classList.contains('obs');

  return (
    <>
      {!isObs && (
        <div className="dev-panel">
          <button className={'b bg-toggle ' + (bgOn ? 'on' : '')} onClick={toggleBg}>
            BG {bgOn ? 'On' : 'Off'}
          </button>
          <button className="b primary" onClick={onGirar} disabled={phase === 'spinning'}>
            Disparar
          </button>
          <button className="b" onClick={reset} disabled={phase === 'idle'}>
            Reset
          </button>
        </div>
      )}

      {showOverlay && (
        <motion.div
          className="overlay-card"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="ribbon">
            <div className="left">
              <div className="helm">S</div>
              <div className="brand-text">SOLOQ<span className="accent">·</span>CHALLENGE</div>
            </div>
            <div className="ruleta-label">
              <span className="pulse-dot" />Ruleta de Castigo
            </div>
            <div className="week-chip">
              Semana 02 <span className="sep">·</span> Match #047
            </div>
          </div>

          <div className="event-head">
            <div className="event-title">
              <span className="nick-trigger">{TRIGGER_NICK}</span>
              <span className="arrow">→</span>
              <span className="nick-target">{TARGET_NICK}</span>
            </div>
            {phase === 'spinning' && (
              <div className="timer">0:{String(Math.ceil(timer)).padStart(2, '0')}</div>
            )}
          </div>

          {phase === 'spinning' && (
            <>
              <Carousel strip={strip} stripX={stripX} />
              <div className="caption">
                <span className="pulse" />Decelerando<span className="pulse" />
              </div>
            </>
          )}
          {phase === 'result' && resultOption && (
            <ResultRow option={resultOption} />
          )}
        </motion.div>
      )}

      <Pending />

      {!isObs && (
        <div className="controls">
          <span className="lbl">Forzar Ganador</span>
          <select value={winnerId} onChange={onPickWinner} disabled={phase === 'spinning'}>
            {OPTIONS.map(o => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
          <button className="btn-girar" onClick={onGirar} disabled={phase === 'spinning'}>
            Girar Ruleta
          </button>
          <span className="hint"><b>R</b>random</span>
        </div>
      )}
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
