import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calculatePair,validateBirth} from './pair.mjs';
import {compareCharts} from '../synastry.mjs';

const a = {year:1984,month:2,day:29,hour:8,minute:15};
const b = {year:1992,month:11,day:13,hour:18,minute:40};
test('leap dates and independent Swiss charts', () => {
  assert.throws(() => validateBirth({...a,year:1985}));
  assert.throws(() => validateBirth({...a,hour:null}));
  const result = calculatePair(a,b);
  assert.equal(result.first.length,5);
  assert.equal(result.second.length,5);
  assert.notEqual(result.first[0].longitude,result.second[0].longitude);
  assert.ok(result.matches.length > 0);
  for (const row of result.matches) {
    assert.ok(row.title && row.reading);
    assert.ok(row.offset <= row.aspect.orb);
    assert.ok(result.first.includes(row.a) && result.second.includes(row.b));
  }
  assert.equal(calculatePair(b,a).matches.length,result.matches.length);
});
test('0° wrap, inclusive orb, and outside orb', () => {
  const one = [{body:'Sun',longitude:359}];
  const match = longitude => compareCharts(one,[{body:'Moon',longitude}]);
  assert.equal(match(1)[0].angle,2);
  assert.equal(match(65)[0].offset,6);
  assert.equal(match(67).length,0);
});
