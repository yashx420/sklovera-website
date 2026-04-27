import { motion } from 'framer-motion';

const benefits = [
  {
    icon: 'storefront',
    title: 'Global Reach',
    desc: 'Access architects, designers and retailers across Europe and beyond.',
  },
  {
    icon: 'trending_up',
    title: 'Streamlined Orders',
    desc: 'Manage RFQs, pricing and inventory from one elegant dashboard.',
  },
  {
    icon: 'verified',
    title: 'Curated Network',
    desc: 'Join a vetted community of premium glassware manufacturers.',
  },
];

type Props = {
  onRegister?: () => void;
};

const SpecificationDrawer = ({ onRegister }: Props) => {
  return (
    <section className="bg-surface py-16 sm:py-24 lg:py-32 px-4 sm:px-8 lg:px-12 border-t border-outline-variant/15 overflow-hidden">
      <div className="max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 items-center">
        {/* Left — Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 30 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
          className="col-span-1 lg:col-span-6 relative"
        >
          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 100, damping: 14 }}
            className="rounded-2xl overflow-hidden shadow-2xl relative aspect-[4/3] max-w-2xl mx-auto lg:max-w-none"
          >
            <img
              alt="Premium Glassware Atelier"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAV3ZSZj0bJ3dEOC5I41TyTlL14NrIReg3_tWQ9EE05cHo5if3eIGyKVaEK_kuJFpUUBo-jJrf_r4s42F5-hTrrwGOGcU8fbhC-IaYqcca7FJToVRuLFtJYD0GrX1dm0XIAjwXzZck1iPXB7hCxzVQR0zu5ZUBelV9k_WmTKAzaQW-kDElkBY2Dh1XEtVrXovcrLLNRsl_29Jn6U_yBZ6WLYjh81ewgeyFKKLJy8mlFa8rS-2ys3yk2v3gl8EalXU7XIUoLw90F2i8"
            />
            {/* Floating stat cards */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="hidden sm:block absolute bottom-6 left-6 glass-panel px-5 py-4 rounded-xl shadow-lg"
            >
              <span className="text-[10px] uppercase tracking-widest text-secondary font-bold block">Active Vendors</span>
              <span className="text-3xl font-headline italic text-primary">120+</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
              className="hidden sm:block absolute top-6 right-6 glass-panel px-5 py-4 rounded-xl shadow-lg"
            >
              <span className="text-[10px] uppercase tracking-widest text-secondary font-bold block">Countries</span>
              <span className="text-3xl font-headline italic text-primary">14</span>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Right — Content */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          className="col-span-1 lg:col-span-6"
        >
          <span className="text-on-surface-variant font-medium tracking-widest text-xs uppercase block mb-6">For Suppliers</span>
          <h2 className="font-headline text-3xl sm:text-4xl lg:text-5xl italic text-primary mb-4 sm:mb-6 leading-tight">
            Grow your business with Sklovera.
          </h2>
          <p className="text-on-surface-variant text-lg mb-10 leading-relaxed max-w-lg">
            List your premium glassware on Europe's most curated B2B platform. We handle the buyers — you focus on the craft.
          </p>

          <div className="space-y-5 mb-12">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.5 + i * 0.25 }}
                whileHover={{ x: 8, backgroundColor: 'var(--md-sys-color-surface-container-high, rgba(0,0,0,0.06))' }}
                className="p-5 bg-surface-container-low rounded-xl flex items-center gap-5 group transition-colors cursor-pointer"
              >
                <motion.span
                  whileHover={{ rotate: 15, scale: 1.15 }}
                  className="material-symbols-outlined text-3xl text-secondary"
                  data-icon={b.icon}
                >
                  {b.icon}
                </motion.span>
                <div>
                  <h5 className="font-bold text-sm">{b.title}</h5>
                  <p className="text-xs text-on-surface-variant">{b.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.button
            onClick={onRegister}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-primary text-surface px-8 py-4 flex items-center gap-3 rounded-full font-medium tracking-wide shadow-2xl overflow-hidden relative group"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.16,1,0.3,1] rounded-full" />
            <span className="relative z-10">Register as a Vendor</span>
            <span className="material-symbols-outlined relative z-10 text-sm group-hover:translate-x-1 transition-transform duration-500" data-icon="arrow_forward">arrow_forward</span>
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default SpecificationDrawer;
