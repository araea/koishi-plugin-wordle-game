// const jsdom = require('jsdom');
// const { JSDOM } = jsdom;
//
// // 创建一个虚拟的DOM环境
// const dom = new JSDOM('<!DOCTYPE html><p>Hello world</p>');
//
// // 获取全局对象
// const window = dom.window;
// const document = window.document;
function R() {
}

const be = e => e;

function ke(e, t) {
  for (const n in t)
    e[n] = t[n];
  return e
}

function at(e) {
  return e && typeof e == "object" && typeof e.then == "function"
}

function He(e) {
  return e()
}

function Ge() {
  return Object.create(null)
}

function j(e) {
  e.forEach(He)
}

function F(e) {
  return typeof e == "function"
}

function ct(e, t) {
  return e != e ? t == t : e !== t || e && typeof e == "object" || typeof e == "function"
}

let re;

function Rt(e, t) {
  return re || (re = document.createElement("a")),
    re.href = t,
  e === re.href
}

function lt(e) {
  return Object.keys(e).length === 0
}

function Oe(e, ...t) {
  if (e == null)
    return R;
  // let n
  // const n = e.subscribe(...t);
  // return n.unsubscribe ? ()=>n.unsubscribe() : n
  // return n
}

function $t(e) {
  return e

}

function Ct(e, t, n) {
  e.$$.on_destroy.push(Oe(t, n))
}

function qt(e, t, n, o) {
  if (e) {
    const l = Ze(e, t, n, o);
    return e[0](l)
  }
}

function Ze(e, t, n, o) {
  return e[1] && o ? ke(n.ctx.slice(), e[1](o(t))) : n.ctx
}

function zt(e, t, n, o) {
  if (e[2] && o) {
    const l = e[2](o(n));
    if (t.dirty === void 0)
      return l;
    if (typeof l == "object") {
      const b = []
        , u = Math.max(t.dirty.length, l.length);
      for (let d = 0; d < u; d += 1)
        b[d] = t.dirty[d] | l[d];
      return b
    }
    return t.dirty | l
  }
  return t.dirty
}

function Pt(e, t, n, o, l, b) {
  if (l) {
    const u = Ze(t, n, o, b);
    e.p(u, l)
  }
}

function jt(e) {
  if (e.ctx.length > 32) {
    const t = []
      , n = e.ctx.length / 32;
    for (let o = 0; o < n; o++)
      t[o] = -1;
    return t
  }
  return -1
}

function Bt(e, t, n) {
  return e.set(n),
    t
}

const Xe = typeof window != "undefined";
let Se = Xe ? () => window.performance.now() : () => Date.now()
  , Ae = Xe ? e => requestAnimationFrame(e) : R;
const I = new Set;

function Ke(e) {
  I.forEach(t => {
      t.c(e) || (I.delete(t),
        t.f())
    }
  ),
  I.size !== 0 && Ae(Ke)
}

function Te(e) {
  let t;
  return I.size === 0 && Ae(Ke),
    {
      promise: new Promise(n => {
          I.add(t = {
            c: e,
            f: n
          })
        }
      ),
      abort() {
        I.delete(t)
      }
    }
}

function ut(e, t) {
  e.appendChild(t)
}

function Je(e) {
  if (!e)
    return document;
  const t = e.getRootNode ? e.getRootNode() : e.ownerDocument;
  return t && t.host ? t : e.ownerDocument
}

function ft(e) {
  const t = wt("style");
  return bt(Je(e), t),
    t.sheet
}

function bt(e, t) {
  ut(e.head || e, t)
}

function Ut(e, t, n) {
  e.insertBefore(t, n || null)
}

function dt(e) {
  e.parentNode.removeChild(e)
}

function Lt(e, t) {
  for (let n = 0; n < e.length; n += 1)
    e[n] && e[n].d(t)
}

function wt(e) {
  return document.createElement(e)
}

function Dt(e) {
  return document.createElementNS("http://www.w3.org/2000/svg", e)
}

function Qe(e) {
  return document.createTextNode(e)
}

function It() {
  return Qe(" ")
}

function Vt() {
  return Qe("")
}

function Ft(e, t, n, o) {
  return e.addEventListener(t, n, o),
    () => e.removeEventListener(t, n, o)
}

function Gt(e) {
  return function (t) {
    return t.preventDefault(),
      e.call(this, t)
  }
}

function Wt(e, t, n) {
  n == null ? e.removeAttribute(t) : e.getAttribute(t) !== n && e.setAttribute(t, n)
}

function ht(e) {
  return Array.from(e.childNodes)
}

function Yt(e, t) {
  t = "" + t,
  e.wholeText !== t && (e.data = t)
}

function Ht(e, t) {
  e.value = t == null ? "" : t
}

function Zt(e, t, n, o) {
  n === null ? e.style.removeProperty(t) : e.style.setProperty(t, n, o ? "important" : "")
}

function Xt(e, t, n) {
  e.classList[n ? "add" : "remove"](t)
}

function et(e, t, n = !1) {
  const o = document.createEvent("CustomEvent");
  return o.initCustomEvent(e, n, !1, t),
    o
}

const ce = new Map;
let le = 0;

function pt(e) {
  let t = 5381
    , n = e.length;
  for (; n--;)
    t = (t << 5) - t ^ e.charCodeAt(n);
  return t >>> 0
}

function mt(e, t) {
  const n = {
    stylesheet: ft(t),
    rules: {}
  };
  return ce.set(e, n),
    n
}

function ue(e, t, n, o, l, b, u, d = 0) {
  const w = 16.666 / o;
  let f = `{
`;
  for (let c = 0; c <= 1; c += w) {
    const E = t + (n - t) * b(c);
    f += c * 100 + `%{${u(E, 1 - E)}}
`
  }
  const g = f + `100% {${u(n, 1 - n)}}
}`
    , h = `__svelte_${pt(g)}_${d}`
    , i = Je(e)
    , {stylesheet: a, rules: r} = ce.get(i) || mt(i, e);
  r[h] || (r[h] = !0,
    a.insertRule(`@keyframes ${h} ${g}`, a.cssRules.length));
  const s = e.style.animation || "";
  return e.style.animation = `${s ? `${s}, ` : ""}${h} ${o}ms linear ${l}ms 1 both`,
    le += 1,
    h
}

function fe(e, t) {
  const n = (e.style.animation || "").split(", ")
    , o = n.filter(t ? b => b.indexOf(t) < 0 : b => b.indexOf("__svelte") === -1)
    , l = n.length - o.length;
  l && (e.style.animation = o.join(", "),
    le -= l,
  le || gt())
}

function gt() {
  Ae(() => {
      le || (ce.forEach(e => {
          const {stylesheet: t} = e;
          let n = t.cssRules.length;
          for (; n--;)
            t.deleteRule(n);
          e.rules = {}
        }
      ),
        ce.clear())
    }
  )
}

