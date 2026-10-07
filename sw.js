// 画面（HTML）はネットを優先し、3秒で返事がなければ端末に保存した版で開く。
// Firebaseの部品・フォント・アイコンなどは端末に保存した版をすぐ使い、裏で新しい版に更新する。
const CACHE="kakei-v24";
const CORE=["./","./manifest.webmanifest","./firebase-config.js","./firebase-bridge.js","./apple-touch-icon.png","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.all(CORE.map(u=>c.add(u).catch(()=>{})))));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
const OK_HOSTS=["www.gstatic.com","fonts.googleapis.com","fonts.gstatic.com","cdnjs.cloudflare.com","cdn.jsdelivr.net"];
const timeout=(ms)=>new Promise((_,rej)=>setTimeout(()=>rej(new Error("timeout")),ms));
self.addEventListener("fetch",e=>{const req=e.request;if(req.method!=="GET")return;const u=new URL(req.url);const same=u.origin===location.origin;
  if(req.mode==="navigate"){
    e.respondWith((async()=>{const c=await caches.open(CACHE);
      try{const r=await Promise.race([fetch(req),timeout(3000)]);if(r&&r.ok&&!r.redirected)c.put("./",r.clone());return r}
      catch(err){const hit=await c.match("./");if(hit)return hit;return fetch(req)}})());return}
  if(!same&&!OK_HOSTS.includes(u.hostname))return; // データのやりとり（Firebase）はそのまま
  if(same&&u.pathname.endsWith("/sw.js"))return;
  e.respondWith((async()=>{const c=await caches.open(CACHE);const hit=await c.match(req,{ignoreSearch:same});
    const net=fetch(req).then(r=>{if(r&&(r.ok||r.type==="opaque")&&!r.redirected)c.put(req,r.clone());return r}).catch(()=>hit||Response.error());
    return hit||net})());
});
