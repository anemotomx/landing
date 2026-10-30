(() => {
  document.documentElement.classList.add('js');
  const sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const conCursor = matchMedia('(hover: hover)').matches;

  // cubos de la portada: la escalera de letras del logo, dibujada en isométrico con trazo de mano
  const escena = document.getElementById('escena');
  if (escena) {
    const NS = 'http://www.w3.org/2000/svg';
    const L = 100, A = [.866 * L, -.5 * L], B = [-.866 * L, -.5 * L], H = [0, -L];
    let semilla = 5;
    const azar = () => { semilla = (semilla * 16807) % 2147483647; return semilla / 2147483647; };
    const mano = (m) => (azar() - .5) * 2 * m;
    const suma = (p, q, k = 1) => [p[0] + q[0] * k, p[1] + q[1] * k];

    const camino = (pts) => {
      let d = '';
      pts.forEach((p, i) => {
        const q = pts[(i + 1) % pts.length];
        const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1;
        const ini = 2 + azar() * 7, fin = 2 + azar() * 7;
        d += `M${(p[0] - dx / l * ini + mano(1.6)).toFixed(1)} ${(p[1] - dy / l * ini + mano(1.6)).toFixed(1)}`
          + `L${(q[0] + dx / l * fin + mano(1.6)).toFixed(1)} ${(q[1] + dy / l * fin + mano(1.6)).toFixed(1)}`;
      });
      return d;
    };
    const el = (tag, attrs, padre) => {
      const n = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
      if (padre) padre.append(n);
      return n;
    };

    // u corre a lo largo de la cara derecha (sube a la derecha), v hacia atrás a la izquierda, w es la altura
    const piezas = [
      ['A', 0, 0, 1], ['N', 1, 0, 1], ['E', 2, 0, 1],
      ['M', -.3, 0, 0], ['O', .7, 0, 0], ['T', 1.7, 0, 0], ['O', 2.7, 0, 0]
    ];
    const base = (u, v, w) => [A[0] * u + B[0] * v + H[0] * w, A[1] * u + B[1] * v + H[1] * w];
    const orden = piezas.map((p, i) => ({ p, i })).sort((a, b) => ((b.p[1] + b.p[2]) * 10 - b.p[3]) - ((a.p[1] + a.p[2]) * 10 - a.p[3]));

    const svg = el('svg', { viewBox: '0 0 10 10', role: 'presentation' });
    const capa = el('g', {}, svg);
    let xs = [], ys = [];
    orden.forEach(({ p: [letra, u, v, w], i }) => {
      const [x, y] = base(u, v, w);
      const g = el('g', { class: 'cubo', style: `--i:${i}` }, capa);
      const V = [x, y];
      const derecha = [V, suma(V, A), suma(suma(V, A), H), suma(V, H)];
      const izquierda = [V, suma(V, B), suma(suma(V, B), H), suma(V, H)];
      const arriba = [suma(V, H), suma(suma(V, A), H), suma(suma(suma(V, A), B), H), suma(suma(V, B), H)];
      [izquierda, derecha, arriba].forEach((cara) => {
        el('polygon', { points: cara.map((q) => q.join(',')).join(' '), style: 'fill:var(--papel)' }, g);
        el('path', { d: camino(cara), fill: 'none', stroke: '#FB2034', 'stroke-width': 4.2, 'stroke-linecap': 'round' }, g);
        cara.forEach((q) => { xs.push(q[0]); ys.push(q[1]); });
      });
      const t = el('text', { x: 50, y: 80, 'text-anchor': 'middle', 'font-size': 84, class: 'letra',
        transform: `matrix(${(A[0] / 100).toFixed(4)} ${(A[1] / 100).toFixed(4)} 0 ${(L / 100).toFixed(4)} ${x.toFixed(1)} ${(y - L).toFixed(1)})` }, g);
      t.textContent = letra;
    });
    const m = 16, x0 = Math.min(...xs) - m, y0 = Math.min(...ys) - m;
    svg.setAttribute('viewBox', `${x0.toFixed(0)} ${y0.toFixed(0)} ${(Math.max(...xs) + m - x0).toFixed(0)} ${(Math.max(...ys) + m - y0).toFixed(0)}`);
    escena.append(svg);

    if (!sinMovimiento && conCursor) {
      const portada = document.querySelector('.portada');
      const cubos = [...capa.querySelectorAll('.cubo')];
      let meta = [0, 0], ahora = [0, 0], activo = false;
      const mover = () => {
        ahora[0] += (meta[0] - ahora[0]) * .1;
        ahora[1] += (meta[1] - ahora[1]) * .1;
        cubos.forEach((c) => {
          const prof = 1 + Number(c.style.getPropertyValue('--i')) % 4 * .35;
          c.style.setProperty('--px', (ahora[0] * 14 * prof).toFixed(2) + 'px');
          c.style.setProperty('--py', (ahora[1] * 8 * prof).toFixed(2) + 'px');
        });
        activo = Math.abs(meta[0] - ahora[0]) > .002 || Math.abs(meta[1] - ahora[1]) > .002;
        if (activo) requestAnimationFrame(mover);
      };
      portada.addEventListener('pointermove', (e) => {
        const r = portada.getBoundingClientRect();
        meta = [(e.clientX - r.left) / r.width * 2 - 1, (e.clientY - r.top) / r.height * 2 - 1];
        if (!activo) { activo = true; requestAnimationFrame(mover); }
      });
    }
  }

  // los videos solo corren mientras se ven
  const videos = document.querySelectorAll('.pieza video');
  if (sinMovimiento) {
    videos.forEach((v) => { v.controls = true; });
  } else if (videos.length) {
    const vigia = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => { e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause(); });
    }, { threshold: .35 });
    videos.forEach((v) => vigia.observe(v));
  }

  const aparecer = document.querySelectorAll('.aparece');
  if (aparecer.length) {
    const revela = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visto'); revela.unobserve(e.target); } });
    }, { threshold: .12 });
    aparecer.forEach((el) => revela.observe(el));
  }

  const enlaces = [...document.querySelectorAll('.barra a.enlace[href^="#"]')];
  const secciones = enlaces.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if (secciones.length) {
    const espia = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        enlaces.forEach((a) => a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + e.target.id)));
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    secciones.forEach((s) => espia.observe(s));
  }
})();
