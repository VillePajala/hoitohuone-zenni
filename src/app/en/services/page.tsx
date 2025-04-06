import { generateMetadata } from '@/utils/metadata';
import { generateServiceSchema } from '@/utils/structuredData';
import StructuredData from '@/components/StructuredData';
import ServicesContent from '@/components/ServicesContent';

export const metadata = generateMetadata({
  title: 'Services - Energy Healing and Wellness Treatments',
  description: 'Explore our diverse range of energy healing and wellness services. We offer personalized treatments for stress, fatigue, and body balancing in Helsinki.',
  path: '/services',
  locale: 'en'
});

const services = [
  {
    title: 'Energy Healing',
    description:
      'Energy healing is a holistic treatment method that helps balance your body\'s energy flows. During the treatment, I work in your energy field to remove blockages and restore natural energy flow. The treatment can help with various physical and emotional challenges.',
    duration: '60 min',
    price: '75€',
    benefits: [
      'Stress relief',
      'Better sleep quality',
      'Pain relief',
      'Emotional balance',
      'Increased energy levels',
    ],
  },
  {
    title: 'Reiki Treatment',
    description:
      'Reiki is a Japanese energy healing method that promotes relaxation and reduces stress. As a certified Reiki practitioner, I channel universal life energy through gentle touch to support your body\'s natural healing ability.',
    duration: '60 min',
    price: '75€',
    benefits: [
      'Deep relaxation',
      'Stress and anxiety relief',
      'Energy balance',
      'Mental clarity',
      'Overall wellbeing',
    ],
  },
  {
    title: 'Distance Healing',
    description:
      'Distance healing allows you to receive energy healing from the comfort of your home. Energy is not bound by physical distance, making this an effective alternative to in-person treatment.',
    duration: '45 min',
    price: '65€',
    benefits: [
      'Treatment from home',
      'Same benefits as in-person',
      'No travel needed',
      'Flexible scheduling',
      'Perfect for remote clients',
    ],
  },
];

const translations = {
  title: 'Services',
  subtitle: 'Explore our healing services designed to support your wellbeing. Each treatment is tailored to your individual needs.',
  bookNow: 'Book Now',
  contact: 'Contact Us',
  bookService: 'Book This Treatment',
  experienceService: 'Want to experience the benefits of {service}? Book your appointment now or contact us for more information.',
  faqTitle: 'Have Questions?',
  faqDescription: 'Find answers to common questions about our services and treatments in our FAQ section.',
  viewFaq: 'View FAQ',
  benefits: 'Benefits'
};

export default function ServicesPage() {
  const serviceSchema = generateServiceSchema({
    name: 'Energy Healing',
    description: 'Personalized energy healing for stress, fatigue, and body balancing',
    price: '85.00',
    duration: 'PT1H'
  });

  return (
    <>
      <StructuredData data={serviceSchema} />
      <ServicesContent
        services={services}
        translations={translations}
        locale="en"
      />
    </>
  );
} 