import { useState, useMemo, useEffect, useRef } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
  ComposedChart, ReferenceLine
} from "recharts";

// ═══ Responsive hook ════════════════════════════════════════════════════════
function useIsMobile() {
  const [mob, setMob] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    setMob(mq.matches);
    const h = e => setMob(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return mob;
}

// ═══ Malayalam / English Translations ════════════════════════════════════════
const ML = {
  title: "NPS vs APS കാൽക്കുലേറ്റർ",
  subtitle: "കേരള സർക്കാർ പെൻഷൻ താരതമ്യം",
  configure: "നിങ്ങളുടെ വിവരങ്ങൾ നൽകുക",
  configureSub: "കൃത്യമായ കണക്കുകൾക്ക് നിങ്ങളുടെ സേവന വിവരങ്ങൾ നൽകുക",
  dob: "ജനന തീയതി",
  joinYear: "സർവീസിൽ ചേർന്ന വർഷം",
  retAge: "വിരമിക്കൽ പ്രായം",
  basicPay: "നിലവിലെ അടിസ്ഥാന ശമ്പളം",
  currentDA: "നിലവിലെ DA %",
  annualDA: "വാർഷിക DA വർദ്ധന",
  incRate: "വാർഷിക ഇൻക്രിമെന്റ്",
  govtNPS: "സർക്കാർ NPS സംഭാവന",
  existingCorpus: "നിലവിലെ NPS കോർപ്പസ്",
  existingCorpusHelp: "നിലവിൽ NPS-ൽ ഉള്ള തുക (ഇല്ലെങ്കിൽ 0)",
  advanced: "വിപുലമായ ക്രമീകരണങ്ങൾ",
  npsReturn: "NPS റിട്ടേൺ നിരക്ക്",
  annuityRate: "വാർഷിക നിരക്ക്",
  postDR: "വിരമിക്കലിന് ശേഷമുള്ള DR",
  inflation: "പണപ്പെരുപ്പ നിരക്ക്",
  faceOff: "മാസ പെൻഷൻ താരതമ്യം",
  apsAssured: "APS (ഉറപ്പ്)",
  npsNational: "NPS (ദേശീയ)",
  guaranteed: "✓ ഉറപ്പ്",
  drIndexed: "✓ DR ഇൻഡക്സ്ഡ്",
  lumpSum: "60% ഒറ്റത്തവണ",
  noDR: "⚠ DR ഇല്ല",
  todayValue: "📉 ഇന്നത്തെ മൂല്യം കാണുക",
  todayValueOn: "📉 ഇന്നത്തെ മൂല്യം ({{inf}}%) — ഓൺ",
  todayValueHint: "💡 ഭാവി തുകകൾ ഇന്നത്തെ ക്രയശക്തിയിൽ കാണാൻ ടാപ്പ് ചെയ്യുക",
  npsCorpus: "NPS മൊത്തം കോർപ്പസ്",
  npsLump: "NPS ഒറ്റത്തവണ (60%)",
  lastBasic: "അവസാന Basic Pay",
  service: "സേവനം",
  noDCRG: "APS അല്ലെങ്കിൽ NPS-ൽ കേരള സർക്കാർ ജീവനക്കാർക്ക് DCRG ലഭിക്കില്ല.",
  goNotice: "G.O.(P) No.33/2026/F.N തീയതി 28.02.2026: APS-ൽ ഒറ്റത്തവണ തുക ഉണ്ടാകില്ലെന്ന് G.O. സൂചിപ്പിക്കുന്നു.",
  compare: "താരതമ്യം",
  growth: "വളർച്ച",
  postRetire: "ശേഷം",
  details: "പട്ടിക",
  fillDetails: "വിവരങ്ങൾ നൽകുക",
  fillDetailsSub: "Basic Pay, DA%, ചേർന്ന വർഷം നൽകിയാൽ ഫലം ലഭിക്കും",
  whatsapp: "WhatsApp ഷെയർ",
  revTimeline: "പേ റിവിഷൻ ടൈംലൈൻ",
  revTimelineSub: "സേവന കാലത്തെ ശമ്പള പരിഷ്കരണങ്ങൾ",
  keyFacts: "പ്രധാന വസ്തുതകൾ",
  retireNote: "കേരള സർക്കാർ ജീവനക്കാർ ജന്മ മാസത്തിൽ വിരമിക്കുന്നു",
  disclaimer: "ഈ കാൽക്കുലേറ്റർ ഒരു ഏകദേശ ചിത്രം മാത്രം. ഔദ്യോഗിക കണക്കുകൾക്ക് പെൻഷൻ വിഭാഗവുമായി ബന്ധപ്പെടുക.",
};

const EN = {
  title: "NPS vs APS Calculator",
  subtitle: "Kerala Govt Pension Comparison",
  configure: "Your Service Details",
  configureSub: "Enter your details to generate personalised projections",
  dob: "Date of Birth",
  joinYear: "Year of Joining Service",
  retAge: "Retirement Age",
  basicPay: "Current Basic Pay (₹)",
  currentDA: "Current DA %",
  annualDA: "Annual DA Increase",
  incRate: "Annual Increment",
  govtNPS: "Govt NPS Contribution",
  existingCorpus: "Existing NPS Corpus (₹)",
  existingCorpusHelp: "Current NPS account balance (0 if none)",
  advanced: "Advanced Settings",
  npsReturn: "NPS Return Rate",
  annuityRate: "Annuity Rate",
  postDR: "Post-Retirement DR",
  inflation: "Inflation Rate",
  faceOff: "Monthly Pension Face-Off",
  apsAssured: "APS (Assured)",
  npsNational: "NPS (National)",
  guaranteed: "✓ Guaranteed",
  drIndexed: "✓ DR Indexed",
  lumpSum: "60% Lump Sum",
  noDR: "⚠ No DR",
  todayValue: "📉 Show in Today's Value",
  todayValueOn: "📉 Today's Value ({{inf}}% inflation) — ON",
  todayValueHint: "💡 Tap to convert all amounts to present purchasing power",
  npsCorpus: "NPS Total Corpus",
  npsLump: "NPS Lump Sum (60%)",
  lastBasic: "Last Basic Pay",
  service: "Service",
  noDCRG: "Kerala employees do NOT receive DCRG under APS or NPS.",
  goNotice: "G.O.(P) No.33/2026/F.N dated 28.02.2026: Latest G.O. on APS does not mention any lump sum.",
  compare: "Compare",
  growth: "Growth",
  postRetire: "Post-Retire",
  details: "Table",
  fillDetails: "Fill in your details above",
  fillDetailsSub: "Enter Basic Pay, DA% and joining year to see your pension comparison",
  whatsapp: "Share on WhatsApp",
  revTimeline: "Revision Timeline",
  revTimelineSub: "Pay revisions during your service",
  keyFacts: "Key Facts",
  retireNote: "Kerala Govt employees retire in their birth month",
  disclaimer: "Illustrative only. Actual amounts depend on pay scales, promotions, DA rates & NPS performance. Consult your pension section for official figures.",
};

// ═══ Pay Revision Logic ══════════════════════════════════════════════════════
const REVISIONS = [
  { year: 2026, month: 6, label: "12th Pay Rev (Jun 2026)",  fitment: 1.38, balanceDA: 4, type: "basic_only" },
  { year: 2031, month: 6, label: "13th Pay Rev (Jun 2031)*", fitment: 1.07, balanceDA: 4, type: "merge" },
  { year: 2036, month: 6, label: "14th Pay Rev (Jun 2036)*", fitment: 1.07, balanceDA: 4, type: "merge" },
  { year: 2041, month: 6, label: "15th Pay Rev (Jun 2041)*", fitment: 1.07, balanceDA: 3, type: "merge" },
  { year: 2046, month: 6, label: "16th Pay Rev (Jun 2046)*", fitment: 1.06, balanceDA: 3, type: "merge" },
  { year: 2051, month: 6, label: "17th Pay Rev (Jun 2051)*", fitment: 1.06, balanceDA: 3, type: "merge" },
  { year: 2056, month: 6, label: "18th Pay Rev (Jun 2056)*", fitment: 1.06, balanceDA: 3, type: "merge" },
  { year: 206
