import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { hashSync } from 'bcryptjs'

const adapter = new PrismaBetterSqlite3({ url: 'file:./prisma/dev.db' })
const prisma = new PrismaClient({ adapter })

// ─── Products ────────────────────────────────────────────────────────────────

const products = [
  // ── Peptides ───────────────────────────────────────────────────────────────
  {
    slug: 'bpc-157',
    name: 'BPC-157',
    price: 49.99,
    description: 'A synthetic pentadecapeptide investigated for regenerative properties in laboratory settings. Commonly studied for tissue repair mechanisms, gastric protection pathways, and wound healing cascades in research models.',
    imageUrl: '/products/bpc-157.svg',
    category: 'Peptides',
    purity: '99.8%',
    stock: 200,
    tag: 'best_seller',
    molecularWeight: '1419.53 g/mol',
    sequence: 'Gly-Glu-Pro-Pro-Pro-Gly-Lys-Pro-Ala-Asp-Asp-Ala-Gly-Leu-Val',
    storageTemp: '-20°C',
    form: 'Lyophilized Powder',
    batchNumber: 'BPC-2026-041',
    lotNumber: 'L2026-0412',
    variants: [
      { label: '5mg', price: 49.99, stock: 200 },
      { label: '10mg', price: 84.99, stock: 120 },
      { label: '30mg', price: 199.99, stock: 50 },
    ],
  },
  {
    slug: 'tb-500',
    name: 'TB-500',
    price: 64.99,
    description: 'Synthetic fragment of Thymosin Beta-4. Researched for its role in cellular migration, differentiation, and repair processes. Key focus areas include actin regulation and angiogenesis pathways.',
    imageUrl: '/products/tb-500.svg',
    category: 'Peptides',
    purity: '99.5%',
    stock: 150,
    tag: 'staff_pick',
    molecularWeight: '4963.44 g/mol',
    sequence: 'Ac-SDKP (active fragment)',
    storageTemp: '-20°C',
    form: 'Lyophilized Powder',
    batchNumber: 'TB5-2026-038',
    lotNumber: 'L2026-0389',
    variants: [
      { label: '5mg', price: 64.99, stock: 150 },
      { label: '10mg', price: 109.99, stock: 80 },
    ],
  },
  {
    slug: 'cjc-1295-ipamorelin',
    name: 'CJC-1295 / Ipamorelin',
    price: 69.99,
    description: 'A combination studied in research for growth hormone releasing effects without cortisol elevation. Popular in GH secretagogue research for its synergistic pulsatile release profile.',
    imageUrl: '/products/cjc-1295-ipamorelin.svg',
    category: 'Peptides',
    purity: '99.9%',
    stock: 120,
    molecularWeight: '3367.97 g/mol',
    storageTemp: '-20°C',
    form: 'Lyophilized Powder',
    batchNumber: 'CJC-2026-029',
    lotNumber: 'L2026-0291',
    variants: [
      { label: '5mg Blend', price: 69.99, stock: 120 },
      { label: '10mg Blend', price: 119.99, stock: 60 },
    ],
  },
  {
    slug: 'pt-141',
    name: 'PT-141 (Bremelanotide)',
    price: 44.99,
    description: 'Melanocortin receptor agonist researched for its effects on melanocortin pathways. Studied in various receptor binding assays and MC3R/MC4R activation models.',
    imageUrl: '/products/pt-141.svg',
    category: 'Peptides',
    purity: '99.6%',
    stock: 180,
    molecularWeight: '1025.18 g/mol',
    casNumber: '189691-06-3',
    storageTemp: '-20°C',
    form: 'Lyophilized Powder',
    batchNumber: 'PT1-2026-044',
    lotNumber: 'L2026-0445',
    variants: [
      { label: '10mg', price: 44.99, stock: 180 },
    ],
  },
  {
    slug: 'mots-c',
    name: 'MOTS-c',
    price: 89.99,
    description: 'Mitochondrial-derived peptide explored for metabolic regulation and physical capacity in research models. Targets AMPK activation and mitochondrial biogenesis pathways.',
    imageUrl: '/products/mots-c.svg',
    category: 'Peptides',
    purity: '98.9%',
    stock: 100,
    molecularWeight: '2174.69 g/mol',
    storageTemp: '-20°C',
    form: 'Lyophilized Powder',
    batchNumber: 'MOT-2026-021',
    lotNumber: 'L2026-0218',
    variants: [
      { label: '5mg', price: 89.99, stock: 100 },
      { label: '10mg', price: 159.99, stock: 40 },
    ],
  },
  {
    slug: 'epitalon',
    name: 'Epitalon',
    price: 74.99,
    description: 'Synthetic pineal tetrapeptide investigated for telomerase activation and potential longevity mechanisms in cellular studies. Focus on telomere elongation and circadian rhythm regulation.',
    imageUrl: '/products/epitalon.svg',
    category: 'Peptides',
    purity: '99.7%',
    stock: 130,
    tag: 'popular',
    molecularWeight: '390.35 g/mol',
    sequence: 'Ala-Glu-Asp-Gly',
    casNumber: '307297-39-8',
    storageTemp: '-20°C',
    form: 'Lyophilized Powder',
    batchNumber: 'EPI-2026-033',
    lotNumber: 'L2026-0336',
    variants: [
      { label: '10mg', price: 74.99, stock: 130 },
      { label: '50mg', price: 299.99, stock: 30 },
    ],
  },
  {
    slug: 'semaglutide',
    name: 'Semaglutide',
    price: 129.99,
    description: 'GLP-1 receptor agonist widely studied for metabolic research. One of the most researched peptides in the GLP-1 class, with extensive literature on glucose homeostasis and appetite signaling.',
    imageUrl: '/products/semaglutide.svg',
    category: 'Peptides',
    purity: '99.5%',
    stock: 80,
    tag: 'fast_selling',
    molecularWeight: '4113.58 g/mol',
    casNumber: '910463-68-2',
    storageTemp: '2-8°C',
    form: 'Lyophilized Powder',
    batchNumber: 'SEM-2026-019',
    lotNumber: 'L2026-0194',
    variants: [
      { label: '3mg', price: 129.99, stock: 80 },
      { label: '5mg', price: 189.99, stock: 40 },
      { label: '10mg', price: 329.99, stock: 20 },
    ],
  },
  {
    slug: 'retatrutide',
    name: 'Retatrutide',
    price: 109.99,
    description: 'Triple agonist peptide (GLP-1/GIP/Glucagon) under investigation for metabolic pathway research. Next-generation incretin analog with multi-receptor binding profile.',
    imageUrl: '/products/retatrutide.svg',
    category: 'Peptides',
    purity: '99.3%',
    stock: 60,
    tag: 'new',
    molecularWeight: '4625.32 g/mol',
    casNumber: '2381089-83-2',
    storageTemp: '2-8°C',
    form: 'Lyophilized Powder',
    batchNumber: 'RET-2026-015',
    lotNumber: 'L2026-0152',
    variants: [
      { label: '3mg', price: 109.99, stock: 60 },
      { label: '5mg', price: 169.99, stock: 25 },
    ],
  },
  {
    slug: 'ghk-cu',
    name: 'GHK-Cu (Copper Peptide)',
    price: 54.99,
    description: 'Naturally occurring copper complex tripeptide studied for wound healing, collagen synthesis, and anti-inflammatory research. Investigated for gene expression modulation in tissue remodeling.',
    imageUrl: '/products/ghk-cu.svg',
    category: 'Peptides',
    purity: '99.4%',
    stock: 200,
    molecularWeight: '403.93 g/mol',
    sequence: 'Gly-His-Lys-Cu',
    casNumber: '49557-75-7',
    storageTemp: '-20°C',
    form: 'Lyophilized Powder',
    batchNumber: 'GHK-2026-047',
    lotNumber: 'L2026-0471',
    variants: [
      { label: '50mg', price: 54.99, stock: 200 },
      { label: '100mg', price: 94.99, stock: 100 },
    ],
  },
  {
    slug: 'selank',
    name: 'Selank',
    price: 59.99,
    description: 'Synthetic analog of immunomodulatory peptide tuftsin. Researched for anxiolytic and nootropic properties in animal models. Focus on GABA modulation and BDNF expression.',
    imageUrl: '/products/selank.svg',
    category: 'Peptides',
    purity: '99.2%',
    stock: 140,
    molecularWeight: '751.87 g/mol',
    sequence: 'Thr-Lys-Pro-Arg-Pro-Gly-Pro',
    storageTemp: '-20°C',
    form: 'Lyophilized Powder',
    batchNumber: 'SEL-2026-036',
    lotNumber: 'L2026-0362',
    variants: [
      { label: '5mg', price: 59.99, stock: 140 },
      { label: '10mg', price: 99.99, stock: 70 },
    ],
  },

  // ── SARMs ──────────────────────────────────────────────────────────────────
  {
    slug: 'mk-677-ibutamoren',
    name: 'MK-677 (Ibutamoren)',
    price: 59.99,
    description: 'Non-peptide ghrelin receptor agonist studied for growth hormone secretagogue activity. Researched for its oral bioavailability and sustained GH/IGF-1 elevation in preclinical models without affecting cortisol levels.',
    imageUrl: '/products/mk-677.svg',
    category: 'SARMs',
    purity: '99.5%',
    stock: 180,
    molecularWeight: '528.662 g/mol',
    casNumber: '159752-10-0',
    storageTemp: '15-25°C',
    form: 'Powder',
    batchNumber: 'MK6-2026-051',
    lotNumber: 'L2026-0513',
    variants: [
      { label: '1g', price: 59.99, stock: 180 },
      { label: '5g', price: 249.99, stock: 60 },
    ],
  },
  {
    slug: 'rad-140-testolone',
    name: 'RAD-140 (Testolone)',
    price: 54.99,
    description: 'Selective androgen receptor modulator investigated for tissue-selective anabolic activity. Studied for androgen receptor binding affinity in muscle and bone tissue without significant prostate stimulation in research models.',
    imageUrl: '/products/rad-140.svg',
    category: 'SARMs',
    purity: '99.6%',
    stock: 150,
    molecularWeight: '393.826 g/mol',
    casNumber: '1182367-47-0',
    storageTemp: '15-25°C',
    form: 'Powder',
    batchNumber: 'RAD-2026-048',
    lotNumber: 'L2026-0485',
    variants: [
      { label: '1g', price: 54.99, stock: 150 },
      { label: '5g', price: 229.99, stock: 50 },
    ],
  },
  {
    slug: 'ostarine-mk-2866',
    name: 'Ostarine (MK-2866)',
    price: 44.99,
    description: 'First-generation SARM researched for selective anabolic effects on skeletal muscle and bone. One of the most studied SARMs in preclinical literature with extensive pharmacokinetic data available.',
    imageUrl: '/products/ostarine.svg',
    category: 'SARMs',
    purity: '99.4%',
    stock: 200,
    molecularWeight: '389.33 g/mol',
    casNumber: '841205-47-8',
    storageTemp: '15-25°C',
    form: 'Powder',
    batchNumber: 'OST-2026-055',
    lotNumber: 'L2026-0552',
    variants: [
      { label: '1g', price: 44.99, stock: 200 },
      { label: '5g', price: 189.99, stock: 80 },
    ],
  },
  {
    slug: 'lgd-4033-ligandrol',
    name: 'LGD-4033 (Ligandrol)',
    price: 49.99,
    description: 'Non-steroidal SARM investigated for high androgen receptor binding affinity. Researched for lean mass accrual pathways and bone mineral density effects in preclinical and early clinical models.',
    imageUrl: '/products/lgd-4033.svg',
    category: 'SARMs',
    purity: '99.3%',
    stock: 160,
    molecularWeight: '338.253 g/mol',
    casNumber: '1165910-22-4',
    storageTemp: '15-25°C',
    form: 'Powder',
    batchNumber: 'LGD-2026-042',
    lotNumber: 'L2026-0428',
    variants: [
      { label: '1g', price: 49.99, stock: 160 },
      { label: '5g', price: 209.99, stock: 55 },
    ],
  },

  // ── Growth Hormones ────────────────────────────────────────────────────────
  {
    slug: 'hgh-fragment-176-191',
    name: 'HGH Fragment 176-191',
    price: 79.99,
    description: 'C-terminal fragment of human growth hormone studied for lipolytic activity without the diabetogenic effects of full-length HGH. Researched for fat metabolism pathways and adipocyte receptor interactions.',
    imageUrl: '/products/hgh-fragment.svg',
    category: 'Growth Hormones',
    purity: '99.1%',
    stock: 100,
    molecularWeight: '1817.12 g/mol',
    sequence: 'Tyr-Leu-Arg-Ile-Val-Gln-Cys-Arg-Ser-Val-Glu-Gly-Ser-Cys-Gly-Phe',
    storageTemp: '-20°C',
    form: 'Lyophilized Powder',
    batchNumber: 'HGH-2026-031',
    lotNumber: 'L2026-0314',
    variants: [
      { label: '2mg', price: 79.99, stock: 100 },
      { label: '5mg', price: 179.99, stock: 40 },
    ],
  },
  {
    slug: 'igf-1-lr3',
    name: 'IGF-1 LR3',
    price: 149.99,
    description: 'Long-acting analog of insulin-like growth factor 1 with extended half-life due to arginine substitution at position 3. Studied for cell proliferation, differentiation, and anti-apoptotic signaling in research models.',
    imageUrl: '/products/igf-1-lr3.svg',
    category: 'Growth Hormones',
    purity: '98.7%',
    stock: 60,
    tag: 'last_few_left',
    molecularWeight: '9111.4 g/mol',
    casNumber: '946870-92-4',
    storageTemp: '-20°C',
    form: 'Lyophilized Powder',
    batchNumber: 'IGF-2026-022',
    lotNumber: 'L2026-0226',
    variants: [
      { label: '0.1mg', price: 149.99, stock: 60 },
      { label: '1mg', price: 899.99, stock: 15 },
    ],
  },
  {
    slug: 'sermorelin',
    name: 'Sermorelin',
    price: 74.99,
    description: 'Synthetic analog of growth hormone-releasing hormone (GHRH 1-29). Researched for pituitary stimulation and endogenous GH release patterns. One of the earliest GHRH analogs studied in clinical settings.',
    imageUrl: '/products/sermorelin.svg',
    category: 'Growth Hormones',
    purity: '99.2%',
    stock: 110,
    molecularWeight: '3357.93 g/mol',
    casNumber: '86168-78-7',
    storageTemp: '-20°C',
    form: 'Lyophilized Powder',
    batchNumber: 'SER-2026-039',
    lotNumber: 'L2026-0396',
    variants: [
      { label: '2mg', price: 74.99, stock: 110 },
      { label: '5mg', price: 159.99, stock: 45 },
    ],
  },

  // ── Nootropics ─────────────────────────────────────────────────────────────
  {
    slug: 'noopept',
    name: 'Noopept (GVS-111)',
    price: 29.99,
    description: 'Synthetic dipeptide-derived nootropic studied for cognitive enhancement pathways. Researched for BDNF/NGF modulation, AMPA receptor potentiation, and neuroprotective mechanisms in preclinical models.',
    imageUrl: '/products/noopept.svg',
    category: 'Nootropics',
    purity: '99.8%',
    stock: 300,
    tag: 'fast_selling',
    molecularWeight: '318.37 g/mol',
    casNumber: '157115-85-0',
    storageTemp: '15-25°C',
    form: 'Powder',
    batchNumber: 'NOP-2026-058',
    lotNumber: 'L2026-0581',
    variants: [
      { label: '1g', price: 29.99, stock: 300 },
      { label: '5g', price: 119.99, stock: 100 },
      { label: '10g', price: 199.99, stock: 40 },
    ],
  },
  {
    slug: 'semax',
    name: 'Semax',
    price: 64.99,
    description: 'Synthetic heptapeptide analog of ACTH(4-7) researched for neurotrophic and neuroprotective properties. Studied for BDNF upregulation, dopaminergic modulation, and cognitive function in animal models.',
    imageUrl: '/products/semax.svg',
    category: 'Nootropics',
    purity: '99.3%',
    stock: 120,
    molecularWeight: '813.93 g/mol',
    sequence: 'Met-Glu-His-Phe-Pro-Gly-Pro',
    storageTemp: '-20°C',
    form: 'Lyophilized Powder',
    batchNumber: 'SMX-2026-044',
    lotNumber: 'L2026-0447',
    variants: [
      { label: '5mg', price: 64.99, stock: 120 },
      { label: '10mg', price: 109.99, stock: 50 },
    ],
  },
  {
    slug: 'phenylpiracetam',
    name: 'Phenylpiracetam',
    price: 39.99,
    description: 'Phenylated derivative of piracetam studied for enhanced cognitive and psychostimulatory effects. Researched for dopamine receptor density modulation and cold tolerance mechanisms in preclinical models.',
    imageUrl: '/products/phenylpiracetam.svg',
    category: 'Nootropics',
    purity: '99.5%',
    stock: 200,
    molecularWeight: '218.25 g/mol',
    casNumber: '77472-70-9',
    storageTemp: '15-25°C',
    form: 'Powder',
    batchNumber: 'PHP-2026-061',
    lotNumber: 'L2026-0614',
    variants: [
      { label: '1g', price: 39.99, stock: 200 },
      { label: '5g', price: 159.99, stock: 70 },
    ],
  },

  // ── Supplements ────────────────────────────────────────────────────────────
  {
    slug: 'nmn-nicotinamide-mononucleotide',
    name: 'NMN (Nicotinamide Mononucleotide)',
    price: 69.99,
    description: 'NAD+ precursor extensively studied in longevity and aging research. Investigated for sirtuin activation, mitochondrial function, and cellular energy metabolism in preclinical and early clinical models.',
    imageUrl: '/products/nmn.svg',
    category: 'Supplements',
    purity: '99.5%',
    stock: 250,
    tag: 'best_seller',
    molecularWeight: '334.22 g/mol',
    casNumber: '1094-61-7',
    storageTemp: '2-8°C',
    form: 'Powder',
    batchNumber: 'NMN-2026-063',
    lotNumber: 'L2026-0635',
    variants: [
      { label: '10g', price: 69.99, stock: 250 },
      { label: '30g', price: 179.99, stock: 100 },
      { label: '100g', price: 449.99, stock: 30 },
    ],
  },
  {
    slug: 'resveratrol',
    name: 'Trans-Resveratrol',
    price: 34.99,
    description: 'Polyphenolic stilbenoid researched for sirtuin activation and anti-aging pathways. Studied for AMPK activation, mitochondrial biogenesis, and antioxidant mechanisms in cellular and animal models.',
    imageUrl: '/products/resveratrol.svg',
    category: 'Supplements',
    purity: '99.0%',
    stock: 300,
    molecularWeight: '228.24 g/mol',
    casNumber: '501-36-0',
    storageTemp: '15-25°C',
    form: 'Powder',
    batchNumber: 'RSV-2026-067',
    lotNumber: 'L2026-0672',
    variants: [
      { label: '10g', price: 34.99, stock: 300 },
      { label: '50g', price: 139.99, stock: 120 },
    ],
  },
  {
    slug: 'fisetin',
    name: 'Fisetin',
    price: 44.99,
    description: 'Flavonoid senolytic compound researched for selective clearance of senescent cells. Studied for anti-inflammatory, neuroprotective, and lifespan extension mechanisms in preclinical aging models.',
    imageUrl: '/products/fisetin.svg',
    category: 'Supplements',
    purity: '98.5%',
    stock: 200,
    molecularWeight: '286.24 g/mol',
    casNumber: '528-48-3',
    storageTemp: '15-25°C',
    form: 'Powder',
    batchNumber: 'FIS-2026-070',
    lotNumber: 'L2026-0703',
    variants: [
      { label: '5g', price: 44.99, stock: 200 },
      { label: '25g', price: 179.99, stock: 60 },
    ],
  },
  {
    slug: 'spermidine',
    name: 'Spermidine',
    price: 54.99,
    description: 'Naturally occurring polyamine studied for autophagy induction and longevity mechanisms. Researched for cardioprotective effects, memory enhancement, and cellular renewal pathways in aging models.',
    imageUrl: '/products/spermidine.svg',
    category: 'Supplements',
    purity: '99.0%',
    stock: 150,
    molecularWeight: '145.25 g/mol',
    casNumber: '124-20-9',
    storageTemp: '-20°C',
    form: 'Powder',
    batchNumber: 'SPD-2026-072',
    lotNumber: 'L2026-0724',
    variants: [
      { label: '1g', price: 54.99, stock: 150 },
      { label: '5g', price: 219.99, stock: 40 },
    ],
  },

  // ── Steroids (Research Reference Standards) ────────────────────────────────
  {
    slug: 'dhea',
    name: 'DHEA (Dehydroepiandrosterone)',
    price: 24.99,
    description: 'Endogenous steroid hormone precursor studied for adrenal function and neuroactive steroid research. Investigated for age-related decline patterns, immune modulation, and neurosteroid signaling pathways.',
    imageUrl: '/products/dhea.svg',
    category: 'Steroids',
    purity: '99.5%',
    stock: 300,
    molecularWeight: '288.42 g/mol',
    casNumber: '53-43-0',
    storageTemp: '15-25°C',
    form: 'Powder',
    batchNumber: 'DHE-2026-075',
    lotNumber: 'L2026-0751',
    variants: [
      { label: '5g', price: 24.99, stock: 300 },
      { label: '25g', price: 99.99, stock: 100 },
    ],
  },
  {
    slug: 'pregnenolone',
    name: 'Pregnenolone',
    price: 29.99,
    description: 'Master steroid precursor synthesized from cholesterol. Researched as the upstream precursor to all steroid hormones including cortisol, DHEA, progesterone, and testosterone. Studied for neurosteroid and memory-related pathways.',
    imageUrl: '/products/pregnenolone.svg',
    category: 'Steroids',
    purity: '99.2%',
    stock: 250,
    molecularWeight: '316.48 g/mol',
    casNumber: '145-13-1',
    storageTemp: '15-25°C',
    form: 'Powder',
    batchNumber: 'PRG-2026-078',
    lotNumber: 'L2026-0782',
    variants: [
      { label: '5g', price: 29.99, stock: 250 },
      { label: '25g', price: 119.99, stock: 80 },
    ],
  },
  {
    slug: '7-keto-dhea',
    name: '7-Keto DHEA',
    price: 39.99,
    description: 'Non-androgenic metabolite of DHEA studied for thermogenic and immune-modulating properties. Researched for metabolic rate enhancement without conversion to sex hormones in preclinical models.',
    imageUrl: '/products/7-keto-dhea.svg',
    category: 'Steroids',
    purity: '99.0%',
    stock: 180,
    molecularWeight: '302.41 g/mol',
    casNumber: '566-19-8',
    storageTemp: '15-25°C',
    form: 'Powder',
    batchNumber: '7KD-2026-080',
    lotNumber: 'L2026-0805',
    variants: [
      { label: '1g', price: 39.99, stock: 180 },
      { label: '5g', price: 159.99, stock: 60 },
    ],
  },

  // ── Aphrodisiacs ───────────────────────────────────────────────────────────
  {
    slug: 'kisspeptin-10',
    name: 'Kisspeptin-10',
    price: 89.99,
    description: 'Hypothalamic neuropeptide researched for GnRH neuron activation and reproductive endocrinology. Studied for its role in puberty onset, LH/FSH pulsatility, and sexual arousal pathways in preclinical models.',
    imageUrl: '/products/kisspeptin.svg',
    category: 'Aphrodisiacs',
    purity: '99.1%',
    stock: 80,
    tag: 'last_few_left',
    molecularWeight: '1302.41 g/mol',
    sequence: 'Tyr-Asn-Trp-Asn-Ser-Phe-Gly-Leu-Arg-Phe-NH2',
    casNumber: '374675-21-5',
    storageTemp: '-20°C',
    form: 'Lyophilized Powder',
    batchNumber: 'KIS-2026-082',
    lotNumber: 'L2026-0823',
    variants: [
      { label: '5mg', price: 89.99, stock: 80 },
      { label: '10mg', price: 159.99, stock: 30 },
    ],
  },
  {
    slug: 'melanotan-ii',
    name: 'Melanotan II',
    price: 39.99,
    description: 'Synthetic cyclic lactam analog of alpha-MSH researched for melanocortin receptor activation. Studied for melanogenesis pathways and MC3R/MC4R binding profiles in dermatological and behavioral research models.',
    imageUrl: '/products/melanotan-ii.svg',
    category: 'Aphrodisiacs',
    purity: '99.4%',
    stock: 200,
    molecularWeight: '1024.18 g/mol',
    sequence: 'Ac-Nle-cyclo[Asp-His-D-Phe-Arg-Trp-Lys]-NH2',
    casNumber: '121062-08-6',
    storageTemp: '-20°C',
    form: 'Lyophilized Powder',
    batchNumber: 'MT2-2026-085',
    lotNumber: 'L2026-0854',
    variants: [
      { label: '10mg', price: 39.99, stock: 200 },
      { label: '30mg', price: 99.99, stock: 80 },
    ],
  },
  {
    slug: 'gonadorelin',
    name: 'Gonadorelin (GnRH)',
    price: 49.99,
    description: 'Synthetic gonadotropin-releasing hormone studied for pituitary-gonadal axis research. Investigated for LH and FSH release patterns, fertility signaling, and hypothalamic function in endocrine research models.',
    imageUrl: '/products/gonadorelin.svg',
    category: 'Aphrodisiacs',
    purity: '99.3%',
    stock: 140,
    molecularWeight: '1182.29 g/mol',
    sequence: 'pGlu-His-Trp-Ser-Tyr-Gly-Leu-Arg-Pro-Gly-NH2',
    casNumber: '33515-09-2',
    storageTemp: '-20°C',
    form: 'Lyophilized Powder',
    batchNumber: 'GNR-2026-088',
    lotNumber: 'L2026-0886',
    variants: [
      { label: '2mg', price: 49.99, stock: 140 },
      { label: '5mg', price: 109.99, stock: 50 },
    ],
  },
]

