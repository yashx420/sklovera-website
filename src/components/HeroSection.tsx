import { motion, type Variants } from 'framer-motion';

type Props = {
  onViewCatalog?: () => void;
  onViewStandards?: () => void;
};

const HeroSection = ({ onViewCatalog, onViewStandards }: Props) => {
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
    <section className="relative min-h-[480px] sm:min-h-[600px] lg:min-h-[700px] flex items-center px-4 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-24 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden grain-overlay">
        {/* Soft background gradient fill */}
        <div className="absolute inset-0 opacity-[0.06] bg-gradient-to-br from-emerald to-transparent" />
        
        {/* Large floating green orb — top right */}
        <div className="absolute -top-16 -right-16 sm:-top-32 sm:-right-32 w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] rounded-full opacity-[0.15] animate-float-slow"
          style={{ background: 'radial-gradient(circle, #52b788 0%, #2d6a4f 40%, transparent 70%)', filter: 'blur(40px)' }}
        />
        
        {/* Medium floating green orb — bottom left */}
        <div className="absolute bottom-8 left-[2%] sm:bottom-16 sm:left-[5%] w-[200px] h-[200px] sm:w-[350px] sm:h-[350px] rounded-full opacity-[0.12] animate-float-medium"
          style={{ background: 'radial-gradient(circle, #74c69d 0%, #1a3a2a 60%, transparent 80%)', filter: 'blur(30px)' }}
        />

        {/* Abstract glass shapes (SVG) */}
        {/* Shape 1: Curved glass edge */}
        <svg className="absolute top-[15%] left-[2%] w-[400px] h-[400px] opacity-[0.15] animate-sway hidden lg:block" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10,100 Q50,10 150,50 T190,180" stroke="#2d6a4f" strokeWidth="1" fill="transparent" />
          <path d="M15,105 Q55,15 155,55 T195,185" stroke="#52b788" strokeWidth="0.5" fill="transparent" />
        </svg>

        {/* Shape 2: Geometric facet */}
        <svg className="absolute bottom-[20%] right-[30%] w-64 h-64 opacity-[0.15] animate-float-slow hidden xl:block" viewBox="0 0 100 100" fill="none">
          <polygon points="50,10 90,40 70,90 30,90 10,40" stroke="#1a3a2a" strokeWidth="0.5" fill="rgba(45,106,79,0.05)" />
          <line x1="50" y1="10" x2="50" y2="50" stroke="#1a3a2a" strokeWidth="0.5" />
          <line x1="10" y1="40" x2="50" y2="50" stroke="#1a3a2a" strokeWidth="0.5" />
          <line x1="90" y1="40" x2="50" y2="50" stroke="#1a3a2a" strokeWidth="0.5" />
        </svg>
        
        {/* Diagonal green accent stripe */}
        <div className="absolute top-0 right-0 w-[150%] h-[150%] -translate-y-1/4 translate-x-1/4 opacity-[0.1] origin-top-right rotate-[-15deg]"
          style={{ background: 'linear-gradient(135deg, transparent 40%, #2d6a4f 45%, #52b788 50%, #2d6a4f 55%, transparent 60%)' }}
        />
        

        
        {/* Expanded dots pattern */}
        <div className="absolute bottom-[15%] right-[5%] grid grid-cols-6 gap-4 opacity-[0.12] hidden lg:grid">
          {Array.from({ length: 36 }).map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: i % 3 === 0 ? '#2d6a4f' : '#74c69d' }} />
          ))}
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        <motion.div 
          className="col-span-1 lg:col-span-6 z-10 lg:self-start lg:-mt-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Green accent badge */}
          <motion.div variants={itemVariants} className="mb-4 sm:mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-widest uppercase bg-forest/8 text-emerald border border-emerald/15 relative overflow-hidden">
              <span className="w-2 h-2 rounded-full bg-jade animate-pulse-glow" />
              European Artisan Glass
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald/10 to-transparent animate-shimmer" />
            </span>
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-headline italic leading-[1.1] mb-4 sm:mb-6 lg:mb-8 text-primary">
            Refined <br/>Glassware <br/>Sourcing <br/>
            <span className="relative inline-block">
              from Europe
              <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-forest via-emerald to-jade rounded-full opacity-60" />
            </span>
          </motion.h1>
          <motion.p variants={itemVariants} className="text-on-surface-variant text-sm sm:text-base lg:text-lg max-w-md mb-6 sm:mb-8 lg:mb-12 leading-relaxed">
            Bridging the gap between high-end Italian craftsmanship and functional minimalism. Curated for architects, designers, and curators.
          </motion.p>
          <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4">
            <motion.button 
              onClick={onViewCatalog}
              className="px-6 sm:px-8 py-3 sm:py-4 flex items-center gap-3 rounded-full font-medium tracking-wide shadow-2xl overflow-hidden relative group text-sm sm:text-base"
              style={{ backgroundColor: '#1a3a2a', color: '#ffffff' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.16,1,0.3,1] rounded-full" style={{ backgroundColor: 'rgba(82,183,136,0.25)' }} />
              <span className="relative z-10">Explore Catalog</span>
              <span className="material-symbols-outlined relative z-10 text-sm group-hover:translate-x-1 transition-transform duration-500" data-icon="arrow_forward">arrow_forward</span>
            </motion.button>
            <motion.button 
              onClick={onViewStandards}
              className="px-6 sm:px-8 py-3 sm:py-4 flex items-center gap-3 rounded-full font-medium tracking-wide text-sm sm:text-base transition-all duration-300 group"
              style={{ border: '2px solid rgba(26,58,42,0.5)', color: '#1a3a2a' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>Our Standards</span>
              <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform duration-500" data-icon="eco">eco</span>
            </motion.button>
          </motion.div>

          {/* Mini stats row */}
          <motion.div variants={itemVariants} className="mt-8 sm:mt-12 flex items-center gap-6 sm:gap-10">
            {[
              { value: '200+', label: 'Factories' },
              { value: '85yr', label: 'Heritage' },
              { value: '3K+', label: 'Happy Clients' },
            ].map((stat) => (
              <div key={stat.label} className="text-center sm:text-left">
                <div className="text-xl sm:text-2xl font-headline italic" style={{ color: '#1a3a2a' }}>{stat.value}</div>
                <div className="text-[10px] sm:text-xs uppercase tracking-widest text-on-surface-variant font-medium">{stat.label}</div>
              </div>
            ))}
            <div className="hidden sm:block h-8 w-px" style={{ background: 'linear-gradient(180deg, transparent, rgba(26,58,42,0.3), transparent)' }} />
            <div className="hidden sm:flex items-center gap-2">
              <span className="material-symbols-outlined text-lg" style={{ color: '#2d6a4f' }} data-icon="verified">verified</span>
              <span className="text-xs text-on-surface-variant font-medium">EU Certified</span>
            </div>
          </motion.div>
        </motion.div>

        <div className="col-span-1 lg:col-span-6 relative h-[280px] sm:h-[350px] md:h-[450px] lg:h-[600px]">
          {/* Green decorative frame behind images */}
          <div className="absolute right-[5%] top-[5%] w-3/4 h-3/4 rounded-2xl border-2 border-emerald/10 hidden lg:block" />
          <div className="absolute right-[-2%] bottom-[8%] w-20 h-20 rounded-full bg-gradient-to-br from-forest/10 to-emerald/5 animate-float-slow hidden lg:block" />
          
          {/* Asymmetric Layout Principle */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ scale: 1.02, rotate: 1 }}
            className="absolute right-0 top-0 w-4/5 h-4/5 overflow-hidden rounded-xl shadow-2xl origin-bottom-right"
          >
            <img alt="Glassware Detail" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDbZZBHM0URyvFsSvOzS8_SXMK4fPUcYLmgIQnQd4R_0nmW5O2c3hdemWdzhslV1-xVMZCoHGbwJPVpcEsqxhLyRsdU4_8I1wT5UwJ31kEmyYCJlNKJhxpcXvVccxt2iQZhXBFp0Zz7wRe2QwpgXAruse-SdiJy8aSEgz4yeSlWos4CU-QvI2oqebHrw8sARrIvr2rVomcw1P33sZrNIGj1Oi53WMWR30MMntRRw6be9neDoyjtk-VH2ha1Q80grXOvt-v1-iTf36E"/>
            {/* Green tint overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-forest/0 to-forest/15 opacity-0 hover:opacity-100 transition-opacity duration-700" />
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: -50, y: 50 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 2, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ scale: 1.05, y: -10 }}
            className="absolute left-0 bottom-0 w-1/2 h-1/2 overflow-hidden rounded-xl shadow-xl border-4 sm:border-8 border-surface z-20"
          >
            <img alt="Decanter Detail" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDRCuW0kAHcfFaCe4kocjc-18zDGmZv08i4yFpdAB_JV0rdxY-zgZGiaCojKOle1c9HPbka_8sE8MPe9MBQZ4uofDulXTaCFhlLZ5KSpHhP5KFh98nwBibBLCw6e3TyIMom13p9FGy-ANdTl0OcfMx_MwbHFPXo96DUejSrAqAnTKHo26jg-wHG8d4-zdTnMVwTHZwli4fRwQIRNG5uRY9K23eW1e1jRS0aCyndx1y-Qqp71VF2dyL0_p8d3Q9B4HmHmEUUCQ-_KrM"/>
          </motion.div>

          {/* Floating green quality badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, delay: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 z-30 glass-panel-green px-4 py-3 rounded-xl shadow-lg hidden sm:flex items-center gap-3"
          >
            <span className="material-symbols-outlined text-emerald text-2xl" data-icon="eco">eco</span>
            <div>
              <div className="text-[9px] uppercase tracking-[0.2em] text-emerald font-bold">Sustainable</div>
              <div className="text-sm font-headline italic text-forest">CO₂ Neutral</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
