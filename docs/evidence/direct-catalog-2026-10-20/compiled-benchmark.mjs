import { performance } from 'node:perf_hooks';
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const [root, output, fixturePath] = process.argv.slice(2);
process.env.VERCEL_URL = 'web.example.test';
process.env.PRODUCTS_API_URL = 'https://api.example.test';
process.env.PRODUCTS_API_KEY = 'fixture-only-secret';
const product = JSON.parse(await readFile(fixturePath, 'utf8'));
const app = (await import(pathToFileURL(root+'/.vercel/output/functions/__server.func/index.mjs'))).default;
let calls=[];
globalThis.fetch = async (input, init) => {
 const url = new URL(typeof input === 'string' ? input : input.url);
 calls.push(url.hostname);
 if(url.hostname==='web.example.test') {
  await new Promise(resolve=>setTimeout(resolve,50));
  return app.fetch(new Request(url,init));
 }
 if(url.hostname==='api.example.test') {
  if(new Headers(init?.headers).get('x-api-key')!=='fixture-only-secret') throw Error('Missing auth');
  await new Promise(resolve=>setTimeout(resolve,25));
  return Response.json(url.pathname==='/products' ? {products:[product]} : product);
 }
 throw Error('Unexpected network request '+url.hostname);
};
const samples=[];
for(let run=0;run<12;run++) {
 for(const path of ['/?lang=en','/products/'+product.id+'?lang=en']) {
  calls=[];
  const start=performance.now();
  const response=await app.fetch(new Request('https://web.example.test'+path));
  const html=await response.text();
  if(response.status!==200 || !html.includes(product.id) || html.includes('fixture-only-secret')) throw Error('Bad SSR response');
  if(run>1) samples.push({run:run-1,path,ms:performance.now()-start,calls:[...calls]});
 }
}
await writeFile(output,JSON.stringify({upstreamDelayMs:25,selfProxyDelayMs:50,warmups:2,samples},null,2));
console.log(JSON.stringify({output,samples:samples.length,requests:samples[0].calls}));
