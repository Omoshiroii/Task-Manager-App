(() => {
'use strict';
const $ = s => document.querySelector(s);
const key = 'taskflow_v1';
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
  return {id,title:t.title.trim(),notes:typeof t.notes==='string'?t.notes.slice(0,3000):'',priority:['low','medium','high'].includes(t.priority)?t.priority:'medium',dueDate:validDate(t.dueDate?.slice(0,10))?t.dueDate.slice(0,10):'',completed:t.completed===true,completedAt:typeof t.completedAt==='string'?t.completedAt:'',createdAt:typeof t.createdAt==='string'?t.createdAt:new Date().toISOString()};
 });
}
let tasks=[], view='today', status='all', editing=null, deleted=null, toastTimeout;
function notify(message, undo=false) { clearTimeout(toastTimeout); $('#message').textContent=message; $('#undo').hidden=!undo; $('#toast').hidden=false; toastTimeout=setTimeout(()=>$('#toast').hidden=true,undo?12000:5000); }
try { const raw=localStorage.getItem(key); if(raw) tasks=normalize(JSON.parse(raw)); } catch { notify('Saved tasks could not be read. Export a backup before making changes.'); $('#save-status').textContent='Could not read saved tasks'; }
function save() {
 try { localStorage.setItem(key,JSON.stringify(tasks)); $('#save-status').textContent='Saved on this device'; }
 catch { $('#save-status').textContent='Changes are not saved'; notify('Storage is unavailable or full. Export a backup to keep your tasks.'); }
 render();
}
const inView=(t,v)=> v==='today' ? t.dueDate===today() || (t.completed && t.completedAt?.slice(0,10)===today()) : v==='upcoming' ? !t.completed && t.dueDate>today() : v==='overdue' ? !t.completed && !!t.dueDate && t.dueDate<today() : v==='completed' ? t.completed : true;
const labels={today:["Make today count.","A clear mind starts with a clear plan.","Today's tasks"],all:["A little more clarity.","Everything you need to do, in one thoughtful place.","All tasks"],upcoming:["Good things ahead.","Make a little room for what's next.","Upcoming tasks"],overdue:["A fresh start awaits.","Revisit, reschedule, or take one small step.","Overdue tasks"],completed:["Look how far you've come.","Take a moment to appreciate your progress.","Completed tasks"]};
function dateLabel(date) {
 if (!date) return 'No due date';
 if(date===today()) return 'Today';
 const tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1);
 const d=new Date(date+'T12:00:00');
 return d.toDateString()===tomorrow.toDateString()?'Tomorrow':d.toLocaleDateString(undefined,{month:'short',day:'numeric',...(d.getFullYear()!==new Date().getFullYear()?{year:'numeric'}:{})});
}
function render(){
 $('#date').textContent=new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'}).toUpperCase();
 const [title,sub,list]=labels[view]; $('#title').textContent=title;$('#subtitle').textContent=sub;$('#list-title').textContent=list;
 document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===view);b.setAttribute('aria-current',b.dataset.view===view?'page':'false');b.querySelector('i').textContent=tasks.filter(t=>inView(t,b.dataset.view) && (b.dataset.view==='completed'||!t.completed)).length;});
 const daily=tasks.filter(t=>inView(t,'today')),done=daily.filter(t=>t.completed).length;
 $('#active-count').textContent=daily.length-done;$('#done-count').textContent=done;
 const percent=daily.length?Math.round(done/daily.length*100):0;
 $('#percent').textContent=percent+'%';$('#fill').style.width=percent+'%';$('#progress-copy').textContent=percent===100?"A day well spent. Take a breath.":done?"You're moving forward. Keep your own pace.":'A small step is a good place to start.';
 const query=$('#search').value.trim().toLowerCase(), order={high:0,medium:1,low:2};
 let shown=tasks.filter(t=>inView(t,view)&&(status==='all'||t.completed===(status==='done'))&&(t.title+' '+t.notes).toLowerCase().includes(query));
 shown.sort((a,b)=>Number(a.completed)-Number(b.completed)||($('#sort').value==='priority'?order[a.priority]-order[b.priority]:$('#sort').value==='title'?a.title.localeCompare(b.title):$('#sort').value==='newest'?b.createdAt.localeCompare(a.createdAt):(a.dueDate||'9999').localeCompare(b.dueDate||'9999'))||b.createdAt.localeCompare(a.createdAt));
 $('#tasks').innerHTML=shown.length?shown.map(t=>'<article class="task '+(t.completed?'completed':'')+'" data-id="'+escape(t.id)+'"><input type="checkbox" class="check" aria-label="Complete '+escape(t.title)+'" '+(t.completed?'checked':'')+'><div class="task-body"><button class="task-name" data-action="edit">'+escape(t.title)+'</button>'+(t.notes?'<p class="notes">'+escape(t.notes)+'</p>':'')+'<div class="meta"><span class="priority '+t.priority+'">'+t.priority[0].toUpperCase()+t.priority.slice(1)+'</span><span class="'+(!t.completed&&t.dueDate&&t.dueDate<today()?'overdue':'')+'">'+escape(dateLabel(t.dueDate))+(!t.completed&&t.dueDate&&t.dueDate<today()?' · Overdue':'')+'</span></div></div><div class="actions"><button data-action="edit" aria-label="Edit '+escape(t.title)+'">Edit</button><button data-action="delete" aria-label="Delete '+escape(t.title)+'">×</button></div></article>').join(''):'<div class="empty"><span aria-hidden="true">◷</span><h3>'+(query||status!=='all'?'Nothing matches just yet':view==='today'?'Your day is a blank canvas':view==='completed'?'Good things take a first step':'A little breathing room')+'</h3><p>'+(query||status!=='all'?'Try a different search or status filter.':view==='today'?'Add something you want to move forward today. Start small, and make it meaningful.':view==='completed'?'Your completed tasks will find a home here.':'No tasks in this view. Add a task or explore your other lists.')+'</p></div>';
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
$('#tasks').onclick=e=>{const b=e.target.closest('[data-action]');if(!b)return;const id=b.closest('[data-id]').dataset.id;const task=tasks.find(t=>t.id===id);if(b.dataset.action==='edit')openEditor(task);else{deleted={task,index:tasks.indexOf(task)};tasks=tasks.filter(t=>t.id!==id);save();notify('Task deleted.',true);}};
$('#undo').onclick=()=>{if(deleted&&!tasks.some(t=>t.id===deleted.task.id)){tasks.splice(deleted.index,0,deleted.task);deleted=null;save();notify('Task restored.');}};
$('#dismiss').onclick=()=>$('#toast').hidden=true;
$('#export').onclick=()=>{let data=tasks;try{const raw=localStorage.getItem(key);if(raw)data=JSON.parse(raw);}catch{}const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='taskflow-backup-'+today()+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('#import').onclick=()=>$('#import-file').click();
$('#import-file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>5000000)throw new Error();const imported=normalize(JSON.parse(await file.text()));let count=0;for(const t of imported){if(!tasks.some(old=>old.id===t.id)){tasks.push(t);count++;}}save();notify(count+' tasks imported. Existing tasks kept.');}catch{notify('Could not import this file. Choose a valid Taskflow JSON backup under 5 MB.');}e.target.value='';};
let remaining=1500, deadline=0, running=false, interval=null;
function drawTimer(){const m=Math.floor(remaining/60),s=remaining%60;$('#timer').textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');}
function tick(){remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));drawTimer();if(!remaining){clearInterval(interval);running=false;$('#focus-start').textContent='Start another session ↗';$('#focus-caption').textContent='Session complete. Take a five-minute break.';notify('Focus session complete. Time for a little breathing room.');}}
$('#focus-start').onclick=()=>{if(running){tick();clearInterval(interval);running=false;$('#focus-start').textContent='Resume session ↗';return;}if(!remaining)remaining=1500;deadline=Date.now()+remaining*1000;running=true;interval=setInterval(tick,250);$('#focus-start').textContent='Pause session';$('#focus-reset').hidden=false;$('#focus-caption').textContent='One thing at a time. You have this.';};
$('#focus-reset').onclick=()=>{clearInterval(interval);running=false;remaining=1500;drawTimer();$('#focus-start').textContent='Start a focus session ↗';$('#focus-reset').hidden=true;$('#focus-caption').textContent='Clear the distractions. Find your flow.';};
document.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='n'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.target.matches('input,textarea,select')&&!$('#dialog').open){e.preventDefault();openEditor();}});
window.addEventListener('storage',e=>{if(e.key==='taskflow_theme'){applyTheme(e.newValue==='light'?'light':'dark');}if(e.key===key){try{tasks=normalize(JSON.parse(e.newValue||'[]'));render();}catch{notify('Could not load changes from another tab.');}}});
let day=today();setInterval(()=>{if(day!==today()){day=today();render();}},30000);
render();
})();
