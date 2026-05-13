"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView, animate, useReducedMotion } from "framer-motion";
import { Users, ShieldCheck, Award } from "lucide-react";

interface Props {
  profesionales: number;
  obrasSociales: number;
  beneficios: number;
}

export default function FloatingStatPills({
  profesionales,
  obrasSociales,
  beneficios,
  delay = 0.6,
}: Props & { delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  const [profDisplay, setProfDisplay] = useState(0);
  const [osDisplay, setOsDisplay] = useState(0);
  const [benDisplay, setBenDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    if (shouldReduceMotion) {
      setProfDisplay(profesionales);
      setOsDisplay(obrasSociales);
      setBenDisplay(beneficios);
      return;
    }

    // Esperamos a que la pill entre para empezar a contar
    const timeout = setTimeout(
      () => {
        const c1 = animate(0, profesionales, {
          duration: 2.5,
          ease: "easeOut",
          onUpdate: (v) => setProfDisplay(Math.round(v)),
        });
        const c2 = animate(0, obrasSociales, {
          duration: 2.0,
          ease: "easeOut",
          onUpdate: (v) => setOsDisplay(Math.round(v)),
        });
        const c3 = animate(0, beneficios, {
          duration: 2.2,
          ease: "easeOut",
          onUpdate: (v) => setBenDisplay(Math.round(v)),
        });

        return () => {
          c1.stop();
          c2.stop();
          c3.stop();
        };
      },
      delay * 1000 + 200,
    ); // Delay de entrada + un poquito más

    return () => clearTimeout(timeout);
  }, [
    isInView,
    shouldReduceMotion,
    profesionales,
    obrasSociales,
    beneficios,
    delay,
  ]);

  const pills = [
    {
      icon: Users,
      display: profDisplay,
      desc: "Profesionales",
      pos: "top-0 right-0",
      anim: "float-1",
      delayOffset: 0,
    },
    {
      icon: ShieldCheck,
      display: osDisplay,
      desc: "Obras sociales",
      pos: "top-[calc(50%-22px)] left-8",
      anim: "float-2",
      delayOffset: 0.3,
    },
    {
      icon: Award,
      display: benDisplay,
      desc: "Beneficios",
      pos: "bottom-0 right-12",
      anim: "float-3",
      delayOffset: 0.6,
    },
  ];

  return (
    <div ref={ref} className="hidden lg:block relative h-72">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .float-1 { animation: float 5s ease-in-out infinite; }
        .float-2 { animation: float 6.5s ease-in-out infinite 1s; }
        .float-3 { animation: float 4.8s ease-in-out infinite 2s; }
      `}</style>

      {pills.map(({ icon: Icon, display, desc, pos, anim, delayOffset }) => (
        <motion.div
          key={desc}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
          transition={{
            duration: 0.6,
            delay: delay + delayOffset,
            ease: [0.23, 1, 0.32, 1],
          }}
          className={`absolute ${pos}`}
        >
          <div className={`${anim}`}>
            <div className="inline-flex items-center gap-3 bg-slate-800/60 backdrop-blur-md border border-white/10 rounded-full px-5 py-3 shadow-lg hover:bg-slate-800/80 transition-colors cursor-default group">
              <div className="h-8 w-8 bg-blue-600/20 rounded-full flex items-center justify-center shrink-0 group-hover:bg-blue-600/30 transition-colors">
                <Icon className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <span className="text-xl font-black text-white">
                  +{display.toLocaleString()}
                </span>
                <span className="text-slate-400 text-sm ml-2">{desc}</span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
