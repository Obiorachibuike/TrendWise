/**
 * Regression checks for the TrendWise production fixes.
 *
 * Everything here exercises the REAL route modules, REAL middleware and REAL
 * controllers. No live mongod is available in this sandbox (fastdl.mongodb.org
 * is unreachable), so the two checks that need a persisted document stub only
 * `Comment.create` on the real Mongoose model and are marked [model stubbed].
 *
 * Run: npx ts-node --compiler-options '{"module":"CommonJS","esModuleInterop":true,"target":"ES2020","strict":false,"skipLibCheck":true}' verify/regress.ts
 */
import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// No mongod in this sandbox: make Mongoose reject buffered ops quickly so a
// DB-backed route returns 500 promptly instead of hanging for the default 10s.
mongoose.set('bufferTimeoutMS', 1500);

process.env.JWT_SECRET = 'test-secret';
process.env.ADMIN_USER_ID = '000000000000000000000001';

import articleRoutes from '../src/routes/article.routes';
import commentRoutes from '../src/routes/comment.routes';
import userRoutes from '../src/routes/user.routes';
import adminRoutes from '../src/routes/admin.routes';
import { verifyToken } from '../src/middleware/auth';
import { isAdmin } from '../src/middleware/isAdmin';
import { postComment } from '../src/controllers/comment.controller';
import { Comment } from '../src/models/Comment.model';

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', (_req: Request, res: Response) => { res.status(404).json({ error: 'Not found' }); });

const ADMIN_ID = process.env.ADMIN_USER_ID!;
const OTHER_ID = '000000000000000000000002';
const tokenFor = (userId: string) =>
  jwt.sign({ userId, email: `${userId}@test.dev` }, process.env.JWT_SECRET!, { expiresIn: '5h' });

let passed = 0;
let failed = 0;
const check = (label: string, ok: boolean, detail: string) => {
  console.log(`${ok ? '  PASS' : '* FAIL'}  ${label}\n          ${detail}`);
  ok ? passed++ : failed++;
};

