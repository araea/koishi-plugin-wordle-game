var El = Object.defineProperty
  , Cl = Object.defineProperties;
var Tl = Object.getOwnPropertyDescriptors;
var an = Object.getOwnPropertySymbols;
var Il = Object.prototype.hasOwnProperty
  , Ml = Object.prototype.propertyIsEnumerable;
var Nt = (n, e, t) => e in n ? El(n, e, {
  enumerable: !0,
  configurable: !0,
  writable: !0,
  value: t
}) : n[e] = t
  , Me = (n, e) => {
  for (var t in e || (e = {}))
    Il.call(e, t) && Nt(n, t, e[t]);
  if (an)
    for (var t of an(e))
      Ml.call(e, t) && Nt(n, t, e[t]);
  return n
}
  , ze = (n, e) => Cl(n, Tl(e));
var Gt = (n, e, t) => (Nt(n, typeof e != "symbol" ? e + "" : e, t),
  t);
import {
  S as se,
  i as oe,
  s as re,
  e as _,
  a as R,
  b as h,
  c as g,
  d as m,
  l as J,
  n as B,
  f as b,
  r as tt,
  w as sl,
  g as je,
  h as ol,
  j as dt,
  k as be,
  t as M,
  m as we,
  o as C,
  p as me,
  q as nt,
  u as Rl,
  v as V,
  x as U,
  y as Fe,
  z as Be,
  A as At,
  B as cn,
  C as Ae,
  D as Qe,
  E as G,
  F as Ce,
  G as D,
  H as j,
  I as ie,
  J as N,
  K as ue,
  L as yt,
  M as Kt,
  N as rl,
  O as Al,
  P as Re,
  Q as ut,
  R as ft,
  T as at,
  U as Pt,
  V as vt,
  W as ct,
  X as il,
  Y as dn,
  Z as Pl,
  _ as hn,
  $ as Ll,
  a0 as zl,
  a1 as Ol,
  a2 as Ht,
  a3 as Ut
} from "./vendor.js";
// const Bl = function() {
//   const e = document.createElement("link").relList;
//   if (e && e.supports && e.supports("modulepreload"))
//     return;
//   for (const s of document.querySelectorAll('link[rel="modulepreload"]'))
//     l(s);
//   new MutationObserver(s=>{
//       for (const r of s)
//         if (r.type === "childList")
//           for (const o of r.addedNodes)
//             o.tagName === "LINK" && o.rel === "modulepreload" && l(o)
//     }
//   ).observe(document, {
//     childList: !0,
//     subtree: !0
//   });
//   function t(s) {
//     const r = {};
//     return s.integrity && (r.integrity = s.integrity),
//     s.referrerpolicy && (r.referrerPolicy = s.referrerpolicy),
//       s.crossorigin === "use-credentials" ? r.credentials = "include" : s.crossorigin === "anonymous" ? r.credentials = "omit" : r.credentials = "same-origin",
//       r
//   }
//   function l(s) {
//     if (s.ep)
//       return;
//     s.ep = !0;
//     const r = t(s);
//     fetch(s.href, r)
//   }
// };
// Bl();
function Dl(n) {
  let e, t, l, s, r, o, i, u, a, f, c, d, p, w;
  return {
    c() {
      e = _("header"),
        t = _("div"),
        l = _("button"),
        l.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
        s = R(),
        r = _("button"),
        r.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>',
        o = R(),
        i = _("div"),
        i.textContent = "\u8BCD\u5F71",
        u = R(),
        a = _("div"),
        f = _("button"),
        f.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>',
        c = R(),
        d = _("button"),
        d.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>',
        h(l, "class", "px-1"),
        h(r, "class", "px-1"),
        h(t, "class", "flex w-16 items-center justify-start"),
        h(i, "class", "text-center font-serif text-3xl"),
        h(f, "class", "px-1"),
        h(d, "class", "px-1"),
        h(a, "class", "flex w-16 items-center justify-end"),
        h(e, "class", "flex h-16 flex-nowrap items-center justify-between border-b border-neutral-300 px-4 dark:border-neutral-700")
    },
    m($, k) {
      g($, e, k),
        m(e, t),
        m(t, l),
        m(t, s),
        m(t, r),
        m(e, o),
        m(e, i),
        m(e, u),
        m(e, a),
        m(a, f),
        m(a, c),
        m(a, d),
      p || (w = [J(l, "click", n[4]), J(r, "click", n[5]), J(f, "click", n[6]), J(d, "click", n[7])],
        p = !0)
    },
    p: B,
    i: B,
    o: B,
    d($) {
      $ && b(e),
        p = !1,
        tt(w)
    }
  }
}

function jl(n, e, t) {
  let {openHelp: l} = e
    , {openStatistics: s} = e
    , {openSettings: r} = e
    , {openSelfPublishing: o} = e;
  const i = () => t(0, l = !0)
    , u = () => t(3, o = !0)
    , a = () => t(1, s = !0)
    , f = () => t(2, r = !0);
  return n.$$set = c => {
    "openHelp" in c && t(0, l = c.openHelp),
    "openStatistics" in c && t(1, s = c.openStatistics),
    "openSettings" in c && t(2, r = c.openSettings),
    "openSelfPublishing" in c && t(3, o = c.openSelfPublishing)
  }
    ,
    [l, s, r, o, i, u, a, f]
}

class Nl extends se {
  constructor(e) {
    super();
    oe(this, e, jl, Dl, re, {
      openHelp: 0,
      openStatistics: 1,
      openSettings: 2,
      openSelfPublishing: 3
    })
  }
}

var le = (n => (n.IN_PROGRESS = "IN_PROGRESS",
  n.WIN = "WIN",
  n.FAIL = "FAIL",
  n))(le || {});

function ul(n) {
  return Math.floor((n - fl) / al) + 1
}

function lt(n) {
  return new Promise(e => setTimeout(e, n))
}

const Gl = "1.1.2"
  , ce = 4
  , Ne = 6
  , fl = Date.parse("2022-03-20T00:00:00")
  , al = 864e5
  , Vt = ul(Date.now())
  , Ye = 10
  , Lt = sl(new Array(Ne).fill(!1).map(() => new Array(ce).fill(!1).map(() => ({
  shadows: [],
  match: !1,
  percent: 0
}))));
// function Et(n, e) {
//   const t = sl(n in localStorage ? JSON.parse(localStorage[n]) : e);
//   return ze(Me({}, t), {
//     commit: ()=>{
//       localStorage[n] = JSON.stringify(je(t))
//     }
//   })
// }
var Hl =""

class Ul {
  constructor(e) {
    Gt(this, "graphics");
    Gt(this, "callbacks", []);
    this.char = e,
      this.load()
  }

  async load() {
    try {
      const l = await (await fetch(`/graphics/${this.char}.json`)).json();
      this.graphics = l,
        this.callbacks.forEach(s => s(l)),
        this.callbacks = []
    } catch {
      setTimeout(() => this.load(), 1e3)
    }
  }

  get() {
    return this.graphics === void 0 ? new Promise(e => this.callbacks.push(e)) : Promise.resolve(this.graphics)
  }
}

const pn = new Map;

function We(n) {
  // if (!n || !Hl.includes(n))
  //   return;
  let e = pn.get(n);
  return e === void 0 && (e = new Ul(n),
    pn.set(n, e)),
    e
}

function Wl(n) {
  const e = new Uint16Array(n.length);
  for (let s = 0; s < e.length; s++)
    e[s] = n.charCodeAt(s);
  const t = new Uint8Array(e.buffer);
  let l = "";
  for (let s = 0; s < t.byteLength; s++)
    l += String.fromCharCode(t[s]);
  return l
}

function ql(n) {
  const e = new Uint8Array(n.length);
  for (let s = 0; s < e.length; s++)
    e[s] = n.charCodeAt(s);
  const t = new Uint16Array(e.buffer);
  let l = "";
  for (let s = 0; s < t.length; s++)
    l += String.fromCharCode(t[s]);
  return l
}

function cl(n) {
  const e = n.split("").map(t => {
      var l;
      return (l = We(t)) == null ? void 0 : l.get()
    }
  );
  return n.length === ce && e.filter(t => t !== void 0).length === ce
}

// function Yl(n, e) {
//   // const t = window.btoa(Wl(n)).replace(/\+/g, "-").replace(/\//g, "_");
//   // return new URL(`?s=${t}${e ? "&h" : ""}`,window.location.href).href
// }
// function Fl() {
//   var n;
//   try {
//     // let e = (n = new URLSearchParams(window.location.search).get("s")) != null ? n : void 0;
//     return e && (e = ql(window.atob(e.replace(/-/g, "+").replace(/_/g, "/"))),
//       !cl(e)) ? void 0 : e
//   } catch (e) {
//     console.error(`Failed to decode self publish link because of ${e}`);
//     return
//   }
// }
// function Ql() {
//   try {
//     return new URLSearchParams(window.location.search).has("h")
//   } catch (n) {
//     console.error(`Failed to decode hard mode because of ${n}`);
//     return
//   }
// }
// const gt = Ql()
//   const he = Fl();
export function Kl(isHardMode) {
  const n = {
    boardState: new Array(Ne).fill(!1).map(() => new Array(ce).fill(!1).map(() => "")),
    rowIndex: 0,
    solution: "",
    gameStatus: le.IN_PROGRESS,
    lastPlayedTs: null,
    lastCompletedTs: null,
    hardMode: isHardMode,
    dailyConsumedQuota: 0
  };
  // let e = ze(Me({}, n), {
  //   updateSolution: function (t) {
  //     this.update(l => ze(Me({}, l), {
  //       boardState: new Array(Ne).fill(!1).map(() => new Array(ce).fill(!1).map(() => "")),
  //       rowIndex: 0,
  //       solution: t,
  //       gameStatus: le.IN_PROGRESS,
  //       lastPlayedTs: null
  //     }))
  //   }
  // });
  return n
  // he && (
  //   e = ze(Me({}, e), {
  //     commit: ()=>{}
  //   }),
  // gt !== void 0 && e.update(t=>ze(Me({}, t), {
  //   hardMode: gt != null ? gt : !1
  // }))),

}

export const ae = Kl()
  , Vl = {
  keepShadow: !0,
  correctThreshold: .5,
  presentThreshold: 1,
  shiftFactor: .7,
  idiomLimit: 2e3
}
  , Xl = {
  keepShadow: !1,
  correctThreshold: .3,
  presentThreshold: 1,
  shiftFactor: .7
}
  , Ct = ol(ae, n => n.hardMode ? Xl : Vl);

function mn(n, e, t) {
  const l = n.slice();
  return l[26] = e[t].stroke,
    l[27] = e[t].distance,
    l[28] = e[t].shiftX,
    l[29] = e[t].shiftY,
    l
}

function Zl(n) {
  let e, t, l, s, r, o;

  function i(f, c) {
    return f[5] ? es : xl
  }

  let u = i(n)
    , a = u(n);
  return {
    c() {
      e = _("button"),
        t = _("div"),
        a.c(),
        h(t, "class", "flex h-16 w-16 items-center justify-center border-neutral-400 dark:border-neutral-600"),
        U(t, "border-2", !n[6] || !n[2].match),
        U(t, "bg-correct", n[6] && n[2].match),
        h(e, "class", "transition-transform betterhover:hover:scale-y-90")
    },
    m(f, c) {
      g(f, e, c),
        m(e, t),
        a.m(t, null),
        s = !0,
      r || (o = [J(t, "outroend", n[23]), J(e, "click", n[24])],
        r = !0)
    },
    p(f, c) {
      u === (u = i(f)) && a ? a.p(f, c) : (a.d(1),
        a = u(f),
      a && (a.c(),
        a.m(t, null))),
      c[0] & 68 && U(t, "border-2", !f[6] || !f[2].match),
      c[0] & 68 && U(t, "bg-correct", f[6] && f[2].match)
    },
    i(f) {
      s || (f && Fe(() => {
          l || (l = Be(t, n[11], {}, !0)),
            l.run(1)
        }
      ),
        s = !0)
    },
    o(f) {
      f && (l || (l = Be(t, n[11], {}, !1)),
        l.run(0)),
        s = !1
    },
    d(f) {
      f && b(e),
        a.d(),
      f && l && l.end(),
        r = !1,
        tt(o)
    }
  }
}

function Jl(n) {
  let e, t, l, s, r, o;
  return {
    c() {
      e = _("input"),
        h(e, "enterkeyhint", "done"),
        e.disabled = t = !n[3],
        h(e, "class", "h-16 w-16 border-2 bg-transparent text-center font-serif text-5xl"),
        h(e, "placeholder", n[4]),
        U(e, "border-neutral-300", n[0] === ""),
        U(e, "border-neutral-400", n[0] !== ""),
        U(e, "border-neutral-500", n[0] === "" && n[3]),
        U(e, "border-neutral-600", n[0] !== "" && n[3]),
        U(e, "dark:border-neutral-700", n[0] === ""),
        U(e, "dark:border-neutral-600", n[0] !== ""),
        U(e, "dark:border-neutral-500", n[0] === "" && n[3]),
        U(e, "dark:border-neutral-400", n[0] !== "" && n[3])
    },
    m(i, u) {
      g(i, e, u),
        n[18](e),
        At(e, n[0]),
        s = !0,
      r || (o = [J(e, "input", n[19]), J(e, "input", cn(n[12])), J(e, "paste", cn(n[13])), J(e, "keydown", n[14]), J(e, "compositionstart", n[20]), J(e, "compositionend", n[21]), J(e, "outroend", n[22])],
        r = !0)
    },
    p(i, u) {
      (!s || u[0] & 8 && t !== (t = !i[3])) && (e.disabled = t),
      (!s || u[0] & 16) && h(e, "placeholder", i[4]),
      u[0] & 1 && e.value !== i[0] && At(e, i[0]),
      u[0] & 1 && U(e, "border-neutral-300", i[0] === ""),
      u[0] & 1 && U(e, "border-neutral-400", i[0] !== ""),
      u[0] & 9 && U(e, "border-neutral-500", i[0] === "" && i[3]),
      u[0] & 9 && U(e, "border-neutral-600", i[0] !== "" && i[3]),
      u[0] & 1 && U(e, "dark:border-neutral-700", i[0] === ""),
      u[0] & 1 && U(e, "dark:border-neutral-600", i[0] !== ""),
      u[0] & 9 && U(e, "dark:border-neutral-500", i[0] === "" && i[3]),
      u[0] & 9 && U(e, "dark:border-neutral-400", i[0] !== "" && i[3])
    },
    i(i) {
      s || (i && Fe(() => {
          l || (l = Be(e, n[11], {}, !0)),
            l.run(1)
        }
      ),
        s = !0)
    },
    o(i) {
      i && (l || (l = Be(e, n[11], {}, !1)),
        l.run(0)),
        s = !1
    },
    d(i) {
      i && b(e),
        n[18](null),
      i && l && l.end(),
        r = !1,
        tt(o)
    }
  }
}

function xl(n) {
  let e, t, l = n[2].shadows, s = [];
  for (let r = 0; r < l.length; r += 1)
    s[r] = _n(mn(n, l, r));
  return {
    c() {
      e = Ae("svg"),
        t = Ae("g");
      for (let r = 0; r < s.length; r += 1)
        s[r].c();
      h(t, "transform", "scale(1, -1) translate(0, -900)"),
        h(e, "viewBox", "0 0 1024 1024"),
        h(e, "class", "h-12 w-12")
    },
    m(r, o) {
      g(r, e, o),
        m(e, t);
      for (let i = 0; i < s.length; i += 1)
        s[i].m(t, null)
    },
    p(r, o) {
      if (o[0] & 1028) {
        l = r[2].shadows;
        let i;
        for (i = 0; i < l.length; i += 1) {
          const u = mn(r, l, i);
          s[i] ? s[i].p(u, o) : (s[i] = _n(u),
            s[i].c(),
            s[i].m(t, null))
        }
        for (; i < s.length; i += 1)
          s[i].d(1);
        s.length = l.length
      }
    },
    d(r) {
      r && b(e),
        Qe(s, r)
    }
  }
}

function es(n) {
  let e, t;
  return {
    c() {
      e = _("div"),
        t = G(n[0]),
        h(e, "class", "flex h-16 w-16 items-center justify-center font-serif text-5xl")
    },
    m(l, s) {
      g(l, e, s),
        m(e, t)
    },
    p(l, s) {
      s[0] & 1 && Ce(t, l[0])
    },
    d(l) {
      l && b(e)
    }
  }
}

function _n(n) {
  let e, t, l, s;
  return {
    c() {
      e = Ae("path"),
        h(e, "d", t = n[26]),
        h(e, "opacity", l = (n[10].presentThreshold - Math.max(n[27], n[10].correctThreshold)) / (n[10].presentThreshold - n[10].correctThreshold)),
        h(e, "transform", s = `translate(${n[28]}, ${n[29]})`),
        U(e, "fill-white", n[2].match),
        U(e, "fill-correct", !n[2].match && n[27] === 0),
        U(e, "dark:fill-white", n[27] > 0)
    },
    m(r, o) {
      g(r, e, o)
    },
    p(r, o) {
      o[0] & 4 && t !== (t = r[26]) && h(e, "d", t),
      o[0] & 1028 && l !== (l = (r[10].presentThreshold - Math.max(r[27], r[10].correctThreshold)) / (r[10].presentThreshold - r[10].correctThreshold)) && h(e, "opacity", l),
      o[0] & 4 && s !== (s = `translate(${r[28]}, ${r[29]})`) && h(e, "transform", s),
      o[0] & 4 && U(e, "fill-white", r[2].match),
      o[0] & 4 && U(e, "fill-correct", !r[2].match && r[27] === 0),
      o[0] & 4 && U(e, "dark:fill-white", r[27] > 0)
    },
    d(r) {
      r && b(e)
    }
  }
}

function ts(n) {
  let e, t, l;
  const s = [Jl, Zl]
    , r = [];

  function o(i, u) {
    return i[1] ? i[5] || i[6] ? 1 : -1 : 0
  }

  return ~(e = o(n)) && (t = r[e] = s[e](n)),
    {
      c() {
        t && t.c(),
          l = dt()
      },
      m(i, u) {
        ~e && r[e].m(i, u),
          g(i, l, u)
      },
      p(i, u) {
        let a = e;
        e = o(i),
          e === a ? ~e && r[e].p(i, u) : (t && (be(),
            M(r[a], 1, 1, () => {
                r[a] = null
              }
            ),
            we()),
            ~e ? (t = r[e],
              t ? t.p(i, u) : (t = r[e] = s[e](i),
                t.c()),
              C(t, 1),
              t.m(l.parentNode, l)) : t = null)
      },
      i(i) {
        C(t)
      },
      o(i) {
        M(t)
      },
      d(i) {
        ~e && r[e].d(i),
        i && b(l)
      }
    }
}

function ns(n, e, t) {
  let l;
  me(n, Ct, E => t(10, l = E));
  let {text: s} = e, {result: r} = e, {inputEnabled: o} = e, {revealed: i = !1} = e, {placeHolder: u = ""} = e, a = !1,
    f = !1, c = !1, d, p = !1;
  const w = nt();

  function $(E, {duration: O = 250}) {
    return {
      duration: O,
      easing: Rl,
      css: K => `transform: scaleY(${K});`
    }
  }

  function k(E) {
    p || w("inputChange", {
      data: E.data || ""
    })
  }

  function y(E) {
    var K;
    const O = (K = E.clipboardData) == null ? void 0 : K.getData("text/plain");
    O !== null && w("inputChange", {
      data: O
    })
  }

  function A(E) {
    const O = E.key;
    if (!(E.altKey || E.ctrlKey || E.metaKey || E.shiftKey))
      switch (O) {
        case "Backspace":
          s.length === 0 ? w("inputBackspace") : d.selectionStart === 0 && w("inputArrowLeft");
          break;
        case "ArrowLeft":
          d.selectionStart === 0 && (w("inputArrowLeft"),
            E.preventDefault());
          break;
        case "ArrowRight":
          d.selectionEnd === s.length && (w("inputArrowRight"),
            E.preventDefault());
          break;
        case "Enter":
          w("submit"),
            E.preventDefault();
          break
      }
  }

  function I() {
    t(8, d.disabled = !1, d),
      d.focus()
  }

  function L() {
    t(8, d.disabled = !0, d),
      d.blur()
  }

  function Y() {
    t(1, i = !0)
  }

  function z(E) {
    V[E ? "unshift" : "push"](() => {
        d = E,
          t(8, d)
      }
    )
  }

  function H() {
    s = this.value,
      t(0, s)
  }

  const X = () => {
      t(9, p = !0)
    }
    , x = E => {
      t(9, p = !1),
        k(E)
    }
    , ee = () => t(6, f = !0)
    , Z = () => c ? t(5, a = !0) : t(6, f = !0)
    , pe = () => {
      t(7, c = f),
        t(5, a = !1),
        t(6, f = !1)
    }
  ;
  return n.$$set = E => {
    "text" in E && t(0, s = E.text),
    "result" in E && t(2, r = E.result),
    "inputEnabled" in E && t(3, o = E.inputEnabled),
    "revealed" in E && t(1, i = E.revealed),
    "placeHolder" in E && t(4, u = E.placeHolder)
  }
    ,
    [s, i, r, o, u, a, f, c, d, p, l, $, k, y, A, I, L, Y, z, H, X, x, ee, Z, pe]
}

class Ze extends se {
  constructor(e) {
    super();
    oe(this, e, ns, ts, re, {
      text: 0,
      result: 2,
      inputEnabled: 3,
      revealed: 1,
      placeHolder: 4,
      focus: 15,
      blur: 16,
      reveal: 17
    }, null, [-1, -1])
  }

  get focus() {
    return this.$$.ctx[15]
  }

  get blur() {
    return this.$$.ctx[16]
  }

  get reveal() {
    return this.$$.ctx[17]
  }
}

function gn(n, e, t) {
  const l = n.slice();
  return l[19] = e[t],
    l[20] = e,
    l[21] = t,
    l
}

