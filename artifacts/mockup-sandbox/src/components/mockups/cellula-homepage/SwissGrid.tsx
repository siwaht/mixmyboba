import React from 'react';
import { Button } from "@/components/ui/button";

export function SwissGrid() {
  return (
    <div className="min-h-screen bg-[#f7f5f2] text-zinc-900 font-sans selection:bg-amber-500 selection:text-white pb-24">
      {/* Navbar */}
      <nav className="border-b border-zinc-900 flex justify-between items-end pb-4 pt-8 px-6 sticky top-0 bg-[#f7f5f2] z-50">
        <div className="text-2xl font-bold tracking-tighter uppercase leading-none">
          Cellula
        </div>
        <div className="hidden md:flex gap-8 text-sm uppercase tracking-widest font-medium">
          <a href="#" className="hover:text-amber-600 transition-colors">Peptides</a>
          <a href="#" className="hover:text-amber-600 transition-colors">Testing</a>
          <a href="#" className="hover:text-amber-600 transition-colors">Research</a>
          <a href="#" className="hover:text-amber-600 transition-colors">About</a>
        </div>
        <div className="text-sm uppercase tracking-widest font-medium hover:text-amber-600 cursor-pointer">
          Cart (0)
        </div>
      </nav>

      <main className="px-6">
        {/* Hero */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-24 pb-32 border-b border-zinc-900">
          <div className="md:col-span-8">
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.85] uppercase">
              Precision<br />
              Synthesized<br />
              Compounds.
            </h1>
          </div>
          <div className="md:col-span-4 flex flex-col justify-end mt-12 md:mt-0">
            <p className="text-lg md:text-xl font-medium leading-relaxed mb-8">
              Research-grade peptides verified by independent third-party analytics. 
              Purity over 99% guaranteed via HPLC and Mass Spectrometry.
            </p>
            <div className="flex flex-col gap-4 items-start">
              <Button className="rounded-none bg-zinc-900 text-[#f7f5f2] hover:bg-amber-600 uppercase tracking-widest text-xs h-12 px-8">
                Explore Catalog
              </Button>
              <Button variant="ghost" className="rounded-none border-b border-zinc-900 hover:bg-transparent uppercase tracking-widest text-xs h-12 px-0 text-zinc-900 hover:text-amber-600">
                View Latest COAs
              </Button>
            </div>
          </div>
        </section>

        {/* Trust Indicators */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-b border-zinc-900 uppercase text-xs tracking-widest font-medium">
          <div>Verified Purity &gt;99%</div>
          <div>Janoshik Analytics</div>
          <div>HPLC / MS Tested</div>
          <div>Cold-chain Logistics</div>
        </section>

        {/* Products */}
        <section className="pt-24 pb-32 border-b border-zinc-900">
          <div className="mb-12 flex justify-between items-end border-b border-zinc-300 pb-4">
            <h2 className="text-sm uppercase tracking-widest font-bold">Research Catalog</h2>
            <span className="text-xs uppercase tracking-widest">Showing 4 of 24 items</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {[
              { id: "BPC-157", desc: "Body Protection Compound", purity: "99.4%", price: "$45.00", lot: "NL-2038" },
              { id: "TB-500", desc: "Thymosin Beta-4", purity: "99.2%", price: "$55.00", lot: "NL-2039" },
              { id: "CJC-1295", desc: "No DAC", purity: "98.9%", price: "$42.00", lot: "NL-2040" },
              { id: "IPAMORELIN", desc: "GHRP", purity: "99.6%", price: "$48.00", lot: "NL-2041" },
            ].map(p => (
              <div key={p.id} className="flex flex-col group cursor-pointer">
                <div className="aspect-[4/5] bg-zinc-200 mb-4 overflow-hidden relative">
                  <img src={`/__mockup/images/vial-${p.id.toLowerCase()}.png`} alt={p.id} className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x500/e4e4e7/18181b?text=VIAL' }} />
                </div>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="text-2xl font-bold tracking-tight uppercase">{p.id}</h3>
                  <span className="text-lg font-medium">{p.price}</span>
                </div>
                <div className="text-sm font-medium mb-4">{p.desc}</div>
                
                <div className="grid grid-cols-2 gap-4 text-xs uppercase tracking-widest border-t border-zinc-300 pt-4 mt-auto">
                  <div>
                    <span className="text-zinc-500 block mb-1">Purity</span>
                    <span className="font-bold">{p.purity}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block mb-1">Lot No.</span>
                    <span className="font-bold">{p.lot}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Process */}
        <section className="pt-24 pb-32 border-b border-zinc-900">
          <h2 className="text-sm uppercase tracking-widest font-bold mb-12 border-b border-zinc-300 pb-4">Verification Protocol</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-4xl font-bold tracking-tighter mb-4">01</div>
              <h3 className="text-lg uppercase font-bold tracking-tight mb-4">Synthesis</h3>
              <p className="text-sm leading-relaxed max-w-sm">
                Custom solid-phase peptide synthesis utilizing FMOC methodology. Crude materials undergo primary filtration.
              </p>
            </div>
            <div>
              <div className="text-4xl font-bold tracking-tighter mb-4">02</div>
              <h3 className="text-lg uppercase font-bold tracking-tight mb-4">Purification</h3>
              <p className="text-sm leading-relaxed max-w-sm">
                Preparative High-Performance Liquid Chromatography (HPLC) isolates the target compound from synthesis byproducts.
              </p>
            </div>
            <div>
              <div className="text-4xl font-bold tracking-tighter mb-4">03</div>
              <h3 className="text-lg uppercase font-bold tracking-tight mb-4">Analytics</h3>
              <p className="text-sm leading-relaxed max-w-sm">
                Independent blind testing by Janoshik Analytics. Each lot is assigned a unique verifiable certificate of analysis.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="px-6 pt-24">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-24 border-b border-zinc-900">
          <div className="md:col-span-2">
            <div className="text-2xl font-bold tracking-tighter uppercase leading-none mb-4">Cellula</div>
            <p className="text-xs max-w-sm uppercase tracking-widest leading-relaxed text-zinc-500">
              For laboratory research use only.<br/>Not for human consumption.
            </p>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-widest font-bold mb-6">Navigation</h4>
            <div className="flex flex-col gap-4 text-xs uppercase tracking-widest font-medium">
              <a href="#" className="hover:text-amber-600">Peptides</a>
              <a href="#" className="hover:text-amber-600">Testing Protocols</a>
              <a href="#" className="hover:text-amber-600">About Us</a>
              <a href="#" className="hover:text-amber-600">Contact</a>
            </div>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-widest font-bold mb-6">Legal</h4>
            <div className="flex flex-col gap-4 text-xs uppercase tracking-widest font-medium">
              <a href="#" className="hover:text-amber-600">Terms of Service</a>
              <a href="#" className="hover:text-amber-600">Privacy Policy</a>
              <a href="#" className="hover:text-amber-600">Compliance</a>
              <a href="#" className="hover:text-amber-600">Returns</a>
            </div>
          </div>
        </div>
        <div className="pt-6 flex justify-between text-xs uppercase tracking-widest font-medium text-zinc-500">
          <div>&copy; {new Date().getFullYear()} Cellula Labs</div>
          <div>Swiss Grid Iteration 01</div>
        </div>
      </footer>
    </div>
  );
}
