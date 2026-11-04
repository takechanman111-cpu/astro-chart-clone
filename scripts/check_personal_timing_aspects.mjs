import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {majorTransitAspects} from './established_timing_calculator.mjs';
const context=vm.createContext({});
vm.runInContext(fs.readFileSync(new URL('../personal-timing-readings.js',import.meta.url),'utf8'),context);
const bodies=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
for(const offset of [0,1.49,1.51,2,2.01,29.3,179.9,359.9]){
 const rows=bodies.map((body,i)=>({body,body_ja:body,longitude:(i*37+offset)%360}));
 const natal=bodies.map((body,i)=>({body,body_ja:body,longitude:(i*29+1)%360}));
 const actual=context.calculatedTimingAspects(rows,natal).map(a=>`${a.transit_body}|${a.natal_body}|${a.symbol}|${Number(a.orb)}`).sort();
 const expected=majorTransitAspects(rows,natal,1000).map(a=>`${a.transit_body}|${a.natal_body}|${a.symbol}|${Number(a.orb)}`).sort();
 assert.equal(JSON.stringify(actual),JSON.stringify(expected));
}
console.log('PASS: current aspect selection matches established engine, including orb boundaries and zodiac wrap');
