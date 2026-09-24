/**
 * 校区 AI 工作台 · 云端同步接口（腾讯云开发 CloudBase 云函数版）
 * 国内节点，访问最快；有免费额度，个人实名即可开通。
 *
 * 部署步骤：
 * 1. 打开 https://tcb.cloud.tencent.com/ 微信扫码登录 -> 新建环境（按提示开通，选免费/按量）
 * 2. 左侧「数据库」-> 新建集合，名字填：workbench
 * 3. 左侧「云函数」-> 新建 -> 运行环境 Node.js 12/16 -> 函数名 campus-sync -> 把本文件粘进去
 * 4. 函数里把 SYNC_KEY 改成你自己的密钥
 * 5. 函数详情 ->「HTTP 访问服务」-> 开启，会得到一个地址，如
 *      https://xxx.service.tcloudbase.com/campus-sync
 *    把这个地址填到工作台「设置 → 云端同步」的接口地址里，密钥填你设的 SYNC_KEY
 */
const cloudbase = require('@cloudbase/node-sdk');
const app = cloudbase.init();
const db = app.database();

const SYNC_KEY = 'campus2026'; // ← 改成你自己的密钥

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,x-sync-key',
  'Content-Type': 'application/json; charset=utf-8'
};

exports.main = async (event) => {
  const method = (event.httpMethod || 'GET').toUpperCase();
  if (method === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };

  const headers = (event.headers || {});
  const got = headers['x-sync-key'] || headers['X-Sync-Key'] || '';
  if (got !== SYNC_KEY) {
    return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: '密钥不对' }) };
  }

  const coll = db.collection('workbench');

  if (method === 'GET') {
    try {
      const r = await coll.doc('campus').get();
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ data: (r.data && r.data.payload) || null }) };
    } catch (e) {
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ data: null }) };
    }
  }

  if (method === 'POST') {
    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch (e) { body = {}; }
    const payload = body.data || body;
    try {
      await coll.doc('campus').set({ payload: payload, t: Date.now() });
    } catch (e) {
      await coll.add({ _id: 'campus', payload: payload, t: Date.now() });
    }
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, t: Date.now() }) };
  }

  return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: '只支持 GET / POST' }) };
};
