import { motion } from 'framer-motion';

const clients = [
  { name: 'Dorabjees', src: '/clients/Dorabjees.png' },
  { name: 'BigBasket', src: '/clients/bigbasket.png' },
  { name: 'Sula Vineyards', src: '/clients/sula.png' },
  { name: 'The Emph', src: '/clients/the-emph.png' },
];

const ClientTicker = () => {
  // Duplicate the list multiple times for a seamless infinite scroll
  const logos = [...clients, ...clients, ...clients, ...clients];

  return (
    <section className="relative py-14 sm:py-20 bg-surface border-t border-outline-variant/10 overflow-hidden">
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-10 sm:mb-14 px-4"
      >
        <span className="inline-flex items-center gap-2 text-on-surface-variant font-medium tracking-widest text-xs uppercase mb-3">
          <span className="w-6 h-px bg-emerald/50" />
          Trusted Partners
          <span className="w-6 h-px bg-emerald/50" />
        </span>
        <h2 className="font-headline text-2xl sm:text-3xl italic text-primary">Our Clients</h2>
      </motion.div>

      {/* Gradient fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-40 z-10 bg-gradient-to-r from-surface to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-40 z-10 bg-gradient-to-l from-surface to-transparent pointer-events-none" />

      {/* Ticker track */}
      <div className="flex w-max animate-ticker">
        {logos.map((client, i) => (
          <div
            key={`${client.name}-${i}`}
            className="flex-shrink-0 mx-8 sm:mx-14 flex items-center justify-center group"
          >
            <img
              src={client.src}
              alt={client.name}
              className="h-16 sm:h-24 lg:h-28 w-auto object-contain opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500"
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default ClientTicker;
