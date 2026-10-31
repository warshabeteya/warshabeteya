const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {JSDOM}=require('jsdom');const root=path.resolve(__dirname,'..');
const hashes=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/outer-style-hashes.json')));
test('outer stylesheets remain byte-for-byte unchanged',()=>{for(const [name,hash] of Object.entries(hashes))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex'),hash,name);});
for(const locale of ['ar','en'])test(locale+': page initializes, thumbnails defer originals, language and font links resolve',()=>{
 const dir=locale==='en'?'en/':'';const dom=new JSDOM(fs.readFileSync(path.join(root,dir,'index.html'),'utf8'),{url:'http://localhost/'+dir,runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,d=w.document;w.HTMLElement.prototype.scrollIntoView=function(){};w.scrollTo=()=>{};w.matchMedia=()=>({matches:false,addEventListener(){}});w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'))};
 for(const s of d.querySelectorAll('script[src]')){const p=path.join(root,new URL(s.src).pathname);assert.ok(fs.existsSync(p),p);w.eval(fs.readFileSync(p,'utf8'));}
 assert.equal(d.documentElement.dir,locale==='en'?'ltr':'rtl');assert.ok(d.querySelector('link[href*="fonts.googleapis.com/css2?family=Cairo"]'));
 assert.equal(d.querySelectorAll('.demo-photos img').length,8);assert.equal(d.querySelector('#photoLarge').hasAttribute('src'),false);
 for(const img of d.querySelectorAll('.demo-photos img')){assert.match(img.src,/\/demos\/thumbs\/.*\.webp$/);assert.equal(img.loading||img.getAttribute('loading'),'lazy');assert.ok(fs.existsSync(path.join(root,new URL(img.src).pathname)));}
 d.querySelector('.photo-button').click();assert.equal(d.querySelector('#photoDialog').open,true);assert.match(d.querySelector('#photoLarge').src,/\/demos\/heatsink-before\.jpeg$/);assert.equal(d.querySelector('#downloadPhoto').href,d.querySelector('#photoLarge').src);
 assert.ok(fs.existsSync(path.join(root,new URL(d.querySelector('.language-switch').href).pathname,'index.html')));
 // The standalone inspection path must show the full charge at intake.
 d.querySelector('[data-category="playstation"]').click();
 const select=d.querySelector('#device');select.value='ps4';select.dispatchEvent(new w.Event('change',{bubbles:true}));
 d.querySelector('#nextService').click();d.querySelector('#chooseInspection').click();
 assert.equal(d.querySelector('#checkout').hidden,false);assert.match(d.querySelector('#paymentEstimate').textContent,/150/);
 assert.equal(d.querySelector('#moddingOptIn').required,false);
 dom.window.close();
});
