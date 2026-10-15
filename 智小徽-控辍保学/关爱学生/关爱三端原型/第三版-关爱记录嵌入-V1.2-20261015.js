/* 第一期第三版 V1.2：Web端改为直接嵌入控辍保学源文件（预警内容保持源样式、不含关爱），菜单兼容源侧栏的事件绑定。
 * 以下沿用 V1.1 说明 —— 第一期第三版 V1.1：复制第一版六端框架后嵌入关爱记录。每条记录独立保存，不形成可追加个案。
 * V1.1 只调整呈现：统一沿用第一版关爱内容视觉；Web 菜单收为右上角功能菜单点；
 * 规则说明、校验演示、身份示例统一收进顶部绿色提示点（场景 / 异常）。业务逻辑与 V1.0 一致，并按 PRD 补齐缺失交互。 */
(function(){
  'use strict';
  var role=window.CARE_V3_EMBED_ROLE||'teacher';
  var isTeacher=role==='teacher',isSchool=role==='school';
  var TYPES=['家庭经济困难学生','农村留守儿童','进城务工随迁子女','单亲 / 监护缺失学生','随班就读残疾学生','心理行为偏差 / 情绪困扰学生','心理危机学生','慢性疾病需特殊照料学生','学业困难学生','升学考试焦虑学生','遭遇校园欺凌霸凌学生','家庭突发变故学生'];
  var METHODS=['学业帮扶与个性化辅导','心理健康屋减压','个体心理咨询与团体辅导','心理危机干预与转介就医','国家学生资助（两免一补 / 营养改善 / 助学金）','特殊困难学生临时救助','寄宿与日常起居照料','上下学与假期安全管护','常态化家访与家校沟通','家长教育与监护能力指导','校园欺凌防治帮扶','公共安全与专题安全教育','帮扶责任人 / 爱心结对制度','专业社工与多部门协同关爱','精神疾病诊疗与复学支持'];
  var SOURCES=['辍学预警','心理测评','班主任发现','任课教师反映','学生主动反映','家长反映','困难学生','欺凌事件','其他'];
  var TEACHERS=['王老师','李老师','陈老师'];
  var TREE={北京市:{省属:{市直:['北京市直属学校']},北京市:{海淀区:['海淀区实验小学','海淀区第二中学'],朝阳区:['朝阳区实验小学','朝阳区第二中学']}},河北省:{保定市:{莲池区:['莲池区实验小学','莲池区第二中学'],竞秀区:['竞秀区实验小学']},邯郸市:{丛台区:['丛台区实验小学'],邯山区:['邯山区第二中学']}},陕西省:{宝鸡市:{凤翔区:['凤翔区第一实验小学','凤翔区第二中学'],渭滨区:['渭滨区实验小学','渭滨区第一初级中学'],金台区:['金台区实验小学']},西安市:{雁塔区:['雁塔区实验小学'],碑林区:['碑林区第二中学']}}};
  var ROOTS={teacher:['陕西省','宝鸡市','凤翔区','凤翔区第一实验小学'],school:['陕西省','宝鸡市','凤翔区','凤翔区第一实验小学'],ministry:[],province:['陕西省'],city:['陕西省','宝鸡市'],county:['陕西省','宝鸡市','凤翔区']};
  var ROOT=ROOTS[role]||ROOTS.school,MAIN_SCHOOL='凤翔区第一实验小学';
  var audit=[],records=[],students=[],seq=0;
  var ACCOUNTS={wang:{key:'wang',id:'teacher-wang',name:'王老师',label:'王老师（全校查看/可操作本人）',view:'all',write:true,operate:true},li:{key:'li',id:'teacher-li',name:'李老师',label:'李老师（班级查看/可操作本人）',view:'class',write:true,operate:true},none:{key:'none',id:'teacher-chen',name:'陈老师',label:'陈老师（可查看/无操作权限）',view:'all',write:false,operate:false}};
  var account=ACCOUNTS.wang;
  window.CARE_V3_AUDIT=audit;
  window.CARE_V3_RECORDS=records;
  var DEMO_PROOFS=['#dbeafe','#dcfce7'].map(function(c,i){return {name:'证明材料'+(i+1)+'.png',src:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><rect width="240" height="240" fill="'+c+'"/><text x="120" y="128" font-size="22" text-anchor="middle" fill="#36506f" font-family="Microsoft YaHei,sans-serif">示例材料'+(i+1)+'</text></svg>')}});
  var CAL_ICON='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="2" y="3" width="12" height="11" rx="1.5"/><path d="M2 6.5h12M5.5 1.8v2.6M10.5 1.8v2.6"/></svg>';

  /* ---------- 通用工具 ---------- */
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function clone(v){return JSON.parse(JSON.stringify(v))}
  function now(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date()).replace('T',' ')}
  function today(){return now().slice(0,10)}
  function yearOf(d){var y=Number(String(d).slice(0,4))-(Number(String(d).slice(5,7))<9?1:0);return y+'-'+(y+1)+'学年'}
  function currentSchoolYear(){return yearOf(today())}
  function inPath(path,root){return root.every(function(v,i){return path[i]===v})}
  function validDate(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v||''))return false;var d=new Date(v+'T00:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===v}
  function short(v){var a=Array.from(v||'--');return a.length>10?a.slice(0,10).join('')+'...':a.join('')}
  function ordered(values,dict){return dict.filter(function(x){return (values||[]).indexOf(x)>=0}).concat((values||[]).filter(function(x){return dict.indexOf(x)<0}))}
  function pad2(n){return String(n).padStart(2,'0')}
  function phone(){return document.querySelector('.phone')}
  function toast(message){
    if(isTeacher&&typeof window.toast==='function'&&document.getElementById('toast')){window.toast(message);return}
    var host=isTeacher&&phone()?phone():document.body,old=host.querySelector(':scope>.c3-toast');if(old)old.remove();
    var x=document.createElement('div');x.className='c3-toast';x.textContent=message;host.appendChild(x);setTimeout(function(){x.remove()},2400);
  }

  /* ---------- 绿色提示点：场景 / 异常浮窗 ---------- */
  var openHelps=[];
  function helpDot(getConfig){
    var wrap=document.createElement('span'),dot=document.createElement('button'),pop=document.createElement('div'),cat=0;
    wrap.className='c3h-wrap';dot.type='button';dot.className='c3h-dot';dot.setAttribute('aria-label','查看本页场景与异常提示');dot.title='查看本页场景与异常提示';dot.setAttribute('aria-expanded','false');
    pop.className='c3h-pop';pop.hidden=true;wrap.append(dot,pop);
    function close(){pop.hidden=true;dot.setAttribute('aria-expanded','false')}
    function draw(){
      var cfg=getConfig(),cats=cfg.cats.filter(function(c){return c.items.length});if(cat>=cats.length)cat=0;
      pop.innerHTML='<div class="c3h-title">'+esc(cfg.title||'本页交互文案预览')+'</div><div class="c3h-cats">'+cats.map(function(c,i){return '<button type="button" data-cat="'+i+'" class="'+(i===cat?'on':'')+'">'+esc(c.name)+'</button>'}).join('')+'</div><div class="c3h-items">'+cats[cat].items.map(function(it,i){return (it.group?'<div class="c3h-group">'+esc(it.group)+'</div>':'')+'<button type="button" data-item="'+i+'" class="'+(it.on?'on':'')+'">'+esc(it.label)+(it.sub?'<small>'+esc(it.sub)+'</small>':'')+'</button>'}).join('')+'</div>';
      pop.querySelectorAll('[data-cat]').forEach(function(b){b.onclick=function(e){e.stopPropagation();cat=Number(b.dataset.cat);draw()}});
      pop.querySelectorAll('[data-item]').forEach(function(b){b.onclick=function(e){e.stopPropagation();var it=cats[cat].items[Number(b.dataset.item)];if(it.keep){(it.run||function(){toast(it.label)})();draw();return}close();(it.run||function(){toast(it.label)})()}});
    }
    dot.onclick=function(e){e.stopPropagation();var willOpen=pop.hidden;openHelps.forEach(function(f){f()});if(willOpen){draw();pop.hidden=false;dot.setAttribute('aria-expanded','true')}};
    pop.onclick=function(e){e.stopPropagation()};
    openHelps.push(close);wrap.close=close;return wrap;
  }
  document.addEventListener('click',function(){openHelps.forEach(function(f){f()})});
  function msgItems(list){return list.map(function(x){return typeof x==='string'?{label:x}:x})}

  /* ---------- 演示数据 ---------- */
  function seed(){
    Object.keys(TREE).forEach(function(p){Object.keys(TREE[p]).forEach(function(c){Object.keys(TREE[p][c]).forEach(function(d){TREE[p][c][d].forEach(function(school){
      var local=[
        {name:'张小明',grade:'七年级（2025级）',className:'2班',teacher:'王老师'},
        {name:'李小红',grade:'七年级（2025级）',className:'1班',teacher:'李老师',simulateEnrollmentChange:true,serverGrade:'八年级（2025级）',serverClass:'3班'},
        {name:'王小华',grade:'八年级（2024级）',className:'2班',teacher:'王老师'},
        {name:'陈小强',grade:'八年级（2024级）',className:'1班',teacher:'李老师',simulateStatusChange:true}
      ].map(function(s,i){s.id='s-'+students.length+'-'+i;s.org=[p,c,d,school];s.status='在读';students.push(s);return s});
      var count=school===MAIN_SCHOOL?46:8;
      for(var i=0;i<count;i++){
        var st=local[i%local.length],day=pad2(28-(i%12)),created=(i<4?today():'2026-09-'+pad2(25-(i%5)))+' '+pad2(18-(i%8))+':'+pad2(10+(i%45))+':'+pad2(i%60);
        records.push({id:'r-'+String(++seq).padStart(5,'0'),studentId:st.id,student:{id:st.id,name:st.name,grade:st.grade,className:st.className,org:st.org.slice()},sources:[SOURCES[i%SOURCES.length]],types:[TYPES[i%TYPES.length]],reason:'结合学生近期学习、出勤与家庭情况，记录本次需要关爱的真实情况。',careDate:'2026-10-'+day,people:[st.teacher],method:METHODS[i%METHODS.length],result:'已与学生沟通并落实本次关爱措施，记录实际情况供后续了解。',proofs:(school===MAIN_SCHOOL&&i===0)?clone(DEMO_PROOFS):[],createdBy:i%2?'teacher-li':'teacher-wang',createdName:i%2?'李老师':'王老师',createdAt:created,updatedAt:null,updatedBy:null,version:1});
      }
    })})})})
  }
  seed();
  function sorted(list){return list.slice().sort(function(a,b){return b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id)})}
  function findStudent(id){return students.find(function(s){return s.id===id})}
  function visibleTeacher(r){var s=findStudent(r.studentId);return inPath(r.student.org,ROOT)&&(account.view==='all'||(s&&s.teacher===account.name))}
  function canEdit(r){return !!r&&account.write&&account.operate&&r.createdBy===account.id&&visibleTeacher(r)}
  var RULES=['关爱记录位于控辍保学页面，与预警记录、劝返记录并列。','每条记录独立保存，不形成可追加的关爱个案。','只展示本学年（按关爱时间，9月1日至次年8月31日）关爱记录，每次向下加载20条。','查看范围受学生数据权限控制；本人创建且有写入、操作权限的记录才可编辑、删除。','创建时间由服务端写入且永不因编辑改变，列表按创建时间倒序（同秒按记录ID倒序）。','提交时重新校验学生在读状态、年级班级和数据范围。','每次编辑、删除均由后端保存操作人、操作时间及前后快照。'];
  var WEB_RULES=['本页只读：不提供新增、编辑、删除或处理按钮，操作列唯一按钮为“详情”。','一条记录对应一次关爱；同一学生可有多行，不合并为个案，不显示关联信息或关爱次数。','列表按服务端首次创建时间倒序，显示到分钟；编辑不改变创建时间。','创建日期默认今天，含起止当天；学年按关爱时间归属。查询/重置回第1页，每页10条。','监管汇总按组织名称逐层下钻：关爱学生数按学生ID去重，关爱次数按独立记录计数，不按执行人数计次。','下钻继承上级创建日期；返回恢复上一层原条件与页码。'];

  /* ======================================================================
   * 老师端（手机）
   * ==================================================================== */
  var T={loaded:20,search:'',scroll:0,editing:null,draft:null,dirty:false,reading:false,origin:'list',detailId:null};
  function teacherQuery(){return sorted(records.filter(function(r){return visibleTeacher(r)&&yearOf(r.careDate)===currentSchoolYear()&&(!T.search||r.student.name.indexOf(T.search)>=0)}))}
  function scopeStudents(){return students.filter(function(s){return inPath(s.org,ROOT)&&s.status==='在读'&&(account.view==='all'||s.teacher===account.name)})}
  function kvm(k,v,raw){return '<div class="c3m-kv"><span class="k">'+esc(k)+'</span><span class="v">'+(raw?v:esc(v==null||v===''?'--':v))+'</span></div>'}
  function studentHeadM(s,only){return '<div class="c3m-student'+(only?' only':'')+'"><span class="c3m-avatar">'+esc(s.name.slice(0,1))+'</span><span style="flex:1;min-width:0"><b>'+esc(s.name)+'</b><div class="c3m-sub">'+esc(s.grade+' · '+s.className)+'</div></span></div>'}
  function capsule(){return '<span class="capsule" style="margin-left:auto"><span class="half"><span class="cap-dots"><i></i><i></i><i></i></span></span><span class="half"><span class="cap-ring"></span></span></span>'}
  function setAccount(key){account=ACCOUNTS[key]||ACCOUNTS.wang;T.loaded=20;T.scroll=0;renderTeacherList();toast('已切换为'+account.label)}
  function identityItems(){return Object.keys(ACCOUNTS).map(function(k,i){var a=ACCOUNTS[k];return {group:i===0?'演示身份（权限示例）':'',label:a.label,on:account.key===k,keep:true,run:function(){setAccount(k)}}})}
  function rulesItem(){return {group:'规则说明',label:'查看本页规则说明',run:function(){mobileDialog('规则说明','<ul>'+RULES.map(function(r){return '<li>'+esc(r)+'</li>'}).join('')+'</ul>',null,'知道了')}}}

  function installTeacher(){
    var screen=document.getElementById('sc-list');if(!screen)return;
    var oldCare=document.getElementById('sc-care-menu');if(oldCare)oldCare.remove();
    Array.from(document.querySelectorAll('#sc-home .gmenu button')).forEach(function(b){if(b.textContent.trim()==='关爱')b.remove()});
    var back=screen.querySelector('.sub-hd .back');if(back){back.disabled=false;back.removeAttribute('title');back.setAttribute('aria-label','返回首页');back.onclick=function(){window.go('sc-home')}}
    var tabs=screen.querySelector('.fc-tabs'),tab=document.createElement('button');tab.className='fc-tab';tab.dataset.fctab='care';tab.type='button';tab.textContent='关爱记录';tab.onclick=function(){window.fcTab('care')};
    tab.style.cssText='flex:1;padding:13px 0;text-align:center;font-size:14px;font-weight:500;color:var(--ink-3);border:0;border-bottom:2px solid transparent;background:none;cursor:pointer';tabs.appendChild(tab);
    var panel=document.createElement('div');panel.id='fc-panel-care';panel.className='c3m';panel.style.display='none';screen.appendChild(panel);buildTeacherList(panel);
    var head=screen.querySelector('.sub-hd');head.style.position='relative';
    var listHelp=helpDot(function(){return {cats:[{name:'场景',items:identityItems().concat([rulesItem(),{group:'列表交互',label:'首批加载20条，下滑每次再加载20条'},{label:'搜索学生姓名：输入即模糊匹配并回显候选'}])},{name:'异常',items:msgItems(['暂无符合条件的关爱记录','当前账号已无新增关爱记录权限，请联系管理员。','暂无权限','记录已变化，请刷新后重试'])}]}});
    listHelp.style.display='none';head.appendChild(listHelp);
    createTeacherScreens();
    var originalTab=window.fcTab;
    window.fcTab=function(name){
      if(name!=='care'){panel.style.display='none';listHelp.style.display='none';listHelp.close();return originalTab.apply(this,arguments)}
      window.fcCurTab='care';
      screen.querySelectorAll('.fc-tab').forEach(function(t){var on=t.dataset.fctab==='care';t.classList.toggle('on',on);t.style.color=on?'var(--navy)':'var(--ink-3)';t.style.borderBottom=on?'2px solid var(--navy)':'2px solid transparent';t.style.fontWeight=on?'600':'500'});
      ['fc-panel-warning','fc-panel-visit'].forEach(function(id){var p=document.getElementById(id);if(p)p.style.display='none'});
      panel.style.display='flex';listHelp.style.display='';renderTeacherList();
    };
    var originalGo=window.go;
    window.go=function(id){var r=originalGo.apply(this,arguments);if(id==='sc-list'&&window.CARE_V3_RETURN_TO_CARE){window.CARE_V3_RETURN_TO_CARE=false;window.fcTab('care')}return r};
    var wantCare=window.CARE_V3_FORCE_OPEN||location.hash==='#care-v3';
    function openCare(){window.go('sc-list');window.fcTab('care')}
    if(wantCare){openCare();var later=function(){setTimeout(openCare,60)};if(document.readyState==='complete')later();else window.addEventListener('load',later)}
  }
  function buildTeacherList(panel){
    panel.innerHTML='<div class="c3m-shell"><div class="c3m-fixed"><div class="c3m-search-wrap"><input class="c3m-search" type="search" placeholder="搜索学生姓名" aria-label="搜索学生姓名" autocomplete="off"><div class="c3m-suggest" hidden></div></div><div class="c3m-count"></div></div><div class="c3m-scroll"><div class="c3m-list"></div></div><div class="c3m-bottom"><button type="button" data-new>新增关爱记录</button></div></div>';
    var input=panel.querySelector('.c3m-search'),sug=panel.querySelector('.c3m-suggest'),scroller=panel.querySelector('.c3m-scroll');
    function suggest(){
      var q=input.value.trim();if(!q||document.activeElement!==input){sug.hidden=true;return}
      var seen={},list=records.filter(function(r){return visibleTeacher(r)&&yearOf(r.careDate)===currentSchoolYear()&&r.student.name.indexOf(q)>=0}).filter(function(r){var k=r.studentId;if(seen[k])return false;seen[k]=1;return true}).slice(0,8);
      if(!list.length){sug.hidden=true;return}
      sug.innerHTML=list.map(function(r){return '<button type="button" data-name="'+esc(r.student.name)+'"><span>'+esc(r.student.name)+'</span><small>'+esc(r.student.grade+' · '+r.student.className)+'</small></button>'}).join('');sug.hidden=false;
      sug.querySelectorAll('[data-name]').forEach(function(b){b.onmousedown=function(e){e.preventDefault();input.value=b.dataset.name;T.search=b.dataset.name;T.loaded=20;T.scroll=0;sug.hidden=true;renderTeacherList();input.blur()}});
    }
    input.oninput=function(){T.search=input.value.trim();T.loaded=20;T.scroll=0;scroller.scrollTop=0;renderTeacherList();suggest()};
    input.onfocus=suggest;input.onblur=function(){setTimeout(function(){sug.hidden=true},120)};
    panel.querySelector('[data-new]').onclick=function(){if(!account.write){toast('当前账号已无新增关爱记录权限，请联系管理员。');return}openTeacherForm()};
    scroller.onscroll=function(){T.scroll=scroller.scrollTop;var total=teacherQuery().length;if(scroller.scrollTop+scroller.clientHeight>=scroller.scrollHeight-24&&T.loaded<total){T.loaded+=20;renderTeacherList(true)}};
  }
  function caseCard(r){return '<article class="c3m-case">'+studentHeadM(r.student)+kvm('关爱来源',ordered(r.sources,SOURCES).join('、'))+kvm('关爱类型',ordered(r.types,TYPES).join('、'))+kvm('关爱原因',r.reason)+kvm('关爱时间',r.careDate)+kvm('关爱结果',r.result)+'<div class="c3m-actions"><button type="button" data-detail="'+esc(r.id)+'">详情</button></div></article>'}
  function renderTeacherList(keepScroll){
    var panel=document.getElementById('fc-panel-care');if(!panel)return;
    var list=teacherQuery(),shown=list.slice(0,T.loaded),scroller=panel.querySelector('.c3m-scroll'),input=panel.querySelector('.c3m-search');
    if(input.value.trim()!==T.search)input.value=T.search;
    panel.querySelector('.c3m-count').textContent='本学年共 '+list.length+' 条关爱记录';
    panel.querySelector('.c3m-list').innerHTML=(shown.length?shown.map(caseCard).join(''):'<div class="c3m-empty">暂无符合条件的关爱记录</div>')+(shown.length<list.length?'<div class="c3m-lazy">向下滑动加载更多，每次20条</div>':(list.length>20?'<div class="c3m-lazy">已全部加载</div>':''));
    panel.querySelectorAll('[data-detail]').forEach(function(b){b.onclick=function(){openTeacherDetail(b.dataset.detail)}});
    var add=panel.querySelector('[data-new]');add.disabled=!account.write;
    if(!keepScroll)scroller.scrollTop=T.scroll;
  }
  var formScreen,detailScreen,formHelp,detailHelp;
  function makeScreen(id,title,withBottom){
    var s=document.createElement('div'),bar=document.querySelector('#sc-list .statusbar')||document.querySelector('.statusbar');
    s.className='screen c3m-screen c3m';s.id=id;if(bar)s.appendChild(bar.cloneNode(true));
    s.insertAdjacentHTML('beforeend','<div class="sub-hd"><button type="button" class="back" aria-label="返回">‹</button><b>'+esc(title)+'</b>'+capsule()+'</div><div class="body"><div class="c3m-pad"></div></div>'+(withBottom?'<div class="c3m-bottom"><button type="button" data-save>确定</button></div>':''));
    phone().appendChild(s);return s;
  }
  function createTeacherScreens(){
    formScreen=makeScreen('sc-care3-form','新增关爱记录',true);detailScreen=makeScreen('sc-care3-detail','关爱记录详情',false);
    formScreen.querySelector('.back').onclick=function(){closeSheets();mobileDialog('放弃填写','<p>当前内容尚未保存，确认离开？</p>',function(){backToCare()})};
    detailScreen.querySelector('.back').onclick=function(){closeSheets();backToCare()};
    formHelp=helpDot(function(){return {cats:[{name:'场景',items:[rulesItem(),{group:'示例学生（提交时服务端复核）',label:'李小红：提交时年级班级已变化',sub:'首次提交被拦截并刷新为最新年级班级，确认后再次提交'},{label:'陈小强：提交时已非在读',sub:'提交被拦截，需重新选择学生'},{group:'默认规则',label:'选择学生后执行人员默认为其班主任'},{label:'关爱时间默认今天，整月日历可切换上/下月，范围暂不限制'}]},{name:'异常',items:msgItems([{group:'学生复核',label:'该学生当前不是在读状态，不能新增关爱记录，请重新选择学生。'},'该学生的年级或班级已发生变化，已更新为“八年级（2025级）·3班”，请确认后重新提交。','该学生已不在您的数据范围内，请重新选择学生。','学生信息已更新，请重新选择学生。',{group:'权限与版本',label:'当前账号已无新增关爱记录权限，请联系管理员。'},'暂无权限','记录已更新，请重新打开编辑',{group:'字段校验',label:'请选择年级'},'请选择班级','请选择学生姓名','请选择关爱来源','请选择关爱类型','请填写关爱原因','关爱原因最多100字','请选择有效关爱时间','请选择执行人员','请选择关爱方式','请填写关爱结果','关爱结果最多100字',{group:'证明材料',label:'最多上传9张图片'},'仅支持JPEG、JPG、PNG格式图片','每张图片不能超过10M','图片读取失败，请重新选择'])}]}});
    formScreen.querySelector('.sub-hd').appendChild(formHelp);
    detailHelp=helpDot(function(){return {cats:[{name:'场景',items:identityItems().concat([rulesItem(),{group:'操作入口',label:'仅本人创建且有写入、操作权限时显示“...”'}])},{name:'异常',items:msgItems(['记录已变化，请刷新后重试','暂无权限','记录已更新，请重新打开','图片加载失败，请重新打开'])}]}});
    detailScreen.querySelector('.sub-hd').appendChild(detailHelp);
    formScreen.querySelector('[data-save]').onclick=saveTeacher;
  }
  function showScreen(id){closeSheets();window.go(id)}
  function backToCare(){T.editing=null;T.draft=null;window.CARE_V3_RETURN_TO_CARE=true;window.go('sc-list')}
  function closeSheets(){document.querySelectorAll('.c3m-overlay,.c3m-dialog,.c3-viewer').forEach(function(x){x.remove()});openHelps.forEach(function(f){f()})}
  function mobileDialog(title,bodyHtml,onOk,okText){
    var m=document.createElement('div');m.className='c3m-dialog';
    m.innerHTML='<div class="c3m-dialog-box" role="dialog" aria-modal="true"><h3>'+esc(title)+'</h3>'+bodyHtml+'<div class="c3m-dialog-actions">'+(onOk?'<button type="button" data-close>取消</button><button type="button" class="confirm" data-ok>确定</button>':'<button type="button" class="confirm" data-close>'+esc(okText||'知道了')+'</button>')+'</div></div>';
    m.querySelector('[data-close]').onclick=function(){m.remove()};if(onOk)m.querySelector('[data-ok]').onclick=function(){m.remove();onOk()};
    phone().appendChild(m);return m;
  }
  function sheet(inner){var o=document.createElement('div');o.className='c3m-overlay';o.innerHTML='<div class="c3m-sheet" role="dialog" aria-modal="true">'+inner+'</div>';o.onclick=function(e){if(e.target===o)o.remove()};phone().appendChild(o);return o}
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){var o=document.querySelector('.c3m-overlay,.c3-viewer');if(o)o.remove();var w=document.querySelector('.c3w-cal');if(w)w.remove()}});
  /* 底部选择器：单选 / 多选，取消不改值，确定才回填 */
  function openPicker(opt){
    var chosen=(opt.selected||[]).slice(),hasOpts=opt.options.length>0;
    var o=sheet('<div class="c3m-sheet-title"><b>选择'+esc(opt.field)+'</b>'+(opt.multiple?'<small>可多选</small>':'')+'</div><div class="c3m-options">'+(hasOpts?opt.options.map(function(x){return '<label><input type="'+(opt.multiple?'checkbox':'radio')+'" name="c3m-pick" value="'+esc(x.value)+'" '+(chosen.indexOf(x.value)>=0?'checked':'')+'><span>'+esc(x.label)+'</span></label>'}).join(''):'<div class="c3m-none">暂无可选'+esc(opt.field)+'</div>')+'</div><div class="c3m-sheet-err"></div><div class="c3m-sheet-actions"><button type="button" class="c3m-cancel" data-cancel>取消</button><button type="button" class="c3m-confirm" data-ok '+(hasOpts?'':'disabled')+'>确定</button></div>');
    o.querySelector('[data-cancel]').onclick=function(){o.remove()};
    o.querySelector('[data-ok]').onclick=function(){var vals=Array.from(o.querySelectorAll('input:checked')).map(function(i){return i.value});if(!vals.length){o.querySelector('.c3m-sheet-err').textContent='请选择'+opt.field;return}o.remove();opt.onConfirm(opt.multiple?opt.options.map(function(x){return x.value}).filter(function(v){return vals.indexOf(v)>=0}):vals[0])};
  }
  function openCalendar(value,done){
    var selected=validDate(value)?value:today(),y=Number(selected.slice(0,4)),mth=Number(selected.slice(5,7));
    var o=sheet('<div class="c3m-sheet-title"><b>选择关爱时间</b><small>范围暂不限制</small></div><div class="c3m-cal-nav"><button type="button" data-month="-1" aria-label="上个月">‹</button><b data-label></b><button type="button" data-month="1" aria-label="下个月">›</button></div><div class="c3m-cal-grid" data-grid></div><div class="c3m-sheet-err"></div><div class="c3m-sheet-actions"><button type="button" class="c3m-cancel" data-cancel>取消</button><button type="button" class="c3m-confirm" data-ok>确定</button></div>');
    function draw(){
      var first=new Date(Date.UTC(y,mth-1,1)).getUTCDay(),days=new Date(Date.UTC(y,mth,0)).getUTCDate(),html=['日','一','二','三','四','五','六'].map(function(w){return '<span>'+w+'</span>'}).join('');
      for(var i=0;i<first;i++)html+='<span></span>';
      for(var d=1;d<=days;d++){var date=y+'-'+pad2(mth)+'-'+pad2(d);html+='<button type="button" class="'+(date===selected?'on ':'')+(date===today()?'today':'')+'" data-date="'+date+'">'+d+'</button>'}
      o.querySelector('[data-label]').textContent=y+'年'+pad2(mth)+'月';o.querySelector('[data-grid]').innerHTML=html;
      o.querySelectorAll('[data-date]').forEach(function(b){b.onclick=function(){selected=b.dataset.date;o.querySelector('.c3m-sheet-err').textContent='';draw()}});
    }
    o.querySelectorAll('[data-month]').forEach(function(b){b.onclick=function(){mth+=Number(b.dataset.month);if(mth<1){mth=12;y--}if(mth>12){mth=1;y++}draw()}});
    o.querySelector('[data-cancel]').onclick=function(){o.remove()};
    o.querySelector('[data-ok]').onclick=function(){if(!validDate(selected)){o.querySelector('.c3m-sheet-err').textContent='请选择有效关爱时间';return}o.remove();done(selected)};
    draw();
  }
  function viewImage(src,name,host){
    var v=document.createElement('div');v.className='c3-viewer';v.innerHTML='<img alt="'+esc(name||'证明材料')+'" src="'+esc(src)+'"><button type="button">关闭</button>';
    v.querySelector('img').onerror=function(){this.replaceWith(Object.assign(document.createElement('span'),{className:'c3-img-fail',textContent:'图片加载失败',title:'图片加载失败，请重新打开'}))};
    v.querySelector('button').onclick=function(){v.remove()};(host||document.body).appendChild(v);
  }
  function bindImgFail(root){root.querySelectorAll('img[data-proof]').forEach(function(img){img.onerror=function(){var s=document.createElement('span');s.className='c3-img-fail';s.textContent='图片加载失败';s.title='图片加载失败，请重新打开';img.replaceWith(s)}})}

  function openTeacherDetail(id){
    var r=records.find(function(x){return x.id===id&&visibleTeacher(x)});if(!r){toast('记录已变化，请刷新后重试');return}
    T.detailId=id;var pad=detailScreen.querySelector('.c3m-pad');
    pad.innerHTML='<div class="c3m-card">'+studentHeadM(r.student,true)+'</div><article class="c3m-card"><div class="c3m-record-top"><b>关爱内容</b>'+(canEdit(r)?'<button type="button" class="c3m-more" data-more aria-label="关爱记录操作">...</button>':'')+'</div>'+kvm('关爱来源',ordered(r.sources,SOURCES).join('、'))+kvm('关爱类型',ordered(r.types,TYPES).join('、'))+kvm('关爱原因',r.reason)+kvm('关爱时间',r.careDate)+kvm('执行人员',ordered(r.people,TEACHERS).join('、'))+kvm('关爱方式',r.method)+kvm('关爱结果',r.result)+kvm('证明材料',(r.proofs||[]).length?'<span class="c3m-detail-photos">'+r.proofs.map(function(p,i){return '<img data-proof="'+i+'" alt="证明材料'+(i+1)+'" src="'+esc(p.src||'')+'">'}).join('')+'</span>':'--',true)+kvm('创建人',r.createdName)+kvm('创建时间',r.createdAt.slice(0,16))+'</article>';
    bindImgFail(pad);pad.querySelectorAll('img[data-proof]').forEach(function(img){img.onclick=function(){viewImage(img.src,img.alt,phone())}});
    var more=pad.querySelector('[data-more]');if(more)more.onclick=function(){recordActions(r)};
    showScreen('sc-care3-detail');
  }
  function recordActions(r){
    var o=sheet('<div class="c3m-action-sheet" aria-label="关爱记录操作"><button type="button" data-action="edit">编辑</button><button type="button" data-action="delete">删除</button><button type="button" data-action="cancel">取消</button></div>');
    o.querySelector('[data-action=cancel]').onclick=function(){o.remove()};
    o.querySelector('[data-action=edit]').onclick=function(){o.remove();openTeacherForm(r.id)};
    o.querySelector('[data-action=delete]').onclick=function(){o.remove();confirmDelete(r)};
  }
  function confirmDelete(r){
    var version=r.version;
    mobileDialog('删除关爱记录','<p>确认删除该关爱记录吗？删除后不可恢复！</p>',function(){
      var current=records.find(function(x){return x.id===r.id});
      if(!current){toast('记录已变化，请刷新后重试');backToCare();return}
      if(!canEdit(current)){toast('暂无权限');return}
      if(current.version!==version){toast('记录已更新，请重新打开');return}
      audit.push({action:'删除',operator:account.name,operatorId:account.id,operatedAt:now(),before:clone(current),after:null});
      records.splice(records.indexOf(current),1);backToCare();toast('删除成功');
    });
  }
  function freshDraft(){return {grade:'',className:'',studentId:'',sources:[],types:[],reason:'',careDate:today(),people:[],method:'',result:'',proofs:[],statusChecked:false,enrollmentChecked:false}}
  function openTeacherForm(id){
    var r=id?records.find(function(x){return x.id===id}):null;
    if(id&&!canEdit(r)){toast('暂无权限');return}
    if(!id&&!account.write){toast('当前账号已无新增关爱记录权限，请联系管理员。');return}
    T.editing=r?{id:r.id,version:r.version}:null;
    T.draft=r?{grade:r.student.grade,className:r.student.className,studentId:r.studentId,sources:r.sources.slice(),types:r.types.slice(),reason:r.reason,careDate:r.careDate,people:r.people.slice(),method:r.method,result:r.result,proofs:clone(r.proofs||[]),statusChecked:true,enrollmentChecked:true}:freshDraft();
    T.reading=false;formScreen.querySelector('.sub-hd b').textContent=r?'编辑关爱记录':'新增关爱记录';
    renderTeacherForm();showScreen('sc-care3-form');
  }
  function trigger(name,value,placeholder,disabled){return '<button type="button" class="c3m-trigger'+(value?'':' placeholder')+'" data-pick="'+name+'" '+(disabled?'disabled':'')+' title="'+esc(value||placeholder)+'"><span>'+esc(value||placeholder)+'</span></button>'}
  function row(label,name,inner){return '<div class="c3m-field" data-field="'+name+'"><label>'+esc(label)+'<span class="c3m-req">*</span></label>'+inner+'</div><div class="c3m-err" data-error="'+name+'"></div>'}
  function area(label,name,placeholder,value){return '<div class="c3m-field stack" data-field="'+name+'"><div class="c3m-field-head"><span>'+esc(label)+'<span class="c3m-req">*</span></span><span class="c3m-counter" data-count="'+name+'">'+Array.from(value||'').length+'/100</span></div><textarea name="'+name+'" maxlength="100" placeholder="'+esc(placeholder)+'">'+esc(value)+'</textarea><div class="c3m-err" data-error="'+name+'"></div></div>'}
  function renderTeacherForm(){
    var d=T.draft,scope=scopeStudents(),st=findStudent(d.studentId);
    var gradeList=Array.from(new Set(scope.map(function(s){return s.grade}).concat(d.grade?[d.grade]:[])));
    var pad=formScreen.querySelector('.c3m-pad');
    pad.innerHTML='<div class="c3m-title">学生信息</div><section class="c3m-card">'+
      row('年级','grade',trigger('grade',d.grade,'请选择年级'))+
      row('班级','className',trigger('className',d.className,'请选择班级',!d.grade))+
      row('学生姓名','studentId',trigger('studentId',st?st.name:'','请选择学生姓名',!d.className))+
      '</section><div class="c3m-title">关爱内容</div><section class="c3m-card">'+
      row('关爱来源','sources',trigger('sources',ordered(d.sources,SOURCES).join('、'),'请选择关爱来源'))+
      row('关爱类型','types',trigger('types',ordered(d.types,TYPES).join('、'),'请选择关爱类型'))+
      area('关爱原因','reason','请填写学生的真实情况',d.reason)+
      row('关爱时间','careDate',trigger('careDate',d.careDate,'请选择关爱时间'))+
      row('执行人员','people',trigger('people',ordered(d.people,TEACHERS).join('、'),'请选择执行人员',!d.studentId))+
      row('关爱方式','method',trigger('method',d.method,'请选择关爱方式'))+
      area('关爱结果','result','请填写关爱过程和结果',d.result)+
      '<div class="c3m-field stack" data-field="proofs"><div class="c3m-field-head"><span>证明材料</span><span class="c3m-counter">'+d.proofs.length+'/9</span></div><input type="file" accept="image/jpeg,image/jpg,image/png" multiple hidden><div class="c3m-photos" data-photos></div><small>支持JPEG、JPG、PNG格式图片，最多九张，每张不超过10M</small><div class="c3m-reading" data-reading hidden>图片读取中…</div><div class="c3m-err" data-error="proofs"></div></div>'+
      '</section><div class="c3m-err" data-error="save" style="text-align:center"></div>';
    bindTeacherForm(pad);renderPhotos(pad);syncSave();
  }
  function syncSave(){var b=formScreen.querySelector('[data-save]');b.disabled=T.reading;b.textContent=T.reading?'图片读取中…':'确定'}
  function bindTeacherForm(pad){
    var d=T.draft,scope=scopeStudents();
    pad.querySelectorAll('[data-pick]').forEach(function(b){b.onclick=function(){
      var k=b.dataset.pick;clearErr(k);
      if(k==='grade')openPicker({field:'年级',options:Array.from(new Set(scope.map(function(s){return s.grade}))).map(function(g){return {value:g,label:g}}),selected:[d.grade],onConfirm:function(v){if(v!==d.grade){d.grade=v;d.className='';d.studentId='';d.people=[]}renderTeacherForm()}});
      if(k==='className')openPicker({field:'班级',options:Array.from(new Set(scope.filter(function(s){return s.grade===d.grade}).map(function(s){return s.className}))).map(function(c){return {value:c,label:c}}),selected:[d.className],onConfirm:function(v){if(v!==d.className){d.className=v;d.studentId='';d.people=[]}renderTeacherForm()}});
      if(k==='studentId')openPicker({field:'学生姓名',options:scope.filter(function(s){return s.grade===d.grade&&s.className===d.className}).map(function(s){return {value:s.id,label:s.name}}),selected:[d.studentId],onConfirm:function(v){if(v!==d.studentId){var s=findStudent(v);d.studentId=v;d.people=s?[s.teacher]:[];d.statusChecked=false;d.enrollmentChecked=false}renderTeacherForm()}});
      if(k==='sources')openPicker({field:'关爱来源',multiple:true,options:SOURCES.map(function(x){return {value:x,label:x}}),selected:d.sources,onConfirm:function(v){d.sources=v;renderTeacherForm()}});
      if(k==='types')openPicker({field:'关爱类型',multiple:true,options:TYPES.map(function(x){return {value:x,label:x}}),selected:d.types,onConfirm:function(v){d.types=v;renderTeacherForm()}});
      if(k==='people')openPicker({field:'执行人员',multiple:true,options:Array.from(new Set(TEACHERS.concat(d.people))).map(function(x){return {value:x,label:x}}),selected:d.people,onConfirm:function(v){d.people=v;renderTeacherForm()}});
      if(k==='method')openPicker({field:'关爱方式',options:METHODS.map(function(x){return {value:x,label:x}}),selected:[d.method],onConfirm:function(v){d.method=v;renderTeacherForm()}});
      if(k==='careDate')openCalendar(d.careDate,function(v){d.careDate=v;renderTeacherForm()});
    }});
    pad.querySelectorAll('textarea').forEach(function(t){t.oninput=function(){d[t.name]=t.value;pad.querySelector('[data-count='+t.name+']').textContent=Array.from(t.value).length+'/100';clearErr(t.name)}});
    var file=pad.querySelector('input[type=file]');
    file.onchange=function(){
      var files=Array.from(file.files||[]);file.value='';clearErr('proofs');if(!files.length)return;
      if(d.proofs.length+files.length>9)return showErr('proofs','最多上传9张图片');
      if(files.some(function(f){return ['image/jpeg','image/jpg','image/png'].indexOf(f.type)<0}))return showErr('proofs','仅支持JPEG、JPG、PNG格式图片');
      if(files.some(function(f){return f.size>10*1024*1024}))return showErr('proofs','每张图片不能超过10M');
      T.reading=true;syncSave();pad.querySelector('[data-reading]').hidden=false;
      Promise.all(files.map(function(f){return new Promise(function(res,rej){var fr=new FileReader();fr.onload=function(){res({name:f.name,size:f.size,type:f.type,src:String(fr.result)})};fr.onerror=rej;fr.readAsDataURL(f)})}))
        .then(function(list){d.proofs=d.proofs.concat(list).slice(0,9);renderPhotos(pad)})
        .catch(function(){showErr('proofs','图片读取失败，请重新选择')})
        .then(function(){T.reading=false;syncSave();var rd=pad.querySelector('[data-reading]');if(rd)rd.hidden=true});
    };
  }
  function renderPhotos(pad){
    var d=T.draft,grid=pad.querySelector('[data-photos]');
    grid.innerHTML=(d.proofs.length<9?'<button type="button" class="c3m-upload" data-upload aria-label="上传图片">＋</button>':'')+d.proofs.map(function(p,i){return '<div class="c3m-thumb"><img data-proof="'+i+'" src="'+esc(p.src||'')+'" alt="'+esc(p.name||('证明材料'+(i+1)))+'"><button type="button" data-remove="'+i+'" aria-label="移除图片">×</button></div>'}).join('');
    var up=grid.querySelector('[data-upload]');if(up)up.onclick=function(){pad.querySelector('input[type=file]').click()};
    grid.querySelectorAll('[data-remove]').forEach(function(b){b.onclick=function(){d.proofs.splice(Number(b.dataset.remove),1);renderPhotos(pad)}});
    bindImgFail(grid);grid.querySelectorAll('img[data-proof]').forEach(function(img){img.onclick=function(){viewImage(img.src,img.alt,phone())}});
    var c=pad.querySelector('[data-field=proofs] .c3m-counter');if(c)c.textContent=d.proofs.length+'/9';
  }
  function clearErr(k){var e=formScreen.querySelector('[data-error='+k+']');if(e)e.textContent='';var f=formScreen.querySelector('[data-field='+k+']');if(f)f.classList.remove('has-err')}
  function showErr(key,msg){
    var e=formScreen.querySelector('[data-error='+key+']')||formScreen.querySelector('[data-error=save]');e.textContent=msg;
    var f=formScreen.querySelector('[data-field='+key+']');if(f){f.classList.add('has-err');f.scrollIntoView({block:'center'})}else e.scrollIntoView({block:'center'});
  }
  function saveTeacher(){
    var d=T.draft;if(!d||T.reading)return;
    formScreen.querySelectorAll('.c3m-err').forEach(function(e){e.textContent=''});formScreen.querySelectorAll('.has-err').forEach(function(f){f.classList.remove('has-err')});
    var current=T.editing&&records.find(function(r){return r.id===T.editing.id});
    if(T.editing&&!current){toast('记录已变化，请刷新后重试');return}
    if(current&&!canEdit(current)){toast('暂无权限');return}
    if(!current&&!account.write){showErr('save','当前账号已无新增关爱记录权限，请联系管理员。');toast('当前账号已无新增关爱记录权限，请联系管理员。');return}
    if(!d.grade)return showErr('grade','请选择年级');
    if(!d.className)return showErr('className','请选择班级');
    var st=findStudent(d.studentId);
    if(!d.studentId)return showErr('studentId','请选择学生姓名');
    if(!st)return showErr('studentId','学生信息已更新，请重新选择学生。');
    /* 服务端复核：在读状态 → 年级班级 → 数据范围 */
    if(st.simulateStatusChange&&!d.statusChecked){d.statusChecked=true;return showErr('studentId','该学生当前不是在读状态，不能新增关爱记录，请重新选择学生。')}
    if(st.simulateEnrollmentChange&&!d.enrollmentChecked){d.enrollmentChecked=true;st.grade=st.serverGrade;st.className=st.serverClass;d.grade=st.grade;d.className=st.className;renderTeacherForm();return showErr('studentId','该学生的年级或班级已发生变化，已更新为“'+st.grade+'·'+st.className+'”，请确认后重新提交。')}
    if(!inPath(st.org,ROOT)||(account.view!=='all'&&st.teacher!==account.name))return showErr('studentId','该学生已不在您的数据范围内，请重新选择学生。');
    if(!d.sources.length)return showErr('sources','请选择关爱来源');
    if(!d.types.length)return showErr('types','请选择关爱类型');
    if(!d.reason.trim())return showErr('reason','请填写关爱原因');
    if(Array.from(d.reason.trim()).length>100)return showErr('reason','关爱原因最多100字');
    if(!validDate(d.careDate))return showErr('careDate','请选择有效关爱时间');
    if(!d.people.length)return showErr('people','请选择执行人员');
    if(!d.method)return showErr('method','请选择关爱方式');
    if(!d.result.trim())return showErr('result','请填写关爱结果');
    if(Array.from(d.result.trim()).length>100)return showErr('result','关爱结果最多100字');
    if(current&&current.version!==T.editing.version){toast('记录已更新，请重新打开编辑');return showErr('save','记录已更新，请重新打开编辑')}
    var btn=formScreen.querySelector('[data-save]');btn.disabled=true;
    var value={studentId:st.id,student:{id:st.id,name:st.name,grade:st.grade,className:st.className,org:st.org.slice()},sources:ordered(d.sources,SOURCES),types:ordered(d.types,TYPES),reason:d.reason.trim(),careDate:d.careDate,people:ordered(d.people,TEACHERS),method:d.method,result:d.result.trim(),proofs:clone(d.proofs||[])};
    var saved;
    if(current){saved=Object.assign({},current,value,{updatedAt:now(),updatedBy:account.name,version:current.version+1});audit.push({action:'编辑',operator:account.name,operatorId:account.id,operatedAt:saved.updatedAt,before:clone(current),after:clone(saved)});records.splice(records.indexOf(current),1,saved)}
    else{saved=Object.assign(value,{id:'r-'+String(++seq).padStart(5,'0'),createdBy:account.id,createdName:account.name,createdAt:now(),updatedAt:null,updatedBy:null,version:1});records.push(saved)}
    T.draft=null;T.editing=null;btn.disabled=false;openTeacherDetail(saved.id);toast('保存成功');
  }

  /* ======================================================================
   * 学校端 / 四级监管端（Web）
   * ==================================================================== */
  function defaults(start,end){return {year:'',grade:'',className:'',name:'',source:'',start:start==null?today():start,end:end==null?today():end}}
  var W={org:ROOT.slice(),page:1,filter:defaults(),stack:[],scrollLeft:0},section,menu;
  function children(path){if(path.length===0)return Object.keys(TREE);if(path.length===1)return Object.keys(TREE[path[0]]||{});if(path.length===2)return Object.keys((TREE[path[0]]||{})[path[1]]||{});if(path.length===3)return (((TREE[path[0]]||{})[path[1]]||{})[path[2]]||[]);return []}
  function atList(){return isSchool||W.org.length===4}
  function scopeRecords(){return records.filter(function(r){return inPath(r.student.org,W.org)})}
  function webRecords(){var f=W.filter;return sorted(scopeRecords().filter(function(r){return (!f.year||yearOf(r.careDate)===f.year)&&(!f.grade||r.student.grade===f.grade)&&(!f.className||r.student.className===f.className)&&(!f.name||r.student.name.indexOf(f.name.trim())>=0)&&(!f.source||r.sources.indexOf(f.source)>=0)&&(!f.start||r.createdAt.slice(0,10)>=f.start)&&(!f.end||r.createdAt.slice(0,10)<=f.end)}))}
  function opts(values,selected,all){return '<option value="">'+esc(all)+'</option>'+values.map(function(v){return '<option value="'+esc(v)+'" '+(v===selected?'selected':'')+'>'+esc(v)+'</option>'}).join('')}

  function installWeb(){
    section=document.getElementById('section-care-menu-v1');
    if(!section){section=document.createElement('section');section.id='section-care-menu-v1';document.body.appendChild(section)}
    section.setAttribute('data-page','care-menu-v1');section.className='c3w-section hidden';
    var careLink=document.querySelector('#menu-care-v1');if(careLink){var span=careLink.querySelector('span:last-child')||careLink;span.textContent='关爱管理'}
    window[isSchool?'schoolCareOpen':'cityCareOpen']=function(){menuGo('care')};
    hideAside();buildMenu();
    var sp=window.switchPage;
    if(typeof sp==='function')window.switchPage=function(key){if(section)section.classList.add('hidden');var r=sp.apply(this,arguments);setActive(key);return r};
    document.addEventListener('keydown',function(e){if(e.key==='Escape'){var m=document.querySelector('.c3w-mask');if(m){m.remove();return}if(menu)closeMenu()}});
    var wantCare=window.CARE_V3_FORCE_OPEN||['#care-v3','#school-care','#city-care'].indexOf(location.hash)>=0;
    function start(){setTimeout(function(){if(wantCare)menuGo('care');else{var vis=Array.from(document.querySelectorAll('[id^="section-"]')).find(function(s){return !s.classList.contains('hidden')&&s!==section});setActive(vis?keyOfSection(vis.id):'')}},30)}
    if(document.readyState==='complete')start();else window.addEventListener('load',start);
  }
  /* 右上角功能菜单点：读取原侧栏菜单，关爱管理排在数据看板前 */
  var menuEls={};
  function keyOf(a){var on=a.getAttribute('onclick')||'',m=on.match(/switchPage\('([^']+)'\)/);if(m)return keyOfSection('section-'+m[1]);var label=(a.textContent||'').trim();if(/关爱/.test(label))return 'care';if(/劝返/.test(label))return 'visit';if(/预警配置/.test(label))return 'config';if(/预警/.test(label))return 'warning';if(/看板/.test(label))return 'dashboard';return a.dataset.domId||label}
  function keyOfSection(id){id=id.replace('section-','');if(/^visit/.test(id))return 'visit';if(/^warning/.test(id))return 'warning';return id}
  function hideAside(){var a=document.querySelector('aside');if(!a)return;a.style.setProperty('display','none','important');var c=a.nextElementSibling;while(c&&c.tagName==='SCRIPT')c=c.nextElementSibling;if(c){c.style.setProperty('margin-left','0','important');c.style.setProperty('width','100%','important')}}
  /* 右上角功能菜单点：读取原侧栏菜单（兼容 onclick 与源文件事件绑定），关爱管理排在数据看板前 */
  function buildMenu(){
    var items=[],dash=null,seen={};
    Array.from(document.querySelectorAll('aside a')).forEach(function(a){
      var key=keyOf(a),label=(a.textContent||'').trim().replace(/\s+/g,' ').split(' ')[0];
      if(!label||seen[key])return;seen[key]=1;if(key==='care')return;
      menuEls[key]=a;var it={key:key,label:label};if(key==='dashboard')dash=it;else items.push(it);
    });
    items.push({key:'care',label:'关爱管理'});
    menu=document.createElement('div');menu.className='c3n-menu';menu.id='care3-float-menu';
    menu.innerHTML='<button type="button" class="c3n-btn" aria-label="功能菜单" title="功能菜单" aria-expanded="false"></button><div class="c3n-panel"><div class="c3n-title">控辍保学</div>'+items.map(function(it){return '<button type="button" class="c3n-item" data-key="'+esc(it.key)+'"><i></i>'+esc(it.label)+'</button>'}).join('')+(dash?'<div class="c3n-sep"></div><button type="button" class="c3n-item" data-key="dashboard"><i></i>'+esc(dash.label)+'</button>':'')+'</div>';
    document.body.appendChild(menu);
    var btn=menu.querySelector('.c3n-btn'),panel=menu.querySelector('.c3n-panel');
    btn.onclick=function(e){e.stopPropagation();panel.classList.toggle('on');btn.setAttribute('aria-expanded',String(panel.classList.contains('on')))};
    menu.querySelectorAll('[data-key]').forEach(function(b){b.onclick=function(e){e.stopPropagation();menuGo(b.dataset.key)}});
    document.addEventListener('click',function(e){if(!menu.contains(e.target))closeMenu()});
  }
  function closeMenu(){menu.querySelector('.c3n-panel').classList.remove('on');menu.querySelector('.c3n-btn').setAttribute('aria-expanded','false')}
  function setActive(key){if(!menu)return;key=menuEls[key]||key==='care'?key:keyOfSection('section-'+key);menu.querySelectorAll('[data-key]').forEach(function(b){b.classList.toggle('active',b.dataset.key===key)})}
  function menuGo(key){
    closeMenu();
    if(key==='care'){openWebCare();setActive('care');history.replaceState(null,'','#care-v3');return}
    section.classList.add('hidden');document.querySelectorAll('.c3w-mask').forEach(function(m){m.remove()});
    var el=menuEls[key];if(el)el.click();else if(typeof window.switchPage==='function')window.switchPage(key);setActive(key);history.replaceState(null,'','#'+key);
  }
  function openWebCare(){
    document.querySelectorAll('[id^="section-"]').forEach(function(s){if(s!==section)s.classList.add('hidden')});
    section.classList.remove('hidden');W.org=ROOT.slice();W.page=1;W.filter=defaults();W.stack=[];W.scrollLeft=0;renderWeb();
  }
  function webHelp(kind){
    return helpDot(function(){
      var scen=[{group:'规则说明',label:'查看本页规则说明',run:webRules}];
      if(kind!=='detail')scen=scen.concat([{group:'查询示例',label:'查看全部创建日期的记录',sub:'清空创建日期起止后查询',run:function(){W.filter.start='';W.filter.end='';W.page=1;renderWeb();toast('已清空创建日期，展示全部记录')}},{label:'恢复默认：今天创建的记录',run:function(){W.filter.start=today();W.filter.end=today();W.page=1;renderWeb()}}]);
      if(kind==='summary')scen.push({group:'统计口径',label:'关爱学生数按学生ID去重；关爱次数按独立记录计数'});
      var errs=kind==='detail'?['记录已变化，请刷新后重试','图片加载失败，请重新打开']:['请输入正确的日期，格式为YYYY-MM-DD','开始日期不能晚于结束日期，请检查日期范围'].concat(kind==='list'?['暂无符合条件的关爱记录','记录已变化，请刷新后重试']:['暂无权限']);
      return {cats:[{name:'场景',items:scen},{name:'异常',items:msgItems(errs)}]};
    });
  }
  function webRules(){openModal('规则说明','<div class="c3w-card"><ul style="margin:0;padding-left:18px;line-height:1.9">'+WEB_RULES.map(function(r){return '<li>'+esc(r)+'</li>'}).join('')+'</ul></div>',false)}
  function dateField(name,value){return '<span class="c3w-date"><input name="'+name+'" value="'+esc(value)+'" placeholder="YYYY-MM-DD" autocomplete="off" aria-label="'+(name==='start'?'创建开始日期':'创建结束日期')+'"><button type="button" data-cal="'+name+'" aria-label="选择日期">'+CAL_ICON+'</button></span>'}
  function renderWeb(){
    var list=atList(),orgName=W.org.length?W.org[W.org.length-1]:'',drilled=W.org.length>ROOT.length,prevScroll=section.querySelector('.c3w-table-wrap');
    if(prevScroll)W.scrollLeft=prevScroll.scrollLeft;
    var title=isSchool?'':(drilled?'关爱记录汇总-'+orgName:'关爱记录汇总'+(W.org.length&&!list?'-'+orgName:''));
    section.innerHTML='<div class="c3w" id="care3-web-root"><div class="c3w-panel">'+
      (isSchool?'':'<div class="c3w-head">'+(drilled?'<button type="button" class="c3w-back" data-back>← 返回</button>':'')+'<h2>'+esc(title)+'</h2><span data-help-slot></span></div>')+
      (list?listHtml():summaryHtml())+'</div></div>';
    var slot=section.querySelector('[data-help-slot]'),help=webHelp(list?'list':'summary');if(slot)slot.replaceWith(help);else section.querySelector('.c3w-actions').prepend(help);
    var back=section.querySelector('[data-back]');if(back)back.onclick=function(){var prev=W.stack.pop();if(!prev)return;W.org=prev.org;W.filter=prev.filter;W.page=prev.page;W.scrollLeft=prev.scrollLeft;renderWeb()};
    bindWeb();
    var wrap=section.querySelector('.c3w-table-wrap');if(wrap)wrap.scrollLeft=W.scrollLeft||0;
  }
  function summaryHtml(){
    var f=W.filter,names=children(W.org),rs=webRecords(),label=['省份名称','地市名称','区县名称','学校名称'][W.org.length];
    function stat(list){return '<td>'+new Set(list.map(function(r){return r.studentId})).size+'</td><td>'+list.length+'</td>'}
    return '<form class="c3w-toolbar" data-form><div class="c3w-filters"><div class="c3w-filter"><label>创建日期</label><div class="c3w-range">'+dateField('start',f.start)+'<span>—</span>'+dateField('end',f.end)+'</div></div><div class="c3w-err" data-err></div></div><div class="c3w-actions"><button class="c3w-btn query" type="submit">查询</button><button class="c3w-btn reset" type="button" data-reset>重置</button></div></form>'+
      '<div class="c3w-table-wrap" tabindex="0"><table class="c3w-table c3w-sum"><colgroup><col style="width:40%"><col style="width:30%"><col style="width:30%"></colgroup><thead><tr><th>'+label+'</th><th>关爱学生数</th><th>关爱次数</th></tr></thead><tbody>'+
      (names.length?names.map(function(n){return '<tr><td><button type="button" class="c3w-name-link" data-drill="'+esc(n)+'">'+esc(n)+'</button></td>'+stat(rs.filter(function(r){return r.student.org[W.org.length]===n}))+'</tr>'}).join(''):'')+
      '<tr class="c3w-total"><td>合计</td>'+stat(rs)+'</tr></tbody></table></div>';
  }
  function listHtml(){
    var f=W.filter,base=scopeRecords(),list=webRecords(),total=Math.max(1,Math.ceil(list.length/10));if(W.page>total)W.page=total;if(W.page<1)W.page=1;
    var rows=list.slice((W.page-1)*10,W.page*10);
    var years=Array.from(new Set(base.map(function(r){return yearOf(r.careDate)}))).sort().reverse(),grades=Array.from(new Set(base.map(function(r){return r.student.grade}))),classes=Array.from(new Set(base.map(function(r){return r.student.className}))).sort();
    return '<form class="c3w-toolbar" data-form><div class="c3w-filters">'+
      '<div class="c3w-filter"><label>学年</label><select name="year">'+opts(years,f.year,'全部学年')+'</select></div>'+
      '<div class="c3w-filter"><label>年级</label><select name="grade">'+opts(grades,f.grade,'全部年级')+'</select></div>'+
      '<div class="c3w-filter"><label>班级</label><select name="className">'+opts(classes,f.className,'全部班级')+'</select></div>'+
      '<div class="c3w-filter"><label>学生姓名</label><span style="position:relative"><input class="c3w-name" name="name" placeholder="请输入学生姓名" value="'+esc(f.name)+'" autocomplete="off"><div class="c3w-suggest" hidden></div></span></div>'+
      '<div class="c3w-filter"><label>关爱来源</label><select name="source">'+opts(SOURCES,f.source,'全部')+'</select></div>'+
      '<div class="c3w-filter"><label>创建日期</label><div class="c3w-range">'+dateField('start',f.start)+'<span>—</span>'+dateField('end',f.end)+'</div></div>'+
      '<div class="c3w-err" data-err></div></div><div class="c3w-actions"><button class="c3w-btn query" type="submit">查询</button><button class="c3w-btn reset" type="button" data-reset>重置</button></div></form>'+
      '<div class="c3w-count">共 '+list.length+' 条关爱记录</div>'+
      '<div class="c3w-table-wrap" tabindex="0" aria-label="关爱记录列表，可左右滑动"><table class="c3w-table c3w-list"><colgroup><col style="width:100px"><col style="width:150px"><col style="width:80px"><col style="width:150px"><col style="width:150px"><col style="width:150px"><col style="width:220px"><col style="width:110px"><col style="width:250px"><col style="width:100px"></colgroup><thead><tr><th>学生姓名</th><th>年级</th><th>班级</th><th>创建日期</th><th>关爱来源</th><th>关爱类型</th><th>关爱原因</th><th>关爱时间</th><th>关爱结果</th><th class="c3w-op">操作</th></tr></thead><tbody>'+
      (rows.length?rows.map(function(r){var src=ordered(r.sources,SOURCES).join('、'),tp=ordered(r.types,TYPES).join('、');return '<tr><td>'+esc(r.student.name||'--')+'</td><td>'+esc(r.student.grade||'--')+'</td><td>'+esc(r.student.className||'--')+'</td><td>'+esc(r.createdAt.slice(0,16))+'</td><td title="'+esc(src)+'">'+esc(short(src))+'</td><td title="'+esc(tp)+'">'+esc(short(tp))+'</td><td class="left" title="'+esc(r.reason)+'">'+esc(r.reason||'--')+'</td><td>'+esc(r.careDate||'--')+'</td><td class="left" title="'+esc(r.result)+'">'+esc(r.result||'--')+'</td><td class="c3w-op"><button type="button" class="c3w-link" data-web-detail="'+esc(r.id)+'">详情</button></td></tr>'}).join(''):'<tr><td colspan="9" class="c3w-empty">暂无符合条件的关爱记录</td><td class="c3w-op c3w-empty"></td></tr>')+
      '</tbody></table></div><div class="c3w-pager"><span>共 '+list.length+' 条，每页10条</span><span><button type="button" data-prev '+(W.page<=1?'disabled':'')+'>上一页</button>'+W.page+' / '+total+'<button type="button" data-next '+(W.page>=total?'disabled':'')+'>下一页</button></span></div>';
  }
  function bindWeb(){
    var form=section.querySelector('[data-form]'),err=form.querySelector('[data-err]');
    form.onsubmit=function(e){
      e.preventDefault();var next=Object.assign({},W.filter,Object.fromEntries(new FormData(form)));next.start=(next.start||'').trim();next.end=(next.end||'').trim();if(next.name!=null)next.name=next.name.trim();
      if((next.start&&!validDate(next.start))||(next.end&&!validDate(next.end))){err.textContent='请输入正确的日期，格式为YYYY-MM-DD';return}
      if(next.start&&next.end&&next.start>next.end){err.textContent='开始日期不能晚于结束日期，请检查日期范围';return}
      W.filter=next;W.page=1;W.scrollLeft=0;renderWeb();
    };
    form.querySelector('[data-reset]').onclick=function(){W.filter=defaults();W.page=1;W.scrollLeft=0;renderWeb()};
    form.querySelectorAll('[data-cal]').forEach(function(b){b.onclick=function(e){e.stopPropagation();webCalendar(form.querySelector('[name='+b.dataset.cal+']'))}});
    var name=form.querySelector('[name=name]');
    if(name){var sug=name.parentElement.querySelector('.c3w-suggest');
      var show=function(){var q=name.value.trim();if(!q){sug.hidden=true;return}var seen={},hits=scopeRecords().filter(function(r){if(r.student.name.indexOf(q)<0||seen[r.studentId])return false;seen[r.studentId]=1;return true}).slice(0,8);if(!hits.length){sug.hidden=true;return}sug.innerHTML=hits.map(function(r){return '<button type="button" data-n="'+esc(r.student.name)+'">'+esc(r.student.name)+'<small>'+esc(r.student.grade+' · '+r.student.className)+'</small></button>'}).join('');sug.hidden=false;sug.querySelectorAll('[data-n]').forEach(function(b){b.onmousedown=function(e){e.preventDefault();name.value=b.dataset.n;sug.hidden=true}})};
      name.oninput=show;name.onfocus=show;name.onblur=function(){setTimeout(function(){sug.hidden=true},120)};}
    section.querySelectorAll('[data-drill]').forEach(function(b){b.onclick=function(){var wrap=section.querySelector('.c3w-table-wrap');W.stack.push({org:W.org.slice(),filter:clone(W.filter),page:W.page,scrollLeft:wrap?wrap.scrollLeft:0});W.org=W.org.concat([b.dataset.drill]);W.filter=defaults(W.filter.start,W.filter.end);W.page=1;W.scrollLeft=0;renderWeb()}});
    var prev=section.querySelector('[data-prev]'),next=section.querySelector('[data-next]');
    if(prev)prev.onclick=function(){W.page--;renderWeb()};if(next)next.onclick=function(){W.page++;renderWeb()};
    section.querySelectorAll('[data-web-detail]').forEach(function(b){b.onclick=function(){openWebDetail(b.dataset.webDetail)}});
  }
  function webCalendar(input){
    document.querySelectorAll('.c3w-cal').forEach(function(x){x.remove()});
    var v=validDate(input.value)?input.value:today(),y=Number(v.slice(0,4)),m=Number(v.slice(5,7)),cal=document.createElement('div');cal.className='c3w-cal';
    function draw(){var first=new Date(Date.UTC(y,m-1,1)).getUTCDay(),days=new Date(Date.UTC(y,m,0)).getUTCDate(),h=['日','一','二','三','四','五','六'].map(function(w){return '<span>'+w+'</span>'}).join('');for(var i=0;i<first;i++)h+='<span></span>';for(var d=1;d<=days;d++){var ds=y+'-'+pad2(m)+'-'+pad2(d);h+='<button type="button" data-d="'+ds+'" class="'+(ds===input.value?'on':'')+'">'+d+'</button>'}
      cal.innerHTML='<div class="c3w-cal-nav"><button type="button" data-m="-1" aria-label="上个月">‹</button><span>'+y+'年'+pad2(m)+'月</span><button type="button" data-m="1" aria-label="下个月">›</button></div><div class="c3w-cal-grid">'+h+'</div><div class="c3w-cal-foot"><button type="button" data-today>今天</button><button type="button" data-clear>清空</button></div>';
      cal.querySelectorAll('[data-m]').forEach(function(b){b.onclick=function(e){e.stopPropagation();m+=Number(b.dataset.m);if(m<1){m=12;y--}if(m>12){m=1;y++}draw()}});
      cal.querySelectorAll('[data-d]').forEach(function(b){b.onclick=function(e){e.stopPropagation();input.value=b.dataset.d;cal.remove()}});
      cal.querySelector('[data-today]').onclick=function(e){e.stopPropagation();input.value=today();cal.remove()};
      cal.querySelector('[data-clear]').onclick=function(e){e.stopPropagation();input.value='';cal.remove()};}
    draw();cal.onclick=function(e){e.stopPropagation()};input.parentElement.appendChild(cal);
    setTimeout(function(){document.addEventListener('click',function h(){cal.remove();document.removeEventListener('click',h)})},0);
  }
  function openModal(title,body,withHelp){
    document.querySelectorAll('.c3w-mask').forEach(function(x){x.remove()});
    var m=document.createElement('div');m.className='c3w-mask';
    m.innerHTML='<div class="c3w-modal" role="dialog" aria-modal="true" aria-label="'+esc(title)+'"><div class="c3w-modal-head"><h3>'+esc(title)+'</h3><span data-help-slot></span><button type="button" class="c3w-close" data-close aria-label="关闭">×</button></div><div class="c3w-modal-body">'+body+'</div><div class="c3w-modal-foot"><button type="button" data-close>关闭</button></div></div>';
    var slot=m.querySelector('[data-help-slot]');if(withHelp)slot.replaceWith(webHelp('detail'));else slot.remove();
    m.querySelectorAll('[data-close]').forEach(function(b){b.onclick=function(){m.remove()}});document.body.appendChild(m);return m;
  }
  function wrow(k,v,raw){return '<div class="c3w-row"><span class="label">'+esc(k)+'</span><span class="value">'+(raw?v:esc(v==null||v===''?'--':v))+'</span></div>'}
  function openWebDetail(id){
    var r=records.find(function(x){return x.id===id&&inPath(x.student.org,W.org)});if(!r){toast('记录已变化，请刷新后重试');renderWeb();return}
    var m=openModal('关爱记录详情','<div class="c3w-sec">学生信息</div><div class="c3w-card">'+wrow('学生姓名',r.student.name)+wrow('学校',r.student.org[3])+wrow('年级',r.student.grade)+wrow('班级',r.student.className)+'</div><div class="c3w-sec">关爱内容</div><div class="c3w-card">'+wrow('关爱来源',ordered(r.sources,SOURCES).join('、'))+wrow('关爱类型',ordered(r.types,TYPES).join('、'))+wrow('关爱原因',r.reason)+wrow('关爱时间',r.careDate)+wrow('执行人员',ordered(r.people,TEACHERS).join('、'))+wrow('关爱方式',r.method)+wrow('关爱结果',r.result)+wrow('证明材料',(r.proofs||[]).length?'<div class="c3w-proofs">'+r.proofs.map(function(p,i){return '<img data-proof="'+i+'" alt="证明材料'+(i+1)+'" src="'+esc(p.src||'')+'">'}).join('')+'</div>':'--',true)+wrow('创建人',r.createdName)+wrow('创建时间',r.createdAt.slice(0,16))+'</div>',true);
    bindImgFail(m);m.querySelectorAll('img[data-proof]').forEach(function(img){img.onclick=function(){viewImage(img.src,img.alt,document.body)}});
  }

  window.CARE_V3_DEBUG={records:records,audit:audit,students:students,setAccount:function(k){account=ACCOUNTS[k]||ACCOUNTS.wang;renderTeacherList()},state:function(){return isTeacher?T:W}};
  if(isTeacher)installTeacher();else installWeb();
})();
