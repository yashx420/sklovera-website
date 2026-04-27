import { motion, type Variants } from 'framer-motion';

type Props = {
  onViewCatalog?: () => void;
};

const HeroSection = ({ onViewCatalog }: Props) => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.4, delayChildren: 0.2 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 1.6, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <section className="relative min-h-[700px] flex items-center px-12 py-24 overflow-hidden">
      <div className="max-w-[1920px] mx-auto w-full grid grid-cols-12 gap-12 items-center">
        <motion.div 
          className="col-span-12 lg:col-span-6 z-10 self-start -mt-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 variants={itemVariants} className="text-7xl lg:text-8xl font-headline italic leading-[1.1] mb-8 text-primary">
            Refined <br/>Glassware <br/>Sourcing <br/>from Europe
          </motion.h1>
          <motion.p variants={itemVariants} className="text-on-surface-variant text-lg max-w-md mb-12 leading-relaxed">
            Bridging the gap between high-end Italian craftsmanship and functional minimalism. Curated for architects, designers, and curators.
          </motion.p>
          <motion.div variants={itemVariants}>
            <motion.button 
              onClick={onViewCatalog}
              className="bg-primary text-surface px-8 py-4 flex items-center gap-3 rounded-full font-medium tracking-wide shadow-2xl overflow-hidden relative group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.16,1,0.3,1] rounded-full" />
              <span className="relative z-10">Explore Catalog</span>
              <span className="material-symbols-outlined relative z-10 text-sm group-hover:translate-x-1 transition-transform duration-500" data-icon="arrow_forward">arrow_forward</span>
            </motion.button>
          </motion.div>
        </motion.div>
        <div className="col-span-12 lg:col-span-6 relative h-[450px] lg:h-[600px]">
          {/* Asymmetric Layout Principle */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ scale: 1.02, rotate: 1 }}
            className="absolute right-0 top-0 w-4/5 h-4/5 overflow-hidden rounded-xl shadow-2xl origin-bottom-right"
          >
            <img alt="Glassware Detail" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDbZZBHM0URyvFsSvOzS8_SXMK4fPUcYLmgIQnQd4R_0nmW5O2c3hdemWdzhslV1-xVMZCoHGbwJPVpcEsqxhLyRsdU4_8I1wT5UwJ31kEmyYCJlNKJhxpcXvVccxt2iQZhXBFp0Zz7wRe2QwpgXAruse-SdiJy8aSEgz4yeSlWos4CU-QvI2oqebHrw8sARrIvr2rVomcw1P33sZrNIGj1Oi53WMWR30MMntRRw6be9neDoyjtk-VH2ha1Q80grXOvt-v1-iTf36E"/>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: -50, y: 50 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 2, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ scale: 1.05, y: -10 }}
            className="absolute left-0 bottom-0 w-1/2 h-1/2 overflow-hidden rounded-xl shadow-xl border-8 border-surface z-20"
          >
            <img alt="Decanter Detail" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDRCuW0kAHcfFaCe4kocjc-18zDGmZv08i4yFpdAB_JV0rdxY-zgZGiaCojKOle1c9HPbka_8sE8MPe9MBQZ4uofDulXTaCFhlLZ5KSpHhP5KFh98nwBibBLCw6e3TyIMom13p9FGy-ANdTl0OcfMx_MwbHFPXo96DUejSrAqAnTKHo26jg-wHG8d4-zdTnMVwTHZwli4fRwQIRNG5uRY9K23eW1e1jRS0aCyndx1y-Qqp71VF2dyL0_p8d3Q9B4HmHmEUUCQ-_KrM"/>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
