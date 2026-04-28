import { motion } from 'framer-motion';

const benefits = [
  { icon: 'storefront', title: 'Global Reach', desc: 'Access architects, designers and retailers across Europe and beyond.' },
  { icon: 'trending_up', title: 'Streamlined Orders', desc: 'Manage RFQs, pricing and inventory from one elegant dashboard.' },
  { icon: 'verified', title: 'Curated Network', desc: 'Join a vetted community of premium glassware manufacturers.' },
];

type Props = { onRegister?: () => void };

const SpecificationDrawer = ({ onRegister }: Props) => {
  return (
    <section className="relative bg-surface py-16 sm:py-24 lg:py-32 px-4 sm:px-8 lg:px-12 border-t border-outline-variant/15 overflow-hidden">
      {/* Green decorative background */}
      <div className="absolute inset-0 pointer-events-none grain-overlay">
        <div className="absolute bottom-0 left-0 w-full h-3/4 opacity-[0.1]" style={{ background: 'linear-gradient(180deg, transparent 0%, #1a3a2a 100%)' }} />
        
        {/* Large floating orbs */}
        <div className="absolute -bottom-10 -right-10 sm:-bottom-20 sm:-right-20 w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] rounded-full opacity-[0.15] animate-float-slow" style={{ background: 'radial-gradient(circle, #52b788 0%, transparent 60%)', filter: 'blur(30px)' }} />
        <div className="absolute top-[5%] left-[2%] w-[150px] h-[150px] sm:w-[300px] sm:h-[300px] rounded-full opacity-[0.12] animate-float-medium" style={{ background: 'radial-gradient(circle, #2d6a4f 0%, transparent 70%)', filter: 'blur(20px)' }} />
        
        {/* Abstract wave SVG */}
        <svg className="absolute bottom-[10%] left-0 w-full h-64 opacity-[0.1]" style={{ color: '#2d6a4f' }} viewBox="0 0 1440 320" fill="none" preserveAspectRatio="none">
          <path d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,144C672,139,768,181,864,197.3C960,213,1056,203,1152,186.7C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" fill="currentColor" />
        </svg>

        {/* Decorative architectural grid lines */}
        <div className="absolute inset-0 opacity-[0.08] hidden lg:block"
          style={{ backgroundImage: 'linear-gradient(rgba(45,106,79,1) 1px, transparent 1px), linear-gradient(90deg, rgba(45,106,79,1) 1px, transparent 1px)', backgroundSize: '4rem 4rem' }}
        />
        
        {/* Vertical green accent line */}
        <div className="absolute right-[50%] top-[10%] bottom-[10%] w-px bg-gradient-to-b from-transparent via-emerald/20 to-transparent hidden lg:block" />
      </div>

      <div className="max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 items-center relative">
        {/* Left — Visual */}
        <motion.div initial={{ opacity: 0, scale: 0.92, y: 30 }} whileInView={{ opacity: 1, scale: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }} className="col-span-1 lg:col-span-6 relative">
          {/* Green decorative frame */}
          <div className="absolute -inset-3 rounded-3xl border border-emerald/8 hidden lg:block" />
          <div className="absolute -top-6 -left-6 w-12 h-12 rounded-full bg-forest/8 animate-float-medium hidden lg:block" />

          <motion.div whileHover={{ scale: 1.01 }} transition={{ type: 'spring', stiffness: 100, damping: 14 }} className="rounded-2xl overflow-hidden shadow-2xl relative aspect-[4/3] max-w-2xl mx-auto lg:max-w-none">
            <img alt="Premium Glassware Atelier" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAV3ZSZj0bJ3dEOC5I41TyTlL14NrIReg3_tWQ9EE05cHo5if3eIGyKVaEK_kuJFpUUBo-jJrf_r4s42F5-hTrrwGOGcU8fbhC-IaYqcca7FJToVRuLFtJYD0GrX1dm0XIAjwXzZck1iPXB7hCxzVQR0zu5ZUBelV9k_WmTKAzaQW-kDElkBY2Dh1XEtVrXovcrLLNRsl_29Jn6U_yBZ6WLYjh81ewgeyFKKLJy8mlFa8rS-2ys3yk2v3gl8EalXU7XIUoLw90F2i8" />
            {/* Green tint overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-forest/5 to-emerald/10 mix-blend-multiply" />
            {/* Floating stat cards with green accent */}
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 1.4, delay: 0.8, ease: [0.16, 1, 0.3, 1] }} className="hidden sm:block absolute bottom-6 left-6 glass-panel px-5 py-4 rounded-xl shadow-lg border-l-4 border-emerald">
              <span className="text-[10px] uppercase tracking-widest text-emerald font-bold block">Active Vendors</span>
              <span className="text-3xl font-headline italic text-primary">120+</span>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 1.4, delay: 1.1, ease: [0.16, 1, 0.3, 1] }} className="hidden sm:block absolute top-6 right-6 glass-panel px-5 py-4 rounded-xl shadow-lg border-l-4 border-jade">
              <span className="text-[10px] uppercase tracking-widest text-jade font-bold block">Countries</span>
              <span className="text-3xl font-headline italic text-primary">14</span>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Right — Content */}
        <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }} className="col-span-1 lg:col-span-6">
          <span className="inline-flex items-center gap-2 text-on-surface-variant font-medium tracking-widest text-xs uppercase mb-6">
            <span className="w-8 h-px bg-emerald" />
            For Suppliers
          </span>
          <h2 className="font-headline text-3xl sm:text-4xl lg:text-5xl italic text-primary mb-4 sm:mb-6 leading-tight green-accent-line pb-3">
            Grow your business with Sklovera.
          </h2>
          <p className="text-on-surface-variant text-lg mb-10 leading-relaxed max-w-lg">
            List your premium glassware on Europe's most curated B2B platform. We handle the buyers — you focus on the craft.
          </p>

          <div className="space-y-5 mb-12">
            {benefits.map((b, i) => (
              <motion.div key={b.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.5 + i * 0.25 }} whileHover={{ x: 8 }} className="p-5 bg-surface-container-low rounded-xl flex items-center gap-5 group transition-all cursor-pointer hover:bg-forest/5 border border-transparent hover:border-emerald/10">
                <motion.div whileHover={{ rotate: 15, scale: 1.15 }} className="w-12 h-12 rounded-xl bg-forest/8 flex items-center justify-center group-hover:bg-forest/15 transition-colors flex-shrink-0">
                  <span className="material-symbols-outlined text-2xl text-emerald" data-icon={b.icon}>{b.icon}</span>
                </motion.div>
                <div>
                  <h5 className="font-bold text-sm">{b.title}</h5>
                  <p className="text-xs text-on-surface-variant">{b.desc}</p>
                </div>
                <span className="material-symbols-outlined text-emerald/30 group-hover:text-emerald/60 ml-auto transition-colors text-sm hidden sm:block" data-icon="chevron_right">chevron_right</span>
              </motion.div>
            ))}
          </div>

          <motion.button onClick={onRegister} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-forest text-sage px-8 py-4 flex items-center gap-3 rounded-full font-medium tracking-wide shadow-2xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-emerald/30 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.16,1,0.3,1] rounded-full" />
            <span className="relative z-10">Register as a Vendor</span>
            <span className="material-symbols-outlined relative z-10 text-sm group-hover:translate-x-1 transition-transform duration-500" data-icon="arrow_forward">arrow_forward</span>
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default SpecificationDrawer;
