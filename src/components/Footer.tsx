import { motion } from 'framer-motion';

type Props = { onRegisterVendor?: () => void };

const sections = [
  { title: 'Navigation', links: ['Collections', 'Sourcing Standards', 'Custom Production', 'Logistics'] },
  { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'GDPR Compliance'] },
  { title: 'Contact', links: ['Sklovera Studio', 'B2B Support', 'Press Relations'] },
  { title: 'Social', links: ['Instagram', 'LinkedIn', 'Pinterest'] },
];

const Footer = ({ onRegisterVendor }: Props) => (
  <footer className="bg-neutral-900 dark:bg-black text-stone-100 dark:text-stone-300 w-full relative">
    <div className="w-full px-4 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-24 flex flex-col gap-8 sm:gap-12 max-w-[1920px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4 }}
        className="rounded-xl border border-stone-800 px-5 sm:px-10 py-8 sm:py-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6 sm:gap-8"
        style={{ backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0))' }}
      >
        <div className="max-w-2xl">
          <span className="text-[10px] uppercase tracking-[0.4em] text-teal-400 font-semibold">
            Become a Sklovera partner
          </span>
          <h3 className="font-headline italic text-4xl text-stone-100 mt-3">
            Are you a glassware atelier?
          </h3>
          <p className="text-stone-400 mt-3 leading-relaxed">
            We curate a small network of European craft and industrial suppliers serving hospitality,
            retail and private clients. Submit your portfolio for review — approved partners are
            onboarded onto the supplier portal within five business days.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onRegisterVendor}
          className="inline-flex items-center gap-3 bg-teal-400 text-neutral-900 px-8 py-4 rounded-md font-semibold tracking-wide whitespace-nowrap shrink-0"
        >
          Register as a vendor
          <span className="material-symbols-outlined" data-icon="arrow_forward">
            arrow_forward
          </span>
        </motion.button>
      </motion.div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1.4 }} className="col-span-1 lg:col-span-4">
          <h2 className="font-headline italic text-4xl mb-8">Newsletter</h2>
          <p className="text-stone-400 mb-8 max-w-sm">Join our professional network for first access to new collections and global sourcing reports.</p>
          <div className="flex flex-col gap-4">
            <div className="relative">
              <input className="bg-transparent border-b border-stone-700 w-full py-4 focus:border-teal-400 focus:ring-0 text-stone-100 outline-none transition-colors" placeholder="professional@email.com" type="email"/>
              <button className="absolute right-0 bottom-4 material-symbols-outlined text-teal-400 hover:scale-110 transition-transform" data-icon="send">send</button>
            </div>
            <p className="text-[10px] text-stone-500 font-medium">By subscribing, you agree to our Privacy Policy regarding professional data handling.</p>
          </div>
        </motion.div>
        <div className="col-span-1 lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {sections.map((s, i) => (
            <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.4 + i * 0.2 }} className="space-y-6">
              <h6 className="font-bold text-xs uppercase tracking-widest text-stone-500">{s.title}</h6>
              <ul className="space-y-4 text-sm font-medium">
                {s.links.map((l) => (
                  <li key={l}><a className="text-stone-400 hover:text-stone-100 underline underline-offset-4 transition-all hover:translate-x-1 inline-block" href="#">{l}</a></li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1.6, delay: 0.8 }} className="pt-12 sm:pt-24 border-t border-stone-800 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-8 text-center sm:text-left">
        <span className="text-stone-100 font-serif italic text-2xl flex items-center gap-2"><img src="/sklovera-logo.svg" alt="Sklovera Logo" className="h-6" /></span>
        <p className="text-stone-500 text-[10px] font-medium tracking-[0.2em] uppercase">© 2026 The Editorial Glassware Platform. European Quality Certified.</p>
        <div className="flex gap-4">
          <span className="text-teal-400 font-semibold text-xs tracking-widest uppercase">Verified Sourcing Partner</span>
        </div>
      </motion.div>
    </div>
  </footer>
);

export default Footer;
