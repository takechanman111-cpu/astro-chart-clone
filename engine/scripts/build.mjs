import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {mkdirSync,existsSync} from 'node:fs';
const root=fileURLToPath(new URL('../',import.meta.url));
mkdirSync(root+'bin',{recursive:true});
const files=['swecl','swedate','swehel','swehouse','swejpl','swemmoon','swemplan','sweph','swephlib'].map(n=>root+'vendor/swiss/'+n+'.c');
const sdk=process.env.VEDIC_SDK||(process.platform==='darwin'&&existsSync('/Library/Developer/CommandLineTools/SDKs/MacOSX15.4.sdk')?'/Library/Developer/CommandLineTools/SDKs/MacOSX15.4.sdk':null);
execFileSync(process.env.CC||'cc',['-O2',...(process.platform==='linux'?['-static']:[]),...(sdk?['-isysroot',sdk]:[]),'-I'+root+'vendor/swiss',root+'scripts/bridge.c',...files,'-lm','-o',root+'bin/vedic-swiss'],{stdio:'inherit'});
console.log('Swiss Ephemeris bridge built:',root+'bin/vedic-swiss');
