/* MDA Control: abre sin señal (guarda la app en el celular) y recibe avisos */
var CACHE='mda-app-v1';
var SB_JS='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
self.addEventListener('install',function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){
    return Promise.all([
      c.add('./').catch(function(){}),
      c.add('icono-180.png').catch(function(){}),
      fetch(SB_JS,{mode:'no-cors'}).then(function(r){return c.put(SB_JS,r);}).catch(function(){})
    ]);
  }));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){return k.indexOf('mda-app-')===0&&k!==CACHE;}).map(function(k){return caches.delete(k);}));
  }).then(function(){return self.clients.claim();}));
});
function withTimeout(p,ms){return new Promise(function(ok,no){var t=setTimeout(function(){no(new Error('timeout'));},ms);p.then(function(r){clearTimeout(t);ok(r);},function(x){clearTimeout(t);no(x);});});}
self.addEventListener('fetch',function(e){
  var req=e.request;if(req.method!=='GET')return;
  var url=new URL(req.url);
  /* la base de datos siempre va directo a internet */
  if(url.hostname.indexOf('supabase.co')>=0)return;
  /* la app: primero internet (para recibir versiones nuevas); si no hay señal o tarda, la copia guardada */
  if(req.mode==='navigate'||(url.origin===self.location.origin&&/\/(index\.html)?$/.test(url.pathname))){
    e.respondWith(withTimeout(fetch(req),4000).then(function(r){
      if(r&&r.ok){var cp=r.clone();caches.open(CACHE).then(function(c){c.put('./',cp);});}
      return r;
    }).catch(function(){return caches.match('./').then(function(m){return m||caches.match(req);}).then(function(m){return m||Response.error();});}));
    return;
  }
  /* librería, letras e ícono: la copia guardada primero */
  if(url.href===SB_JS||url.hostname==='fonts.googleapis.com'||url.hostname==='fonts.gstatic.com'||(url.origin===self.location.origin&&/\.png$/.test(url.pathname))){
    e.respondWith(caches.match(req).then(function(m){
      return m||fetch(req).then(function(r){if(r&&(r.ok||r.type==='opaque')){var cp=r.clone();caches.open(CACHE).then(function(c){c.put(req,cp);});}return r;});
    }));
  }
});
self.addEventListener('push',function(e){
  var d={};try{d=e.data?e.data.json():{};}catch(x){}
  var title=d.title||'MDA Control',body=d.body||'';
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(list){
    for(var i=0;i<list.length;i++){if(list[i].visibilityState==='visible')return;}
    return self.registration.showNotification(title,{body:body,icon:'icono-180.png',badge:'icono-180.png',tag:d.tag||undefined,data:{url:'./'}});
  }));
});
self.addEventListener('notificationclick',function(e){
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(list){
    if(list.length&&list[0].focus)return list[0].focus();
    return self.clients.openWindow('./');
  }));
});