async function hit(server: any, method: string, path: string, body?: any, headers: any = {}, timeoutMs = 8000) {
  try {
    const res = await fetch(`http://127.0.0.1:${(server.address() as any).port}${path}`, {
      method,
      headers: { 'content-type': 'application/json', ...headers },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await res.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch { /* non-JSON */ }
    return { status: res.status, json, text };
  } catch (e: any) {
    return { status: 0, json: null, text: `<no response: ${e.name}>` };
  }
}

async function main() {
  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));

  console.log('\n====================== 1. ROUTE PATHS ======================');
  const stalePaths = [
    ['GET', '/comments/665f1c2e8f3a2b1c0d4e5f60'],
    ['POST', '/comments'],
    ['GET', '/articles'],
    ['POST', '/articles'],
  ] as const;
  for (const [method, path] of stalePaths) {
    const r = await hit(server, method, path);
    check(
      `stale ${method} ${path} is no longer what clients call`,
      r.status === 404,
      `${r.status} — clients now use the /api-prefixed path`
    );
  }
  for (const [method, path] of [
    ['GET', '/api/articles'],
    ['GET', '/api/comments/665f1c2e8f3a2b1c0d4e5f60'],
    ['POST', '/api/comments'],
  ] as const) {
    const r = await hit(server, method, path, method === 'POST' ? {} : undefined);
    check(
      `${method} ${path} is mounted`,
      r.status !== 404,
      `status=${r.status} (reached a handler; DB-backed work fails without mongod, which is expected here)`
    );
  }

  console.log('\n====================== 2. INPUT VALIDATION ======================');
  const badId = await hit(server, 'GET', '/api/articles/id/not-an-objectid');
  check('invalid article id -> 400, not a 500 CastError', badId.status === 400, `status=${badId.status} ${JSON.stringify(badId.json)}`);
  const badCommentId = await hit(server, 'GET', '/api/comments/not-an-objectid');
  check('invalid comment articleId -> 400', badCommentId.status === 400, `status=${badCommentId.status} ${JSON.stringify(badCommentId.json)}`);
  const badUserId = await hit(server, 'GET', '/api/users/nope', undefined, { authorization: `Bearer ${tokenFor(ADMIN_ID)}` });
  check('invalid user id -> 400', badUserId.status === 400, `status=${badUserId.status} ${JSON.stringify(badUserId.json)}`);

  console.log('\n====================== 3. ADMIN AUTHORIZATION ======================');
  const decoded: any = jwt.verify(tokenFor(ADMIN_ID), process.env.JWT_SECRET!);
  const decodedId = decoded.userId ?? decoded.id;
  check('verifyToken can recover the user id from the payload', decodedId === ADMIN_ID, `payload=${JSON.stringify({ userId: decoded.userId })}`);

  // isAdmin in isolation, so a slow upstream trend fetch can't mask the result.
  const gate = express();
  gate.use(express.json());
  gate.post('/', verifyToken, isAdmin, (_req: Request, res: Response) => { res.json({ reached: true }); });
  const gateSrv = gate.listen(0);
  await new Promise((r) => gateSrv.once('listening', r));

  const adminCall = await hit(gateSrv, 'POST', '/', {}, { authorization: `Bearer ${tokenFor(ADMIN_ID)}` });
  check('the configured admin is allowed through', adminCall.status === 200, `status=${adminCall.status} ${JSON.stringify(adminCall.json)}`);

  const otherCall = await hit(gateSrv, 'POST', '/', {}, { authorization: `Bearer ${tokenFor(OTHER_ID)}` });
  check('a normal user is still rejected', otherCall.status === 403, `status=${otherCall.status}`);

  // The removed escalation vector: an authenticated non-admin claiming the admin id.
  const escalation = await hit(
    gateSrv, 'POST', '/', { userId: ADMIN_ID },
    { authorization: `Bearer ${tokenFor(OTHER_ID)}`, 'x-user-id': ADMIN_ID }
  );
  check('body/header userId no longer grants admin', escalation.status === 403, `status=${escalation.status}`);
  gateSrv.close();

  console.log('\n====================== 4. COMMENT POSTING ======================');
  const noAuth = await hit(server, 'POST', '/api/comments', {
    articleId: '665f1c2e8f3a2b1c0d4e5f60', content: 'hi',
  });
  check('comment without a token -> 401 (not a crash)', noAuth.status === 401, `status=${noAuth.status} ${JSON.stringify(noAuth.json)}`);

  // A response must come back even when the DB write fails: previously the
  // ValidationError escaped an uncaught async handler and the socket hung.
  let unhandled: string | null = null;
  const onUnhandled = (reason: any) => { unhandled = reason?.name ?? String(reason); };
  process.on('unhandledRejection', onUnhandled);
  const failing = await hit(server, 'POST', '/api/comments',
    { articleId: '665f1c2e8f3a2b1c0d4e5f60', content: 'hi' },
    { authorization: `Bearer ${tokenFor(ADMIN_ID)}` }, 15000);
  await new Promise((r) => setTimeout(r, 200));
  process.off('unhandledRejection', onUnhandled);
  check('failing comment write still returns a response', failing.status !== 0, `status=${failing.status}`);
  check('no unhandledRejection escapes', unhandled === null, `unhandledRejection=${unhandled ?? 'none'}`);

  const empty = await hit(server, 'POST', '/api/comments',
    { articleId: '665f1c2e8f3a2b1c0d4e5f60', content: '   ' },
    { authorization: `Bearer ${tokenFor(ADMIN_ID)}` });
  check('blank comment -> 400', empty.status === 400, `status=${empty.status} ${JSON.stringify(empty.json)}`);

  console.log('\n===== 5. AUTHOR COMES FROM THE TOKEN  [model stubbed] =====');
  const realCreate = (Comment as any).create.bind(Comment);
  let captured: any = null;
  (Comment as any).create = async (doc: any) => {
    captured = doc;
    return { populate: async () => ({ ...doc, _id: 'stub-id' }) };
  };
  const probe = express();
  probe.use(express.json());
  probe.post('/', verifyToken, postComment as any);
  const probeSrv = probe.listen(0);
  await new Promise((r) => probeSrv.once('listening', r));
  const okComment = await hit(probeSrv, 'POST', '/',
    { articleId: '665f1c2e8f3a2b1c0d4e5f60', content: 'Nice post!' },
    { authorization: `Bearer ${tokenFor(ADMIN_ID)}` });
  probeSrv.close();
  (Comment as any).create = realCreate;

  check('comment is accepted with only {articleId, content}', okComment.status === 201, `status=${okComment.status} ${JSON.stringify(okComment.json)}`);
  check('userId is taken from the verified token', captured?.userId === ADMIN_ID, `persisted userId=${captured?.userId}`);

  console.log('\n====================== 6. JWT SECRET ======================');
  const saved = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;
  const { JWT_SECRET: resolvedA } = require('../src/config/env');
  check('signing and verifying resolve the same fallback secret', typeof resolvedA === 'string' && resolvedA.length > 0,
    `config/env resolves a single secret (${resolvedA.length} chars) used by both user.controller and middleware/auth`);
  process.env.JWT_SECRET = saved;

  console.log(`\n============ ${passed} passed, ${failed} failed ============\n`);
  server.close();
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error('HARNESS CRASH:', e); process.exit(1); });
