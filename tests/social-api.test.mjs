import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {join,resolve,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {once} from 'node:events';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';

const SOCIAL_SCHEMA=readFileSync(new URL('../database/social.sql',import.meta.url),'utf8');

let child,base,directory,admin,partner,editor;
const root=resolve(import.meta.dirname,'..');
async function start(){
  child=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,PORT:'0',SECELT_DATA_DIR:directory},stdio:['ignore','pipe','pipe'],windowsHide:true});
  base=await new Promise((resolve,reject)=>{
    let output='';const timer=setTimeout(()=>reject(Error('API did not start: '+output)),12000);
    child.stdout.on('data',chunk=>{output+=chunk;const match=output.match(/http:\/\/localhost:(\d+)/);if(match){clearTimeout(timer);resolve('http://127.0.0.1:'+match[1])}});
    child.stderr.on('data',chunk=>{output+=chunk});child.once('exit',code=>{clearTimeout(timer);reject(Error('API exited '+code+': '+output))});
  });
}
async function stop(){if(child&&child.exitCode===null){child.kill();await once(child,'exit')}}
async function request(path,{token,body,...options}={}){
  const response=await fetch(base+'/api'+path,{...options,headers:{...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const data=await response.json().catch(()=>null);return {status:response.status,data};
}
async function login(email,password){const result=await request('/auth/login',{method:'POST',body:{email,password}});assert.equal(result.status,200,JSON.stringify(result.data));return result.data.token}
const draft=(extra={})=>({publisherId:'cultura-guama',type:'post',format:'carousel',title:'Uma história para a cidade',caption:'Uma nova publicação da página parceira.',category:'Cultura',mediaIds:['media-igreja-matriz','media-externato'],...extra});
async function create(extra={},token=partner){const result=await request('/admin/social/content',{token,method:'POST',body:draft(extra)});assert.equal(result.status,201,JSON.stringify(result.data));return result.data.item}
async function status(item,value,token=partner){return request(`/admin/social/content/${item.id}/status`,{token,method:'PATCH',body:{status:value}})}

before(async()=>{directory=await mkdtemp(join(tmpdir(),'secelt-social-test-'));await start();admin=await login('admin@secelt.local','Guama#2026');partner=await login('parceiro@secelt.local','Parceiro#2026');editor=await login('editor@secelt.local','Editor#2026')});
after(async()=>{await stop();const target=resolve(directory||'');if(directory&&target.startsWith(resolve(tmpdir())+sep+'secelt-social-test-'))await rm(target,{recursive:true,force:true})});

test('new schema also works after the documented reference schema',()=>{
  const db=new DatabaseSync(':memory:');
  // Minimal legacy prerequisites keep this check focused on migration ordering and foreign keys.
  db.exec('CREATE TABLE admin_users(id INTEGER PRIMARY KEY);CREATE TABLE events(id TEXT PRIMARY KEY);CREATE TABLE media_assets(id TEXT PRIMARY KEY);');
  db.exec(SOCIAL_SCHEMA);db.exec(SOCIAL_SCHEMA);assert.equal(db.prepare("SELECT count(*) n FROM sqlite_master WHERE name='social_content'").get().n,1);db.close();
});
test('public feed has credited photos, authorized pages and permanent stories',async()=>{
  const result=await request('/social/feed');assert.equal(result.status,200);
  assert.ok(result.data.items.length>=8);assert.equal(result.data.pages.length,4);assert.equal(result.data.stories.length,4);
  assert.ok(result.data.items.some(p=>p.id.startsWith('news-')));
  for(const post of result.data.items)for(const media of post.media){assert.ok(media.author);assert.ok(media.licenseName);assert.ok(media.fileUrl.startsWith('/api/media/'))}
  const db=new DatabaseSync(join(directory,'secelt.sqlite'));db.prepare("UPDATE social_content SET published_at='2000-01-01T00:00:00Z' WHERE id='story-rio'").run();db.close();
  assert.ok((await request('/social/stories')).data.items.some(s=>s.id==='story-rio'));
});
test('administrative endpoints reject visitors and isolate partner permissions',async()=>{
  assert.equal((await request('/admin/social')).status,401);
  const managed=await request('/admin/social',{token:partner});assert.equal(managed.status,200);assert.deepEqual(managed.data.pages.map(p=>p.id),['cultura-guama']);
  assert.ok(managed.data.items.every(p=>p.publisherId==='cultura-guama'));
  for(const endpoint of ['/admin/events','/admin/overview','/admin/users','/admin/media'])assert.equal((await request(endpoint,{token:partner})).status,403);
  assert.equal((await request('/admin/social/content',{token:partner,method:'POST',body:draft({publisherId:'secelt'})})).status,403);
  assert.equal((await request('/admin/social/pages/secelt',{token:partner,method:'PUT',body:{name:'Changed',bio:''}})).status,403);
  assert.equal((await request('/admin/events',{token:editor})).status,200);
});
test('draft, approval and ordered carousel persist without allowing self-approval',async()=>{
  const item=await create({recommended:true});assert.equal(item.recommended,false);
  assert.equal((await request('/social/posts/'+item.rootId)).status,404);
  assert.equal((await status(item,'Publicado')).status,403);
  assert.equal((await status(item,'Publicado',admin)).status,409);
  assert.equal((await status(item,'Aguardando Aprovação')).status,200);
  assert.equal((await request('/admin/social/content/'+item.id,{token:partner,method:'PUT',body:draft()})).status,409);
  assert.equal((await status(item,'Publicado',admin)).status,200);
  const published=await request('/social/posts/'+item.rootId);assert.equal(published.status,200);assert.deepEqual(published.data.item.media.map(m=>m.id),['media-igreja-matriz','media-externato']);
});
test('revisions keep the previous version public and retain its share link after approval',async()=>{
  const original=(await request('/admin/social',{token:partner})).data.items.find(i=>i.id==='post-memoria');
  const revision=await request(`/admin/social/content/${original.id}/revision`,{token:partner,method:'POST'});assert.equal(revision.status,201);
  assert.equal((await request(`/admin/social/content/${original.id}/revision`,{token:partner,method:'POST'})).status,409);
  const next=revision.data.item;
  const updated=await request('/admin/social/content/'+next.id,{token:partner,method:'PUT',body:draft({title:'Memória revisada',mediaIds:['media-externato','media-igreja-matriz']})});assert.equal(updated.status,200);
  assert.equal((await request('/social/posts/'+original.rootId)).data.item.title,original.title);
  await status(next,'Aguardando Aprovação');await status(next,'Publicado',admin);
  const publicPost=(await request('/social/posts/'+original.rootId)).data.item;assert.equal(publicPost.title,'Memória revisada');assert.equal(publicPost.id,original.rootId);
  assert.equal((await request('/social/feed')).data.items.filter(p=>p.id===original.rootId).length,1);
});
test('returning and withdrawing content enforce transitions and page ownership',async()=>{
  const item=await create({title:'Para revisão'});await status(item,'Aguardando Aprovação');
  assert.equal((await status(item,'Reprovado')).status,403);
  assert.equal((await request(`/admin/social/content/${item.id}/status`,{token:admin,method:'PATCH',body:{status:'Reprovado',note:'Acrescente o local.'}})).status,200);
  assert.equal((await request('/admin/social/content/'+item.id,{token:partner,method:'PUT',body:draft({caption:'Local atualizado.'})})).status,200);
  await status(item,'Aguardando Aprovação');await status(item,'Publicado',admin);assert.equal((await status(item,'Arquivado')).status,200);assert.equal((await request('/social/posts/'+item.rootId)).status,404);
  assert.equal((await status({id:'post-rio'},'Arquivado')).status,403);
});
test('real video uploads are rejected and cover-only posts need a single image',async()=>{
  assert.equal((await request('/admin/social/media',{token:partner,method:'POST',body:{publisherId:'cultura-guama',mimeType:'video/mp4',imageData:'data:video/mp4;base64,AAAA'}})).status,400);
  assert.equal((await request('/admin/social/content',{token:partner,method:'POST',body:draft({format:'video',mediaIds:[]})})).status,400);
  const item=await create({format:'video',mediaIds:['media-externato']});assert.equal(item.format,'video');assert.equal(item.media.length,1);
});
test('private uploaded images become public only when their content is approved',async()=>{
  const imageData='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jv1sAAAAASUVORK5CYII=';
  const upload=await request('/admin/social/media',{token:partner,method:'POST',body:{publisherId:'cultura-guama',mimeType:'image/png',imageData,altText:'Fotografia de teste',author:'Autor do teste',licenseName:'Autorização do autor',rightsConfirmed:true}});assert.equal(upload.status,201,JSON.stringify(upload.data));
  const media=upload.data.item;
  assert.equal((await fetch(base+media.fileUrl)).status,404);
  assert.equal((await fetch(base+media.fileUrl,{headers:{Authorization:'Bearer '+partner}})).status,200);
  const item=await create({format:'photo',mediaIds:[media.id]});await status(item,'Aguardando Aprovação');await status(item,'Publicado',admin);
  assert.equal((await fetch(base+media.fileUrl)).status,200);
});
test('municipal news keeps original sources and links published photos to the correct places',async()=>{
  const news=(await request('/news')).data.items.filter(item=>item.sourceUrl);
  assert.equal(new Set(news.map(item=>item.sourceUrl)).size,5);
  assert.equal(news.filter(item=>item.category==='Esporte').length,2);
  const tourism=(await request('/tourism')).data;
  const feed=(await request('/social/feed')).data.items;
  const photos=new Set();
  for (const item of news) {
    const post=feed.find(row=>row.id==='news-'+item.id);
    assert.equal(post.sourceUrl,item.sourceUrl);
    assert.equal(post.publishedAt,item.updatedAt);
    assert.ok(post.media.length);
    for (const media of post.media) {
      assert.equal(media.sourceUrl,item.sourceUrl);
      const file=await fetch(base+media.fileUrl);
      assert.equal(file.status,200);
      assert.match(file.headers.get('content-type'),/^image\//);
      assert.ok((await file.arrayBuffer()).byteLength>1000);
      photos.add(media.id);
      if (['Lazer','Turismo'].includes(item.category)) {
        assert.ok(tourism.items.some(place=>place.photos.some(photo=>photo.id===media.id)));
      }
    }
  }
  assert.equal(photos.size,8);
});

test('legacy events, sport, tourism, news and QR registration remain compatible',async()=>{
  for(const endpoint of ['/events','/sports','/tourism','/news'])assert.equal((await request(endpoint)).status,200);
  const event=(await request('/events')).data.items.find(e=>e.status==='Publicado'&&e.isFree);
  const registration=await request('/events?id='+event.id,{method:'POST',body:{name:'Pessoa de teste',email:'qa@secelt.local'}});assert.equal(registration.status,201);assert.ok(registration.data.qrCode);
  assert.equal((await request('/events?id='+event.id,{method:'POST',body:{name:'Pessoa de teste',email:'qa@secelt.local'}})).status,409);
});
test('restarting preserves editorial data and does not duplicate the seed',async()=>{
  const before=(await request('/social/feed')).data;
  await stop();await start();
  const after=(await request('/social/feed')).data;assert.equal(after.items.length,before.items.length);assert.equal(after.pages.length,before.pages.length);assert.equal(after.stories.length,before.stories.length);
  assert.ok(after.items.some(p=>p.id==='post-memoria'&&p.title==='Memória revisada'));
  assert.equal((await request('/admin/social',{token:partner})).status,200);
});
