// オフラインでも開けるように、このアプリのファイルを端末に保存します
const CACHE="kakei-v2";
const FILES=["./","./index.html","./manifest.webmanifest","./firebase-config.js","./firebase-bridge.js","./apple-touch-icon.png","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener("fetch",e=>{const u=new URL(e.request.url);
  if(u.origin===location.origin){ // 自分のファイル：まずネット、だめなら保存したもの（更新がすぐ届くように）
    e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request)))}
});
