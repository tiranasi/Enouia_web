import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Local uploads
try { fs.mkdirSync(path.join(process.cwd(), 'uploads'), { recursive: true }); } catch {}
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Helper: normalize entity name to model
const entityMap = {
  Post: 'post',
  Comment: 'comment',
  Notification: 'notification',
  Favorite: 'favorite',
  ChatHistory: 'chatHistory',
  ChatStyle: 'chatStyle',
  EmotionReport: 'emotionReport',
  TrendAnalysis: 'trendAnalysis',
  Course: 'course',
};

// Helpers: JSON field transformation
function parseJsonSafe(val, fallback = null) {
  if (typeof val !== 'string' || val.length === 0) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}

function toFrontend(entity, item) {
  if (!item) return item;
  const x = { ...item };
  switch (entity) {
    case 'Post':
      x.tags = parseJsonSafe(item.tagsJson, []);
      x.liked_by = parseJsonSafe(item.likedByJson, []);
      x.shared_style_data = parseJsonSafe(item.sharedStyleDataJson, null);
      delete x.tagsJson; delete x.likedByJson; delete x.sharedStyleDataJson;
      break;
    case 'EmotionReport':
      x.selected_chats = parseJsonSafe(item.selectedChatsJson, []);
      x.analysis_result = parseJsonSafe(item.analysisResultJson, null);
      delete x.selectedChatsJson; delete x.analysisResultJson;
      break;
    case 'TrendAnalysis':
      x.selected_reports = parseJsonSafe(item.selectedReportsJson, []);
      x.trend_result = parseJsonSafe(item.trendResultJson, null);
      delete x.selectedReportsJson; delete x.trendResultJson;
      break;
    case 'ChatHistory':
      x.messages = parseJsonSafe(item.messagesJson, []);
      delete x.messagesJson;
      break;
    default:
      break;
  }
  return x;
}

function fromFrontend(entity, data) {
  const d = { ...data };
  switch (entity) {
    case 'Post':
      if (Array.isArray(d.tags)) d.tagsJson = JSON.stringify(d.tags);
      if (Array.isArray(d.liked_by)) d.likedByJson = JSON.stringify(d.liked_by);
      if (d.shared_style_data && typeof d.shared_style_data === 'object') d.sharedStyleDataJson = JSON.stringify(d.shared_style_data);
      // Normalize optional numeric fields coming from UI (Select returns string)
      if (d.shared_style_id !== undefined) {
        const n = Number(d.shared_style_id);
        d.shared_style_id = Number.isFinite(n) ? n : null;
      }
      delete d.tags; delete d.liked_by; delete d.shared_style_data;
      break;
    case 'Notification':
      // Ensure numeric post_id is properly typed
      if (d.post_id !== undefined) {
        const n = Number(d.post_id);
        d.post_id = Number.isFinite(n) ? n : null;
      }
      break;
    case 'EmotionReport':
      if (Array.isArray(d.selected_chats)) d.selectedChatsJson = JSON.stringify(d.selected_chats);
      if (d.analysis_result && typeof d.analysis_result === 'object') d.analysisResultJson = JSON.stringify(d.analysis_result);
      delete d.selected_chats; delete d.analysis_result;
      break;
    case 'TrendAnalysis':
      if (Array.isArray(d.selected_reports)) d.selectedReportsJson = JSON.stringify(d.selected_reports);
      if (d.trend_result && typeof d.trend_result === 'object') d.trendResultJson = JSON.stringify(d.trend_result);
      delete d.selected_reports; delete d.trend_result;
      break;
    case 'ChatHistory':
      if (Array.isArray(d.messages)) d.messagesJson = JSON.stringify(d.messages);
      delete d.messages;
      break;
    default:
      break;
  }
  return d;
}

