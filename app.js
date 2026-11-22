'use strict';
const {calls,picks:tickerPicks}=window.AUDIT;
const featured=calls.map(call=>{
 const best=Object.entries(call.windows).sort((a,b)=>b[1].inverse-a[1].inverse)[0];
 return {call,days:Number(best[0]),gain:best[1].inverse};
}).sort((a,b)=>b.gain-a.gain).slice(0,3);
const byId=new Map(calls.map(c=>[c.id,c]));
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
const formatDate=(s,year=true)=>new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',...(year?{year:'numeric'}:{}),timeZone:'UTC'}).format(new Date(s+'T00:00:00Z'));
const percentage=v=>(v<0?'−':v>0?'+':'')+Math.abs(v).toFixed(2)+'%';
const term=h=>h===365?'1Y':h+'D';
const dateNum=s=>Date.parse(s+'T00:00:00Z');
const pickNames={C060:'Gold BeES',C008:'Basic Attention Token',C018:'Nifty BeES',C062:'IDFC First Bank'};
const pickLabels={C060:'Gold ETF',C008:'Crypto',C018:'Index ETF'};
const code=c=>c.symbol.replace(/\.NS$/,'');
const name=c=>pickNames[c.id]||c.asset;
let selected=featured[0].call,horizon=featured[0].days,page=0,plotIndex=0,inspectPoint=null;
function el(tag,cls,txt){const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n}
function val(node,x){node.textContent=percentage(x);node.classList.toggle('positive',x>=0);node.classList.toggle('negative',x<0)}
function svg(tag,attrs,text){const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;return n}
function link(url,txt){const n=el('a','source-link',txt);n.href=url;n.target='_blank';n.rel='noopener noreferrer';return n}
function selectCall(c,scroll=false){selected=c;renderCall();if(scroll){location.hash='overview';$('#overview').scrollIntoView({block:'start'})}}
const tokenIcons={
 C060:'<path d="M5 14h11l3 6H2z" fill="#b98a2b"/><path d="M10 6h10l3 6H7z" fill="#d1a944"/><path d="M10 6h10l-2 2h-9z" fill="#f8d775"/>',
 C008:'<path d="m12 2 11 19H1z" fill="#cf583b"/><path d="m12 2 0 10-11 9z" fill="#ed8650"/><path d="m12 12 11 9H1z" fill="#a84249"/><path d="m12 8 5 9H7z" fill="#fff1dc"/>',
 C018:'<path d="m2 8 10-5 10 5v2H2zm2 11h16v2H4zM6 11h3v7H6zm5 0h3v7h-3zm5 0h3v7h-3z" fill="#7d4a42"/>'
};
function loadPicks(){
 for(const {call:c,days,gain} of featured){const id=c.id,b=el('button','pick');b.type='button';b.dataset.id=id;
 const icon=el('span','token '+({C060:'gold',C008:'bat',C018:'bank'}[id]||'bank'));icon.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24">'+(tokenIcons[id]||tokenIcons.C018)+'</svg>';
 const mid=el('span');mid.append(el('span','pick-name',name(c)),el('span','pick-sub',(pickLabels[id]||code(c))+' · '+(c.sign===1?'Short':'Long')+' · '+term(days)));b.append(icon,mid,el('span','pick-value',percentage(gain)));b.dataset.days=String(days);b.addEventListener('click',()=>{horizon=days;page=0;selectCall(c);renderTable()});$('#picks').append(b);}
 const tickerIds=[...tickerPicks,...calls.filter(c=>c.symbol==='BTC-USD').slice(0,1).map(c=>c.id),...calls.filter(c=>c.symbol==='PVRINOX.NS').slice(0,1).map(c=>c.id)];
 for(const id of tickerIds){const c=byId.get(id),n=el('span','ticker-item');n.append(el('span','',code(c)),el('span',c.windows[90].inverse>=0?'positive':'negative',percentage(c.windows[90].inverse)));$('#ticker').append(n)}
}
function renderCall(){
 for(const b of $$('.pick'))b.setAttribute('aria-pressed',String(b.dataset.id===selected.id&&Number(b.dataset.days)===horizon));
 for(const b of $$('.periods button'))b.setAttribute('aria-pressed',String(Number(b.dataset.h)===horizon));
 const v=selected.windows[horizon];
 $('#asset-name').textContent=name(selected);
 $('#hero-source').href=selected.source;
 let context=$('#call-context');if(!context){context=el('p','call-context');context.id='call-context';$('.panel-foot').before(context)}
 const featuredNotes={C018:'Akshat said he would sell his Nifty 50 allocation to buy specific funds. The reversal held Nifty BeES.',C060:'Akshat called for taking profits on gold. The reversal bought Gold BeES.',C008:'Akshat explained why he was buying BAT. The reversal shorted the token.',C062:'Akshat included IDFC First Bank in his bullish six-stock basket. The reversal shorted the bank.'};
 context.replaceChildren(el('strong','',formatDate(selected.published)+' · '),document.createTextNode(featuredNotes[selected.id]||selected.note));
 const note=$('#hero-note');note.replaceChildren(el('span','',term(horizon)+' inverse return'),document.createElement('br'),el('span','',(selected.sign===1?'Short ':'Long ')+code(selected)));
 if(v){val($('#hero-return'),v.inverse);$('#trade-period').textContent=formatDate(v.entry)+' – '+formatDate(v.exit)}
 else{$('#hero-return').textContent='Pending';$('#hero-return').className='big-num';$('#trade-period').textContent='Published '+formatDate(selected.published)}
 drawChart();
}
function drawChart(){
 const node=$('#plot'),hover=$('#hover'),v=selected.windows[horizon];node.replaceChildren();hover.hidden=true;inspectPoint=null;
 const W=Math.max(240,node.clientWidth),H=Math.max(150,node.clientHeight);node.setAttribute('viewBox','0 0 '+W+' '+H);
 const label=(x,y,t,anc='start')=>svg('text',{x,y,fill:'#53665b','font-size':11,'font-family':'ui-monospace,monospace','text-anchor':anc},t);
 node.append(svg('title',{id:'plot-title'},name(selected)+' inverse return versus Nifty 50 ETF'),svg('desc',{id:'plot-description'},v?'Gross INR return from '+formatDate(v.entry)+' to '+formatDate(v.exit)+'. Inverse '+percentage(v.inverse)+', benchmark '+percentage(v.bench)+'. Use arrow keys to inspect prices.':'The selected holding period has not matured.'));
 if(!v){node.append(label(W/2,H/2,'This holding period is still open.','middle'));return}
 const arr=v.series,left=44,right=W-10,top=12,bottom=H-23;
 const values=arr.flatMap(r=>[r[1],r[2]]);const lo=Math.min(0,...values),hi=Math.max(0,...values);const span=Math.max(2,hi-lo);const mag=10**Math.floor(Math.log10(span/4));const step=[1,2,2.5,5,10].map(k=>k*mag).find(k=>k>=span/4)||10*mag;
 const mn=Math.floor(lo/step)*step,mx=Math.max(mn+step,Math.ceil(hi/step)*step);
 const a=dateNum(arr[0][0]),b=dateNum(arr.at(-1)[0]);
 const x=i=>left+(dateNum(arr[i][0])-a)/(b-a||1)*(right-left),y=val=>top+(mx-val)/(mx-mn)*(bottom-top);
 for(let q=mn;q<=mx+step/100;q+=step){const pos=y(q);node.append(svg('line',{x1:left,x2:right,y1:pos,y2:pos,stroke:Math.abs(q)<1e-6?'#aebcaf':'#dce4db','stroke-dasharray':Math.abs(q)<1e-6?'none':'2 4'}),label(left-8,pos+4,Number(q.toFixed(1))+'%','end'))}
 const labels=W<420?3:5;for(let i=0;i<labels;i++){const idx=Math.round(i*(arr.length-1)/(labels-1));node.append(label(x(idx),H-4,formatDate(arr[idx][0],false),i===0?'start':i===labels-1?'end':'middle'))}
 const build=j=>arr.map((v,i)=>(i?'L':'M')+x(i).toFixed(2)+' '+y(v[j]).toFixed(2)).join(' ');
 const line=build(1),defs=svg('defs',{}),grad=svg('linearGradient',{id:'fill',x1:0,y1:0,x2:0,y2:1,gradientUnits:'objectBoundingBox'});grad.append(svg('stop',{offset:'0%','stop-color':'#8cc592','stop-opacity':.4}),svg('stop',{offset:'100%','stop-color':'#b2d4a2','stop-opacity':.035}));defs.append(grad);node.append(defs);
 node.append(svg('path',{d:line+' L'+right+' '+bottom+' L'+left+' '+bottom+' Z',fill:'url(#fill)'}),svg('path',{d:build(2),fill:'none',stroke:'#83909a','stroke-width':1.75,'stroke-dasharray':'5 4','stroke-linejoin':'round'}),svg('path',{d:line,fill:'none',stroke:'#217251','stroke-width':2.6,'stroke-linejoin':'round','stroke-linecap':'round'}),svg('circle',{cx:x(arr.length-1),cy:y(arr.at(-1)[1]),r:3.8,fill:'#217251',stroke:'white','stroke-width':1.3}));
 const cursor=svg('g',{visibility:'hidden'}),guide=svg('line',{y1:top,y2:bottom,stroke:'#4f685b','stroke-dasharray':'3 3'}),dot=svg('circle',{r:4,fill:'#217251',stroke:'white','stroke-width':2});cursor.append(guide,dot);node.append(cursor);
 plotIndex=0;inspectPoint=(ix)=>{if(ix==null){hover.hidden=true;cursor.setAttribute('visibility','hidden');return}plotIndex=Math.min(arr.length-1,Math.max(0,ix));const row=arr[plotIndex],pos=x(plotIndex);guide.setAttribute('x1',pos);guide.setAttribute('x2',pos);dot.setAttribute('cx',pos);dot.setAttribute('cy',y(row[1]));cursor.setAttribute('visibility','visible');hover.replaceChildren(el('strong','',formatDate(row[0])),el('div','','Inverse '+percentage(row[1])),el('div','','Nifty '+percentage(row[2])));hover.hidden=false;hover.style.left=Math.max(0,Math.min(W-hover.offsetWidth-2,pos+10))+'px'};
 node.onpointermove=ev=>{const offset=ev.clientX-node.getBoundingClientRect().left;let ix=0;while(ix<arr.length-1&&Math.abs(x(ix+1)-offset)<Math.abs(x(ix)-offset))ix++;inspectPoint?.(ix)}
}
const pageSize=8;
function renderTable(){
 const query=$('#search').value.trim().toLowerCase(),order=$('#order').value;
 const filtered=calls.filter(c=>(name(c)+' '+c.asset+' '+c.symbol).toLowerCase().includes(query));
 filtered.sort((a,b)=>{if(order==='recent')return b.published.localeCompare(a.published)||name(a).localeCompare(name(b));const va=a.windows[horizon],vb=b.windows[horizon];if(!va||!vb)return Number(!va)-Number(!vb);return order==='best'?vb.inverse-va.inverse:va.inverse-vb.inverse});
 page=Math.min(page,Math.max(0,Math.ceil(filtered.length/pageSize)-1));const rs=$('#rows');rs.replaceChildren();$('#return-head').textContent=term(horizon)+' return';
 for(const c of filtered.slice(page*pageSize,(page+1)*pageSize)){const tr=el('tr'),first=el('td'),button=el('button','asset-button',name(c));button.addEventListener('click',()=>selectCall(c,true));button.title='Chart '+name(c);first.append(button,el('span','trade-symbol',code(c)));const result=el('td','num'),v=c.windows[horizon];if(v)val(result,v.inverse);else result.textContent='Pending';const src=el('td');src.append(link(c.source,'Original'));tr.append(first,el('td','',formatDate(c.published)),el('td','',c.sign===1?'Short':'Long'),result,src);rs.append(tr)}
 if(!filtered.length){const tr=el('tr'),td=el('td','empty','No calls match this search.');td.colSpan=5;tr.append(td);rs.append(tr)}
 $('#prev').disabled=page===0;$('#next').disabled=(page+1)*pageSize>=filtered.length;$('#page-info').textContent=filtered.length?(page*pageSize+1)+'–'+Math.min((page+1)*pageSize,filtered.length)+' of '+filtered.length+' calls':'0 calls';
}
for(const b of $$('.periods button'))b.addEventListener('click',()=>{horizon=Number(b.dataset.h);page=0;renderCall();renderTable()});
$('#plot').addEventListener('pointerleave',()=>inspectPoint?.(null));$('#plot').addEventListener('blur',()=>inspectPoint?.(null));$('#plot').addEventListener('keydown',ev=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(ev.key)){ev.preventDefault();inspectPoint?.(ev.key==='Home'?0:ev.key==='End'?Infinity:plotIndex+(ev.key==='ArrowLeft'?-1:1))}});
$('#search').addEventListener('input',()=>{page=0;renderTable()});$('#order').addEventListener('change',()=>{page=0;renderTable()});$('#prev').addEventListener('click',()=>{page--;renderTable()});$('#next').addEventListener('click',()=>{page++;renderTable()});
const method=$('#method');for(const b of $$('[data-method]'))b.addEventListener('click',()=>method.showModal());$('.close-dialog').addEventListener('click',()=>method.close());method.addEventListener('click',e=>{if(e.target===method){const b=method.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)method.close()}});
function setNav(){const on=location.hash==='#archive';$('.nav-archive').classList.toggle('active',on);$('.nav-over').classList.toggle('active',!on)}
window.addEventListener('hashchange',setNav);loadPicks();renderCall();renderTable();setNav();new ResizeObserver(drawChart).observe($('.plot-holder'));

