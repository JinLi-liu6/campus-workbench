/**
 * 校区 AI 工作台 · 云端同步接口（Cloudflare Worker 版）
 * 免费额度：请求 10 万次/天，KV 读 10 万次/天、写 1000 次/天（小团队够用）
 *
 * 部署步骤（全程网页点，不用装任何软件）：
 * 1. 注册 https://dash.cloudflare.com/sign-up （只要邮箱，不用实名、不用信用卡）
 * 2. 左侧 Workers & Pages -> Create -> Create Worker -> 随便起个名 -> Deploy
 * 3. 点 Edit code，把本文件全部内容粘进去，覆盖原来的代码 -> Deploy
 * 4. 该页面 Setting -> Variables -> 添加两个：
 *      SYNC_KEY   （文本）填你自己的通信密钥，比如 campus2026
 *      DATA       （KV 命名空间）先去 Workers -> KV -> Create 建一个叫 DATA 的命名空间，再回来绑定
 * 5. Deploy 之后会得到网址，如 https://campus-sync.xxx.workers.dev
 *    -> 填到工作台「设置 → 云端同步」的接口地址里（末尾不用加 /api），密钥填 SYNC_KEY
 */
export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,x-sync-key',
      'Content-Type': 'application/json; charset=utf-8'
    };
    if (request.method === 'OPTIONS') return new Response('', { status: 204, headers: cors });

    const SYNC_KEY = env.SYNC_KEY || '123456';
    if ((request.headers.get('x-sync-key') || '') !== SYNC_KEY) {
      return new Response(JSON.stringify({ error: '密钥不对' }), { status: 403, headers: cors });
    }

    const url = new URL(request.url);
    const key = url.searchParams.get('key') || 'campus';

    if (request.method === 'GET') {
      const raw = await env.DATA.get(key);
      return new Response(JSON.stringify({ data: raw ? JSON.parse(raw) : null }), { status: 200, headers: cors });
    }

    if (request.method === 'POST') {
      let body;
      try { body = await request.json(); } catch (e) { return new Response('{"error":"格式错误"}', { status: 400, headers: cors }); }
      await env.DATA.put(key, JSON.stringify(body.data || body));
      return new Response(JSON.stringify({ ok: true, t: Date.now() }), { status: 200, headers: cors });
    }

    return new Response('{"error":"只支持 GET / POST"}', { status: 405, headers: cors });
  }
};
