import { motion } from 'framer-motion';

type Props = { onRegisterVendor?: () => void };

const sections = [
  { title: 'Navigation', links: ['Collections', 'Sourcing Standards', 'Custom Production', 'Logistics'] },
  { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'GDPR Compliance'] },
  { title: 'Contact', links: ['Sklovera Studio', 'B2B Support', 'Press Relations'] },
  { title: 'Social', links: ['Instagram', 'LinkedIn', 'Pinterest'] },
];

const Footer = ({ onRegisterVendor }: Props) => (
  <footer className="w-full relative overflow-hidden" style={{ backgroundColor: '#0f2218', color: '#f5f5f4' }}>
    {/* Decorative green gradient orbs */}
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-0 right-[10%] sm:right-[20%] w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] rounded-full" style={{ opacity: 0.06, background: 'radial-gradient(circle, #52b788 0%, transparent 60%)' }} />
      <div className="absolute bottom-[10%] left-[5%] sm:left-[10%] w-[150px] h-[150px] sm:w-[250px] sm:h-[250px] rounded-full animate-float-slow" style={{ opacity: 0.04, background: 'radial-gradient(circle, #2d6a4f 0%, transparent 70%)' }} />
    </div>

    <div className="w-full px-4 sm:px-8 lg:px-12 pt-12 sm:pt-16 lg:pt-24 pb-8 sm:pb-12 lg:pb-16 flex flex-col gap-8 sm:gap-12 max-w-[1920px] mx-auto relative">
      {/* Partner CTA */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4 }}
        className="rounded-xl px-5 sm:px-10 py-8 sm:py-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6 sm:gap-8"
        style={{ border: '1px solid rgba(82,183,136,0.25)', backgroundImage: 'linear-gradient(135deg, rgba(45,106,79,0.2), rgba(82,183,136,0.08))' }}
      >
        <div className="max-w-2xl">
          <span className="text-[10px] uppercase font-semibold" style={{ letterSpacing: '0.4em', color: '#52b788' }}>
            Become a Sklovera partner
          </span>
          <h3 className="font-headline italic text-4xl mt-3" style={{ color: '#f5f5f4' }}>
            Are you a glassware atelier?
          </h3>
          <p className="mt-3 leading-relaxed" style={{ color: '#a8a29e' }}>
            We curate a small network of European craft and industrial suppliers serving hospitality,
            retail and private clients. Submit your portfolio for review — approved partners are
            onboarded onto the supplier portal within five business days.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onRegisterVendor}
          className="inline-flex items-center justify-center gap-3 w-full md:w-auto px-8 py-4 rounded-md font-semibold tracking-wide whitespace-nowrap shrink-0 transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#52b788', color: '#0f2218' }}
        >
          Register as a vendor
          <span className="material-symbols-outlined" data-icon="arrow_forward">
            arrow_forward
          </span>
        </motion.button>
      </motion.div>

      {/* Newsletter + Links */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1.4 }} className="col-span-1 lg:col-span-4">
          <h2 className="font-headline italic text-4xl mb-8" style={{ color: '#f5f5f4' }}>Newsletter</h2>
          <p className="mb-8 max-w-sm" style={{ color: '#a8a29e' }}>Join our professional network for first access to new collections and global sourcing reports.</p>
          <div className="flex flex-col gap-4">
            <div className="relative">
              <input
                className="bg-transparent w-full py-4 outline-none transition-colors"
                style={{ borderBottom: '1px solid rgba(82,183,136,0.3)', color: '#f5f5f4' }}
                onFocus={(e) => (e.target.style.borderBottomColor = '#52b788')}
                onBlur={(e) => (e.target.style.borderBottomColor = 'rgba(82,183,136,0.3)')}
                placeholder="professional@email.com"
                type="email"
              />
              <button className="absolute right-0 bottom-4 material-symbols-outlined transition-transform hover:scale-110" style={{ color: '#52b788' }} data-icon="send">send</button>
            </div>
            <p className="text-[10px] font-medium" style={{ color: '#78716c' }}>By subscribing, you agree to our Privacy Policy regarding professional data handling.</p>
          </div>
        </motion.div>

        <div className="col-span-1 lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {sections.map((s, i) => (
            <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.4 + i * 0.2 }} className="space-y-6">
              <h6 className="font-bold text-xs uppercase" style={{ letterSpacing: '0.1em', color: 'rgba(82,183,136,0.6)' }}>{s.title}</h6>
              <ul className="space-y-4 text-sm font-medium">
                {s.links.map((l) => (
                  <li key={l}>
                    <a className="underline underline-offset-4 transition-all hover:translate-x-1 inline-block" style={{ color: '#a8a29e' }} onMouseOver={(e) => (e.currentTarget.style.color = '#d6d3d1')} onMouseOut={(e) => (e.currentTarget.style.color = '#a8a29e')} href="#">{l}</a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.6, delay: 0.8 }}
        className="pt-10 sm:pt-16 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-8 text-center sm:text-left"
        style={{ borderTop: '1px solid rgba(82,183,136,0.15)' }}
      >
        <span className="font-serif italic text-2xl flex items-center gap-2" style={{ color: '#f5f5f4' }}>
          <img src="/sklovera-logo.svg" alt="Sklovera Logo" className="h-6" />
        </span>
        <p className="text-[10px] font-medium uppercase" style={{ letterSpacing: '0.2em', color: '#78716c' }}>
          © 2026 The Editorial Glassware Platform. European Quality Certified.
        </p>
        <div className="flex gap-4 items-center">
          <span className="w-2 h-2 rounded-full animate-pulse-glow" style={{ backgroundColor: '#52b788' }} />
          <span className="font-semibold text-xs uppercase" style={{ letterSpacing: '0.1em', color: '#52b788' }}>Verified Sourcing Partner</span>
        </div>
      </motion.div>
    </div>
  </footer>
);

export default Footer;
