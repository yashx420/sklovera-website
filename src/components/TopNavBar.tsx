import { motion } from 'framer-motion';

const TopNavBar = () => (
  <motion.nav
    initial={{ y: -80, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
    className="bg-stone-50/80 dark:bg-neutral-950/80 backdrop-blur-xl text-neutral-900 dark:text-stone-100 docked full-width top-0 sticky z-50 shadow-[0px_24px_48px_rgba(26,28,27,0.06)]"
  >
    <div className="flex justify-between items-center w-full px-12 py-6 max-w-[1920px] mx-auto">
      <div className="flex items-center gap-12">
        <a className="text-xl font-serif italic text-neutral-900 dark:text-stone-100 tracking-tight flex items-center gap-4" href="#">
          <motion.img
            whileHover={{ rotate: 8, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 150, damping: 12 }}
            src="/sklovera-logo.svg" alt="Sklovera Logo" className="h-10 object-contain drop-shadow"
          />
          <span className="hidden lg:block border-l border-neutral-300 dark:border-neutral-700 pl-4">The Editorial Glassware Platform</span>
        </a>
        <div className="hidden md:flex items-center gap-8">
          <a className="text-neutral-900 dark:text-stone-100 border-b-2 border-teal-900 dark:border-teal-500 pb-1 font-medium transition-colors duration-300" href="#">Explore Collections</a>
          <a className="text-neutral-500 dark:text-stone-400 font-medium hover:text-teal-900 dark:hover:text-teal-400 transition-colors duration-300" href="#">My Projects</a>
          <a className="text-neutral-500 dark:text-stone-400 font-medium hover:text-teal-900 dark:hover:text-teal-400 transition-colors duration-300" href="#">RFQ History</a>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="hidden lg:flex items-center bg-stone-100/50 dark:bg-neutral-900/50 px-4 py-2 rounded-full">
          <span className="material-symbols-outlined text-sm mr-2" data-icon="search">search</span>
          <input className="bg-transparent border-none focus:ring-0 text-sm w-48 outline-none" placeholder="Search Atelier..." type="text"/>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-primary text-on-primary px-6 py-2.5 rounded-lg text-sm font-semibold satin-gradient transition-all"
        >
          Request Quote
        </motion.button>
        <div className="flex items-center gap-4 text-neutral-900 dark:text-stone-100">
          <motion.span whileHover={{ scale: 1.2, rotate: 15 }} className="material-symbols-outlined cursor-pointer hover:opacity-70 transition-opacity" data-icon="notifications">notifications</motion.span>
          <motion.span whileHover={{ scale: 1.2 }} className="material-symbols-outlined cursor-pointer hover:opacity-70 transition-opacity" data-icon="person">person</motion.span>
        </div>
      </div>
    </div>
  </motion.nav>
);

export default TopNavBar;