// Auth
const JWT_SECRET = process.env.JWT_SECRET || 'dev_local_secret_change_me';
function authRequired(req, res, next) {
  const auth = req.headers['authorization'] || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return res.status(401).send('Unauthorized');
  try {
    const payload = jwt.verify(m[1], JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    return res.status(401).send('Unauthorized');
  }
}

app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).send('Missing email or password');
  const exist = await prisma.user.findUnique({ where: { email } });
  if (exist) return res.status(409).send('Email already registered');
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, password_hash: hash, subscription_tier: 'free' } });
  res.json({ id: user.id, email: user.email });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).send('Missing email or password');
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password_hash) return res.status(401).send('Invalid credentials');
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).send('Invalid credentials');
  const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

app.get('/api/me', authRequired, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).send('User not found');
  res.json(user);
});

app.put('/api/me', authRequired, async (req, res) => {
  const { password, password_hash, email, ...rest } = req.body || {};
  const updated = await prisma.user.update({ where: { id: req.user.id }, data: rest });
  res.json(updated);
});

// Public profile by email (authenticated to prevent scraping)
app.get('/api/users/by-email/:email', authRequired, async (req, res) => {
  const email = req.params.email;
  if (!email || typeof email !== 'string') return res.status(400).send('Invalid email');
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).send('User not found');
  // Whitelist public profile fields
  const profile = {
    id: user.id,
    email: user.email,
    nickname: user.nickname || null,
    full_name: user.full_name || null,
    avatar_url: user.avatar_url || null,
    bio: user.bio || null,
  };
  res.json(profile);
});

// Generic entity list/create
app.get('/api/entities/:entity', authRequired, async (req, res) => {
  const { entity } = req.params;
  const model = entityMap[entity];
  if (!model) return res.status(404).send('Unknown entity');
  const { order, limit } = req.query;
  let orderBy = undefined;
  const validOrder = order && order !== 'undefined' && order !== 'null' && order !== '' ? order : undefined;
  if (validOrder) {
    const desc = validOrder.startsWith('-');
    const field = desc ? validOrder.slice(1) : validOrder;
    orderBy = { [field]: desc ? 'desc' : 'asc' };
  }
  const validLimit = limit && limit !== 'undefined' && limit !== 'null' && limit !== '' ? Number(limit) : undefined;
  const where = {};
  if (['favorite','chatHistory','chatStyle','emotionReport','trendAnalysis'].includes(model)) {
    where.created_by = req.user.email;
  } else if (model === 'notification') {
    where.recipient_email = req.user.email;
  }
  const items = await prisma[model].findMany({
    where,
    orderBy,
    take: Number.isFinite(validLimit) ? validLimit : undefined,
  });
  res.json(items.map((it) => toFrontend(entity, it)));
});

app.post('/api/entities/:entity', authRequired, async (req, res) => {
  const { entity } = req.params;
  const model = entityMap[entity];
  if (!model) return res.status(404).send('Unknown entity');
  const payload = fromFrontend(entity, req.body);
  // Only attach created_by for models that actually have this field
  const modelsWithCreatedBy = new Set(['post','favorite','chatHistory','chatStyle','emotionReport','trendAnalysis','comment']);
  if (payload && payload.created_by === undefined && modelsWithCreatedBy.has(model)) {
    payload.created_by = req.user.email;
  }
  const created = await prisma[model].create({ data: payload });
  res.json(toFrontend(entity, created));
});

app.put('/api/entities/:entity/:id', authRequired, async (req, res) => {
  const { entity, id } = req.params;
  const model = entityMap[entity];
  if (!model) return res.status(404).send('Unknown entity');
  const payload = fromFrontend(entity, req.body);
  const updated = await prisma[model].update({ where: { id: Number(id) }, data: payload });
  res.json(toFrontend(entity, updated));
});

