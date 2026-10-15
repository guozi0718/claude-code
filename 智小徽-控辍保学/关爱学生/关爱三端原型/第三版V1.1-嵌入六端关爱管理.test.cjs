const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {load} = require('./原型测试工具-V2.0-20261008.cjs');

const root = __dirname;
const pages = {
  teacher: '第三版-老师端关爱管理-V1.1-20261015.html',
  school: '第三版-学校端关爱管理-V1.1-20261015.html',
  ministry: '第三版-部级监管端关爱管理-V1.1-20261015.html',
  province: '第三版-省级监管端关爱管理-V1.1-20261015.html',
  city: '第三版-地市监管端关爱管理-V1.1-20261015.html',
  county: '第三版-区县监管端关爱管理-V1.1-20261015.html',
};
const regulatorLabels = {ministry:'部级教育监管端', province:'省级教育监管端', city:'地市教育监管端', county:'区县教育监管端'};
let checks = 0;
function ok(value, message) { assert.ok(value, message); checks++; }

async function run() {
  const moduleJs = fs.readFileSync(path.join(root, '第三版-关爱记录嵌入-V1.1-20261015.js'), 'utf8');
  for (const [role, file] of Object.entries(pages)) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    ok(html.includes(`window.CARE_V3_EMBED_ROLE="${role}"`), role + '注入身份');
    ok(html.includes('第三版-关爱记录嵌入-V1.1-20261015.js?v=20261015-5') && html.includes('第三版-关爱记录嵌入-V1.1-20261015.css?v=20261015-5'), role + '加载统一交互及第一版风格样式');
    if (role !== 'teacher') {
      ok(!html.includes('独立关爱管理 V1.0（学校端副本新增）') && !html.includes('独立关爱监管 V1.0（教育局端副本新增）'), role + '删除第一版关爱菜单代码');
    }
    if (regulatorLabels[role]) {
      ok(html.includes(regulatorLabels[role]) && !html.includes('关爱监管'), role + '层级标题及菜单统一为关爱管理');
    }
  }
  ok(moduleJs.includes("tab.textContent='关爱记录'") && moduleJs.includes('tabs.appendChild(tab)'), '老师端增加第三个顶部Tab');
  ok(moduleJs.includes('T.loaded+=20'), '老师端每次懒加载20条');
  ok(moduleJs.includes('b.createdAt.localeCompare(a.createdAt)'), '按创建时间倒序');
  ok(moduleJs.includes("kvm('创建时间',r.createdAt.slice(0,16))") && moduleJs.includes("wrow('创建时间',r.createdAt.slice(0,16))"), '手机与Web详情显示创建时间');
  ok(moduleJs.includes("before:clone(current),after:clone(saved)"), '编辑保存前后快照');
  ok(moduleJs.includes('该学生当前不是在读状态，不能新增关爱记录，请重新选择学生。'), '在读状态变化提示');
  ok(moduleJs.includes('该学生的年级或班级已发生变化，已更新为'), '年级班级变化提示');
  ok(moduleJs.includes('该学生已不在您的数据范围内，请重新选择学生。'), '数据范围变化提示');
  ok(moduleJs.includes('确认删除该关爱记录吗？删除后不可恢复！'), '删除确认文案');
  ok(moduleJs.includes('选择关爱时间') && moduleJs.includes('data-month="-1"') && moduleJs.includes('data-month="1"'), '整月日历可切换月份');
  ok(moduleJs.includes('当前内容尚未保存，确认离开？') && moduleJs.includes('暂无可选') && moduleJs.includes('图片读取中…') && moduleJs.includes('记录已更新，请重新打开编辑'), '补齐PRD离开确认、空选项、图片读取与版本提示');
  ok(moduleJs.includes('请输入正确的日期，格式为YYYY-MM-DD') && moduleJs.includes('开始日期不能晚于结束日期，请检查日期范围'), 'Web创建日期两类校验');
  ok(moduleJs.includes('c3n-menu') && moduleJs.includes("buildMenu()"), 'Web菜单统一为右上角功能菜单点');
  const moduleCss = fs.readFileSync(path.join(root, '第三版-关爱记录嵌入-V1.1-20261015.css'), 'utf8');
  ok(moduleCss.includes('.c3m-overlay{position:absolute') && moduleCss.includes('.c3h-dot{') && moduleCss.includes('background:#079b45'), '手机弹层定位于手机可视区且提示点为绿色');
  ok(moduleCss.includes('#scale-wrapper main>aside') && moduleCss.includes('#scale-wrapper>.flex>aside{display:none!important}'), 'Web隐藏左侧菜单');

  const teacher = await load(pages.teacher, '#care-v3');
  assert.deepEqual(teacher.errors, []);
  const td = teacher.document;
  ok([...td.querySelectorAll('.fc-tabs .fc-tab')].map(e => e.textContent).join('|') === '预警记录|劝返记录|关爱记录', '老师端实际渲染三个Tab');
  ok(td.querySelectorAll('#fc-panel-care .c3m-case').length === 20, '老师端首批实际渲染20条');
  ok(!!td.querySelector('#sc-list .sub-hd .c3h-dot') && !td.querySelector('#fc-panel-care button[data-rules],#fc-panel-care button[data-check],#fc-panel-care select'), '老师端规则/校验/身份收进绿色提示点');
  ok(!!td.querySelector('#sc-care3-form .statusbar') && !!td.querySelector('#sc-care3-detail .statusbar'), '新增/详情页保留顶部状态栏');
  ok(!td.querySelector('#sc-home button[onclick="go(\'sc-care-menu\')"]'), '老师端首页无独立关爱入口');
  teacher.window.close();

  const school = await load(pages.school, '#care-v3');
  assert.deepEqual(school.errors, []);
  const sd = school.document;
  ok(!!sd.querySelector('#care3-web-root .c3w-panel') && !sd.querySelector('#section-care-menu-v1').classList.contains('hidden'), '学校端进入关爱管理');
  ok([...sd.querySelectorAll('#care3-float-menu .c3n-item')].map(e => e.textContent).join('|') === '控辍劝返台账|控辍预警|预警配置|关爱管理|数据看板', '学校端右上角菜单含全部功能');
  ok(!!sd.querySelector('#care3-web-root .c3h-dot'), '学校端顶部绿色提示点');
  ok([...sd.querySelectorAll('#care3-web-root th')].map(e => e.textContent).join('|') === '学生姓名|年级|班级|创建日期|关爱来源|关爱类型|关爱原因|关爱时间|关爱结果|操作', '学校端列表字段与PRD一致');
  ok(!sd.querySelector('#care3-web-root th:nth-child(11)'), '学校端保持十列且无关联信息/关爱次数');
  school.window.close();

  const ministry = await load(pages.ministry, '#care-v3');
  assert.deepEqual(ministry.errors, []);
  const md = ministry.document;
  ok([...md.querySelectorAll('#care3-web-root th')].map(e => e.textContent).join('|').includes('关爱学生数|关爱次数'), '监管汇总展示学生数和次数');
  ok(!!md.querySelector('#care3-web-root [name="start"]') && !!md.querySelector('#care3-web-root [name="end"]'), '监管汇总含创建日期筛选');
  ok([...md.querySelectorAll('#care3-float-menu .c3n-item')].map(e => e.textContent).join('|') === '控辍劝返台账|控辍预警|关爱管理|数据看板', '监管端右上角菜单含全部功能');
  ok(!md.querySelector('#care3-web-root [name="types"]') && !md.querySelector('#care3-web-root [name="type"]'), '监管汇总无关爱类型筛选');
  ministry.window.close();

  console.log(`PASS 第三版嵌入六端关爱管理，共 ${checks} 项断言`);
}

run().catch(error => { console.error(error); process.exitCode = 1; });