// ─── Customers ───────────────────────────────────────────────────────────────

const customers = [
  { email: 'researcher@lab.edu', name: 'Dr. Sarah Chen', password: 'research123' },
  { email: 'jmiller@biotech.com', name: 'Dr. James Miller', password: 'biotech456' },
  { email: 'akumar@university.edu', name: 'Dr. Ananya Kumar', password: 'peptide789' },
  { email: 'mwilson@pharmalab.org', name: 'Dr. Marcus Wilson', password: 'labwork321' },
  { email: 'lzhang@cellbio.cn', name: 'Dr. Li Zhang', password: 'cellbio654' },
  { email: 'egarcia@research.mx', name: 'Dr. Elena Garcia', password: 'research987' },
  { email: 'rjohnson@neurolab.com', name: 'Dr. Robert Johnson', password: 'neuro111' },
  { email: 'kpatel@stemcell.in', name: 'Dr. Kavita Patel', password: 'stemcell222' },
  { email: 'tsmith@aging.org', name: 'Dr. Thomas Smith', password: 'aging333' },
  { email: 'ykim@peptidescience.kr', name: 'Dr. Yuna Kim', password: 'peptide444' },
  { email: 'dbrooks@immunology.edu', name: 'Dr. David Brooks', password: 'immune555' },
  { email: 'nwatson@dermalab.co.uk', name: 'Dr. Natalie Watson', password: 'derma666' },
]

