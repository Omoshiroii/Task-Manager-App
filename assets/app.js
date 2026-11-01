(() => {
'use strict';
const $ = s => document.querySelector(s);
const key = 'taskflow_v1';
const dbName = 'taskflow_database';
const dbVersion = 1;
const channel = 'BroadcastChannel' in window ? new BroadcastChannel('taskflow_tasks') : null;
const root = document.documentElement;
function applyTheme(theme) {
 root.dataset.theme = theme;
 $('#theme-toggle').textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
 $('#theme-toggle').setAttribute('aria-label', 'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' mode');
 $('#theme-toggle').setAttribute('aria-pressed', String(theme === 'light'));
 $('meta[name="theme-color"]').setAttribute('content', theme === 'dark' ? '#000f08' : '#f4fff8');
}
applyTheme(root.dataset.theme === 'light' ? 'light' : 'dark');
$('#theme-toggle').onclick = () => {
 const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
 applyTheme(theme);
 try { localStorage.setItem('taskflow_theme', theme); } catch { /* Theme still works for this session. */ }
};

const today = () => { const d = new Date(); return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-'); };
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value+'T12:00:00').getTime()) && new Date(value+'T12:00:00').getFullYear() > 0 && (() => {const d=new Date(value+'T12:00:00');return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')===value;})();
function normalize(data) {
 if (!Array.isArray(data)) throw new Error('Expected an array of tasks.');
 const ids = new Set();
 return data.map(t => {
  if (!t || typeof t.title !== 'string' || !t.title.trim() || t.title.length > 200) throw new Error('Invalid task title.');
  const id = typeof t.id === 'string' && t.id && !ids.has(t.id) ? t.id : crypto.randomUUID(); ids.add(id);
  return {id,title:t.title.trim(),notes:typeof t.notes==='string'?t.notes.slice(0,3000):'',priority:['low','medium','high'].includes(t.priority)?t.priority:'medium',dueDate:validDate(t.dueDate?.slice(0,10))?t.dueDate.slice(0,10):'',completed:t.completed===true,completedAt:typeof t.completedAt==='string'&&t.completedAt?t.completedAt:(t.completed&&typeof t.updatedAt==='string'?t.updatedAt:''),createdAt:typeof t.createdAt==='string'?t.createdAt:new Date().toISOString()};
 });
}
let tasks=[], view='today', status='all', editing=null, undoAction=null, toastTimeout;
let database=null, storageMode='database', saveQueue=Promise.resolve();
function notify(message, undo=false) { if(!undo) undoAction=null; clearTimeout(toastTimeout); $('#message').textContent=message; $('#undo').hidden=!undo; $('#toast').hidden=false; toastTimeout=setTimeout(()=>$('#toast').hidden=true,undo?12000:5000); }
function localTasks() {
 const raw=localStorage.getItem(key);
 return raw ? normalize(JSON.parse(raw)) : [];
}
function openDatabase() {
 return new Promise((resolve,reject)=>{
  if(!('indexedDB' in window)){reject(new Error('This browser does not support a local database.'));return;}
  const request=indexedDB.open(dbName,dbVersion);
  request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('workspace'))request.result.createObjectStore('workspace',{keyPath:'key'});};
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error||new Error('Could not open the task database.'));
  request.onblocked=()=>reject(new Error('The task database is busy in another tab. Close old Taskflow tabs and reload.'));
 });
}
function databaseRead() {
 return new Promise((resolve,reject)=>{
  const transaction=database.transaction('workspace','readonly');
  const request=transaction.objectStore('workspace').get('tasks');
  let row=null;
  request.onsuccess=()=>{row=request.result||null;};
  request.onerror=()=>reject(request.error||new Error('Could not read saved tasks.'));
  transaction.oncomplete=()=>resolve({initialized:Boolean(row),items:normalize(row?.items||[])});
  transaction.onerror=()=>reject(transaction.error||new Error('Could not read saved tasks.'));
  transaction.onabort=()=>reject(transaction.error||new Error('Reading saved tasks was interrupted.'));
 });
}
function databaseWrite(items) {
 return new Promise((resolve,reject)=>{
  const transaction=database.transaction('workspace','readwrite');
  transaction.objectStore('workspace').put({key:'tasks',items});
  transaction.oncomplete=()=>resolve();
  transaction.onerror=()=>reject(transaction.error||new Error('Could not save your tasks.'));
  transaction.onabort=()=>reject(transaction.error||new Error('Saving your tasks was interrupted.'));
 });
}
async function loadTasks() {
 $('#save-status').textContent='Loading saved tasks…';
 try {
  const fallback=localStorage.getItem('taskflow_storage_mode')==='local';
  if(fallback) throw new Error('Using browser storage fallback.');
  database=await openDatabase();
  const saved=await databaseRead();
  tasks=saved.items;
  if(!saved.initialized){
   // Import the existing Taskflow list only when the new database is uninitialized.
   const previous=localTasks();
   if(previous.length){await databaseWrite(previous);tasks=previous;}
   else await databaseWrite([]);
  }
  storageMode='database';
  try{localStorage.removeItem('taskflow_storage_mode');}catch{}
  $('#save-status').textContent='Saved in this browser database';
  if(navigator.storage?.persist) navigator.storage.persist().catch(()=>{});
 } catch(error) {
  database=null;storageMode='local';
  try{tasks=localTasks();localStorage.setItem('taskflow_storage_mode','local');$('#save-status').textContent='Saved in this browser';}
  catch{tasks=[];$('#save-status').textContent='Storage unavailable';notify('Saved tasks could not be loaded. Import a JSON backup if you have one.');}
 }
 render();
}
function save() {
 render();
 $('#save-status').textContent='Saving…';
 const snapshot=tasks.map(task=>({...task}));
 const operation=saveQueue.then(async()=>{
  if(storageMode==='database' && database) await databaseWrite(snapshot);
  else localStorage.setItem(key,JSON.stringify(snapshot));
  if(channel) channel.postMessage(snapshot);
  $('#save-status').textContent=storageMode==='database'?'Saved in this browser database':'Saved in this browser';
 });
 saveQueue=operation.catch(error=>{
  $('#save-status').textContent='Could not save changes';
  notify('Your changes could not be saved. Export a JSON backup and try again.');
  console.error('Task save failed:',error);
 });
}
if(channel) channel.addEventListener('message',event=>{
 try{tasks=normalize(event.data);render();$('#save-status').textContent=storageMode==='database'?'Saved in this browser database':'Saved in this browser';}
 catch{notify('Could not load task changes from another tab.');}
});
const inView=(t,v)=> v==='today' ? t.dueDate===today() || (t.completed && t.completedAt?.slice(0,10)===today()) : v==='upcoming' ? !t.completed && t.dueDate>today() : v==='overdue' ? !t.completed && !!t.dueDate && t.dueDate<today() : v==='completed' ? t.completed : true;
const labels={today:["Your day, in focus.","A little intention. A little progress. A day well spent.","Today's tasks"],all:["A little more clarity.","Everything you need to do, in one thoughtful place.","All tasks"],upcoming:["Good things ahead.","Make a little room for what's next.","Upcoming tasks"],overdue:["A fresh start awaits.","Revisit, reschedule, or take one small step.","Overdue tasks"],completed:["Look how far you've come.","Take a moment to appreciate your progress.","Completed tasks"]};
function dateLabel(date) {
 if (!date) return 'No due date';
 if(date===today()) return 'Today';
 const tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1);
 const d=new Date(date+'T12:00:00');
 return d.toDateString()===tomorrow.toDateString()?'Tomorrow':d.toLocaleDateString(undefined,{month:'short',day:'numeric',...(d.getFullYear()!==new Date().getFullYear()?{year:'numeric'}:{})});
}
function renderCharts(){
 const todayDate=new Date();
 const days=[];
 for(let offset=6;offset>=0;offset--){
  const day=new Date(todayDate);day.setDate(day.getDate()-offset);
  const key=[day.getFullYear(),String(day.getMonth()+1).padStart(2,'0'),String(day.getDate()).padStart(2,'0')].join('-');
  const count=tasks.filter(task=>task.completed && task.completedAt?.slice(0,10)===key).length;
  days.push({key,count,label:day.toLocaleDateString(undefined,{weekday:'short'})});
 }
 const total=days.reduce((sum,day)=>sum+day.count,0);
 $('#weekly-total').textContent=total+' completed this week';
 const maximum=Math.max(4,...days.map(day=>day.count));
 const chartTop=15, baseY=137, chartHeight=112;
 const grid=Array.from({length:5},(_,index)=>{
  const value=Math.round(maximum*(4-index)/4), y=chartTop+chartHeight*index/4;
  return '<line class="chart-gridline" x1="37" y1="'+y+'" x2="684" y2="'+y+'"></line><text class="chart-axis" x="25" y="'+(y+4)+'" text-anchor="end">'+value+'</text>';
 }).join('');
 const columns=days.map((day,index)=>{
  const x=62+index*91, height=day.count?Math.max(4,chartHeight*day.count/maximum):0, y=baseY-height;
  return '<g class="chart-column"><title>'+escape(day.label)+': '+day.count+' completed</title><rect class="chart-bar '+(index===6?'today':'')+'" x="'+x+'" y="'+y+'" width="38" height="'+height+'" rx="4"></rect><text class="chart-label" x="'+(x+19)+'" y="165" text-anchor="middle">'+escape(day.label)+'</text></g>';
 }).join('');
 $('#weekly-chart').innerHTML='<title>Tasks completed over the last seven days</title>'+grid+'<line class="chart-baseline" x1="37" y1="'+baseY+'" x2="684" y2="'+baseY+'"></line>'+columns;
 $('#weekly-chart').setAttribute('aria-label',days.map(day=>day.label+': '+day.count+' completed').join(', '));
 const priorities=['high','medium','low'];
 const counts=priorities.map(priority=>tasks.filter(task=>!task.completed&&task.priority===priority).length);
 const all=counts.reduce((sum,count)=>sum+count,0), radius=48, circumference=2*Math.PI*radius;
 let offset=0;
 const rings=counts.map((count,index)=>{
  const length=all?circumference*count/all:0, gap=count?Math.max(0,circumference-length-2):circumference;
  const result='<circle class="mix-segment '+priorities[index]+'" cx="80" cy="80" r="'+radius+'" fill="none" stroke-width="11" stroke-dasharray="'+length+' '+gap+'" stroke-dashoffset="'+(-offset)+'" transform="rotate(-90 80 80)"><title>'+priorities[index]+': '+count+'</title></circle>';
  offset+=length;return result;
 }).join('');
 $('#mix-chart').innerHTML='<circle class="mix-track" cx="80" cy="80" r="'+radius+'" fill="none" stroke-width="11"></circle>'+rings+'<text class="mix-count" x="80" y="77" text-anchor="middle">'+all+'</text><text class="mix-caption" x="80" y="95" text-anchor="middle">OPEN</text>';
 $('#mix-chart').setAttribute('aria-label',all?counts.map((count,index)=>priorities[index]+' priority: '+count).join(', '):'No open tasks');
 $('#mix-legend').innerHTML=priorities.map((priority,index)=>'<div class="legend-item"><span class="legend-dot '+priority+'"></span><span>'+priority[0].toUpperCase()+priority.slice(1)+'</span><strong>'+counts[index]+'</strong></div>').join('');
}
function render(){
 $('#date').textContent=new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'}).toUpperCase();
 const [title,sub,list]=labels[view]; $('#title').textContent=title;$('#subtitle').textContent=sub;$('#list-title').textContent=list;
 document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===view);b.setAttribute('aria-current',b.dataset.view===view?'page':'false');b.querySelector('i').textContent=tasks.filter(t=>inView(t,b.dataset.view) && (b.dataset.view==='completed'||!t.completed)).length;});
 const overdue=tasks.filter(t=>inView(t,'overdue'));
 $('#carry-over').hidden=overdue.length===0 || !['today','overdue'].includes(view);
 $('#carry-count').textContent=overdue.length+' unfinished task'+(overdue.length===1?'':'s')+' from earlier days';
 const daily=tasks.filter(t=>inView(t,'today')),done=daily.filter(t=>t.completed).length;
 $('#active-count').textContent=daily.length-done;$('#done-count').textContent=done;
 const percent=daily.length?Math.round(done/daily.length*100):0;
 $('#percent').textContent=percent+'%';$('#fill').style.width=percent+'%';$('#progress-copy').textContent=percent===100?"A day well spent. Take a breath.":done?"You're moving forward. Keep your own pace.":'One small step is a good place to start.';
 renderCharts();
 const query=$('#search').value.trim().toLowerCase(), order={high:0,medium:1,low:2};
 let shown=tasks.filter(t=>inView(t,view)&&(status==='all'||t.completed===(status==='done'))&&(t.title+' '+t.notes).toLowerCase().includes(query));
 shown.sort((a,b)=>Number(a.completed)-Number(b.completed)||($('#sort').value==='priority'?order[a.priority]-order[b.priority]:$('#sort').value==='title'?a.title.localeCompare(b.title):$('#sort').value==='newest'?b.createdAt.localeCompare(a.createdAt):(a.dueDate||'9999').localeCompare(b.dueDate||'9999'))||b.createdAt.localeCompare(a.createdAt));
 $('#tasks').innerHTML=shown.length?shown.map(t=>'<article class="task '+(t.completed?'completed':'')+'" data-id="'+escape(t.id)+'"><input type="checkbox" class="check" aria-label="Complete '+escape(t.title)+'" '+(t.completed?'checked':'')+'><div class="task-body"><button class="task-name" data-action="edit">'+escape(t.title)+'</button>'+(t.notes?'<p class="notes">'+escape(t.notes)+'</p>':'')+'<div class="meta"><span class="priority '+t.priority+'">'+t.priority[0].toUpperCase()+t.priority.slice(1)+'</span><span class="'+(!t.completed&&t.dueDate&&t.dueDate<today()?'overdue':'')+'">'+escape(dateLabel(t.dueDate))+(!t.completed&&t.dueDate&&t.dueDate<today()?' · Overdue':'')+'</span></div></div><div class="actions"><button data-action="edit" aria-label="Edit '+escape(t.title)+'">Edit</button><button data-action="delete" aria-label="Delete '+escape(t.title)+'">×</button></div></article>').join(''):'<div class="empty"><span class="empty-art" aria-hidden="true"><svg class="icon"><use href="#icon-list"/></svg></span><h3>'+(query||status!=='all'?'Nothing matches just yet':view==='today'?'Start with one small thing.':view==='completed'?'Good things take a first step':'A little breathing room')+'</h3><p>'+(query||status!=='all'?'Try a different search or status filter.':view==='today'?'A clear plan starts with a single task. Add what matters today, and take it from there.':view==='completed'?'Your completed tasks will find a home here.':'No tasks in this view. Add a task or explore your other lists.')+'</p></div>';
 const selected=$('#focus-task').value;
 $('#focus-task').innerHTML='<option value="">Choose a task to focus on</option>'+tasks.filter(t=>!t.completed).map(t=>'<option value="'+escape(t.id)+'">'+escape(t.title)+'</option>').join('');
 if(tasks.some(t=>t.id===selected&&!t.completed))$('#focus-task').value=selected;
}
function openEditor(task=null){editing=task?.id||null;$('#form').reset();$('#dialog-title').textContent=task?'Edit task':'Add a task';$('#task-title').value=task?.title||'';$('#notes').value=task?.notes||'';$('#due').value=task?task.dueDate:view==='today'?today():'';$('#priority').value=task?.priority||'medium';$('#dialog').showModal();$('#task-title').focus();}
$('#add').onclick=$('#quick-add').onclick=()=>openEditor();
$('#close').onclick=$('#cancel').onclick=()=>$('#dialog').close();
$('#dialog').addEventListener('click',e=>{if(e.target===$('#dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
$('#form').onsubmit=e=>{e.preventDefault();const title=$('#task-title').value.trim();if(!title){$('#task-title').setCustomValidity('Give your task a name.');$('#task-title').reportValidity();return;}const values={title,notes:$('#notes').value.trim(),dueDate:$('#due').value,priority:$('#priority').value};if(editing){Object.assign(tasks.find(t=>t.id===editing),values);}else tasks.unshift({id:crypto.randomUUID(),...values,completed:false,completedAt:'',createdAt:new Date().toISOString()});$('#dialog').close();save();notify(editing?'Task updated.':'Task added.');};
$('#task-title').oninput=()=>$('#task-title').setCustomValidity('');
$('#navigation').onclick=e=>{const b=e.target.closest('[data-view]');if(!b)return;view=b.dataset.view;status='all';$('#search').value='';document.querySelectorAll('[data-status]').forEach(b=>b.classList.toggle('selected',b.dataset.status==='all'));render();};
document.querySelector('.tabs').onclick=e=>{const b=e.target.closest('[data-status]');if(!b)return;status=b.dataset.status;document.querySelectorAll('[data-status]').forEach(el=>{el.classList.toggle('selected',el===b);el.setAttribute('aria-pressed',String(el===b));});render();};
$('#search').oninput=$('#sort').onchange=render;
$('#tasks').addEventListener('change',e=>{if(!e.target.matches('.check'))return;const t=tasks.find(t=>t.id===e.target.closest('[data-id]').dataset.id);t.completed=e.target.checked;t.completedAt=t.completed?today():'';save();notify(t.completed?'A little progress. Nicely done.':'Task reopened.');});
$('#tasks').onclick=e=>{const b=e.target.closest('[data-action]');if(!b)return;const id=b.closest('[data-id]').dataset.id;const task=tasks.find(t=>t.id===id);if(b.dataset.action==='edit')openEditor(task);else{undoAction={type:'delete',task,index:tasks.indexOf(task)};tasks=tasks.filter(t=>t.id!==id);save();notify('Task deleted.',true);}};
$('#carry-today').onclick=()=>{
 const dueDate=today();
 const overdue=tasks.filter(t=>!t.completed && t.dueDate && t.dueDate<dueDate);
 if(!overdue.length)return;
 undoAction={type:'reschedule',date:dueDate,tasks:overdue.map(t=>({id:t.id,dueDate:t.dueDate}))};
 overdue.forEach(t=>{t.dueDate=dueDate;});
 save();
 notify(overdue.length+' task'+(overdue.length===1?'':'s')+' moved to today.',true);
};
$('#undo').onclick=()=>{
 const action=undoAction;
 if(!action)return;
 undoAction=null;
 if(action.type==='delete'){
  if(tasks.some(t=>t.id===action.task.id))return;
  tasks.splice(action.index,0,action.task);
  save();notify('Task restored.');
 }else if(action.type==='reschedule'){
  let restored=0;
  action.tasks.forEach(previous=>{
   const task=tasks.find(t=>t.id===previous.id);
   // Preserve a newer date if the task was edited in another tab.
   if(task && task.dueDate===action.date){task.dueDate=previous.dueDate;restored++;}
  });
  save();notify(restored+' task date'+(restored===1?'':'s')+' restored.');
 }
};
$('#dismiss').onclick=()=>$('#toast').hidden=true;
$('#export').onclick=async()=>{
 try{
  await saveQueue;
  const data=storageMode==='database'&&database?(await databaseRead()).items:tasks;
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download='taskflow-backup-'+today()+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }catch{notify('Could not create the backup. Try again in a moment.');}
};
$('#import').onclick=()=>$('#import-file').click();
$('#import-file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>5000000)throw new Error();const imported=normalize(JSON.parse(await file.text()));let count=0;for(const t of imported){if(!tasks.some(old=>old.id===t.id)){tasks.push(t);count++;}}save();notify(count+' tasks imported. Existing tasks kept.');}catch{notify('Could not import this file. Choose a valid Taskflow JSON backup under 5 MB.');}e.target.value='';};
let remaining=1500, deadline=0, running=false, interval=null;
function updateFocusEnd(label=''){const output=$('#focus-end');output.hidden=!label;output.textContent=label;}
function finishLabel(timestamp){return 'Ends at '+new Intl.DateTimeFormat(undefined,{hour:'numeric',minute:'2-digit'}).format(new Date(timestamp));}
function drawTimer(){const m=Math.floor(remaining/60),s=remaining%60;$('#timer').textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');}
function tick(){remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));drawTimer();if(!remaining){clearInterval(interval);running=false;$('#focus-start').textContent='Start another session ↗';$('#focus-caption').textContent='Session complete. Take a five-minute break.';updateFocusEnd('Finished at '+new Intl.DateTimeFormat(undefined,{hour:'numeric',minute:'2-digit'}).format(new Date()));notify('Focus session complete. Time for a little breathing room.');}}
$('#focus-start').onclick=()=>{if(running){tick();clearInterval(interval);running=false;$('#focus-start').textContent='Resume session ↗';updateFocusEnd('Paused · '+finishLabel(Date.now()+remaining*1000).replace('Ends at ',''));return;}if(!remaining)remaining=1500;deadline=Date.now()+remaining*1000;running=true;interval=setInterval(tick,250);$('#focus-start').textContent='Pause session';$('#focus-reset').hidden=false;$('#focus-caption').textContent='One thing at a time. You have this.';updateFocusEnd(finishLabel(deadline));};
$('#focus-reset').onclick=()=>{clearInterval(interval);running=false;remaining=1500;drawTimer();$('#focus-start').textContent='Start a focus session ↗';$('#focus-reset').hidden=true;$('#focus-caption').textContent='Take a breath. Then begin.';updateFocusEnd();};
document.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='n'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.target.matches('input,textarea,select')&&!$('#dialog').open){e.preventDefault();openEditor();}});
window.addEventListener('storage',e=>{if(e.key==='taskflow_theme'){applyTheme(e.newValue==='light'?'light':'dark');}});
const clockFormat=new Intl.DateTimeFormat(undefined,{hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
const clockDateFormat=new Intl.DateTimeFormat(undefined,{weekday:'short',month:'short',day:'numeric'});
const clockZone=clockFormat.resolvedOptions().timeZone;
function updateClock(){
 const now=new Date();
 $('#clock').textContent=clockFormat.format(now);
 $('#clock').setAttribute('datetime',now.toISOString());
 $('#clock').setAttribute('title','Local time · '+clockZone);
 $('#clock-date').textContent=clockDateFormat.format(now);
}
updateClock();
setInterval(updateClock,1000);
document.addEventListener('visibilitychange',updateClock);
let day=today();setInterval(()=>{if(day!==today()){day=today();render();}},30000);
loadTasks();
})();
