self.addEventListener('install',function(){self.skipWaiting();});
self.addEventListener('activate',function(e){e.waitUntil(self.clients.claim());});
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
