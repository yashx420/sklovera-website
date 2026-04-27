import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  DEFAULT_CONFIG,
  loadPricingConfig,
  onPricingChange,
  savePricingConfig,
  type PricingConfig,
  type VolumeBreak,
} from '../lib/pricing';
import { currentUser, onAuthChange } from '../lib/auth';

const pct = (n: number) => (n * 100).toFixed(1);

const AdminPricing = () => {
  const [user, setUser] = useState(() => currentUser());
  const [cfg, setCfg] = useState<PricingConfig>(() => loadPricingConfig());
  const [dirty, setDirty] = useState(false);

  useEffect(() => onAuthChange(() => setUser(currentUser())), []);
  useEffect(() => {
    const refresh = () => {
      setCfg(loadPricingConfig());
      setDirty(false);
    };
    return onPricingChange(refresh);
  }, []);

  const update = (patch: Partial<PricingConfig>) => {
    setCfg((c) => ({ ...c, ...patch }));
    setDirty(true);
  };
  const updateMargin = (tier: keyof PricingConfig['margin'], v: number) => {
    setCfg((c) => ({ ...c, margin: { ...c.margin, [tier]: v } }));
    setDirty(true);
  };
  const updateBreak = (idx: number, patch: Partial<VolumeBreak>) => {
    setCfg((c) => ({
      ...c,
      volumeBreaks: c.volumeBreaks.map((b, i) => (i === idx ? { ...b, ...patch } : b)),
    }));
    setDirty(true);
  };
  const addBreak = () => {
    setCfg((c) => ({ ...c, volumeBreaks: [...c.volumeBreaks, { minUnits: 0, discountPct: 0 }] }));
    setDirty(true);
  };
  const removeBreak = (idx: number) => {
    setCfg((c) => ({ ...c, volumeBreaks: c.volumeBreaks.filter((_, i) => i !== idx) }));
    setDirty(true);
  };
  const save = () => {
    savePricingConfig(cfg);
    setDirty(false);
  };
  const reset = () => {
    setCfg(DEFAULT_CONFIG);
    setDirty(true);
  };

  if (user.role !== 'admin') {
    return (
      <section className="py-32 px-12 text-center">
        <h2 className="font-headline text-4xl italic text-primary mb-4">Admin access only</h2>
        <p className="text-on-surface-variant">Sign in as admin to configure the pricing engine.</p>
      </section>
    );
  }

  return (
    <section className="py-20 px-12">
      <div className="max-w-[1200px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <span className="text-on-surface-variant font-medium tracking-wide text-sm block mb-4">Administration</span>
          <h2 className="font-headline text-5xl italic text-primary mb-2">Pricing Engine</h2>
          <p className="text-on-surface-variant mb-10 max-w-2xl">
            Landed cost, tier margins, volume discounts, and FX — consumed by the auto-quote pipeline.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-surface-container-lowest rounded-xl p-6 space-y-4">
            <h3 className="font-headline italic text-2xl text-primary">Currency & Landed Cost</h3>
            <Field
              label="1 EUR = INR"
              value={cfg.fxEurToInr}
              onChange={(v) => update({ fxEurToInr: v })}
              step={0.01}
            />
            <Pct label="Freight (on EXW)" value={cfg.freightPct} onChange={(v) => update({ freightPct: v })} />
            <Pct label="Duty (on EXW + freight)" value={cfg.dutyPct} onChange={(v) => update({ dutyPct: v })} />
            <Pct
              label="Handling (on landed subtotal)"
              value={cfg.handlingPct}
              onChange={(v) => update({ handlingPct: v })}
            />
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-6 space-y-4">
            <h3 className="font-headline italic text-2xl text-primary">Tier Margins</h3>
            <Pct label="B2B" value={cfg.margin.b2b} onChange={(v) => updateMargin('b2b', v)} />
            <Pct label="Retail" value={cfg.margin.retail} onChange={(v) => updateMargin('retail', v)} />
            <Pct label="B2C" value={cfg.margin.b2c} onChange={(v) => updateMargin('b2c', v)} />
            <div className="text-xs text-on-surface-variant pt-2">
              Margin applied multiplicatively on landed cost before volume discount.
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-headline italic text-2xl text-primary">Volume Breaks</h3>
            <button
              onClick={addBreak}
              className="text-xs font-semibold px-3 py-2 rounded-md bg-surface-container-low text-primary hover:bg-surface-container"
            >
              + Add break
            </button>
          </div>
          <table className="w-full text-sm">
            <thead className="text-on-surface-variant text-[10px] uppercase tracking-wider">
              <tr>
                <th className="text-left py-2">Min units (total)</th>
                <th className="text-left py-2">Discount %</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cfg.volumeBreaks.map((b, i) => (
                <tr key={i} className="border-t border-outline-variant/15">
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      min={0}
                      value={b.minUnits}
                      onChange={(e) =>
                        updateBreak(i, { minUnits: Math.max(0, parseInt(e.target.value, 10) || 0) })
                      }
                      className="w-32 bg-surface-container-low px-3 py-2 rounded-md outline-none"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step={0.1}
                        min={0}
                        max={100}
                        value={pct(b.discountPct)}
                        onChange={(e) =>
                          updateBreak(i, { discountPct: Math.max(0, (parseFloat(e.target.value) || 0) / 100) })
                        }
                        className="w-28 bg-surface-container-low px-3 py-2 rounded-md outline-none"
                      />
                      <span className="text-on-surface-variant text-xs">%</span>
                    </div>
                  </td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => removeBreak(i)}
                      className="text-xs text-on-surface-variant hover:text-primary hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={!dirty}
            className="bg-primary text-surface px-6 py-3 rounded-md font-semibold disabled:opacity-40"
          >
            Save configuration
          </button>
          <button
            onClick={reset}
            className="px-4 py-3 rounded-md text-on-surface-variant hover:text-primary text-sm"
          >
            Reset to defaults
          </button>
          {dirty && <span className="text-xs text-tertiary-fixed font-semibold">Unsaved changes</span>}
        </div>
      </div>
    </section>
  );
};

const Field = ({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) => (
  <label className="block">
    <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">{label}</span>
    <input
      type="number"
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className="mt-2 w-full bg-surface-container-low px-4 py-3 rounded-md outline-none"
    />
  </label>
);

const Pct = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) => (
  <label className="block">
    <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">{label}</span>
    <div className="mt-2 flex items-center gap-2">
      <input
        type="number"
        step={0.1}
        min={0}
        value={pct(value)}
        onChange={(e) => onChange(Math.max(0, (parseFloat(e.target.value) || 0) / 100))}
        className="w-full bg-surface-container-low px-4 py-3 rounded-md outline-none"
      />
      <span className="text-on-surface-variant text-sm">%</span>
    </div>
  </label>
);

export default AdminPricing;
