import { PrismaClient } from '@prisma/client';
import { normalizeUploadUrl, normalizeSharedStyleData } from '../src/utils/uploads.js';

const prisma = new PrismaClient();

function parseJsonSafe(val) {
  if (typeof val !== 'string' || val.length === 0) return null;
  try {
    return JSON.parse(val);
  } catch {
    return null;
  }
}

async function applyUpdates(ops, label) {
  if (!ops.length) return 0;
  console.log(`Applying ${ops.length} ${label} fixes...`);
  for (const op of ops) {
    await op;
  }
  return ops.length;
}

async function run() {
  let total = 0;

  const userOps = [];
  const users = await prisma.user.findMany({ select: { id: true, avatar_url: true } });
  for (const user of users) {
    const avatar = normalizeUploadUrl(user.avatar_url);
    if (avatar !== user.avatar_url) {
      userOps.push(prisma.user.update({ where: { id: user.id }, data: { avatar_url: avatar } }));
    }
  }
  total += await applyUpdates(userOps, 'user');

  const postOps = [];
  const posts = await prisma.post.findMany({ select: { id: true, image_url: true, sharedStyleDataJson: true } });
  for (const post of posts) {
    const data = {};
    const imageUrl = normalizeUploadUrl(post.image_url);
    if (imageUrl !== post.image_url) data.image_url = imageUrl;
    if (post.sharedStyleDataJson) {
      const shared = parseJsonSafe(post.sharedStyleDataJson);
      const normalizedShared = normalizeSharedStyleData(shared);
      if (normalizedShared && normalizedShared !== shared) {
        data.sharedStyleDataJson = JSON.stringify(normalizedShared);
      }
    }
    if (Object.keys(data).length) {
      postOps.push(prisma.post.update({ where: { id: post.id }, data }));
    }
  }
  total += await applyUpdates(postOps, 'post');

  const styleOps = [];
  const styles = await prisma.chatStyle.findMany({ select: { id: true, avatar: true } });
  for (const style of styles) {
    const avatar = normalizeUploadUrl(style.avatar);
    if (avatar !== style.avatar) {
      styleOps.push(prisma.chatStyle.update({ where: { id: style.id }, data: { avatar } }));
    }
  }
  total += await applyUpdates(styleOps, 'chat style');

  const historyOps = [];
  const histories = await prisma.chatHistory.findMany({ select: { id: true, style_avatar: true } });
  for (const history of histories) {
    const avatar = normalizeUploadUrl(history.style_avatar);
    if (avatar !== history.style_avatar) {
      historyOps.push(prisma.chatHistory.update({ where: { id: history.id }, data: { style_avatar: avatar } }));
    }
  }
  total += await applyUpdates(historyOps, 'chat history');

  const courseOps = [];
  const courses = await prisma.course.findMany({ select: { id: true, cover_image: true } });
  for (const course of courses) {
    const cover = normalizeUploadUrl(course.cover_image);
    if (cover !== course.cover_image) {
      courseOps.push(prisma.course.update({ where: { id: course.id }, data: { cover_image: cover } }));
    }
  }
  total += await applyUpdates(courseOps, 'course');

  if (total === 0) {
    console.log('No URL fixes needed.');
  } else {
    console.log(`URL fixes completed (${total} updates).`);
  }
}

run().finally(async () => {
  await prisma.$disconnect();
});
