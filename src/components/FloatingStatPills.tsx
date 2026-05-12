"use client";

import { Users, ShieldCheck, Award } from "lucide-react";

interface Props {
  profesionales: number;
  obrasSociales: number;
  beneficios: number;
}

const pills = [
  { icon: Users, getLabel: (p: Props) => `+${p.profesionales}`, desc: "Profesionales registrados", pos: "top-0 right-0", anim: "float-1" },
  { icon: ShieldCheck, getLabel: (p: Props) => `+${p.obrasSociales}`, desc: "Obras sociales activas", pos: "top-[calc(50%-22px)] left-8", anim: "float-2" },
  { icon: Award, getLabel: (p: Props) => `+${p.beneficios}`, desc: "Beneficios KineClub", pos: "bottom-0 right-12", anim: "float-3" },
];

export default function FloatingStatPills(props: Props) {
  return (
    <div className="hidden lg:block relative h-72">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px); }
        }
        .float-1 { animation: float 4s ease-in-out infinite; }
        .float-2 { animation: float 5.5s ease-in-out infinite 1s; }
        .float-3 { animation: float 3.8s ease-in-out infinite 2s; }
      `}</style>

      {pills.map(({ icon: Icon, getLabel, desc, pos, anim }) => (
        <div key={desc} className={`absolute ${pos} ${anim}`}>
          <div className="inline-flex items-center gap-3 bg-slate-800/60 backdrop-blur-md border border-white/10 rounded-full px-5 py-3 shadow-lg">
            <div className="h-8 w-8 bg-blue-600/20 rounded-full flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <span className="text-xl font-black text-white">{getLabel(props)}</span>
              <span className="text-slate-400 text-sm ml-2">{desc}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
