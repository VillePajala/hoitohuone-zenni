'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function FaqPage() {
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const [openQuestions, setOpenQuestions] = useState<number[]>([]);

  const toggleQuestion = (index: number) => {
    setOpenQuestions((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  const faqCategories = [
    {
      title: 'General Questions',
      questions: [
        {
          question: 'What is energy healing?',
          answer:
            'Energy healing is a holistic practice that works with the body\'s energy fields to remove blocks and promote physical, emotional, and spiritual well-being. It\'s based on the principle that everything is made of energy, and by balancing this energy, we can support the body\'s natural healing abilities.',
        },
        {
          question: 'Is energy healing safe?',
          answer:
            'Yes, energy healing is completely safe and non-invasive. It\'s a gentle and natural approach that can be used alongside conventional medical treatments. However, it\'s important to note that energy healing is not a substitute for medical care.',
        },
        {
          question: 'Do I need to believe in energy healing for it to work?',
          answer:
            'No, you don\'t need to believe in energy healing for it to be effective. While having an open mind can enhance your experience, the energy will flow and work regardless of your beliefs. Many skeptics have reported positive results after trying energy healing.',
        },
      ],
    },
    {
      title: 'Treatment Information',
      questions: [
        {
          question: 'What happens during a session?',
          answer:
            'During a session, you\'ll lie fully clothed on a treatment table while the practitioner works with your energy field. You might feel sensations like warmth, tingling, or deep relaxation. Sessions typically last 60 minutes, including a brief consultation before and after the treatment.',
        },
        {
          question: 'How many sessions do I need?',
          answer:
            'The number of sessions varies depending on your individual needs and goals. Some people feel significant benefits after one session, while others prefer regular treatments as part of their wellness routine. We\'ll discuss a recommended treatment plan during your first visit.',
        },
        {
          question: 'How should I prepare for a session?',
          answer:
            'Wear comfortable, loose-fitting clothing. Avoid heavy meals before the session, and try to arrive in a calm state. It\'s helpful to set an intention for your healing but not necessary. Avoid alcohol or recreational drugs for 24 hours before the session.',
        },
      ],
    },
    {
      title: 'Distance Healing',
      questions: [
        {
          question: 'How does distance healing work?',
          answer:
            'Distance healing works on the principle that energy is not limited by physical distance. The practitioner connects with your energy field remotely at an agreed time. Many clients report the same benefits as in-person sessions.',
        },
        {
          question: 'What do I need for a distance healing session?',
          answer:
            'You\'ll need a quiet space where you won\'t be disturbed, and a comfortable place to lie down or sit. We\'ll connect via phone or video call briefly before the session, then you can relax during the treatment.',
        },
      ],
    },
    {
      title: 'Practical Information',
      questions: [
        {
          question: 'How do I book a session?',
          answer:
            'You can book a session through our online booking system, by phone, or by email. We\'ll confirm your appointment and send you all necessary information, including preparation guidelines.',
        },
        {
          question: 'What is your cancellation policy?',
          answer:
            'We require 24 hours notice for cancellations. Late cancellations or no-shows may be charged the full session fee. We understand that emergencies happen and handle these situations case by case.',
        },
        {
          question: 'Do you offer gift certificates?',
          answer:
            'Yes, we offer gift certificates for all our services. They can be purchased online or at our location and are valid for six months from the date of purchase.',
        },
      ],
    },
  ];

  return (
    <div className="py-24 space-y-24">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto fade-in">
          <h1 className="text-5xl font-serif mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-neutral-600">
            Find answers to common questions about energy healing and our services.
            Can't find what you're looking for? Feel free to contact us.
          </p>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-16">
          {faqCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="fade-in">
              <h2 className="text-3xl font-serif mb-8">{category.title}</h2>
              <div className="space-y-4">
                {category.questions.map((faq, questionIndex) => {
                  const index = categoryIndex * 10 + questionIndex;
                  const isOpen = openQuestions.includes(index);
                  return (
                    <div
                      key={questionIndex}
                      className="border border-neutral-200 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleQuestion(index)}
                        className="w-full flex justify-between items-center p-6 text-left hover:bg-neutral-50 transition-colors"
                      >
                        <span className="font-medium">{faq.question}</span>
                        <svg
                          className={`h-6 w-6 transform transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      {isOpen && (
                        <div className="p-6 pt-0 text-neutral-600">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-neutral-50 rounded-lg p-12 text-center fade-in">
          <h2 className="text-3xl font-serif mb-4">Still Have Questions?</h2>
          <p className="text-neutral-600 max-w-2xl mx-auto mb-8">
            We're here to help. Contact us directly and we'll be happy to answer
            any questions you may have about our services.
          </p>
          <Link
            href="/en/contact"
            className="inline-block bg-neutral-900 text-white px-8 py-4 rounded-md hover:bg-neutral-800 transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  );
} 