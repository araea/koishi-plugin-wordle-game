const { E: K, r: v, f: S, C, e: R, F: W, l: Ae, i: ve, m: I, n: Se, p: Y, q: J, t: X, v: Q, L: Ce, u: q } = require("./esm2017.js");
const Z = "@firebase/installations"
  , M = "0.5.7";
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const ee = 1e4
  , te = `w:${M}`
  , ne = "FIS_v2"
  , ke = "https://firebaseinstallations.googleapis.com/v1"
  , Ee = 60 * 60 * 1e3
  , Re = "installations"
  , _e = "Installations";
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const Oe = {
  ["missing-app-config-values"]: 'Missing App configuration value: "{$valueName}"',
  ["not-registered"]: "Firebase Installation is not registered.",
  ["installation-not-found"]: "Firebase Installation not found.",
  ["request-failed"]: '{$requestName} request failed with error "{$serverCode} {$serverStatus}: {$serverMessage}"',
  ["app-offline"]: "Could not process request. Application offline.",
  ["delete-pending-registration"]: "Can't delete installation while there is a pending registration request."
}
  , m = new K(Re,_e,Oe);
function ae(e) {
  return e instanceof W && e.code.includes("request-failed")
}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function ie({projectId: e}) {
  return `${ke}/projects/${e}/installations`
}
function re(e) {
  return {
    token: e.token,
    requestStatus: 2,
    expiresIn: De(e.expiresIn),
    creationTime: Date.now()
  }
}
async function se(e, t) {
  const a = (await t.json()).error;
  return m.create("request-failed", {
    requestName: e,
    serverCode: a.code,
    serverMessage: a.message,
    serverStatus: a.status
  })
}
function oe({apiKey: e}) {
  return new Headers({
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-goog-api-key": e
  })
}
function Pe(e, {refreshToken: t}) {
  const n = oe(e);
  return n.append("Authorization", $e(t)),
    n
}
async function ce(e) {
  const t = await e();
  return t.status >= 500 && t.status < 600 ? e() : t
}
function De(e) {
  return Number(e.replace("s", "000"))
}
function $e(e) {
  return `${ne} ${e}`
}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
async function Fe({appConfig: e, heartbeatServiceProvider: t}, {fid: n}) {
  const a = ie(e)
    , i = oe(e)
    , r = t.getImmediate({
    optional: !0
  });
  if (r) {
    const l = await r.getHeartbeatsHeader();
    l && i.append("x-firebase-client", l)
  }
  const s = {
    fid: n,
    authVersion: ne,
    appId: e.appId,
    sdkVersion: te
  }
    , o = {
    method: "POST",
    headers: i,
    body: JSON.stringify(s)
  }
    , c = await ce(()=>fetch(a, o));
  if (c.ok) {
    const l = await c.json();
    return {
      fid: l.fid || n,
      registrationStatus: 2,
      refreshToken: l.refreshToken,
      authToken: re(l.authToken)
    }
  } else
    throw await se("Create Installation", c)
}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function le(e) {
  return new Promise(t=>{
      setTimeout(t, e)
    }
  )
}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function Me(e) {
  return btoa(String.fromCharCode(...e)).replace(/\+/g, "-").replace(/\//g, "_")
}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const Ne = /^[cdef][\w-]{21}$/
  , $ = "";
function xe() {
  try {
    const e = new Uint8Array(17);
    (self.crypto || self.msCrypto).getRandomValues(e),
      e[0] = 112 + e[0] % 16;
    const n = je(e);
    return Ne.test(n) ? n : $
  } catch {
    return $
  }
}
function je(e) {
  return Me(e).substr(0, 22)
}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function _(e) {
  return `${e.appName}!${e.appId}`
}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const ue = new Map;
function de(e, t) {
  const n = _(e);
  fe(n, t),
    qe(n, t)
}
function fe(e, t) {
  const n = ue.get(e);
  if (!!n)
    for (const a of n)
      a(t)
}
function qe(e, t) {
  const n = Le();
  n && n.postMessage({
    key: e,
    fid: t
  }),
    Be()
}
let h = null;
function Le() {
  return !h && "BroadcastChannel"in self && (h = new BroadcastChannel("[Firebase] FID Change"),
      h.onmessage = e=>{
        fe(e.data.key, e.data.fid)
      }
  ),
    h
}
function Be() {
  ue.size === 0 && h && (h.close(),
    h = null)
}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const Ve = "firebase-installations-database"
  , ze = 1
  , w = "firebase-installations-store";
let P = null;
function N() {
  return P || (P = Ae(Ve, ze, (e,t)=>{
      switch (t) {
        case 0:
          e.createObjectStore(w)
      }
    }
  )),
    P
}
async function k(e, t) {
  const n = _(e)
    , i = (await N()).transaction(w, "readwrite")
    , r = i.objectStore(w)
    , s = await r.get(n);
  return await r.put(t, n),
    await i.complete,
  (!s || s.fid !== t.fid) && de(e, t.fid),
    t
}
async function pe(e) {
  const t = _(e)
    , a = (await N()).transaction(w, "readwrite");
  await a.objectStore(w).delete(t),
    await a.complete
}
async function O(e, t) {
  const n = _(e)
    , i = (await N()).transaction(w, "readwrite")
    , r = i.objectStore(w)
    , s = await r.get(n)
    , o = t(s);
  return o === void 0 ? await r.delete(n) : await r.put(o, n),
    await i.complete,
  o && (!s || s.fid !== o.fid) && de(e, o.fid),
    o
}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
async function x(e) {
  let t;
  const n = await O(e.appConfig, a=>{
      const i = Ue(a)
        , r = Ge(e, i);
      return t = r.registrationPromise,
        r.installationEntry
    }
  );
  return n.fid === $ ? {
    installationEntry: await t
  } : {
    installationEntry: n,
    registrationPromise: t
  }
}
function Ue(e) {
  const t = e || {
    fid: xe(),
    registrationStatus: 0
  };
  return ge(t)
}
function Ge(e, t) {
  if (t.registrationStatus === 0) {
    if (!navigator.onLine) {
      const i = Promise.reject(m.create("app-offline"));
      return {
        installationEntry: t,
        registrationPromise: i
      }
    }
    const n = {
      fid: t.fid,
      registrationStatus: 1,
      registrationTime: Date.now()
    }
      , a = He(e, n);
    return {
      installationEntry: n,
      registrationPromise: a
    }
  } else
    return t.registrationStatus === 1 ? {
      installationEntry: t,
      registrationPromise: Ke(e)
    } : {
      installationEntry: t
    }
}
async function He(e, t) {
  try {
    const n = await Fe(e, t);
    return k(e.appConfig, n)
  } catch (n) {
    throw ae(n) && n.customData.serverCode === 409 ? await pe(e.appConfig) : await k(e.appConfig, {
      fid: t.fid,
      registrationStatus: 0
    }),
      n
  }
}
async function Ke(e) {
  let t = await L(e.appConfig);
  for (; t.registrationStatus === 1; )
    await le(100),
      t = await L(e.appConfig);
  if (t.registrationStatus === 0) {
    const {installationEntry: n, registrationPromise: a} = await x(e);
    return a || n
  }
  return t
}
function L(e) {
  return O(e, t=>{
      if (!t)
        throw m.create("installation-not-found");
      return ge(t)
    }
  )
}
function ge(e) {
  return We(e) ? {
    fid: e.fid,
    registrationStatus: 0
  } : e
}
function We(e) {
  return e.registrationStatus === 1 && e.registrationTime + ee < Date.now()
}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
async function Ye({appConfig: e, heartbeatServiceProvider: t}, n) {
  const a = Je(e, n)
    , i = Pe(e, n)
    , r = t.getImmediate({
    optional: !0
  });
  if (r) {
    const l = await r.getHeartbeatsHeader();
    l && i.append("x-firebase-client", l)
  }
  const s = {
    installation: {
      sdkVersion: te,
      appId: e.appId
    }
  }
    , o = {
    method: "POST",
    headers: i,
    body: JSON.stringify(s)
  }
    , c = await ce(()=>fetch(a, o));
  if (c.ok) {
    const l = await c.json();
    return re(l)
  } else
    throw await se("Generate Auth Token", c)
}
function Je(e, {fid: t}) {
  return `${ie(e)}/${t}/authTokens:generate`
}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
async function j(e, t=!1) {
  let n;
  const a = await O(e.appConfig, r=>{
      if (!he(r))
        throw m.create("not-registered");
      const s = r.authToken;
      if (!t && Ze(s))
        return r;
      if (s.requestStatus === 1)
        return n = Xe(e, t),
          r;
      {
        if (!navigator.onLine)
          throw m.create("app-offline");
        const o = tt(r);
        return n = Qe(e, o),
          o
      }
    }
  );
  return n ? await n : a.authToken
}
async function Xe(e, t) {
  let n = await B(e.appConfig);
  for (; n.authToken.requestStatus === 1; )
    await le(100),
      n = await B(e.appConfig);
  const a = n.authToken;
  return a.requestStatus === 0 ? j(e, t) : a
}
function B(e) {
  return O(e, t=>{
      if (!he(t))
        throw m.create("not-registered");
      const n = t.authToken;
      return nt(n) ? Object.assign(Object.assign({}, t), {
        authToken: {
          requestStatus: 0
        }
      }) : t
    }
  )
}
async function Qe(e, t) {
  try {
    const n = await Ye(e, t)
      , a = Object.assign(Object.assign({}, t), {
      authToken: n
    });
    return await k(e.appConfig, a),
      n
  } catch (n) {
    if (ae(n) && (n.customData.serverCode === 401 || n.customData.serverCode === 404))
      await pe(e.appConfig);
    else {
      const a = Object.assign(Object.assign({}, t), {
        authToken: {
          requestStatus: 0
        }
      });
      await k(e.appConfig, a)
    }
    throw n
  }
}
function he(e) {
  return e !== void 0 && e.registrationStatus === 2
}
function Ze(e) {
  return e.requestStatus === 2 && !et(e)
}
function et(e) {
  const t = Date.now();
  return t < e.creationTime || e.creationTime + e.expiresIn < t + Ee
}
function tt(e) {
  const t = {
    requestStatus: 1,
    requestTime: Date.now()
  };
  return Object.assign(Object.assign({}, e), {
    authToken: t
  })
}
function nt(e) {
  return e.requestStatus === 1 && e.requestTime + ee < Date.now()
}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
async function at(e) {
  const t = e
    , {installationEntry: n, registrationPromise: a} = await x(t);
  return a ? a.catch(console.error) : j(t).catch(console.error),
    n.fid
}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
async function it(e, t=!1) {
  const n = e;
  return await rt(n),
    (await j(n, t)).token
}
async function rt(e) {
  const {registrationPromise: t} = await x(e);
  t && await t
}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function st(e) {
  if (!e || !e.options)
    throw D("App Configuration");
  if (!e.name)
    throw D("App Name");
  const t = ["projectId", "apiKey", "appId"];
  for (const n of t)
    if (!e.options[n])
      throw D(n);
  return {
    appName: e.name,
    projectId: e.options.projectId,
    apiKey: e.options.apiKey,
    appId: e.options.appId
  }
}
function D(e) {
  return m.create("missing-app-config-values", {
    valueName: e
  })
}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const me = "installations"
  , ot = "installations-internal"
  , ct = e=>{
    const t = e.getProvider("app").getImmediate()
      , n = st(t)
      , a = R(t, "heartbeat");
    return {
      app: t,
      appConfig: n,
      heartbeatServiceProvider: a,
      _delete: ()=>Promise.resolve()
    }
  }
  , lt = e=>{
    const t = e.getProvider("app").getImmediate()
      , n = R(t, me).getImmediate();
    return {
      getId: ()=>at(n),
      getToken: i=>it(n, i)
    }
  }
;
function ut() {
  S(new C(me,ct,"PUBLIC")),
    S(new C(ot,lt,"PRIVATE"))
}
ut();
v(Z, M);
v(Z, M, "esm2017");
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const E = "analytics"
  , dt = "firebase_id"
  , ft = "origin"
  , pt = 60 * 1e3
  , gt = "https://firebase.googleapis.com/v1alpha/projects/-/apps/{app-id}/webConfig"
  , we = "https://www.googletagmanager.com/gtag/js";
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const u = new Ce("@firebase/analytics");
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function Ie(e) {
  return Promise.all(e.map(t=>t.catch(n=>n)))
}
function ht(e, t) {
  const n = document.createElement("script");
  n.src = `${we}?l=${e}&id=${t}`,
    n.async = !0,
    document.head.appendChild(n)
}
function mt(e) {
  let t = [];
  return Array.isArray(window[e]) ? t = window[e] : window[e] = t,
    t
}
async function wt(e, t, n, a, i, r) {
  const s = a[i];
  try {
    if (s)
      await t[s];
    else {
      const c = (await Ie(n)).find(l=>l.measurementId === i);
      c && await t[c.appId]
    }
  } catch (o) {
    u.error(o)
  }
  e("config", i, r)
}
async function It(e, t, n, a, i) {
  try {
    let r = [];
    if (i && i.send_to) {
      let s = i.send_to;
      Array.isArray(s) || (s = [s]);
      const o = await Ie(n);
      for (const c of s) {
        const l = o.find(b=>b.measurementId === c)
          , p = l && t[l.appId];
        if (p)
          r.push(p);
        else {
          r = [];
          break
        }
      }
    }
    r.length === 0 && (r = Object.values(t)),
      await Promise.all(r),
      e("event", a, i || {})
  } catch (r) {
    u.error(r)
  }
}
function yt(e, t, n, a) {
  async function i(r, s, o) {
    try {
      r === "event" ? await It(e, t, n, s, o) : r === "config" ? await wt(e, t, n, a, s, o) : e("set", s)
    } catch (c) {
      u.error(c)
    }
  }
  return i
}
function bt(e, t, n, a, i) {
  let r = function(...s) {
    window[a].push(arguments)
  };
  return window[i] && typeof window[i] == "function" && (r = window[i]),
    window[i] = yt(r, e, t, n),
    {
      gtagCore: r,
      wrappedGtag: window[i]
    }
}
function Tt() {
  const e = window.document.getElementsByTagName("script");
  for (const t of Object.values(e))
    if (t.src && t.src.includes(we))
      return t;
  return null
}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const At = {
  ["already-exists"]: "A Firebase Analytics instance with the appId {$id}  already exists. Only one Firebase Analytics instance can be created for each appId.",
  ["already-initialized"]: "initializeAnalytics() cannot be called again with different options than those it was initially called with. It can be called again with the same options to return the existing instance, or getAnalytics() can be used to get a reference to the already-intialized instance.",
  ["already-initialized-settings"]: "Firebase Analytics has already been initialized.settings() must be called before initializing any Analytics instanceor it will have no effect.",
  ["interop-component-reg-failed"]: "Firebase Analytics Interop Component failed to instantiate: {$reason}",
  ["invalid-analytics-context"]: "Firebase Analytics is not supported in this environment. Wrap initialization of analytics in analytics.isSupported() to prevent initialization in unsupported environments. Details: {$errorInfo}",
  ["indexeddb-unavailable"]: "IndexedDB unavailable or restricted in this environment. Wrap initialization of analytics in analytics.isSupported() to prevent initialization in unsupported environments. Details: {$errorInfo}",
  ["fetch-throttle"]: "The config fetch request timed out while in an exponential backoff state. Unix timestamp in milliseconds when fetch request throttling ends: {$throttleEndTimeMillis}.",
  ["config-fetch-failed"]: "Dynamic config fetch failed: [{$httpStatus}] {$responseMessage}",
  ["no-api-key"]: 'The "apiKey" field is empty in the local Firebase config. Firebase Analytics requires this field tocontain a valid API key.',
  ["no-app-id"]: 'The "appId" field is empty in the local Firebase config. Firebase Analytics requires this field tocontain a valid app ID.'
}
  , d = new K("analytics","Analytics",At);
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const vt = 30
  , St = 1e3;
class Ct {
  constructor(t={}, n=St) {
    this.throttleMetadata = t,
      this.intervalMillis = n
  }
  getThrottleMetadata(t) {
    return this.throttleMetadata[t]
  }
  setThrottleMetadata(t, n) {
    this.throttleMetadata[t] = n
  }
  deleteThrottleMetadata(t) {
    delete this.throttleMetadata[t]
  }
}
const ye = new Ct;
function kt(e) {
  return new Headers({
    Accept: "application/json",
    "x-goog-api-key": e
  })
}
async function Et(e) {
  var t;
  const {appId: n, apiKey: a} = e
    , i = {
    method: "GET",
    headers: kt(a)
  }
    , r = gt.replace("{app-id}", n)
    , s = await fetch(r, i);
  if (s.status !== 200 && s.status !== 304) {
    let o = "";
    try {
      const c = await s.json();
      !((t = c.error) === null || t === void 0) && t.message && (o = c.error.message)
    } catch {}
    throw d.create("config-fetch-failed", {
      httpStatus: s.status,
      responseMessage: o
    })
  }
  return s.json()
}
async function Rt(e, t=ye, n) {
  const {appId: a, apiKey: i, measurementId: r} = e.options;
  if (!a)
    throw d.create("no-app-id");
  if (!i) {
    if (r)
      return {
        measurementId: r,
        appId: a
      };
    throw d.create("no-api-key")
  }
  const s = t.getThrottleMetadata(a) || {
    backoffCount: 0,
    throttleEndTimeMillis: Date.now()
  }
    , o = new Pt;
  return setTimeout(async()=>{
      o.abort()
    }
    , n !== void 0 ? n : pt),
    be({
      appId: a,
      apiKey: i,
      measurementId: r
    }, s, o, t)
}
async function be(e, {throttleEndTimeMillis: t, backoffCount: n}, a, i=ye) {
  const {appId: r, measurementId: s} = e;
  try {
    await _t(a, t)
  } catch (o) {
    if (s)
      return u.warn(`Timed out fetching this Firebase app's measurement ID from the server. Falling back to the measurement ID ${s} provided in the "measurementId" field in the local Firebase config. [${o.message}]`),
        {
          appId: r,
          measurementId: s
        };
    throw o
  }
  try {
    const o = await Et(e);
    return i.deleteThrottleMetadata(r),
      o
  } catch (o) {
    if (!Ot(o)) {
      if (i.deleteThrottleMetadata(r),
        s)
        return u.warn(`Failed to fetch this Firebase app's measurement ID from the server. Falling back to the measurement ID ${s} provided in the "measurementId" field in the local Firebase config. [${o.message}]`),
          {
            appId: r,
            measurementId: s
          };
      throw o
    }
    const c = Number(o.customData.httpStatus) === 503 ? q(n, i.intervalMillis, vt) : q(n, i.intervalMillis)
      , l = {
      throttleEndTimeMillis: Date.now() + c,
      backoffCount: n + 1
    };
    return i.setThrottleMetadata(r, l),
      u.debug(`Calling attemptFetch again in ${c} millis`),
      be(e, l, a, i)
  }
}
function _t(e, t) {
  return new Promise((n,a)=>{
      const i = Math.max(t - Date.now(), 0)
        , r = setTimeout(n, i);
      e.addEventListener(()=>{
          clearTimeout(r),
            a(d.create("fetch-throttle", {
              throttleEndTimeMillis: t
            }))
        }
      )
    }
  )
}
function Ot(e) {
  if (!(e instanceof W) || !e.customData)
    return !1;
  const t = Number(e.customData.httpStatus);
  return t === 429 || t === 500 || t === 503 || t === 504
}
class Pt {
  constructor() {
    this.listeners = []
  }
  addEventListener(t) {
    this.listeners.push(t)
  }
  abort() {
    this.listeners.forEach(t=>t())
  }
}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
async function Dt() {
  if (X())
    try {
      await Q()
    } catch (e) {
      return u.warn(d.create("indexeddb-unavailable", {
        errorInfo: e
      }).message),
        !1
    }
  else
    return u.warn(d.create("indexeddb-unavailable", {
      errorInfo: "IndexedDB is not available in this environment."
    }).message),
      !1;
  return !0
}
async function $t(e, t, n, a, i, r, s) {
  var o;
  const c = Rt(e);
  c.then(g=>{
      n[g.measurementId] = g.appId,
      e.options.measurementId && g.measurementId !== e.options.measurementId && u.warn(`The measurement ID in the local Firebase config (${e.options.measurementId}) does not match the measurement ID fetched from the server (${g.measurementId}). To ensure analytics events are always sent to the correct Analytics property, update the measurement ID field in the local config or remove it from the local config.`)
    }
  ).catch(g=>u.error(g)),
    t.push(c);
  const l = Dt().then(g=>{
      if (g)
        return a.getId()
    }
  )
    , [p,b] = await Promise.all([c, l]);
  Tt() || ht(r, p.measurementId),
    i("js", new Date);
  const T = (o = s == null ? void 0 : s.config) !== null && o !== void 0 ? o : {};
  return T[ft] = "firebase",
    T.update = !0,
  b != null && (T[dt] = b),
    i("config", p.measurementId, T),
    p.measurementId
}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Ft {
  constructor(t) {
    this.app = t
  }
  _delete() {
    return delete f[this.app.options.appId],
      Promise.resolve()
  }
}
let f = {}
  , V = [];
const z = {};
let A = "dataLayer", Te = "gtag", U, y, F = !1;
function Ht(e) {
  if (F)
    throw d.create("already-initialized");
  e.dataLayerName && (A = e.dataLayerName),
  e.gtagName && (Te = e.gtagName)
}
function Mt() {
  const e = [];
  if (Y() && e.push("This is a browser extension environment."),
  J() || e.push("Cookies are not available."),
  e.length > 0) {
    const t = e.map((a,i)=>`(${i + 1}) ${a}`).join(" ")
      , n = d.create("invalid-analytics-context", {
      errorInfo: t
    });
    u.warn(n.message)
  }
}
function Nt(e, t, n) {
  Mt();
  const a = e.options.appId;
  if (!a)
    throw d.create("no-app-id");
  if (!e.options.apiKey)
    if (e.options.measurementId)
      u.warn(`The "apiKey" field is empty in the local Firebase config. This is needed to fetch the latest measurement ID for this Firebase app. Falling back to the measurement ID ${e.options.measurementId} provided in the "measurementId" field in the local Firebase config.`);
    else
      throw d.create("no-api-key");
  if (f[a] != null)
    throw d.create("already-exists", {
      id: a
    });
  if (!F) {
    mt(A);
    const {wrappedGtag: r, gtagCore: s} = bt(f, V, z, A, Te);
    y = r,
      U = s,
      F = !0
  }
  return f[a] = $t(e, V, z, t, U, A, n),
    new Ft(e)
}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
async function xt(e, t, n, a, i) {
  if (i && i.global) {
    e("event", n, a);
    return
  } else {
    const r = await t
      , s = Object.assign(Object.assign({}, a), {
      send_to: r
    });
    e("event", n, s)
  }
}
async function jt(e, t, n, a) {
  if (a && a.global)
    return e("set", {
      screen_name: n
    }),
      Promise.resolve();
  {
    const i = await t;
    e("config", i, {
      update: !0,
      screen_name: n
    })
  }
}
async function qt(e, t, n, a) {
  if (a && a.global)
    return e("set", {
      user_id: n
    }),
      Promise.resolve();
  {
    const i = await t;
    e("config", i, {
      update: !0,
      user_id: n
    })
  }
}
async function Lt(e, t, n, a) {
  if (a && a.global) {
    const i = {};
    for (const r of Object.keys(n))
      i[`user_properties.${r}`] = n[r];
    return e("set", i),
      Promise.resolve()
  } else {
    const i = await t;
    e("config", i, {
      update: !0,
      user_properties: n
    })
  }
}
async function Bt(e, t) {
  const n = await e;
  window[`ga-disable-${n}`] = !t
}
function Kt(e=ve()) {
  e = I(e);
  const t = R(e, E);
  return t.isInitialized() ? t.getImmediate() : Vt(e)
}
function Vt(e, t={}) {
  const n = R(e, E);
  if (n.isInitialized()) {
    const i = n.getImmediate();
    if (Se(t, n.getOptions()))
      return i;
    throw d.create("already-initialized")
  }
  return n.initialize({
    options: t
  })
}
async function Wt() {
  if (Y() || !J() || !X())
    return !1;
  try {
    return await Q()
  } catch {
    return !1
  }
}
function Yt(e, t, n) {
  e = I(e),
    jt(y, f[e.app.options.appId], t, n).catch(a=>u.error(a))
}
function Jt(e, t, n) {
  e = I(e),
    qt(y, f[e.app.options.appId], t, n).catch(a=>u.error(a))
}
function Xt(e, t, n) {
  e = I(e),
    Lt(y, f[e.app.options.appId], t, n).catch(a=>u.error(a))
}
function Qt(e, t) {
  e = I(e),
    Bt(f[e.app.options.appId], t).catch(n=>u.error(n))
}
function zt(e, t, n, a) {
  e = I(e),
    xt(y, f[e.app.options.appId], t, n, a).catch(i=>u.error(i))
}
const G = "@firebase/analytics"
  , H = "0.7.7";
function Ut() {
  S(new C(E,(t,{options: n})=>{
      const a = t.getProvider("app").getImmediate()
        , i = t.getProvider("installations-internal").getImmediate();
      return Nt(a, i, n)
    }
    ,"PUBLIC")),
    S(new C("analytics-internal",e,"PRIVATE")),
    v(G, H),
    v(G, H, "esm2017");
  function e(t) {
    try {
      const n = t.getProvider(E).getImmediate();
      return {
        logEvent: (a,i,r)=>zt(n, a, i, r)
      }
    } catch (n) {
      throw d.create("interop-component-reg-failed", {
        reason: n
      })
    }
  }
}
Ut();
export {Kt as getAnalytics, Vt as initializeAnalytics, Wt as isSupported, zt as logEvent, Qt as setAnalyticsCollectionEnabled, Yt as setCurrentScreen, Jt as setUserId, Xt as setUserProperties, Ht as settings};
