import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, Phone, ArrowUpRight } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-400 relative overflow-hidden">
      <div className="" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Top: Brand + tagline */}
        <div className="pt-16 pb-12 border-b border-slate-800 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div>
            <div className="mb-4">
              <Image src="/logo.png" alt="Círculo de Kinesiólogos de Mendoza" width={120} height={40} className="h-10 w-auto" />
            </div>
            <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
              Representando y acompañando a los profesionales de la kinesiología en Mendoza desde hace décadas.
            </p>
          </div>
          <div className="flex gap-3">
            <a href="#" className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-blue-600 hover:border-blue-600 transition-colors">
              <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="#" className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-blue-600 hover:border-blue-600 transition-colors">
              <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>

        {/* Mid: Links grid */}
        <div className="py-12 grid grid-cols-2 md:grid-cols-4 gap-10 border-b border-slate-800">
          <div>
            <h3 className="text-white font-black text-xs uppercase tracking-widest mb-5">Institucional</h3>
            <ul className="space-y-3 text-sm">
              {[
                { label: "Sobre Nosotros", href: "/nosotros" },
                { label: "Autoridades", href: "/autoridades" },
                { label: "Estatutos", href: "/estatuto" },
                { label: "Contacto", href: "/contacto" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-black text-xs uppercase tracking-widest mb-5">Servicios</h3>
            <ul className="space-y-3 text-sm">
              {[
                { label: "Padrón de Profesionales", href: "/profesionales" },
                { label: "Obras Sociales", href: "/obras-sociales" },
                { label: "KineClub", href: "/kineclub" },
                { label: "Capacitaciones", href: "/capacitaciones" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-black text-xs uppercase tracking-widest mb-5">Portal Socio</h3>
            <ul className="space-y-3 text-sm">
              {[
                { label: "Mi Panel", href: "/mi-panel" },
                { label: "Carnet Digital", href: "/mi-panel/carnet" },
                { label: "Circulares", href: "/mi-panel/circulares" },
                { label: "Capacitaciones", href: "/mi-panel/capacitaciones" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-black text-xs uppercase tracking-widest mb-5">Contacto</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <span>Eusebio Blanco 148, Capital, Mendoza</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-blue-500 shrink-0" />
                <a href="tel:+5492613619468" className="hover:text-white transition-colors">
                  +54 9 261 361-9468
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-blue-500 shrink-0" />
                <a href="mailto:presidencia@kinesiologosmza.com" className="hover:text-white transition-colors break-all">
                  presidencia@kinesiologosmza.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-600 uppercase tracking-widest">
          <p>© {currentYear} Círculo de Kinesiólogos de Mendoza</p>
          <Link href="/registro" className="flex items-center gap-1 text-slate-500 hover:text-white transition-colors">
            Asociate <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

      </div>
    </footer>
  );
}
