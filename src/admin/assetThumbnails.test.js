import test from 'node:test';
import assert from 'node:assert/strict';
import {Box3,Vector3} from 'three';
import {thumbnailFrame,createThumbnailQueue} from './assetThumbnails.js';
test('thumbnail framing fits tall, wide and tiny actual model bounds',()=>{
  for(const size of [[1,8,1],[12,1,2],[.01,.01,.01]]){const box=new Box3(new Vector3(2,3,4),new Vector3(2+size[0],3+size[1],4+size[2]));const frame=thumbnailFrame(box);assert.ok(frame.near>0);assert.ok(frame.far>frame.distance);assert.ok(frame.distance>box.getSize(new Vector3()).length()/2);assert.deepEqual(frame.center,box.getCenter(new Vector3()));}
});
test('thumbnail queue serializes renders, reuses results and recovers after failures',async()=>{
  let active=0,maximum=0,count=0;const get=createThumbnailQueue(async asset=>{active++;maximum=Math.max(maximum,active);count++;await Promise.resolve();active--;if(asset.url==='bad')throw Error('missing');return asset.url;});
  const first=get({url:'one'});assert.equal(get({url:'one'}),first);assert.deepEqual(await Promise.all([first,get({url:'two'})]),['one','two']);assert.equal(maximum,1);assert.equal(count,2);
  await assert.rejects(get({url:'bad'}));assert.equal(await get({url:'three'}),'three');await assert.rejects(get({url:'bad'}));assert.equal(count,5);
});
