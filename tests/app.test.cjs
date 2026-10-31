const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const {webcrypto}=require('node:crypto');
const code=fs.readFileSync('assets/app.js','utf8');
function app(seed=[]){
 const nodes=new Map();
 const get=s=>{if(!nodes.has(s))nodes.set(s,{value:'',textContent:'',innerHTML:'',hidden:false,style:{},dataset:{},classList:{toggle(){}},setAttribute(){},addEventListener(type,fn){this[type]=fn},focus(){},click(){},reset(){},showModal(){this.open=true},close(){this.open=false},setCustomValidity(){},reportValidity(){},files:[]});return nodes.get(s)};
 get('#sort').value='priority';
 const storage=new Map([['taskflow_v1',JSON.stringify(seed)]]);
 vm.runInNewContext(code,{document:{documentElement:{dataset:{theme:'dark'}},querySelector:get,querySelectorAll:()=>[],addEventListener(){},createElement:()=>get('link')},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},crypto:webcrypto,Date,JSON,String,Number,Array,Math,Set,Blob,URL,setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},window:{addEventListener(){}}});
 return {get,tasks:()=>JSON.parse(storage.get('taskflow_v1'))};
}
function localDay(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
test('create, edit, complete, delete and undo persist correctly',()=>{
 const a=app(),g=a.get;
 g('#add').onclick();g('#task-title').value='  Plan my day  ';g('#notes').value='First step';g('#priority').value='high';
 g('#form').onsubmit({preventDefault(){}});
 assert.equal(a.tasks()[0].title,'Plan my day');assert.equal(a.tasks()[0].dueDate,localDay());
 const id=a.tasks()[0].id;
 const row={dataset:{id}};
 g('#tasks').change({target:{matches:()=>true,closest:()=>row,checked:true}});
 assert.equal(a.tasks()[0].completed,true);assert.equal(g('#percent').textContent,'100%');
 const action=type=>({target:{closest:()=>({dataset:{action:type},closest:()=>row})}});
 g('#tasks').onclick(action('edit'));g('#task-title').value='Revised plan';g('#form').onsubmit({preventDefault(){}});
 assert.equal(a.tasks()[0].title,'Revised plan');
 g('#tasks').onclick(action('delete'));assert.equal(a.tasks().length,0);
 g('#undo').onclick();assert.equal(a.tasks()[0].id,id);
});
test('legacy tasks load and task content is escaped',()=>{
 const a=app([{id:'old',title:'<script>alert(1)</script>',priority:'high',dueDate:localDay(),completed:false,createdAt:new Date().toISOString()}]);
 assert.match(a.get('#tasks').innerHTML,/&lt;script&gt;/);assert.doesNotMatch(a.get('#tasks').innerHTML,/<script>/);
 a.get('#search').value='not here';a.get('#search').oninput();assert.match(a.get('#tasks').innerHTML,/Nothing matches/);
});
test('local assets exist with exact case and no root-relative links',()=>{
 const html=fs.readFileSync('index.html','utf8');
 for(const [,file] of html.matchAll(/(?:src|href)="(\.\/assets\/[^"]+)"/g))assert.ok(fs.existsSync(file),file);
 assert.doesNotMatch(html,/(?:src|href)="\/(?!\/)/);
});
test('focus session can start, pause and reset',()=>{
 const a=app();a.get('#focus-start').onclick();assert.equal(a.get('#focus-start').textContent,'Pause session');
 a.get('#focus-start').onclick();assert.equal(a.get('#focus-start').textContent,'Resume session ↗');
 a.get('#focus-reset').onclick();assert.equal(a.get('#timer').textContent,'25:00');
});
