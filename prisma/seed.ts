import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.booking.deleteMany();
  await prisma.service.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.blockedDate.deleteMany();

  // Create services
  const energyHealing = await prisma.service.create({
    data: {
      name: 'Energy Healing',
      nameEn: 'Energy Healing',
      nameFi: 'Energiahoito',
      description: 'A holistic treatment that helps balance your body\'s energy flows and promotes overall wellbeing.',
      descriptionEn: 'A holistic treatment that helps balance your body\'s energy flows and promotes overall wellbeing.',
      descriptionFi: 'Kokonaisvaltainen hoito, joka auttaa tasapainottamaan kehon energiavirtauksia ja edistää hyvinvointia.',
      duration: 60,
      price: 75.0,
      currency: 'EUR',
      active: true,
    },
  });

  const reikiHealing = await prisma.service.create({
    data: {
      name: 'Reiki Healing',
      nameEn: 'Reiki Healing',
      nameFi: 'Reiki-hoito',
      description: 'Traditional Japanese energy healing that promotes relaxation and reduces stress.',
      descriptionEn: 'Traditional Japanese energy healing that promotes relaxation and reduces stress.',
      descriptionFi: 'Perinteinen japanilainen energiahoito, joka edistää rentoutumista ja vähentää stressiä.',
      duration: 60,
      price: 75.0,
      currency: 'EUR',
      active: true,
    },
  });

  const distanceHealing = await prisma.service.create({
    data: {
      name: 'Distance Healing',
      nameEn: 'Distance Healing',
      nameFi: 'Etähoito',
      description: 'Experience the benefits of energy healing from the comfort of your own home.',
      descriptionEn: 'Experience the benefits of energy healing from the comfort of your own home.',
      descriptionFi: 'Koe energiahoidon hyödyt oman kotisi mukavuudesta.',
      duration: 45,
      price: 65.0,
      currency: 'EUR',
      active: true,
    },
  });

  // Create availability (Monday-Friday, 10:00-18:00)
  const weekdayAvailability = [1, 2, 3, 4, 5]; // Monday to Friday
  
  for (const dayOfWeek of weekdayAvailability) {
    await prisma.availability.create({
      data: {
        dayOfWeek,
        startTime: '10:00',
        endTime: '18:00',
        isAvailable: true,
      },
    });
  }

  // Create availability for Saturday (10:00-14:00)
  await prisma.availability.create({
    data: {
      dayOfWeek: 6, // Saturday
      startTime: '10:00',
      endTime: '14:00',
      isAvailable: true,
    },
  });

  // Block some dates (e.g., holidays)
  const christmasEve = new Date();
  christmasEve.setMonth(11); // December
  christmasEve.setDate(24);
  christmasEve.setHours(0, 0, 0, 0);

  await prisma.blockedDate.create({
    data: {
      date: christmasEve,
      reason: 'Christmas Eve',
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 