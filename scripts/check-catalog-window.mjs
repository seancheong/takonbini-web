import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
process.env.PRODUCTS_API_URL='https://catalog.example.test';
process.env.PRODUCTS_API_KEY='synthetic';
let reads=0;
globalThis.fetch=async input=>{
 const url=new URL(input instanceof Request?input.url:input);
 assert.equal(url.origin,'https://catalog.example.test');
 assert.equal(url.searchParams.get('limit'),'20');
 reads++;
 return Response.json({products:Array.from({length:20},(_,i)=>({id:`fixture-${i}`,title:{en:`Product ${i}`,ja:`テスト ${i}`,zh:`測試 ${i}`},description:{ja:'テスト'},images:[],store:'Lawson',price:100,url:'https://example.test'})),nextCursor:'next-page'});
};
const app=(await import(pathToFileURL(resolve('.vercel/output/functions/__server.func/index.mjs')))).default;
for(const lang of ['en','ja','zh']) {
 const before=reads;
 const response=await app.fetch(new Request(`https://web.example.test/?lang=${lang}&limit=100000`));
 assert.equal(response.status,200);
 const html=await response.text();
 assert.equal((html.match(/data-product-id=/g)||[]).length,20);
 assert.equal(reads-before,1);
 assert.ok(!html.includes('takonbini:catalog:v1'));
}
console.log('Catalog SSR: three locales, 20 server-rendered cards, fixed page size and one upstream read per request pass.');
