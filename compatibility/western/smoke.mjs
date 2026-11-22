import assert from 'node:assert/strict';
import { handler } from './netlify/functions/synastry.mjs';

const token = 'synthetic-test-placeholder-local-only';
process.env.SYNASTRY_PROXY_TOKEN = token;
const a = {year:1984,month:2,day:29,hour:8,minute:15};
const b = {year:1992,month:11,day:13,hour:18,minute:40};
const event = {
  httpMethod:'POST',
  headers:{'content-type':'application/json','x-synastry-proxy-token':token},
  body:JSON.stringify({a,b})
};
assert.equal((await handler({...event,headers:{}})).statusCode,403);
assert.equal((await handler({...event,httpMethod:'GET'})).statusCode,405);
assert.equal((await handler({...event,body:'{'})).statusCode,400);
const result = await handler(event);
assert.equal(result.statusCode,200);
const {matches} = JSON.parse(result.body);
assert.equal(matches.length,8);
assert.equal(matches[0].angle.toFixed(2),'0.26');
console.log('403/405/400/200; 8 matches; 0.26°');