// ─── Reviews Pool ────────────────────────────────────────────────────────────

const reviewPool = [
  { rating: 5, title: 'Excellent purity confirmed', body: 'HPLC results matched the COA exactly. Ran our own analysis and got 99.7% purity. Will order again for our next study.' },
  { rating: 5, title: 'Fast shipping, great packaging', body: 'Arrived in 2 days with cold pack intact. Vial was sealed under nitrogen. Professional packaging throughout.' },
  { rating: 4, title: 'Good quality, consistent batches', body: 'Consistent with previous batches we ordered. Purity verified in our lab at 99.3%. Slight variance from COA but within acceptable range.' },
  { rating: 5, title: 'Top-tier supplier for research', body: 'Best COA transparency in the market. Janoshik verified with full chromatograms. Our go-to supplier now.' },
  { rating: 4, title: 'Solid product, clean lyophilization', body: 'Clean lyophilization, dissolved easily in bacteriostatic water. Good for our in-vitro assays. Would appreciate larger vial sizes.' },
  { rating: 5, title: 'Perfect for our cell culture work', body: 'Used in our cell migration assays. Reconstituted perfectly, no aggregation observed. Bioactivity confirmed in our models.' },
  { rating: 5, title: 'Lab-verified, no complaints', body: 'Third order from this supplier. Every batch has been consistent. Mass spec identity confirmed in our facility.' },
  { rating: 4, title: 'Good value for research grade', body: 'Price point is competitive for the purity level. Our PI approved this as a regular vendor for the lab.' },
  { rating: 5, title: 'Outstanding quality control', body: 'The batch-specific COA with actual chromatogram data sets this apart. We can trace every vial to its analytical report.' },
  { rating: 3, title: 'Decent but shipping was slow', body: 'Product quality is fine — purity checks out. But shipping took 5 days instead of the usual 2. Cold pack was still cool though.' },
  { rating: 5, title: 'Exactly what our protocol needed', body: 'Matched the specifications for our research protocol perfectly. Molecular weight confirmed via our in-house mass spec.' },
  { rating: 4, title: 'Reliable source for compounds', body: 'Been ordering for 6 months now. Consistency is key for our longitudinal studies and this supplier delivers.' },
  { rating: 5, title: 'Impressed with the documentation', body: 'Full COA with HPLC trace, MS data, and appearance description. This level of documentation is rare in the research compound space.' },
  { rating: 5, title: 'Will recommend to colleagues', body: 'Already shared with two other labs in our department. The quality and transparency are exactly what academic research needs.' },
  { rating: 4, title: 'Solid reconstitution profile', body: 'Dissolved completely in under 60 seconds with gentle swirling. No visible particulates. Good lyophilization quality.' },
  { rating: 5, title: 'Best research vendor we have used', body: 'After trying 4 different suppliers, this is the only one where every batch matched the COA within 0.5% purity variance.' },
  { rating: 3, title: 'Product fine, website needs work', body: 'The compound itself is great quality. Website checkout was a bit clunky though. Product arrived in good condition.' },
  { rating: 5, title: 'Repeat customer, always satisfied', body: 'Fifth order. Purity has been 99%+ every single time. Our lab manager has approved them as a preferred vendor.' },
  { rating: 4, title: 'Good for dose-response studies', body: 'The variant sizes are perfect for our dose-response curve experiments. Saves us from having to weigh out.' },
  { rating: 5, title: 'Research-grade verified', body: 'Submitted a sample to an independent lab for blind testing. Results came back matching the COA. Legitimate operation.' },
]

