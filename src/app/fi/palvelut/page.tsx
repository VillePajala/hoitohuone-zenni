import { generateMetadata } from '@/utils/metadata';
import { generateServiceSchema } from '@/utils/structuredData';
import StructuredData from '@/components/StructuredData';
import ServicesContent from '@/components/ServicesContent';

export const metadata = generateMetadata({
  title: 'Palvelut - Energiahoidot ja Hyvinvointipalvelut',
  description: 'Tutustu monipuolisiin energiahoitoihimme ja hyvinvointipalveluihimme. Tarjoamme yksilöllisiä hoitoja stressiin, uupumukseen ja kehon tasapainottamiseen Helsingissä.',
  path: '/palvelut',
  locale: 'fi'
});

const services = [
  {
    title: 'Energiahoito',
    description:
      'Energiahoito on kokonaisvaltainen hoitomenetelmä, joka auttaa tasapainottamaan kehosi energiavirtauksia. Hoidon aikana työskentelen energiakentässäsi poistaakseni tukoksia ja palauttaakseni luonnollisen energian virtauksen. Hoito voi auttaa erilaisissa fyysisissä ja emotionaalisissa haasteissa.',
    duration: '60 min',
    price: '75€',
    benefits: [
      'Stressin lievitys',
      'Parempi unenlaatu',
      'Kivun lievitys',
      'Tunne-elämän tasapaino',
      'Lisääntynyt energiataso',
    ],
  },
  {
    title: 'Reikihoito',
    description:
      'Reiki on japanilainen energiahoitomuoto, joka edistää rentoutumista ja vähentää stressiä. Sertifioituna Reiki-hoitajana kanavoin universaalia elämänenergiaa lempeän kosketuksen kautta tukemaan kehosi luonnollista paranemiskykyä.',
    duration: '60 min',
    price: '75€',
    benefits: [
      'Syvä rentoutuminen',
      'Stressin ja ahdistuksen lievitys',
      'Energiatasapaino',
      'Mielen selkeys',
      'Kokonaisvaltainen hyvinvointi',
    ],
  },
  {
    title: 'Etähoito',
    description:
      'Etähoito mahdollistaa energiahoidon vastaanottamisen kotisi mukavuudesta. Energia ei ole sidottu fyysiseen etäisyyteen, mikä tekee tästä tehokkaan vaihtoehdon paikan päällä tapahtuvalle hoidolle.',
    duration: '45 min',
    price: '65€',
    benefits: [
      'Hoito kotoa käsin',
      'Samat hyödyt kuin paikan päällä',
      'Ei matkustamista',
      'Joustava aikataulutus',
      'Täydellinen etäasiakkaille',
    ],
  },
];

const translations = {
  title: 'Palvelut',
  subtitle: 'Tutustu hoitopalveluihimme, jotka on suunniteltu tukemaan hyvinvointiasi. Jokainen hoito räätälöidään yksilöllisten tarpeidesi mukaan.',
  bookNow: 'Varaa aika',
  contact: 'Ota yhteyttä',
  bookService: 'Varaa tämä hoito',
  experienceService: 'Haluatko kokea {service}n hyödyt? Varaa aikasi nyt tai ota yhteyttä lisätietoja varten.',
  faqTitle: 'Onko sinulla kysyttävää?',
  faqDescription: 'Löydä vastaukset yleisimpiin kysymyksiin palveluistamme ja hoidoista UKK-osiostamme.',
  viewFaq: 'Katso UKK',
  benefits: 'Hyödyt'
};

export default function ServicesPage() {
  const serviceSchema = generateServiceSchema({
    name: 'Energiahoito',
    description: 'Yksilöllinen energiahoito stressiin, uupumukseen ja kehon tasapainottamiseen',
    price: '85.00',
    duration: 'PT1H'
  });

  return (
    <>
      <StructuredData data={serviceSchema} />
      <ServicesContent
        services={services}
        translations={translations}
        locale="fi"
      />
    </>
  );
} 