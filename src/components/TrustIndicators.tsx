import { motion } from 'framer-motion';

const indicators = [
  {
    icon: 'verified_user',
    title: 'Lead-Free Crystal',
    desc: 'Meeting the highest EU safety and sustainability standards for residential and hospitality usage.',
  },
  {
    icon: 'eco',
    title: 'Sustainable Logistics',
    desc: 'CO2-neutral shipping lanes and 100% recyclable, plastic-free industrial packaging solutions.',
  },
  {
    icon: 'precision_manufacturing',
    title: 'Artisanal Hand-Blown',
    desc: 'We maintain direct partnerships with small-batch workshops to ensure unique character in every SKU.',
  },
  {
    icon: 'history_edu',
    title: 'Legacy Sourcing',
    desc: 'Full transparency into factory history and social governance metrics for large-scale procurement.',
  },
];

const TrustIndicators = () => {
  return (
    <section className="bg-surface-container-low py-32 px-12">
      <div className="max-w-[1920px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-24 items-start">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            <span className="text-secondary font-semibold tracking-widest text-xs uppercase">The Provenance</span>
            <h2 className="font-headline text-4xl italic text-primary">European Quality Certified.</h2>
            <p className="text-on-surface-variant leading-relaxed">Every piece in our collection is sourced from century-old glassworks across the Czech Republic, Italy, and Poland.</p>
          </motion.div>
          <div className="space-y-8 col-span-2">
            <div className="grid grid-cols-2 gap-12">
              {indicators.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: i * 0.24, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ scale: 1.03, x: 6 }}
                  className="flex flex-col gap-4 group cursor-default"
                >
                  <div className="flex items-center gap-4">
                    <motion.span
                      whileHover={{ rotate: 12, scale: 1.2 }}
                      transition={{ type: 'spring', stiffness: 150, damping: 12 }}
                      className="material-symbols-outlined text-secondary text-4xl"
                      data-icon={item.icon}
                    >
                      {item.icon}
                    </motion.span>
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                  </div>
                  <p className="text-on-surface-variant text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustIndicators;