let X;

function z(e) {
  X = e
}

function Me() {
  if (!X)
    throw new Error("Function called outside component initialization");
  return X
}

function Kt(e) {
  Me().$$.on_mount.push(e)
}

function Jt() {
  const e = Me();
  return (t, n) => {
    const o = e.$$.callbacks[t];
    if (o) {
      const l = et(t, n);
      o.slice().forEach(b => {
          b.call(e, l)
        }
      )
    }
  }
}

function Qt(e, t) {
  const n = e.$$.callbacks[t.type];
  n && n.slice().forEach(o => o.call(this, t))
}

const Z = []
  , We = []
  , se = []
  , xe = []
  , _t = Promise.resolve();
let Ee = !1;

function yt() {
  Ee || (Ee = !0,
    _t.then(Ne))
}

function V(e) {
  se.push(e)
}

function ei(e) {
  xe.push(e)
}

const ve = new Set;
let oe = 0;

function Ne() {
  const e = X;
  do {
    for (; oe < Z.length;) {
      const t = Z[oe];
      oe++,
        z(t),
        vt(t.$$)
    }
    for (z(null),
           Z.length = 0,
           oe = 0; We.length;)
      We.pop()();
    for (let t = 0; t < se.length; t += 1) {
      const n = se[t];
      ve.has(n) || (ve.add(n),
        n())
    }
    se.length = 0
  } while (Z.length);
  for (; xe.length;)
    xe.pop()();
  Ee = !1,
    ve.clear(),
    z(e)
}

function vt(e) {
  if (e.fragment !== null) {
    e.update(),
      j(e.before_update);
    const t = e.dirty;
    e.dirty = [-1],
    e.fragment && e.fragment.p(e.ctx, t),
      e.after_update.forEach(V)
  }
}

let H;

function Re() {
  return H || (H = Promise.resolve(),
    H.then(() => {
        H = null
      }
    )),
    H
}

function B(e, t, n) {
  e.dispatchEvent(et(`${t ? "intro" : "outro"}${n}`))
}

const ae = new Set;
let q;

function kt() {
  q = {
    r: 0,
    c: [],
    p: q
  }
}

function xt() {
  q.r || j(q.c),
    q = q.p
}

function $e(e, t) {
  e && e.i && (ae.delete(e),
    e.i(t))
}

function tt(e, t, n, o) {
  if (e && e.o) {
    if (ae.has(e))
      return;
    ae.add(e),
      q.c.push(() => {
          ae.delete(e),
          o && (n && e.d(1),
            o())
        }
      ),
      e.o(t)
  }
}

const Ce = {
  duration: 0
};

function ti(e, t, n) {
  let o = t(e, n), l = !1, b, u, d = 0;

  function w() {
    b && fe(e, b)
  }

  function f() {
    const {delay: h = 0, duration: i = 300, easing: a = be, tick: r = R, css: s} = o || Ce;
    s && (b = ue(e, 0, 1, i, h, a, s, d++)),
      r(0, 1);
    const c = Se() + h
      , E = c + i;
    u && u.abort(),
      l = !0,
      V(() => B(e, !0, "start")),
      u = Te(A => {
          if (l) {
            if (A >= E)
              return r(1, 0),
                B(e, !0, "end"),
                w(),
                l = !1;
            if (A >= c) {
              const p = a((A - c) / i);
              r(p, 1 - p)
            }
          }
          return l
        }
      )
  }

  let g = !1;
  return {
    start() {
      g || (g = !0,
        fe(e),
        F(o) ? (o = o(),
          Re().then(f)) : f())
    },
    invalidate() {
      g = !1
    },
    end() {
      l && (w(),
        l = !1)
    }
  }
}

function ii(e, t, n) {
  let o = t(e, n), l = !0, b;
  const u = q;
  u.r += 1;

  function d() {
    const {delay: w = 0, duration: f = 300, easing: g = be, tick: h = R, css: i} = o || Ce;
    i && (b = ue(e, 1, 0, f, w, g, i));
    const a = Se() + w
      , r = a + f;
    V(() => B(e, !1, "start")),
      Te(s => {
          if (l) {
            if (s >= r)
              return h(0, 1),
                B(e, !1, "end"),
              --u.r || j(u.c),
                !1;
            if (s >= a) {
              const c = g((s - a) / f);
              h(1 - c, c)
            }
          }
          return l
        }
      )
  }

  return F(o) ? Re().then(() => {
      o = o(),
        d()
    }
  ) : d(),
    {
      end(w) {
        w && o.tick && o.tick(1, 0),
        l && (b && fe(e, b),
          l = !1)
      }
    }
}

function ni(e, t, n, o) {
  let l = t(e, n)
    , b = o ? 0 : 1
    , u = null
    , d = null
    , w = null;

  function f() {
    w && fe(e, w)
  }

  function g(i, a) {
    const r = i.b - b;
    return a *= Math.abs(r),
      {
        a: b,
        b: i.b,
        d: r,
        duration: a,
        start: i.start,
        end: i.start + a,
        group: i.group
      }
  }

  function h(i) {
    const {delay: a = 0, duration: r = 300, easing: s = be, tick: c = R, css: E} = l || Ce
      , A = {
      start: Se() + a,
      b: i
    };
    i || (A.group = q,
      q.r += 1),
      u || d ? d = A : (E && (f(),
        w = ue(e, b, i, r, a, s, E)),
      i && c(0, 1),
        u = g(A, r),
        V(() => B(e, i, "start")),
        Te(p => {
            if (d && p > d.start && (u = g(d, r),
              d = null,
              B(e, u.b, "start"),
            E && (f(),
              w = ue(e, b, u.b, u.duration, 0, s, l.css))),
              u) {
              if (p >= u.end)
                c(b = u.b, 1 - b),
                  B(e, u.b, "end"),
                d || (u.b ? f() : --u.group.r || j(u.group.c)),
                  u = null;
              else if (p >= u.start) {
                const m = p - u.start;
                b = u.a + u.d * s(m / u.duration),
                  c(b, 1 - b)
              }
            }
            return !!(u || d)
          }
        ))
  }

  return {
    run(i) {
      F(l) ? Re().then(() => {
          l = l(),
            h(i)
        }
      ) : h(i)
    },
    end() {
      f(),
        u = d = null
    }
  }
}

