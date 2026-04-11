import React from "react";
import { ShoppingCart, Menu, FlaskConical, ChevronRight, Activity, Beaker, ShieldCheck, Database, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LabReport() {
  const products = [
    {
      id: "PEP-001",
      name: "BPC-157",
      sequence: "L-Valine, glycyl-L-alpha-glutamyl-L-prolyl-L-prolyl-L-prolylglycyl-L-lysyl-L-prolyl-L-alanyl-L-aspartyl-L-aspartyl-L-alanylglycyl-L-leucyl-L-valine",
      mass: "1419.5 g/mol",
      purity: ">99.8%",
      quantity: "5mg",
      price: "$45.00",
      status: "IN STOCK"
    },
    {
      id: "PEP-002",
      name: "TB-500",
      sequence: "Ac-Ser-Asp-Lys-Pro-Asp-Met-Ala-Glu-Ile-Glu-Lys-Phe-Asp-Lys-Ser-Lys-Leu-Lys-Lys-Thr-Glu-Thr-Gln-Glu-Lys-Asn-Pro-Leu-Pro-Ser-Lys-Glu-Thr-Ile-Glu-Gln-Glu-Lys-Gln-Ala-Gly-Glu-Ser",
      mass: "4963.5 g/mol",
      purity: ">99.5%",
      quantity: "5mg",
      price: "$55.00",
      status: "IN STOCK"
    },
    {
      id: "PEP-003",
      name: "GHK-Cu",
      sequence: "Glycyl-L-histidyl-L-lysine copper(II)",
      mass: "404.9 g/mol",
      purity: ">99.9%",
      quantity: "50mg",
      price: "$35.00",
      status: "IN STOCK"
    },
    {
      id: "PEP-004",
      name: "Semaglutide",
      sequence: "Ozempic/Wegovy active pharmaceutical ingredient equivalent",
      mass: "4113.6 g/mol",
      purity: ">99.7%",
      quantity: "5mg",
      price: "$110.00",
      status: "LOW STOCK"
    },
    {
      id: "PEP-005",
      name: "Retatrutide",
      sequence: "LY3437943; GIP/GLP-1/Glucagon receptor triple agonist",
      mass: "4731.3 g/mol",
      purity: ">99.2%",
      quantity: "10mg",
      price: "$180.00",
      status: "IN STOCK"
    },
    {
      id: "PEP-006",
      name: "Tirzepatide",
      sequence: "Mounjaro/Zepbound active pharmaceutical ingredient equivalent",
      mass: "4813.5 g/mol",
      purity: ">99.6%",
      quantity: "10mg",
      price: "$140.00",
      status: "IN STOCK"
    }
  ];

  return (
    <div className="min-h-screen bg-white text-black font-mono selection:bg-primary selection:text-white pb-20">
      {/* Top Protocol Bar */}
      <div className="border-b border-black/10 bg-black text-white text-[10px] md:text-xs uppercase tracking-widest py-1.5 px-4 flex justify-between items-center">
        <span>SYS.STAT: ONLINE</span>
        <span className="hidden md:inline">PROTOCOL: 3rd PARTY ANALYTICS ENFORCED</span>
        <span>VER: 2.1.04</span>
      </div>

      {/* Navbar */}
      <nav className="border-b border-black/20 sticky top-0 bg-white z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-black flex items-center justify-center bg-black text-white">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold tracking-tight text-lg">CELLULALABS</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Research Division</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm uppercase tracking-wider font-semibold">
            <a href="#" className="hover:text-primary transition-colors">Catalog</a>
            <a href="#" className="hover:text-primary transition-colors">Analytics (COA)</a>
            <a href="#" className="hover:text-primary transition-colors">Protocols</a>
            <a href="#" className="hover:text-primary transition-colors">Support</a>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="outline" className="rounded-none border-black text-xs h-8 px-3 uppercase hidden md:flex">
              Client Portal
            </Button>
            <button className="relative w-8 h-8 border border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors">
              <ShoppingCart className="w-4 h-4" />
              <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] w-4 h-4 flex items-center justify-center">
                0
              </span>
            </button>
            <button className="md:hidden w-8 h-8 border border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors">
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-12 md:pt-24">
        {/* Hero Section - Pure Typographic */}
        <div className="mb-24 md:mb-32 max-w-4xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-[1px] w-12 bg-primary"></div>
            <span className="text-primary text-xs uppercase tracking-widest font-bold">Document Ref: NL-09-2024</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold uppercase tracking-tighter leading-[0.9] mb-8">
            <span className="block">High-Purity</span>
            <span className="block text-gray-400">Research</span>
            <span className="block">Peptides.</span>
          </h1>
          
          <p className="text-sm md:text-base text-gray-600 max-w-2xl leading-relaxed mb-10 border-l border-black/20 pl-4">
            Providing laboratories and researchers with extensively verified, domestically synthesized peptide structures. Every batch is subjected to rigorous Janoshik Analytics HPLC and Mass Spectrometry prior to catalog inclusion.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="rounded-none bg-primary hover:bg-primary/90 text-white h-12 px-8 uppercase tracking-wider text-sm">
              Access Catalog <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
            <Button variant="outline" className="rounded-none border-black hover:bg-black hover:text-white h-12 px-8 uppercase tracking-wider text-sm">
              View Analytics (COA)
            </Button>
          </div>
        </div>

        {/* Trust Indicators - Data Table Style */}
        <div className="border border-black mb-24 md:mb-32">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-black/20">
            <div className="p-4 md:p-6 flex flex-col justify-between">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-4">Metric 01 / Purity</span>
              <div>
                <div className="text-2xl md:text-3xl font-bold">&gt;99.5%</div>
                <div className="text-xs uppercase mt-1">Average Batch Purity</div>
              </div>
            </div>
            <div className="p-4 md:p-6 flex flex-col justify-between">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-4">Metric 02 / Verification</span>
              <div>
                <div className="text-2xl md:text-3xl font-bold">100%</div>
                <div className="text-xs uppercase mt-1">Janoshik Tested</div>
              </div>
            </div>
            <div className="p-4 md:p-6 flex flex-col justify-between">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-4">Metric 03 / Output</span>
              <div>
                <div className="text-2xl md:text-3xl font-bold">50K+</div>
                <div className="text-xs uppercase mt-1">Vials Dispatched</div>
              </div>
            </div>
            <div className="p-4 md:p-6 flex flex-col justify-between">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-4">Metric 04 / Cold Chain</span>
              <div>
                <div className="text-2xl md:text-3xl font-bold">24H</div>
                <div className="text-xs uppercase mt-1">Temp-Controlled Ship</div>
              </div>
            </div>
          </div>
        </div>

        {/* 3-Column Features */}
        <div className="mb-24 md:mb-32">
          <div className="flex justify-between items-end border-b border-black pb-4 mb-8">
            <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tight">Operational Parameters</h2>
            <span className="text-xs text-gray-500 uppercase">Sec. 02</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div className="border-t-[3px] border-black pt-4">
              <Activity className="w-6 h-6 mb-4" />
              <h3 className="text-sm font-bold uppercase tracking-wider mb-2">HPLC Analysis</h3>
              <p className="text-sm text-gray-600 leading-relaxed">High-Performance Liquid Chromatography utilized on every batch to quantify purity and isolate contaminants down to the microgram level.</p>
            </div>
            <div className="border-t-[3px] border-black pt-4">
              <Database className="w-6 h-6 mb-4" />
              <h3 className="text-sm font-bold uppercase tracking-wider mb-2">Mass Spectrometry</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Molecular weight verification to guarantee exact sequence synthesis matches theoretical parameters with zero deviation.</p>
            </div>
            <div className="border-t-[3px] border-primary pt-4">
              <ShieldCheck className="w-6 h-6 mb-4 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-wider mb-2 text-primary">Public COA Database</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Cryptographically signed Certificates of Analysis available for every batch number before purchase authorization.</p>
            </div>
          </div>
        </div>

        {/* Product Catalog Grid - Data Table Format */}
        <div className="mb-24 md:mb-32">
          <div className="flex justify-between items-end border-b border-black pb-4 mb-8">
            <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tight">Available Compounds</h2>
            <div className="flex gap-4 items-center">
              <span className="text-xs text-gray-500 uppercase">View: Table</span>
              <span className="text-xs text-gray-500 uppercase">Sec. 03</span>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left border border-black/20">
              <thead className="text-xs uppercase bg-black text-white">
                <tr>
                  <th scope="col" className="px-4 py-3 border-r border-white/20">ID</th>
                  <th scope="col" className="px-4 py-3 border-r border-white/20">Compound</th>
                  <th scope="col" className="px-4 py-3 border-r border-white/20">Mass / Qty</th>
                  <th scope="col" className="px-4 py-3 border-r border-white/20">Purity</th>
                  <th scope="col" className="px-4 py-3 border-r border-white/20">Status</th>
                  <th scope="col" className="px-4 py-3 border-r border-white/20">Price</th>
                  <th scope="col" className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, idx) => (
                  <tr key={product.id} className={`border-b border-black/10 hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="px-4 py-4 font-bold border-r border-black/10 text-gray-500">{product.id}</td>
                    <td className="px-4 py-4 border-r border-black/10">
                      <div className="font-bold text-base mb-1">{product.name}</div>
                      <div className="text-[10px] text-gray-500 truncate max-w-xs" title={product.sequence}>{product.sequence}</div>
                    </td>
                    <td className="px-4 py-4 border-r border-black/10">
                      <div>{product.mass}</div>
                      <div className="text-xs text-gray-500">{product.quantity}/vial</div>
                    </td>
                    <td className="px-4 py-4 border-r border-black/10">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 border border-gray-300 text-xs">
                        <FileText className="w-3 h-3" />
                        {product.purity}
                      </span>
                    </td>
                    <td className="px-4 py-4 border-r border-black/10">
                      <span className={`text-xs font-bold ${product.status === 'IN STOCK' ? 'text-primary' : 'text-amber-500'}`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-bold text-base border-r border-black/10">
                      {product.price}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button size="sm" className="rounded-none uppercase tracking-wider text-xs h-8">
                        Add <ShoppingCart className="w-3 h-3 ml-2" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Product Cards (Spec Sheet Style) */}
          <div className="grid grid-cols-1 gap-6 md:hidden">
            {products.map((product) => (
              <div key={product.id} className="border border-black/20 p-4 bg-white flex flex-col">
                <div className="flex justify-between items-start mb-4 border-b border-black/10 pb-4">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">{product.id}</span>
                    <h3 className="text-xl font-bold mt-1">{product.name}</h3>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 ${product.status === 'IN STOCK' ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-600'}`}>
                      {product.status}
                    </span>
                    <div className="font-bold text-lg mt-1">{product.price}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-6 flex-grow">
                  <div className="text-gray-500">Quantity</div>
                  <div className="text-right font-medium">{product.quantity}/vial</div>
                  
                  <div className="text-gray-500">Purity</div>
                  <div className="text-right font-medium flex items-center justify-end gap-1">
                    <FileText className="w-3 h-3" /> {product.purity}
                  </div>
                  
                  <div className="text-gray-500">Molar Mass</div>
                  <div className="text-right font-medium">{product.mass}</div>
                </div>
                
                <Button className="w-full rounded-none uppercase tracking-wider text-xs">
                  Add to Requisition <ShoppingCart className="w-3 h-3 ml-2" />
                </Button>
              </div>
            ))}
          </div>
          
          <div className="mt-8 flex justify-center">
            <Button variant="outline" className="rounded-none border-black hover:bg-black hover:text-white uppercase tracking-wider w-full md:w-auto">
              Load Complete Database
            </Button>
          </div>
        </div>

        {/* Verification Steps */}
        <div className="mb-24">
          <div className="bg-gray-50 border border-black p-6 md:p-12 relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-5 pointer-events-none">
              <Beaker className="w-96 h-96 -mt-20 -mr-20" />
            </div>
            
            <div className="max-w-3xl relative z-10">
              <h2 className="text-2xl font-bold uppercase tracking-tight mb-8">Verification Protocol</h2>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 shrink-0 bg-black text-white flex items-center justify-center font-bold text-sm">01</div>
                  <div>
                    <h4 className="font-bold uppercase tracking-wider mb-1">Independent Synthesis</h4>
                    <p className="text-sm text-gray-600">Peptides are synthesized domestically using solid-phase methodology.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 shrink-0 bg-black text-white flex items-center justify-center font-bold text-sm">02</div>
                  <div>
                    <h4 className="font-bold uppercase tracking-wider mb-1">Third-Party Analytics</h4>
                    <p className="text-sm text-gray-600">Samples from every batch are shipped directly to Janoshik Analytics for unbiased HPLC and Mass Spec testing.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 shrink-0 bg-primary text-white flex items-center justify-center font-bold text-sm">03</div>
                  <div>
                    <h4 className="font-bold uppercase tracking-wider mb-1 text-primary">Public Documentation</h4>
                    <p className="text-sm text-gray-600">Results are cryptographically verified and posted to our database. Vials are only cleared for distribution if purity exceeds 99%.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black text-white border-t-4 border-primary pt-16 pb-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 border border-white flex items-center justify-center bg-white text-black">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-bold tracking-tight text-lg">CELLULALABS</span>
                </div>
              </div>
              <p className="text-sm text-gray-400 max-w-sm mb-6 leading-relaxed">
                Precision-synthesized research peptides for laboratory and institutional use. All compounds are strictly for research purposes and not intended for human consumption.
              </p>
              <div className="text-[10px] uppercase tracking-widest text-gray-500">
                Data Center: US-EAST-1 | Status: Operational
              </div>
            </div>
            
            <div>
              <h4 className="font-bold uppercase tracking-wider mb-4 text-sm">Directory</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Complete Catalog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">COA Database</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Testing Methodology</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Wholesale Orders</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold uppercase tracking-wider mb-4 text-sm">Compliance</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Return Protocol</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Legal Disclaimer</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500 uppercase tracking-widest">
            <div>&copy; {new Date().getFullYear()} Cellulalabs Research Division. All rights reserved.</div>
            <div className="flex gap-4">
              <span>Encrypted Connection</span>
              <span>Verification Valid</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
