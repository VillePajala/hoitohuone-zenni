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

  // Create test bookings
  // Today
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of day for the date field
  
  // Create a copy for time operations
  const todayStart = new Date(today);
  todayStart.setHours(10, 0, 0, 0);
  
  const todayEnd = new Date(today);
  todayEnd.setHours(11, 0, 0, 0);
  
  // Tomorrow
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0); // Set to start of day for the date field
  
  const tomorrowStart = new Date(tomorrow);
  tomorrowStart.setHours(14, 0, 0, 0);
  
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(15, 0, 0, 0);
  
  // Day after tomorrow
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  dayAfterTomorrow.setHours(0, 0, 0, 0); // Set to start of day for the date field
  
  const dayAfterTomorrowStart = new Date(dayAfterTomorrow);
  dayAfterTomorrowStart.setHours(12, 0, 0, 0);
  
  const dayAfterTomorrowEnd = new Date(dayAfterTomorrow);
  dayAfterTomorrowEnd.setHours(13, 0, 0, 0);

  console.log('Creating bookings with these dates:');
  console.log('Today:', today);
  console.log('Today start:', todayStart);
  console.log('Today end:', todayEnd);

  // Create a confirmed booking for today
  await prisma.booking.create({
    data: {
      serviceId: energyHealing.id,
      customerName: 'Matti Meikäläinen',
      customerEmail: 'matti@example.com',
      customerPhone: '+358401234567',
      date: today,
      startTime: todayStart,
      endTime: todayEnd,
      status: 'confirmed',
      language: 'fi',
      notes: 'First time client'
    },
  });

  // Create a confirmed booking for tomorrow
  await prisma.booking.create({
    data: {
      serviceId: reikiHealing.id,
      customerName: 'Liisa Virtanen',
      customerEmail: 'liisa@example.com',
      customerPhone: '+358407654321',
      date: tomorrow,
      startTime: tomorrowStart,
      endTime: tomorrowEnd,
      status: 'confirmed',
      language: 'fi'
    },
  });

  // Create a cancelled booking
  await prisma.booking.create({
    data: {
      serviceId: distanceHealing.id,
      customerName: 'John Smith',
      customerEmail: 'john@example.com',
      customerPhone: '+358409876543',
      date: dayAfterTomorrow,
      startTime: dayAfterTomorrowStart,
      endTime: dayAfterTomorrowEnd,
      status: 'cancelled',
      language: 'en',
      notes: 'Cancelled due to illness'
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