function ri(e, t) {
  const n = t.token = {};

  function o(l, b, u, d) {
    if (t.token !== n)
      return;
    t.resolved = d;
    let w = t.ctx;
    u !== void 0 && (w = w.slice(),
      w[u] = d);
    const f = l && (t.current = l)(w);
    let g = !1;
    t.block && (t.blocks ? t.blocks.forEach((h, i) => {
        i !== b && h && (kt(),
          tt(h, 1, 1, () => {
              t.blocks[i] === h && (t.blocks[i] = null)
            }
          ),
          xt())
      }
    ) : t.block.d(1),
      f.c(),
      $e(f, 1),
      f.m(t.mount(), t.anchor),
      g = !0),
      t.block = f,
    t.blocks && (t.blocks[b] = f),
    g && Ne()
  }

  if (at(e)) {
    const l = Me();
    if (e.then(b => {
        z(l),
          o(t.then, 1, t.value, b),
          z(null)
      }
      , b => {
        if (z(l),
          o(t.catch, 2, t.error, b),
          z(null),
          !t.hasCatch)
          throw b
      }
    ),
    t.current !== t.pending)
      return o(t.pending, 0),
        !0
  } else {
    if (t.current !== t.then)
      return o(t.then, 1, t.value, e),
        !0;
    t.resolved = e
  }
}

function oi(e, t, n) {
  const o = t.slice()
    , {resolved: l} = e;
  e.current === e.then && (o[e.value] = l),
  e.current === e.catch && (o[e.error] = l),
    e.block.p(o, n)
}

function si(e, t) {
  tt(e, 1, 1, () => {
      t.delete(e.key)
    }
  )
}

function ai(e, t, n, o, l, b, u, d, w, f, g, h) {
  let i = e.length
    , a = b.length
    , r = i;
  const s = {};
  for (; r--;)
    s[e[r].key] = r;
  const c = []
    , E = new Map
    , A = new Map;
  for (r = a; r--;) {
    const k = h(l, b, r)
      , M = n(k);
    let N = u.get(M);
    N ? o && N.p(k, t) : (N = f(M, k),
      N.c()),
      E.set(M, c[r] = N),
    M in s && A.set(M, Math.abs(r - s[M]))
  }
  const p = new Set
    , m = new Set;

  function T(k) {
    $e(k, 1),
      k.m(d, g),
      u.set(k.key, k),
      g = k.first,
      a--
  }

  for (; i && a;) {
    const k = c[a - 1]
      , M = e[i - 1]
      , N = k.key
      , P = M.key;
    k === M ? (g = k.first,
      i--,
      a--) : E.has(P) ? !u.has(N) || p.has(N) ? T(k) : m.has(P) ? i-- : A.get(N) > A.get(P) ? (m.add(N),
      T(k)) : (p.add(P),
      i--) : (w(M, u),
      i--)
  }
  for (; i--;) {
    const k = e[i];
    E.has(k.key) || w(k, u)
  }
  for (; a;)
    T(c[a - 1]);
  return c
}

function ci(e, t, n) {
  const o = e.$$.props[t];
  o !== void 0 && (e.$$.bound[o] = n,
    n(e.$$.ctx[o]))
}

function li(e) {
  e && e.c()
}

function Et(e, t, n, o) {
  const {fragment: l, on_mount: b, on_destroy: u, after_update: d} = e.$$;
  l && l.m(t, n),
  o || V(() => {
      const w = b.map(He).filter(F);
      u ? u.push(...w) : j(w),
        e.$$.on_mount = []
    }
  ),
    d.forEach(V)
}

function Ot(e, t) {
  const n = e.$$;
  n.fragment !== null && (j(n.on_destroy),
  n.fragment && n.fragment.d(t),
    n.on_destroy = n.fragment = null,
    n.ctx = [])
}

function St(e, t) {
  e.$$.dirty[0] === -1 && (Z.push(e),
    yt(),
    e.$$.dirty.fill(0)),
    e.$$.dirty[t / 31 | 0] |= 1 << t % 31
}

function ui(e, t, n, o, l, b, u, d = [-1]) {
  const w = X;
  z(e);
  const f = e.$$ = {
    fragment: null,
    ctx: null,
    props: b,
    update: R,
    not_equal: l,
    bound: Ge(),
    on_mount: [],
    on_destroy: [],
    on_disconnect: [],
    before_update: [],
    after_update: [],
    context: new Map(t.context || (w ? w.$$.context : [])),
    callbacks: Ge(),
    dirty: d,
    skip_bound: !1,
    root: t.target
    // || w.$$.root
  };
  u && u(f.root);
  let g = !1;
  if (f.ctx = n ? n(e, t.props || {}, (h, i, ...a) => {
      const r = a.length ? a[0] : i;
      return f.ctx && l(f.ctx[h], f.ctx[h] = r) && (!f.skip_bound && f.bound[h] && f.bound[h](r),
      g && St(e, h)),
        i
    }
  ) : [],
    f.update(),
    g = !0,
    j(f.before_update),
    f.fragment = o ? o(f.ctx) : !1,
    t.target) {
    if (t.hydrate) {
      const h = ht(t.target);
      f.fragment && f.fragment.l(h),
        h.forEach(dt)
    } else
      f.fragment && f.fragment.c();
    t.intro && $e(e.$$.fragment),
      Et(e, t.target, t.anchor, t.customElement),
      Ne()
  }
  z(w)
}

class fi {
  $destroy() {
    Ot(this, 1),
      this.$destroy = R
  }

  $on(t, n) {
    const o = this.$$.callbacks[t] || (this.$$.callbacks[t] = []);
    return o.push(n),
      () => {
        const l = o.indexOf(n);
        l !== -1 && o.splice(l, 1)
      }
  }

  $set(t) {
    this.$$set && !lt(t) && (this.$$.skip_bound = !0,
      this.$$set(t),
      this.$$.skip_bound = !1)
  }
}

function it(e) {
  const t = e - 1;
  return t * t * t + 1
}

function bi(e) {
  return Math.sin(e * Math.PI / 2)
}

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
function At(e, t) {
  var n = {};
  for (var o in e)
    Object.prototype.hasOwnProperty.call(e, o) && t.indexOf(o) < 0 && (n[o] = e[o]);
  if (e != null && typeof Object.getOwnPropertySymbols == "function")
    for (var l = 0, o = Object.getOwnPropertySymbols(e); l < o.length; l++)
      t.indexOf(o[l]) < 0 && Object.prototype.propertyIsEnumerable.call(e, o[l]) && (n[o[l]] = e[o[l]]);
  return n
}

function di(e, {delay: t = 0, duration: n = 400, easing: o = be} = {}) {
  const l = +getComputedStyle(e).opacity;
  return {
    delay: t,
    duration: n,
    easing: o,
    css: b => `opacity: ${b * l}`
  }
}

function wi(e, {delay: t = 0, duration: n = 400, easing: o = it, x: l = 0, y: b = 0, opacity: u = 0} = {}) {
  const d = getComputedStyle(e)
    , w = +d.opacity
    , f = d.transform === "none" ? "" : d.transform
    , g = w * (1 - u);
  return {
    delay: t,
    duration: n,
    easing: o,
    css: (h, i) => `
			transform: ${f} translate(${(1 - h) * l}px, ${(1 - h) * b}px);
			opacity: ${w - g * i}`
  }
}

