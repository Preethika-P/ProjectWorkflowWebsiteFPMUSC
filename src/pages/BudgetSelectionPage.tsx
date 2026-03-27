import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { WorkflowData } from '@/types';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';

interface BudgetSelectionPageProps {
  workflowData: WorkflowData;
}

export function BudgetSelectionPage({ workflowData }: BudgetSelectionPageProps) {
  const navigate = useNavigate();
  const premiumEase = [0.16, 1, 0.3, 1] as const;
  const easeOut = 'easeOut' as const;
  const easeInOut = 'easeInOut' as const;

  const handleSelectBudget = (budgetKey: 'under-5m' | 'over-5m') => {
    navigate(`/budget/${budgetKey}/workflow`);
  };

  // Title: premium rise + slight scale
  const titleIn: Variants = {
    hidden: { opacity: 0, y: 18, scale: 0.985 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 1.05, ease: premiumEase, delay: 0.18 },
    },
  };

  // Divider: grow from center
  const dividerIn: Variants = {
    hidden: { opacity: 0, scaleX: 0 },
    show: {
      opacity: 1,
      scaleX: 1,
      transition: { duration: 0.9, ease: premiumEase, delay: 0.38 },
    },
  };

  // Header: gentle fade (not dropping)
  const headerIn: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { duration: 0.8, ease: easeOut, delay: 0.08 },
    },
  };

  // Card: float up + scale
  const cardIn: Variants = {
    hidden: { opacity: 0, y: 18, scale: 0.985 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 1.05, ease: premiumEase, delay: 0.75 },
    },
  };

  // ✅ Entrance: left tile from left, right tile from right (more obvious slide-in)
  const tileLeftIn: Variants = {
    hidden: { opacity: 0, x: -120, y: 6, scale: 0.99 },
    show: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: { duration: 0.95, ease: premiumEase, delay: 1.0 },
    },
  };

  const tileRightIn: Variants = {
    hidden: { opacity: 0, x: 120, y: 6, scale: 0.99 },
    show: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: { duration: 0.95, ease: premiumEase, delay: 1.08 },
    },
  };

  // Subtle floating for GIF badges
  const floatBadge = {
    animate: {
      y: [0, -4, 0],
      transition: { duration: 2.6, repeat: Infinity, ease: easeInOut },
    } as any,
  };

  /**
   * Paragraph reveal:
   * - Outer wrapper: top->bottom "line stepping" via clip-path + steps()
   * - Inner wrapper: left->right PER LINE via striped mask
   */
  const LINE_STEPS = 5;

  return (
    <motion.div
      className="min-h-screen overflow-x-hidden bg-[radial-gradient(1100px_520px_at_50%_-12%,rgba(153,27,27,0.12),transparent_62%),radial-gradient(900px_420px_at_80%_12%,rgba(15,23,42,0.06),transparent_55%),linear-gradient(to_bottom_right,#f8fafc,white,#f1f5f9)]"
      initial="hidden"
      animate="show"
    >
      {/* Tiny blank moment overlay (cinematic) */}
      <motion.div
        aria-hidden="true"
        className="fixed inset-0 z-[9999] bg-white"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 0.05, duration: 0.26, ease: easeOut }}
        style={{ pointerEvents: 'none' }}
      />

      {/* Subtle grain + vignette */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-[0.08] mix-blend-multiply [background-image:radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.55)_1px,transparent_0)] [background-size:18px_18px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.08 }}
        transition={{ duration: 1.0, ease: easeOut, delay: 0.12 }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(1200px_700px_at_50%_40%,transparent_55%,rgba(2,6,23,0.06))]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.1, ease: easeOut, delay: 0.12 }}
      />

      {/* Premium drifting glow */}
      <motion.div aria-hidden="true" className="pointer-events-none fixed inset-0">
        <motion.div
          className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
          animate={{ x: [-12, 12, -12], y: [0, 10, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: easeInOut }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
        />
      </motion.div>

      {/* Header (fade in, not drop) */}
      <motion.header variants={headerIn} className="sticky top-0 z-10">
        <div className="bg-primary">
          <div className="mx-auto flex max-w-7xl items-center justify-end px-6 py-1">
            <img src="/USC Logo Cropped.png" alt="USC logo" className="h-8 sm:h-9 w-auto opacity-95" />
          </div>
        </div>

        <div className="border-b border-slate-200/70 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70">
          <div className="mx-auto max-w-7xl px-6 py-4 sm:py-5">
            <img
              src="/FPM USC Logo.svg"
              alt="USC Facilities Planning and Management"
              className="h-14 sm:h-16 w-auto"
            />
          </div>
        </div>
      </motion.header>

      {/* Main */}
      <main className="mx-auto max-w-2xl px-6 py-12 sm:py-14">
        {/* Hero */}
        <div className="mb-8 text-center sm:mb-10">
          <motion.h1
            variants={titleIn}
            className="font-serif text-4xl font-bold tracking-tight text-primary sm:text-5xl"
          >
            Project Workflow Portal
          </motion.h1>

          <motion.div variants={dividerIn} className="mx-auto mt-4 h-px w-20 origin-center bg-primary/25" />

          {/* Paragraph reveal (line-by-line + left->right per line) */}
          <motion.div className="mx-auto mt-4 max-w-md" initial={false}>
            <motion.div
              initial={{ clipPath: 'inset(0 0 100% 0)' }}
              animate={{ clipPath: 'inset(0 0 0% 0)' }}
              transition={{
                delay: 0.55,
                duration: 1.25,
                ease: 'linear',
              }}
              style={{
                transitionTimingFunction: `steps(${LINE_STEPS}, end)`,
              }}
            >
              <motion.div
              initial={{
                  WebkitMaskImage:
                    'repeating-linear-gradient(to bottom, #000 0, #000 var(--line), transparent var(--line), transparent var(--gap))',
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskSize: '0% 100%',
                  WebkitMaskPosition: '0% 0%',

                  maskImage:
                    'repeating-linear-gradient(to bottom, #000 0, #000 var(--line), transparent var(--line), transparent var(--gap))',
                  maskRepeat: 'no-repeat',
                  maskSize: '0% 100%',
                  maskPosition: '0% 0%',
                } as any}
                animate={{
                  WebkitMaskSize: '100% 100%',
                  maskSize: '100% 100%',
                } as any}
                transition={{
                  delay: 0.58,
                  duration: 1.15,
                  ease: premiumEase,
                }}
                style={{
                  ['--line' as any]: '1.35em',
                  ['--gap' as any]: '1.55em',
                }}
              >
                <p className="text-base leading-snug text-slate-600/70 sm:text-[17px]">
                  Manage project workflows by phase.<br />
                  Track tasks across stages, mark them complete, and add notes as you go!
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Card */}
        <motion.div variants={cardIn}>
          <Card className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur shadow-[0_20px_55px_-26px_rgba(15,23,42,0.38)]">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/70 via-white/10 to-transparent" />
            <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[520px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

            <CardContent className="relative p-7 sm:p-9">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.98, duration: 0.55, ease: easeOut }}
                className="mb-8 text-center text-sm font-bold uppercase tracking-[0.14em] text-slate-700"
              >
                Select a project budget range to begin
              </motion.p>

              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                {/* Tile 1 */}
                <motion.div
                  variants={tileLeftIn}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  className="relative"
                >
                  <div className="relative h-7" />

                  <motion.div
                    animate={floatBadge.animate}
                    className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 -ml-8 -mt-6"
                  >
                    <img
                      src="/dollarstack.gif"
                      alt="Budget upto $5M"
                      className="h-20 w-20 object-contain drop-shadow-xl"
                    />
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.99 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                  >
                    <Button
                      size="lg"
                      className="relative h-24 w-full rounded-2xl border border-primary/15 bg-primary text-lg font-semibold text-white shadow-[0_16px_36px_-22px_rgba(153,27,27,0.78)] transition-shadow duration-200 hover:shadow-[0_22px_44px_-24px_rgba(153,27,27,0.82)] focus-visible:outline-none"
                      onClick={() => handleSelectBudget('under-5m')}
                    >
                      Upto $5M
                    </Button>
                  </motion.div>
                </motion.div>

                {/* Tile 2 */}
                <motion.div
                  variants={tileRightIn}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  className="relative"
                >
                  <div className="relative h-7" />

                  <motion.div
                    animate={floatBadge.animate}
                    className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 -ml-8 -mt-6"
                  >
                    <img
                      src="/building.gif"
                      alt="Budget $5M and above"
                      className="h-20 w-20 object-contain drop-shadow-xl"
                    />
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.99 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                  >
                    <Button
                      size="lg"
                      variant="outline"
                      className="relative h-24 w-full rounded-2xl border border-primary/25 bg-white/60 text-lg font-semibold text-primary shadow-[0_16px_36px_-26px_rgba(15,23,42,0.36)] transition-all duration-200 hover:border-primary/35 hover:bg-primary/5 hover:shadow-[0_22px_44px_-28px_rgba(15,23,42,0.40)] focus-visible:outline-none"
                      onClick={() => handleSelectBudget('over-5m')}
                    >
                      $5M and Above
                    </Button>
                  </motion.div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </motion.div>
  );
}