function bn(n) {
  let e, t = n[21], l, s;
  const r = () => n[11](e, t)
    , o = () => n[11](null, t);

  function i(p) {
    n[12](p, n[21])
  }

  function u(...p) {
    return n[13](n[21], ...p)
  }

  function a() {
    return n[14](n[21])
  }

  function f() {
    return n[15](n[21])
  }

  function c() {
    return n[16](n[21])
  }

  let d = {
    result: n[1][n[21]],
    inputEnabled: n[2]
  };
  return n[0][n[21]] !== void 0 && (d.text = n[0][n[21]]),
    e = new Ze({
      props: d
    }),
    r(),
    V.push(() => ue(e, "text", i)),
    e.$on("inputChange", u),
    e.$on("inputBackspace", a),
    e.$on("inputArrowLeft", f),
    e.$on("inputArrowRight", c),
    e.$on("submit", n[17]),
    {
      c() {
        D(e.$$.fragment)
      },
      m(p, w) {
        j(e, p, w),
          s = !0
      },
      p(p, w) {
        n = p,
        t !== n[21] && (o(),
          t = n[21],
          r());
        const $ = {};
        w & 2 && ($.result = n[1][n[21]]),
        w & 4 && ($.inputEnabled = n[2]),
        !l && w & 1 && (l = !0,
          $.text = n[0][n[21]],
          ie(() => l = !1)),
          e.$set($)
      },
      i(p) {
        s || (C(e.$$.fragment, p),
          s = !0)
      },
      o(p) {
        M(e.$$.fragment, p),
          s = !1
      },
      d(p) {
        o(),
          N(e, p)
      }
    }
}

function ls(n) {
  let e, t, l, s, r = Array(ce), o = [];
  for (let u = 0; u < r.length; u += 1)
    o[u] = bn(gn(n, r, u));
  const i = u => M(o[u], 1, 1, () => {
      o[u] = null
    }
  );
  return {
    c() {
      e = _("div");
      for (let u = 0; u < o.length; u += 1)
        o[u].c();
      h(e, "class", "grid grid-cols-4 justify-items-center gap-1 svelte-n2hnfv"),
        U(e, "shaking", n[4])
    },
    m(u, a) {
      g(u, e, a);
      for (let f = 0; f < o.length; f += 1)
        o[f].m(e, null);
      t = !0,
      l || (s = J(e, "animationend", n[18]),
        l = !0)
    },
    p(u, [a]) {
      if (a & 239) {
        r = Array(ce);
        let f;
        for (f = 0; f < r.length; f += 1) {
          const c = gn(u, r, f);
          o[f] ? (o[f].p(c, a),
            C(o[f], 1)) : (o[f] = bn(c),
            o[f].c(),
            C(o[f], 1),
            o[f].m(e, null))
        }
        for (be(),
               f = r.length; f < o.length; f += 1)
          i(f);
        we()
      }
      a & 16 && U(e, "shaking", u[4])
    },
    i(u) {
      if (!t) {
        for (let a = 0; a < r.length; a += 1)
          C(o[a]);
        t = !0
      }
    },
    o(u) {
      o = o.filter(Boolean);
      for (let a = 0; a < o.length; a += 1)
        M(o[a]);
      t = !1
    },
    d(u) {
      u && b(e),
        Qe(o, u),
        l = !1,
        s()
    }
  }
}

function ss(n, e, t) {
  let {text: l} = e
    , {results: s} = e
    , {inputEnabled: r = !1} = e
    , o = []
    , i = !1;

  function u(z) {
    return o[z]
  }

  function a(z, H) {
    const X = z.split("").filter(Z => We(Z) !== void 0)
      , x = Math.min(ce - 1, X.length + H)
      , ee = Array(ce).fill("");
    for (let Z = 0; Z < ce; Z += 1)
      ee[Z] = l[Z],
      H + X.length > Z && Z >= H && (ee[Z] = X[Z - H]);
    t(0, l = ee),
      o[x].focus()
  }

  function f(z) {
    l[z] === " " && t(0, l[z] = "", l),
    l[z] === "" && o[Math.max(0, z - 1)].focus(),
      t(0, l[z] = "", l)
  }

  function c(z, H) {
    const X = Math.max(0, Math.min(ce - 1, z + H));
    o[X].focus()
  }

  function d() {
    t(4, i = !0)
  }

  function p(z) {
    for (let H = 0; H < ce; H += 1)
      setTimeout(() => {
          var X;
          (X = o[H]) == null || X.reveal()
        }
        , z * H)
  }

  function w(z, H) {
    V[z ? "unshift" : "push"](() => {
        o[H] = z,
          t(3, o)
      }
    )
  }

  function $(z, H) {
    n.$$.not_equal(l[H], z) && (l[H] = z,
      t(0, l))
  }

  const k = (z, {detail: H}) => a(H.data, z)
    , y = z => f(z)
    , A = z => c(z, -1)
    , I = z => c(z, 1);

  function L(z) {
    yt.call(this, n, z)
  }

  const Y = () => t(4, i = !1);
  return n.$$set = z => {
    "text" in z && t(0, l = z.text),
    "results" in z && t(1, s = z.results),
    "inputEnabled" in z && t(2, r = z.inputEnabled)
  }
    ,
    [l, s, r, o, i, a, f, c, u, d, p, w, $, k, y, A, I, L, Y]
}

class Xt extends se {
  constructor(e) {
    super();
    oe(this, e, ss, ls, re, {
      text: 0,
      results: 1,
      inputEnabled: 2,
      getTile: 8,
      shake: 9,
      reveal: 10
    })
  }

  get getTile() {
    return this.$$.ctx[8]
  }

  get shake() {
    return this.$$.ctx[9]
  }

  get reveal() {
    return this.$$.ctx[10]
  }
}

function wn(n, e, t) {
  const l = n.slice();
  return l[13] = e[t],
    l[14] = e,
    l[15] = t,
    l
}

function vn(n) {
  let e, t, l, s, r, o, i, u, a, f, c, d;
  return {
    c() {
      e = _("button"),
        t = _("div"),
        l = _("div"),
        l.textContent = "\u63D0\u4EA4",
        s = R(),
        r = Ae("svg"),
        o = Ae("path"),
        h(l, "class", "whitespace-nowrap text-xl transition-opacity duration-300"),
        U(l, "opacity-0", !n[3]),
        h(o, "stroke-linecap", "round"),
        h(o, "stroke-linejoin", "round"),
        h(o, "d", "M19 9l-7 7-7-7"),
        h(r, "xmlns", "http://www.w3.org/2000/svg"),
        h(r, "class", "h-6 w-12 animate-bounce"),
        h(r, "fill", "none"),
        h(r, "viewBox", "0 6 24 12"),
        h(r, "stroke", "currentColor"),
        h(r, "stroke-width", "1"),
        h(t, "class", "transition duration-300"),
        U(t, "-rotate-90", !n[3]),
        U(t, "text-correct", n[3]),
        h(e, "class", "absolute right-full"),
        e.disabled = i = !n[3]
    },
    m(p, w) {
      g(p, e, w),
        m(e, t),
        m(t, l),
        m(t, s),
        m(t, r),
        m(r, o),
        f = !0,
      c || (d = J(e, "click", n[12]),
        c = !0)
    },
    p(p, w) {
      w & 8 && U(l, "opacity-0", !p[3]),
      w & 8 && U(t, "-rotate-90", !p[3]),
      w & 8 && U(t, "text-correct", p[3]),
      (!f || w & 8 && i !== (i = !p[3])) && (e.disabled = i)
    },
    i(p) {
      f || (Fe(() => {
          a && a.end(1),
            u = Kt(e, n[7], {
              key: "before"
            }),
            u.start()
        }
      ),
        f = !0)
    },
    o(p) {
      u && u.invalidate(),
        a = rl(e, n[6], {
          key: "before"
        }),
        f = !1
    },
    d(p) {
      p && b(e),
      p && a && a.end(),
        c = !1,
        d()
    }
  }
}

function kn(n) {
  let e, t, l = n[15], s, r, o, i;
  const u = () => n[9](t, l)
    , a = () => n[9](null, l);

  function f(p) {
    n[10](p, n[15])
  }

  let c = {
    results: n[4][n[15]],
    inputEnabled: n[0] && n[1].rowIndex === n[15]
  };
  n[1].boardState[n[15]] !== void 0 && (c.text = n[1].boardState[n[15]]),
    t = new Xt({
      props: c
    }),
    u(),
    V.push(() => ue(t, "text", f)),
    t.$on("submit", n[11]);
  let d = n[1].rowIndex === n[15] && n[1].gameStatus === le.IN_PROGRESS && vn(n);
  return {
    c() {
      e = _("div"),
        D(t.$$.fragment),
        r = R(),
      d && d.c(),
        o = R(),
        h(e, "class", "relative flex items-center")
    },
    m(p, w) {
      g(p, e, w),
        j(t, e, null),
        m(e, r),
      d && d.m(e, null),
        m(e, o),
        i = !0
    },
    p(p, w) {
      n = p,
      l !== n[15] && (a(),
        l = n[15],
        u());
      const $ = {};
      w & 16 && ($.results = n[4][n[15]]),
      w & 3 && ($.inputEnabled = n[0] && n[1].rowIndex === n[15]),
      !s && w & 2 && (s = !0,
        $.text = n[1].boardState[n[15]],
        ie(() => s = !1)),
        t.$set($),
        n[1].rowIndex === n[15] && n[1].gameStatus === le.IN_PROGRESS ? d ? (d.p(n, w),
        w & 2 && C(d, 1)) : (d = vn(n),
          d.c(),
          C(d, 1),
          d.m(e, o)) : d && (be(),
          M(d, 1, 1, () => {
              d = null
            }
          ),
          we())
    },
    i(p) {
      i || (C(t.$$.fragment, p),
        C(d),
        i = !0)
    },
    o(p) {
      M(t.$$.fragment, p),
        M(d),
        i = !1
    },
    d(p) {
      p && b(e),
        a(),
        N(t),
      d && d.d()
    }
  }
}

function os(n) {
  let e, t, l = Array(Ne), s = [];
  for (let o = 0; o < l.length; o += 1)
    s[o] = kn(wn(n, l, o));
  const r = o => M(s[o], 1, 1, () => {
      s[o] = null
    }
  );
  return {
    c() {
      e = _("div");
      for (let o = 0; o < s.length; o += 1)
        s[o].c();
      h(e, "class", "grid grid-rows-5 gap-1 py-2")
    },
    m(o, i) {
      g(o, e, i);
      for (let u = 0; u < s.length; u += 1)
        s[u].m(e, null);
      t = !0
    },
    p(o, [i]) {
      if (i & 63) {
        l = Array(Ne);
        let u;
        for (u = 0; u < l.length; u += 1) {
          const a = wn(o, l, u);
          s[u] ? (s[u].p(a, i),
            C(s[u], 1)) : (s[u] = kn(a),
            s[u].c(),
            C(s[u], 1),
            s[u].m(e, null))
        }
        for (be(),
               u = l.length; u < s.length; u += 1)
          r(u);
        we()
      }
    },
    i(o) {
      if (!t) {
        for (let i = 0; i < l.length; i += 1)
          C(s[i]);
        t = !0
      }
    },
    o(o) {
      s = s.filter(Boolean);
      for (let i = 0; i < s.length; i += 1)
        M(s[i]);
      t = !1
    },
    d(o) {
      o && b(e),
        Qe(s, o)
    }
  }
}

function rs(n, e, t) {
  let l, s, r;
  me(n, ae, k => t(1, s = k)),
    me(n, Lt, k => t(4, r = k));
  let {inputEnabled: o} = e
    , i = [];
  const u = nt()
    , [a, f] = Al({});

  function c(k) {
    return i[k]
  }

  function d(k, y) {
    V[k ? "unshift" : "push"](() => {
        i[y] = k,
          t(2, i)
      }
    )
  }

  function p(k, y) {
    n.$$.not_equal(s.boardState[y], k) && (s.boardState[y] = k,
      ae.set(s))
  }

  function w(k) {
    yt.call(this, n, k)
  }

  const $ = () => u("submit");
  return n.$$set = k => {
    "inputEnabled" in k && t(0, o = k.inputEnabled)
  }
    ,
    n.$$.update = () => {
      n.$$.dirty & 3 && t(3, l = o && s.boardState[s.rowIndex].every(k => k !== ""))
    }
    ,
    [o, s, i, l, r, u, a, f, c, d, p, w, $]
}

class is extends se {
  constructor(e) {
    super();
    oe(this, e, rs, os, re, {
      inputEnabled: 0,
      getRow: 8
    })
  }

  get getRow() {
    return this.$$.ctx[8]
  }
}

function us(n) {
  let e, t, l, s, r, o, i, u, a;
  return {
    c() {
      e = _("div"),
        t = _("input"),
        s = R(),
        r = _("button"),
        o = G("\u63D0\u4EA4"),
        h(t, "placeholder", "\u8F93\u5165\u56DB\u4E2A\u5B57..."),
        h(t, "class", "h-14 w-48 rounded border text-center text-xl dark:bg-neutral-900"),
        t.readOnly = l = !n[0],
        h(t, "maxlength", ce),
        h(r, "class", "ml-4 rounded-md bg-correct px-4 font-semibold text-white transition-colors hover:bg-teal-500"),
        r.disabled = i = !n[0],
        h(e, "class", "mb-2 flex justify-center")
    },
    m(f, c) {
      g(f, e, c),
        m(e, t),
        n[7](t),
        At(t, n[1]),
        m(e, s),
        m(e, r),
        m(r, o),
      u || (a = [J(t, "input", n[8]), J(t, "keydown", n[9]), J(r, "click", n[3])],
        u = !0)
    },
    p(f, [c]) {
      c & 1 && l !== (l = !f[0]) && (t.readOnly = l),
      c & 2 && t.value !== f[1] && At(t, f[1]),
      c & 1 && i !== (i = !f[0]) && (r.disabled = i)
    },
    i: B,
    o: B,
    d(f) {
      f && b(e),
        n[7](null),
        u = !1,
        tt(a)
    }
  }
}

function fs(n, e, t) {
  let l;
  me(n, ae, w => t(6, l = w));
  let {inputEnabled: s} = e, r;
  const o = nt();
  let i = ""
    , u = l.rowIndex;

  function a() {
    o("submit")
  }

  function f() {
    r.focus()
  }

  function c(w) {
    V[w ? "unshift" : "push"](() => {
        r = w,
          t(2, r)
      }
    )
  }

  function d() {
    i = this.value,
      t(1, i),
      t(5, u),
      t(6, l)
  }

  const p = w => {
      w.key === "Enter" && (a(),
        w.preventDefault())
    }
  ;
  return n.$$set = w => {
    "inputEnabled" in w && t(0, s = w.inputEnabled)
  }
    ,
    n.$$.update = () => {
      if (n.$$.dirty & 98 && (u !== l.rowIndex && (t(1, i = ""),
        t(5, u = l.rowIndex)),
      u < Ne))
        for (let w = 0; w < ce; w += 1)
          Re(ae, l.boardState[l.rowIndex][w] = i[w] || "", l)
    }
    ,
    [s, i, r, a, f, u, l, c, d, p]
}

class as extends se {
  constructor(e) {
    super();
    oe(this, e, fs, us, re, {
      inputEnabled: 0,
      focus: 4
    })
  }

  get focus() {
    return this.$$.ctx[4]
  }
}

function cs(n) {
  let e;
  return {
    c() {
      e = _("div"),
        e.innerHTML = `<div class="lds-spinner relative mx-auto h-10 w-10 svelte-1048utd"><div class="svelte-1048utd"></div>
    <div class="svelte-1048utd"></div>
    <div class="svelte-1048utd"></div>
    <div class="svelte-1048utd"></div>
    <div class="svelte-1048utd"></div>
    <div class="svelte-1048utd"></div>
    <div class="svelte-1048utd"></div>
    <div class="svelte-1048utd"></div>
    <div class="svelte-1048utd"></div>
    <div class="svelte-1048utd"></div>
    <div class="svelte-1048utd"></div>
    <div class="svelte-1048utd"></div></div>`,
        h(e, "class", "pointer-events-none absolute top-[10%] w-full")
    },
    m(t, l) {
      g(t, e, l)
    },
    p: B,
    i: B,
    o: B,
    d(t) {
      t && b(e)
    }
  }
}

class ds extends se {
  constructor(e) {
    super();
    oe(this, e, null, cs, re, {})
  }
}

const hs = n => ({})
  , $n = n => ({})
  , ps = n => ({})
  , Sn = n => ({});

function yn(n) {
  let e, t, l, s, r, o, i, u, a, f, c, d;
  const p = n[4].header
    , w = ct(p, n, n[3], Sn)
    , $ = w || ms(n)
    , k = n[4].default
    , y = ct(k, n, n[3], null)
    , A = n[4].footer
    , I = ct(A, n, n[3], $n);
  return {
    c() {
      e = _("div"),
        t = _("div"),
        l = _("div"),
        s = _("button"),
        s.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>',
        r = R(),
      $ && $.c(),
        o = R(),
      y && y.c(),
        i = R(),
      I && I.c(),
        h(s, "class", "absolute top-4 right-4 cursor-pointer"),
        h(l, "class", "relative flex max-h-full w-full flex-col items-center rounded-lg bg-white shadow-2xl dark:bg-neutral-900"),
        U(l, "h-full", n[2]),
        U(l, "max-w-md", !n[2]),
        h(t, "class", "flex h-full w-full items-center justify-center"),
        U(t, "p-4", !n[2]),
        h(e, "class", "absolute top-0 left-0 z-20 h-full w-full bg-white bg-opacity-50 dark:bg-black dark:bg-opacity-50")
    },
    m(L, Y) {
      g(L, e, Y),
        m(e, t),
        m(t, l),
        m(l, s),
        m(l, r),
      $ && $.m(l, null),
        m(l, o),
      y && y.m(l, null),
        m(l, i),
      I && I.m(l, null),
        f = !0,
      c || (d = [J(s, "click", n[5]), J(l, "click", gs), J(e, "click", n[6])],
        c = !0)
    },
    p(L, Y) {
      w ? w.p && (!f || Y & 8) && ut(w, p, L, L[3], f ? at(p, L[3], Y, ps) : ft(L[3]), Sn) : $ && $.p && (!f || Y & 2) && $.p(L, f ? Y : -1),
      y && y.p && (!f || Y & 8) && ut(y, k, L, L[3], f ? at(k, L[3], Y, null) : ft(L[3]), null),
      I && I.p && (!f || Y & 8) && ut(I, A, L, L[3], f ? at(A, L[3], Y, hs) : ft(L[3]), $n),
      Y & 4 && U(l, "h-full", L[2]),
      Y & 4 && U(l, "max-w-md", !L[2]),
      Y & 4 && U(t, "p-4", !L[2])
    },
    i(L) {
      f || (C($, L),
        C(y, L),
        C(I, L),
        Fe(() => {
            u || (u = Be(l, Pt, {
              y: 100,
              duration: 200
            }, !0)),
              u.run(1)
          }
        ),
        Fe(() => {
            a || (a = Be(e, vt, {
              duration: 200
            }, !0)),
              a.run(1)
          }
        ),
        f = !0)
    },
    o(L) {
      M($, L),
        M(y, L),
        M(I, L),
      u || (u = Be(l, Pt, {
        y: 100,
        duration: 200
      }, !1)),
        u.run(0),
      a || (a = Be(e, vt, {
        duration: 200
      }, !1)),
        a.run(0),
        f = !1
    },
    d(L) {
      L && b(e),
      $ && $.d(L),
      y && y.d(L),
      I && I.d(L),
      L && u && u.end(),
      L && a && a.end(),
        c = !1,
        tt(d)
    }
  }
}

function En(n) {
  let e, t;
  return {
    c() {
      e = _("h2"),
        t = G(n[1]),
        h(e, "class", "w-full border-b border-neutral-300 p-4 px-4 text-center font-bold dark:border-neutral-700")
    },
    m(l, s) {
      g(l, e, s),
        m(e, t)
    },
    p(l, s) {
      s & 2 && Ce(t, l[1])
    },
    d(l) {
      l && b(e)
    }
  }
}

function ms(n) {
  let e, t = n[1] && En(n);
  return {
    c() {
      t && t.c(),
        e = dt()
    },
    m(l, s) {
      t && t.m(l, s),
        g(l, e, s)
    },
    p(l, s) {
      l[1] ? t ? t.p(l, s) : (t = En(l),
        t.c(),
        t.m(e.parentNode, e)) : t && (t.d(1),
        t = null)
    },
    d(l) {
      t && t.d(l),
      l && b(e)
    }
  }
}

function _s(n) {
  let e, t, l = n[0] && yn(n);
  return {
    c() {
      l && l.c(),
        e = dt()
    },
    m(s, r) {
      l && l.m(s, r),
        g(s, e, r),
        t = !0
    },
    p(s, [r]) {
      s[0] ? l ? (l.p(s, r),
      r & 1 && C(l, 1)) : (l = yn(s),
        l.c(),
        C(l, 1),
        l.m(e.parentNode, e)) : l && (be(),
        M(l, 1, 1, () => {
            l = null
          }
        ),
        we())
    },
    i(s) {
      t || (C(l),
        t = !0)
    },
    o(s) {
      M(l),
        t = !1
    },
    d(s) {
      l && l.d(s),
      s && b(e)
    }
  }
}

const gs = n => n.stopPropagation();

function bs(n, e, t) {
  let {$$slots: l = {}, $$scope: s} = e
    , {open: r} = e
    , {title: o = ""} = e
    , {fullscreen: i = !1} = e;
  const u = () => t(0, r = !1)
    , a = () => t(0, r = !1);
  return n.$$set = f => {
    "open" in f && t(0, r = f.open),
    "title" in f && t(1, o = f.title),
    "fullscreen" in f && t(2, i = f.fullscreen),
    "$$scope" in f && t(3, s = f.$$scope)
  }
    ,
    [r, o, i, s, l, u, a]
}

class ht extends se {
  constructor(e) {
    super();
    oe(this, e, bs, _s, re, {
      open: 0,
      title: 1,
      fullscreen: 2
    })
  }
}

