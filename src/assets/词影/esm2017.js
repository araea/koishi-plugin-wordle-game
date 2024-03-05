/**
 * @license
 * Copyright 2017 Google LLC
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
/**
 * @license
 * Copyright 2017 Google LLC
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
const P = function(t) {
  const e = [];
  let r = 0;
  for (let s = 0; s < t.length; s++) {
    let n = t.charCodeAt(s);
    n < 128 ? e[r++] = n : n < 2048 ? (e[r++] = n >> 6 | 192,
      e[r++] = n & 63 | 128) : (n & 64512) === 55296 && s + 1 < t.length && (t.charCodeAt(s + 1) & 64512) === 56320 ? (n = 65536 + ((n & 1023) << 10) + (t.charCodeAt(++s) & 1023),
      e[r++] = n >> 18 | 240,
      e[r++] = n >> 12 & 63 | 128,
      e[r++] = n >> 6 & 63 | 128,
      e[r++] = n & 63 | 128) : (e[r++] = n >> 12 | 224,
      e[r++] = n >> 6 & 63 | 128,
      e[r++] = n & 63 | 128)
  }
  return e
}
  , G = function(t) {
  const e = [];
  let r = 0
    , s = 0;
  for (; r < t.length; ) {
    const n = t[r++];
    if (n < 128)
      e[s++] = String.fromCharCode(n);
    else if (n > 191 && n < 224) {
      const a = t[r++];
      e[s++] = String.fromCharCode((n & 31) << 6 | a & 63)
    } else if (n > 239 && n < 365) {
      const a = t[r++]
        , i = t[r++]
        , o = t[r++]
        , h = ((n & 7) << 18 | (a & 63) << 12 | (i & 63) << 6 | o & 63) - 65536;
      e[s++] = String.fromCharCode(55296 + (h >> 10)),
        e[s++] = String.fromCharCode(56320 + (h & 1023))
    } else {
      const a = t[r++]
        , i = t[r++];
      e[s++] = String.fromCharCode((n & 15) << 12 | (a & 63) << 6 | i & 63)
    }
  }
  return e.join("")
}
  , K = {
  byteToCharMap_: null,
  charToByteMap_: null,
  byteToCharMapWebSafe_: null,
  charToByteMapWebSafe_: null,
  ENCODED_VALS_BASE: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  get ENCODED_VALS() {
    return this.ENCODED_VALS_BASE + "+/="
  },
  get ENCODED_VALS_WEBSAFE() {
    return this.ENCODED_VALS_BASE + "-_."
  },
  HAS_NATIVE_SUPPORT: typeof atob == "function",
  encodeByteArray(t, e) {
    if (!Array.isArray(t))
      throw Error("encodeByteArray takes an array as a parameter");
    this.init_();
    const r = e ? this.byteToCharMapWebSafe_ : this.byteToCharMap_
      , s = [];
    for (let n = 0; n < t.length; n += 3) {
      const a = t[n]
        , i = n + 1 < t.length
        , o = i ? t[n + 1] : 0
        , h = n + 2 < t.length
        , l = h ? t[n + 2] : 0
        , T = a >> 2
        , p = (a & 3) << 4 | o >> 4;
      let b = (o & 15) << 2 | l >> 6
        , _ = l & 63;
      h || (_ = 64,
      i || (b = 64)),
        s.push(r[T], r[p], r[b], r[_])
    }
    return s.join("")
  },
  encodeString(t, e) {
    return this.HAS_NATIVE_SUPPORT && !e ? btoa(t) : this.encodeByteArray(P(t), e)
  },
  decodeString(t, e) {
    return this.HAS_NATIVE_SUPPORT && !e ? atob(t) : G(this.decodeStringToByteArray(t, e))
  },
  decodeStringToByteArray(t, e) {
    this.init_();
    const r = e ? this.charToByteMapWebSafe_ : this.charToByteMap_
      , s = [];
    for (let n = 0; n < t.length; ) {
      const a = r[t.charAt(n++)]
        , o = n < t.length ? r[t.charAt(n)] : 0;
      ++n;
      const l = n < t.length ? r[t.charAt(n)] : 64;
      ++n;
      const p = n < t.length ? r[t.charAt(n)] : 64;
      if (++n,
      a == null || o == null || l == null || p == null)
        throw Error();
      const b = a << 2 | o >> 4;
      if (s.push(b),
      l !== 64) {
        const _ = o << 4 & 240 | l >> 2;
        if (s.push(_),
        p !== 64) {
          const q = l << 6 & 192 | p;
          s.push(q)
        }
      }
    }
    return s
  },
  init_() {
    if (!this.byteToCharMap_) {
      this.byteToCharMap_ = {},
        this.charToByteMap_ = {},
        this.byteToCharMapWebSafe_ = {},
        this.charToByteMapWebSafe_ = {};
      for (let t = 0; t < this.ENCODED_VALS.length; t++)
        this.byteToCharMap_[t] = this.ENCODED_VALS.charAt(t),
          this.charToByteMap_[this.byteToCharMap_[t]] = t,
          this.byteToCharMapWebSafe_[t] = this.ENCODED_VALS_WEBSAFE.charAt(t),
          this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[t]] = t,
        t >= this.ENCODED_VALS_BASE.length && (this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(t)] = t,
          this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(t)] = t)
    }
  }
}
  , Y = function(t) {
  const e = P(t);
  return K.encodeByteArray(e, !0)
}
  , F = function(t) {
  return Y(t).replace(/\./g, "")
};
/**
 * @license
 * Copyright 2017 Google LLC
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
class X {
  constructor() {
    this.reject = ()=>{}
      ,
      this.resolve = ()=>{}
      ,
      this.promise = new Promise((e,r)=>{
          this.resolve = e,
            this.reject = r
        }
      )
  }
  wrapCallback(e) {
    return (r,s)=>{
      r ? this.reject(r) : this.resolve(s),
      typeof e == "function" && (this.promise.catch(()=>{}
      ),
        e.length === 1 ? e(r) : e(r, s))
    }
  }
}
function st() {
  const t = typeof chrome == "object" ? chrome.runtime : typeof browser == "object" ? browser.runtime : void 0;
  return typeof t == "object" && t.id !== void 0
}
function J() {
  return typeof indexedDB == "object"
}
function Z() {
  return new Promise((t,e)=>{
      try {
        let r = !0;
        const s = "validate-browser-context-for-indexeddb-analytics-module"
          , n = self.indexedDB.open(s);
        n.onsuccess = ()=>{
          n.result.close(),
          r || self.indexedDB.deleteDatabase(s),
            t(!0)
        }
          ,
          n.onupgradeneeded = ()=>{
            r = !1
          }
          ,
          n.onerror = ()=>{
            var a;
            e(((a = n.error) === null || a === void 0 ? void 0 : a.message) || "")
          }
      } catch (r) {
        e(r)
      }
    }
  )
}
function at() {
  return !(typeof navigator == "undefined" || !navigator.cookieEnabled)
}
/**
 * @license
 * Copyright 2017 Google LLC
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
const Q = "FirebaseError";
class w extends Error {
  constructor(e, r, s) {
    super(r);
    this.code = e,
      this.customData = s,
      this.name = Q,
      Object.setPrototypeOf(this, w.prototype),
    Error.captureStackTrace && Error.captureStackTrace(this, j.prototype.create)
  }
}
class j {
  constructor(e, r, s) {
    this.service = e,
      this.serviceName = r,
      this.errors = s
  }
  create(e, ...r) {
    const s = r[0] || {}
      , n = `${this.service}/${e}`
      , a = this.errors[e]
      , i = a ? ee(a, s) : "Error"
      , o = `${this.serviceName}: ${i} (${n}).`;
    return new w(n,o,s)
  }
}
function ee(t, e) {
  return t.replace(te, (r,s)=>{
      const n = e[s];
      return n != null ? String(n) : `<${s}?>`
    }
  )
}
const te = /\{\$([^}]+)}/g;
function S(t, e) {
  if (t === e)
    return !0;
  const r = Object.keys(t)
    , s = Object.keys(e);
  for (const n of r) {
    if (!s.includes(n))
      return !1;
    const a = t[n]
      , i = e[n];
    if ($(a) && $(i)) {
      if (!S(a, i))
        return !1
    } else if (a !== i)
      return !1
  }
  for (const n of s)
    if (!r.includes(n))
      return !1;
  return !0
}
function $(t) {
  return t !== null && typeof t == "object"
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
const re = 1e3
  , ne = 2
  , se = 4 * 60 * 60 * 1e3
  , ae = .5;
function it(t, e=re, r=ne) {
  const s = e * Math.pow(r, t)
    , n = Math.round(ae * s * (Math.random() - .5) * 2);
  return Math.min(se, s + n)
}
/**
 * @license
 * Copyright 2021 Google LLC
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
function ot(t) {
  return t && t._delegate ? t._delegate : t
}
/**
 * @license
 * Copyright 2022 Google LLC
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
function m(t, e) {
  return new Promise((r,s)=>{
      t.onsuccess = n=>{
        r(n.target.result)
      }
        ,
        t.onerror = n=>{
          var a;
          s(`${e}: ${(a = n.target.error) === null || a === void 0 ? void 0 : a.message}`)
        }
    }
  )
}
class N {
  constructor(e) {
    this._db = e,
      this.objectStoreNames = this._db.objectStoreNames
  }
  transaction(e, r) {
    return new V(this._db.transaction.call(this._db, e, r))
  }
  createObjectStore(e, r) {
    return new k(this._db.createObjectStore(e, r))
  }
  close() {
    this._db.close()
  }
}
class V {
  constructor(e) {
    this._transaction = e,
      this.complete = new Promise((r,s)=>{
          this._transaction.oncomplete = function() {
            r()
          }
            ,
            this._transaction.onerror = ()=>{
              s(this._transaction.error)
            }
            ,
            this._transaction.onabort = ()=>{
              s(this._transaction.error)
            }
        }
      )
  }
  objectStore(e) {
    return new k(this._transaction.objectStore(e))
  }
}
class k {
  constructor(e) {
    this._store = e
  }
  index(e) {
    return new M(this._store.index(e))
  }
  createIndex(e, r, s) {
    return new M(this._store.createIndex(e, r, s))
  }
  get(e) {
    const r = this._store.get(e);
    return m(r, "Error reading from IndexedDB")
  }
  put(e, r) {
    const s = this._store.put(e, r);
    return m(s, "Error writing to IndexedDB")
  }
  delete(e) {
    const r = this._store.delete(e);
    return m(r, "Error deleting from IndexedDB")
  }
  clear() {
    const e = this._store.clear();
    return m(e, "Error clearing IndexedDB object store")
  }
}
class M {
  constructor(e) {
    this._index = e
  }
  get(e) {
    const r = this._index.get(e);
    return m(r, "Error reading from IndexedDB")
  }
}
function ie(t, e, r) {
  return new Promise((s,n)=>{
      try {
        const a = indexedDB.open(t, e);
        a.onsuccess = i=>{
          s(new N(i.target.result))
        }
          ,
          a.onerror = i=>{
            var o;
            n(`Error opening indexedDB: ${(o = i.target.error) === null || o === void 0 ? void 0 : o.message}`)
          }
          ,
          a.onupgradeneeded = i=>{
            r(new N(a.result), i.oldVersion, i.newVersion, new V(a.transaction))
          }
      } catch (a) {
        n(`Error opening indexedDB: ${a.message}`)
      }
    }
  )
}
class E {
  constructor(e, r, s) {
    this.name = e,
      this.instanceFactory = r,
      this.type = s,
      this.multipleInstances = !1,
      this.serviceProps = {},
      this.instantiationMode = "LAZY",
      this.onInstanceCreated = null
  }
  setInstantiationMode(e) {
    return this.instantiationMode = e,
      this
  }
  setMultipleInstances(e) {
    return this.multipleInstances = e,
      this
  }
  setServiceProps(e) {
    return this.serviceProps = e,
      this
  }
  setInstanceCreatedCallback(e) {
    return this.onInstanceCreated = e,
      this
  }
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
const f = "[DEFAULT]";
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
class oe {
  constructor(e, r) {
    this.name = e,
      this.container = r,
      this.component = null,
      this.instances = new Map,
      this.instancesDeferred = new Map,
      this.instancesOptions = new Map,
      this.onInitCallbacks = new Map
  }
  get(e) {
    const r = this.normalizeInstanceIdentifier(e);
    if (!this.instancesDeferred.has(r)) {
      const s = new X;
      if (this.instancesDeferred.set(r, s),
      this.isInitialized(r) || this.shouldAutoInitialize())
        try {
          const n = this.getOrInitializeService({
            instanceIdentifier: r
          });
          n && s.resolve(n)
        } catch {}
    }
    return this.instancesDeferred.get(r).promise
  }
  getImmediate(e) {
    var r;
    const s = this.normalizeInstanceIdentifier(e == null ? void 0 : e.identifier)
      , n = (r = e == null ? void 0 : e.optional) !== null && r !== void 0 ? r : !1;
    if (this.isInitialized(s) || this.shouldAutoInitialize())
      try {
        return this.getOrInitializeService({
          instanceIdentifier: s
        })
      } catch (a) {
        if (n)
          return null;
        throw a
      }
    else {
      if (n)
        return null;
      throw Error(`Service ${this.name} is not available`)
    }
  }
  getComponent() {
    return this.component
  }
  setComponent(e) {
    if (e.name !== this.name)
      throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);
    if (this.component)
      throw Error(`Component for ${this.name} has already been provided`);
    if (this.component = e,
      !!this.shouldAutoInitialize()) {
      if (he(e))
        try {
          this.getOrInitializeService({
            instanceIdentifier: f
          })
        } catch {}
      for (const [r,s] of this.instancesDeferred.entries()) {
        const n = this.normalizeInstanceIdentifier(r);
        try {
          const a = this.getOrInitializeService({
            instanceIdentifier: n
          });
          s.resolve(a)
        } catch {}
      }
    }
  }
  clearInstance(e=f) {
    this.instancesDeferred.delete(e),
      this.instancesOptions.delete(e),
      this.instances.delete(e)
  }
  async delete() {
    const e = Array.from(this.instances.values());
    await Promise.all([...e.filter(r=>"INTERNAL"in r).map(r=>r.INTERNAL.delete()), ...e.filter(r=>"_delete"in r).map(r=>r._delete())])
  }
  isComponentSet() {
    return this.component != null
  }
  isInitialized(e=f) {
    return this.instances.has(e)
  }
  getOptions(e=f) {
    return this.instancesOptions.get(e) || {}
  }
  initialize(e={}) {
    const {options: r={}} = e
      , s = this.normalizeInstanceIdentifier(e.instanceIdentifier);
    if (this.isInitialized(s))
      throw Error(`${this.name}(${s}) has already been initialized`);
    if (!this.isComponentSet())
      throw Error(`Component ${this.name} has not been registered yet`);
    const n = this.getOrInitializeService({
      instanceIdentifier: s,
      options: r
    });
    for (const [a,i] of this.instancesDeferred.entries()) {
      const o = this.normalizeInstanceIdentifier(a);
      s === o && i.resolve(n)
    }
    return n
  }
  onInit(e, r) {
    var s;
    const n = this.normalizeInstanceIdentifier(r)
      , a = (s = this.onInitCallbacks.get(n)) !== null && s !== void 0 ? s : new Set;
    a.add(e),
      this.onInitCallbacks.set(n, a);
    const i = this.instances.get(n);
    return i && e(i, n),
      ()=>{
        a.delete(e)
      }
  }
  invokeOnInitCallbacks(e, r) {
    const s = this.onInitCallbacks.get(r);
    if (!!s)
      for (const n of s)
        try {
          n(e, r)
        } catch {}
  }
  getOrInitializeService({instanceIdentifier: e, options: r={}}) {
    let s = this.instances.get(e);
    if (!s && this.component && (s = this.component.instanceFactory(this.container, {
      instanceIdentifier: ce(e),
      options: r
    }),
      this.instances.set(e, s),
      this.instancesOptions.set(e, r),
      this.invokeOnInitCallbacks(s, e),
      this.component.onInstanceCreated))
      try {
        this.component.onInstanceCreated(this.container, e, s)
      } catch {}
    return s || null
  }
  normalizeInstanceIdentifier(e=f) {
    return this.component ? this.component.multipleInstances ? e : f : e
  }
  shouldAutoInitialize() {
    return !!this.component && this.component.instantiationMode !== "EXPLICIT"
  }
}
function ce(t) {
  return t === f ? void 0 : t
}
function he(t) {
  return t.instantiationMode === "EAGER"
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
class le {
  constructor(e) {
    this.name = e,
      this.providers = new Map
  }
  addComponent(e) {
    const r = this.getProvider(e.name);
    if (r.isComponentSet())
      throw new Error(`Component ${e.name} has already been registered with ${this.name}`);
    r.setComponent(e)
  }
  addOrOverwriteComponent(e) {
    this.getProvider(e.name).isComponentSet() && this.providers.delete(e.name),
      this.addComponent(e)
  }
  getProvider(e) {
    if (this.providers.has(e))
      return this.providers.get(e);
    const r = new oe(e,this);
    return this.providers.set(e, r),
      r
  }
  getProviders() {
    return Array.from(this.providers.values())
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
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
const A = [];
var c;
(function(t) {
    t[t.DEBUG = 0] = "DEBUG",
      t[t.VERBOSE = 1] = "VERBOSE",
      t[t.INFO = 2] = "INFO",
      t[t.WARN = 3] = "WARN",
      t[t.ERROR = 4] = "ERROR",
      t[t.SILENT = 5] = "SILENT"
  }
)(c || (c = {}));
const z = {
    debug: c.DEBUG,
    verbose: c.VERBOSE,
    info: c.INFO,
    warn: c.WARN,
    error: c.ERROR,
    silent: c.SILENT
  }
  , de = c.INFO
  , fe = {
    [c.DEBUG]: "log",
    [c.VERBOSE]: "log",
    [c.INFO]: "info",
    [c.WARN]: "warn",
    [c.ERROR]: "error"
  }
  , ue = (t,e,...r)=>{
    if (e < t.logLevel)
      return;
    const s = new Date().toISOString()
      , n = fe[e];
    if (n)
      console[n](`[${s}]  ${t.name}:`, ...r);
    else
      throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`)
  }
;
class pe {
  constructor(e) {
    this.name = e,
      this._logLevel = de,
      this._logHandler = ue,
      this._userLogHandler = null,
      A.push(this)
  }
  get logLevel() {
    return this._logLevel
  }
  set logLevel(e) {
    if (!(e in c))
      throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);
    this._logLevel = e
  }
  setLogLevel(e) {
    this._logLevel = typeof e == "string" ? z[e] : e
  }
  get logHandler() {
    return this._logHandler
  }
  set logHandler(e) {
    if (typeof e != "function")
      throw new TypeError("Value assigned to `logHandler` must be a function");
    this._logHandler = e
  }
  get userLogHandler() {
    return this._userLogHandler
  }
  set userLogHandler(e) {
    this._userLogHandler = e
  }
  debug(...e) {
    this._userLogHandler && this._userLogHandler(this, c.DEBUG, ...e),
      this._logHandler(this, c.DEBUG, ...e)
  }
  log(...e) {
    this._userLogHandler && this._userLogHandler(this, c.VERBOSE, ...e),
      this._logHandler(this, c.VERBOSE, ...e)
  }
  info(...e) {
    this._userLogHandler && this._userLogHandler(this, c.INFO, ...e),
      this._logHandler(this, c.INFO, ...e)
  }
  warn(...e) {
    this._userLogHandler && this._userLogHandler(this, c.WARN, ...e),
      this._logHandler(this, c.WARN, ...e)
  }
  error(...e) {
    this._userLogHandler && this._userLogHandler(this, c.ERROR, ...e),
      this._logHandler(this, c.ERROR, ...e)
  }
}
function me(t) {
  A.forEach(e=>{
      e.setLogLevel(t)
    }
  )
}
function ge(t, e) {
  for (const r of A) {
    let s = null;
    e && e.level && (s = z[e.level]),
      t === null ? r.userLogHandler = null : r.userLogHandler = (n,a,...i)=>{
        const o = i.map(h=>{
            if (h == null)
              return null;
            if (typeof h == "string")
              return h;
            if (typeof h == "number" || typeof h == "boolean")
              return h.toString();
            if (h instanceof Error)
              return h.message;
            try {
              return JSON.stringify(h)
            } catch {
              return null
            }
          }
        ).filter(h=>h).join(" ");
        a >= (s != null ? s : n.logLevel) && t({
          level: c[a].toLowerCase(),
          message: o,
          args: i,
          type: n.name
        })
      }
  }
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
class be {
  constructor(e) {
    this.container = e
  }
  getPlatformInfoString() {
    return this.container.getProviders().map(r=>{
        if (_e(r)) {
          const s = r.getImmediate();
          return `${s.library}/${s.version}`
        } else
          return null
      }
    ).filter(r=>r).join(" ")
  }
}
function _e(t) {
  const e = t.getComponent();
  return (e == null ? void 0 : e.type) === "VERSION"
}
const D = "@firebase/app"
  , R = "0.7.20";
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
const B = new pe("@firebase/app")
  , Ee = "@firebase/app-compat"
  , ye = "@firebase/analytics-compat"
  , Ie = "@firebase/analytics"
  , ve = "@firebase/app-check-compat"
  , Se = "@firebase/app-check"
  , De = "@firebase/auth"
  , Ce = "@firebase/auth-compat"
  , we = "@firebase/database"
  , Ae = "@firebase/database-compat"
  , Be = "@firebase/functions"
  , Oe = "@firebase/functions-compat"
  , Te = "@firebase/installations"
  , $e = "@firebase/installations-compat"
  , Ne = "@firebase/messaging"
  , Me = "@firebase/messaging-compat"
  , Re = "@firebase/performance"
  , Le = "@firebase/performance-compat"
  , xe = "@firebase/remote-config"
  , He = "@firebase/remote-config-compat"
  , Pe = "@firebase/storage"
  , Fe = "@firebase/storage-compat"
  , je = "@firebase/firestore"
  , Ve = "@firebase/firestore-compat"
  , ke = "firebase"
  , ze = "9.6.10";
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
const O = "[DEFAULT]"
  , Ue = {
  [D]: "fire-core",
  [Ee]: "fire-core-compat",
  [Ie]: "fire-analytics",
  [ye]: "fire-analytics-compat",
  [Se]: "fire-app-check",
  [ve]: "fire-app-check-compat",
  [De]: "fire-auth",
  [Ce]: "fire-auth-compat",
  [we]: "fire-rtdb",
  [Ae]: "fire-rtdb-compat",
  [Be]: "fire-fn",
  [Oe]: "fire-fn-compat",
  [Te]: "fire-iid",
  [$e]: "fire-iid-compat",
  [Ne]: "fire-fcm",
  [Me]: "fire-fcm-compat",
  [Re]: "fire-perf",
  [Le]: "fire-perf-compat",
  [xe]: "fire-rc",
  [He]: "fire-rc-compat",
  [Pe]: "fire-gcs",
  [Fe]: "fire-gcs-compat",
  [je]: "fire-fst",
  [Ve]: "fire-fst-compat",
  "fire-js": "fire-js",
  [ke]: "fire-js-all"
};
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
const u = new Map
  , y = new Map;
function We(t, e) {
  try {
    t.container.addComponent(e)
  } catch (r) {
    B.debug(`Component ${e.name} failed to register with FirebaseApp ${t.name}`, r)
  }
}
function ct(t, e) {
  t.container.addOrOverwriteComponent(e)
}
function C(t) {
  const e = t.name;
  if (y.has(e))
    return B.debug(`There were multiple attempts to register component ${e}.`),
      !1;
  y.set(e, t);
  for (const r of u.values())
    We(r, t);
  return !0
}
function qe(t, e) {
  const r = t.container.getProvider("heartbeat").getImmediate({
    optional: !0
  });
  return r && r.triggerHeartbeat(),
    t.container.getProvider(e)
}
function ht(t, e, r=O) {
  qe(t, e).clearInstance(r)
}
function lt() {
  y.clear()
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
const Ge = {
  ["no-app"]: "No Firebase App '{$appName}' has been created - call Firebase App.initializeApp()",
  ["bad-app-name"]: "Illegal App name: '{$appName}",
  ["duplicate-app"]: "Firebase App named '{$appName}' already exists with different options or config",
  ["app-deleted"]: "Firebase App named '{$appName}' already deleted",
  ["invalid-app-argument"]: "firebase.{$appName}() takes either no argument or a Firebase App instance.",
  ["invalid-log-argument"]: "First argument to `onLog` must be null or a function.",
  ["storage-open"]: "Error thrown when opening storage. Original error: {$originalErrorMessage}.",
  ["storage-get"]: "Error thrown when reading from storage. Original error: {$originalErrorMessage}.",
  ["storage-set"]: "Error thrown when writing to storage. Original error: {$originalErrorMessage}.",
  ["storage-delete"]: "Error thrown when deleting from storage. Original error: {$originalErrorMessage}."
}
  , d = new j("app","Firebase",Ge);
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
class Ke {
  constructor(e, r, s) {
    this._isDeleted = !1,
      this._options = Object.assign({}, e),
      this._config = Object.assign({}, r),
      this._name = r.name,
      this._automaticDataCollectionEnabled = r.automaticDataCollectionEnabled,
      this._container = s,
      this.container.addComponent(new E("app",()=>this,"PUBLIC"))
  }
  get automaticDataCollectionEnabled() {
    return this.checkDestroyed(),
      this._automaticDataCollectionEnabled
  }
  set automaticDataCollectionEnabled(e) {
    this.checkDestroyed(),
      this._automaticDataCollectionEnabled = e
  }
  get name() {
    return this.checkDestroyed(),
      this._name
  }
  get options() {
    return this.checkDestroyed(),
      this._options
  }
  get config() {
    return this.checkDestroyed(),
      this._config
  }
  get container() {
    return this._container
  }
  get isDeleted() {
    return this._isDeleted
  }
  set isDeleted(e) {
    this._isDeleted = e
  }
  checkDestroyed() {
    if (this.isDeleted)
      throw d.create("app-deleted", {
        appName: this._name
      })
  }
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
const dt = ze;
function ft(t, e={}) {
  typeof e != "object" && (e = {
    name: e
  });
  const r = Object.assign({
    name: O,
    automaticDataCollectionEnabled: !1
  }, e)
    , s = r.name;
  if (typeof s != "string" || !s)
    throw d.create("bad-app-name", {
      appName: String(s)
    });
  const n = u.get(s);
  if (n) {
    if (S(t, n.options) && S(r, n.config))
      return n;
    throw d.create("duplicate-app", {
      appName: s
    })
  }
  const a = new le(s);
  for (const o of y.values())
    a.addComponent(o);
  const i = new Ke(t,r,a);
  return u.set(s, i),
    i
}
function ut(t=O) {
  const e = u.get(t);
  if (!e)
    throw d.create("no-app", {
      appName: t
    });
  return e
}
function pt() {
  return Array.from(u.values())
}
async function mt(t) {
  const e = t.name;
  u.has(e) && (u.delete(e),
    await Promise.all(t.container.getProviders().map(r=>r.delete())),
    t.isDeleted = !0)
}
function I(t, e, r) {
  var s;
  let n = (s = Ue[t]) !== null && s !== void 0 ? s : t;
  r && (n += `-${r}`);
  const a = n.match(/\s|\//)
    , i = e.match(/\s|\//);
  if (a || i) {
    const o = [`Unable to register library "${n}" with version "${e}":`];
    a && o.push(`library name "${n}" contains illegal characters (whitespace or "/")`),
    a && i && o.push("and"),
    i && o.push(`version name "${e}" contains illegal characters (whitespace or "/")`),
      B.warn(o.join(" "));
    return
  }
  C(new E(`${n}-version`,()=>({
    library: n,
    version: e
  }),"VERSION"))
}
function gt(t, e) {
  if (t !== null && typeof t != "function")
    throw d.create("invalid-log-argument");
  ge(t, e)
}
function bt(t) {
  me(t)
}
/**
 * @license
 * Copyright 2021 Google LLC
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
const Ye = "firebase-heartbeat-database"
  , Xe = 1
  , g = "firebase-heartbeat-store";
let v = null;
function U() {
  return v || (v = ie(Ye, Xe, (t,e)=>{
      switch (e) {
        case 0:
          t.createObjectStore(g)
      }
    }
  ).catch(t=>{
      throw d.create("storage-open", {
        originalErrorMessage: t.message
      })
    }
  )),
    v
}
async function Je(t) {
  try {
    return (await U()).transaction(g).objectStore(g).get(W(t))
  } catch (e) {
    throw d.create("storage-get", {
      originalErrorMessage: e.message
    })
  }
}
async function L(t, e) {
  try {
    const s = (await U()).transaction(g, "readwrite");
    return await s.objectStore(g).put(e, W(t)),
      s.complete
  } catch (r) {
    throw d.create("storage-set", {
      originalErrorMessage: r.message
    })
  }
}
function W(t) {
  return `${t.name}!${t.options.appId}`
}
/**
 * @license
 * Copyright 2021 Google LLC
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
const Ze = 1024
  , Qe = 30 * 24 * 60 * 60 * 1e3;
class et {
  constructor(e) {
    this.container = e,
      this._heartbeatsCache = null;
    const r = this.container.getProvider("app").getImmediate();
    this._storage = new rt(r),
      this._heartbeatsCachePromise = this._storage.read().then(s=>(this._heartbeatsCache = s,
        s))
  }
  async triggerHeartbeat() {
    const r = this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString()
      , s = x();
    if (this._heartbeatsCache === null && (this._heartbeatsCache = await this._heartbeatsCachePromise),
      !(this._heartbeatsCache.lastSentHeartbeatDate === s || this._heartbeatsCache.heartbeats.some(n=>n.date === s)))
      return this._heartbeatsCache.heartbeats.push({
        date: s,
        agent: r
      }),
        this._heartbeatsCache.heartbeats = this._heartbeatsCache.heartbeats.filter(n=>{
            const a = new Date(n.date).valueOf();
            return Date.now() - a <= Qe
          }
        ),
        this._storage.overwrite(this._heartbeatsCache)
  }
  async getHeartbeatsHeader() {
    if (this._heartbeatsCache === null && await this._heartbeatsCachePromise,
    this._heartbeatsCache === null || this._heartbeatsCache.heartbeats.length === 0)
      return "";
    const e = x()
      , {heartbeatsToSend: r, unsentEntries: s} = tt(this._heartbeatsCache.heartbeats)
      , n = F(JSON.stringify({
      version: 2,
      heartbeats: r
    }));
    return this._heartbeatsCache.lastSentHeartbeatDate = e,
      s.length > 0 ? (this._heartbeatsCache.heartbeats = s,
        await this._storage.overwrite(this._heartbeatsCache)) : (this._heartbeatsCache.heartbeats = [],
        this._storage.overwrite(this._heartbeatsCache)),
      n
  }
}
function x() {
  return new Date().toISOString().substring(0, 10)
}
function tt(t, e=Ze) {
  const r = [];
  let s = t.slice();
  for (const n of t) {
    const a = r.find(i=>i.agent === n.agent);
    if (a) {
      if (a.dates.push(n.date),
      H(r) > e) {
        a.dates.pop();
        break
      }
    } else if (r.push({
      agent: n.agent,
      dates: [n.date]
    }),
    H(r) > e) {
      r.pop();
      break
    }
    s = s.slice(1)
  }
  return {
    heartbeatsToSend: r,
    unsentEntries: s
  }
}
class rt {
  constructor(e) {
    this.app = e,
      this._canUseIndexedDBPromise = this.runIndexedDBEnvironmentCheck()
  }
  async runIndexedDBEnvironmentCheck() {
    return J() ? Z().then(()=>!0).catch(()=>!1) : !1
  }
  async read() {
    return await this._canUseIndexedDBPromise ? await Je(this.app) || {
      heartbeats: []
    } : {
      heartbeats: []
    }
  }
  async overwrite(e) {
    var r;
    if (await this._canUseIndexedDBPromise) {
      const n = await this.read();
      return L(this.app, {
        lastSentHeartbeatDate: (r = e.lastSentHeartbeatDate) !== null && r !== void 0 ? r : n.lastSentHeartbeatDate,
        heartbeats: e.heartbeats
      })
    } else
      return
  }
  async add(e) {
    var r;
    if (await this._canUseIndexedDBPromise) {
      const n = await this.read();
      return L(this.app, {
        lastSentHeartbeatDate: (r = e.lastSentHeartbeatDate) !== null && r !== void 0 ? r : n.lastSentHeartbeatDate,
        heartbeats: [...n.heartbeats, ...e.heartbeats]
      })
    } else
      return
  }
}
function H(t) {
  return F(JSON.stringify({
    version: 2,
    heartbeats: t
  })).length
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
function nt(t) {
  C(new E("platform-logger",e=>new be(e),"PRIVATE")),
    C(new E("heartbeat",e=>new et(e),"PRIVATE")),
    I(D, R, t),
    I(D, R, "esm2017"),
    I("fire-js", "")
}
nt("");
export {E as C, O as D, j as E, w as F, pe as L, dt as S, We as _, ct as a, u as b, lt as c, y as d, qe as e, C as f, ht as g, mt as h, ut as i, pt as j, ft as k, ie as l, ot as m, S as n, gt as o, st as p, at as q, I as r, bt as s, J as t, it as u, Z as v};
