import test from 'node:test';
import assert from 'node:assert/strict';
import {initialCommunity,readCommunity,rankFeed,postMetrics,COMMUNITY_KEY} from '../web/src/features/social/model.js';
import {parseRoute,routeHash} from '../web/src/app/routes.js';

test('ranking gives following the strongest signal without fixed blocks or duplicates',()=>{
  const now=Date.parse('2026-11-17T12:00:00Z'),state={...initialCommunity(),active:true,followed:['followed']};
  const post=(id,publisherId,days,extra={})=>({id,publisherId,publishedAt:new Date(now-days*86400000).toISOString(),baseLikes:0,baseComments:0,...extra});
  const items=[post('old','followed',120),post('fresh','other',0,{baseLikes:100,recommended:true}),post('followed-fresh','followed',0),post('fresh','other',0,{baseLikes:100,recommended:true})];
  const ranked=rankFeed(items,state,now);
  assert.equal(ranked[0].id,'followed-fresh');
  assert.ok(ranked.findIndex(p=>p.id==='fresh')<ranked.findIndex(p=>p.id==='old'));
  assert.equal(ranked.length,3);
  assert.deepEqual(rankFeed([...items].reverse(),state,now).map(p=>p.id),ranked.map(p=>p.id));
});
test('visitor has no following boost, hidden posts are excluded and ties are deterministic',()=>{
  const state=initialCommunity(),now=Date.now(),items=['b','a'].map(id=>({id,publisherId:'secelt',publishedAt:new Date(now).toISOString()}));
  assert.deepEqual(rankFeed(items,state,now).map(p=>p.id),['a','b']);
  state.hiddenPosts=['a'];assert.deepEqual(rankFeed(items,state,now).map(p=>p.id),['b']);
});
test('metrics count reversible local actions and omit removed comments',()=>{
  const state={...initialCommunity(),likes:['p'],comments:{p:[{id:'one'},{id:'two',removed:true}]}};
  assert.deepEqual(postMetrics({id:'p',baseLikes:5,baseComments:0},state),{likes:6,comments:1});
});
test('browser state survives serialization, handles invalid storage and does not activate untrusted values',()=>{
  const value={...initialCommunity(),active:true,theme:'black',saved:['one'],comments:{one:[{id:'c',text:'Uma cidade conectada.'}]}};
  assert.deepEqual(readCommunity({getItem:key=>key===COMMUNITY_KEY?JSON.stringify(value):null}),value);
  assert.equal(readCommunity({getItem:()=>'{bad'}).active,false);
  assert.equal(readCommunity({getItem:()=>JSON.stringify({version:1,active:'yes',theme:'invalid',likes:[1,'p','p']})}).theme,'black');
  assert.deepEqual(readCommunity({getItem:()=>JSON.stringify({version:1,likes:[1,'p','p']})}).likes,['p']);
});
test('public links and the existing admin entry round-trip safely',()=>{
  for(const page of ['feed','explore','events','download','profile','sports','tourism','publisher','post','event','admin']){
    const route={page,...(['publisher','post','event'].includes(page)?{id:'id com acento ã'}:{})};
    assert.deepEqual(parseRoute(routeHash(route)),route);
  }
  assert.deepEqual(parseRoute('#/baixar-app'),{page:'download'});
  assert.deepEqual(parseRoute('#/publicacao/%broken'),{page:'post'});
  assert.deepEqual(parseRoute('#unknown'),{page:'feed'});
});
