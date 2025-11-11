import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function normalize(u) {
  if (!u || typeof u !== 'string') return u;
  const m = u.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/uploads\/(.+)$/i);
  if (m) return `/api/uploads/${m[3]}`;
  if (u.startsWith('/uploads/')) return `/api/uploads/${u.slice('/uploads/'.length)}`;
  return u;
}

async function run() {
  const updates = [];

  // Users
  const users = await prisma.user.findMany({});
  for (const u of users) {
    const v = normalize(u.avatar_url);
    if (v !== u.avatar_url) {
      updates.push(prisma.user.update({ where: { id: u.id }, data: { avatar_url: v } }));
    }
  }

  // Posts
  const posts = await prisma.post.findMany({});
  for (const p of posts) {
    const v = normalize(p.image_url);
    if (v !== p.image_url) {
      updates.push(prisma.post.update({ where: { id: p.id }, data: { image_url: v } }));
    }
  }

  // ChatStyle
  const styles = await prisma.chatStyle.findMany({});
  for (const s of styles) {
    const v = normalize(s.avatar);
    if (v !== s.avatar) {
      updates.push(prisma.chatStyle.update({ where: { id: s.id }, data: { avatar: v } }));
    }
  }

  // ChatHistory
  const chats = await prisma.chatHistory.findMany({});
  for (const c of chats) {
    const v = normalize(c.style_avatar);
    if (v !== c.style_avatar) {
      updates.push(prisma.chatHistory.update({ where: { id: c.id }, data: { style_avatar: v } }));
    }
  }

  // Course
  const courses = await prisma.course.findMany({});
  for (const c of courses) {
    const v = normalize(c.cover_image);
    if (v !== c.cover_image) {
      updates.push(prisma.course.update({ where: { id: c.id }, data: { cover_image: v } }));
    }
  }

  if (updates.length) {
    console.log(`Applying ${updates.length} URL fixes...`);
    for (const op of updates) {
      await op;
    }
    console.log('URL fix completed.');
  } else {
    console.log('No URL fixes needed.');
  }
}

run().finally(async () => {
  await prisma.$disconnect();
});