function ws(n) {
  let e, t, l, s, r, o, i, u, a, f, c, d, p, w, $, k, y, A, I, L, Y, z, H, X, x, ee, Z, pe;
  return {
    c() {
      e = G("\u6C38\u548C\u4E5D\u5E74\u4E09\u6708\u521D\u4E09\uFF0C\u521D\u6625\u4E4B\u9645\u3002"),
        t = _("br"),
        l = G(`
\u65F6\u4EFB\u4F1A\u7A3D\u5185\u53F2\u7684\u738B\u7FB2\u4E4B\u9080\u8BF7 `),
        s = _("strong"),
        s.textContent = "\u4F60",
        r = G(`
\u548C\u5176\u4ED6\u56DB\u5341\u4E00\u4F4D\u6587\u4EBA\u96C5\u58EB\u5171\u540C\u805A\u4E8E\u4F1A\u7A3D\u5C71\u9634\u7684\u5170\u4EAD\uFF0C\u66F2\u6C34\u6D41\u89DE\uFF0C\u996E\u9152\u4F5C\u8BD7\u3002`),
        o = _("br"),
        i = R(),
        u = _("br"),
        a = G(`
\u4F17\u4EBA\u6C89\u9189\u4E8E\u9152\u9999\u8BD7\u7F8E\u7684\u56DE\u5473\u4E4B\u65F6\uFF0C\u8C22\u4E07\u63D0\u8BAE\u4E0D\u5982\u6765\u4E00\u573A\u6E38\u620F\uFF0C\u52A9\u52A9\u96C5\u5174\uFF01`),
        f = _("br"),
        c = G(`
\u738B\u7FB2\u4E4B\u62CD\u624B\u79F0\u5FEB\uFF0C\u5174\u8D77\u8BF4\u5230\uFF1A\u201C\u6211\u60F3\u5230\u4E00\u4E2A\u6E38\u620F\uFF0C\u540D\u66F0 \u300A\u8BCD\u5F71\u300B\u3002\u201D `),
        d = _("br"),
        p = R(),
        w = _("br"),
        $ = G(`
\u53EA\u89C1\u4ED6\u80CC\u8FC7\u4F17\u4EBA\u8EAB\u53BB\uFF0C\u5728\u753B\u5377\u4E0A\u5199\u4E86\u4E00\u4E9B\u5B57\u3002\u7136\u540E\u738B\u7FB2\u4E4B\u8F6C\u8FC7\u8EAB\u6765\uFF0C\u5C06\u753B\u5377\u85CF\u5728\u4E86\u8EAB\u540E\uFF0C\u4ED6\u7B11\u7740\u5BF9\u7740\u5927\u5BB6\u8BF4\uFF1A`),
        k = _("br"),
        y = G(`
"\u8BF8\u4F4D\u96C5\u58EB\uFF0C\u4F17\u6240\u5468\u77E5\u6C49\u5B57\u4E4B\u7F8E\uFF0C\u7F8E\u5728\u5F62\u4F53\u3002\u6211\u5728\u8FD9\u753B\u5377\u4E0A\uFF0C\u5199\u4E86\u4E2A\u56DB\u5B57\u6210\u8BED\uFF0C\u8BF8\u4F4D\u96C5\u58EB\u53EF\u4EE5\u731C\u731C\u6211\u5199\u7684\u662F\u4EC0\u4E48\uFF1F\u7B54\u9519\u4E0D\u8981\u7D27\uFF0C\u6211\u4F1A\u544A\u8BC9\u4F60\u4EEC\u5176\u5F62\u4F3C\u4E4B\u5904\uFF0C\u5176\u6B63\u6240\u8C13
\u300A\u8BCD\u5F71\u300B\u3002"`),
        A = _("br"),
        I = R(),
        L = _("br"),
        Y = G(`
\u4E0D\u77E5 `),
        z = _("strong"),
        z.textContent = "\u4F60",
        H = G(" \u80FD\u5426\u5B8C\u6210\u738B\u7FB2\u4E4B\u7684\u8FD9\u9053\u9898\u5462\uFF1F"),
        X = _("br"),
        x = R(),
        ee = _("br"),
        Z = R(),
        pe = _("div"),
        pe.innerHTML = '<center><img src="/lanting_super_small.png" width="100%" height="30%" alt="\u5170\u4EAD\u805A\u4F1A"/></center>',
        h(pe, "class", "flex items-center justify-center")
    },
    m(E, O) {
      g(E, e, O),
        g(E, t, O),
        g(E, l, O),
        g(E, s, O),
        g(E, r, O),
        g(E, o, O),
        g(E, i, O),
        g(E, u, O),
        g(E, a, O),
        g(E, f, O),
        g(E, c, O),
        g(E, d, O),
        g(E, p, O),
        g(E, w, O),
        g(E, $, O),
        g(E, k, O),
        g(E, y, O),
        g(E, A, O),
        g(E, I, O),
        g(E, L, O),
        g(E, Y, O),
        g(E, z, O),
        g(E, H, O),
        g(E, X, O),
        g(E, x, O),
        g(E, ee, O),
        g(E, Z, O),
        g(E, pe, O)
    },
    p: B,
    i: B,
    o: B,
    d(E) {
      E && b(e),
      E && b(t),
      E && b(l),
      E && b(s),
      E && b(r),
      E && b(o),
      E && b(i),
      E && b(u),
      E && b(a),
      E && b(f),
      E && b(c),
      E && b(d),
      E && b(p),
      E && b(w),
      E && b($),
      E && b(k),
      E && b(y),
      E && b(A),
      E && b(I),
      E && b(L),
      E && b(Y),
      E && b(z),
      E && b(H),
      E && b(X),
      E && b(x),
      E && b(ee),
      E && b(Z),
      E && b(pe)
    }
  }
}

class vs extends se {
  constructor(e) {
    super();
    oe(this, e, null, ws, re, {})
  }
}

function kt(n, e) {
  return Math.hypot(n[0] - e[0], n[1] - e[1])
}

function Ft(n, e) {
  return [e[0] - n[0], e[1] - n[1]]
}

function Qt(n, e) {
  const t = e / Math.hypot(n[0], n[1]);
  return [n[0] * t, n[1] * t]
}

function zt(n) {
  let e = 0;
  for (let t = 0; t + 1 < n.length; t += 1)
    e += kt(n[t], n[t + 1]);
  return e
}

function $t(n) {
  const e = zt(n)
    , t = [0, 0];
  for (let l = 0; l + 1 < n.length; l += 1) {
    const s = kt(n[l], n[l + 1]) / e;
    for (let r = 0; r < 2; r += 1)
      t[r] += (n[l][r] + n[l + 1][r]) / 2 * s
  }
  return t
}

function st(n, e, t) {
  return [n[0] + e[0] * t, n[1] + e[1] * t]
}

function Rt(n, e, t, l, s) {
  let r = 0;
  for (let o = 0; o < 2; o += 1) {
    const i = t[o] - n[o]
      , u = (l[o] - e[o]) * s;
    r += (i * i + i * u + u * u / 3) * s
  }
  return r
}

function ks(n) {
  const e = $t(n)
    , t = zt(n);
  let l = 0;
  for (let s = 0; s + 1 < n.length; s += 1) {
    const r = kt(n[s], n[s + 1]) / t
      , o = Qt(Ft(n[s], n[s + 1]), t);
    l += Rt(n[s], o, e, [0, 0], r)
  }
  return Math.sqrt(l) / 1024
}

function $s(n, e, t) {
  let l = 0;
  const s = zt(n)
    , r = zt(e)
    , o = $t(n)
    , i = $t(e);
  let u = st(n[0], o, -t)
    , a = st(e[0], i, -t)
    , f = 1
    , c = 1;
  for (; f < n.length && c < e.length;) {
    const d = st(n[f], o, -t)
      , p = st(e[c], i, -t)
      , w = kt(u, d) / s
      , $ = kt(a, p) / r
      , k = Qt(Ft(u, d), s)
      , y = Qt(Ft(a, p), r);
    w == $ ? (l += Rt(u, k, a, y, w),
      u = d,
      a = p,
      f += 1,
      c += 1) : w < $ ? (l += Rt(u, k, a, y, w),
      u = d,
      a = st(a, y, w),
      f += 1) : (l += Rt(u, k, a, y, $),
      u = st(u, k, $),
      a = p,
      c += 1)
  }
  return Math.sqrt(l) / 1024
}

export function Ot(n, e, t, Ct) {
  const l = je(Ct)
  // console.log(l)
  const s = [...(t == null ? void 0 : t.shadows) || n.medians.map(() => ({
    stroke: "",
    distance: l.presentThreshold,
    shiftX: 0,
    shiftY: 0
  }))];
  let r = 0;
  for (let o = 0; o < n.medians.length; o += 1) {
    let i = !1;
    const u = ks(n.medians[o]);
    for (let a = 0; a < e.medians.length; a += 1) {
      const f = $s(n.medians[o], e.medians[a], l.shiftFactor) / u;
      if (f < l.correctThreshold && (i = !0),
      f < s[o].distance)
        if (f < l.correctThreshold)
          s[o] = {
            stroke: n.strokes[o],
            distance: 0,
            shiftX: 0,
            shiftY: 0
          };
        else {
          const c = $t(n.medians[o])
            , d = $t(e.medians[a]);
          s[o] = {
            stroke: e.strokes[a],
            distance: f,
            shiftX: (c[0] - d[0]) * l.shiftFactor,
            shiftY: (c[1] - d[1]) * l.shiftFactor
          }
        }
    }
    i && (r += 1)
  }
  return {
    shadows: s,
    match: false,
    percent: r / n.medians.length
  }
}

// const Je = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : void 0;
// var ll;
// const Ke = Et("darkmode", (ll = Je == null ? void 0 : Je.matches) != null ? ll : !1);
// Ke.subscribe(n=>{
//     Ke.commit(),
//       n ? document.documentElement.classList.add("dark") : document.documentElement.classList.remove("dark")
//   }
// );
// Je != null && Je.addEventListener && Je.addEventListener("change", n=>{
//     Ke.set(n.matches)
//   }
// );
function Cn(n, e, t) {
  const l = n.slice();
  return l[7] = e[t],
    l[8] = e,
    l[9] = t,
    l
}

function Tn(n, e, t) {
  const l = n.slice();
  return l[10] = e[t],
    l[11] = e,
    l[12] = t,
    l
}

function In(n) {
  let e, t = n[11], l = n[12], s;
  const r = () => n[3](e, t, l)
    , o = () => n[3](null, t, l);
  let i = {
    text: n[10].char,
    inputEnabled: !1,
    result: n[10].result
  };
  return e = new Ze({
    props: i
  }),
    r(),
    {
      c() {
        D(e.$$.fragment)
      },
      m(u, a) {
        j(e, u, a),
          s = !0
      },
      p(u, a) {
        (t !== u[11] || l !== u[12]) && (o(),
          t = u[11],
          l = u[12],
          r());
        const f = {};
        a & 1 && (f.text = u[10].char),
        a & 1 && (f.result = u[10].result),
          e.$set(f)
      },
      i(u) {
        s || (C(e.$$.fragment, u),
          s = !0)
      },
      o(u) {
        M(e.$$.fragment, u),
          s = !1
      },
      d(u) {
        o(),
          N(e, u)
      }
    }
}

function Mn(n) {
  let e, t = n[8], l = n[9], s;
  const r = () => n[4](e, t, l)
    , o = () => n[4](null, t, l);
  let i = {
    text: n[7].char,
    inputEnabled: !1,
    result: n[7].result
  };
  return e = new Ze({
    props: i
  }),
    r(),
    {
      c() {
        D(e.$$.fragment)
      },
      m(u, a) {
        j(e, u, a),
          s = !0
      },
      p(u, a) {
        (t !== u[8] || l !== u[9]) && (o(),
          t = u[8],
          l = u[9],
          r());
        const f = {};
        a & 2 && (f.text = u[7].char),
        a & 2 && (f.result = u[7].result),
          e.$set(f)
      },
      i(u) {
        s || (C(e.$$.fragment, u),
          s = !0)
      },
      o(u) {
        M(e.$$.fragment, u),
          s = !1
      },
      d(u) {
        o(),
          N(e, u)
      }
    }
}

function Ss(n) {
  let e, t, l, s, r, o, i, u, a, f, c, d, p, w, $, k, y, A, I, L, Y, z, H, X, x, ee = n[2] ? "\u767D" : "\u9ED1", Z, pe,
    E, O, K, de, fe, Te, Ge, Se, Pe, ye, He, ve, Ie, Le, Ve, Xe, qe, Ue;
  c = new Ze({
    props: {
      text: "\u5170",
      inputEnabled: !1,
      result: {
        match: !1,
        percent: 0,
        shadows: []
      }
    }
  }),
    p = new Ze({
      props: {
        text: "\u4EAD",
        inputEnabled: !1,
        result: {
          match: !1,
          percent: 0,
          shadows: []
        }
      }
    }),
    $ = new Ze({
      props: {
        text: "",
        inputEnabled: !1,
        result: {
          match: !1,
          percent: 0,
          shadows: []
        }
      }
    }),
    y = new Ze({
      props: {
        text: "",
        inputEnabled: !1,
        result: {
          match: !1,
          percent: 0,
          shadows: []
        }
      }
    });
  let ke = n[0]
    , te = [];
  for (let v = 0; v < ke.length; v += 1)
    te[v] = In(Tn(n, ke, v));
  const pt = v => M(te[v], 1, 1, () => {
      te[v] = null
    }
  );
  let T = n[1]
    , W = [];
  for (let v = 0; v < T.length; v += 1)
    W[v] = Mn(Cn(n, T, v));
  const Ee = v => M(W[v], 1, 1, () => {
      W[v] = null
    }
  );
  return {
    c() {
      e = G("\u7B54\u6848\u4E00\u5B9A\u662F\u4E00\u4E2A "),
        t = _("strong"),
        t.textContent = "\u56DB\u5B57\u6210\u8BED",
        l = G(`\uFF0C\u6709\u81F3\u591A
`),
        s = _("strong"),
        s.textContent = `${Ne}`,
        r = G(`
\u6B21\u673A\u4F1A\u8FDB\u884C\u731C\u6D4B\uFF0C\u6BCF\u4E00\u6B21\u731C\u6D4B\u90FD\u9700\u8981\u5728\u5F53\u524D\u884C\u8F93\u5165\u56DB\u4E2A\u6C49\u5B57\u3002`),
        o = _("br"),
        i = R(),
        u = _("br"),
        a = R(),
        f = _("div"),
        D(c.$$.fragment),
        d = R(),
        D(p.$$.fragment),
        w = R(),
        D($.$$.fragment),
        k = R(),
        D(y.$$.fragment),
        A = R(),
        I = _("br"),
        L = G(`
\u63D0\u4EA4\u4E4B\u540E\uFF0C\u7CFB\u7EDF\u5C06\u4F1A\u5BF9\u6BD4\u6BCF\u4E2A\u4F4D\u7F6E\u7684\u5B57\u5F62
`),
        Y = _("li"),
        Y.innerHTML = "\u6B63\u786E\u7684\u7B14\u753B\u5C06\u4F1A\u6807\u6CE8\u4E3A<strong>\u7EFF\u8272</strong>\u3002",
        z = R(),
        H = _("li"),
        X = G("\u7B14\u753B\u76F8\u4F3C\u7684\u5C06\u4F1A\u6807\u6CE8\u4E3A"),
        x = _("strong"),
        Z = G(ee),
        pe = G("\u8272\u6216\u8005\u7070\u8272"),
        E = G("\uFF0C\u5176\u989C\u8272\u6DF1\u6D45\u6839\u636E\u5176\u76F8\u4F3C\u7A0B\u5EA6\u800C\u5B9A\u3002"),
        O = R(),
        K = _("br"),
        de = R(),
        fe = _("div");
      for (let v = 0; v < te.length; v += 1)
        te[v].c();
      Te = R(),
        Ge = _("br"),
        Se = R(),
        Pe = _("li"),
        Pe.innerHTML = "\u5B8C\u5168\u6B63\u786E\u5C06\u4F1A\u6807\u8BB0\u4E3A<strong>\u7EFF\u5E95\uFF1A</strong>",
        ye = R(),
        He = _("br"),
        ve = R(),
        Ie = _("div");
      for (let v = 0; v < W.length; v += 1)
        W[v].c();
      Le = R(),
        Ve = _("br"),
        Xe = G(`
\u5982\u679C\u56DB\u4E2A\u5B57\u90FD\u662F\u7EFF\u5E95\u7684\u8BDD\uFF0C`),
        qe = _("strong"),
        qe.textContent = "\u606D\u559C\u4F60\u8D62\u5F97\u4E86\u8FD9\u5C40\u6E38\u620F\uFF01",
        h(f, "class", "flex items-center justify-center gap-1"),
        h(fe, "class", "flex items-center justify-center gap-1"),
        h(Ie, "class", "flex items-center justify-center gap-1")
    },
    m(v, P) {
      g(v, e, P),
        g(v, t, P),
        g(v, l, P),
        g(v, s, P),
        g(v, r, P),
        g(v, o, P),
        g(v, i, P),
        g(v, u, P),
        g(v, a, P),
        g(v, f, P),
        j(c, f, null),
        m(f, d),
        j(p, f, null),
        m(f, w),
        j($, f, null),
        m(f, k),
        j(y, f, null),
        g(v, A, P),
        g(v, I, P),
        g(v, L, P),
        g(v, Y, P),
        g(v, z, P),
        g(v, H, P),
        m(H, X),
        m(H, x),
        m(x, Z),
        m(x, pe),
        m(H, E),
        g(v, O, P),
        g(v, K, P),
        g(v, de, P),
        g(v, fe, P);
      for (let q = 0; q < te.length; q += 1)
        te[q].m(fe, null);
      g(v, Te, P),
        g(v, Ge, P),
        g(v, Se, P),
        g(v, Pe, P),
        g(v, ye, P),
        g(v, He, P),
        g(v, ve, P),
        g(v, Ie, P);
      for (let q = 0; q < W.length; q += 1)
        W[q].m(Ie, null);
      g(v, Le, P),
        g(v, Ve, P),
        g(v, Xe, P),
        g(v, qe, P),
        Ue = !0
    },
    p(v, [P]) {
      if ((!Ue || P & 4) && ee !== (ee = v[2] ? "\u767D" : "\u9ED1") && Ce(Z, ee),
      P & 1) {
        ke = v[0];
        let q;
        for (q = 0; q < ke.length; q += 1) {
          const F = Tn(v, ke, q);
          te[q] ? (te[q].p(F, P),
            C(te[q], 1)) : (te[q] = In(F),
            te[q].c(),
            C(te[q], 1),
            te[q].m(fe, null))
        }
        for (be(),
               q = ke.length; q < te.length; q += 1)
          pt(q);
        we()
      }
      if (P & 2) {
        T = v[1];
        let q;
        for (q = 0; q < T.length; q += 1) {
          const F = Cn(v, T, q);
          W[q] ? (W[q].p(F, P),
            C(W[q], 1)) : (W[q] = Mn(F),
            W[q].c(),
            C(W[q], 1),
            W[q].m(Ie, null))
        }
        for (be(),
               q = T.length; q < W.length; q += 1)
          Ee(q);
        we()
      }
    },
    i(v) {
      if (!Ue) {
        C(c.$$.fragment, v),
          C(p.$$.fragment, v),
          C($.$$.fragment, v),
          C(y.$$.fragment, v);
        for (let P = 0; P < ke.length; P += 1)
          C(te[P]);
        for (let P = 0; P < T.length; P += 1)
          C(W[P]);
        Ue = !0
      }
    },
    o(v) {
      M(c.$$.fragment, v),
        M(p.$$.fragment, v),
        M($.$$.fragment, v),
        M(y.$$.fragment, v),
        te = te.filter(Boolean);
      for (let P = 0; P < te.length; P += 1)
        M(te[P]);
      W = W.filter(Boolean);
      for (let P = 0; P < W.length; P += 1)
        M(W[P]);
      Ue = !1
    },
    d(v) {
      v && b(e),
      v && b(t),
      v && b(l),
      v && b(s),
      v && b(r),
      v && b(o),
      v && b(i),
      v && b(u),
      v && b(a),
      v && b(f),
        N(c),
        N(p),
        N($),
        N(y),
      v && b(A),
      v && b(I),
      v && b(L),
      v && b(Y),
      v && b(z),
      v && b(H),
      v && b(O),
      v && b(K),
      v && b(de),
      v && b(fe),
        Qe(te, v),
      v && b(Te),
      v && b(Ge),
      v && b(Se),
      v && b(Pe),
      v && b(ye),
      v && b(He),
      v && b(ve),
      v && b(Ie),
        Qe(W, v),
      v && b(Le),
      v && b(Ve),
      v && b(Xe),
      v && b(qe)
    }
  }
}

const Wt = "\u9AD8\u5C71\u6D41\u6C34"
  , ys = "\u5546\u5C71\u6DEE\u6728";

function Es(n, e, t) {
  let l;
  me(n, Ke, f => t(2, l = f));
  const s = [{
    char: "",
    result: {
      match: !0,
      percent: 1,
      shadows: []
    }
  }, {
    char: "",
    result: {
      match: !0,
      percent: 1,
      shadows: []
    }
  }, {
    char: "",
    result: {
      match: !0,
      percent: 1,
      shadows: []
    }
  }, {
    char: "",
    result: {
      match: !0,
      percent: 1,
      shadows: []
    }
  }]
    , r = [{
    char: "",
    result: {
      match: !0,
      percent: 1,
      shadows: []
    }
  }, {
    char: "",
    result: {
      match: !0,
      percent: 1,
      shadows: []
    }
  }, {
    char: "",
    result: {
      match: !0,
      percent: 1,
      shadows: []
    }
  }, {
    char: "",
    result: {
      match: !0,
      percent: 1,
      shadows: []
    }
  }];
  il(async () => {
      await o(),
        i()
    }
  );

  async function o() {
    await Promise.all(s.map(async (f, c) => {
        await lt((c + 1) * 500),
          t(0, s[c].char = ys[c], s)
      }
    )),
      await Promise.all(s.map(async (f, c) => {
          var k, y, A, I;
          const d = (k = We(f.char)) == null ? void 0 : k.get()
            , p = (y = We(Wt[c])) == null ? void 0 : y.get();
          if (!d || !p)
            return;
          const w = await d
            , $ = await p;
          t(0, s[c] = {
            char: f.char,
            result: Ot($, w),
            tile: f.tile
          }, s),
            await lt((c + 1) * 500),
          (I = (A = s[c]) == null ? void 0 : A.tile) == null || I.reveal(),
            await lt(250)
        }
      ))
  }

  async function i() {
    await Promise.all(r.map(async (f, c) => {
        await lt((c + 1) * 500),
          t(1, r[c].char = Wt[c], r)
      }
    )),
      await Promise.all(r.map(async (f, c) => {
          var k, y, A, I;
          const d = (k = We(f.char)) == null ? void 0 : k.get()
            , p = (y = We(Wt[c])) == null ? void 0 : y.get();
          if (!d || !p)
            return;
          const w = await d
            , $ = await p;
          t(1, r[c] = {
            char: f.char,
            result: Ot($, w),
            tile: f.tile
          }, r),
            await lt((c + 1) * 500),
          (I = (A = r[c]) == null ? void 0 : A.tile) == null || I.reveal(),
            await lt(250)
        }
      ))
  }

  function u(f, c, d) {
    V[f ? "unshift" : "push"](() => {
        c[d].tile = f,
          t(0, s)
      }
    )
  }

  function a(f, c, d) {
    V[f ? "unshift" : "push"](() => {
        c[d].tile = f,
          t(1, r)
      }
    )
  }

  return [s, r, l, u, a]
}

class Cs extends se {
  constructor(e) {
    super();
    oe(this, e, Es, Ss, re, {})
  }
}

