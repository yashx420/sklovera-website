import { motion } from 'framer-motion';

const indicators = [
  {
    icon: 'verified_user',
    title: 'Lead-Free Crystal',
    desc: 'Meeting the highest EU safety and sustainability standards for residential and hospitality usage.',
    accent: 'from-emerald/20 to-jade/10',
  },
  {
    icon: 'eco',
    title: 'Sustainable Logistics',
    desc: 'CO2-neutral shipping lanes and 100% recyclable, plastic-free industrial packaging solutions.',
    accent: 'from-forest/20 to-emerald/10',
  },
  {
    icon: 'precision_manufacturing',
    title: 'Artisanal Hand-Blown',
    desc: 'We maintain direct partnerships with small-batch workshops to ensure unique character in every SKU.',
    accent: 'from-moss/20 to-forest-light/10',
  },
  {
    icon: 'history_edu',
    title: 'Legacy Sourcing',
    desc: 'Full transparency into factory history and social governance metrics for large-scale procurement.',
    accent: 'from-jade-dark/20 to-sage/10',
  },
];

const TrustIndicators = () => {
  return (
    <section className="relative bg-surface-container-low py-16 sm:py-24 lg:py-32 px-4 sm:px-8 lg:px-12 overflow-hidden">
      {/* Dark green accent band at top */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-forest via-emerald to-jade opacity-40" />
      
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none grain-overlay">
        {/* Soft background gradient fill */}
        <div className="absolute inset-0 opacity-[0.08] bg-gradient-to-tr from-transparent via-emerald to-transparent" />
        
        {/* Large floating orbs */}
        <div className="absolute top-[-5%] right-[-5%] w-[250px] h-[250px] sm:w-[500px] sm:h-[500px] rounded-full opacity-[0.12] animate-float-slow"
          style={{ background: 'radial-gradient(circle, #52b788 0%, transparent 70%)', filter: 'blur(30px)' }}
        />
        <div className="absolute bottom-[0%] left-[-5%] sm:left-[-10%] w-[200px] h-[200px] sm:w-[400px] sm:h-[400px] rounded-full opacity-[0.15] animate-float-medium"
          style={{ background: 'radial-gradient(circle, #2d6a4f 0%, transparent 70%)', filter: 'blur(30px)' }}
        />
        
        {/* Decorative architectural grid lines */}
        <div className="absolute inset-0 opacity-[0.08] hidden lg:block"
          style={{ backgroundImage: 'linear-gradient(rgba(45,106,79,1) 1px, transparent 1px), linear-gradient(90deg, rgba(45,106,79,1) 1px, transparent 1px)', backgroundSize: '6rem 6rem' }}
        />
        

        {/* Vertical dashed green line */}
        <div className="absolute left-[40%] top-0 bottom-0 w-px hidden lg:block"
          style={{ background: 'repeating-linear-gradient(180deg, transparent 0px, transparent 12px, rgba(45,106,79,0.25) 12px, rgba(45,106,79,0.25) 24px)' }}
        />
      </div>

      <div className="max-w-[1920px] mx-auto relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 lg:gap-24 items-start">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            <span className="inline-flex items-center gap-2 text-emerald font-semibold tracking-widest text-xs uppercase">
              <span className="w-8 h-px bg-emerald" />
              The Provenance
            </span>
            <h2 className="font-headline text-4xl italic text-primary green-accent-line pb-2">European Quality Certified.</h2>
            <p className="text-on-surface-variant leading-relaxed">Every piece in our collection is sourced from century-old glassworks across the Czech Republic, Italy, and Poland.</p>
            
            {/* Green certification badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.6 }}
              className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-forest/5 border border-emerald/10"
            >
              <span className="material-symbols-outlined text-emerald text-2xl" data-icon="workspace_premium">workspace_premium</span>
              <div>
                <div className="text-[10px] uppercase tracking-[0.15em] text-emerald font-bold">ISO 9001</div>
                <div className="text-xs text-on-surface-variant">Quality Management</div>
              </div>
            </motion.div>
          </motion.div>

          <div className="space-y-6 col-span-1 md:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
              {indicators.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: i * 0.24, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ scale: 1.03, x: 6 }}
                  className="flex flex-col gap-4 group cursor-default relative"
                >
                  {/* Green gradient accent on hover */}
                  <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${item.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500 -m-4 p-4`} />
                  
                  <div className="flex items-center gap-4 relative z-10">
                    <motion.div
                      whileHover={{ rotate: 12, scale: 1.2 }}
                      transition={{ type: 'spring', stiffness: 150, damping: 12 }}
                      className="w-12 h-12 rounded-xl bg-forest/8 flex items-center justify-center group-hover:bg-forest/15 transition-colors duration-300"
                    >
                      <span
                        className="material-symbols-outlined text-emerald text-2xl"
                        data-icon={item.icon}
                      >
                        {item.icon}
                      </span>
                    </motion.div>
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                  </div>
                  <p className="text-on-surface-variant text-sm relative z-10">{item.desc}</p>
                  
                  {/* Bottom accent line */}
                  <div className="w-0 group-hover:w-12 h-0.5 bg-gradient-to-r from-emerald to-jade transition-all duration-500 rounded-full relative z-10" />
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
