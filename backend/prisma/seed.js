import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  // Ensure a user exists
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'demo@local',
        nickname: 'Demo',
        full_name: 'Demo User',
        subscription_tier: 'free',
      },
    });
  }

  // Courses
  const existingCourses = await prisma.course.findMany();
  if (existingCourses.length === 0) {
    await prisma.course.createMany({
      data: [
        {
          cover_image: 'https://picsum.photos/seed/course1/400/200',
          title: '青少年情绪管理入门',
          partner_name: 'Eunoia Academy',
          description: '系统学习如何识别与管理情绪',
          total_lessons: 12,
          plus_trial_lessons: 3,
          free_trial_lessons: 1,
          price: 199,
          plus_discount: 0.1,
          is_featured: true,
        },
        {
          cover_image: 'https://picsum.photos/seed/course2/400/200',
          title: '压力缓解与学习效率',
          partner_name: 'MindLab',
          description: '改善专注与提升学习效率的方法',
          total_lessons: 10,
          plus_trial_lessons: 2,
          free_trial_lessons: 1,
          price: 149,
          plus_discount: 0.1,
          is_featured: true,
        },
      ],
    });
  }

  // Sample posts
  const existingPosts = await prisma.post.findMany();
  if (existingPosts.length === 0) {
    await prisma.post.createMany({
      data: [
        {
          title: '今天有点焦虑',
          content: '感觉作业好多，不知道从哪里下手',
          category: 'Treehole',
          image_url: null,
          tagsJson: JSON.stringify(['学习', '焦虑']),
          likedByJson: JSON.stringify([]),
          created_by: user.email,
        },
        {
          title: '分享一个缓解压力的小方法',
          content: '呼吸练习和番茄钟很有效！',
          category: 'Support Center',
          image_url: null,
          tagsJson: JSON.stringify(['压力', '方法']),
          likedByJson: JSON.stringify([]),
          created_by: user.email,
        },
      ],
    });
  }

  // Chat style sample
  const styleCount = await prisma.chatStyle.count();
  if (styleCount === 0) {
    await prisma.chatStyle.create({
      data: {
        name: '暖心陪伴',
        avatar: '🤗',
        personality: '温暖共情',
        background: '陪伴型',
        dialogue_style: '短句、温柔、肯定',
        is_default: true,
        is_imported: false,
        created_by: user.email,
      },
    });
  }

  console.log('Seed completed');
}

run().finally(async () => {
  await prisma.$disconnect();
});