function Ts(n) {
  let e, t, l, s, r, o, i, u;
  const a = n[2].default
    , f = ct(a, n, n[1], null);
  return {
    c() {
      e = _("button"),
        t = Ae("svg"),
        l = Ae("path"),
        s = R(),
      f && f.c(),
        h(l, "stroke-linecap", "round"),
        h(l, "stroke-linejoin", "round"),
        h(l, "d", "M15 19l-7-7 7-7"),
        h(t, "xmlns", "http://www.w3.org/2000/svg"),
        h(t, "class", "h-6 w-6"),
        h(t, "fill", "none"),
        h(t, "viewBox", "0 0 24 24"),
        h(t, "stroke", "currentColor"),
        h(t, "stroke-width", "2"),
        h(e, "class", r = n[0] + " flex items-center py-4 text-lg text-correct")
    },
    m(c, d) {
      g(c, e, d),
        m(e, t),
        m(t, l),
        m(e, s),
      f && f.m(e, null),
        o = !0,
      i || (u = J(e, "click", n[3]),
        i = !0)
    },
    p(c, [d]) {
      f && f.p && (!o || d & 2) && ut(f, a, c, c[1], o ? at(a, c[1], d, null) : ft(c[1]), null),
      (!o || d & 1 && r !== (r = c[0] + " flex items-center py-4 text-lg text-correct")) && h(e, "class", r)
    },
    i(c) {
      o || (C(f, c),
        o = !0)
    },
    o(c) {
      M(f, c),
        o = !1
    },
    d(c) {
      c && b(e),
      f && f.d(c),
        i = !1,
        u()
    }
  }
}

function Is(n, e, t) {
  let {$$slots: l = {}, $$scope: s} = e
    , {class: r = ""} = e;

  function o(i) {
    yt.call(this, n, i)
  }

  return n.$$set = i => {
    "class" in i && t(0, r = i.class),
    "$$scope" in i && t(1, s = i.$$scope)
  }
    ,
    [r, s, l, o]
}

class dl extends se {
  constructor(e) {
    super();
    oe(this, e, Is, Ts, re, {
      class: 0
    })
  }
}

function Ms(n) {
  let e, t, l, s, r, o, i, u;
  const a = n[2].default
    , f = ct(a, n, n[1], null);
  return {
    c() {
      e = _("button"),
      f && f.c(),
        t = R(),
        l = Ae("svg"),
        s = Ae("path"),
        h(s, "stroke-linecap", "round"),
        h(s, "stroke-linejoin", "round"),
        h(s, "d", "M9 5l7 7-7 7"),
        h(l, "xmlns", "http://www.w3.org/2000/svg"),
        h(l, "class", "h-6 w-6"),
        h(l, "fill", "none"),
        h(l, "viewBox", "0 0 24 24"),
        h(l, "stroke", "currentColor"),
        h(l, "stroke-width", "2"),
        h(e, "class", r = n[0] + " flex items-center py-4 text-lg text-correct")
    },
    m(c, d) {
      g(c, e, d),
      f && f.m(e, null),
        m(e, t),
        m(e, l),
        m(l, s),
        o = !0,
      i || (u = J(e, "click", n[3]),
        i = !0)
    },
    p(c, [d]) {
      f && f.p && (!o || d & 2) && ut(f, a, c, c[1], o ? at(a, c[1], d, null) : ft(c[1]), null),
      (!o || d & 1 && r !== (r = c[0] + " flex items-center py-4 text-lg text-correct")) && h(e, "class", r)
    },
    i(c) {
      o || (C(f, c),
        o = !0)
    },
    o(c) {
      M(f, c),
        o = !1
    },
    d(c) {
      c && b(e),
      f && f.d(c),
        i = !1,
        u()
    }
  }
}

function Rs(n, e, t) {
  let {$$slots: l = {}, $$scope: s} = e
    , {class: r = ""} = e;

  function o(i) {
    yt.call(this, n, i)
  }

  return n.$$set = i => {
    "class" in i && t(0, r = i.class),
    "$$scope" in i && t(1, s = i.$$scope)
  }
    ,
    [r, s, l, o]
}

class Tt extends se {
  constructor(e) {
    super();
    oe(this, e, Rs, Ms, re, {
      class: 0
    })
  }
}

function As(n) {
  let e, t, l, s;
  return t = new Cs({}),
    {
      c() {
        e = _("div"),
          D(t.$$.fragment)
      },
      m(r, o) {
        g(r, e, o),
          j(t, e, null),
          s = !0
      },
      i(r) {
        s || (C(t.$$.fragment, r),
        l || Fe(() => {
            l = Kt(e, vt, {}),
              l.start()
          }
        ),
          s = !0)
      },
      o(r) {
        M(t.$$.fragment, r),
          s = !1
      },
      d(r) {
        r && b(e),
          N(t)
      }
    }
}

function Ps(n) {
  let e, t, l, s;
  return t = new vs({}),
    {
      c() {
        e = _("div"),
          D(t.$$.fragment)
      },
      m(r, o) {
        g(r, e, o),
          j(t, e, null),
          s = !0
      },
      i(r) {
        s || (C(t.$$.fragment, r),
        l || Fe(() => {
            l = Kt(e, vt, {}),
              l.start()
          }
        ),
          s = !0)
      },
      o(r) {
        M(t.$$.fragment, r),
          s = !1
      },
      d(r) {
        r && b(e),
          N(t)
      }
    }
}

function Ls(n) {
  let e, t, l, s, r;
  const o = [Ps, As]
    , i = [];

  function u(a, f) {
    return a[2] === De.STORY ? 0 : a[2] === De.TUTORIAL ? 1 : -1
  }

  return ~(l = u(n)) && (s = i[l] = o[l](n)),
    {
      c() {
        e = _("div"),
          t = _("div"),
        s && s.c(),
          h(t, "class", "max-w-md"),
          h(e, "class", "flex w-full justify-center overflow-y-auto p-4")
      },
      m(a, f) {
        g(a, e, f),
          m(e, t),
        ~l && i[l].m(t, null),
          n[7](e),
          r = !0
      },
      p(a, f) {
        let c = l;
        l = u(a),
        l !== c && (s && (be(),
          M(i[c], 1, 1, () => {
              i[c] = null
            }
          ),
          we()),
          ~l ? (s = i[l],
          s || (s = i[l] = o[l](a),
            s.c()),
            C(s, 1),
            s.m(t, null)) : s = null)
      },
      i(a) {
        r || (C(s),
          r = !0)
      },
      o(a) {
        M(s),
          r = !1
      },
      d(a) {
        a && b(e),
        ~l && i[l].d(),
          n[7](null)
      }
    }
}

function zs(n) {
  let e, t, l, s;
  return e = new dl({
    props: {
      class: "float-left",
      $$slots: {
        default: [Bs]
      },
      $$scope: {
        ctx: n
      }
    }
  }),
    e.$on("click", n[5]),
    l = new Tt({
      props: {
        class: "float-right",
        $$slots: {
          default: [Ds]
        },
        $$scope: {
          ctx: n
        }
      }
    }),
    l.$on("click", n[6]),
    {
      c() {
        D(e.$$.fragment),
          t = R(),
          D(l.$$.fragment)
      },
      m(r, o) {
        j(e, r, o),
          g(r, t, o),
          j(l, r, o),
          s = !0
      },
      p(r, o) {
        const i = {};
        o & 512 && (i.$$scope = {
          dirty: o,
          ctx: r
        }),
          e.$set(i);
        const u = {};
        o & 512 && (u.$$scope = {
          dirty: o,
          ctx: r
        }),
          l.$set(u)
      },
      i(r) {
        s || (C(e.$$.fragment, r),
          C(l.$$.fragment, r),
          s = !0)
      },
      o(r) {
        M(e.$$.fragment, r),
          M(l.$$.fragment, r),
          s = !1
      },
      d(r) {
        N(e, r),
        r && b(t),
          N(l, r)
      }
    }
}

function Os(n) {
  let e, t;
  return e = new Tt({
    props: {
      class: "float-right",
      $$slots: {
        default: [js]
      },
      $$scope: {
        ctx: n
      }
    }
  }),
    e.$on("click", n[4]),
    {
      c() {
        D(e.$$.fragment)
      },
      m(l, s) {
        j(e, l, s),
          t = !0
      },
      p(l, s) {
        const r = {};
        s & 512 && (r.$$scope = {
          dirty: s,
          ctx: l
        }),
          e.$set(r)
      },
      i(l) {
        t || (C(e.$$.fragment, l),
          t = !0)
      },
      o(l) {
        M(e.$$.fragment, l),
          t = !1
      },
      d(l) {
        N(e, l)
      }
    }
}

function Bs(n) {
  let e;
  return {
    c() {
      e = G("\u67E5\u770B\u6545\u4E8B")
    },
    m(t, l) {
      g(t, e, l)
    },
    d(t) {
      t && b(e)
    }
  }
}

function Ds(n) {
  let e;
  return {
    c() {
      e = G("\u5F00\u59CB\u4F5C\u7B54")
    },
    m(t, l) {
      g(t, e, l)
    },
    d(t) {
      t && b(e)
    }
  }
}

function js(n) {
  let e;
  return {
    c() {
      e = G("\u67E5\u770B\u6559\u7A0B")
    },
    m(t, l) {
      g(t, e, l)
    },
    d(t) {
      t && b(e)
    }
  }
}

function Ns(n) {
  let e, t, l, s;
  const r = [Os, zs]
    , o = [];

  function i(u, a) {
    return u[2] === De.STORY ? 0 : u[2] === De.TUTORIAL ? 1 : -1
  }

  return ~(t = i(n)) && (l = o[t] = r[t](n)),
    {
      c() {
        e = _("div"),
        l && l.c(),
          h(e, "slot", "footer"),
          h(e, "class", "w-full max-w-md px-4")
      },
      m(u, a) {
        g(u, e, a),
        ~t && o[t].m(e, null),
          s = !0
      },
      p(u, a) {
        let f = t;
        t = i(u),
          t === f ? ~t && o[t].p(u, a) : (l && (be(),
            M(o[f], 1, 1, () => {
                o[f] = null
              }
            ),
            we()),
            ~t ? (l = o[t],
              l ? l.p(u, a) : (l = o[t] = r[t](u),
                l.c()),
              C(l, 1),
              l.m(e, null)) : l = null)
      },
      i(u) {
        s || (C(l),
          s = !0)
      },
      o(u) {
        M(l),
          s = !1
      },
      d(u) {
        u && b(e),
        ~t && o[t].d()
      }
    }
}

function Gs(n) {
  let e, t, l;

  function s(o) {
    n[8](o)
  }

  let r = {
    title: n[3],
    fullscreen: !0,
    $$slots: {
      footer: [Ns],
      default: [Ls]
    },
    $$scope: {
      ctx: n
    }
  };
  return n[0] !== void 0 && (r.open = n[0]),
    e = new ht({
      props: r
    }),
    V.push(() => ue(e, "open", s)),
    {
      c() {
        D(e.$$.fragment)
      },
      m(o, i) {
        j(e, o, i),
          l = !0
      },
      p(o, [i]) {
        const u = {};
        i & 8 && (u.title = o[3]),
        i & 519 && (u.$$scope = {
          dirty: i,
          ctx: o
        }),
        !t && i & 1 && (t = !0,
          u.open = o[0],
          ie(() => t = !1)),
          e.$set(u)
      },
      i(o) {
        l || (C(e.$$.fragment, o),
          l = !0)
      },
      o(o) {
        M(e.$$.fragment, o),
          l = !1
      },
      d(o) {
        N(e, o)
      }
    }
}

var De;
(function (n) {
    n[n.STORY = 0] = "STORY",
      n[n.TUTORIAL = 1] = "TUTORIAL"
  }
)(De || (De = {}));

function Hs(n, e, t) {
  let l, {open: s} = e, r, o = De.STORY;
  const i = () => t(2, o = De.TUTORIAL)
    , u = () => t(2, o = De.STORY)
    , a = () => t(0, s = !1);

  function f(d) {
    V[d ? "unshift" : "push"](() => {
        r = d,
          t(1, r)
      }
    )
  }

  function c(d) {
    s = d,
      t(0, s)
  }

  return n.$$set = d => {
    "open" in d && t(0, s = d.open)
  }
    ,
    n.$$.update = () => {
      n.$$.dirty & 6 && (r == null || r.scrollTo({
        top: 0
      })),
      n.$$.dirty & 4 && t(3, l = o === De.STORY ? "\u6545\u4E8B\u80CC\u666F" : "\u6E38\u620F\u6559\u7A0B")
    }
    ,
    [s, r, o, l, i, u, a, f, c]
}

class Us extends se {
  constructor(e) {
    super();
    oe(this, e, Hs, Gs, re, {
      open: 0
    })
  }
}

var Ws = ""

function qs() {
  let n = {
    currentStreak: 0,
    maxStreak: 0,
    guesses: [...Array(Ne).keys()].reduce((e, t) => (e[t + 1] = 0,
      e), {
      fail: 0
    }),
    winPercentage: 0,
    gamesPlayed: 0,
    gamesWon: 0,
    averageGuesses: 0,
    successfulGuesses: []
  };
  return n
}

const bt = qs()
  , xe = Ws.match(/.{4}/g) || [];

function Ys() {
  const {rowIndex: n, solution: e, gameStatus: t, lastPlayedTs: l} = je(ae)
    , s = l !== null && ul(l) !== Vt;
  if (e === "" || s) {
    t === le.IN_PROGRESS && n > 0 && bt.update(u => ze(Me({}, u), {
      gamesPlayed: u.gamesPlayed + 1
    }));
    const r = je(Ct).idiomLimit
      , o = r ? Math.min(xe.length, r) : xe.length
      , i = Math.floor(Math.random() * o);
    return ae.updateSolution(xe[i]),
      ae.update(u => ze(Me({}, u), {
        dailyConsumedQuota: s ? 1 : (u.dailyConsumedQuota || 0) + 1
      })),
      xe[i]
  }
  return e
}

function Rn() {
  return xe[Math.floor(Math.random() * xe.length)]
}

function Fs(n) {
  return xe.includes(n)
}

function Qs(n) {
  let e, t, l, s, r, o;
  return {
    c() {
      e = _("div"),
        t = _("input"),
        l = R(),
        s = _("span"),
        h(t, "type", "checkbox"),
        h(t, "class", "peer h-5 w-8 cursor-pointer appearance-none rounded-full bg-neutral-400 transition-colors checked:bg-correct"),
        h(s, "class", "pointer-events-none absolute h-4 w-4 translate-x-0.5 rounded-full bg-white transition-transform peer-checked:translate-x-3.5"),
        h(e, "class", "relative flex flex-shrink-0 items-center")
    },
    m(i, u) {
      g(i, e, u),
        m(e, t),
        t.checked = n[0],
        m(e, l),
        m(e, s),
      r || (o = [J(t, "change", n[2]), J(t, "click", n[1])],
        r = !0)
    },
    p(i, [u]) {
      u & 1 && (t.checked = i[0])
    },
    i: B,
    o: B,
    d(i) {
      i && b(e),
        r = !1,
        tt(o)
    }
  }
}

function Ks(n, e, t) {
  let {checked: l} = e;

  function s(o) {
    yt.call(this, n, o)
  }

  function r() {
    l = this.checked,
      t(0, l)
  }

  return n.$$set = o => {
    "checked" in o && t(0, l = o.checked)
  }
    ,
    [l, s, r]
}

class It extends se {
  constructor(e) {
    super();
    oe(this, e, Ks, Qs, re, {
      checked: 0
    })
  }
}

const Vs = "modulepreload"
  , An = {}
  , Xs = "/"
  , Pn = function (e, t) {
  return !t || t.length === 0 ? e() : Promise.all(t.map(l => {
      if (l = `${Xs}${l}`,
      l in An)
        return;
      An[l] = !0;
      const s = l.endsWith(".css")
        , r = s ? '[rel="stylesheet"]' : "";
      // if (document.querySelector(`link[href="${l}"]${r}`))
      //   return;
      // const o = document.createElement("link");
      let o
      // if (o.rel === s ? "stylesheet" : Vs,
      // s || (o.as = "script",
      //   o.crossOrigin = ""),
      //   o.href = l,
      // document.head.appendChild(o),
      // s)
      return new Promise((i, u) => {
          // o.addEventListener("load", i),
          //   o.addEventListener("error", ()=>u(new Error(`Unable to preload CSS for ${l}`)))
        }
      )
    }
  )).then(() => e())
}
  , et = !0;

// et.subscribe(()=>et.commit());
async function Zs() {
  const n = {
    apiKey: "AIzaSyCEJlZpyECnJSVVEt4o6UDVeYOTezy-EHE",
    authDomain: "ci-ying.firebaseapp.com",
    projectId: "ci-ying",
    storageBucket: "ci-ying.appspot.com",
    messagingSenderId: "81869271488",
    appId: "1:81869271488:web:b4fee72bb0219149241825",
    measurementId: "G-2L715MS57H"
  };
  let e;
  const t = Pn(() => import("./esm.js"), ["./esm.js", "./esm2017.js"])
    , l = Pn(() => import("./esm2.js"), ["./esm2.js", "./esm2017.js"]);
  try {
    const {initializeApp: o} = await t
      , i = o(n)
      , {getAnalytics: u} = await l;
    e = u(i)
  } catch (o) {
    // console.error(`Can not initialize firebase logger with ${o}`)
  }

  class s {
    constructor(i) {
      this.firebaseAnalytics = i,
        // et.subscribe(u=>{
        //     this.updateCollectionPolicy(u)
        //   }
        // ),
        this.updateCollectionPolicy(je(et))
    }

    updateCollectionPolicy(i) {
      l.then(u => {
          this.firebaseAnalytics && u.setAnalyticsCollectionEnabled(this.firebaseAnalytics, i)
        }
      )
    }

    logEvent(i) {
      !this.firebaseAnalytics || !je(et) || l.then(u => {
          u.logEvent(this.firebaseAnalytics, i.name, i.params)
        }
      )
    }
  }

  return new s(e)
}

const Oe = Zs()
  , Js = {
  name: "GAME_IMPRESSION"
}
  , xs = {
  name: "GAME_WIN"
}
  , eo = {
  name: "GAME_LOSE"
}
  , to = (n, e, t) => ({
  name: "GAME_SUBMIT",
  params: {
    answer: e,
    input: n,
    gameRound: `${t}`
  }
})
  , no = {
  name: "GAME_SHARE_SUCCESS"
}
  , qt = (n, e) => ({
  name: `${n}_${e}`.toUpperCase()
})
  , lo = {
  name: "CHALLENGE_MODE_IMPRESSION"
}
  , so = n => ({
  name: "COPY_CHALLENGE_LINK",
  params: {
    answer: n
  }
});

function oo(n) {
  let e, t, l, s, r, o, i, u, a, f, c, d, p, w, $, k, y, A, I, L, Y, z, H, X, x, ee, Z;

  function pe(K) {
    n[7](K)
  }

  function E(K) {
    n[8](K)
  }

  let O = {
    inputEnabled: !0
  };
  return n[1] !== void 0 && (O.text = n[1]),
  n[3] !== void 0 && (O.results = n[3]),
    r = new Xt({
      props: O
    }),
    V.push(() => ue(r, "text", pe)),
    V.push(() => ue(r, "results", E)),
    w = new It({
      props: {
        checked: n[2]
      }
    }),
    w.$on("click", n[10]),
    {
      c() {
        e = _("div"),
          t = _("div"),
          l = _("div"),
          l.innerHTML = `<div class="mb-1">\u60F3\u8981\u4EB2\u81EA\u51FA\u9898\u6311\u6218\u5176\u4ED6\u4EBA\uFF1F\u6CA1\u95EE\u9898\uFF01</div>
        <li>\u4EB2\u81EA\u51C6\u5907\u4E00\u9053\u9898\u76EE</li>
        <li>\u6216\u4ECE\u5DF2\u6709\u7684\u9898\u5E93\u4E2D\u968F\u673A\u4EA7\u751F</li>`,
          s = R(),
          D(r.$$.fragment),
          u = R(),
          a = _("button"),
          a.innerHTML = `\u91CD\u65B0\u968F\u673A
        <svg xmlns="http://www.w3.org/2000/svg" class="ml-1 h-6 w-6 transition-transform duration-700 group-active:rotate-[360deg] group-active:duration-[0ms]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="${2}"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>`,
          f = R(),
          c = _("div"),
          d = _("div"),
          d.innerHTML = `<div class="text-lg">\u56F0\u96BE\u6A21\u5F0F</div>
          <div class="text-xs opacity-50">\u63D0\u9AD8\u5339\u914D\u96BE\u5EA6\uFF0C\u4E0D\u4FDD\u7559\u5339\u914D\u8BB0\u5F55</div>`,
          p = R(),
          D(w.$$.fragment),
          $ = R(),
          k = _("input"),
          I = R(),
          L = _("button"),
          Y = G(`\u590D\u5236\u94FE\u63A5
        `),
          z = Ae("svg"),
          H = Ae("path"),
          h(l, "class", "mb-10"),
          h(a, "class", "group flex items-center py-4 text-lg font-semibold text-correct"),
          h(d, "class", "pr-2"),
          h(c, "class", "flex w-full items-center justify-between"),
          h(k, "class", "mt-8 w-full overflow-ellipsis border-2 border-neutral-600 bg-transparent p-2 transition duration-300 dark:border-neutral-400"),
          // k.value = y = n[5] ? n[4] : window.location.href,
          k.disabled = A = !n[5],
          k.readOnly = !0,
          U(k, "opacity-60", !n[5]),
          h(H, "stroke-linecap", "round"),
          h(H, "stroke-linejoin", "round"),
          h(H, "d", "M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"),
          h(z, "xmlns", "http://www.w3.org/2000/svg"),
          h(z, "class", "ml-1 h-6 w-6"),
          h(z, "fill", "none"),
          h(z, "viewBox", "0 0 24 24"),
          h(z, "stroke", "currentColor"),
          h(z, "stroke-width", "2"),
          h(L, "class", "flex items-center py-4 text-lg font-semibold text-correct transition-colors duration-300 disabled:text-neutral-400 disabled:dark:text-neutral-600"),
          L.disabled = X = !n[5],
          h(t, "class", "flex max-h-full flex-col items-center p-4"),
          h(e, "class", "flex h-full w-full items-center justify-center overflow-y-auto")
      },
      m(K, de) {
        g(K, e, de),
          m(e, t),
          m(t, l),
          m(t, s),
          j(r, t, null),
          m(t, u),
          m(t, a),
          m(t, f),
          m(t, c),
          m(c, d),
          m(c, p),
          j(w, c, null),
          m(t, $),
          m(t, k),
          m(t, I),
          m(t, L),
          m(L, Y),
          m(L, z),
          m(z, H),
          x = !0,
        ee || (Z = [J(a, "click", n[9]), J(L, "click", n[6])],
          ee = !0)
      },
      p(K, de) {
        const fe = {};
        !o && de & 2 && (o = !0,
          fe.text = K[1],
          ie(() => o = !1)),
        !i && de & 8 && (i = !0,
          fe.results = K[3],
          ie(() => i = !1)),
          r.$set(fe);
        const Te = {};
        de & 4 && (Te.checked = K[2]),
          w.$set(Te),
          // (!x || de & 48 && y !== (y = K[5] ? K[4] : window.location.href) && k.value !== y) && (k.value = y),
        (!x || de & 32 && A !== (A = !K[5])) && (k.disabled = A),
        de & 32 && U(k, "opacity-60", !K[5]),
        (!x || de & 32 && X !== (X = !K[5])) && (L.disabled = X)
      },
      i(K) {
        x || (C(r.$$.fragment, K),
          C(w.$$.fragment, K),
          x = !0)
      },
      o(K) {
        M(r.$$.fragment, K),
          M(w.$$.fragment, K),
          x = !1
      },
      d(K) {
        K && b(e),
          N(r),
          N(w),
          ee = !1,
          tt(Z)
      }
    }
}

