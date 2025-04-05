import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // Clean existing data (optional, but good for repeatable seeds)
  await prisma.service.deleteMany({});
  console.log('Deleted existing services.');

  const service1 = await prisma.service.create({
    data: {
      title: 'Holistic Massage',
      titleEn: 'Holistic Massage',
      titleFi: 'Holistinen hieronta',
      description: 'A relaxing full body massage.',
      descriptionEn: 'A relaxing full body massage.',
      descriptionFi: 'Rentouttava kokovartalohieronta.',
      duration: 75, // minutes
      price: 85.00,
      currency: 'EUR',
      color: '#6366F1', // Indigo
      active: true,
      order: 1,
    },
  });

  const service2 = await prisma.service.create({
    data: {
      title: 'Energy Healing Session',
      titleEn: 'Energy Healing Session',
      titleFi: 'Energiahoito',
      description: 'Balancing your body\'s energy fields.',
      descriptionEn: 'Balancing your body\'s energy fields.',
      descriptionFi: 'Kehon energiakenttien tasapainotus.',
      duration: 60,
      price: 70.00,
      currency: 'EUR',
      color: '#EC4899', // Pink
      active: true,
      order: 2,
    },
  });

  const service3 = await prisma.service.create({
    data: {
      title: 'Consultation',
      titleEn: 'Consultation',
      titleFi: 'Konsultaatio',
      description: 'Initial consultation (inactive example).',
      descriptionEn: 'Initial consultation (inactive example).',
      descriptionFi: 'Alkukonsultaatio (ei aktiivinen esimerkki).',
      duration: 30,
      price: 40.00,
      currency: 'EUR',
      color: '#8B5CF6', // Violet
      active: false, // Example of an inactive service
      order: 3,
    },
  });

  // Clean existing availability settings
  await prisma.regularHours.deleteMany({});
  await prisma.specialDate.deleteMany({});
  await prisma.blockedDate.deleteMany({});
  console.log('Deleted existing availability settings.');

  // Seed Regular Hours (Example: Mon-Fri 9:00 - 17:00)
  for (let i = 1; i <= 5; i++) { // Monday to Friday
    await prisma.regularHours.create({
      data: {
        dayOfWeek: i,
        startTime: '09:00:00',
        endTime: '17:00:00',
        isAvailable: true,
      },
    });
  }
  // Example: Saturday closed
  await prisma.regularHours.create({
    data: {
      dayOfWeek: 6, // Saturday
      startTime: '00:00:00',
      endTime: '00:00:00',
      isAvailable: false,
    },
  });
    // Example: Sunday closed
  await prisma.regularHours.create({
    data: {
      dayOfWeek: 0, // Sunday
      startTime: '00:00:00',
      endTime: '00:00:00',
      isAvailable: false,
    },
  });
  console.log('Seeded regular hours.');

  // Seed Special Date (Example: Specific Saturday open 10:00 - 14:00)
  // Use a future date for relevance
  const futureSaturday = new Date();
  futureSaturday.setDate(futureSaturday.getDate() + (6 - futureSaturday.getDay() + 7) % 7 + 7); // Next non-immediate Saturday
  const specialDateStr = futureSaturday.toISOString().split('T')[0]; // YYYY-MM-DD

  await prisma.specialDate.create({
    data: {
      date: specialDateStr,
      startTime: '10:00:00',
      endTime: '14:00:00',
      isAvailable: true,
    },
  });
  console.log(`Seeded special date for ${specialDateStr}.`);

  // Seed Blocked Date (Example: A specific future Friday)
  const futureFriday = new Date();
  futureFriday.setDate(futureFriday.getDate() + (5 - futureFriday.getDay() + 7) % 7 + 14); // A Friday >2 weeks away
  const blockedDateStr = futureFriday.toISOString().split('T')[0]; // YYYY-MM-DD

  await prisma.blockedDate.create({
    data: {
      date: blockedDateStr,
      reason: 'Team training day',
    },
  });
  console.log(`Seeded blocked date for ${blockedDateStr}.`);

  console.log(`Seeding finished.`);
  console.log({ service1, service2, service3 });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 