// ─── Coupons ─────────────────────────────────────────────────────────────────

const coupons = [
  { code: 'RESEARCH10', type: 'percent', value: 10, minOrder: 50, active: true },
  { code: 'FIRST20', type: 'percent', value: 20, minOrder: 100, maxUses: 100, usedCount: 34, active: true },
  { code: 'SAVE25', type: 'fixed', value: 25, minOrder: 150, active: true },
  { code: 'BULK15', type: 'percent', value: 15, minOrder: 300, active: true },
  { code: 'LABWEEK', type: 'percent', value: 12, minOrder: 75, maxUses: 200, usedCount: 89, active: true, expiresAt: new Date('2026-06-30') },
  { code: 'SPRING2026', type: 'percent', value: 18, minOrder: 200, maxUses: 50, usedCount: 50, active: false, expiresAt: new Date('2026-04-01') },
  { code: 'NEWLAB', type: 'fixed', value: 15, minOrder: 80, maxUses: 500, usedCount: 127, active: true },
  { code: 'VIP30', type: 'percent', value: 30, minOrder: 500, maxUses: 10, usedCount: 3, active: true },
  { code: 'FREESHIP', type: 'fixed', value: 9.99, minOrder: 100, active: true },
  { code: 'PEPTIDE5', type: 'fixed', value: 5, minOrder: 0, maxUses: 1000, usedCount: 412, active: true },
]

