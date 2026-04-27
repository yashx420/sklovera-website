import { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  submitApplication,
  VENDOR_CATEGORY_OPTIONS,
  type VendorApplication,
} from '../lib/vendorApplications';

type Props = { onDone?: () => void };

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } },
};

const stagger: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const VendorRegister = ({ onDone }: Props) => {
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [website, setWebsite] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState<VendorApplication | null>(null);

  const toggleCategory = (c: string) => {
    setCategories((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!companyName.trim() || !contactName.trim() || !email.trim() || !country.trim()) {
      setError('Company, contact name, email, and country are required.');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      const app = submitApplication({
        companyName: companyName.trim(),
        contactName: contactName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        country: country.trim(),
        website: website.trim() || undefined,
        categories,
        message: message.trim() || undefined,
      });
      setSubmitted(app);
      setSubmitting(false);
    }, 400);
  };

  if (submitted) {
    return (
      <section className="py-24 px-12">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="max-w-[720px] mx-auto text-center"
        >
          <motion.div variants={fade} className="flex items-center justify-center gap-3 mb-6">
            <span className="h-px w-12 bg-secondary" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-secondary font-semibold">
              Application received
            </span>
            <span className="h-px w-12 bg-secondary" />
          </motion.div>
          <motion.h2 variants={fade} className="font-headline italic text-5xl text-primary mb-4">
            Thank you, {submitted.contactName}.
          </motion.h2>
          <motion.p variants={fade} className="text-on-surface-variant mb-8">
            Your application <span className="font-mono text-primary">{submitted.id}</span> has
            been submitted to the Sklovera atelier. Our sourcing team will review your portfolio
            and respond to <span className="text-primary">{submitted.email}</span> within five
            business days. Approved partners receive supplier portal credentials and onboarding
            documentation.
          </motion.p>
          {onDone && (
            <motion.button
              variants={fade}
              onClick={onDone}
              className="bg-primary text-surface px-8 py-3 rounded-md font-semibold"
            >
              Return home
            </motion.button>
          )}
        </motion.div>
      </section>
    );
  }

  return (
    <section className="relative min-h-[88vh] overflow-hidden">
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.6 }}
        className="hidden lg:block absolute inset-y-0 right-0 w-[45%]"
      >
        <img
          src="https://images.unsplash.com/photo-1535378620166-273708d44e4c?auto=format&fit=crop&w=1400&q=80"
          alt="Glassware atelier"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/30 via-transparent to-transparent" />
      </motion.div>

      <div className="relative max-w-[1400px] mx-auto px-12 py-20 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="lg:col-span-7 z-10"
        >
          <motion.div variants={fade} className="flex items-center gap-3 mb-10">
            <span className="h-px w-12 bg-secondary" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-secondary font-semibold">
              Atelier Sklovera · Become a partner
            </span>
          </motion.div>
          <motion.h1
            variants={fade}
            className="font-headline italic text-[56px] lg:text-[72px] leading-[0.95] text-primary mb-6 tracking-tight"
          >
            Register your<br />
            <span className="text-secondary">glassware atelier.</span>
          </motion.h1>
          <motion.p
            variants={fade}
            className="text-on-surface-variant text-lg max-w-xl mb-10 leading-relaxed"
          >
            Sklovera curates a small network of European craft and industrial suppliers serving
            hospitality, retail and private clients. Tell us about your atelier — once your
            application is approved, you'll receive supplier portal credentials and can list
            your collection within hours.
          </motion.p>

          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            <Field label="Company / atelier name" value={companyName} onChange={setCompanyName} required />
            <Field label="Primary contact" value={contactName} onChange={setContactName} required />
            <Field label="Email" type="email" value={email} onChange={setEmail} required />
            <Field label="Phone (optional)" value={phone} onChange={setPhone} />
            <Field label="Country / region" value={country} onChange={setCountry} required />
            <Field label="Website (optional)" value={website} onChange={setWebsite} placeholder="https://" />

            <div className="md:col-span-2">
              <label className="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant font-semibold">
                Categories you supply
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                {VENDOR_CATEGORY_OPTIONS.map((c) => {
                  const active = categories.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCategory(c)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition ${
                        active
                          ? 'bg-primary text-surface'
                          : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant font-semibold">
                A short note (optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Heritage, capabilities, lead times, certifications…"
                className="mt-3 w-full bg-transparent border-b border-outline-variant/40 focus:border-primary px-1 py-3 text-primary outline-none resize-none placeholder:text-on-surface-variant/60"
              />
            </div>

            {error && (
              <div className="md:col-span-2 rounded-md bg-error-container text-on-error-container px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div className="md:col-span-2 flex flex-wrap items-center gap-4 pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={submitting}
                className="bg-primary text-surface px-10 py-4 rounded-md font-semibold tracking-wide flex items-center gap-3 disabled:opacity-60"
                style={{
                  backgroundImage:
                    'linear-gradient(135deg, var(--md-sys-color-primary, #303030), #474646)',
                }}
              >
                {submitting ? 'Submitting…' : 'Submit application'}
                <span className="material-symbols-outlined" data-icon="arrow_forward">
                  arrow_forward
                </span>
              </motion.button>
              <p className="text-xs text-on-surface-variant max-w-md">
                By submitting, you agree to share company information for vendor verification.
                We respond to every application within five business days.
              </p>
            </div>
          </form>
        </motion.div>

        <div className="hidden lg:block lg:col-span-5" />
      </div>
    </section>
  );
};

const Field = ({
  label,
  value,
  onChange,
  type = 'text',
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) => (
  <label className="block">
    <span className="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant font-semibold">
      {label}
      {required && <span className="text-secondary ml-1">·</span>}
    </span>
    <input
      type={type}
      required={required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mt-3 w-full bg-transparent border-b border-outline-variant/40 focus:border-primary px-1 py-3 text-primary outline-none transition-colors placeholder:text-on-surface-variant/60"
    />
  </label>
);

export default VendorRegister;