app.delete('/api/entities/:entity/:id', authRequired, async (req, res) => {
  const { entity, id } = req.params;
  const model = entityMap[entity];
  if (!model) return res.status(404).send('Unknown entity');
  // Special delete logic for ChatStyle: if author deletes original style,
  // mark all imported copies as deleted_by_author in a transaction.
  if (model === 'chatStyle') {
    const styleId = Number(id);
    const style = await prisma.chatStyle.findUnique({ where: { id: styleId } });
    if (!style) return res.sendStatus(204);
    // Only cascade when deleting an original style (not an imported copy)
    if (!style.is_imported) {
      await prisma.$transaction([
        prisma.chatStyle.updateMany({
          where: { original_style_id: styleId },
          data: { is_deleted_by_author: true },
        }),
        prisma.chatStyle.delete({ where: { id: styleId } }),
      ]);
      return res.sendStatus(204);
    }
    // If deleting an imported copy, just delete it
    await prisma.chatStyle.delete({ where: { id: styleId } });
    return res.sendStatus(204);
  }
  // Default delete for other entities
  await prisma[model].delete({ where: { id: Number(id) } });
  res.sendStatus(204);
});

// Precise existence/status check for ChatStyle by id
app.get('/api/entities/ChatStyle/:id', authRequired, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).send('Invalid id');
  const style = await prisma.chatStyle.findUnique({ where: { id } });
  if (!style) return res.json({ exists: false });
  // Do not leak full content; only return status and essential metadata
  const status = {
    exists: true,
    is_deleted_by_author: !!style.is_deleted_by_author,
    is_imported: !!style.is_imported,
    author_email: style.created_by,
    name: style.name,
    is_accessible: style.created_by === (req.user?.email || ''),
  };
  return res.json(status);
});

// LLM stub
app.post('/api/integrations/core/invokeLLM', async (req, res) => {
  const { prompt, response_json_schema, model } = req.body || {};
  const apiKey = process.env.ZHIPU_API_KEY || '924d79a437dc4995aba6e4be987895e1.r1UQBsHSoY0zFZAo';
  const usedModel = model || 'glm-4.5-flash';

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).send('Missing prompt');
  }

  const systemMsgForJson = response_json_schema
    ? `你是一个严谨的助手。请严格按照以下JSON结构返回结果，不要输出任何解释或多余文本：\n${JSON.stringify(response_json_schema)}`
    : null;

  const messages = [];
  if (systemMsgForJson) {
    messages.push({ role: 'system', content: systemMsgForJson });
  }
  messages.push({ role: 'user', content: prompt });

  try {
    const resp = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: usedModel, messages }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      const msg = data?.error?.message || data?.msg || 'LLM request failed';
      return res.status(500).send(msg);
    }

    const content = data?.choices?.[0]?.message?.content;
    if (response_json_schema) {
      // Try to parse JSON content
      let parsed = null;
      try {
        parsed = typeof content === 'string' ? JSON.parse(content) : content;
      } catch (e) {
        // attempt to extract JSON substring
        if (typeof content === 'string') {
          const start = content.indexOf('{');
          const end = content.lastIndexOf('}');
          if (start !== -1 && end !== -1 && end > start) {
            const jsonStr = content.slice(start, end + 1);
            try { parsed = JSON.parse(jsonStr); } catch { /* ignore */ }
          }
        }
      }
      if (!parsed || typeof parsed !== 'object') {
        // Fallback: wrap original content in a known shape
        parsed = { raw_text: content || '', parse_error: true };
      }
      return res.json(parsed);
    }

    // Return plain string content for normal chat or quotes
    return res.json(content || '');
  } catch (err) {
    console.error('InvokeLLM error:', err);
    return res.status(500).send('InvokeLLM internal error');
  }
});

// Local upload (multipart)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(process.cwd(), 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '') || '';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(png|jpeg|jpg|gif|webp)$/i.test(file.mimetype);
    cb(ok ? null : new Error('Invalid file type'), ok);
  },
});
app.post('/api/integrations/core/uploadFile', authRequired, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('No file');
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ file_url: url });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server listening on http://0.0.0.0:${PORT}`);
});