// ─── Addresses ───────────────────────────────────────────────────────────────

const addresses = [
  '123 Research Blvd, Suite 400, Cambridge, MA 02139',
  '456 Biotech Drive, San Diego, CA 92121',
  '789 University Ave, Lab Building C, Ann Arbor, MI 48109',
  '321 Pharma Way, Floor 12, Houston, TX 77030',
  '555 Innovation Pkwy, Research Triangle Park, NC 27709',
  '100 Science Center Dr, Boston, MA 02115',
  '250 Medical School Rd, Building B, Philadelphia, PA 19104',
  '800 Genome Way, Suite 200, Seattle, WA 98109',
  '1200 Cell Biology Ln, La Jolla, CA 92037',
  '75 Neuroscience Blvd, Bethesda, MD 20892',
  '400 Stem Cell Ave, Rochester, MN 55905',
  '600 Peptide Research Dr, New Haven, CT 06520',
]

// ─── Main Seed Function ─────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding database...')

  // ── Admin user ──
  const admin = await prisma.user.upsert({
    where: { email: 'cc@siwaht.com' },
    update: {},
    create: {
      email: 'cc@siwaht.com',
      password: hashSync('Hola173!', 12),
      name: 'Admin',
      role: 'admin',
    },
  })
  console.log('  ✓ Admin user')

  // ── Customer users ──
  const customerRecords: Array<{ id: string; email: string; name: string | null }> = []
  for (const c of customers) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        email: c.email,
        password: hashSync(c.password, 12),
        name: c.name,
        role: 'customer',
      },
    })
    customerRecords.push({ id: user.id, email: user.email, name: user.name })
  }
  console.log(`  ✓ ${customerRecords.length} customers`)

  // ── Products with variants and COAs ──
  const productRecords: Array<{ id: string; slug: string; price: number; name: string }> = []
  for (const { variants, ...productData } of products) {
    const product = await prisma.product.upsert({
      where: { slug: productData.slug },
      update: productData,
      create: productData,
    })
    productRecords.push({ id: product.id, slug: product.slug, price: product.price, name: product.name })

    // Recreate variants
    await prisma.productVariant.deleteMany({ where: { productId: product.id } })
    for (const v of variants) {
      await prisma.productVariant.create({
        data: { ...v, productId: product.id },
      })
    }

    // COA for each product (multiple batches for popular ones)
    await prisma.cOA.deleteMany({ where: { productId: product.id } })
    const coaDates = [
      new Date('2026-03-15'),
      new Date('2026-02-10'),
      new Date('2026-01-05'),
    ]
    const isPopular = ['bpc-157', 'semaglutide', 'tb-500', 'cjc-1295-ipamorelin', 'mk-677-ibutamoren', 'nmn-nicotinamide-mononucleotide', 'rad-140-testolone'].includes(productData.slug)
    const coaCount = isPopular ? 3 : 1
    for (let i = 0; i < coaCount; i++) {
      const batchSuffix = String(41 - i * 5).padStart(3, '0')
      await prisma.cOA.create({
        data: {
          productId: product.id,
          batchNumber: productData.batchNumber ? productData.batchNumber.replace(/\d{3}$/, batchSuffix) : `BATCH-${product.slug}-${batchSuffix}`,
          labName: i === 0 ? 'Janoshik Analytics' : i === 1 ? 'Janoshik Analytics' : 'Colmaric Analyticals',
          testDate: coaDates[i],
          purityResult: i === 0 ? productData.purity : `${(parseFloat(productData.purity) - 0.1 * i).toFixed(1)}%`,
          fileUrl: `/coa/${product.slug}-batch-${batchSuffix}-coa.pdf`,
        },
      })
    }
  }
  console.log(`  ✓ ${productRecords.length} products with variants & COAs`)

  // ── Reviews (spread across all products and customers) ──
  await prisma.review.deleteMany({})
  let reviewIdx = 0
  for (let pIdx = 0; pIdx < productRecords.length; pIdx++) {
    // Each product gets 3-6 reviews from different customers
    const reviewCount = 3 + (pIdx % 4) // 3, 4, 5, 6, 3, 4, 5, 6, ...
    for (let r = 0; r < reviewCount; r++) {
      const customerIdx = (pIdx * 3 + r) % customerRecords.length
      const review = reviewPool[reviewIdx % reviewPool.length]
      await prisma.review.create({
        data: {
          productId: productRecords[pIdx].id,
          userId: customerRecords[customerIdx].id,
          rating: review.rating,
          title: review.title,
          body: review.body,
          verified: r < reviewCount - 1, // last review per product is unverified
          createdAt: new Date(Date.now() - (reviewIdx * 3 + r) * 86400000 * 2), // spread over time
        },
      })
      reviewIdx++
    }
  }
  console.log(`  ✓ ${reviewIdx} reviews`)

  // ── Coupons ──
  await prisma.coupon.deleteMany({})
  await prisma.coupon.createMany({ data: coupons })
  console.log(`  ✓ ${coupons.length} coupons`)

  // ── Orders (realistic spread of statuses, payment methods, dates) ──
  await prisma.orderItem.deleteMany({})
  await prisma.order.deleteMany({})

  const statuses = ['pending', 'paid', 'shipped', 'delivered', 'delivered', 'delivered', 'cancelled']
  const paymentMethods = ['crypto', 'crypto', 'crypto', 'ach', 'card']
  const orderData: Array<{
    customer: typeof customerRecords[0]
    productIndices: number[]
    quantities: number[]
    status: string
    payment: string
    daysAgo: number
    couponCode?: string
    discount?: number
    notes?: string
  }> = [
    { customer: customerRecords[0], productIndices: [0, 1], quantities: [2, 1], status: 'delivered', payment: 'crypto', daysAgo: 45, notes: 'Please include extra cold packs' },
    { customer: customerRecords[0], productIndices: [6], quantities: [1], status: 'delivered', payment: 'crypto', daysAgo: 20, couponCode: 'RESEARCH10', discount: 13.0 },
    { customer: customerRecords[0], productIndices: [0, 4, 5], quantities: [1, 1, 1], status: 'shipped', payment: 'ach', daysAgo: 3 },
    { customer: customerRecords[1], productIndices: [6, 7], quantities: [1, 1], status: 'delivered', payment: 'crypto', daysAgo: 60 },
    { customer: customerRecords[1], productIndices: [2], quantities: [3], status: 'delivered', payment: 'card', daysAgo: 30, couponCode: 'FIRST20', discount: 42.0 },
    { customer: customerRecords[1], productIndices: [0, 8], quantities: [1, 2], status: 'paid', payment: 'crypto', daysAgo: 1 },
    { customer: customerRecords[2], productIndices: [3, 9], quantities: [2, 1], status: 'delivered', payment: 'ach', daysAgo: 55 },
    { customer: customerRecords[2], productIndices: [5], quantities: [1], status: 'delivered', payment: 'crypto', daysAgo: 25 },
    { customer: customerRecords[2], productIndices: [0, 1, 2], quantities: [1, 1, 1], status: 'shipped', payment: 'crypto', daysAgo: 5, couponCode: 'BULK15', discount: 27.75 },
    { customer: customerRecords[3], productIndices: [6], quantities: [2], status: 'delivered', payment: 'card', daysAgo: 40 },
    { customer: customerRecords[3], productIndices: [4, 8, 9], quantities: [1, 1, 1], status: 'delivered', payment: 'crypto', daysAgo: 15 },
    { customer: customerRecords[3], productIndices: [7], quantities: [1], status: 'pending', payment: 'crypto', daysAgo: 0 },
    { customer: customerRecords[4], productIndices: [0], quantities: [5], status: 'delivered', payment: 'ach', daysAgo: 50, couponCode: 'SAVE25', discount: 25.0, notes: 'Bulk order for longitudinal study' },
    { customer: customerRecords[4], productIndices: [1, 3], quantities: [2, 2], status: 'delivered', payment: 'crypto', daysAgo: 22 },
    { customer: customerRecords[5], productIndices: [5, 4], quantities: [1, 1], status: 'delivered', payment: 'crypto', daysAgo: 35 },
    { customer: customerRecords[5], productIndices: [10, 11], quantities: [1, 1], status: 'shipped', payment: 'ach', daysAgo: 4 },
    { customer: customerRecords[6], productIndices: [9], quantities: [3], status: 'delivered', payment: 'crypto', daysAgo: 28 },
    { customer: customerRecords[6], productIndices: [12, 14], quantities: [1, 1], status: 'delivered', payment: 'card', daysAgo: 10 },
    { customer: customerRecords[7], productIndices: [8], quantities: [4], status: 'delivered', payment: 'crypto', daysAgo: 42, couponCode: 'NEWLAB', discount: 15.0 },
    { customer: customerRecords[7], productIndices: [0, 15, 16], quantities: [1, 1, 1], status: 'paid', payment: 'ach', daysAgo: 2 },
    { customer: customerRecords[8], productIndices: [17, 18], quantities: [1, 1], status: 'delivered', payment: 'crypto', daysAgo: 38 },
    { customer: customerRecords[8], productIndices: [3, 4], quantities: [1, 1], status: 'cancelled', payment: 'card', daysAgo: 18, notes: 'Customer requested cancellation — funding issue' },
    { customer: customerRecords[9], productIndices: [19, 20], quantities: [1, 1], status: 'delivered', payment: 'crypto', daysAgo: 48 },
    { customer: customerRecords[9], productIndices: [0, 1, 21], quantities: [1, 1, 1], status: 'delivered', payment: 'crypto', daysAgo: 12, couponCode: 'PEPTIDE5', discount: 5.0 },
    { customer: customerRecords[10], productIndices: [22, 23], quantities: [1, 1], status: 'shipped', payment: 'ach', daysAgo: 6 },
    { customer: customerRecords[10], productIndices: [2], quantities: [2], status: 'delivered', payment: 'crypto', daysAgo: 33 },
    { customer: customerRecords[11], productIndices: [24, 25], quantities: [1, 1], status: 'delivered', payment: 'crypto', daysAgo: 27 },
    { customer: customerRecords[11], productIndices: [0, 6, 5], quantities: [2, 1, 1], status: 'pending', payment: 'card', daysAgo: 0 },
    // Guest orders
    { customer: { id: '', email: 'guest.researcher@gmail.com', name: null }, productIndices: [0, 10], quantities: [1, 1], status: 'delivered', payment: 'crypto', daysAgo: 52 },
    { customer: { id: '', email: 'laborder@protonmail.com', name: null }, productIndices: [13, 17], quantities: [1, 1], status: 'delivered', payment: 'crypto', daysAgo: 44 },
  ]

  let orderCount = 0
  for (const o of orderData) {
    // Guard against out-of-bounds product indices
    const validItems = o.productIndices.every(idx => idx < productRecords.length)
    if (!validItems) {
      console.warn(`  ⚠ Skipping order ${orderCount} — product index out of range`)
      orderCount++
      continue
    }

    const items = o.productIndices.map((pIdx, i) => ({
      productId: productRecords[pIdx].id,
      quantity: o.quantities[i],
      price: productRecords[pIdx].price,
      variantLabel: products[pIdx].variants[0]?.label || null,
    }))
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const discount = o.discount || 0
    const total = Math.max(0, subtotal - discount)

    await prisma.order.create({
      data: {
        userId: o.customer.id || undefined,
        email: o.customer.email,
        status: o.status,
        paymentMethod: o.payment,
        paymentRef: o.status !== 'pending' ? `PAY-${Date.now().toString(36).toUpperCase()}-${orderCount}` : null,
        shippingAddress: addresses[orderCount % addresses.length],
        subtotal: Math.round(subtotal * 100) / 100,
        total: Math.round(total * 100) / 100,
        discount,
        couponCode: o.couponCode || null,
        notes: o.notes || null,
        createdAt: new Date(Date.now() - o.daysAgo * 86400000),
        updatedAt: new Date(Date.now() - Math.max(0, o.daysAgo - 2) * 86400000),
        items: {
          create: items,
        },
      },
    })
    orderCount++
  }
  console.log(`  ✓ ${orderCount} orders`)

  console.log('\n✅ Seed complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
