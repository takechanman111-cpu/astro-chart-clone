import { BODIES, dateFromLocal, getTimingEngine, planetRows } from './established_timing_calculator.mjs';
import { compareCharts } from '../synastry.mjs';
export function validateBirth(input) {
  const { year, month, day, hour, minute } = input ?? {};
  const fields = [[year,1952,2099],[month,1,12],[day,1,31],[hour,0,23],[minute,0,59]];
  if (fields.some(([value,min,max]) => !Number.isInteger(value) || value < min || value > max) ||
      new Date(Date.UTC(year,month-1,day)).getUTCMonth() !== month-1) {
    throw new RangeError('実在する生年月日と出生時刻を入力してください。');
  }
  return {year,month,day,hour,minute,timezoneOffset:9};
}

export function calculatePair(a,b) {
  const dates = [validateBirth(a), validateBirth(b)].map(dateFromLocal);
  const engine = getTimingEngine({engineMode:'swetest'});
  const [first,second] = dates.map(date => planetRows(date,BODIES.slice(0,5),engine));
  return {first,second,matches:compareCharts(first,second)};
}