function ro(n) {
  let e, t, l;

  function s(o) {
    n[11](o)
  }

  let r = {
    fullscreen: !0,
    title: "\u51FA\u9898\u5206\u4EAB",
    $$slots: {
      default: [oo]
    },
    $$scope: {
      ctx: n
    }
  };
  return n[0] !== void 0 && (r.open = n[0]),
    e = new ht({
      props: r
    }),
    V.push(() => ue(e, "open", s)),
    {
      c() {
        D(e.$$.fragment)
      },
      m(o, i) {
        j(e, o, i),
          l = !0
      },
      p(o, [i]) {
        const u = {};
        i & 8254 && (u.$$scope = {
          dirty: i,
          ctx: o
        }),
        !t && i & 1 && (t = !0,
          u.open = o[0],
          ie(() => t = !1)),
          e.$set(u)
      },
      i(o) {
        l || (C(e.$$.fragment, o),
          l = !0)
      },
      o(o) {
        M(e.$$.fragment, o),
          l = !1
      },
      d(o) {
        N(e, o)
      }
    }
}

function io(n, e, t) {
  let l, s, {open: r} = e, o = Rn().split(""), i = !1;
  const u = nt();
  let a = new Array(ce).fill({
    shadows: [],
    match: !1,
    percent: 0
  });

  function f() {
    var k;
    Oe.then(y => y.logEvent(so)),
      (k = navigator == null ? void 0 : navigator.clipboard) != null && k.writeText ? navigator.clipboard.writeText(l).then(() => {
          u("toast", "\u5DF2\u6210\u529F\u590D\u5236\u5230\u526A\u8D34\u7248")
        }
      ).catch(() => {
          u("toast", "\u94FE\u63A5\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u590D\u5236")
        }
      ) : u("toast", "\u94FE\u63A5\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u590D\u5236")
  }

  function c(k) {
    o = k,
      t(1, o)
  }

  function d(k) {
    a = k,
      t(3, a)
  }

  const p = () => t(1, o = Rn().split(""))
    , w = () => {
      t(2, i = !i)
    }
  ;

  function $(k) {
    r = k,
      t(0, r)
  }

  return n.$$set = k => {
    "open" in k && t(0, r = k.open)
  }
    ,
    n.$$.update = () => {
      n.$$.dirty & 6 && t(4, l = Yl(o.join(""), i)),
      n.$$.dirty & 2 && t(5, s = cl(o.join("")))
    }
    ,
    [r, o, i, a, l, s, f, c, d, p, w, $]
}

class uo extends se {
  constructor(e) {
    super();
    oe(this, e, io, ro, re, {
      open: 0
    })
  }
}

function fo(n) {
  let e, t, l, s, r;
  return {
    c() {
      e = _("div"),
        t = _("img"),
        s = R(),
        r = _("div"),
        r.textContent = "\u957F\u6309\u56FE\u7247\u5206\u4EAB\u{1F446}",
      dn(t.src, l = n[1]) || h(t, "src", l),
        h(t, "alt", "ci-ying"),
        h(t, "class", "border border-neutral-400 dark:border-neutral-600"),
        h(r, "class", "mt-1"),
        h(e, "class", "flex w-full flex-col items-center overflow-y-auto p-4")
    },
    m(o, i) {
      g(o, e, i),
        m(e, t),
        m(e, s),
        m(e, r)
    },
    p(o, i) {
      i & 2 && !dn(t.src, l = o[1]) && h(t, "src", l)
    },
    d(o) {
      o && b(e)
    }
  }
}

function ao(n) {
  let e, t, l;

  function s(o) {
    n[2](o)
  }

  let r = {
    $$slots: {
      default: [fo]
    },
    $$scope: {
      ctx: n
    }
  };
  return n[0] !== void 0 && (r.open = n[0]),
    e = new ht({
      props: r
    }),
    V.push(() => ue(e, "open", s)),
    {
      c() {
        D(e.$$.fragment)
      },
      m(o, i) {
        j(e, o, i),
          l = !0
      },
      p(o, [i]) {
        const u = {};
        i & 10 && (u.$$scope = {
          dirty: i,
          ctx: o
        }),
        !t && i & 1 && (t = !0,
          u.open = o[0],
          ie(() => t = !1)),
          e.$set(u)
      },
      i(o) {
        l || (C(e.$$.fragment, o),
          l = !0)
      },
      o(o) {
        M(e.$$.fragment, o),
          l = !1
      },
      d(o) {
        N(e, o)
      }
    }
}

function co(n, e, t) {
  let {open: l} = e
    , {imageDataUrl: s} = e;

  function r(o) {
    l = o,
      t(0, l)
  }

  return n.$$set = o => {
    "open" in o && t(0, l = o.open),
    "imageDataUrl" in o && t(1, s = o.imageDataUrl)
  }
    ,
    [l, s, r]
}

class ho extends se {
  constructor(e) {
    super();
    oe(this, e, co, ao, re, {
      open: 0,
      imageDataUrl: 1
    })
  }
}

const po = Pl(new Date, n => {
      const e = setInterval(() => {
          n(new Date)
        }
        , 1e3);
      return () => {
        clearInterval(e)
      }
    }
  )
  , mo = fl + al * Vt
  , _o = ol(po, n => Math.floor(Math.max(mo - n.getTime(), 0) / 1e3))
  // , go = new Path2D("m9 0h2v1h-2zm3 0h1v1h1v1h-3v-1h1zm3 0h1v2h-1zm-7 1h1v1h2v2h-2v-1h-1zm6 1h1v2h2v1h-1v1h-1v3h-2v1h-1v-5h-1v-1h2v1h1zm-1 4h1v2h-1zm3-4h1v1h-1zm-8 2h1v1h1v1h-1v1h1v1h-2zm2 2h1v1h-1zm6 0h1v2h-1zm-16 2h2v1h1v2h-2v2h-1v-3h1v-1h-1zm3 0h1v1h-1zm3 0h2v1h-2zm4 0h1v3h-3v-1h2zm8 0h3v1h-2v1h-1zm4 0h2v1h-2zm-18 1h1v1h2v1h-3zm12 0h1v1h-1zm8 0h1v2h-2v-1h1zm-11 2h3v1h-2v1h-1v1h2v4h-1v-2h-1v2h-2v-1h1v-1h-1v1h-2v-1h1v-1h-1v1h-1v-1h-4v2h-4v-1h1v-1h2v-1h2v-2h3v1h-2v1h2v-1h3v1h1v-1h-1v-1h2zm4 0h1v1h-1zm2 0h2v1h-2zm-1 1h1v1h1v1h1v2h-1v-1h-1v-1h-2v-1h1zm3 0h1v1h1v2h-1v-1h-1zm2 0h2v3h-1v-2h-1zm-22 1h2v1h-2zm-1 1h1v1h-1zm16 0h1v1h-1zm1 1h2v1h-2zm6 0h1v1h-1zm-18 1h3v1h-3zm16 0h2v1h-1v2h1v1h-1v1h1v2h-1v-1h-1v1h-2v-2h2zm-13 1h1v1h2v1h-1v1h-1v-1h-1zm16 0h1v2h-2v-1h1zm-11 1h1v1h-1zm2 0h1v1h-1zm-4 1h2v1h-1v1h-1zm2 1h2v2h1v1h-2v-1h-1v1h1v2h-1v-1h-1v-3h1zm-5 1h1v1h-1zm1 1h1v2h-1v1h-1v-2h1zm8 0h1v1h-1zm7 0h1v1h-1zm-8 1h1v1h1v1h-3v-1h1zm5 0h1v1h-1zm-11 1h1v1h-1zm9 0h1v1h-1zm4 0h2v1h-2zm-23-24h7v7h-7v-7zm1 1h5v5h-5v-5zm1 1h3v3h-3v-3zm16-2h7v7h-7v-7zm1 1h5v5h-5v-5zm1 1h3v3h-3v-3zm-20 16h7v7h-7v-7zm1 1h5v5h-5v-5zm1 1h3v3h-3v-3zm14-4h5v5h-5v-5zm1 1h3v3h-3v-3zm1 1h1v1h-1v-1z")
  , hl = "AR PL KaitiM GB"
  , Ln = 25
  , zn = 48
  , rt = 8
  , wt = 24
  , On = 4
  , bo = 8
  , it = 4
  , wo = 18
  , $e = 64
  , ge = 2
  , Bt = 24
  , Dt = 8
  , pl = "#000000"
  , Zt = "#ffffff"
  , ml = "#0d9489"
  , vo = {
    text: pl,
    bg: Zt,
    border: "#a3a3a3"
  }
  , ko = {
    text: Zt,
    bg: "#171717",
    border: "#525252"
  };

function $o(n, e, t) {
  const l = je(Ct);
  n.scale($e / 1024, -$e / 1024),
    n.translate(0, -900),
    e.shadows.forEach(s => {
        const r = new Path2D(s.stroke);
        n.save(),
          n.translate(s.shiftX, s.shiftY),
          s.distance === 0 ? n.fillStyle = ml : (n.globalAlpha = (l.presentThreshold - Math.max(s.distance, l.correctThreshold)) / (l.presentThreshold - l.correctThreshold),
            n.fillStyle = t.text),
          n.fill(r),
          n.restore()
      }
    )
}

function Yt(n, e, t) {
  n.resetTransform(),
    n.translate(Bt + ($e + Dt) * e, Bt + ($e + Dt) * t)
}

function Bn(n, e) {
  n.fillStyle = e,
    n.fillRect(-ge, -ge, $e + ge * 2, $e + ge * 2)
}

function So(n, e) {
  n.strokeStyle = e,
    n.lineWidth = ge,
    n.strokeRect(-ge / 2, -ge / 2, $e + ge, $e + ge)
}

function Dn(n, e, t, l) {
  n.font = `${wt}px "${hl}"`,
    n.strokeStyle = l.border,
    n.lineWidth = ge,
    n.strokeRect(t, rt - ge, wt + it * 2, wt + it * 2),
    n.fillText(e, t + it, rt - ge + it)
}

function yo() {
  const n = je(Ke) ? ko : vo
    , e = je(ae)
    , t = je(Lt)
  // , l = document.createElement("canvas");
  l.width = Bt * 2 + ($e + Dt) * (ce - 1) + $e,
    l.height = Bt * 2 + ($e + Dt) * e.rowIndex + $e + rt;
  const s = l.getContext("2d");
  s.fillStyle = n.bg,
    s.fillRect(0, 0, l.width, l.height),
    s.fillStyle = n.text,
    Yt(s, 0, e.rowIndex),
    s.font = `${zn}px "${hl}"`,
    s.textBaseline = "top",
    s.fillText("\u8BCD\u5F71", 0, rt - ge);
  let r = zn * 2 + bo;
  he && (Dn(s, "\u6311", r, n),
    r += (it + ge) * 2 + wt + On),
  e.hardMode && (Dn(s, "\u96BE", r, n),
    r += (it + ge) * 2 + wt + On),
    s.fillStyle = n.text,
    s.font = `${wo}px serif`,
    s.textBaseline = "bottom",
    s.fillText("Surprising Studio " + (e.gameStatus === le.WIN ? "\u{1F60E}" : "\u{1F62D}"), 0, rt + $e + ge),
    Yt(s, ce - 1, e.rowIndex),
    s.translate(0, rt),
    Bn(s, Zt),
    s.fillStyle = pl,
    s.scale($e / Ln, $e / Ln),
    s.fill(go, "evenodd");
  for (let o = 0; o < e.rowIndex; o += 1)
    for (let i = 0; i < ce; i += 1) {
      const u = t[o][i];
      Yt(s, i, o),
        u.match ? Bn(s, ml) : (So(s, n.border),
          $o(s, u, n))
    }
  return l
}

function jn(n, e, t) {
  const l = n.slice();
  l[17] = e[t],
    l[20] = t;
  const s = l[9].gameStatus === le.WIN && l[9].rowIndex === l[20] + 1 && he === void 0;
  return l[18] = s,
    l
}

function Nn(n, e, t) {
  const l = n.slice();
  return l[21] = e[t][0],
    l[22] = e[t][1],
    l
}

function Gn(n) {
  let e, t, l = n[21] + "", s, r, o, i = n[22] + "", u, a;
  return {
    c() {
      e = _("div"),
        t = _("div"),
        s = G(l),
        r = R(),
        o = _("div"),
        u = G(i),
        a = R(),
        h(t, "class", "flex justify-center text-4xl"),
        h(o, "class", "flex justify-center whitespace-pre-line text-sm"),
        h(e, "class", "flex-1 px-2 text-center")
    },
    m(f, c) {
      g(f, e, c),
        m(e, t),
        m(t, s),
        m(e, r),
        m(e, o),
        m(o, u),
        m(e, a)
    },
    p(f, c) {
      c & 4 && l !== (l = f[21] + "") && Ce(s, l),
      c & 4 && i !== (i = f[22] + "") && Ce(u, i)
    },
    d(f) {
      f && b(e)
    }
  }
}

function Eo(n) {
  let e;
  return {
    c() {
      e = _("div"),
        e.textContent = "\u65E0\u6570\u636E",
        h(e, "class", "text-center")
    },
    m(t, l) {
      g(t, e, l)
    },
    p: B,
    d(t) {
      t && b(e)
    }
  }
}

function Co(n) {
  let e, t = n[1], l = [];
  for (let s = 0; s < t.length; s += 1)
    l[s] = Hn(jn(n, t, s));
  return {
    c() {
      e = _("div");
      for (let s = 0; s < l.length; s += 1)
        l[s].c();
      h(e, "class", "w-4/5 pb-2")
    },
    m(s, r) {
      g(s, e, r);
      for (let o = 0; o < l.length; o += 1)
        l[o].m(e, null)
    },
    p(s, r) {
      if (r & 770) {
        t = s[1];
        let o;
        for (o = 0; o < t.length; o += 1) {
          const i = jn(s, t, o);
          l[o] ? l[o].p(i, r) : (l[o] = Hn(i),
            l[o].c(),
            l[o].m(e, null))
        }
        for (; o < l.length; o += 1)
          l[o].d(1);
        l.length = t.length
      }
    },
    d(s) {
      s && b(e),
        Qe(l, s)
    }
  }
}

function Hn(n) {
  let e, t, l = n[20] + 1 + "", s, r, o, i, u = n[17] + "", a, f;
  return {
    c() {
      e = _("div"),
        t = _("div"),
        s = G(l),
        r = R(),
        o = _("div"),
        i = _("div"),
        a = G(u),
        f = R(),
        h(t, "class", "w-2 text-center"),
        h(i, "class", "pr-2 text-right font-bold text-white"),
        hn(i, "width", Math.round(100 * n[17] / n[8]) + "%"),
        U(i, "bg-correct", n[18]),
        U(i, "bg-neutral-500", !n[18]),
        U(i, "dark:bg-neutral-700", !n[18]),
        h(o, "class", "h-full w-full pl-2"),
        h(e, "class", "flex pb-1 text-sm")
    },
    m(c, d) {
      g(c, e, d),
        m(e, t),
        m(t, s),
        m(e, r),
        m(e, o),
        m(o, i),
        m(i, a),
        m(e, f)
    },
    p(c, d) {
      d & 2 && u !== (u = c[17] + "") && Ce(a, u),
      d & 258 && hn(i, "width", Math.round(100 * c[17] / c[8]) + "%"),
      d & 512 && U(i, "bg-correct", c[18]),
      d & 512 && U(i, "bg-neutral-500", !c[18]),
      d & 512 && U(i, "dark:bg-neutral-700", !c[18])
    },
    d(c) {
      c && b(e)
    }
  }
}

function Un(n) {
  let e, t, l, s, r, o, i, u, a, f, c, d;

  function p(A, I) {
    return (A[9].dailyConsumedQuota || 0) >= Ye ? Io : To
  }

  let w = p(n)
    , $ = w(n)
    , k = (n[9].dailyConsumedQuota || 0) < Ye && Wn(n)
    , y = (n[9].dailyConsumedQuota || 0) >= Ye && qn(n);
  return {
    c() {
      e = _("div"),
        t = _("div"),
        $.c(),
        l = R(),
        s = _("div"),
        r = _("button"),
        r.innerHTML = `\u5206\u4EAB
            <svg xmlns="http://www.w3.org/2000/svg" class="ml-2 h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>`,
        o = R(),
      k && k.c(),
        i = R(),
        u = _("div"),
        u.innerHTML = `<div class="px-2">\u52A0\u5165\u793E\u533A\u8FDB\u884C\u5206\u4EAB\u4E0E\u8BA8\u8BBA</div>
        <a href="https://weibo.com/p/100808b5c34b03eccd029f9863fdfed68282ab" class="flex rounded border border-neutral-400 p-2 dark:border-neutral-600" target="_blank"><img class="mr-1 h-6 w-6" src="http://www.sinaimg.cn/blog/developer/wiki/LOGO_64x64.png" alt="\u5FAE\u535A"/>
          \u5FAE\u535A</a>`,
        a = R(),
      y && y.c(),
        f = dt(),
        h(t, "class", "w-1/2 border-r border-black pr-3 dark:border-white"),
        h(r, "class", "flex h-14 w-4/5 items-center justify-center rounded bg-correct text-xl font-bold text-white hover:opacity-90"),
        h(s, "class", "flex w-1/2 items-center justify-center pl-3"),
        h(e, "class", "mt-2 flex w-full"),
        h(u, "class", "mt-4 flex items-center")
    },
    m(A, I) {
      g(A, e, I),
        m(e, t),
        $.m(t, null),
        m(e, l),
        m(e, s),
        m(s, r),
        m(e, o),
      k && k.m(e, null),
        g(A, i, I),
        g(A, u, I),
        g(A, a, I),
      y && y.m(A, I),
        g(A, f, I),
      c || (d = J(r, "click", n[10]),
        c = !0)
    },
    p(A, I) {
      w === (w = p(A)) && $ ? $.p(A, I) : ($.d(1),
        $ = w(A),
      $ && ($.c(),
        $.m(t, null))),
        (A[9].dailyConsumedQuota || 0) < Ye ? k ? k.p(A, I) : (k = Wn(A),
          k.c(),
          k.m(e, null)) : k && (k.d(1),
          k = null),
        (A[9].dailyConsumedQuota || 0) >= Ye ? y ? y.p(A, I) : (y = qn(A),
          y.c(),
          y.m(f.parentNode, f)) : y && (y.d(1),
          y = null)
    },
    d(A) {
      A && b(e),
        $.d(),
      k && k.d(),
      A && b(i),
      A && b(u),
      A && b(a),
      y && y.d(A),
      A && b(f),
        c = !1,
        d()
    }
  }
}

function To(n) {
  let e, t, l, s = `${n[9].dailyConsumedQuota || 0} / ${Ye}`, r;
  return {
    c() {
      e = _("div"),
        t = G(`\u4ECA\u65E5\u8FDB\u5EA6
              `),
        l = _("div"),
        r = G(s),
        h(e, "class", "text-md my-2 font-bold flex flex-col items-center")
    },
    m(o, i) {
      g(o, e, i),
        m(e, t),
        m(e, l),
        m(l, r)
    },
    p(o, i) {
      i & 512 && s !== (s = `${o[9].dailyConsumedQuota || 0} / ${Ye}`) && Ce(r, s)
    },
    d(o) {
      o && b(e)
    }
  }
}

function Io(n) {
  let e, t, l, s = `${ot(n[7])}:${ot(n[6])}:${ot(n[5])}`, r;
  return {
    c() {
      e = _("h2"),
        e.textContent = "\u4E0B\u4E00\u6B21\u8BCD\u5F71",
        t = R(),
        l = _("div"),
        r = G(s),
        h(e, "class", "my-2 text-center font-bold"),
        h(l, "class", "flex justify-center text-4xl tracking-wider")
    },
    m(o, i) {
      g(o, e, i),
        g(o, t, i),
        g(o, l, i),
        m(l, r)
    },
    p(o, i) {
      i & 224 && s !== (s = `${ot(o[7])}:${ot(o[6])}:${ot(o[5])}`) && Ce(r, s)
    },
    d(o) {
      o && b(e),
      o && b(t),
      o && b(l)
    }
  }
}

function Wn(n) {
  let e, t,
    l = he ? n[9].gameStatus === le.WIN ? "\u6B63\u5E38\u6A21\u5F0F" : "\u518D\u8BD5\u4E00\u6B21" : "\u518D\u6765\u4E00\u5C40",
    s, r, o;
  return {
    c() {
      e = _("div"),
        t = _("button"),
        s = G(l),
        h(t, "class", "flex h-14 w-4/5 flex-col items-center justify-center rounded bg-correct text-xl font-bold text-white hover:opacity-90"),
        h(e, "class", "flex w-1/2 items-center justify-center pl-3")
    },
    m(i, u) {
      g(i, e, u),
        m(e, t),
        m(t, s),
      r || (o = J(t, "click", n[11]),
        r = !0)
    },
    p(i, u) {
      u & 512 && l !== (l = he ? i[9].gameStatus === le.WIN ? "\u6B63\u5E38\u6A21\u5F0F" : "\u518D\u8BD5\u4E00\u6B21" : "\u518D\u6765\u4E00\u5C40") && Ce(s, l)
    },
    d(i) {
      i && b(e),
        r = !1,
        o()
    }
  }
}

function qn(n) {
  let e, t, l;
  return {
    c() {
      e = _("div"),
        e.innerHTML = '\u6216\u4EB2\u81EA<span class="px-0.5 text-correct">\u51FA\u9898</span>\u5E76\u5206\u4EAB\u7ED9\u670B\u53CB\u3001\u793E\u533A',
        h(e, "class", "mt-6")
    },
    m(s, r) {
      g(s, e, r),
      t || (l = J(e, "click", n[12]),
        t = !0)
    },
    p: B,
    d(s) {
      s && b(e),
        t = !1,
        l()
    }
  }
}

