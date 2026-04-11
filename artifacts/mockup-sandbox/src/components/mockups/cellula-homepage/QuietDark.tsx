import React from "react";
import { ShoppingCart, Menu, ArrowRight, CheckCircle2, Shield, Beaker, FileText, ChevronRight } from "lucide-react";

export function QuietDark() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#e0e0e0] font-sans selection:bg-[#d4b896] selection:text-[#0d0d0d]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0d0d0d]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <a href="#" className="text-xl font-medium tracking-wide text-[#d4b896]">
              CELLULA<span className="font-light text-white/50">LABS</span>
            </a>
            <div className="hidden md:flex gap-8 text-sm tracking-wide text-white/60">
              <a href="#" className="hover:text-white transition-colors">PEPTIDES</a>
              <a href="#" className="hover:text-white transition-colors">RESEARCH</a>
              <a href="#" className="hover:text-white transition-colors">TESTING</a>
              <a href="#" className="hover:text-white transition-colors">ABOUT</a>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-white/60 hover:text-white transition-colors hidden sm:block text-sm tracking-wide">
              ACCOUNT
            </button>
            <button className="text-white/60 hover:text-[#d4b896] transition-colors flex items-center gap-2">
              <ShoppingCart size={18} strokeWidth={1.5} />
              <span className="text-sm">0</span>
            </button>
            <button className="md:hidden text-white/60 hover:text-white">
              <Menu size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/10 text-xs tracking-widest text-[#d4b896] mb-8 uppercase">
          <span className="w-1.5 h-1.5 bg-[#d4b896]"></span>
          Purity Confirmed
        </div>
        <h1 className="text-5xl md:text-7xl font-light tracking-tight leading-tight mb-8 max-w-4xl text-white">
          Precision synthesized for <br className="hidden md:block"/> rigorous research.
        </h1>
        <p className="text-lg md:text-xl text-white/40 max-w-2xl font-light mb-12 leading-relaxed">
          Uncompromised peptide purity verified by Janoshik Analytics. 
          HPLC and Mass Spectrometry reports available for every batch.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <button className="px-8 py-4 bg-[#d4b896] text-[#0d0d0d] text-sm tracking-widest font-medium hover:bg-[#e8cbb6] transition-colors flex items-center justify-center gap-2 group">
            VIEW CATALOG
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="px-8 py-4 border border-white/10 text-white text-sm tracking-widest font-medium hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
            TESTING PROTOCOL
          </button>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="border-y border-white/5 bg-[#111111]">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start gap-2 text-white/40">
            <span className="text-2xl text-white font-light">99.8%</span>
            <span className="text-xs tracking-widest uppercase">Minimum Purity</span>
          </div>
          <div className="flex flex-col items-center md:items-start gap-2 text-white/40">
            <span className="text-2xl text-white font-light">100%</span>
            <span className="text-xs tracking-widest uppercase">Third-Party Tested</span>
          </div>
          <div className="flex flex-col items-center md:items-start gap-2 text-white/40">
            <span className="text-2xl text-white font-light">ISO 9001</span>
            <span className="text-xs tracking-widest uppercase">Certified Facility</span>
          </div>
          <div className="flex flex-col items-center md:items-start gap-2 text-white/40">
            <span className="text-2xl text-white font-light">24h</span>
            <span className="text-xs tracking-widest uppercase">Fulfillment</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-16">
          <div className="space-y-6">
            <Beaker className="w-8 h-8 text-[#d4b896]" strokeWidth={1} />
            <h3 className="text-xl font-light text-white">Synthesized to Spec</h3>
            <p className="text-sm text-white/40 leading-relaxed font-light">
              Every sequence is strictly formulated using Fmoc solid-phase peptide synthesis (SPPS) and lyophilized for absolute stability.
            </p>
          </div>
          <div className="space-y-6">
            <Shield className="w-8 h-8 text-[#d4b896]" strokeWidth={1} />
            <h3 className="text-xl font-light text-white">Janoshik Verified</h3>
            <p className="text-sm text-white/40 leading-relaxed font-light">
              We partner exclusively with Janoshik Analytics. Each batch undergoes independent HPLC and MS testing before release.
            </p>
          </div>
          <div className="space-y-6">
            <FileText className="w-8 h-8 text-[#d4b896]" strokeWidth={1} />
            <h3 className="text-xl font-light text-white">Transparent COAs</h3>
            <p className="text-sm text-white/40 leading-relaxed font-light">
              Full certificates of analysis are published directly on product pages. No obscured lot numbers, no hidden results.
            </p>
          </div>
        </div>
      </section>

      {/* Catalog Grid */}
      <section className="py-24 px-6 max-w-7xl mx-auto border-t border-white/5">
        <div className="flex justify-between items-end mb-16">
          <h2 className="text-3xl font-light text-white">Research Compounds</h2>
          <a href="#" className="hidden md:flex items-center gap-2 text-sm tracking-widest text-[#d4b896] hover:text-[#e8cbb6] uppercase transition-colors group">
            All Products
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { name: "BPC-157", weight: "5mg", purity: "99.8%", price: "$45.00" },
            { name: "TB-500", weight: "5mg", purity: "99.6%", price: "$52.00" },
            { name: "GHK-Cu", weight: "50mg", purity: "99.9%", price: "$38.00" },
            { name: "CJC-1295", weight: "2mg", purity: "99.5%", price: "$32.00" },
            { name: "Ipamorelin", weight: "2mg", purity: "99.7%", price: "$28.00" },
            { name: "MOTS-c", weight: "10mg", purity: "99.2%", price: "$65.00" }
          ].map((product, i) => (
            <div key={i} className="group border border-white/5 p-8 flex flex-col bg-[#111111] hover:border-[#d4b896]/30 transition-colors">
              <div className="flex justify-between items-start mb-12">
                <span className="text-xs tracking-widest text-white/30 uppercase">Lyophilized</span>
                <span className="text-xs text-[#d4b896] tracking-widest">{product.purity}</span>
              </div>
              <h3 className="text-2xl font-light text-white mb-2">{product.name}</h3>
              <p className="text-sm text-white/40 mb-12">{product.weight}</p>
              
              <div className="mt-auto flex justify-between items-center border-t border-white/5 pt-6">
                <span className="text-lg font-light text-white">{product.price}</span>
                <button className="text-xs tracking-widest uppercase text-[#d4b896] hover:text-white transition-colors">
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Process Section */}
      <section className="py-32 px-6 max-w-7xl mx-auto border-t border-white/5">
        <h2 className="text-3xl font-light text-white mb-16 text-center">The Standard of Purity</h2>
        <div className="grid md:grid-cols-4 gap-8">
          {[
            { step: "01", title: "Synthesis", desc: "Rigorous SPPS production ensuring sequential accuracy." },
            { step: "02", title: "Purification", desc: "Multi-stage preparative HPLC to remove truncated sequences." },
            { step: "03", title: "Verification", desc: "Independent Janoshik testing for exact mass and purity." },
            { step: "04", title: "Fulfillment", desc: "Climate-controlled storage and discreet, rapid dispatch." }
          ].map((item, i) => (
            <div key={i} className="relative pt-6 border-t border-white/10">
              <span className="absolute -top-3 left-0 bg-[#0d0d0d] pr-4 text-xs tracking-widest text-[#d4b896]">
                {item.step}
              </span>
              <h4 className="text-lg font-light text-white mb-3">{item.title}</h4>
              <p className="text-sm text-white/40 leading-relaxed font-light">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 pt-20 pb-10 px-6 mt-20">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 mb-16 text-sm">
          <div>
            <a href="#" className="text-xl font-medium tracking-wide text-[#d4b896] block mb-6">
              CELLULA<span className="font-light text-white/50">LABS</span>
            </a>
            <p className="text-white/40 font-light leading-relaxed max-w-xs">
              Research chemicals for laboratory use only. Not for human consumption.
            </p>
          </div>
          <div>
            <h5 className="text-white mb-6 uppercase tracking-widest text-xs">Products</h5>
            <ul className="space-y-4 text-white/40 font-light">
              <li><a href="#" className="hover:text-[#d4b896] transition-colors">All Peptides</a></li>
              <li><a href="#" className="hover:text-[#d4b896] transition-colors">Amino Acids</a></li>
              <li><a href="#" className="hover:text-[#d4b896] transition-colors">Testing Kits</a></li>
              <li><a href="#" className="hover:text-[#d4b896] transition-colors">Lab Supplies</a></li>
            </ul>
          </div>
          <div>
            <h5 className="text-white mb-6 uppercase tracking-widest text-xs">Resources</h5>
            <ul className="space-y-4 text-white/40 font-light">
              <li><a href="#" className="hover:text-[#d4b896] transition-colors">COA Database</a></li>
              <li><a href="#" className="hover:text-[#d4b896] transition-colors">Reconstitution Guide</a></li>
              <li><a href="#" className="hover:text-[#d4b896] transition-colors">Storage Protocols</a></li>
              <li><a href="#" className="hover:text-[#d4b896] transition-colors">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h5 className="text-white mb-6 uppercase tracking-widest text-xs">Legal</h5>
            <ul className="space-y-4 text-white/40 font-light">
              <li><a href="#" className="hover:text-[#d4b896] transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-[#d4b896] transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-[#d4b896] transition-colors">Return Policy</a></li>
              <li><a href="#" className="hover:text-[#d4b896] transition-colors">Disclaimer</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-light text-white/30">
          <p>© {new Date().getFullYear()} Cellula Labs. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <Shield size={14} />
            Secure SSL Checkout
          </div>
        </div>
      </footer>
    </div>
  );
}
