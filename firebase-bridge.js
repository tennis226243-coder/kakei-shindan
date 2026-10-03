// Firebase（Firestore＋匿名ログイン）を、アプリの共有データの仕組みにつなぐ橋渡し
(function(){
  const q=new URLSearchParams(location.search);
  window.PENDING_JOIN=q.get("join")||null;
  // 招待コードを読み取ったら、アドレスから ?join=… を消す（ブックマークや共有に招待コードが残らないように）
  if(window.PENDING_JOIN){try{history.replaceState(null,"",location.pathname+location.hash)}catch(e){}}
  window.APP_URL_OVERRIDE=location.origin+location.pathname;
  const C=window.FIREBASE_CONFIG||{};
  if(!window.firebase||!C.apiKey||!C.projectId){return} // 設定がなければこの端末だけで動く
  window.FB_MODE=true;
  firebase.initializeApp(C);
  const auth=firebase.auth(),fs=firebase.firestore();
  const ready=new Promise((res,rej)=>{auth.onAuthStateChanged(u=>{if(u)res(u)});auth.signInAnonymously().catch(rej)});
  let NAMES={};
  const myName=()=>{try{const s=JSON.parse(localStorage.getItem("lifeplan-v2")||"{}");return (s.v&&s.v.myName)||"メンバー"}catch(e){return "メンバー"}};
  function map(p){let m;
    if((m=p.match(/^hh_([A-Z0-9]+)\/state$/)))return{ref:fs.collection("households").doc(m[1]),kind:"state"};
    if((m=p.match(/^hh_([A-Z0-9]+)\/members$/)))return{ref:fs.collection("households").doc(m[1]),kind:"members"};
    if((m=p.match(/^data\/users\/([^/]+)\/household$/)))return{ref:fs.collection("users").doc(m[1]),kind:"plain"};
    return null}
  const wrapQ=q=>({docs:q?q.docs.map(d=>({id:d.id,data:()=>d.data()})):[]});
  const col=ref=>({
    orderBy:(f,dir)=>({limit:n=>({get:async()=>wrapQ(ref?await ref.orderBy(f,dir).limit(n).get():null)})}),
    limit:n=>({get:async()=>wrapQ(ref?await ref.limit(n).get():null)}),
    get:async()=>wrapQ(ref?await ref.get():null),
    add:async d=>{if(ref)await ref.add(d)},
    doc:id=>({delete:async()=>{if(ref)await ref.doc(id).delete()}})});
  const doc=p=>{const M=map(p);return{
    get:async()=>{if(!M)return{exists:false,data:()=>({})};const s=await M.ref.get();const d=s.exists?s.data():{};if(d.names)NAMES=d.names;
      if(M.kind==="members")return{exists:Array.isArray(d.members),data:()=>({ids:d.members||[]})};
      if(M.kind==="state")return{exists:!!d.state,data:()=>d};
      return{exists:s.exists,data:()=>d}},
    set:async d=>{if(!M)return;const u=auth.currentUser;
      if(M.kind==="members")return M.ref.set({members:d.ids,names:{[u.uid]:myName()}},{merge:true});
      if(M.kind==="state")return M.ref.set(d,{merge:true});
      return M.ref.set(d)},
    delete:async()=>{if(M)await M.ref.delete()},
    onSnapshot:(f,err)=>{if(!M)return()=>{};return M.ref.onSnapshot(s=>{const d=s.exists?s.data():{};if(d.names)NAMES=d.names;f({exists:!!d.state,data:()=>d,metadata:{hasPendingWrites:s.metadata.hasPendingWrites}})},err||(()=>{}))},
    collection:c=>col(M?M.ref.collection(c):null)}};
  const db={doc,collection:()=>col(null)};
  const user={id:async()=>(await ready).uid,can:async()=>true,isOwner:async()=>false,
    profiles:async ids=>Object.fromEntries(ids.map(i=>[i,{id:i,name:NAMES[i]||"家族"}]))};
  window.claude={use:async name=>{try{await ready}catch(e){return null}return name==="db"?db:name==="user"?user:null}};
})();