function Mo(n) {
  let e, t, l, s, r, o, i, u,
    a = [[n[2].gamesPlayed, "\u573A\u6B21"], [n[2].winPercentage, "\u80DC\u7387 %"], [n[2].currentStreak, `\u5F53\u524D
\u8FDE\u80DC`], [n[2].maxStreak, `\u6700\u5927
\u8FDE\u80DC`]], f = [];
  for (let $ = 0; $ < 4; $ += 1)
    f[$] = Gn(Nn(n, a, $));

  function c($, k) {
    return $[2].gamesPlayed > 0 ? Co : Eo
  }

  let d = c(n)
    , p = d(n)
    , w = n[9].gameStatus !== le.IN_PROGRESS && Un(n);
  return {
    c() {
      e = _("div"),
        t = _("h1"),
        t.textContent = "\u7EDF\u8BA1",
        l = R(),
        s = _("div");
      for (let $ = 0; $ < 4; $ += 1)
        f[$].c();
      r = R(),
        o = _("h1"),
        o.textContent = "\u5386\u53F2\u731C\u6D4B\u6B21\u6570",
        i = R(),
        p.c(),
        u = R(),
      w && w.c(),
        h(t, "class", "my-2 text-center font-bold"),
        h(s, "class", "flex pb-2"),
        h(o, "class", "my-2 text-center font-bold"),
        h(e, "class", "flex w-full flex-col items-center overflow-y-auto px-4 py-8")
    },
    m($, k) {
      g($, e, k),
        m(e, t),
        m(e, l),
        m(e, s);
      for (let y = 0; y < 4; y += 1)
        f[y].m(s, null);
      m(e, r),
        m(e, o),
        m(e, i),
        p.m(e, null),
        m(e, u),
      w && w.m(e, null)
    },
    p($, k) {
      if (k & 4) {
        a = [[$[2].gamesPlayed, "\u573A\u6B21"], [$[2].winPercentage, "\u80DC\u7387 %"], [$[2].currentStreak, `\u5F53\u524D
\u8FDE\u80DC`], [$[2].maxStreak, `\u6700\u5927
\u8FDE\u80DC`]];
        let y;
        for (y = 0; y < 4; y += 1) {
          const A = Nn($, a, y);
          f[y] ? f[y].p(A, k) : (f[y] = Gn(A),
            f[y].c(),
            f[y].m(s, null))
        }
        for (; y < 4; y += 1)
          f[y].d(1)
      }
      d === (d = c($)) && p ? p.p($, k) : (p.d(1),
        p = d($),
      p && (p.c(),
        p.m(e, u))),
        $[9].gameStatus !== le.IN_PROGRESS ? w ? w.p($, k) : (w = Un($),
          w.c(),
          w.m(e, null)) : w && (w.d(1),
          w = null)
    },
    d($) {
      $ && b(e),
        Qe(f, $),
        p.d(),
      w && w.d()
    }
  }
}

function Ro(n) {
  let e, t, l, s, r, o;

  function i(c) {
    n[14](c)
  }

  let u = {
    $$slots: {
      default: [Mo]
    },
    $$scope: {
      ctx: n
    }
  };
  n[0] !== void 0 && (u.open = n[0]),
    e = new ht({
      props: u
    }),
    V.push(() => ue(e, "open", i));

  function a(c) {
    n[15](c)
  }

  let f = {
    imageDataUrl: n[3]
  };
  return n[4] !== void 0 && (f.open = n[4]),
    s = new ho({
      props: f
    }),
    V.push(() => ue(s, "open", a)),
    {
      c() {
        D(e.$$.fragment),
          l = R(),
          D(s.$$.fragment)
      },
      m(c, d) {
        j(e, c, d),
          g(c, l, d),
          j(s, c, d),
          o = !0
      },
      p(c, [d]) {
        const p = {};
        d & 33555430 && (p.$$scope = {
          dirty: d,
          ctx: c
        }),
        !t && d & 1 && (t = !0,
          p.open = c[0],
          ie(() => t = !1)),
          e.$set(p);
        const w = {};
        d & 8 && (w.imageDataUrl = c[3]),
        !r && d & 16 && (r = !0,
          w.open = c[4],
          ie(() => r = !1)),
          s.$set(w)
      },
      i(c) {
        o || (C(e.$$.fragment, c),
          C(s.$$.fragment, c),
          o = !0)
      },
      o(c) {
        M(e.$$.fragment, c),
          M(s.$$.fragment, c),
          o = !1
      },
      d(c) {
        N(e, c),
        c && b(l),
          N(s, c)
      }
    }
}

function ot(n) {
  return n < 10 ? `0${n}` : `${n}`
}

function Ao(n, e, t) {
  let l, s, r, o, i, u, a, f;
  me(n, ae, L => t(9, u = L)),
    me(n, _o, L => t(13, a = L)),
    me(n, bt, L => t(2, f = L));
  let {open: c} = e
    , d = ""
    , p = !1;
  const w = nt();

  function $() {
    const L = yo();
    t(3, d = L.toDataURL()),
      t(4, p = !0),
      Oe.then(Y => Y.logEvent(no))
  }

  function k() {
    Re(ae, u.solution = "", u),
      ae.commit()
    // u.gameStatus === le.WIN ? window.location.href = `${window.location.protocol}//${window.location.host}${window.location.pathname}` : location.reload()
  }

  function y() {
    w("openSelfPubslish")
  }

  function A(L) {
    c = L,
      t(0, c)
  }

  function I(L) {
    p = L,
      t(4, p)
  }

  return n.$$set = L => {
    "open" in L && t(0, c = L.open)
  }
    ,
    n.$$.update = () => {
      n.$$.dirty & 4 && t(1, l = Array.from({
        length: Ne
      }, (L, Y) => f.guesses[Y + 1])),
      n.$$.dirty & 2 && t(8, s = Math.max(...l, 1)),
      n.$$.dirty & 8192 && t(7, r = Math.floor(a / 3600)),
      n.$$.dirty & 8192 && t(6, o = Math.floor(a / 60) % 60),
      n.$$.dirty & 8192 && t(5, i = a % 60)
    }
    ,
    [c, l, f, d, p, i, o, r, s, u, $, k, y, a, A, I]
}

class Po extends se {
  constructor(e) {
    super();
    oe(this, e, Ao, Ro, re, {
      open: 0
    })
  }
}

function Lo(n) {
  let e, t, l, s, r, o, i, u, a;
  const f = n[3].default
    , c = ct(f, n, n[2], null);
  return {
    c() {
      e = _("div"),
        t = _("div"),
        l = _("div"),
        s = G(n[0]),
        r = R(),
        o = _("div"),
        i = G(n[1]),
        u = R(),
      c && c.c(),
        h(l, "class", "text-lg"),
        h(o, "class", "text-xs opacity-50"),
        h(t, "class", "pr-2"),
        h(e, "class", "flex items-center justify-between border-b border-neutral-300 p-4 dark:border-neutral-700")
    },
    m(d, p) {
      g(d, e, p),
        m(e, t),
        m(t, l),
        m(l, s),
        m(t, r),
        m(t, o),
        m(o, i),
        m(e, u),
      c && c.m(e, null),
        a = !0
    },
    p(d, [p]) {
      (!a || p & 1) && Ce(s, d[0]),
      (!a || p & 2) && Ce(i, d[1]),
      c && c.p && (!a || p & 4) && ut(c, f, d, d[2], a ? at(f, d[2], p, null) : ft(d[2]), null)
    },
    i(d) {
      a || (C(c, d),
        a = !0)
    },
    o(d) {
      M(c, d),
        a = !1
    },
    d(d) {
      d && b(e),
      c && c.d(d)
    }
  }
}

function zo(n, e, t) {
  let {$$slots: l = {}, $$scope: s} = e
    , {title: r} = e
    , {subtitle: o = ""} = e;
  return n.$$set = i => {
    "title" in i && t(0, r = i.title),
    "subtitle" in i && t(1, o = i.subtitle),
    "$$scope" in i && t(2, s = i.$$scope)
  }
    ,
    [r, o, s, l]
}

class _t extends se {
  constructor(e) {
    super();
    oe(this, e, zo, Lo, re, {
      title: 0,
      subtitle: 1
    })
  }
}

const St = !1;

// St.subscribe(()=>St.commit());
function Oo(n) {
  let e, t;
  return e = new It({
    props: {
      checked: n[2].hardMode
    }
  }),
    e.$on("click", n[7]),
    {
      c() {
        D(e.$$.fragment)
      },
      m(l, s) {
        j(e, l, s),
          t = !0
      },
      p(l, s) {
        const r = {};
        s & 4 && (r.checked = l[2].hardMode),
          e.$set(r)
      },
      i(l) {
        t || (C(e.$$.fragment, l),
          t = !0)
      },
      o(l) {
        M(e.$$.fragment, l),
          t = !1
      },
      d(l) {
        N(e, l)
      }
    }
}

function Bo(n) {
  let e, t;
  return e = new It({
    props: {
      checked: n[3]
    }
  }),
    e.$on("click", n[8]),
    {
      c() {
        D(e.$$.fragment)
      },
      m(l, s) {
        j(e, l, s),
          t = !0
      },
      p(l, s) {
        const r = {};
        s & 8 && (r.checked = l[3]),
          e.$set(r)
      },
      i(l) {
        t || (C(e.$$.fragment, l),
          t = !0)
      },
      o(l) {
        M(e.$$.fragment, l),
          t = !1
      },
      d(l) {
        N(e, l)
      }
    }
}

function Do(n) {
  let e, t;
  return e = new It({
    props: {
      checked: n[4]
    }
  }),
    e.$on("click", n[9]),
    {
      c() {
        D(e.$$.fragment)
      },
      m(l, s) {
        j(e, l, s),
          t = !0
      },
      p(l, s) {
        const r = {};
        s & 16 && (r.checked = l[4]),
          e.$set(r)
      },
      i(l) {
        t || (C(e.$$.fragment, l),
          t = !0)
      },
      o(l) {
        M(e.$$.fragment, l),
          t = !1
      },
      d(l) {
        N(e, l)
      }
    }
}

function jo(n) {
  let e, t;
  return e = new It({
    props: {
      checked: n[5]
    }
  }),
    e.$on("click", n[10]),
    {
      c() {
        D(e.$$.fragment)
      },
      m(l, s) {
        j(e, l, s),
          t = !0
      },
      p(l, s) {
        const r = {};
        s & 32 && (r.checked = l[5]),
          e.$set(r)
      },
      i(l) {
        t || (C(e.$$.fragment, l),
          t = !0)
      },
      o(l) {
        M(e.$$.fragment, l),
          t = !1
      },
      d(l) {
        N(e, l)
      }
    }
}

function No(n) {
  let e, t, l;
  return {
    c() {
      e = _("a"),
        t = G("Email"),
        h(e, "class", "underline"),
        h(e, "href", l = "mailto:feedback@surprising.studio?subject=\u8BCD\u5F71\u53CD\u9988\u610F\u89C1&body=" + encodeURIComponent(n[1]))
    },
    m(s, r) {
      g(s, e, r),
        m(e, t)
    },
    p(s, r) {
      r & 2 && l !== (l = "mailto:feedback@surprising.studio?subject=\u8BCD\u5F71\u53CD\u9988\u610F\u89C1&body=" + encodeURIComponent(s[1])) && h(e, "href", l)
    },
    d(s) {
      s && b(e)
    }
  }
}

function Go(n) {
  let e, t, l, s, r, o, i, u, a, f, c;
  return t = new _t({
    props: {
      title: "\u56F0\u96BE\u6A21\u5F0F",
      subtitle: "\u589E\u52A0\u751F\u50FB\u6210\u8BED\uFF0C\u63D0\u9AD8\u5339\u914D\u96BE\u5EA6\uFF0C\u4E0D\u4FDD\u7559\u5339\u914D\u8BB0\u5F55",
      $$slots: {
        default: [Oo]
      },
      $$scope: {
        ctx: n
      }
    }
  }),
    s = new _t({
      props: {
        title: "\u6DF1\u8272\u4E3B\u9898",
        $$slots: {
          default: [Bo]
        },
        $$scope: {
          ctx: n
        }
      }
    }),
    o = new _t({
      props: {
        title: "\u65E7\u7248\u8F93\u5165\u6A21\u5F0F",
        subtitle: "\u82E5\u8F93\u5165\u9047\u5230\u56F0\u96BE\uFF0C\u8BF7\u5F00\u542F\u6B64\u9009\u9879",
        $$slots: {
          default: [Do]
        },
        $$scope: {
          ctx: n
        }
      }
    }),
    u = new _t({
      props: {
        title: "\u533F\u540D\u6570\u636E\u6536\u96C6",
        subtitle: "\u5F00\u542F\u4EE5\u4FBF\u6211\u4EEC\u66F4\u597D\u5730\u6539\u5584\u6E38\u620F",
        $$slots: {
          default: [jo]
        },
        $$scope: {
          ctx: n
        }
      }
    }),
    f = new _t({
      props: {
        title: "\u53CD\u9988\u610F\u89C1",
        $$slots: {
          default: [No]
        },
        $$scope: {
          ctx: n
        }
      }
    }),
    {
      c() {
        e = _("div"),
          D(t.$$.fragment),
          l = R(),
          D(s.$$.fragment),
          r = R(),
          D(o.$$.fragment),
          i = R(),
          D(u.$$.fragment),
          a = R(),
          D(f.$$.fragment),
          h(e, "class", "w-full overflow-y-auto")
      },
      m(d, p) {
        g(d, e, p),
          j(t, e, null),
          m(e, l),
          j(s, e, null),
          m(e, r),
          j(o, e, null),
          m(e, i),
          j(u, e, null),
          m(e, a),
          j(f, e, null),
          c = !0
      },
      p(d, p) {
        const w = {};
        p & 65540 && (w.$$scope = {
          dirty: p,
          ctx: d
        }),
          t.$set(w);
        const $ = {};
        p & 65544 && ($.$$scope = {
          dirty: p,
          ctx: d
        }),
          s.$set($);
        const k = {};
        p & 65552 && (k.$$scope = {
          dirty: p,
          ctx: d
        }),
          o.$set(k);
        const y = {};
        p & 65568 && (y.$$scope = {
          dirty: p,
          ctx: d
        }),
          u.$set(y);
        const A = {};
        p & 65538 && (A.$$scope = {
          dirty: p,
          ctx: d
        }),
          f.$set(A)
      },
      i(d) {
        c || (C(t.$$.fragment, d),
          C(s.$$.fragment, d),
          C(o.$$.fragment, d),
          C(u.$$.fragment, d),
          C(f.$$.fragment, d),
          c = !0)
      },
      o(d) {
        M(t.$$.fragment, d),
          M(s.$$.fragment, d),
          M(o.$$.fragment, d),
          M(u.$$.fragment, d),
          M(f.$$.fragment, d),
          c = !1
      },
      d(d) {
        d && b(e),
          N(t),
          N(s),
          N(o),
          N(u),
          N(f)
      }
    }
}

function Ho(n) {
  let e, t, l, s;
  return {
    c() {
      e = _("div"),
        t = _("div"),
        t.innerHTML = '\xA9 2022 <a href="https://surprising.studio/" class="underline">Surprising Studio</a>',
        l = R(),
        s = _("div"),
        s.textContent = `#${Vt}`,
        h(e, "slot", "footer"),
        h(e, "class", "flex w-full justify-between p-4")
    },
    m(r, o) {
      g(r, e, o),
        m(e, t),
        m(e, l),
        m(e, s)
    },
    p: B,
    d(r) {
      r && b(e)
    }
  }
}

function Uo(n) {
  let e, t, l;

  function s(o) {
    n[11](o)
  }

  let r = {
    title: "\u8BBE\u7F6E",
    $$slots: {
      footer: [Ho],
      default: [Go]
    },
    $$scope: {
      ctx: n
    }
  };
  return n[0] !== void 0 && (r.open = n[0]),
    e = new ht({
      props: r
    }),
    V.push(() => ue(e, "open", s)),
    {
      c() {
        D(e.$$.fragment)
      },
      m(o, i) {
        j(e, o, i),
          l = !0
      },
      p(o, [i]) {
        const u = {};
        i & 65598 && (u.$$scope = {
          dirty: i,
          ctx: o
        }),
        !t && i & 1 && (t = !0,
          u.open = o[0],
          ie(() => t = !1)),
          e.$set(u)
      },
      i(o) {
        l || (C(e.$$.fragment, o),
          l = !0)
      },
      o(o) {
        M(e.$$.fragment, o),
          l = !1
      },
      d(o) {
        N(e, o)
      }
    }
}

function Wo(n, e, t) {
  let l, s, r, o;
  me(n, ae, I => t(2, l = I)),
    me(n, Ke, I => t(3, s = I)),
    me(n, St, I => t(4, r = I)),
    me(n, et, I => t(5, o = I));
  let {open: i} = e;
  const u = nt()
    , a = new Ll.exports.UAParser;
  let f = `


--
\u8BBE\u5907\u4FE1\u606F:
`;
  const c = a.getOS()
    , d = a.getBrowser();
  f += `\u64CD\u4F5C\u7CFB\u7EDF: ${c.name} ${c.version}
`,
    f += `\u6D4F\u89C8\u5668: ${d.name} ${d.version}
`
  // f += `\u5C4F\u5E55\u5206\u8FA8\u7387: ${window.screen.width} x ${window.screen.height}
// `
  // f += `\u7A97\u53E3\u5206\u8FA8\u7387: ${document.documentElement.clientWidth} x ${document.documentElement.clientHeight}
// `;
  const p = new Date().getTimezoneOffset() / -60;
  f += `\u65F6\u533A: UTC${p < 0 ? "" : "+"}${p}
`,
    f += `\u6E38\u620F\u7248\u672C\u53F7: ${Gl}
`;
  const w = I => {
    he ? (u("toast", "\u4E0D\u80FD\u5728\u6311\u6218\u6A21\u5F0F\u4E2D\u66F4\u6539\u96BE\u5EA6"),
      I.preventDefault()) : l.rowIndex !== 0 ? (u("toast", "\u53EA\u80FD\u5728\u6E38\u620F\u5F00\u59CB\u524D\u4FEE\u6539"),
      I.preventDefault()) : (Re(ae, l.hardMode = !l.hardMode, l),
      Oe.then(L => {
          L.logEvent(qt("HARD_MODE", l.hardMode))
        }
      ))
  }
    , $ = () => {
    Re(Ke, s = !s, s),
      Oe.then(I => {
          I.logEvent(qt("DARK_MODE", s))
        }
      )
  }
    , k = () => {
    Re(St, r = !r, r),
      Oe.then(I => {
          I.logEvent(qt("LEGACY_INPUT", r))
        }
      )
  }
    , y = () => Re(et, o = !o, o);

  function A(I) {
    i = I,
      t(0, i)
  }

  return n.$$set = I => {
    "open" in I && t(0, i = I.open)
  }
    ,
    [i, f, l, s, r, o, u, w, $, k, y, A]
}

class qo extends se {
  constructor(e) {
    super();
    oe(this, e, Wo, Uo, re, {
      open: 0
    })
  }
}

function Yo(n) {
  let e, t;
  return {
    c() {
      e = _("div"),
        t = G(n[0]),
        h(e, "class", "relative m-4 rounded bg-black p-4 font-bold text-white dark:bg-white dark:text-neutral-900")
    },
    m(l, s) {
      g(l, e, s),
        m(e, t)
    },
    p(l, [s]) {
      s & 1 && Ce(t, l[0])
    },
    i: B,
    o: B,
    d(l) {
      l && b(e)
    }
  }
}

function Fo(n, e, t) {
  let {text: l} = e
    , {duration: s = 1e3} = e
    , {infinity: r = !1} = e;
  const o = nt();
  return r || setTimeout(() => {
      o("timeout")
    }
    , s),
    n.$$set = i => {
      "text" in i && t(0, l = i.text),
      "duration" in i && t(1, s = i.duration),
      "infinity" in i && t(2, r = i.infinity)
    }
    ,
    [l, s, r]
}

class Qo extends se {
  constructor(e) {
    super();
    oe(this, e, Fo, Yo, re, {
      text: 0,
      duration: 1,
      infinity: 2
    })
  }
}

function Yn(n, e, t) {
  const l = n.slice();
  return l[6] = e[t].index,
    l[7] = e[t].text,
    l[8] = e[t].duration,
    l[9] = e[t].infinity,
    l
}

function Fn(n, e) {
  let t, l, s, r, o;

  function i() {
    return e[4](e[6])
  }

  return l = new Qo({
    props: {
      text: e[7],
      duration: e[8],
      infinity: e[9]
    }
  }),
    l.$on("timeout", i),
    {
      key: n,
      first: null,
      c() {
        t = _("div"),
          D(l.$$.fragment),
          s = R(),
          this.first = t
      },
      m(u, a) {
        g(u, t, a),
          j(l, t, null),
          m(t, s),
          o = !0
      },
      p(u, a) {
        e = u;
        const f = {};
        a & 2 && (f.text = e[7]),
        a & 2 && (f.duration = e[8]),
        a & 2 && (f.infinity = e[9]),
          l.$set(f)
      },
      i(u) {
        o || (C(l.$$.fragment, u),
        r && r.end(1),
          o = !0)
      },
      o(u) {
        M(l.$$.fragment, u),
          r = rl(t, vt, {}),
          o = !1
      },
      d(u) {
        u && b(t),
          N(l),
        u && r && r.end()
      }
    }
}

function Ko(n) {
  let e, t = [], l = new Map, s, r, o = n[1];
  const i = u => u[6];
  for (let u = 0; u < o.length; u += 1) {
    let a = Yn(n, o, u)
      , f = i(a);
    l.set(f, t[u] = Fn(f, a))
  }
  return {
    c() {
      e = _("div");
      for (let u = 0; u < t.length; u += 1)
        t[u].c();
      h(e, "class", s = n[0] + " absolute top-[10%] flex w-full flex-col items-center")
    },
    m(u, a) {
      g(u, e, a);
      for (let f = 0; f < t.length; f += 1)
        t[f].m(e, null);
      r = !0
    },
    p(u, [a]) {
      a & 6 && (o = u[1],
        be(),
        t = zl(t, a, i, 1, u, o, l, e, Ol, Fn, null, Yn),
        we()),
      (!r || a & 1 && s !== (s = u[0] + " absolute top-[10%] flex w-full flex-col items-center")) && h(e, "class", s)
    },
    i(u) {
      if (!r) {
        for (let a = 0; a < o.length; a += 1)
          C(t[a]);
        r = !0
      }
    },
    o(u) {
      for (let a = 0; a < t.length; a += 1)
        M(t[a]);
      r = !1
    },
    d(u) {
      u && b(e);
      for (let a = 0; a < t.length; a += 1)
        t[a].d()
    }
  }
}

