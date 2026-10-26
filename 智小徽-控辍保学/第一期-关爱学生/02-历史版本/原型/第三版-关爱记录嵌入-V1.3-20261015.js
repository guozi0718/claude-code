/* 第一期第三版 V1.3：关爱记录嵌入控辍保学源文件（老师端 / 学校端 / 区县、地市、省级、部级监管端）。
 * 1. 参数式路由：?page={端前缀}-{页面}，无参数或未知参数时页面空白，不做固定首页跳转；通过右上角红点菜单进入各页面。
 * 2. 页面右上角两个同尺寸小点：绿点＝当前页面的场景 / 异常演示（只在关爱页面出现），红点＝功能菜单（不含数据看板）。
 * 3. 绿点里的异常均为可执行演示：学生状态、年级班级、数据范围、权限、记录版本、网络等变化在点击后立即模拟并展示真实提示。
 * 每条关爱记录独立保存，不形成可追加个案。 */
(function(){
  'use strict';
  var role=window.CARE_V3_EMBED_ROLE||'teacher';
  var isTeacher=role==='teacher',isSchool=role==='school';
  var PREFIX={teacher:'teacher',school:'school',county:'district',city:'city',province:'province',ministry:'ministry'}[role]||role;
  var TYPES=['家庭经济困难学生','农村留守儿童','进城务工随迁子女','单亲 / 监护缺失学生','随班就读残疾学生','心理行为偏差 / 情绪困扰学生','心理危机学生','慢性疾病需特殊照料学生','学业困难学生','升学考试焦虑学生','遭遇校园欺凌霸凌学生','家庭突发变故学生'];
  var METHODS=['学业帮扶与个性化辅导','心理健康屋减压','个体心理咨询与团体辅导','心理危机干预与转介就医','国家学生资助（两免一补 / 营养改善 / 助学金）','特殊困难学生临时救助','寄宿与日常起居照料','上下学与假期安全管护','常态化家访与家校沟通','家长教育与监护能力指导','校园欺凌防治帮扶','公共安全与专题安全教育','帮扶责任人 / 爱心结对制度','专业社工与多部门协同关爱','精神疾病诊疗与复学支持'];
  var SOURCES=['辍学预警','心理测评','班主任发现','任课教师反映','学生主动反映','家长反映','困难学生','欺凌事件','其他'];
  var TEACHERS=['王老师','李老师','赵老师','陈老师'];
  var TREE={北京市:{省属:{市直:['北京市直属学校']},北京市:{海淀区:['海淀区实验小学','海淀区第二中学'],朝阳区:['朝阳区实验小学','朝阳区第二中学']}},河北省:{保定市:{莲池区:['莲池区实验小学','莲池区第二中学'],竞秀区:['竞秀区实验小学']},邯郸市:{丛台区:['丛台区实验小学'],邯山区:['邯山区第二中学']}},陕西省:{宝鸡市:{凤翔区:['凤翔区第一实验小学','凤翔区第二中学'],渭滨区:['渭滨区实验小学','渭滨区第一初级中学'],金台区:['金台区实验小学']},西安市:{雁塔区:['雁塔区实验小学'],碑林区:['碑林区第二中学']}}};
  var ROOTS={teacher:['陕西省','宝鸡市','凤翔区','凤翔区第一实验小学'],school:['陕西省','宝鸡市','凤翔区','凤翔区第一实验小学'],ministry:[],province:['陕西省'],city:['陕西省','宝鸡市'],county:['陕西省','宝鸡市','凤翔区']};
  var ROOT=ROOTS[role]||ROOTS.school,MAIN_SCHOOL='凤翔区第一实验小学',OTHER_SCHOOL='凤翔区第二中学';
  var audit=[],records=[],students=[],seq=0;
  var MSG={net:'网络异常，请稍后重试',changed:'记录已变化，请刷新后重试',noAuth:'暂无权限',noWrite:'当前账号已无新增关爱记录权限，请联系管理员。',updatedEdit:'记录已更新，请重新打开编辑',updatedList:'记录已更新，请刷新后重试',empty:'暂无符合条件的关爱记录',img:'图片加载失败',imgTip:'图片加载失败，请重新打开',lazyFail:'加载失败，点击重试',dateFmt:'请输入正确的日期，格式为YYYY-MM-DD',dateRange:'开始日期不能晚于结束日期，请检查日期范围'};
  var ACCOUNT_BASE={
    wang:{key:'wang',id:'teacher-wang',name:'王老师',desc:'全校查看｜可新增｜可编辑、删除本人记录',view:'all',write:true,operate:true},
    li:{key:'li',id:'teacher-li',name:'李老师',desc:'仅查看本班学生｜可新增｜可编辑、删除本人记录',view:'class',write:true,operate:true},
    zhao:{key:'zhao',id:'teacher-zhao',name:'赵老师',desc:'全校查看｜可新增｜无记录操作权限（本人记录也不显示“...”）',view:'all',write:true,operate:false},
    chen:{key:'chen',id:'teacher-chen',name:'陈老师',desc:'全校查看｜无新增权限（按钮置灰）｜无操作权限',view:'all',write:false,operate:false},
    zhou:{key:'zhou',id:'teacher-zhou',name:'周老师',desc:'无学生数据范围｜列表为空，新增时无可选年级',view:'none',write:true,operate:true}
  };
  var account=clone(ACCOUNT_BASE.wang);
  var FAULT={};/* 演示用：下一次请求的服务端/网络变化 */
  window.CARE_V3_AUDIT=audit;window.CARE_V3_RECORDS=records;
  var DEMO_PROOFS=['#dbeafe','#dcfce7'].map(function(c,i){return {name:'证明材料'+(i+1)+'.png',src:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><rect width="240" height="240" fill="'+c+'"/><text x="120" y="128" font-size="22" text-anchor="middle" fill="#36506f" font-family="Microsoft YaHei,sans-serif">示例材料'+(i+1)+'</text></svg>')}});
  var BROKEN_IMG='data:image/png;base64,broken';
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
  function len(v){return Array.from(v||'').length}
  function phone(){return document.querySelector('.phone')}
  function takeFault(k){if(FAULT[k]){delete FAULT[k];return true}return false}
  function toast(message){
    if(isTeacher&&typeof window.toast==='function'&&document.getElementById('toast')){window.toast(message);return}
    var host=isTeacher&&phone()?phone():document.body,old=host.querySelector(':scope>.c3-toast');if(old)old.remove();
    var x=document.createElement('div');x.className='c3-toast';x.textContent=message;host.appendChild(x);setTimeout(function(){x.remove()},2600);
  }
  function hint(message){var h=document.querySelector('.c3x-hint');if(h)h.remove();h=document.createElement('div');h.className='c3x-hint';h.textContent=message;document.body.appendChild(h);setTimeout(function(){h.remove()},4200)}

  /* ---------- 参数式路由 ---------- */
  function param(k){return new URLSearchParams(location.search).get(k)}
  function pageKey(){var p=param('page')||'';return p.indexOf(PREFIX+'-')===0?p.slice(PREFIX.length+1):''}
  function setUrl(key,extra,push){
    var u=new URL(location.href),q=new URLSearchParams();if(key)q.set('page',PREFIX+'-'+key);
    Object.keys(extra||{}).forEach(function(k){if(extra[k]!=null&&extra[k]!=='')q.set(k,extra[k])});
    var next=u.pathname+(q.toString()?'?'+q.toString():'');
    if(next!==location.pathname+location.search||location.hash)history[push?'pushState':'replaceState'](null,'',next);
  }

  /* ---------- 右上角：绿点（场景/异常）＋ 红点（功能菜单） ---------- */
  var bar,helpBtn,helpPop,menuBtn,menuPop,helpCat=0,menuItems=[],activeKey='';
  function buildBar(items){
    menuItems=items;bar=document.createElement('div');bar.className='c3x-bar';bar.id='care3-toolbar';
    bar.innerHTML='<span class="c3x-slot"><button type="button" class="c3x-dot c3x-help" aria-label="查看本页场景与异常" title="查看本页场景与异常" aria-expanded="false" hidden></button><div class="c3h-pop c3x-pop" hidden></div></span><span class="c3x-slot"><button type="button" class="c3x-dot c3x-menu" aria-label="功能菜单" title="功能菜单" aria-expanded="false"></button><div class="c3n-panel c3x-pop"></div></span>';
    document.body.appendChild(bar);
    helpBtn=bar.querySelector('.c3x-help');helpPop=bar.querySelector('.c3h-pop');menuBtn=bar.querySelector('.c3x-menu');menuPop=bar.querySelector('.c3n-panel');
    drawMenu();
    helpBtn.onclick=function(e){e.stopPropagation();var open=helpPop.hidden;closeMenu();if(open){helpCat=0;drawHelp();helpPop.hidden=false;helpBtn.setAttribute('aria-expanded','true')}else closeHelp()};
    menuBtn.onclick=function(e){e.stopPropagation();var open=!menuPop.classList.contains('on');closeHelp();menuPop.classList.toggle('on',open);menuBtn.setAttribute('aria-expanded',String(open))};
    helpPop.onclick=menuPop.onclick=function(e){e.stopPropagation()};
    document.addEventListener('click',function(){closeHelp();closeMenu()});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'){closeHelp();closeMenu()}});
  }
  function drawMenu(){
    menuPop.innerHTML='<div class="c3n-title">'+(isTeacher?'控辍保学（老师端）':'控辍保学')+'</div>'+menuItems.map(function(it){return '<button type="button" class="c3n-item'+(it.key===activeKey?' active':'')+'" data-key="'+esc(it.key)+'"><i></i>'+esc(it.label)+'</button>'}).join('');
    menuPop.querySelectorAll('[data-key]').forEach(function(b){b.onclick=function(){closeMenu();setUrl(b.dataset.key,null,true);route()}});
  }
  function route(){(isTeacher?routeTeacher:routeWeb)()}
  function setActive(key){activeKey=key;if(menuPop)drawMenu()}
  function closeMenu(){if(!menuPop)return;menuPop.classList.remove('on');menuBtn.setAttribute('aria-expanded','false')}
  function closeHelp(){if(!helpPop)return;helpPop.hidden=true;helpBtn.setAttribute('aria-expanded','false')}
  function refreshHelp(){if(!helpBtn)return;var cfg=helpContext();helpBtn.hidden=!cfg;if(!cfg)closeHelp();else if(!helpPop.hidden)drawHelp()}
  function drawHelp(){
    var cfg=helpContext();if(!cfg){closeHelp();return}
    var cats=cfg.cats.filter(function(c){return c.items.length});if(helpCat>=cats.length)helpCat=0;
    helpPop.innerHTML='<div class="c3h-title">'+esc(cfg.title)+'</div><div class="c3h-cats">'+cats.map(function(c,i){return '<button type="button" data-cat="'+i+'" class="'+(i===helpCat?'on':'')+'">'+esc(c.name)+'</button>'}).join('')+'</div><div class="c3h-items">'+cats[helpCat].items.map(function(it,i){return (it.group?'<div class="c3h-group">'+esc(it.group)+'</div>':'')+'<button type="button" data-item="'+i+'" class="'+(it.on?'on':'')+'">'+esc(it.label)+(it.sub?'<small>'+esc(it.sub)+'</small>':'')+'</button>'}).join('')+'</div>';
    helpPop.querySelectorAll('[data-cat]').forEach(function(b){b.onclick=function(){helpCat=Number(b.dataset.cat);drawHelp()}});
    helpPop.querySelectorAll('[data-item]').forEach(function(b){b.onclick=function(){var it=cats[helpCat].items[Number(b.dataset.item)];if(!it.keep)closeHelp();(it.run||function(){toast(it.label)})();if(it.keep)drawHelp();refreshHelp()}});
  }
  function helpContext(){return isTeacher?teacherHelp():webHelp()}

  /* ---------- 演示数据 ---------- */
  function seed(){
    Object.keys(TREE).forEach(function(p){Object.keys(TREE[p]).forEach(function(c){Object.keys(TREE[p][c]).forEach(function(d){TREE[p][c][d].forEach(function(school){
      var base=[
        {name:'张小明',grade:'七年级（2025级）',className:'2班',teacher:'王老师'},
        {name:'李小红',grade:'七年级（2025级）',className:'1班',teacher:'李老师'},
        {name:'王小华',grade:'八年级（2024级）',className:'2班',teacher:'王老师'},
        {name:'陈小强',grade:'八年级（2024级）',className:'1班',teacher:'李老师'}
      ];
      var extra=school===MAIN_SCHOOL?[
        {name:'刘小雨',grade:'七年级（2025级）',className:'1班',teacher:'李老师'},
        {name:'赵小军',grade:'七年级（2025级）',className:'2班',teacher:'王老师'},
        {name:'孙小美',grade:'八年级（2024级）',className:'1班',teacher:'李老师'},
        {name:'周小宇',grade:'八年级（2024级）',className:'2班',teacher:'王老师'},
        {name:'吴小帆',grade:'七年级（2025级）',className:'1班',teacher:'李老师'},
        {name:'郑小雪',grade:'八年级（2024级）',className:'2班',teacher:'王老师'}
      ]:[];
      var local=base.concat(extra).map(function(s,i){s.id='s-'+students.length+'-'+i;s.org=[p,c,d,school];s.status='在读';students.push(s);return s}).slice(0,4);
      var count=school===MAIN_SCHOOL?46:8;
      for(var i=0;i<count;i++){
        var st=local[i%local.length],day=pad2(28-(i%12)),created=(i<4?today():'2026-09-'+pad2(25-(i%5)))+' '+pad2(18-(i%8))+':'+pad2(10+(i%45))+':'+pad2(i%60);
        var by=i%5===4?['teacher-zhao','赵老师']:(i%2?['teacher-li','李老师']:['teacher-wang','王老师']);
        records.push({id:'r-'+String(++seq).padStart(5,'0'),studentId:st.id,student:{id:st.id,name:st.name,grade:st.grade,className:st.className,org:st.org.slice()},sources:[SOURCES[i%SOURCES.length]],types:[TYPES[i%TYPES.length]],reason:'结合学生近期学习、出勤与家庭情况，记录本次需要关爱的真实情况。',careDate:'2026-10-'+day,people:[st.teacher],method:METHODS[i%METHODS.length],result:'已与学生沟通并落实本次关爱措施，记录实际情况供后续了解。',proofs:(school===MAIN_SCHOOL&&i===0)?clone(DEMO_PROOFS):[],createdBy:by[0],createdName:by[1],createdAt:created,updatedAt:null,updatedBy:null,version:1});
      }
    })})})})
  }
  seed();
  function sorted(list){return list.slice().sort(function(a,b){return b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id)})}
  function findStudent(id){return students.find(function(s){return s.id===id})}
  function findRecord(id){return records.find(function(r){return r.id===id})}
  function visibleTeacher(r){if(account.view==='none')return false;var s=findStudent(r.studentId);return inPath(r.student.org,ROOT)&&(account.view==='all'||(s&&s.teacher===account.name))}
  function canEdit(r){return !!r&&account.write&&account.operate&&r.createdBy===account.id&&visibleTeacher(r)}
  function studentInScope(s){return !!s&&account.view!=='none'&&inPath(s.org,ROOT)&&(account.view==='all'||s.teacher===account.name)}
  var RULES=['关爱记录位于控辍保学页面，与预警记录、劝返记录并列；预警、劝返内容中不含关爱。','每条记录独立保存，不形成可追加的关爱个案。','只展示本学年（按关爱时间，9月1日至次年8月31日）关爱记录，首批20条，下滑每次再加载20条。','查看范围受学生数据权限控制；本人创建且同时有新增（写入）和记录操作权限的记录，才在记录卡学生信息右侧显示“...”。','创建时间由服务端写入且永不因编辑改变，列表按创建时间倒序（同秒按记录ID倒序）。','提交时服务端重新校验账号权限、学生在读状态、年级班级、数据范围和记录版本。','每次新增、编辑、删除均由后端保存操作人、操作时间及前后快照。'];
  var WEB_RULES=['本页只读：不提供新增、编辑、删除或处理按钮，操作列唯一按钮为“详情”。','一条记录对应一次关爱；同一学生可有多行，不合并为个案，不显示关联信息或关爱次数。','列表按服务端首次创建时间倒序，显示到分钟；编辑不改变创建时间。','创建日期默认今天，含起止当天；学年按关爱时间归属。查询/重置回第1页，每页10条。','监管汇总按组织名称逐层下钻：关爱学生数按学生ID去重，关爱次数按独立记录计数，不按执行人数计次。','下钻继承上级创建日期；返回恢复上一层原条件与页码。地址参数只用于定位页面，不能扩大授权范围。'];
  function rulesDialog(list){if(isTeacher)mobileDialog('规则说明','<ul>'+list.map(function(r){return '<li>'+esc(r)+'</li>'}).join('')+'</ul>',null,'知道了');else openModal('规则说明','<div class="c3w-card"><ul style="margin:0;padding-left:18px;line-height:1.9">'+list.map(function(r){return '<li>'+esc(r)+'</li>'}).join('')+'</ul></div>')}

  /* ======================================================================
   * 老师端（手机）
   * ==================================================================== */
  var T={loaded:20,search:'',scroll:0,editing:null,draft:null,reading:false,saving:false,detailId:null,lazyFail:false};
  var formScreen,detailScreen,origGo,origTab,ready=false;
  function teacherQuery(){return sorted(records.filter(function(r){return visibleTeacher(r)&&yearOf(r.careDate)===currentSchoolYear()&&(!T.search||r.student.name.indexOf(T.search)>=0)}))}
  function scopeStudents(){return students.filter(function(s){return studentInScope(s)&&s.status==='在读'})}
  function kvm(k,v,raw){return '<div class="c3m-kv"><span class="k">'+esc(k)+'</span><span class="v">'+(raw?v:esc(v==null||v===''?'--':v))+'</span></div>'}
  function studentHeadM(s,only,extra){return '<div class="c3m-student'+(only?' only':'')+'"><span class="c3m-avatar">'+esc(s.name.slice(0,1))+'</span><span style="flex:1;min-width:0"><b>'+esc(s.name)+'</b><div class="c3m-sub">'+esc(s.grade+' · '+s.className)+'</div></span>'+(extra||'')+'</div>'}
  function capsule(){return '<span class="capsule" style="margin-left:auto"><span class="half"><span class="cap-dots"><i></i><i></i><i></i></span></span><span class="half"><span class="cap-ring"></span></span></span>'}
  function curId(){var s=document.querySelector('.phone .screen.show');return s?s.id:''}
  function setAccount(key){account=clone(ACCOUNT_BASE[key]||ACCOUNT_BASE.wang);FAULT={};T.loaded=20;T.scroll=0;T.lazyFail=false;closeSheets();if(curId()!=='sc-list'||window.fcCurTab!=='care')openCareList();else renderTeacherList();toast('已切换为'+account.name+'：'+account.desc)}

  function installTeacher(){
    var screen=document.getElementById('sc-list');if(!screen)return;
    var oldCare=document.getElementById('sc-care-menu');if(oldCare)oldCare.remove();
    Array.from(document.querySelectorAll('#sc-home .gmenu button')).forEach(function(b){if(b.textContent.trim()==='关爱')b.remove()});
    var back=screen.querySelector('.sub-hd .back');if(back){back.disabled=false;back.removeAttribute('title');back.setAttribute('aria-label','返回');back.removeAttribute('onclick');back.onclick=function(e){e.preventDefault();location.href='https://olivebird.netlify.app/ssb/teacher.html'}}
    var tabs=screen.querySelector('.fc-tabs'),tab=document.createElement('button');tab.className='fc-tab';tab.dataset.fctab='care';tab.type='button';tab.textContent='关爱记录';tab.onclick=function(){window.fcTab('care')};
    tab.style.cssText='flex:1;padding:13px 0;text-align:center;font-size:14px;font-weight:500;color:var(--ink-3);border:0;border-bottom:2px solid transparent;background:none;cursor:pointer';tabs.appendChild(tab);
    var panel=document.createElement('div');panel.id='fc-panel-care';panel.className='c3m';panel.style.display='none';screen.appendChild(panel);buildTeacherList(panel);
    createTeacherScreens();
    origTab=window.fcTab;
    window.fcTab=function(name){
      if(name!=='care'){panel.style.display='none';var r=origTab.apply(this,arguments);if(ready)setUrl(name==='visit'?'visit':'warning');setActive(name==='visit'?'visit':'warning');refreshHelp();return r}
      window.fcCurTab='care';
      screen.querySelectorAll('.fc-tab').forEach(function(t){var on=t.dataset.fctab==='care';t.classList.toggle('on',on);t.style.color=on?'var(--navy)':'var(--ink-3)';t.style.borderBottom=on?'2px solid var(--navy)':'2px solid transparent';t.style.fontWeight=on?'600':'500'});
      ['fc-panel-warning','fc-panel-visit'].forEach(function(id){var p=document.getElementById(id);if(p)p.style.display='none'});
      panel.style.display='flex';renderTeacherList();if(ready)setUrl('care');setActive('care');refreshHelp();
    };
    origGo=window.go;
    window.go=function(id){var r=origGo.apply(this,arguments);if(ready&&location.hash)history.replaceState(null,'',location.pathname+location.search);refreshHelp();return r};
    buildBar([{key:'warning',label:'预警记录'},{key:'visit',label:'劝返记录'},{key:'care',label:'关爱记录'}]);
  }
  function blankTeacher(){closeSheets();document.querySelectorAll('.phone .screen').forEach(function(s){s.classList.remove('show')});setActive('');refreshHelp()}
  function openCareList(){origGo('sc-list');window.fcTab('care')}
  function routeTeacher(){
    var key=pageKey(),id=param('id');closeSheets();
    if(key==='warning'||key==='visit'){origGo('sc-list');window.fcTab(key);return}
    if(key==='care'){openCareList();return}
    if(key==='care-new'){openCareList();openTeacherForm();return}
    if(key==='care-edit'){openCareList();openTeacherForm(id);return}
    if(key==='care-detail'){openCareList();openTeacherDetail(id);return}
    blankTeacher();if(location.search||location.hash)setUrl('');
  }
  function buildTeacherList(panel){
    panel.innerHTML='<div class="c3m-shell"><div class="c3m-fixed"><div class="c3m-search-wrap"><input class="c3m-search" type="search" placeholder="搜索学生姓名" aria-label="搜索学生姓名" autocomplete="off"><div class="c3m-suggest" hidden></div></div><div class="c3m-count"></div></div><div class="c3m-scroll"><div class="c3m-list"></div></div><div class="c3m-bottom"><button type="button" data-new>新增关爱记录</button></div></div>';
    var input=panel.querySelector('.c3m-search'),sug=panel.querySelector('.c3m-suggest'),scroller=panel.querySelector('.c3m-scroll');
    function suggest(){
      var q=input.value.trim();if(!q||document.activeElement!==input){sug.hidden=true;return}
      var seen={},list=records.filter(function(r){return visibleTeacher(r)&&yearOf(r.careDate)===currentSchoolYear()&&r.student.name.indexOf(q)>=0}).filter(function(r){if(seen[r.studentId])return false;seen[r.studentId]=1;return true}).slice(0,8);
      if(!list.length){sug.hidden=true;return}
      sug.innerHTML=list.map(function(r){return '<button type="button" data-name="'+esc(r.student.name)+'"><span>'+esc(r.student.name)+'</span><small>'+esc(r.student.grade+' · '+r.student.className)+'</small></button>'}).join('');sug.hidden=false;
      sug.querySelectorAll('[data-name]').forEach(function(b){b.onmousedown=function(e){e.preventDefault();input.value=b.dataset.name;runSearch(b.dataset.name);sug.hidden=true;input.blur()}});
    }
    input.oninput=function(){runSearch(input.value.trim());suggest()};
    input.onfocus=suggest;input.onblur=function(){setTimeout(function(){sug.hidden=true},120)};
    panel.querySelector('[data-new]').onclick=function(){
      if(takeFault('net')){toast(MSG.net);return}
      if(!account.write){toast(MSG.noWrite);renderTeacherList(true);return}
      openTeacherForm();
    };
    scroller.onscroll=function(){T.scroll=scroller.scrollTop;if(scroller.scrollTop+scroller.clientHeight>=scroller.scrollHeight-24)loadMore()};
  }
  function runSearch(q){
    if(takeFault('net')){toast(MSG.net);var i=document.querySelector('#fc-panel-care .c3m-search');if(i)i.value=T.search;return}
    T.search=q;T.loaded=20;T.scroll=0;T.lazyFail=false;var sc=document.querySelector('#fc-panel-care .c3m-scroll');if(sc)sc.scrollTop=0;renderTeacherList();
  }
  function loadMore(){
    var total=teacherQuery().length;if(T.loaded>=total||T.lazyFail)return;
    if(takeFault('lazy')||takeFault('net')){T.lazyFail=true;renderTeacherList(true);return}
    T.loaded+=20;renderTeacherList(true);
  }
  function caseCard(r){
    var more=canEdit(r)?'<button type="button" class="c3m-more" data-more="'+esc(r.id)+'" data-ver="'+r.version+'" aria-label="关爱记录操作">...</button>':'';
    return '<article class="c3m-case">'+studentHeadM(r.student,false,more)+kvm('关爱来源',ordered(r.sources,SOURCES).join('、'))+kvm('关爱类型',ordered(r.types,TYPES).join('、'))+kvm('关爱原因',r.reason)+kvm('关爱时间',r.careDate)+kvm('关爱结果',r.result)+'<div class="c3m-actions"><button type="button" data-detail="'+esc(r.id)+'">详情</button></div></article>';
  }
  function renderTeacherList(keepScroll){
    var panel=document.getElementById('fc-panel-care');if(!panel)return;
    var list=teacherQuery(),shown=list.slice(0,T.loaded),scroller=panel.querySelector('.c3m-scroll'),input=panel.querySelector('.c3m-search');
    if(input.value.trim()!==T.search)input.value=T.search;
    panel.querySelector('.c3m-count').textContent='本学年共 '+list.length+' 条关爱记录';
    var foot=shown.length<list.length?(T.lazyFail?'<button type="button" class="c3m-lazy c3m-retry" data-retry>'+MSG.lazyFail+'</button>':'<div class="c3m-lazy">向下滑动加载更多，每次20条</div>'):(list.length>20?'<div class="c3m-lazy">已全部加载</div>':'');
    panel.querySelector('.c3m-list').innerHTML=(shown.length?shown.map(caseCard).join(''):'<div class="c3m-empty">'+MSG.empty+'</div>')+foot;
    panel.querySelectorAll('[data-detail]').forEach(function(b){b.onclick=function(){openTeacherDetail(b.dataset.detail)}});
    panel.querySelectorAll('[data-more]').forEach(function(b){b.onclick=function(){openRecordActions(b.dataset.more,Number(b.dataset.ver))}});
    var retry=panel.querySelector('[data-retry]');if(retry)retry.onclick=function(){T.lazyFail=false;loadMore()};
    panel.querySelector('[data-new]').disabled=!account.write;
    if(!keepScroll)scroller.scrollTop=T.scroll;
  }
  function makeScreen(id,title,withBottom){
    var s=document.createElement('div'),bar0=document.querySelector('#sc-list .statusbar')||document.querySelector('.statusbar');
    s.className='screen c3m-screen c3m';s.id=id;if(bar0)s.appendChild(bar0.cloneNode(true));
    s.insertAdjacentHTML('beforeend','<div class="sub-hd"><button type="button" class="back" aria-label="返回">‹</button><b>'+esc(title)+'</b>'+capsule()+'</div><div class="body"><div class="c3m-pad"></div></div>'+(withBottom?'<div class="c3m-bottom"><button type="button" data-save>确定</button></div>':''));
    phone().appendChild(s);return s;
  }
  function createTeacherScreens(){
    formScreen=makeScreen('sc-care3-form','新增关爱记录',true);detailScreen=makeScreen('sc-care3-detail','关爱记录详情',false);
    formScreen.querySelector('.back').onclick=leaveForm;
    detailScreen.querySelector('.back').onclick=function(){closeSheets();backToCare()};
    formScreen.querySelector('[data-save]').onclick=saveTeacher;
  }
  function leaveForm(){closeSheets();mobileDialog('放弃填写','<p>当前内容尚未保存，确认离开？</p>',function(){backToCare()})}
  function showScreen(id){closeSheets();origGo(id);refreshHelp()}
  function backToCare(){T.editing=null;T.draft=null;T.saving=false;openCareList()}
  function closeSheets(){document.querySelectorAll('.c3m-overlay,.c3m-dialog,.c3-viewer').forEach(function(x){x.remove()});closeHelp()}
  function mobileDialog(title,bodyHtml,onOk,okText){
    var m=document.createElement('div');m.className='c3m-dialog';
    m.innerHTML='<div class="c3m-dialog-box" role="dialog" aria-modal="true"><h3>'+esc(title)+'</h3>'+bodyHtml+'<div class="c3m-dialog-actions">'+(onOk?'<button type="button" data-close>取消</button><button type="button" class="confirm" data-ok>确定</button>':'<button type="button" class="confirm" data-close>'+esc(okText||'知道了')+'</button>')+'</div></div>';
    m.querySelector('[data-close]').onclick=function(){m.remove()};if(onOk)m.querySelector('[data-ok]').onclick=function(){m.remove();onOk()};
    phone().appendChild(m);return m;
  }
  function sheet(inner){var o=document.createElement('div');o.className='c3m-overlay';o.innerHTML='<div class="c3m-sheet" role="dialog" aria-modal="true">'+inner+'</div>';o.onclick=function(e){if(e.target===o)o.remove()};phone().appendChild(o);return o}
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){var o=document.querySelector('.c3m-overlay,.c3-viewer');if(o)o.remove();var w=document.querySelector('.c3w-cal');if(w)w.remove()}});
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
    v.querySelector('img').onerror=function(){this.replaceWith(Object.assign(document.createElement('span'),{className:'c3-img-fail',textContent:MSG.img,title:MSG.imgTip}))};
    v.querySelector('button').onclick=function(){v.remove()};(host||document.body).appendChild(v);
  }
  function bindImgFail(root){root.querySelectorAll('img[data-proof]').forEach(function(img){img.onerror=function(){var s=document.createElement('span');s.className='c3-img-fail';s.textContent=MSG.img;s.title=MSG.imgTip;img.replaceWith(s)}})}

  /* ----- 详情 ----- */
  function openTeacherDetail(id,brokenImages){
    var inDetail=curId()==='sc-care3-detail';
    if(takeFault('net')){toast(MSG.net);if(inDetail)backToCare();return}
    var r=records.find(function(x){return x.id===id&&visibleTeacher(x)});
    if(!r){toast(MSG.changed);if(inDetail||curId()!=='sc-list')backToCare();else renderTeacherList(true);return}
    T.detailId=id;var pad=detailScreen.querySelector('.c3m-pad');
    var proofs=(r.proofs||[]).length?'<span class="c3m-detail-photos">'+r.proofs.map(function(p,i){return '<img data-proof="'+i+'" alt="证明材料'+(i+1)+'" src="'+esc(brokenImages?BROKEN_IMG:(p.src||''))+'">'}).join('')+'</span>':'--';
    pad.innerHTML='<div class="c3m-card">'+studentHeadM(r.student,true)+'</div><article class="c3m-card"><div class="c3m-record-top"><b>关爱内容</b></div>'+kvm('关爱来源',ordered(r.sources,SOURCES).join('、'))+kvm('关爱类型',ordered(r.types,TYPES).join('、'))+kvm('关爱原因',r.reason)+kvm('关爱时间',r.careDate)+kvm('执行人员',ordered(r.people,TEACHERS).join('、'))+kvm('关爱方式',r.method)+kvm('关爱结果',r.result)+kvm('证明材料',proofs,true)+kvm('创建人',r.createdName)+kvm('创建时间',r.createdAt.slice(0,16))+'</article>';
    bindImgFail(pad);pad.querySelectorAll('img[data-proof]').forEach(function(img){img.onclick=function(){viewImage(img.src,img.alt,phone())}});
    showScreen('sc-care3-detail');setUrl('care-detail',{id:id});
  }
  /* ----- 列表“...”操作 ----- */
  function openRecordActions(id,ver){
    if(takeFault('net')){toast(MSG.net);return}
    var r=findRecord(id);
    if(!r||!visibleTeacher(r)){toast(MSG.changed);renderTeacherList(true);return}
    if(!canEdit(r)){toast(MSG.noAuth);renderTeacherList(true);return}
    var o=sheet('<div class="c3m-action-sheet" aria-label="关爱记录操作"><button type="button" data-action="edit">编辑</button><button type="button" data-action="delete">删除</button><button type="button" data-action="cancel">取消</button></div>');
    o.querySelector('[data-action=cancel]').onclick=function(){o.remove()};
    o.querySelector('[data-action=edit]').onclick=function(){o.remove();openTeacherForm(id)};
    o.querySelector('[data-action=delete]').onclick=function(){o.remove();confirmDelete(id,ver)};
  }
  function confirmDelete(id,ver){
    mobileDialog('删除关爱记录','<p>确认删除该关爱记录吗？删除后不可恢复！</p>',function(){
      if(takeFault('net')){toast(MSG.net);return}
      var current=findRecord(id);
      if(!current||!visibleTeacher(current)){toast(MSG.changed);renderTeacherList(true);return}
      if(!canEdit(current)){toast(MSG.noAuth);renderTeacherList(true);return}
      if(current.version!==ver){toast(MSG.updatedList);renderTeacherList(true);return}
      audit.push({action:'删除',operator:account.name,operatorId:account.id,operatedAt:now(),before:clone(current),after:null});
      records.splice(records.indexOf(current),1);renderTeacherList(true);toast('删除成功');
    });
  }
  /* ----- 新增 / 编辑 ----- */
  function freshDraft(){return {grade:'',className:'',studentId:'',sources:[],types:[],reason:'',careDate:today(),people:[],method:'',result:'',proofs:[]}}
  function openTeacherForm(id){
    if(takeFault('net')){toast(MSG.net);return}
    var r=id?findRecord(id):null;
    if(id&&(!r||!visibleTeacher(r))){toast(MSG.changed);backToCare();return}
    if(id&&!canEdit(r)){toast(MSG.noAuth);backToCare();return}
    if(!id&&!account.write){toast(MSG.noWrite);backToCare();return}
    T.editing=r?{id:r.id,version:r.version}:null;T.saving=false;
    T.draft=r?{grade:r.student.grade,className:r.student.className,studentId:r.studentId,sources:r.sources.slice(),types:r.types.slice(),reason:r.reason,careDate:r.careDate,people:r.people.slice(),method:r.method,result:r.result,proofs:clone(r.proofs||[])}:freshDraft();
    T.reading=false;formScreen.querySelector('.sub-hd b').textContent=r?'编辑关爱记录':'新增关爱记录';
    renderTeacherForm();showScreen('sc-care3-form');setUrl(r?'care-edit':'care-new',r?{id:r.id}:null);
  }
  function trigger(name,value,placeholder,disabled){return '<button type="button" class="c3m-trigger'+(value?'':' placeholder')+'" data-pick="'+name+'" '+(disabled?'disabled':'')+' title="'+esc(value||placeholder)+'"><span>'+esc(value||placeholder)+'</span></button>'}
  function row(label,name,inner){return '<div class="c3m-field" data-field="'+name+'"><label>'+esc(label)+'<span class="c3m-req">*</span></label>'+inner+'</div><div class="c3m-err" data-error="'+name+'"></div>'}
  function area(label,name,placeholder,value){return '<div class="c3m-field stack" data-field="'+name+'"><div class="c3m-field-head"><span>'+esc(label)+'<span class="c3m-req">*</span></span><span class="c3m-counter" data-count="'+name+'">'+len(value)+'/100</span></div><textarea name="'+name+'" maxlength="100" placeholder="'+esc(placeholder)+'">'+esc(value)+'</textarea><div class="c3m-err" data-error="'+name+'"></div></div>'}
  function draftStudentName(d){var st=findStudent(d.studentId);if(st)return st.name;var cur=T.editing&&findRecord(T.editing.id);return cur&&cur.studentId===d.studentId?cur.student.name:''}
  function renderTeacherForm(){
    var d=T.draft,pad=formScreen.querySelector('.c3m-pad');
    pad.innerHTML='<div class="c3m-title">学生信息</div><section class="c3m-card">'+
      row('年级','grade',trigger('grade',d.grade,'请选择年级'))+
      row('班级','className',trigger('className',d.className,'请选择班级',!d.grade))+
      row('学生姓名','studentId',trigger('studentId',d.studentId?draftStudentName(d):'','请选择学生姓名',!d.className))+
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
  function syncSave(){var b=formScreen.querySelector('[data-save]');b.disabled=T.reading||T.saving;b.textContent=T.saving?'提交中…':(T.reading?'图片读取中…':'确定')}
  function bindTeacherForm(pad){
    var d=T.draft;
    pad.querySelectorAll('[data-pick]').forEach(function(b){b.onclick=function(){
      var k=b.dataset.pick,scope=scopeStudents();clearErr(k);
      if(k==='grade')openPicker({field:'年级',options:Array.from(new Set(scope.map(function(s){return s.grade}))).map(function(g){return {value:g,label:g}}),selected:[d.grade],onConfirm:function(v){if(v!==d.grade){d.grade=v;d.className='';d.studentId='';d.people=[]}renderTeacherForm()}});
      if(k==='className')openPicker({field:'班级',options:Array.from(new Set(scope.filter(function(s){return s.grade===d.grade}).map(function(s){return s.className}))).sort().map(function(c){return {value:c,label:c}}),selected:[d.className],onConfirm:function(v){if(v!==d.className){d.className=v;d.studentId='';d.people=[]}renderTeacherForm()}});
      if(k==='studentId')openPicker({field:'学生姓名',options:scope.filter(function(s){return s.grade===d.grade&&s.className===d.className}).map(function(s){return {value:s.id,label:s.name}}),selected:[d.studentId],onConfirm:function(v){if(v!==d.studentId){var s=findStudent(v);d.studentId=v;d.people=s?[s.teacher]:[]}renderTeacherForm()}});
      if(k==='sources')openPicker({field:'关爱来源',multiple:true,options:SOURCES.map(function(x){return {value:x,label:x}}),selected:d.sources,onConfirm:function(v){d.sources=v;renderTeacherForm()}});
      if(k==='types')openPicker({field:'关爱类型',multiple:true,options:TYPES.map(function(x){return {value:x,label:x}}),selected:d.types,onConfirm:function(v){d.types=v;renderTeacherForm()}});
      if(k==='people')openPicker({field:'执行人员',multiple:true,options:Array.from(new Set(TEACHERS.concat(d.people))).map(function(x){return {value:x,label:x}}),selected:d.people,onConfirm:function(v){d.people=v;renderTeacherForm()}});
      if(k==='method')openPicker({field:'关爱方式',options:METHODS.map(function(x){return {value:x,label:x}}),selected:[d.method],onConfirm:function(v){d.method=v;renderTeacherForm()}});
      if(k==='careDate')openCalendar(d.careDate,function(v){d.careDate=v;renderTeacherForm()});
    }});
    pad.querySelectorAll('textarea').forEach(function(t){t.oninput=function(){d[t.name]=t.value;pad.querySelector('[data-count='+t.name+']').textContent=len(t.value)+'/100';clearErr(t.name)}});
    var file=pad.querySelector('input[type=file]');
    file.onchange=function(){var files=Array.from(file.files||[]);file.value='';addFiles(files)};
  }
  /* 证明材料：前端即时校验（张数 → 格式 → 大小 → 读取） */
  function addFiles(files){
    var d=T.draft,pad=formScreen.querySelector('.c3m-pad');clearErr('proofs');if(!files.length)return;
    if(d.proofs.length+files.length>9)return showErr('proofs','最多上传9张图片');
    if(files.some(function(f){return ['image/jpeg','image/jpg','image/png'].indexOf(f.type)<0}))return showErr('proofs','仅支持JPEG、JPG、PNG格式图片');
    if(files.some(function(f){return f.size>10*1024*1024}))return showErr('proofs','每张图片不能超过10M');
    T.reading=true;syncSave();pad.querySelector('[data-reading]').hidden=false;
    var fail=takeFault('read');
    Promise.all(files.map(function(f){return new Promise(function(res,rej){if(fail||f.fail){setTimeout(rej,400);return}if(f.src){setTimeout(function(){res({name:f.name,size:f.size,type:f.type,src:f.src})},400);return}var fr=new FileReader();fr.onload=function(){res({name:f.name,size:f.size,type:f.type,src:String(fr.result)})};fr.onerror=rej;fr.readAsDataURL(f)})}))
      .then(function(list){d.proofs=d.proofs.concat(list).slice(0,9);renderPhotos(pad)})
      .catch(function(){showErr('proofs','图片读取失败，请重新选择')})
      .then(function(){T.reading=false;syncSave();var rd=pad.querySelector('[data-reading]');if(rd)rd.hidden=true});
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
  function clearAllErr(){formScreen.querySelectorAll('.c3m-err').forEach(function(e){e.textContent=''});formScreen.querySelectorAll('.has-err').forEach(function(f){f.classList.remove('has-err')})}
  function showErr(key,msg){
    var e=formScreen.querySelector('[data-error='+key+']')||formScreen.querySelector('[data-error=save]');e.textContent=msg;
    var f=formScreen.querySelector('[data-field='+key+']');if(f){f.classList.add('has-err');f.scrollIntoView({block:'center'})}else e.scrollIntoView({block:'center'});
  }
  /* 第一步：前端按字段顺序校验 */
  function frontCheck(d){
    if(!d.grade)return ['grade','请选择年级'];
    if(!d.className)return ['className','请选择班级'];
    if(!d.studentId)return ['studentId','请选择学生姓名'];
    if(!d.sources.length)return ['sources','请选择关爱来源'];
    if(!d.types.length)return ['types','请选择关爱类型'];
    if(!d.reason.trim())return ['reason','请填写关爱原因'];
    if(len(d.reason.trim())>100)return ['reason','关爱原因最多100字'];
    if(!validDate(d.careDate))return ['careDate','请选择有效关爱时间'];
    if(!d.people.length)return ['people','请选择执行人员'];
    if(!d.method)return ['method','请选择关爱方式'];
    if(!d.result.trim())return ['result','请填写关爱结果'];
    if(len(d.result.trim())>100)return ['result','关爱结果最多100字'];
    return null;
  }
  function saveTeacher(){
    var d=T.draft;if(!d||T.reading||T.saving)return;clearAllErr();
    var f=frontCheck(d);if(f)return showErr(f[0],f[1]);
    T.saving=true;syncSave();
    setTimeout(function(){T.saving=false;syncSave();serverSave(d)},450);
  }
  /* 第二步：服务端复核（网络 → 记录存在 → 权限 → 学生 → 版本） */
  function serverSave(d){
    if(curId()!=='sc-care3-form'||T.draft!==d)return;
    if(takeFault('net')){toast(MSG.net);return showErr('save',MSG.net)}
    var current=T.editing&&findRecord(T.editing.id);
    if(T.editing&&(!current||!visibleTeacher(current))){toast(MSG.changed);backToCare();return}
    if(current&&!canEdit(current)){toast(MSG.noAuth);return showErr('save',MSG.noAuth)}
    if(!current&&!account.write){toast(MSG.noWrite);return showErr('save',MSG.noWrite)}
    var changedStudent=!current||d.studentId!==current.studentId,st=findStudent(d.studentId),snap;
    if(changedStudent){
      if(!st){d.studentId='';d.people=[];renderTeacherForm();return showErr('studentId','学生信息已更新，请重新选择学生。')}
      if(st.status!=='在读'){d.studentId='';d.people=[];renderTeacherForm();return showErr('studentId','该学生当前不是在读状态，不能'+(current?'保存':'新增')+'关爱记录，请重新选择学生。')}
      if(!studentInScope(st)){d.studentId='';d.people=[];renderTeacherForm();return showErr('studentId','该学生已不在您的数据范围内，请重新选择学生。')}
      if(st.grade!==d.grade||st.className!==d.className){d.grade=st.grade;d.className=st.className;renderTeacherForm();return showErr('studentId','该学生的年级或班级已发生变化，已更新为“'+st.grade+'·'+st.className+'”，请确认后重新提交。')}
      snap={id:st.id,name:st.name,grade:st.grade,className:st.className,org:st.org.slice()};
    }else snap=clone(current.student);
    if(current&&current.version!==T.editing.version){toast(MSG.updatedEdit);return showErr('save',MSG.updatedEdit)}
    var value={studentId:snap.id,student:snap,sources:ordered(d.sources,SOURCES),types:ordered(d.types,TYPES),reason:d.reason.trim(),careDate:d.careDate,people:ordered(d.people,TEACHERS),method:d.method,result:d.result.trim(),proofs:clone(d.proofs||[])};
    var saved;
    if(current){saved=Object.assign({},current,value,{updatedAt:now(),updatedBy:account.name,version:current.version+1});audit.push({action:'编辑',operator:account.name,operatorId:account.id,operatedAt:saved.updatedAt,before:clone(current),after:clone(saved)});records.splice(records.indexOf(current),1,saved)}
    else{saved=Object.assign(value,{id:'r-'+String(++seq).padStart(5,'0'),createdBy:account.id,createdName:account.name,createdAt:now(),updatedAt:null,updatedBy:null,version:1});records.push(saved);audit.push({action:'新增',operator:account.name,operatorId:account.id,operatedAt:saved.createdAt,before:null,after:clone(saved)})}
    T.draft=null;T.editing=null;openTeacherDetail(saved.id);toast('保存成功');
  }

  /* ----- 老师端演示：场景 / 异常 ----- */
  function spareStudent(){return students.find(function(s){return studentInScope(s)&&s.status==='在读'&&s.org[3]===MAIN_SCHOOL&&!records.some(function(r){return r.studentId===s.id})})||scopeStudents()[0]}
  function fillSample(st){
    var d=T.draft;if(!d)return false;st=st||spareStudent();if(!st){toast('当前账号没有可选学生，请切换为王老师后演示');return false}
    Object.assign(d,{grade:st.grade,className:st.className,studentId:st.id,people:[st.teacher],sources:d.sources.length?d.sources:['班主任发现'],types:d.types.length?d.types:['学业困难学生'],reason:d.reason.trim()?d.reason:'近期作业完成率下降，课堂注意力不集中。',careDate:validDate(d.careDate)?d.careDate:today(),method:d.method||'学业帮扶与个性化辅导',result:d.result.trim()?d.result:'已安排每周两次课后辅导，学生作业完成情况好转。'});
    renderTeacherForm();return st;
  }
  function submitNow(){setTimeout(saveTeacher,60)}
  function fieldDemo(key,mutate){return function(){if(!fillSample())return;mutate(T.draft);renderTeacherForm();submitNow()}}
  function firstOwnRecord(){return teacherQuery().slice(0,T.loaded).find(canEdit)}
  function needCareList(fn){return function(){if(curId()!=='sc-list'||window.fcCurTab!=='care')openCareList();fn()}}
  function identityItems(){return Object.keys(ACCOUNT_BASE).map(function(k,i){var a=ACCOUNT_BASE[k];return {group:i===0?'演示身份（点击切换，页面立即按该权限刷新）':'',label:a.name,sub:a.desc,on:account.key===k,keep:true,run:function(){setAccount(k)}}})}
  function teacherHelp(){
    var id=curId();
    if(id==='sc-list'&&window.fcCurTab==='care')return listHelpCfg();
    if(id==='sc-care3-form'&&T.draft)return formHelpCfg();
    if(id==='sc-care3-detail')return detailHelpCfg();
    return null;
  }
  function listHelpCfg(){
    var input=function(v){return function(){var i=document.querySelector('#fc-panel-care .c3m-search');i.value=v;runSearch(v)}};
    return {title:'关爱记录列表 · 场景与异常',cats:[
      {name:'场景',items:identityItems().concat([
        {group:'规则说明',label:'查看本页规则说明',run:function(){rulesDialog(RULES)}},
        {group:'搜索与懒加载',label:'搜索“小红”',sub:'输入即模糊匹配，候选显示“姓名＋年级·班级”',run:input('小红')},
        {label:'清空搜索',sub:'恢复本学年全部可见记录',run:input('')},
        {label:'滚动到底部',sub:'首批20条，下滑每次再加载20条，全部加载后提示“已全部加载”',run:function(){var s=document.querySelector('#fc-panel-care .c3m-scroll');var n=0;(function step(){s.scrollTop=s.scrollHeight;s.dispatchEvent(new Event('scroll'));if(++n<4)setTimeout(step,120)})()}},
        {group:'本人记录与操作入口',label:'定位第一条本人可操作记录',sub:'仅本人创建且有新增和操作权限的记录显示“...”',run:function(){var r=firstOwnRecord();if(!r){toast('当前身份没有可操作的本人记录');return}var b=document.querySelector('[data-more="'+r.id+'"]');b.scrollIntoView({block:'center'});b.classList.add('c3x-flash');setTimeout(function(){b.classList.remove('c3x-flash')},1600)}}
      ])},
      {name:'异常',items:[
        {group:'空数据',label:MSG.empty,sub:'搜索不存在的学生，总数显示0',run:input('不存在的学生')},
        {group:'操作中权限变化（后台已变更，页面未刷新）',label:'新增权限已被收回',sub:'点击后自动点“新增关爱记录”，提示无新增权限并置灰按钮',run:function(){if(!account.write){toast('当前身份本就没有新增权限，请先切换为王老师');return}account.write=false;document.querySelector('#fc-panel-care [data-new]').click()}},
        {label:'记录操作权限已被收回',sub:'点击后自动点第一条本人记录的“...”，提示“暂无权限”，“...”消失',run:function(){var r=firstOwnRecord();if(!r){toast('当前身份没有可操作的本人记录');return}account.operate=false;document.querySelector('[data-more="'+r.id+'"]').click()}},
        {label:'学生已调离本人数据范围',sub:'第一条记录的学生调离李老师班级（李老师身份），点“详情”提示记录已变化',run:function(){if(account.view!=='class'){setAccount('li')}var r=teacherQuery()[0];if(!r){toast('暂无可演示记录');return}var s=findStudent(r.studentId);s.teacher='其他老师';document.querySelector('[data-detail="'+r.id+'"]').click()}},
        {group:'数据已被他人/其他端变更',label:'记录已被删除',sub:'第一条记录在其他端删除，点“详情”提示记录已变化并刷新列表',run:function(){var r=teacherQuery()[0];if(!r)return;records.splice(records.indexOf(r),1);document.querySelector('[data-detail="'+r.id+'"]').click()}},
        {label:'删除时记录已被修改',sub:'第一条本人记录在其他端编辑过，点“...”→删除→确定后提示记录已更新',run:function(){var r=firstOwnRecord();if(!r){toast('当前身份没有可操作的本人记录');return}r.version++;r.updatedAt=now();document.querySelector('[data-more="'+r.id+'"]').click();setTimeout(function(){var b=document.querySelector('[data-action=delete]');if(b)b.click()},300);hint('已打开删除确认，点“确定”查看版本冲突提示')}},
        {group:'网络与加载',label:'网络异常',sub:'下一次请求（搜索、新增入口、详情、“...”、删除）失败，提示后保留当前内容',run:function(){FAULT.net=true;hint('已模拟：下一次请求网络异常，请任意操作一次')}},
        {label:'懒加载失败',sub:'滚动到底部加载下一批失败，底部显示“加载失败，点击重试”',run:function(){if(T.search)runSearch('');FAULT.lazy=true;var s=document.querySelector('#fc-panel-care .c3m-scroll');s.scrollTop=s.scrollHeight;s.dispatchEvent(new Event('scroll'))}}
      ]}
    ]};
  }
  function formHelpCfg(){
    var editing=!!T.editing;
    var studentChange=function(label,sub,mutate,group){return {group:group,label:label,sub:sub,run:function(){var st=fillSample();if(!st)return;mutate(st);submitNow()}}};
    var keepStudent=function(){return T.draft.studentId?findStudent(T.draft.studentId)||undefined:undefined};
    var items=[
      studentChange('学生已非在读（休学/转出/毕业）','清空学生，需重新选择；关爱内容保留',function(st){st.status='休学'},'学生复核（提交时服务端校验；点击后自动填写示例并提交）'),
      studentChange('学生年级或班级已变化（升级/调班）','自动刷新为最新年级班级，确认后再次点“确定”即可保存',function(st){st.className=st.className==='1班'?'3班':'4班'}),
      studentChange('学生已不在您的数据范围内','学生已转出本校或调离本人班级；不显示转入学校',function(st){st.org=st.org.slice(0,3).concat([OTHER_SCHOOL])}),
      studentChange('学生信息已失效','学籍被合并或删除，需重新选择学生',function(st){students.splice(students.indexOf(st),1)})
    ];
    items.push({group:'操作中权限变化',label:editing?'记录操作权限已被收回':'新增权限已被收回',sub:editing?'提交时提示“暂无权限”，表单内容保留':'提交时提示无新增权限，表单内容保留',run:function(){if(!fillSample(keepStudent()))return;if(editing)account.operate=false;else account.write=false;submitNow()}});
    if(editing){
      items.push({group:'记录已被他人/其他端变更',label:'记录已被修改（版本冲突）',sub:'提示“记录已更新，请重新打开编辑”，不覆盖较新内容',run:function(){var r=findRecord(T.editing.id);if(r){r.version++;r.updatedAt=now()}submitNow()}});
      items.push({label:'记录已被删除',sub:'提示“记录已变化，请刷新后重试”并返回列表',run:function(){var r=findRecord(T.editing.id);if(r)records.splice(records.indexOf(r),1);submitNow()}});
    }
    items.push({group:'网络与提交',label:'提交时网络异常',sub:'提示“网络异常，请稍后重试”，按钮恢复，内容保留',run:function(){if(!fillSample(keepStudent()))return;FAULT.net=true;submitNow()}});
    items.push({label:'防重复提交',sub:'提交中按钮显示“提交中…”且不可再点',run:function(){if(!fillSample(keepStudent()))return;FAULT.net=true;saveTeacher();saveTeacher();hint('按钮已置为“提交中…”，重复点击无效')}});
    var fields=[['grade','请选择年级',function(d){d.grade='';d.className='';d.studentId='';d.people=[]}],['className','请选择班级',function(d){d.className='';d.studentId='';d.people=[]}],['studentId','请选择学生姓名',function(d){d.studentId='';d.people=[]}],['sources','请选择关爱来源',function(d){d.sources=[]}],['types','请选择关爱类型',function(d){d.types=[]}],['reason','请填写关爱原因',function(d){d.reason='   '}],['reason','关爱原因最多100字',function(d){d.reason=new Array(102).join('情')}],['careDate','请选择有效关爱时间',function(d){d.careDate='2026-02-30'}],['people','请选择执行人员',function(d){d.people=[]}],['method','请选择关爱方式',function(d){d.method=''}],['result','请填写关爱结果',function(d){d.result=''}],['result','关爱结果最多100字',function(d){d.result=new Array(102).join('果')}]];
    var fieldItems=fields.map(function(f,i){return {group:i===0?'字段校验（点击即演示，红字定位到对应字段）':'',label:f[1],run:fieldDemo(f[0],f[2])}});
    fieldItems.push({group:'',label:'全部为空直接提交',sub:'只提示第一处“请选择年级”',run:function(){T.draft=freshDraft();T.draft.careDate='';renderTeacherForm();submitNow()}});
    var fake=function(n,type,size,fail){return Array.from({length:n},function(_,i){return {name:'示例'+(i+1)+(type==='image/png'?'.png':'.gif'),type:type,size:size,src:DEMO_PROOFS[i%2].src,fail:fail}})};
    var proofItems=[
      {group:'证明材料（点击即演示）',label:'最多上传9张图片',sub:'一次选择10张，本次不加入',run:function(){addFiles(fake(10,'image/png',1000))}},
      {label:'仅支持JPEG、JPG、PNG格式图片',sub:'选择GIF图片',run:function(){addFiles(fake(1,'image/gif',1000))}},
      {label:'每张图片不能超过10M',sub:'选择11M图片',run:function(){addFiles(fake(1,'image/png',11*1024*1024))}},
      {label:'图片读取失败，请重新选择',sub:'读取中按钮显示“图片读取中…”，失败后保留原有图片',run:function(){addFiles(fake(1,'image/png',1000,true))}},
      {label:'正常添加2张图片',sub:'计数显示N/9，可点缩略图预览、点×移除',run:function(){addFiles(fake(2,'image/png',1000))}}
    ];
    return {title:(editing?'编辑':'新增')+'关爱记录 · 场景与异常',cats:[
      {name:'场景',items:[{group:'规则说明',label:'查看本页规则说明',run:function(){rulesDialog(RULES)}},{group:'填写示例',label:'一键填写完整示例',sub:'自动选择本人范围内的在读学生并填好全部必填项',run:function(){fillSample()}},{label:'选择学生后默认班主任',sub:'执行人员默认为所选学生的班主任，可改为多人'},{label:'放弃填写确认',sub:'点击左上角返回时弹出“放弃填写”',run:leaveForm}]},
      {name:'异常',items:items.concat(fieldItems,proofItems)}
    ]};
  }
  function detailHelpCfg(){
    var id=T.detailId;
    var openBy=function(pred,msg){return function(){var r=teacherQuery().find(pred);if(!r){toast(msg);return}openTeacherDetail(r.id)}};
    return {title:'关爱记录详情 · 场景与异常',cats:[
      {name:'场景',items:[
        {group:'规则说明',label:'查看本页规则说明',run:function(){rulesDialog(RULES)}},
        {group:'详情示例',label:'含证明材料的记录',sub:'只显示缩略图，点击全屏预览',run:openBy(function(r){return (r.proofs||[]).length},'当前身份范围内没有含图片的记录')},
        {label:'无证明材料的记录',sub:'证明材料显示“--”',run:openBy(function(r){return !(r.proofs||[]).length},'暂无示例')},
        {label:'他人创建的记录',sub:'详情只读；列表中该记录不显示“...”',run:openBy(function(r){return r.createdBy!==account.id},'暂无示例')}
      ]},
      {name:'异常',items:[
        {group:'图片',label:'证明材料加载失败',sub:'显示“图片加载失败”，悬停“图片加载失败，请重新打开”，其他字段正常',run:function(){var r=findRecord(id);if(r&&!(r.proofs||[]).length)r.proofs=clone(DEMO_PROOFS);openTeacherDetail(id,true)}},
        {group:'数据变化',label:'记录已被删除',sub:'重新打开详情时提示“记录已变化，请刷新后重试”并返回列表',run:function(){var r=findRecord(id);if(r)records.splice(records.indexOf(r),1);openTeacherDetail(id)}},
        {group:'网络',label:'详情读取网络异常',sub:'提示“网络异常，请稍后重试”，返回列表',run:function(){FAULT.net=true;openTeacherDetail(id)}}
      ]}
    ]};
  }

  /* ======================================================================
   * 学校端 / 四级监管端（Web）
   * ==================================================================== */
  var PAGE_MAP={school:{warning:'warning-list',visit:'visit-ledger',config:'config'},county:{warning:'warning-school-dr',visit:'visit-school-dr',config:'config'},city:{warning:'warning-district',visit:'visit-district'},province:{warning:'warning-city',visit:'visit-city'},ministry:{warning:'warning-province',visit:'visit-province'}}[role]||{};
  function defaults(start,end){return {year:'',grade:'',className:'',name:'',source:'',start:start==null?today():start,end:end==null?today():end}}
  var W={org:ROOT.slice(),page:1,filter:defaults(),stack:[],scrollLeft:0,err:''},section;
  function children(path){if(path.length===0)return Object.keys(TREE);if(path.length===1)return Object.keys(TREE[path[0]]||{});if(path.length===2)return Object.keys((TREE[path[0]]||{})[path[1]]||{});if(path.length===3)return (((TREE[path[0]]||{})[path[1]]||{})[path[2]]||[]);return []}
  function atList(){return isSchool||W.org.length===4}
  function scopeRecords(){return records.filter(function(r){return inPath(r.student.org,W.org)})}
  function webRecords(){var f=W.filter;return sorted(scopeRecords().filter(function(r){return (!f.year||yearOf(r.careDate)===f.year)&&(!f.grade||r.student.grade===f.grade)&&(!f.className||r.student.className===f.className)&&(!f.name||r.student.name.indexOf(f.name.trim())>=0)&&(!f.source||r.sources.indexOf(f.source)>=0)&&(!f.start||r.createdAt.slice(0,10)>=f.start)&&(!f.end||r.createdAt.slice(0,10)<=f.end)}))}
  function opts(values,selected,all){return '<option value="">'+esc(all)+'</option>'+values.map(function(v){return '<option value="'+esc(v)+'" '+(v===selected?'selected':'')+'>'+esc(v)+'</option>'}).join('')}
  function setTitle(t){var el=document.querySelector('[data-dom-id="page-title"]');if(el)el.textContent=t}
  function keyOf(a){var label=(a.textContent||'').trim();if(/关爱/.test(label))return 'care';if(/劝返/.test(label))return 'visit';if(/预警配置/.test(label))return 'config';if(/预警/.test(label))return 'warning';if(/看板/.test(label))return 'dashboard';return ''}
  function hideAside(){var a=document.querySelector('aside');if(!a)return;a.style.setProperty('display','none','important');var c=a.nextElementSibling;while(c&&c.tagName==='SCRIPT')c=c.nextElementSibling;if(c){c.style.setProperty('margin-left','0','important');c.style.setProperty('width','100%','important')}}
  function installWeb(){
    section=document.getElementById('section-care-menu-v1');
    if(!section){section=document.createElement('section');section.id='section-care-menu-v1';document.body.appendChild(section)}
    section.setAttribute('data-page','care-menu-v1');section.className='c3w-section hidden';
    window[isSchool?'schoolCareOpen':'cityCareOpen']=function(){setUrl('care',null,true);routeWeb()};
    var items=[],seen={};
    Array.from(document.querySelectorAll('aside a')).forEach(function(a){var key=keyOf(a),label=(a.textContent||'').trim().replace(/\s+/g,' ').split(' ')[0];if(!key||key==='dashboard'||key==='care'||seen[key]||!PAGE_MAP[key])return;seen[key]=1;items.push({key:key,label:label})});
    items.push({key:'care',label:'关爱管理'});
    hideAside();buildBar(items);
    var sp=window.switchPage;
    if(typeof sp==='function')window.switchPage=function(){section.classList.add('hidden');document.querySelectorAll('.c3w-mask').forEach(function(m){m.remove()});var r=sp.apply(this,arguments);refreshHelp();return r};
    document.addEventListener('keydown',function(e){if(e.key==='Escape'){var m=document.querySelector('.c3w-mask');if(m){m.remove();refreshHelp()}}});
  }
  function blankWeb(){if(typeof window.switchPage==='function')window.switchPage(null);document.querySelectorAll('[id^="section-"]').forEach(function(s){s.classList.add('hidden')});setTitle('');setActive('');refreshHelp()}
  function routeWeb(){
    var key=pageKey();document.querySelectorAll('.c3w-mask,.c3w-cal').forEach(function(m){m.remove()});
    if(key==='care'){openWebCare();return}
    if(PAGE_MAP[key]&&menuItems.some(function(it){return it.key===key})){window.switchPage(PAGE_MAP[key]);setActive(key);return}
    blankWeb();if(location.search||location.hash)setUrl('');
  }
  function openWebCare(){
    document.querySelectorAll('[id^="section-"]').forEach(function(s){if(s!==section)s.classList.add('hidden')});
    section.classList.remove('hidden');setTitle('关爱管理');setActive('care');
    W.page=1;W.filter=defaults();W.stack=[];W.scrollLeft=0;W.err='';W.org=ROOT.slice();
    var orgParam=param('org');
    if(orgParam&&!isSchool){
      var path=orgParam.split('/').filter(Boolean),cur=ROOT.slice(),ok=path.length<=4-ROOT.length;
      path.forEach(function(n){if(!ok)return;if(children(cur).indexOf(n)<0){ok=false;return}W.stack.push({org:cur.slice(),filter:defaults(),page:1,scrollLeft:0});cur=cur.concat([n])});
      if(ok)W.org=cur;else{W.stack=[];setUrl('care');setTimeout(function(){toast(MSG.noAuth)},50)}
    }
    renderWeb();
  }
  function syncOrgUrl(){if(isSchool)return;var rel=W.org.slice(ROOT.length).join('/');setUrl('care',rel?{org:rel}:null)}
  function dateField(name,value){return '<span class="c3w-date"><input name="'+name+'" value="'+esc(value)+'" placeholder="请选择日期" readonly autocomplete="off" aria-label="'+(name==='start'?'创建开始日期':'创建结束日期')+'"><button type="button" data-cal="'+name+'" aria-label="选择日期">'+CAL_ICON+'</button></span>'}
  function renderWeb(){
    var list=atList(),orgName=W.org.length?W.org[W.org.length-1]:'',drilled=W.org.length>ROOT.length,prevScroll=section.querySelector('.c3w-table-wrap');
    if(prevScroll)W.scrollLeft=prevScroll.scrollLeft;
    var title=isSchool?'':(drilled?'关爱记录汇总-'+orgName:'关爱记录汇总'+(W.org.length&&!list?'-'+orgName:''));
    section.innerHTML='<div class="c3w" id="care3-web-root"><div class="c3w-panel">'+
      (isSchool?'':'<div class="c3w-head">'+(drilled?'<button type="button" class="c3w-back" data-back>← 返回</button>':'')+'<h2>'+esc(title)+'</h2></div>')+
      (list?listHtml():summaryHtml())+'</div></div>';
    var errBox=section.querySelector('[data-err]');if(errBox)errBox.textContent=W.err||'';
    var back=section.querySelector('[data-back]');if(back)back.onclick=function(){var prev=W.stack.pop();if(!prev)return;W.org=prev.org;W.filter=prev.filter;W.page=prev.page;W.scrollLeft=prev.scrollLeft;W.err='';syncOrgUrl();renderWeb()};
    bindWeb();
    var wrap=section.querySelector('.c3w-table-wrap');if(wrap)wrap.scrollLeft=W.scrollLeft||0;
    refreshHelp();
  }
  function summaryHtml(){
    var f=W.filter,names=children(W.org),rs=webRecords(),label=['省份名称','地市名称','区县名称','学校名称'][W.org.length];
    function stat(list){return '<td>'+new Set(list.map(function(r){return r.studentId})).size+'</td><td>'+list.length+'</td>'}
    return '<form class="c3w-toolbar" data-form><div class="c3w-filters"><div class="c3w-filter"><label>创建日期</label><div class="c3w-range">'+dateField('start',f.start)+'<span>—</span>'+dateField('end',f.end)+'</div></div><div class="c3w-err" data-err></div></div><div class="c3w-actions"><button class="c3w-btn query" type="submit">查询</button><button class="c3w-btn reset" type="button" data-reset>重置</button></div></form>'+
      '<div class="c3w-table-wrap" tabindex="0"><table class="c3w-table c3w-sum"><colgroup><col style="width:40%"><col style="width:30%"><col style="width:30%"></colgroup><thead><tr><th>'+label+'</th><th>关爱学生数</th><th>关爱次数</th></tr></thead><tbody>'+
      names.map(function(n){return '<tr><td><button type="button" class="c3w-name-link" data-drill="'+esc(n)+'">'+esc(n)+'</button></td>'+stat(rs.filter(function(r){return r.student.org[W.org.length]===n}))+'</tr>'}).join('')+
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
      (rows.length?rows.map(function(r){var src=ordered(r.sources,SOURCES).join('、'),tp=ordered(r.types,TYPES).join('、');return '<tr><td>'+esc(r.student.name||'--')+'</td><td>'+esc(r.student.grade||'--')+'</td><td>'+esc(r.student.className||'--')+'</td><td>'+esc(r.createdAt.slice(0,16))+'</td><td title="'+esc(src)+'">'+esc(short(src))+'</td><td title="'+esc(tp)+'">'+esc(short(tp))+'</td><td class="left" title="'+esc(r.reason)+'">'+esc(r.reason||'--')+'</td><td>'+esc(r.careDate||'--')+'</td><td class="left" title="'+esc(r.result)+'">'+esc(r.result||'--')+'</td><td class="c3w-op"><button type="button" class="c3w-link" data-web-detail="'+esc(r.id)+'">详情</button></td></tr>'}).join(''):'<tr><td colspan="9" class="c3w-empty">'+MSG.empty+'</td><td class="c3w-op c3w-empty"></td></tr>')+
      '</tbody></table></div><div class="c3w-pager"><span>共 '+list.length+' 条，每页10条</span><span><button type="button" data-prev '+(W.page<=1?'disabled':'')+'>上一页</button>'+W.page+' / '+total+'<button type="button" data-next '+(W.page>=total?'disabled':'')+'>下一页</button></span></div>';
  }
  function submitQuery(){var f=section.querySelector('[data-form]');if(f)f.requestSubmit?f.requestSubmit():f.dispatchEvent(new Event('submit',{cancelable:true}))}
  function bindWeb(){
    var form=section.querySelector('[data-form]'),err=form.querySelector('[data-err]');
    form.onsubmit=function(e){
      e.preventDefault();var next=Object.assign({},W.filter,Object.fromEntries(new FormData(form)));next.start=(next.start||'').trim();next.end=(next.end||'').trim();if(next.name!=null)next.name=next.name.trim();
      if(next.start&&next.end&&next.start>next.end){err.textContent=MSG.dateRange;return}
      if(takeFault('net')){err.textContent=MSG.net;return}
      W.filter=next;W.page=1;W.scrollLeft=0;W.err='';renderWeb();
    };
    form.querySelector('[data-reset]').onclick=function(){if(takeFault('net')){err.textContent=MSG.net;return}W.filter=defaults();W.page=1;W.scrollLeft=0;W.err='';renderWeb()};
    form.querySelectorAll('[data-cal]').forEach(function(b){var inp=form.querySelector('[name='+b.dataset.cal+']');b.onclick=inp.onclick=function(e){e.stopPropagation();webCalendar(inp)}});
    var name=form.querySelector('[name=name]');
    if(name){var sug=name.parentElement.querySelector('.c3w-suggest');
      var show=function(){var q=name.value.trim();if(!q){sug.hidden=true;return}var seen={},hits=scopeRecords().filter(function(r){if(r.student.name.indexOf(q)<0||seen[r.studentId])return false;seen[r.studentId]=1;return true}).slice(0,8);if(!hits.length){sug.hidden=true;return}sug.innerHTML=hits.map(function(r){return '<button type="button" data-n="'+esc(r.student.name)+'">'+esc(r.student.name)+'<small>'+esc(r.student.grade+' · '+r.student.className)+'</small></button>'}).join('');sug.hidden=false;sug.querySelectorAll('[data-n]').forEach(function(b){b.onmousedown=function(e){e.preventDefault();name.value=b.dataset.n;sug.hidden=true}})};
      name.oninput=show;name.onfocus=show;name.onblur=function(){setTimeout(function(){sug.hidden=true},120)};}
    section.querySelectorAll('[data-drill]').forEach(function(b){b.onclick=function(){
      if(takeFault('net')){toast(MSG.net);return}
      if(takeFault('noAuth')){toast(MSG.noAuth);return}
      var wrap=section.querySelector('.c3w-table-wrap');W.stack.push({org:W.org.slice(),filter:clone(W.filter),page:W.page,scrollLeft:wrap?wrap.scrollLeft:0});W.org=W.org.concat([b.dataset.drill]);W.filter=defaults(W.filter.start,W.filter.end);W.page=1;W.scrollLeft=0;W.err='';syncOrgUrl();renderWeb()}});
    var prev=section.querySelector('[data-prev]'),next=section.querySelector('[data-next]');
    var turn=function(step){if(takeFault('net')){toast(MSG.net);return}W.page+=step;renderWeb()};
    if(prev)prev.onclick=function(){turn(-1)};if(next)next.onclick=function(){turn(1)};
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
  function openModal(title,body,kind){
    document.querySelectorAll('.c3w-mask').forEach(function(x){x.remove()});
    var m=document.createElement('div');m.className='c3w-mask';if(kind)m.dataset.kind=kind;
    m.innerHTML='<div class="c3w-modal" role="dialog" aria-modal="true" aria-label="'+esc(title)+'"><div class="c3w-modal-head"><h3>'+esc(title)+'</h3><button type="button" class="c3w-close" data-close aria-label="关闭">×</button></div><div class="c3w-modal-body">'+body+'</div><div class="c3w-modal-foot"><button type="button" data-close>关闭</button></div></div>';
    m.querySelectorAll('[data-close]').forEach(function(b){b.onclick=function(){m.remove();refreshHelp()}});document.body.appendChild(m);refreshHelp();return m;
  }
  function wrow(k,v,raw){return '<div class="c3w-row"><span class="label">'+esc(k)+'</span><span class="value">'+(raw?v:esc(v==null||v===''?'--':v))+'</span></div>'}
  var webDetailId=null;
  function openWebDetail(id,broken){
    if(takeFault('net')){toast(MSG.net);return}
    var r=records.find(function(x){return x.id===id&&inPath(x.student.org,W.org)});if(!r){document.querySelectorAll('.c3w-mask').forEach(function(m){m.remove()});toast(MSG.changed);renderWeb();return}
    webDetailId=id;
    var m=openModal('关爱记录详情','<div class="c3w-sec">学生信息</div><div class="c3w-card">'+wrow('学生姓名',r.student.name)+wrow('学校',r.student.org[3])+wrow('年级',r.student.grade)+wrow('班级',r.student.className)+'</div><div class="c3w-sec">关爱内容</div><div class="c3w-card">'+wrow('关爱来源',ordered(r.sources,SOURCES).join('、'))+wrow('关爱类型',ordered(r.types,TYPES).join('、'))+wrow('关爱原因',r.reason)+wrow('关爱时间',r.careDate)+wrow('执行人员',ordered(r.people,TEACHERS).join('、'))+wrow('关爱方式',r.method)+wrow('关爱结果',r.result)+wrow('证明材料',(r.proofs||[]).length?'<div class="c3w-proofs">'+r.proofs.map(function(p,i){return '<img data-proof="'+i+'" alt="证明材料'+(i+1)+'" src="'+esc(broken?BROKEN_IMG:(p.src||''))+'">'}).join('')+'</div>':'--',true)+wrow('创建人',r.createdName)+wrow('创建时间',r.createdAt.slice(0,16))+'</div>','detail');
    bindImgFail(m);m.querySelectorAll('img[data-proof]').forEach(function(img){img.onclick=function(){viewImage(img.src,img.alt,document.body)}});
  }
  /* ----- Web 演示：场景 / 异常 ----- */
  function webHelp(){
    var mask=document.querySelector('.c3w-mask');
    if(mask&&mask.dataset.kind==='detail')return webDetailHelp();
    if(mask)return null;
    if(!section||section.classList.contains('hidden'))return null;
    return atList()?webListHelp():webSummaryHelp();
  }
  function fillAndQuery(vals){return function(){var form=section.querySelector('[data-form]');Object.keys(vals).forEach(function(k){var el=form.querySelector('[name='+k+']');if(el)el.value=vals[k]});submitQuery()}}
  function dateErrors(){return [{group:'查询校验（点击即在查询区演示）',label:MSG.dateRange,sub:'日期选择插件选出开始日期晚于结束日期后查询，原结果不变',run:fillAndQuery({start:'2026-10-20',end:'2026-10-01'})}]}
  function netItem(sub){return {group:'网络',label:MSG.net,sub:sub,run:function(){FAULT.net=true;hint('已模拟：下一次请求网络异常，请点击查询/翻页/详情/组织名称任一操作')}}}
  function webListHelp(){
    var firstRow=function(){var b=section.querySelector('[data-web-detail]');return b&&findRecord(b.dataset.webDetail)};
    return {title:(isSchool?'本校关爱记录':'学校底层关爱记录')+' · 场景与异常',cats:[
      {name:'场景',items:[
        {group:'规则说明',label:'查看本页规则说明',run:function(){rulesDialog(WEB_RULES)}},
        {group:'查询示例（点击即查询）',label:'查看全部创建日期的记录',sub:'清空创建日期起止后查询',run:fillAndQuery({start:'',end:''})},
        {label:'恢复默认：今天创建的记录',sub:'等同点“重置”',run:function(){section.querySelector('[data-reset]').click()}},
        {label:'按学生姓名“张小明”',sub:'创建日期不限',run:fillAndQuery({start:'',end:'',name:'张小明'})},
        {label:'按关爱来源“辍学预警”',sub:'记录含该来源即匹配',run:fillAndQuery({start:'',end:'',source:'辍学预警'})},
        {group:'分页',label:'翻到第2页',sub:'全部日期下每页10条，查询/重置回第1页',run:function(){fillAndQuery({start:'',end:''})();setTimeout(function(){var n=section.querySelector('[data-next]');if(n&&!n.disabled)n.click()},30)}}
      ]},
      {name:'异常',items:dateErrors().concat([
        {group:'无结果',label:MSG.empty,sub:'姓名“不存在的学生”查询，总数0、分页1/1',run:fillAndQuery({start:'',end:'',name:'不存在的学生'})},
        {group:'数据变化',label:MSG.changed,sub:'第一行记录已在老师端删除，点击其“详情”后提示并刷新列表',run:function(){var r=firstRow();if(!r){toast('当前结果为空，请先查看全部创建日期');return}records.splice(records.indexOf(r),1);section.querySelector('[data-web-detail]').click()}},
        netItem('下一次查询/重置/翻页/详情失败，保留原条件与原结果')
      ])}
    ]};
  }
  function webSummaryHelp(){
    return {title:'关爱记录汇总 · 场景与异常',cats:[
      {name:'场景',items:[
        {group:'规则说明',label:'查看本页规则说明',run:function(){rulesDialog(WEB_RULES)}},
        {group:'统计口径',label:'关爱学生数按学生ID去重；关爱次数按独立记录计数',sub:'同一学生多条只算1人；多名执行人员不重复计次'},
        {group:'查询示例（点击即查询）',label:'查看全部创建日期的记录',run:fillAndQuery({start:'',end:''})},
        {label:'恢复默认：今天创建的记录',run:function(){section.querySelector('[data-reset]').click()}},
        {group:'下钻',label:'点击第一个组织名称下钻',sub:'继承当前创建日期；“← 返回”恢复上一层',run:function(){var b=section.querySelector('[data-drill]');if(b)b.click()}}
      ]},
      {name:'异常',items:dateErrors().concat([
        {group:'权限',label:MSG.noAuth,sub:'下钻时该组织已不在授权范围：提示后停留当前层',run:function(){FAULT.noAuth=true;var b=section.querySelector('[data-drill]');if(b)b.click()}},
        {label:'地址参数越权',sub:'地址中org指向授权范围外组织：提示“暂无权限”并回到授权根层',run:function(){setUrl('care',{org:'不存在的组织'},true);routeWeb()}},
        {group:'无数据',label:'组织无记录显示0',sub:'所选日期无记录时组织仍显示名称，人数0、次数0，可下钻空列表',run:fillAndQuery({start:'2026-01-01',end:'2026-01-01'})},
        netItem('下一次查询/重置/下钻失败，保留当前层与原统计')
      ])}
    ]};
  }
  function webDetailHelp(){
    return {title:'关爱记录详情 · 场景与异常',cats:[
      {name:'场景',items:[{group:'规则说明',label:'详情只读：不显示编辑、删除、处理按钮',sub:'×、底部“关闭”或Esc关闭，回到原列表并保留条件、页码、横向位置'},{group:'证明材料',label:'点击缩略图全屏预览',run:function(){var i=document.querySelector('.c3w-mask img[data-proof]');if(i)i.click();else toast('本条记录无证明材料，显示“--”')}}]},
      {name:'异常',items:[{group:'图片',label:'证明材料加载失败',sub:'显示“图片加载失败”，悬停“图片加载失败，请重新打开”，其他字段正常',run:function(){var r=findRecord(webDetailId);if(r&&!(r.proofs||[]).length)r.proofs=clone(DEMO_PROOFS);openWebDetail(webDetailId,true)}}]}
    ]};
  }

  /* ---------- 启动 ---------- */
  window.CARE_V3_DEBUG={records:records,audit:audit,students:students,fault:FAULT,setAccount:function(k){setAccount(k)},state:function(){return isTeacher?T:W},account:function(){return account}};
  if(isTeacher)installTeacher();else installWeb();
  function start(){setTimeout(function(){ready=true;route()},30)}
  window.addEventListener('popstate',function(){setTimeout(route,0)});
  if(document.readyState==='complete')start();else window.addEventListener('load',start);
})();