function hi(e) {
  var {fallback: t} = e
    , n = At(e, ["fallback"]);
  const o = new Map
    , l = new Map;

  function b(d, w, f) {
    const {delay: g = 0, duration: h = k => Math.sqrt(k) * 30, easing: i = it} = ke(ke({}, n), f)
      , a = w.getBoundingClientRect()
      , r = d.left - a.left
      , s = d.top - a.top
      , c = d.width / a.width
      , E = d.height / a.height
      , A = Math.sqrt(r * r + s * s)
      , p = getComputedStyle(w)
      , m = p.transform === "none" ? "" : p.transform
      , T = +p.opacity;
    return {
      delay: g,
      duration: F(h) ? h(A) : h,
      easing: i,
      css: (k, M) => `
				opacity: ${k * T};
				transform-origin: top left;
				transform: ${m} translate(${M * r}px,${M * s}px) scale(${k + (1 - k) * c}, ${k + (1 - k) * E});
			`
    }
  }

  function u(d, w, f) {
    return (g, h) => (d.set(h.key, {
        rect: g.getBoundingClientRect()
      }),
        () => {
          if (w.has(h.key)) {
            const {rect: i} = w.get(h.key);
            return w.delete(h.key),
              b(i, g, h)
          }
          return d.delete(h.key),
          t && t(g, h, f)
        }
    )
  }

  return [u(l, o, !1), u(o, l, !0)]
}

const D = [];

function Tt(e, t) {
  return {
    // subscribe: Mt(e, t).subscribe
  }
}

function Mt(e, t = R) {
  let n;
  const o = new Set;

  function l(d) {
    if (ct(e, d) && (e = d,
      n)) {
      const w = !D.length;
      for (const f of o)
        f[1](),
          D.push(f, e);
      if (w) {
        for (let f = 0; f < D.length; f += 2)
          D[f][0](D[f + 1]);
        D.length = 0
      }
    }
  }

  function b(d) {
    l(d(e))
  }

  function u(d, w = R) {
    const f = [d, w];
    return o.add(f),
    o.size === 1 && (n = t(l) || R),
      d(e),
      () => {
        o.delete(f),
        o.size === 0 && (n(),
          n = null)
      }
  }

  return {
    set: l,
    update: b,
    subscribe: u
  }
}