function Vo(n, e, t) {
  let l = []
    , s = 0
    , {class: r = ""} = e;

  function o(a, f, c) {
    t(1, l = [{
      index: s,
      text: a,
      duration: f,
      infinity: c
    }, ...l]),
      s += 1
  }

  function i(a) {
    t(1, l = l.filter(f => f.index != a))
  }

  const u = a => i(a);
  return n.$$set = a => {
    "class" in a && t(0, r = a.class)
  }
    ,
    [r, l, i, o, u]
}

class Qn extends se {
  constructor(e) {
    super();
    oe(this, e, Vo, Ko, re, {
      class: 0,
      toast: 3
    })
  }

  get toast() {
    return this.$$.ctx[3]
  }
}

function Kn(n, e, t) {
  const l = n.slice();
  return l[8] = e[t],
    l
}

function Xo(n) {
  return {
    c: B,
    m: B,
    p: B,
    d: B
  }
}

function Zo(n) {
  let e, t = n[6] && Jo(n);
  return {
    c() {
      t && t.c(),
        e = dt()
    },
    m(l, s) {
      t && t.m(l, s),
        g(l, e, s)
    },
    p(l, s) {
      l[6] && t.p(l, s)
    },
    d(l) {
      t && t.d(l),
      l && b(e)
    }
  }
}

function Jo(n) {
  let e, t = n[6].pinyin.trim().split(/\s+/), l = [];
  for (let s = 0; s < t.length; s += 1)
    l[s] = Vn(Kn(n, t, s));
  return {
    c() {
      e = _("div");
      for (let s = 0; s < l.length; s += 1)
        l[s].c();
      h(e, "class", "grid grid-cols-4 justify-items-center")
    },
    m(s, r) {
      g(s, e, r);
      for (let o = 0; o < l.length; o += 1)
        l[o].m(e, null)
    },
    p(s, r) {
      if (r & 8) {
        t = s[6].pinyin.trim().split(/\s+/);
        let o;
        for (o = 0; o < t.length; o += 1) {
          const i = Kn(s, t, o);
          l[o] ? l[o].p(i, r) : (l[o] = Vn(i),
            l[o].c(),
            l[o].m(e, null))
        }
        for (; o < l.length; o += 1)
          l[o].d(1);
        l.length = t.length
      }
    },
    d(s) {
      s && b(e),
        Qe(l, s)
    }
  }
}

function Vn(n) {
  let e, t = n[8] + "", l;
  return {
    c() {
      e = _("div"),
        l = G(t),
        h(e, "class", "text-xl py-1")
    },
    m(s, r) {
      g(s, e, r),
        m(e, l)
    },
    p: B,
    d(s) {
      s && b(e)
    }
  }
}

function xo(n) {
  return {
    c: B,
    m: B,
    p: B,
    d: B
  }
}

function er(n) {
  return {
    c: B,
    m: B,
    p: B,
    i: B,
    o: B,
    d: B
  }
}

function tr(n) {
  let e, t, l = {
    text: n[1],
    results: n[7]
  };
  return e = new Xt({
    props: l
  }),
    n[4](e),
    {
      c() {
        D(e.$$.fragment)
      },
      m(s, r) {
        j(e, s, r),
          t = !0
      },
      p(s, r) {
        const o = {};
        e.$set(o)
      },
      i(s) {
        t || (C(e.$$.fragment, s),
          t = !0)
      },
      o(s) {
        M(e.$$.fragment, s),
          t = !1
      },
      d(s) {
        n[4](null),
          N(e, s)
      }
    }
}

function nr(n) {
  return {
    c: B,
    m: B,
    p: B,
    i: B,
    o: B,
    d: B
  }
}

function lr(n) {
  return {
    c: B,
    m: B,
    p: B,
    d: B
  }
}

function sr(n) {
  var i, u, a;
  let e, t, l, s = ((i = n[6]) == null ? void 0 : i.explanation) && or(n),
    r = ((u = n[6]) == null ? void 0 : u.source) && rr(n), o = ((a = n[6]) == null ? void 0 : a.quote) && fr(n);
  return {
    c() {
      e = _("div"),
      s && s.c(),
        t = R(),
      r && r.c(),
        l = R(),
      o && o.c(),
        h(e, "class", "px-4")
    },
    m(f, c) {
      g(f, e, c),
      s && s.m(e, null),
        m(e, t),
      r && r.m(e, null),
        m(e, l),
      o && o.m(e, null)
    },
    p(f, c) {
      var d, p, w;
      (d = f[6]) != null && d.explanation && s.p(f, c),
      (p = f[6]) != null && p.source && r.p(f, c),
      (w = f[6]) != null && w.quote && o.p(f, c)
    },
    d(f) {
      f && b(e),
      s && s.d(),
      r && r.d(),
      o && o.d()
    }
  }
}

function or(n) {
  let e, t, l, s, r = n[6].explanation + "", o;
  return {
    c() {
      e = _("div"),
        t = _("div"),
        t.textContent = "\u3010\u89E3\u91CA\u3011",
        l = R(),
        s = _("div"),
        o = G(r),
        h(t, "class", "font-bold text-correct whitespace-nowrap pr-2"),
        h(e, "class", "text-l mt-8 flex")
    },
    m(i, u) {
      g(i, e, u),
        m(e, t),
        m(e, l),
        m(e, s),
        m(s, o)
    },
    p: B,
    d(i) {
      i && b(e)
    }
  }
}

function rr(n) {
  var u, a, f, c;
  let e, t, l, s, r, o = ((a = (u = n[6]) == null ? void 0 : u.source) == null ? void 0 : a.text) && ir(n),
    i = ((c = (f = n[6]) == null ? void 0 : f.source) == null ? void 0 : c.book) && ur(n);
  return {
    c() {
      e = _("div"),
        t = _("div"),
        t.textContent = "\u3010\u51FA\u5904\u3011",
        l = R(),
        s = _("div"),
      o && o.c(),
        r = R(),
      i && i.c(),
        h(t, "class", "font-bold text-correct whitespace-nowrap pr-2"),
        h(s, "class", "w-full"),
        h(e, "class", "mt-8 flex")
    },
    m(d, p) {
      g(d, e, p),
        m(e, t),
        m(e, l),
        m(e, s),
      o && o.m(s, null),
        m(s, r),
      i && i.m(s, null)
    },
    p(d, p) {
      var w, $, k, y;
      ($ = (w = d[6]) == null ? void 0 : w.source) != null && $.text && o.p(d, p),
      (y = (k = d[6]) == null ? void 0 : k.source) != null && y.book && i.p(d, p)
    },
    d(d) {
      d && b(e),
      o && o.d(),
      i && i.d()
    }
  }
}

function ir(n) {
  let e, t = n[6].source.text + "", l;
  return {
    c() {
      e = _("div"),
        l = G(t),
        h(e, "class", "text-left")
    },
    m(s, r) {
      g(s, e, r),
        m(e, l)
    },
    p: B,
    d(s) {
      s && b(e)
    }
  }
}

function ur(n) {
  let e, t, l = n[6].source.book + "", s;
  return {
    c() {
      e = _("div"),
        t = G("\u2014\u2014 "),
        s = G(l),
        h(e, "class", "text-right opacity-80 mt-1")
    },
    m(r, o) {
      g(r, e, o),
        m(e, t),
        m(e, s)
    },
    p: B,
    d(r) {
      r && b(e)
    }
  }
}

function fr(n) {
  var u, a, f, c;
  let e, t, l, s, r, o = ((a = (u = n[6]) == null ? void 0 : u.quote) == null ? void 0 : a.text) && ar(n),
    i = ((c = (f = n[6]) == null ? void 0 : f.quote) == null ? void 0 : c.book) && cr(n);
  return {
    c() {
      e = _("div"),
        t = _("div"),
        t.textContent = "\u3010\u5F15\u7528\u3011",
        l = R(),
        s = _("div"),
      o && o.c(),
        r = R(),
      i && i.c(),
        h(t, "class", "font-bold text-correct whitespace-nowrap pr-2"),
        h(s, "class", "w-full"),
        h(e, "class", "text-l mt-8 flex")
    },
    m(d, p) {
      g(d, e, p),
        m(e, t),
        m(e, l),
        m(e, s),
      o && o.m(s, null),
        m(s, r),
      i && i.m(s, null)
    },
    p(d, p) {
      var w, $, k, y;
      ($ = (w = d[6]) == null ? void 0 : w.quote) != null && $.text && o.p(d, p),
      (y = (k = d[6]) == null ? void 0 : k.quote) != null && y.book && i.p(d, p)
    },
    d(d) {
      d && b(e),
      o && o.d(),
      i && i.d()
    }
  }
}

function ar(n) {
  let e, t = n[6].quote.text + "", l;
  return {
    c() {
      e = _("div"),
        l = G(t),
        h(e, "class", "text-left")
    },
    m(s, r) {
      g(s, e, r),
        m(e, l)
    },
    p: B,
    d(s) {
      s && b(e)
    }
  }
}

function cr(n) {
  let e, t, l = n[6].quote.book + "", s;
  return {
    c() {
      e = _("div"),
        t = G("\u2014\u2014 "),
        s = G(l),
        h(e, "class", "text-right opacity-80 mt-1")
    },
    m(r, o) {
      g(r, e, o),
        m(e, t),
        m(e, s)
    },
    p: B,
    d(r) {
      r && b(e)
    }
  }
}

function dr(n) {
  return {
    c: B,
    m: B,
    p: B,
    d: B
  }
}

function hr(n) {
  let e, t, l, s, r, o = {
    ctx: n,
    current: null,
    token: null,
    hasCatch: !1,
    pending: xo,
    then: Zo,
    catch: Xo,
    value: 6
  };
  Ht(n[3], o);
  let i = {
    ctx: n,
    current: null,
    token: null,
    hasCatch: !1,
    pending: nr,
    then: tr,
    catch: er,
    value: 7,
    blocks: [, , ,]
  };
  Ht(n[2], i);
  let u = {
    ctx: n,
    current: null,
    token: null,
    hasCatch: !1,
    pending: dr,
    then: sr,
    catch: lr,
    value: 6
  };
  return Ht(n[3], u),
    {
      c() {
        e = _("div"),
          t = _("div"),
          o.block.c(),
          l = R(),
          i.block.c(),
          s = R(),
          u.block.c(),
          h(t, "class", "grid justify-center py-8"),
          h(e, "class", "flex flex-col justify-center")
      },
      m(a, f) {
        g(a, e, f),
          m(e, t),
          o.block.m(t, o.anchor = null),
          o.mount = () => t,
          o.anchor = l,
          m(t, l),
          i.block.m(t, i.anchor = null),
          i.mount = () => t,
          i.anchor = null,
          m(e, s),
          u.block.m(e, u.anchor = null),
          u.mount = () => e,
          u.anchor = null,
          r = !0
      },
      p(a, [f]) {
        n = a,
          Ut(o, n, f),
          Ut(i, n, f),
          Ut(u, n, f)
      },
      i(a) {
        r || (C(i.block),
          r = !0)
      },
      o(a) {
        for (let f = 0; f < 3; f += 1) {
          const c = i.blocks[f];
          M(c)
        }
        r = !1
      },
      d(a) {
        a && b(e),
          o.block.d(),
          o.token = null,
          o = null,
          i.block.d(),
          i.token = null,
          i = null,
          u.block.d(),
          u.token = null,
          u = null
      }
    }
}

function pr(n, e, t) {
  let l;
  me(n, ae, a => t(5, l = a));
  let s;
  const r = [...l.solution]
    , o = Promise.all(r.map(async a => {
      const f = await We(a).get();
      return Ot(f, f)
    }
  ))
    , i = Fs(l.solution) ? fetch(`/idiom-4ab9d0c2/${l.solution}.json`).then(async a => await a.json()) : null;

  function u(a) {
    V[a ? "unshift" : "push"](() => {
        s = a,
          t(0, s)
      }
    )
  }

  return n.$$.update = () => {
    n.$$.dirty & 1 && (s == null || s.reveal(250))
  }
    ,
    [s, r, o, i, u]
}

class mr extends se {
  constructor(e) {
    super();
    oe(this, e, pr, hr, re, {})
  }
}

function Xn(n) {
  let e, t, l, s, r, o, i, u = n[1] && Zn();
  return {
    c() {
      e = _("div"),
        t = _("div"),
        l = _("div"),
        s = _("div"),
        r = _("p"),
        o = G(n[2]),
        i = R(),
      u && u.c(),
        h(r, "class", "ml-3 truncate font-medium text-white"),
        h(s, "class", "flex w-0 flex-1 items-center"),
        h(l, "class", "flex flex-wrap items-center justify-between"),
        h(t, "class", "mx-auto max-w-7xl py-3 px-3 sm:px-6 lg:px-8"),
        h(e, "class", "bg-correct transition")
    },
    m(a, f) {
      g(a, e, f),
        m(e, t),
        m(t, l),
        m(l, s),
        m(s, r),
        m(r, o),
        m(l, i),
      u && u.m(l, null)
    },
    p(a, f) {
      f & 4 && Ce(o, a[2]),
        a[1] ? u || (u = Zn(),
          u.c(),
          u.m(l, null)) : u && (u.d(1),
          u = null)
    },
    d(a) {
      a && b(e),
      u && u.d()
    }
  }
}

function Zn(n) {
  let e;
  return {
    c() {
      e = _("div"),
        e.innerHTML = `<button type="button" class="-mr-1 flex rounded-md p-2 sm:-mr-2"><span class="sr-only">Dismiss</span>
              <svg class="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>`,
        h(e, "class", "order-2 flex-shrink-0 sm:order-3 sm:ml-3")
    },
    m(t, l) {
      g(t, e, l)
    },
    d(t) {
      t && b(e)
    }
  }
}

function _r(n) {
  let e, t = n[0] && Xn(n);
  return {
    c() {
      t && t.c(),
        e = dt()
    },
    m(l, s) {
      t && t.m(l, s),
        g(l, e, s)
    },
    p(l, [s]) {
      l[0] ? t ? t.p(l, s) : (t = Xn(l),
        t.c(),
        t.m(e.parentNode, e)) : t && (t.d(1),
        t = null)
    },
    i: B,
    o: B,
    d(l) {
      t && t.d(l),
      l && b(e)
    }
  }
}

function gr(n, e, t) {
  let {show: l = !0} = e
    , {showCloseButton: s = !1} = e
    , {text: r = ""} = e;
  return n.$$set = o => {
    "show" in o && t(0, l = o.show),
    "showCloseButton" in o && t(1, s = o.showCloseButton),
    "text" in o && t(2, r = o.text)
  }
    ,
    [l, s, r]
}

class br extends se {
  constructor(e) {
    super();
    oe(this, e, gr, _r, re, {
      show: 0,
      showCloseButton: 1,
      text: 2
    })
  }
}

function wr(n) {
  let e;
  return {
    c() {
      e = _("div"),
        e.innerHTML = `<h1 class="my-2 text-center font-bold">\u8BCD\u5F71\u5C0F\u7A0B\u5E8F\u6765\u5566!</h1>
    <div class="flex py-2"><img src="/QR.png" width="160px" alt="QR"/></div>
    <div class="text-cor mt-2">\u626B\u63CF\u4E8C\u7EF4\u7801\u524D\u5F80\u5FAE\u4FE1\u4E2D\u6E38\u73A9 \u{1F446}\u{1F446}\u{1F446}</div>
    <div class="mt-4 text-sm opacity-70">\u65B0\u7248\u8BCD\u5F71\u4E0D\u4EC5\u589E\u52A0\u4E86\u65B0\u7684\u8BCD\u610F\u6A21\u5F0F\uFF0C\u8FD8\u5141\u8BB8\u60A8\u76F4\u63A5\u51FA\u9898\u5206\u4EAB\u7ED9\u5FAE\u4FE1\u597D\u53CB\uFF0C\u5E76\u80FD\u6311\u6218\u793E\u533A\u4ED6\u4EBA\u6240\u51FA\u9898\u76EE</div>`,
        h(e, "class", "flex w-full flex-col items-center overflow-y-auto px-4 py-8")
    },
    m(t, l) {
      g(t, e, l)
    },
    d(t) {
      t && b(e)
    }
  }
}

function vr(n) {
  let e, t, l;

  function s(o) {
    n[1](o)
  }

  let r = {
    $$slots: {
      default: [wr]
    },
    $$scope: {
      ctx: n
    }
  };
  return n[0] !== void 0 && (r.open = n[0]),
    e = new ht({
      props: r
    }),
    V.push(() => ue(e, "open", s)),
    {
      c() {
        D(e.$$.fragment)
      },
      m(o, i) {
        j(e, o, i),
          l = !0
      },
      p(o, [i]) {
        const u = {};
        i & 4 && (u.$$scope = {
          dirty: i,
          ctx: o
        }),
        !t && i & 1 && (t = !0,
          u.open = o[0],
          ie(() => t = !1)),
          e.$set(u)
      },
      i(o) {
        l || (C(e.$$.fragment, o),
          l = !0)
      },
      o(o) {
        M(e.$$.fragment, o),
          l = !1
      },
      d(o) {
        N(e, o)
      }
    }
}

function kr(n, e, t) {
  let {open: l} = e;

  function s(r) {
    l = r,
      t(0, l)
  }

  return n.$$set = r => {
    "open" in r && t(0, l = r.open)
  }
    ,
    [l, s]
}

class $r extends se {
  constructor(e) {
    super();
    oe(this, e, kr, vr, re, {
      open: 0
    })
  }
}

function Sr(n) {
  let e, t;
  return e = new Tt({
    props: {
      class: "mx-auto",
      $$slots: {
        default: [Er]
      },
      $$scope: {
        ctx: n
      }
    }
  }),
    e.$on("click", n[19]),
    {
      c() {
        D(e.$$.fragment)
      },
      m(l, s) {
        j(e, l, s),
          t = !0
      },
      p(l, s) {
        const r = {};
        s[1] & 65536 && (r.$$scope = {
          dirty: s,
          ctx: l
        }),
          e.$set(r)
      },
      i(l) {
        t || (C(e.$$.fragment, l),
          t = !0)
      },
      o(l) {
        M(e.$$.fragment, l),
          t = !1
      },
      d(l) {
        N(e, l)
      }
    }
}

function yr(n) {
  let e, t;
  return e = new Tt({
    props: {
      class: "mx-auto",
      $$slots: {
        default: [Cr]
      },
      $$scope: {
        ctx: n
      }
    }
  }),
    e.$on("click", n[28]),
    {
      c() {
        D(e.$$.fragment)
      },
      m(l, s) {
        j(e, l, s),
          t = !0
      },
      p(l, s) {
        const r = {};
        s[0] & 8 | s[1] & 65536 && (r.$$scope = {
          dirty: s,
          ctx: l
        }),
          e.$set(r)
      },
      i(l) {
        t || (C(e.$$.fragment, l),
          t = !0)
      },
      o(l) {
        M(e.$$.fragment, l),
          t = !1
      },
      d(l) {
        N(e, l)
      }
    }
}

function Er(n) {
  let e;
  return {
    c() {
      e = G("\u6B63\u5E38\u6A21\u5F0F")
    },
    m(t, l) {
      g(t, e, l)
    },
    d(t) {
      t && b(e)
    }
  }
}

function Cr(n) {
  let e = n[3].gameStatus === le.WIN || !he ? "\u7B54\u6848\u89E3\u6790" : "\u518D\u8BD5\u4E00\u6B21", t;
  return {
    c() {
      t = G(e)
    },
    m(l, s) {
      g(l, t, s)
    },
    p(l, s) {
      s[0] & 8 && e !== (e = l[3].gameStatus === le.WIN || !he ? "\u7B54\u6848\u89E3\u6790" : "\u518D\u8BD5\u4E00\u6B21") && Ce(t, e)
    },
    d(l) {
      l && b(t)
    }
  }
}

function Jn(n) {
  let e, t, l = {
    inputEnabled: n[14]
  };
  return e = new as({
    props: l
  }),
    n[29](e),
    e.$on("submit", n[17]),
    {
      c() {
        D(e.$$.fragment)
      },
      m(s, r) {
        j(e, s, r),
          t = !0
      },
      p(s, r) {
        const o = {};
        r[0] & 16384 && (o.inputEnabled = s[14]),
          e.$set(o)
      },
      i(s) {
        t || (C(e.$$.fragment, s),
          t = !0)
      },
      o(s) {
        M(e.$$.fragment, s),
          t = !1
      },
      d(s) {
        n[29](null),
          N(e, s)
      }
    }
}

function xn(n) {
  let e, t, l, s, r, o, i, u;
  l = new mr({});
  let a = n[2] && el(n)
    , f = !n[15] && tl(n);
  return {
    c() {
      e = _("div"),
        t = _("div"),
        D(l.$$.fragment),
        s = R(),
        r = _("div"),
      a && a.c(),
        o = R(),
      f && f.c(),
        h(r, "class", "bottom-0 mt-4 flex w-full"),
        h(t, "class", "max-h-full max-w-md"),
        h(e, "class", "absolute top-0 left-0 flex h-full w-full items-center justify-center bg-white dark:bg-neutral-900")
    },
    m(c, d) {
      g(c, e, d),
        m(e, t),
        j(l, t, null),
        m(t, s),
        m(t, r),
      a && a.m(r, null),
        m(r, o),
      f && f.m(r, null),
        u = !0
    },
    p(c, d) {
      c[2] ? a ? (a.p(c, d),
      d[0] & 4 && C(a, 1)) : (a = el(c),
        a.c(),
        C(a, 1),
        a.m(r, o)) : a && (be(),
        M(a, 1, 1, () => {
            a = null
          }
        ),
        we()),
        c[15] ? f && (be(),
          M(f, 1, 1, () => {
              f = null
            }
          ),
          we()) : f ? (f.p(c, d),
        d[0] & 32768 && C(f, 1)) : (f = tl(c),
          f.c(),
          C(f, 1),
          f.m(r, null))
    },
    i(c) {
      u || (C(l.$$.fragment, c),
        C(a),
        C(f),
        Fe(() => {
            i || (i = Be(e, Pt, {
              x: 100,
              duration: 400,
              opacity: 0
            }, !0)),
              i.run(1)
          }
        ),
        u = !0)
    },
    o(c) {
      M(l.$$.fragment, c),
        M(a),
        M(f),
      i || (i = Be(e, Pt, {
        x: 100,
        duration: 400,
        opacity: 0
      }, !1)),
        i.run(0),
        u = !1
    },
    d(c) {
      c && b(e),
        N(l),
      a && a.d(),
      f && f.d(),
      c && i && i.end()
    }
  }
}

