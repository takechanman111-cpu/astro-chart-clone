import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {calculateCompatibility} from './lib/compatibility.mjs';
const root=fileURLToPath(new URL('./public/',import.meta.url));
const port=Number(process.env.PORT||4198),host='127.0.0.1';
const files={'/relationship-copy.mjs':['relationship-copy.mjs','text/javascript; charset=utf-8'],'/image-gallery':['image-gallery.html','text/html; charset=utf-8'],'/':['index.html','text/html; charset=utf-8'],'/app.mjs':['app.mjs','text/javascript; charset=utf-8'],'/data.mjs':['data.mjs','text/javascript; charset=utf-8'],'/cities.mjs':['cities.mjs','text/javascript; charset=utf-8'],'/style.css':['style.css','text/css; charset=utf-8']};
let busy=false;
const server=http.createServer(async(req,res)=>{
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
 res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
 const url=new URL(req.url,'http://'+host+':'+port);
 if(req.method==='GET'&&url.pathname==='/healthz'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({ok:true,service:'vedic-pair-v2',localOnly:true}));}
 if(req.method==='GET'&&/^\/images\/(zodiac|vedic|reused|hero)\/[a-z][a-z-]*\.(png|jpg)$/.test(url.pathname)){
  try{const data=await readFile(root+url.pathname.slice(1));res.setHeader('Content-Type',url.pathname.endsWith('.jpg')?'image/jpeg':'image/png');return res.end(data);}catch{res.writeHead(404);return res.end('Image unavailable');}
 }
 if(req.method==='POST'&&url.pathname==='/api/compatibility'){
  const origin=req.headers.origin;if(origin&&origin!==`http://${host}:${port}`&&origin!==`http://localhost:${port}`){res.writeHead(403);return res.end('Origin not allowed');}
  if(!req.headers['content-type']?.startsWith('application/json')){res.writeHead(415);return res.end();}
  if(busy){res.writeHead(429);return res.end(JSON.stringify({error:'前の計算が終わるまで少しお待ちください。'}));}
  res.setHeader('Content-Type','application/json; charset=utf-8');
  try{let body='';for await(const c of req){body+=c;if(body.length>16000)throw new Error('入力が長すぎます。');}busy=true;res.end(JSON.stringify(await calculateCompatibility(JSON.parse(body))));}
  catch(error){res.statusCode=400;res.end(JSON.stringify({error:error.message.includes('Command failed')?'計算エンジンを利用できません。起動用ファイルから開き直してください。':error.message}));}
  finally{busy=false;}return;
 }
 if(req.method==='GET'&&files[url.pathname]){try{const [name,type]=files[url.pathname];res.setHeader('Content-Type',type);return res.end(await readFile(root+name));}catch{res.writeHead(500);return res.end('File unavailable');}}
 res.writeHead(404);res.end('Not found');
});
server.listen(port,host,()=>console.log(`インド占星術・相性アプリ: http://${host}:${port}/`));