const pi = function (e, t, n) {
  const o = !Array.isArray(e)
    , l = o ? [e] : e
    , b = t.length < 2;
  return Tt(n, u => {
      let d = !1;
      const w = [];
      let f = 0
        , g = R;
      const h = () => {
        if (f)
          return;
        g();
        const a = t(o ? w[0] : w, u);
        b ? u(a) : g = F(a) ? a : R
      }
        , i = l.map((a, r) => Oe(a, s => {
          w[r] = s,
            f &= ~(1 << r),
          d && h()
        }
        , () => {
          f |= 1 << r
        }
      ));
      return d = !0,
        h(),
        function () {
          j(i),
            g()
        }
    }
  )
}
var Nt = typeof globalThis != "undefined" ? globalThis : typeof window != "undefined" ? window : typeof global != "undefined" ? global : typeof self != "undefined" ? self : {}
  , Ye = {
  exports: {}
};
(function (e, t) {
    (function (n, o) {
        var l = "1.0.2"
          , b = ""
          , u = "?"
          , d = "function"
          , w = "undefined"
          , f = "object"
          , g = "string"
          , h = "major"
          , i = "model"
          , a = "name"
          , r = "type"
          , s = "vendor"
          , c = "version"
          , E = "architecture"
          , A = "console"
          , p = "mobile"
          , m = "tablet"
          , T = "smarttv"
          , k = "wearable"
          , M = "embedded"
          , N = 255
          , P = "Amazon"
          , de = "Apple"
          , qe = "ASUS"
          , ze = "BlackBerry"
          , U = "Browser"
          , K = "Chrome"
          , nt = "Edge"
          , J = "Firefox"
          , Q = "Google"
          , Pe = "Huawei"
          , we = "LG"
          , he = "Microsoft"
          , je = "Motorola"
          , ee = "Opera"
          , pe = "Samsung"
          , me = "Sony"
          , Be = "Xiaomi"
          , ge = "Zebra"
          , Ue = "Facebook"
          , rt = function (_, x) {
          var y = {};
          for (var S in _)
            x[S] && x[S].length % 2 === 0 ? y[S] = x[S].concat(_[S]) : y[S] = _[S];
          return y
        }
          , te = function (_) {
          for (var x = {}, y = 0; y < _.length; y++)
            x[_[y].toUpperCase()] = _[y];
          return x
        }
          , Le = function (_, x) {
          return typeof _ === g ? G(x).indexOf(G(_)) !== -1 : !1
        }
          , G = function (_) {
          return _.toLowerCase()
        }
          , ot = function (_) {
          return typeof _ === g ? _.replace(/[^\d\.]/g, b).split(".")[0] : o
        }
          , _e = function (_, x) {
          if (typeof _ === g)
            return _ = _.replace(/^\s\s*/, b).replace(/\s\s*$/, b),
              typeof x === w ? _ : _.substring(0, N)
        }
          , W = function (_, x) {
          for (var y = 0, S, v, ne, O, Y, C; y < x.length && !Y;) {
            var Ve = x[y]
              , Fe = x[y + 1];
            for (S = v = 0; S < Ve.length && !Y;)
              if (Y = Ve[S++].exec(_),
                Y)
                for (ne = 0; ne < Fe.length; ne++)
                  C = Y[++v],
                    O = Fe[ne],
                    typeof O === f && O.length > 0 ? O.length === 2 ? typeof O[1] == d ? this[O[0]] = O[1].call(this, C) : this[O[0]] = O[1] : O.length === 3 ? typeof O[1] === d && !(O[1].exec && O[1].test) ? this[O[0]] = C ? O[1].call(this, C, O[2]) : o : this[O[0]] = C ? C.replace(O[1], O[2]) : o : O.length === 4 && (this[O[0]] = C ? O[3].call(this, C.replace(O[1], O[2])) : o) : this[O] = C || o;
            y += 2
          }
        }
          , ye = function (_, x) {
          for (var y in x)
            if (typeof x[y] === f && x[y].length > 0) {
              for (var S = 0; S < x[y].length; S++)
                if (Le(x[y][S], _))
                  return y === u ? o : y
            } else if (Le(x[y], _))
              return y === u ? o : y;
          return _
        }
          , st = {
          "1.0": "/8",
          "1.2": "/1",
          "1.3": "/3",
          "2.0": "/412",
          "2.0.2": "/416",
          "2.0.3": "/417",
          "2.0.4": "/419",
          "?": "/"
        }
          , De = {
          ME: "4.90",
          "NT 3.11": "NT3.51",
          "NT 4.0": "NT4.0",
          "2000": "NT 5.0",
          XP: ["NT 5.1", "NT 5.2"],
          Vista: "NT 6.0",
          "7": "NT 6.1",
          "8": "NT 6.2",
          "8.1": "NT 6.3",
          "10": ["NT 6.4", "NT 10.0"],
          RT: "ARM"
        }
          , Ie = {
          browser: [[/\b(?:crmo|crios)\/([\w\.]+)/i], [c, [a, "Chrome"]], [/edg(?:e|ios|a)?\/([\w\.]+)/i], [c, [a, "Edge"]], [/(opera mini)\/([-\w\.]+)/i, /(opera [mobiletab]{3,6})\b.+version\/([-\w\.]+)/i, /(opera)(?:.+version\/|[\/ ]+)([\w\.]+)/i], [a, c], [/opios[\/ ]+([\w\.]+)/i], [c, [a, ee + " Mini"]], [/\bopr\/([\w\.]+)/i], [c, [a, ee]], [/(kindle)\/([\w\.]+)/i, /(lunascape|maxthon|netfront|jasmine|blazer)[\/ ]?([\w\.]*)/i, /(avant |iemobile|slim)(?:browser)?[\/ ]?([\w\.]*)/i, /(ba?idubrowser)[\/ ]?([\w\.]+)/i, /(?:ms|\()(ie) ([\w\.]+)/i, /(flock|rockmelt|midori|epiphany|silk|skyfire|ovibrowser|bolt|iron|vivaldi|iridium|phantomjs|bowser|quark|qupzilla|falkon|rekonq|puffin|brave|whale|qqbrowserlite|qq)\/([-\w\.]+)/i, /(weibo)__([\d\.]+)/i], [a, c], [/(?:\buc? ?browser|(?:juc.+)ucweb)[\/ ]?([\w\.]+)/i], [c, [a, "UC" + U]], [/\bqbcore\/([\w\.]+)/i], [c, [a, "WeChat(Win) Desktop"]], [/micromessenger\/([\w\.]+)/i], [c, [a, "WeChat"]], [/konqueror\/([\w\.]+)/i], [c, [a, "Konqueror"]], [/trident.+rv[: ]([\w\.]{1,9})\b.+like gecko/i], [c, [a, "IE"]], [/yabrowser\/([\w\.]+)/i], [c, [a, "Yandex"]], [/(avast|avg)\/([\w\.]+)/i], [[a, /(.+)/, "$1 Secure " + U], c], [/\bfocus\/([\w\.]+)/i], [c, [a, J + " Focus"]], [/\bopt\/([\w\.]+)/i], [c, [a, ee + " Touch"]], [/coc_coc\w+\/([\w\.]+)/i], [c, [a, "Coc Coc"]], [/dolfin\/([\w\.]+)/i], [c, [a, "Dolphin"]], [/coast\/([\w\.]+)/i], [c, [a, ee + " Coast"]], [/miuibrowser\/([\w\.]+)/i], [c, [a, "MIUI " + U]], [/fxios\/([-\w\.]+)/i], [c, [a, J]], [/\bqihu|(qi?ho?o?|360)browser/i], [[a, "360 " + U]], [/(oculus|samsung|sailfish)browser\/([\w\.]+)/i], [[a, /(.+)/, "$1 " + U], c], [/(comodo_dragon)\/([\w\.]+)/i], [[a, /_/g, " "], c], [/(electron)\/([\w\.]+) safari/i, /(tesla)(?: qtcarbrowser|\/(20\d\d\.[-\w\.]+))/i, /m?(qqbrowser|baiduboxapp|2345Explorer)[\/ ]?([\w\.]+)/i], [a, c], [/(metasr)[\/ ]?([\w\.]+)/i, /(lbbrowser)/i], [a], [/((?:fban\/fbios|fb_iab\/fb4a)(?!.+fbav)|;fbav\/([\w\.]+);)/i], [[a, Ue], c], [/safari (line)\/([\w\.]+)/i, /\b(line)\/([\w\.]+)\/iab/i, /(chromium|instagram)[\/ ]([-\w\.]+)/i], [a, c], [/\bgsa\/([\w\.]+) .*safari\//i], [c, [a, "GSA"]], [/headlesschrome(?:\/([\w\.]+)| )/i], [c, [a, K + " Headless"]], [/ wv\).+(chrome)\/([\w\.]+)/i], [[a, K + " WebView"], c], [/droid.+ version\/([\w\.]+)\b.+(?:mobile safari|safari)/i], [c, [a, "Android " + U]], [/(chrome|omniweb|arora|[tizenoka]{5} ?browser)\/v?([\w\.]+)/i], [a, c], [/version\/([\w\.]+) .*mobile\/\w+ (safari)/i], [c, [a, "Mobile Safari"]], [/version\/([\w\.]+) .*(mobile ?safari|safari)/i], [c, a], [/webkit.+?(mobile ?safari|safari)(\/[\w\.]+)/i], [a, [c, ye, st]], [/(webkit|khtml)\/([\w\.]+)/i], [a, c], [/(navigator|netscape\d?)\/([-\w\.]+)/i], [[a, "Netscape"], c], [/mobile vr; rv:([\w\.]+)\).+firefox/i], [c, [a, J + " Reality"]], [/ekiohf.+(flow)\/([\w\.]+)/i, /(swiftfox)/i, /(icedragon|iceweasel|camino|chimera|fennec|maemo browser|minimo|conkeror|klar)[\/ ]?([\w\.\+]+)/i, /(seamonkey|k-meleon|icecat|iceape|firebird|phoenix|palemoon|basilisk|waterfox)\/([-\w\.]+)$/i, /(firefox)\/([\w\.]+)/i, /(mozilla)\/([\w\.]+) .+rv\:.+gecko\/\d+/i, /(polaris|lynx|dillo|icab|doris|amaya|w3m|netsurf|sleipnir|obigo|mosaic|(?:go|ice|up)[\. ]?browser)[-\/ ]?v?([\w\.]+)/i, /(links) \(([\w\.]+)/i], [a, c]],
          cpu: [[/(?:(amd|x(?:(?:86|64)[-_])?|wow|win)64)[;\)]/i], [[E, "amd64"]], [/(ia32(?=;))/i], [[E, G]], [/((?:i[346]|x)86)[;\)]/i], [[E, "ia32"]], [/\b(aarch64|arm(v?8e?l?|_?64))\b/i], [[E, "arm64"]], [/\b(arm(?:v[67])?ht?n?[fl]p?)\b/i], [[E, "armhf"]], [/windows (ce|mobile); ppc;/i], [[E, "arm"]], [/((?:ppc|powerpc)(?:64)?)(?: mac|;|\))/i], [[E, /ower/, b, G]], [/(sun4\w)[;\)]/i], [[E, "sparc"]], [/((?:avr32|ia64(?=;))|68k(?=\))|\barm(?=v(?:[1-7]|[5-7]1)l?|;|eabi)|(?=atmel )avr|(?:irix|mips|sparc)(?:64)?\b|pa-risc)/i], [[E, G]]],
          device: [[/\b(sch-i[89]0\d|shw-m380s|sm-[pt]\w{2,4}|gt-[pn]\d{2,4}|sgh-t8[56]9|nexus 10)/i], [i, [s, pe], [r, m]], [/\b((?:s[cgp]h|gt|sm)-\w+|galaxy nexus)/i, /samsung[- ]([-\w]+)/i, /sec-(sgh\w+)/i], [i, [s, pe], [r, p]], [/\((ip(?:hone|od)[\w ]*);/i], [i, [s, de], [r, p]], [/\((ipad);[-\w\),; ]+apple/i, /applecoremedia\/[\w\.]+ \((ipad)/i, /\b(ipad)\d\d?,\d\d?[;\]].+ios/i], [i, [s, de], [r, m]], [/\b((?:ag[rs][23]?|bah2?|sht?|btv)-a?[lw]\d{2})\b(?!.+d\/s)/i], [i, [s, Pe], [r, m]], [/(?:huawei|honor)([-\w ]+)[;\)]/i, /\b(nexus 6p|\w{2,4}-[atu]?[ln][01259x][012359][an]?)\b(?!.+d\/s)/i], [i, [s, Pe], [r, p]], [/\b(poco[\w ]+)(?: bui|\))/i, /\b; (\w+) build\/hm\1/i, /\b(hm[-_ ]?note?[_ ]?(?:\d\w)?) bui/i, /\b(redmi[\-_ ]?(?:note|k)?[\w_ ]+)(?: bui|\))/i, /\b(mi[-_ ]?(?:a\d|one|one[_ ]plus|note lte|max)?[_ ]?(?:\d?\w?)[_ ]?(?:plus|se|lite)?)(?: bui|\))/i], [[i, /_/g, " "], [s, Be], [r, p]], [/\b(mi[-_ ]?(?:pad)(?:[\w_ ]+))(?: bui|\))/i], [[i, /_/g, " "], [s, Be], [r, m]], [/; (\w+) bui.+ oppo/i, /\b(cph[12]\d{3}|p(?:af|c[al]|d\w|e[ar])[mt]\d0|x9007|a101op)\b/i], [i, [s, "OPPO"], [r, p]], [/vivo (\w+)(?: bui|\))/i, /\b(v[12]\d{3}\w?[at])(?: bui|;)/i], [i, [s, "Vivo"], [r, p]], [/\b(rmx[12]\d{3})(?: bui|;|\))/i], [i, [s, "Realme"], [r, p]], [/\b(milestone|droid(?:[2-4x]| (?:bionic|x2|pro|razr))?:?( 4g)?)\b[\w ]+build\//i, /\bmot(?:orola)?[- ](\w*)/i, /((?:moto[\w\(\) ]+|xt\d{3,4}|nexus 6)(?= bui|\)))/i], [i, [s, je], [r, p]], [/\b(mz60\d|xoom[2 ]{0,2}) build\//i], [i, [s, je], [r, m]], [/((?=lg)?[vl]k\-?\d{3}) bui| 3\.[-\w; ]{10}lg?-([06cv9]{3,4})/i], [i, [s, we], [r, m]], [/(lm(?:-?f100[nv]?|-[\w\.]+)(?= bui|\))|nexus [45])/i, /\blg[-e;\/ ]+((?!browser|netcast|android tv)\w+)/i, /\blg-?([\d\w]+) bui/i], [i, [s, we], [r, p]], [/(ideatab[-\w ]+)/i, /lenovo ?(s[56]000[-\w]+|tab(?:[\w ]+)|yt[-\d\w]{6}|tb[-\d\w]{6})/i], [i, [s, "Lenovo"], [r, m]], [/(?:maemo|nokia).*(n900|lumia \d+)/i, /nokia[-_ ]?([-\w\.]*)/i], [[i, /_/g, " "], [s, "Nokia"], [r, p]], [/(pixel c)\b/i], [i, [s, Q], [r, m]], [/droid.+; (pixel[\daxl ]{0,6})(?: bui|\))/i], [i, [s, Q], [r, p]], [/droid.+ ([c-g]\d{4}|so[-gl]\w+|xq-a\w[4-7][12])(?= bui|\).+chrome\/(?![1-6]{0,1}\d\.))/i], [i, [s, me], [r, p]], [/sony tablet [ps]/i, /\b(?:sony)?sgp\w+(?: bui|\))/i], [[i, "Xperia Tablet"], [s, me], [r, m]], [/ (kb2005|in20[12]5|be20[12][59])\b/i, /(?:one)?(?:plus)? (a\d0\d\d)(?: b|\))/i], [i, [s, "OnePlus"], [r, p]], [/(alexa)webm/i, /(kf[a-z]{2}wi)( bui|\))/i, /(kf[a-z]+)( bui|\)).+silk\//i], [i, [s, P], [r, m]], [/((?:sd|kf)[0349hijorstuw]+)( bui|\)).+silk\//i], [[i, /(.+)/g, "Fire Phone $1"], [s, P], [r, p]], [/(playbook);[-\w\),; ]+(rim)/i], [i, s, [r, m]], [/\b((?:bb[a-f]|st[hv])100-\d)/i, /\(bb10; (\w+)/i], [i, [s, ze], [r, p]], [/(?:\b|asus_)(transfo[prime ]{4,10} \w+|eeepc|slider \w+|nexus 7|padfone|p00[cj])/i], [i, [s, qe], [r, m]], [/ (z[bes]6[027][012][km][ls]|zenfone \d\w?)\b/i], [i, [s, qe], [r, p]], [/(nexus 9)/i], [i, [s, "HTC"], [r, m]], [/(htc)[-;_ ]{1,2}([\w ]+(?=\)| bui)|\w+)/i, /(zte)[- ]([\w ]+?)(?: bui|\/|\))/i, /(alcatel|geeksphone|nexian|panasonic|sony)[-_ ]?([-\w]*)/i], [s, [i, /_/g, " "], [r, p]], [/droid.+; ([ab][1-7]-?[0178a]\d\d?)/i], [i, [s, "Acer"], [r, m]], [/droid.+; (m[1-5] note) bui/i, /\bmz-([-\w]{2,})/i], [i, [s, "Meizu"], [r, p]], [/\b(sh-?[altvz]?\d\d[a-ekm]?)/i], [i, [s, "Sharp"], [r, p]], [/(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus|dell|meizu|motorola|polytron)[-_ ]?([-\w]*)/i, /(hp) ([\w ]+\w)/i, /(asus)-?(\w+)/i, /(microsoft); (lumia[\w ]+)/i, /(lenovo)[-_ ]?([-\w]+)/i, /(jolla)/i, /(oppo) ?([\w ]+) bui/i], [s, i, [r, p]], [/(archos) (gamepad2?)/i, /(hp).+(touchpad(?!.+tablet)|tablet)/i, /(kindle)\/([\w\.]+)/i, /(nook)[\w ]+build\/(\w+)/i, /(dell) (strea[kpr\d ]*[\dko])/i, /(le[- ]+pan)[- ]+(\w{1,9}) bui/i, /(trinity)[- ]*(t\d{3}) bui/i, /(gigaset)[- ]+(q\w{1,9}) bui/i, /(vodafone) ([\w ]+)(?:\)| bui)/i], [s, i, [r, m]], [/(surface duo)/i], [i, [s, he], [r, m]], [/droid [\d\.]+; (fp\du?)(?: b|\))/i], [i, [s, "Fairphone"], [r, p]], [/(u304aa)/i], [i, [s, "AT&T"], [r, p]], [/\bsie-(\w*)/i], [i, [s, "Siemens"], [r, p]], [/\b(rct\w+) b/i], [i, [s, "RCA"], [r, m]], [/\b(venue[\d ]{2,7}) b/i], [i, [s, "Dell"], [r, m]], [/\b(q(?:mv|ta)\w+) b/i], [i, [s, "Verizon"], [r, m]], [/\b(?:barnes[& ]+noble |bn[rt])([\w\+ ]*) b/i], [i, [s, "Barnes & Noble"], [r, m]], [/\b(tm\d{3}\w+) b/i], [i, [s, "NuVision"], [r, m]], [/\b(k88) b/i], [i, [s, "ZTE"], [r, m]], [/\b(nx\d{3}j) b/i], [i, [s, "ZTE"], [r, p]], [/\b(gen\d{3}) b.+49h/i], [i, [s, "Swiss"], [r, p]], [/\b(zur\d{3}) b/i], [i, [s, "Swiss"], [r, m]], [/\b((zeki)?tb.*\b) b/i], [i, [s, "Zeki"], [r, m]], [/\b([yr]\d{2}) b/i, /\b(dragon[- ]+touch |dt)(\w{5}) b/i], [[s, "Dragon Touch"], i, [r, m]], [/\b(ns-?\w{0,9}) b/i], [i, [s, "Insignia"], [r, m]], [/\b((nxa|next)-?\w{0,9}) b/i], [i, [s, "NextBook"], [r, m]], [/\b(xtreme\_)?(v(1[045]|2[015]|[3469]0|7[05])) b/i], [[s, "Voice"], i, [r, p]], [/\b(lvtel\-)?(v1[12]) b/i], [[s, "LvTel"], i, [r, p]], [/\b(ph-1) /i], [i, [s, "Essential"], [r, p]], [/\b(v(100md|700na|7011|917g).*\b) b/i], [i, [s, "Envizen"], [r, m]], [/\b(trio[-\w\. ]+) b/i], [i, [s, "MachSpeed"], [r, m]], [/\btu_(1491) b/i], [i, [s, "Rotor"], [r, m]], [/(shield[\w ]+) b/i], [i, [s, "Nvidia"], [r, m]], [/(sprint) (\w+)/i], [s, i, [r, p]], [/(kin\.[onetw]{3})/i], [[i, /\./g, " "], [s, he], [r, p]], [/droid.+; (cc6666?|et5[16]|mc[239][23]x?|vc8[03]x?)\)/i], [i, [s, ge], [r, m]], [/droid.+; (ec30|ps20|tc[2-8]\d[kx])\)/i], [i, [s, ge], [r, p]], [/(ouya)/i, /(nintendo) ([wids3utch]+)/i], [s, i, [r, A]], [/droid.+; (shield) bui/i], [i, [s, "Nvidia"], [r, A]], [/(playstation [345portablevi]+)/i], [i, [s, me], [r, A]], [/\b(xbox(?: one)?(?!; xbox))[\); ]/i], [i, [s, he], [r, A]], [/smart-tv.+(samsung)/i], [s, [r, T]], [/hbbtv.+maple;(\d+)/i], [[i, /^/, "SmartTV"], [s, pe], [r, T]], [/(nux; netcast.+smarttv|lg (netcast\.tv-201\d|android tv))/i], [[s, we], [r, T]], [/(apple) ?tv/i], [s, [i, de + " TV"], [r, T]], [/crkey/i], [[i, K + "cast"], [s, Q], [r, T]], [/droid.+aft(\w)( bui|\))/i], [i, [s, P], [r, T]], [/\(dtv[\);].+(aquos)/i], [i, [s, "Sharp"], [r, T]], [/\b(roku)[\dx]*[\)\/]((?:dvp-)?[\d\.]*)/i, /hbbtv\/\d+\.\d+\.\d+ +\([\w ]*; *(\w[^;]*);([^;]*)/i], [[s, _e], [i, _e], [r, T]], [/\b(android tv|smart[- ]?tv|opera tv|tv; rv:)\b/i], [[r, T]], [/((pebble))app/i], [s, i, [r, k]], [/droid.+; (glass) \d/i], [i, [s, Q], [r, k]], [/droid.+; (wt63?0{2,3})\)/i], [i, [s, ge], [r, k]], [/(quest( 2)?)/i], [i, [s, Ue], [r, k]], [/(tesla)(?: qtcarbrowser|\/[-\w\.]+)/i], [s, [r, M]], [/droid .+?; ([^;]+?)(?: bui|\) applew).+? mobile safari/i], [i, [r, p]], [/droid .+?; ([^;]+?)(?: bui|\) applew).+?(?! mobile) safari/i], [i, [r, m]], [/\b((tablet|tab)[;\/]|focus\/\d(?!.+mobile))/i], [[r, m]], [/(phone|mobile(?:[;\/]| safari)|pda(?=.+windows ce))/i], [[r, p]], [/(android[-\w\. ]{0,9});.+buil/i], [i, [s, "Generic"]]],
          engine: [[/windows.+ edge\/([\w\.]+)/i], [c, [a, nt + "HTML"]], [/webkit\/537\.36.+chrome\/(?!27)([\w\.]+)/i], [c, [a, "Blink"]], [/(presto)\/([\w\.]+)/i, /(webkit|trident|netfront|netsurf|amaya|lynx|w3m|goanna)\/([\w\.]+)/i, /ekioh(flow)\/([\w\.]+)/i, /(khtml|tasman|links)[\/ ]\(?([\w\.]+)/i, /(icab)[\/ ]([23]\.[\d\.]+)/i], [a, c], [/rv\:([\w\.]{1,9})\b.+(gecko)/i], [c, a]],
          os: [[/microsoft (windows) (vista|xp)/i], [a, c], [/(windows) nt 6\.2; (arm)/i, /(windows (?:phone(?: os)?|mobile))[\/ ]?([\d\.\w ]*)/i, /(windows)[\/ ]?([ntce\d\. ]+\w)(?!.+xbox)/i], [a, [c, ye, De]], [/(win(?=3|9|n)|win 9x )([nt\d\.]+)/i], [[a, "Windows"], [c, ye, De]], [/ip[honead]{2,4}\b(?:.*os ([\w]+) like mac|; opera)/i, /cfnetwork\/.+darwin/i], [[c, /_/g, "."], [a, "iOS"]], [/(mac os x) ?([\w\. ]*)/i, /(macintosh|mac_powerpc\b)(?!.+haiku)/i], [[a, "Mac OS"], [c, /_/g, "."]], [/droid ([\w\.]+)\b.+(android[- ]x86)/i], [c, a], [/(android|webos|qnx|bada|rim tablet os|maemo|meego|sailfish)[-\/ ]?([\w\.]*)/i, /(blackberry)\w*\/([\w\.]*)/i, /(tizen|kaios)[\/ ]([\w\.]+)/i, /\((series40);/i], [a, c], [/\(bb(10);/i], [c, [a, ze]], [/(?:symbian ?os|symbos|s60(?=;)|series60)[-\/ ]?([\w\.]*)/i], [c, [a, "Symbian"]], [/mozilla\/[\d\.]+ \((?:mobile|tablet|tv|mobile; [\w ]+); rv:.+ gecko\/([\w\.]+)/i], [c, [a, J + " OS"]], [/web0s;.+rt(tv)/i, /\b(?:hp)?wos(?:browser)?\/([\w\.]+)/i], [c, [a, "webOS"]], [/crkey\/([\d\.]+)/i], [c, [a, K + "cast"]], [/(cros) [\w]+ ([\w\.]+\w)/i], [[a, "Chromium OS"], c], [/(nintendo|playstation) ([wids345portablevuch]+)/i, /(xbox); +xbox ([^\);]+)/i, /\b(joli|palm)\b ?(?:os)?\/?([\w\.]*)/i, /(mint)[\/\(\) ]?(\w*)/i, /(mageia|vectorlinux)[; ]/i, /([kxln]?ubuntu|debian|suse|opensuse|gentoo|arch(?= linux)|slackware|fedora|mandriva|centos|pclinuxos|red ?hat|zenwalk|linpus|raspbian|plan 9|minix|risc os|contiki|deepin|manjaro|elementary os|sabayon|linspire)(?: gnu\/linux)?(?: enterprise)?(?:[- ]linux)?(?:-gnu)?[-\/ ]?(?!chrom|package)([-\w\.]*)/i, /(hurd|linux) ?([\w\.]*)/i, /(gnu) ?([\w\.]*)/i, /\b([-frentopcghs]{0,5}bsd|dragonfly)[\/ ]?(?!amd|[ix346]{1,2}86)([\w\.]*)/i, /(haiku) (\w+)/i], [a, c], [/(sunos) ?([\w\.\d]*)/i], [[a, "Solaris"], c], [/((?:open)?solaris)[-\/ ]?([\w\.]*)/i, /(aix) ((\d)(?=\.|\)| )[\w\.])*/i, /\b(beos|os\/2|amigaos|morphos|openvms|fuchsia|hp-ux)/i, /(unix) ?([\w\.]*)/i], [a, c]]
        }
          , $ = function (_, x) {
          if (typeof _ === f && (x = _,
            _ = o),
            !(this instanceof $))
            return new $(_, x).getResult();
          var y = _ || (typeof n !== w && n.navigator && n.navigator.userAgent ? n.navigator.userAgent : b)
            , S = x ? rt(Ie, x) : Ie;
          return this.getBrowser = function () {
            var v = {};
            return v[a] = o,
              v[c] = o,
              W.call(v, y, S.browser),
              v.major = ot(v.version),
              v
          }
            ,
            this.getCPU = function () {
              var v = {};
              return v[E] = o,
                W.call(v, y, S.cpu),
                v
            }
            ,
            this.getDevice = function () {
              var v = {};
              return v[s] = o,
                v[i] = o,
                v[r] = o,
                W.call(v, y, S.device),
                v
            }
            ,
            this.getEngine = function () {
              var v = {};
              return v[a] = o,
                v[c] = o,
                W.call(v, y, S.engine),
                v
            }
            ,
            this.getOS = function () {
              var v = {};
              return v[a] = o,
                v[c] = o,
                W.call(v, y, S.os),
                v
            }
            ,
            this.getResult = function () {
              return {
                ua: this.getUA(),
                browser: this.getBrowser(),
                engine: this.getEngine(),
                os: this.getOS(),
                device: this.getDevice(),
                cpu: this.getCPU()
              }
            }
            ,
            this.getUA = function () {
              return y
            }
            ,
            this.setUA = function (v) {
              return y = typeof v === g && v.length > N ? _e(v, N) : v,
                this
            }
            ,
            this.setUA(y),
            this
        };
        $.VERSION = l,
          $.BROWSER = te([a, c, h]),
          $.CPU = te([E]),
          $.DEVICE = te([i, s, r, A, p, T, m, k, M]),
          $.ENGINE = $.OS = te([a, c]),
        e.exports && (t = e.exports = $),
          t.UAParser = $;
        var L = typeof n !== w && (n.jQuery || n.Zepto);
        if (L && !L.ua) {
          var ie = new $;
          L.ua = ie.getResult(),
            L.ua.get = function () {
              return ie.getUA()
            }
            ,
            L.ua.set = function (_) {
              ie.setUA(_);
              var x = ie.getResult();
              for (var y in x)
                L.ua[y] = x[y]
            }
        }
      }
    )(typeof window == "object" ? window : Nt)
  }
)(Ye, Ye.exports);
exports.$ = Ye;
exports.A = Ht;
exports.B = Gt;
exports.C = Dt;
exports.D = Lt;
exports.E = Qe;
exports.F = Yt;
exports.G = li;
exports.H = Et;
exports.I = ei;
exports.J = Ot;
exports.K = ci;
exports.L = Qt;
exports.M = ti;
exports.N = ii;
exports.O = hi;
exports.P = Bt;
exports.Q = Pt;
exports.R = jt;
exports.S = fi;
exports.T = zt;
exports.U = wi;
exports.V = di;
exports.W = qt;
exports.X = Kt;
exports.Y = Rt;
exports.Z = Tt;
exports._ = Zt;
exports.a = It;
exports.a0 = ai;
exports.a1 = si;
exports.a2 = ri;
exports.a3 = oi;
exports.b = Wt;
exports.c = Ut;
exports.d = ut;
exports.e = wt;
exports.f = dt;
exports.g = $t;
exports.h = pi;
exports.i = ui;
exports.j = Vt;
exports.k = kt;
exports.l = Ft;
exports.m = xt;
exports.n = R;
exports.o = $e;
exports.p = Ct;
exports.q = Jt;
exports.r = j;
exports.s = ct;
exports.t = tt;
exports.u = bi;
exports.v = We;
exports.w = Mt;
exports.x = Xt;
exports.y = V;
exports.z = ni;