function el(n) {
  let e, t;
  return e = new dl({
    props: {
      class: "mr-auto pl-2",
      $$slots: {
        default: [Tr]
      },
      $$scope: {
        ctx: n
      }
    }
  }),
    e.$on("click", n[30]),
    {
      c() {
        D(e.$$.fragment)
      },
      m(l, s) {
        j(e, l, s),
          t = !0
      },
      p(l, s) {
        const r = {};
        s[1] & 65536 && (r.$$scope = {
          dirty: s,
          ctx: l
        }),
          e.$set(r)
      },
      i(l) {
        t || (C(e.$$.fragment, l),
          t = !0)
      },
      o(l) {
        M(e.$$.fragment, l),
          t = !1
      },
      d(l) {
        N(e, l)
      }
    }
}

function Tr(n) {
  let e;
  return {
    c() {
      e = G("\u8FD4\u56DE\u6E38\u620F")
    },
    m(t, l) {
      g(t, e, l)
    },
    d(t) {
      t && b(e)
    }
  }
}

function tl(n) {
  let e, t;
  return e = new Tt({
    props: {
      class: "ml-auto pr-2",
      $$slots: {
        default: [Ir]
      },
      $$scope: {
        ctx: n
      }
    }
  }),
    e.$on("click", n[19]),
    {
      c() {
        D(e.$$.fragment)
      },
      m(l, s) {
        j(e, l, s),
          t = !0
      },
      p(l, s) {
        const r = {};
        s[1] & 65536 && (r.$$scope = {
          dirty: s,
          ctx: l
        }),
          e.$set(r)
      },
      i(l) {
        t || (C(e.$$.fragment, l),
          t = !0)
      },
      o(l) {
        M(e.$$.fragment, l),
          t = !1
      },
      d(l) {
        N(e, l)
      }
    }
}

function Ir(n) {
  let e = he ? "\u6B63\u5E38\u6A21\u5F0F" : "\u518D\u6765\u4E00\u5C40", t;
  return {
    c() {
      t = G(e)
    },
    m(l, s) {
      g(l, t, s)
    },
    p: B,
    d(l) {
      l && b(t)
    }
  }
}

function nl(n) {
  let e, t;
  return e = new ds({}),
    {
      c() {
        D(e.$$.fragment)
      },
      m(l, s) {
        j(e, l, s),
          t = !0
      },
      i(l) {
        t || (C(e.$$.fragment, l),
          t = !0)
      },
      o(l) {
        M(e.$$.fragment, l),
          t = !1
      },
      d(l) {
        N(e, l)
      }
    }
}

// function Mr(n) {
//   let e, t, l, s, r, o, i, u, a, f, c, d, p, w, $, k, y, A, I, L, Y, z, H, X, x, ee, Z, pe, E, O, K, de, fe, Te, Ge, Se, Pe, ye, He, ve, Ie, Le;
// function Ve(S) {
//   n[20](S)
// }
// function Xe(S) {
//   n[21](S)
// }
// function qe(S) {
//   n[22](S)
// }
// function Ue(S) {
//   n[23](S)
// }
// let ke = {};
// n[0] !== void 0 && (ke.openHelp = n[0]),
// n[8] !== void 0 && (ke.openStatistics = n[8]),
// n[9] !== void 0 && (ke.openSettings = n[9]),
// n[11] !== void 0 && (ke.openSelfPublishing = n[11]),
//   t = new Nl({
//     props: ke
//   }),
//   V.push(()=>ue(t, "openHelp", Ve)),
//   V.push(()=>ue(t, "openStatistics", Xe)),
//   V.push(()=>ue(t, "openSettings", qe)),
//   V.push(()=>ue(t, "openSelfPublishing", Ue));
// function te(S) {
//   n[24](S)
// }
// function pt(S) {
//   n[25](S)
// }
// function T(S) {
//   n[26](S)
// }
// let W = {};
// n[12].shouldShow !== void 0 && (W.show = n[12].shouldShow),
// n[12].text !== void 0 && (W.text = n[12].text),
// n[12].showCloseButton !== void 0 && (W.showCloseButton = n[12].showCloseButton),
//   u = new br({
//     props: W
//   }),
//   V.push(()=>ue(u, "show", te)),
//   V.push(()=>ue(u, "text", pt)),
//   V.push(()=>ue(u, "showCloseButton", T));
// let Ee = {
//   inputEnabled: !n[16] && n[14]
// };
// k = new is({
//   props: Ee
// }),
//   n[27](k),
//   k.$on("submit", n[17]);
// const v = [yr, Sr]
//   , P = [];
// function q(S, Q) {
//   return S[2] ? 0 : S[2] && he ? 1 : -1
// }
// ~(A = q(n)) && (I = P[A] = v[A](n));
// let F = n[16] && !n[2] && Jn(n)
//   , ne = n[10] && xn(n)
//   , _e = n[1] && nl();
// function _l(S) {
//   n[31](S)
// }
// let Jt = {};
// n[13] !== void 0 && (Jt.open = n[13]),
//   X = new $r({
//     props: Jt
//   }),
//   V.push(()=>ue(X, "open", _l));
// function gl(S) {
//   n[32](S)
// }
// let xt = {};
// n[0] !== void 0 && (xt.open = n[0]),
//   Z = new Us({
//     props: xt
//   }),
//   V.push(()=>ue(Z, "open", gl));
// function bl(S) {
//   n[33](S)
// }
// let en = {};
// n[8] !== void 0 && (en.open = n[8]),
//   O = new Po({
//     props: en
//   }),
//   V.push(()=>ue(O, "open", bl)),
//   O.$on("toast", n[18]),
//   O.$on("openSelfPubslish", n[34]);
// function wl(S) {
//   n[35](S)
// }
// let tn = {};
// n[9] !== void 0 && (tn.open = n[9]),
//   fe = new qo({
//     props: tn
//   }),
//   V.push(()=>ue(fe, "open", wl)),
//   fe.$on("toast", n[18]);
// let vl = {
//   class: "pointer-events-none z-10"
// };
// Se = new Qn({
//   props: vl
// }),
//   n[36](Se);
// let kl = {
//   class: "pointer-events-none z-30"
// };
// ye = new Qn({
//   props: kl
// }),
//   n[37](ye);
// function $l(S) {
//   n[38](S)
// }
// let nn = {};
// return n[11] !== void 0 && (nn.open = n[11]),
//   ve = new uo({
//     props: nn
//   }),
//   V.push(()=>ue(ve, "open", $l)),
//   ve.$on("toast", n[18]),
//   {
//     c() {
//       e = _("div"),
//         D(t.$$.fragment),
//         i = R(),
//         D(u.$$.fragment),
//         d = R(),
//         p = _("div"),
//           w = _("div"),
//           $ = _("div"),
//           D(k.$$.fragment),
//           y = R(),
//         I && I.c(),
//           L = R(),
//         F && F.c(),
//           Y = R(),
//         ne && ne.c(),
//           z = R(),
//         _e && _e.c(),
//           H = R(),
//           D(X.$$.fragment),
//           ee = R(),
//           D(Z.$$.fragment),
//           E = R(),
//           D(O.$$.fragment),
//           de = R(),
//           D(fe.$$.fragment),
//           Ge = R(),
//           D(Se.$$.fragment),
//           Pe = R(),
//           D(ye.$$.fragment),
//           He = R(),
//           D(ve.$$.fragment),
//           h($, "class", "max-h-full"),
//           h(w, "class", "flex h-full items-center justify-center overflow-y-auto"),
//           h(p, "class", "relative flex flex-grow flex-col overflow-y-auto overflow-x-hidden"),
//           h(e, "class", "flex h-full w-full flex-col")
//       },
//       m(S, Q) {
//         g(S, e, Q),
//           j(t, e, null),
//           m(e, i),
//           j(u, e, null),
//           m(e, d),
//           m(e, p),
//           m(p, w),
//           m(w, $),
//           j(k, $, null),
//           m($, y),
//         ~A && P[A].m($, null),
//           m(p, L),
//         F && F.m(p, null),
//           m(p, Y),
//         ne && ne.m(p, null),
//           g(S, z, Q),
//         _e && _e.m(S, Q),
//           g(S, H, Q),
//           j(X, S, Q),
//           g(S, ee, Q),
//           j(Z, S, Q),
//           g(S, E, Q),
//           j(O, S, Q),
//           g(S, de, Q),
//           j(fe, S, Q),
//           g(S, Ge, Q),
//           j(Se, S, Q),
//           g(S, Pe, Q),
//           j(ye, S, Q),
//           g(S, He, Q),
//           j(ve, S, Q),
//           Le = !0
//       },
//       p(S, Q) {
//         const mt = {};
//         !l && Q[0] & 1 && (l = !0,
//           mt.openHelp = S[0],
//           ie(()=>l = !1)),
//         !s && Q[0] & 256 && (s = !0,
//           mt.openStatistics = S[8],
//           ie(()=>s = !1)),
//         !r && Q[0] & 512 && (r = !0,
//           mt.openSettings = S[9],
//           ie(()=>r = !1)),
//         !o && Q[0] & 2048 && (o = !0,
//           mt.openSelfPublishing = S[11],
//           ie(()=>o = !1)),
//           t.$set(mt);
//         const Mt = {};
//         !a && Q[0] & 4096 && (a = !0,
//           Mt.show = S[12].shouldShow,
//           ie(()=>a = !1)),
//         !f && Q[0] & 4096 && (f = !0,
//           Mt.text = S[12].text,
//           ie(()=>f = !1)),
//         !c && Q[0] & 4096 && (c = !0,
//           Mt.showCloseButton = S[12].showCloseButton,
//           ie(()=>c = !1)),
//           u.$set(Mt);
//         const ln = {};
//         Q[0] & 81920 && (ln.inputEnabled = !S[16] && S[14]),
//           k.$set(ln);
//         let jt = A;
//         A = q(S),
//           A === jt ? ~A && P[A].p(S, Q) : (I && (be(),
//             M(P[jt], 1, 1, ()=>{
//                 P[jt] = null
//               }
//             ),
//             we()),
//             ~A ? (I = P[A],
//               I ? I.p(S, Q) : (I = P[A] = v[A](S),
//                 I.c()),
//               C(I, 1),
//               I.m($, null)) : I = null),
//           S[16] && !S[2] ? F ? (F.p(S, Q),
//           Q[0] & 65540 && C(F, 1)) : (F = Jn(S),
//             F.c(),
//             C(F, 1),
//             F.m(p, Y)) : F && (be(),
//             M(F, 1, 1, ()=>{
//                 F = null
//               }
//             ),
//             we()),
//           S[10] ? ne ? (ne.p(S, Q),
//           Q[0] & 1024 && C(ne, 1)) : (ne = xn(S),
//             ne.c(),
//             C(ne, 1),
//             ne.m(p, null)) : ne && (be(),
//             M(ne, 1, 1, ()=>{
//                 ne = null
//               }
//             ),
//             we()),
//           S[1] ? _e ? Q[0] & 2 && C(_e, 1) : (_e = nl(),
//             _e.c(),
//             C(_e, 1),
//             _e.m(H.parentNode, H)) : _e && (be(),
//             M(_e, 1, 1, ()=>{
//                 _e = null
//               }
//             ),
//             we());
//         const sn = {};
//         !x && Q[0] & 8192 && (x = !0,
//           sn.open = S[13],
//           ie(()=>x = !1)),
//           X.$set(sn);
//         const on = {};
//         !pe && Q[0] & 1 && (pe = !0,
//           on.open = S[0],
//           ie(()=>pe = !1)),
//           Z.$set(on);
//         const rn = {};
//         !K && Q[0] & 256 && (K = !0,
//           rn.open = S[8],
//           ie(()=>K = !1)),
//           O.$set(rn);
//         const un = {};
//         !Te && Q[0] & 512 && (Te = !0,
//           un.open = S[9],
//           ie(()=>Te = !1)),
//           fe.$set(un);
//         const Sl = {};
//         Se.$set(Sl);
//         const yl = {};
//         ye.$set(yl);
//         const fn = {};
//         !Ie && Q[0] & 2048 && (Ie = !0,
//           fn.open = S[11],
//           ie(()=>Ie = !1)),
//           ve.$set(fn)
//       },
//       i(S) {
//         Le || (C(t.$$.fragment, S),
//           C(u.$$.fragment, S),
//           C(k.$$.fragment, S),
//           C(I),
//           C(F),
//           C(ne),
//           C(_e),
//           C(X.$$.fragment, S),
//           C(Z.$$.fragment, S),
//           C(O.$$.fragment, S),
//           C(fe.$$.fragment, S),
//           C(Se.$$.fragment, S),
//           C(ye.$$.fragment, S),
//           C(ve.$$.fragment, S),
//           Le = !0)
//       },
//       o(S) {
//         M(t.$$.fragment, S),
//           M(u.$$.fragment, S),
//           M(k.$$.fragment, S),
//           M(I),
//           M(F),
//           M(ne),
//           M(_e),
//           M(X.$$.fragment, S),
//           M(Z.$$.fragment, S),
//           M(O.$$.fragment, S),
//           M(fe.$$.fragment, S),
//           M(Se.$$.fragment, S),
//           M(ye.$$.fragment, S),
//           M(ve.$$.fragment, S),
//           Le = !1
//       },
//       d(S) {
//         S && b(e),
//           N(t),
//           N(u),
//           n[27](null),
//           N(k),
//         ~A && P[A].d(),
//         F && F.d(),
//         ne && ne.d(),
//         S && b(z),
//         _e && _e.d(S),
//         S && b(H),
//           N(X, S),
//         S && b(ee),
//           N(Z, S),
//         S && b(E),
//           N(O, S),
//         S && b(de),
//           N(fe, S),
//         S && b(Ge),
//           n[36](null),
//           N(Se, S),
//         S && b(Pe),
//           n[37](null),
//           N(ye, S),
//         S && b(He),
//           N(ve, S)
//       }
//     }
// }
// function Rr() {
//   location.reload()
// }
// function Ar(n, e, t) {
//   let l, s, r, o, i, u, a, f;
//   me(n, ae, T=>t(3, o = T)),
//     me(n, bt, T=>t(40, i = T)),
//     me(n, Lt, T=>t(41, u = T)),
//     me(n, St, T=>t(16, a = T)),
//     me(n, Ct, T=>t(42, f = T));
//   let c, d, p, w, $ = !1, k = !1, y = !1, A, I = !0, L = !1, Y = !1, z = {
//     shouldShow: !1,
//     text: "",
//     showCloseButton: !1
//   }, H = !1;
//   setTimeout(()=>t(13, H = !0), 100),
//   // i.gamesPlayed === 0 && setTimeout(()=>t(0, $ = !0), 100);
//   function X(T) {
//     return T.map(We).filter(W=>W !== void 0)
//   }
//   async function x(T, W) {
//     const Ee = await Promise.all(T.map(v=>v.get()));
//     for (let v = 0; v < ce; v += 1) {
//       const P = f.keepShadow && W > 0 ? u[W - 1][v] : void 0;
//       Re(Lt, u[W][v] = Ot(A[v], Ee[v], P), u)
//     }
//   }
//   il(async()=>{
//       Oe.then(T=>T.logEvent(Js)),
//       he && Oe.then(T=>T.logEvent(lo)),
//         A = await Promise.all([...he != null ? he : Ys()].map(T=>{
//             const W = We(T);
//             if (W === void 0)
//               throw new Error;
//             return W.get()
//           }
//         ));
//       for (let T = 0; T < o.rowIndex; T += 1)
//         await x(X(o.boardState[T]), T),
//           c.getRow(T).reveal(100);
//       o.gameStatus !== le.IN_PROGRESS && setTimeout(()=>t(10, L = !0), 1e3),
//         t(1, I = !1)
//     }
//   );
//   function ee(T) {
//     var W, Ee;
//     s && (a ? d == null || d.focus() : (Ee = (W = c == null ? void 0 : c.getRow(T != null ? T : o.rowIndex)) == null ? void 0 : W.getTile(0)) == null || Ee.focus())
//   }
//   function Z(T) {
//     var W, Ee;
//     if (!a)
//       for (let v = 0; v < ce; v += 1)
//         (Ee = (W = c == null ? void 0 : c.getRow(T)) == null ? void 0 : W.getTile(v)) == null || Ee.blur()
//   }
//   async function pe() {
//     var q;
//     if (I || l)
//       return;
//     const T = o.rowIndex;
//     if (o.boardState[T].some(F=>F === "")) {
//       c.getRow(T).shake(),
//         p.toast("\u5B57\u6570\u4E0D\u8DB3");
//       return
//     }
//     const W = X(o.boardState[T]);
//     if (W.length !== ce) {
//       c.getRow(T).shake(),
//         p.toast("\u542B\u6709\u975E\u6CD5\u5B57\u7B26");
//       return
//     }
//     ee(T + 1),
//       t(1, I = !0),
//       Re(ae, o.lastPlayedTs = Date.now(), o),
//       await x(W, T),
//       c.getRow(T).reveal(250);
//     const Ee = [...o.boardState];
//     Ee[T] = W.map(F=>F.char);
//     let v = le.IN_PROGRESS;
//     u[T].every(F=>F.match) ? v = le.WIN : T + 1 >= Ne && (v = le.FAIL),
//       ae.update(F=>ze(Me({}, F), {
//         gameStatus: v,
//         boardState: Ee,
//         rowIndex: T + 1
//       })),
//       Oe.then(F=>F.logEvent(to(o.boardState[T].join(""), A.map(ne=>ne.character).join(""), T + 1)));
//     const P = Me({}, i);
//     if (o.gameStatus !== le.IN_PROGRESS) {
//       if (Z(T + 1),
//         P.gamesPlayed += 1,
//       o.gameStatus === le.WIN) {
//         Oe.then(ne=>ne.logEvent(xs)),
//           P.gamesWon += 1;
//         const F = Me({}, P.guesses);
//         F[o.rowIndex] += 1,
//           P.guesses = F,
//           P.currentStreak = P.currentStreak + 1,
//           P.maxStreak = Math.max(P.currentStreak, P.maxStreak),
//           Re(ae, o.lastCompletedTs = Date.now(), o),
//           P.successfulGuesses = [A.map(ne=>ne.character).join(""), ...(q = P.successfulGuesses) != null ? q : []]
//       } else
//         Oe.then(F=>F.logEvent(eo)),
//           P.currentStreak = 0;
//       P.winPercentage = Math.round(P.gamesWon / P.gamesPlayed * 100),
//         o.gameStatus === le.WIN || !he ? (setTimeout(()=>t(10, L = !0), 1500),
//           setTimeout(()=>t(8, k = !0), 3e3)) : setTimeout(()=>t(8, k = !0), 1500)
//     }
//     Re(bt, i = P, i),
//       ae.commit(),
//       bt.commit(),
//       t(1, I = !1)
//   }
//   function E(T) {
//     w.toast(T.detail, 2e3)
//   }
//   function O() {
//     Re(ae, o.solution = "", o),
//       ae.commit()
//       // window.location.href = `${window.location.protocol}//${window.location.host}${window.location.pathname}`
//   }
//   function K(T) {
//     $ = T,
//       t(0, $)
//   }
//   function de(T) {
//     k = T,
//       t(8, k)
//   }
//   function fe(T) {
//     y = T,
//       t(9, y)
//   }
//   function Te(T) {
//     Y = T,
//       t(11, Y)
//   }
//   function Ge(T) {
//     n.$$.not_equal(z.shouldShow, T) && (z.shouldShow = T,
//       t(12, z),
//       t(3, o))
//   }
//   function Se(T) {
//     n.$$.not_equal(z.text, T) && (z.text = T,
//       t(12, z),
//       t(3, o))
//   }
//   function Pe(T) {
//     n.$$.not_equal(z.showCloseButton, T) && (z.showCloseButton = T,
//       t(12, z),
//       t(3, o))
//   }
//   function ye(T) {
//     V[T ? "unshift" : "push"](()=>{
//         c = T,
//           t(4, c)
//       }
//     )
//   }
//   const He = ()=>{
//       o.gameStatus === le.WIN || !he ? t(10, L = !0) : Rr()
//     }
//   ;
//   function ve(T) {
//     V[T ? "unshift" : "push"](()=>{
//         d = T,
//           t(5, d)
//       }
//     )
//   }
//   const Ie = ()=>t(10, L = !1);
//   function Le(T) {
//     H = T,
//       t(13, H)
//   }
//   function Ve(T) {
//     $ = T,
//       t(0, $)
//   }
//   function Xe(T) {
//     k = T,
//       t(8, k)
//   }
//   const qe = ()=>t(11, Y = !0);
//   function Ue(T) {
//     y = T,
//       t(9, y)
//   }
//   function ke(T) {
//     V[T ? "unshift" : "push"](()=>{
//         p = T,
//           t(6, p)
//       }
//     )
//   }
//   function te(T) {
//     V[T ? "unshift" : "push"](()=>{
//         w = T,
//           t(7, w)
//       }
//     )
//   }
//   function pt(T) {
//     Y = T,
//       t(11, Y)
//   }
// //   return n.$$.update = ()=>{
// //     // n.$$.dirty[0] & 8 && t(2, l = o.gameStatus !== le.IN_PROGRESS),
// //     n.$$.dirty[0] & 6 && t(14, s = !I && !l),
// //     n.$$.dirty[0] & 8 && t(15, r = (o.dailyConsumedQuota || 0) >= Ye),
// //     n.$$.dirty[0] & 1 && ($ || ee()),
// //     n.$$.dirty[0] & 8 && (he !== void 0 ? t(12, z = {
// //       shouldShow: !0,
// //       text: `\u60A8\u6B63\u5904\u4E8E\u6311\u6218\u6A21\u5F0F${gt ? "\uFF08\u56F0\u96BE\uFF09" : ""}\uFF0C\u7ED3\u679C\u5C06\u4E0D\u4F1A\u7EB3\u5165\u7EDF\u8BA1\u3002`,
// //       showCloseButton: !1
// //     }) : o.hardMode ? t(12, z = {
// //       shouldShow: !0,
// //       text: "\u60A8\u6B63\u5904\u4E8E\u56F0\u96BE\u6A21\u5F0F\u3002",
// //       showCloseButton: !1
// //     }) : t(12, z = {
// //       shouldShow: !1,
// //       text: "",
// //       showCloseButton: !1
// //     }))
// //   }
// //     ,
// //     [$, I, l, o, c, d, p, w, k, y, L, Y, z, H, s, r, a, pe, E, O, K, de, fe, Te, Ge, Se, Pe, ye, He, ve, Ie, Le, Ve, Xe, qe, Ue, ke, te, pt]
// }
// class Pr extends se {
//   constructor(e) {
//     super();
//     oe(this, e, Ar, Mr, re, {}, null, [-1, -1])
//   }
// }
// new Pr({
// target: document.body
// });
