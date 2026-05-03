import { motion, type Variants } from 'framer-motion';

const StandardsPage = () => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <section className="relative min-h-screen py-24 sm:py-32 lg:py-40 px-4 sm:px-8 lg:px-12 overflow-hidden bg-surface">
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none grain-overlay">
        <div className="absolute inset-0 opacity-[0.04] bg-gradient-to-b from-emerald to-transparent" />
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-[0.1] animate-float-slow" style={{ background: 'radial-gradient(circle, #52b788 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-[10%] left-[-5%] w-[300px] h-[300px] rounded-full opacity-[0.15] animate-float-medium" style={{ background: 'radial-gradient(circle, #2d6a4f 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute inset-0 opacity-[0.05] hidden lg:block" style={{ backgroundImage: 'linear-gradient(rgba(45,106,79,1) 1px, transparent 1px), linear-gradient(90deg, rgba(45,106,79,1) 1px, transparent 1px)', backgroundSize: '6rem 6rem' }} />
      </div>

      <div className="max-w-[1200px] mx-auto relative z-10">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-16 sm:space-y-24">
          
          {/* Header */}
          <div className="max-w-3xl">
            <motion.span variants={itemVariants} className="inline-flex items-center gap-2 text-emerald font-semibold tracking-widest text-xs uppercase mb-6">
              <span className="w-8 h-px bg-emerald" /> Our Standards
            </motion.span>
            <motion.h1 variants={itemVariants} className="font-headline italic text-4xl sm:text-6xl lg:text-7xl text-primary leading-tight mb-8">
              Curating European Excellence.
            </motion.h1>
            <motion.p variants={itemVariants} className="text-on-surface-variant text-lg sm:text-xl leading-relaxed">
              Sklovera is built on a foundation of uncompromising quality, sustainability, and artisanal heritage. 
              We partner exclusively with glassware ateliers and industrial manufacturers who meet our rigorous criteria.
            </motion.p>
          </div>

          {/* Grid of standards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 sm:gap-16">
            
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-forest/10 text-emerald mb-6">
                <span className="material-symbols-outlined text-2xl" data-icon="eco">eco</span>
              </div>
              <h3 className="font-headline italic text-2xl sm:text-3xl text-primary">Sustainability</h3>
              <p className="text-on-surface-variant leading-relaxed">
                All our partners must demonstrate commitment to environmental stewardship. This includes CO2-neutral 
                shipping lanes, 100% recyclable packaging, and energy-efficient kilns. We prioritize facilities using 
                electric melting processes powered by renewable sources.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-forest/10 text-emerald mb-6">
                <span className="material-symbols-outlined text-2xl" data-icon="verified">verified</span>
              </div>
              <h3 className="font-headline italic text-2xl sm:text-3xl text-primary">Material Purity</h3>
              <p className="text-on-surface-variant leading-relaxed">
                We strictly enforce EU safety standards. Our catalog exclusively features lead-free crystalline glass. 
                Products are rigorously tested for optical clarity, brilliance, and dishwasher resistance to ensure 
                they withstand the demands of intense hospitality usage.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-forest/10 text-emerald mb-6">
                <span className="material-symbols-outlined text-2xl" data-icon="precision_manufacturing">precision_manufacturing</span>
              </div>
              <h3 className="font-headline italic text-2xl sm:text-3xl text-primary">Craftsmanship</h3>
              <p className="text-on-surface-variant leading-relaxed">
                Whether artisanal hand-blown or high-precision machine-molded, we celebrate European craftsmanship. 
                We maintain direct relationships with workshops, ensuring fair labor practices and the preservation 
                of legacy glassmaking techniques passed down through generations.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-forest/10 text-emerald mb-6">
                <span className="material-symbols-outlined text-2xl" data-icon="balance">balance</span>
              </div>
              <h3 className="font-headline italic text-2xl sm:text-3xl text-primary">Ethical Sourcing</h3>
              <p className="text-on-surface-variant leading-relaxed">
                Transparency is at our core. We require full visibility into factory history and social governance 
                metrics. Our platform empowers buyers to make informed procurement decisions based on the ethical 
                footprint of their chosen suppliers.
              </p>
            </motion.div>

          </div>

          <motion.div variants={itemVariants} className="mt-16 pt-16 border-t border-outline-variant/30 text-center">
            <span className="text-xs font-semibold tracking-widest uppercase text-emerald">
              European Quality Certified
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default StandardsPage;
