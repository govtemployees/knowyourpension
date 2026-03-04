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
  { year: 2061, month: 6, label: "19th Pay Rev (Jun 2061)*", fitment: 1.06, balanceDA: 3, type: "merge" },
];

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const fmt  = v => { if (v>=1e7) return `₹${(v/1e7).toFixed(2)} Cr`; if (v>=1e5) return `₹${(v/1e5).toFixed(2)} L`; if (v>=1e3) return `₹${(v/1e3).toFixed(1)}K`; return `₹${Math.round(v)}`; };
const fmtF = v => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(v);
const pv   = (fv,r,y) => y<=0 ? fv : fv/Math.pow(1+r/100,y);

function simulate(p) {
  const birthYear  = parseInt(p.dob.split("-")[0]);
  const birthMonth = parseInt(p.dob.split("-")[1]);
  // Kerala rule: retire in birth month at retAge
  const retYear  = birthYear + p.retAge;
  const retMonth = birthMonth;
  const serviceYears = retYear - p.joinYear;
  if (serviceYears <= 0 || p.basic <= 0) return null;

  const CUR = 2026;
  const data = [];
  let basic  = p.basic;
  let daPct  = p.currentDA;
  let corpus = p.existingCorpus || 0;
  let empC = 0, govC = 0;

  // Loop from 2026 (current year) - user enters current basic, past years in existingCorpus
  for (let yr = CUR; yr < retYear; yr++) {
    const svc = yr - p.joinYear + 1;
    const rev = REVISIONS.find(r => r.year === yr);
    if (rev && yr >= 2026) {
      if (rev.type === "merge") {
        const preMergeDA = Math.round(basic * daPct / 100);
        basic = Math.ceil(((basic + preMergeDA) * rev.fitment) / 100) * 100;
      } else {
        basic = Math.ceil((basic * rev.fitment) / 100) * 100;
      }
      daPct = rev.balanceDA;
    }
    const da    = Math.round(basic * daPct / 100);
    const gross = basic + da;
    const nE    = Math.round(gross * 10 / 100);
    const nG    = Math.round(gross * p.govPct / 100);
    const mC    = nE + nG;
    const aC    = mC * 12;
    empC += nE * 12; govC += nG * 12;
    corpus = corpus * (1 + p.npsRet / 100) + aC * (1 + p.npsRet / 200);
    const yFN = yr - CUR;
    const iA  = pv(1, p.inf, Math.max(0, yFN));
    data.push({
      year: yr, svc, basic, daPct, da, gross,
      annSal: gross*12, annSalPV: Math.round(gross*12*iA),
      nE, nG, mC, aC,
      corpus: Math.round(corpus), corpusPV: Math.round(corpus*iA),
      totC: empC+govC,
      isRev: !!rev && yr>=2026, revLabel: rev && yr>=2026 ? rev.label : null,
    });
    basic  = Math.round(basic * (1 + p.incRate / 100));
    daPct += p.annualDA;
    daPct  = Math.round(daPct);
  }

  const last = data[data.length-1];
  if (!last) return null;

  const rYFN   = retYear - CUR;
  const rIA    = pv(1, p.inf, Math.max(0, rYFN));
  const qs     = Math.min(serviceYears, 33);
  const apsFac = qs >= 30 ? 0.50 : qs / 60;
  const apsP   = Math.round(last.basic * apsFac);
  const fC     = Math.round(corpus);
  const lump   = Math.round(fC * 0.60);
  const annCorp = Math.round(fC * 0.40);
  const npsP   = Math.round(annCorp * (p.annRate / 100) / 12);
  const totC   = empC + govC;
  const totR   = Math.max(0, fC - totC);

  const post = [];
  let cA=0,cN=0,cAP=0,cNP=0,curA=apsP,curN=npsP;
  for (let y=0; y<=25; y++) {
    if (y>0) curA = Math.round(curA*(1+p.postDR/100));
    const pIA = pv(1, p.inf, Math.max(0, rYFN+y));
    cA+=curA*12; cN+=curN*12;
    cAP+=Math.round(curA*12*pIA); cNP+=Math.round(curN*12*pIA);
    post.push({ year:y, label: y===0?"Retire":`+${y}yr`, apsP:curA, npsP:curN, apsPV:Math.round(curA*pIA), npsPV:Math.round(curN*pIA), cA,cN,cAP,cNP, adv:cA-cN, advPV:cAP-cNP });
  }
  let brk=null;
  if (apsP>npsP) { const d=apsP-npsP; if (d>0) brk=Math.ceil(lump/(d*12)); }
  return { data, lB:last.basic, lD:last.da, lG:last.gross, lDP:last.daPct, serviceYears, qs, retYear, retMonth, apsP, apsPV:Math.round(apsP*rIA), apsFac, fC, lump, lumpPV:Math.round(lump*rIA), annCorp, npsP, npsPV:Math.round(npsP*rIA), empC, govC, totC, totR, post, brk, rIA };
}

// ═══ Animated counter ════════════════════════════════════════════════════════
function Anim({ value, format=fmtF }) {
  const [d, setD] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const s=d, diff=value-s, st=performance.now();
    const run = now => {
      const p=Math.min((now-st)/700,1);
      setD(Math.round(s+diff*(1-Math.pow(1-p,3))));
      if (p<1) ref.current=requestAnimationFrame(run);
    };
    ref.current=requestAnimationFrame(run);
    return ()=>cancelAnimationFrame(ref.current);
  }, [value]);
  return <span>{format(d)}</span>;
}

// ═══ New Premium Theme (Glassmorphism) ════════════════════════════════════════
const T = {
  bg: "linear-gradient(160deg, #2e1065 0%, #7c3aed 20%, #ffffff 50%)",
  surface: "rgba(255, 255, 255, 0.7)", border: "rgba(0,0,0,0.08)",
  borderLight: "rgba(0,0,0,0.04)", text: "#111827",
  textDim: "#4b5563", textMuted: "#9ca3af",
  aps: "#111827", nps: "#5b21b6", acc: "#3b82f6", dan: "#ef4444",
  apsGlow: "rgba(17, 24, 39, 0.08)", npsGlow: "rgba(91, 33, 182, 0.12)", accGlow: "rgba(59, 130, 246, 0.1)",
};

const glass = { 
  background: T.surface, 
  backdropFilter: "blur(20px)", 
  WebkitBackdropFilter: "blur(20px)", 
  border: `1px solid ${T.border}`, 
  borderRadius: 24, 
  boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08)" 
};
const glassSm = { ...glass, borderRadius: 16, border: `1px solid ${T.borderLight}` };
const glassCard = { ...glass, borderRadius: 20, padding: "20px 24px" };
const selStyle = { width:"100%", padding:"12px 16px", borderRadius:12, background:"rgba(255,255,255,0.5)", border:`1px solid ${T.border}`, color:T.text, fontSize:14, fontWeight:600, outline:"none", fontFamily:"inherit", boxSizing:"border-box", cursor:"pointer", appearance:"none", WebkitAppearance:"none" };

// ═══ Components ══════════════════════════════════════════════════════════════
function GlassStat({ label, value, sub, color, icon, delay=0 }) {
  const [v, setV] = useState(false);
  useEffect(()=>{ const t=setTimeout(()=>setV(true),delay); return()=>clearTimeout(t); },[]);
  return (
    <div style={{ ...glassCard, position:"relative", overflow:"hidden", transform:v?"translateY(0)":"translateY(10px)", opacity:v?1:0, transition:"all 0.5s cubic-bezier(0.22,1,0.36,1)" }}>
      <div style={{ position:"absolute", top:-2, right:0, fontSize:36, opacity:0.08 }}>{icon}</div>
      <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.4, color:T.textMuted, marginBottom:5, fontWeight:600 }}>{label}</div>
      <div style={{ fontSize:20, fontWeight:700, color:color||T.text, letterSpacing:-0.5 }}>{typeof value==="number"?<Anim value={value}/>:value}</div>
      {sub&&<div style={{ fontSize:10, color:T.textMuted, marginTop:5, lineHeight:1.4 }}>{sub}</div>}
    </div>
  );
}

function GlassInput({ label, value, onChange, min, max, step, suffix, helpText }) {
  const [str, setStr] = useState(value===0?"":String(value));
  const prev = useRef(value);
  useEffect(()=>{ if (value!==prev.current){ prev.current=value; setStr(value===0?"":String(value)); } },[value]);
  return (
    <div>
      <label style={{ display:"block", fontSize:11, fontWeight:600, color:T.textDim, marginBottom:4, letterSpacing:0.2 }}>{label}</label>
      <div style={{ position:"relative" }}>
        <input type="number" value={str} min={min} max={max} step={step} placeholder="0"
          onChange={e=>{ setStr(e.target.value); const n=e.target.value===""?0:Number(e.target.value); if(!isNaN(n)) onChange(n); }}
          style={{ width:"100%", padding:"10px 12px", paddingRight:suffix?38:12, borderRadius:9, background:"rgba(255,255,255,0.4)", border:`1px solid ${T.border}`, color:T.text, fontSize:13, fontWeight:500, outline:"none", fontFamily:"inherit", boxSizing:"border-box" }}
          onFocus={e=>{ e.target.style.borderColor=T.acc; e.target.style.boxShadow=`0 0 0 3px ${T.accGlow}`; }}
          onBlur={e=>{ e.target.style.borderColor=T.border; e.target.style.boxShadow="none"; }}
        />
        {suffix&&<span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", fontSize:11, color:T.textMuted, fontWeight:600 }}>{suffix}</span>}
      </div>
      {helpText&&<div style={{ fontSize:10, color:T.textMuted, marginTop:3 }}>{helpText}</div>}
    </div>
  );
}

function DOBSelector({ value, onChange, label }) {
  const parts = value?value.split("-"):["1990","06","15"];
  const [yr,setYr]=useState(parts[0]); const [mo,setMo]=useState(parts[1]); const [dy,setDy]=useState(parts[2]);
  const daysInMonth = new Date(Number(yr),Number(mo),0).getDate();
  const emit=(y,m,d)=>{ const sd=Math.min(Number(d),new Date(Number(y),Number(m),0).getDate()); onChange(`${y}-${m}-${String(sd).padStart(2,"0")}`); };
  const sel=(setter,field)=>e=>{ const v=e.target.value; setter(v); if(field==="yr")emit(v,mo,dy); else if(field==="mo")emit(yr,v,dy); else emit(yr,mo,v); };
  const fields = [
    {val:dy, fn:sel(setDy,"dy"), opts:Array.from({length:daysInMonth},(_,i)=>({v:String(i+1).padStart(2,"0"),l:String(i+1)}))},
    {val:mo, fn:sel(setMo,"mo"), opts:MONTHS_FULL.map((m,i)=>({v:String(i+1).padStart(2,"0"),l:m}))},
    {val:yr, fn:sel(setYr,"yr"), opts:Array.from({length:45},(_,i)=>({v:String(1960+i),l:String(1960+i)}))},
  ];
  return (
    <div>
      <label style={{ display:"block", fontSize:11, fontWeight:600, color:T.textDim, marginBottom:4, letterSpacing:0.2 }}>{label}</label>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr 1.3fr", gap:5 }}>
        {fields.map((f,i)=>(
          <div key={i} style={{ position:"relative" }}>
            <select value={f.val} onChange={f.fn} style={selStyle}>{f.opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select>
            <span style={{ position:"absolute", right:7, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:T.textMuted, fontSize:9 }}>▼</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize:10, color:T.textMuted, marginTop:3 }}>Day / Month / Year</div>
    </div>
  );
}

function JoinYearSelector({ value, onChange, label }) {
  const years=Array.from({length:42},(_,i)=>2004+i);
  return (
    <div>
      <label style={{ display:"block", fontSize:11, fontWeight:600, color:T.textDim, marginBottom:4, letterSpacing:0.2 }}>{label}</label>
      <div style={{ position:"relative" }}>
        <select value={value} onChange={e=>onChange(Number(e.target.value))} style={selStyle}>
          {years.map(y=><option key={y} value={y}>{y}</option>)}
        </select>
        <span style={{ position:"absolute", right:7, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:T.textMuted, fontSize:9 }}>▼</span>
      </div>
      <div style={{ fontSize:10, color:T.textMuted, marginTop:3 }}>NPS applicable from 2004</div>
    </div>
  );
}

function Sec({ children, icon, sub }) {
  return (
    <div style={{ marginBottom:16 }}>
      <h2 style={{ fontSize:16, fontWeight:700, color:T.text, display:"flex", alignItems:"center", gap:8, margin:0 }}>
        <span style={{ fontSize:18 }}>{icon}</span>{children}
      </h2>
      {sub&&<p style={{ fontSize:11, color:T.textMuted, margin:"3px 0 0 26px" }}>{sub}</p>}
    </div>
  );
}

function Pill({ children, color=T.acc }) {
  return <span style={{ display:"inline-block", padding:"3px 9px", borderRadius:100, fontSize:10, fontWeight:600, color, background:`${color}15`, border:`1px solid ${color}25` }}>{children}</span>;
}

function Note({ children, type="info" }) {
  const c={info:{bg:"rgba(239,246,255,0.6)",tx:"#1e40af",ic:"ℹ️",bd:"#bfdbfe"},warn:{bg:"rgba(255,251,235,0.6)",tx:"#92400e",ic:"⚠️",bd:"#fcd34d"},ok:{bg:"rgba(240,253,244,0.6)",tx:"#166534",ic:"✅",bd:"#86efac"},bad:{bg:"rgba(254,242,242,0.6)",tx:"#991b1b",ic:"🚫",bd:"#fecaca"}}[type];
  return (
    <div style={{ padding:"10px 13px", borderRadius:11, background:c.bg, border:`1px solid ${c.bd}`, fontSize:12, color:c.tx, lineHeight:1.55, display:"flex", gap:7, backdropFilter:"blur(5px)" }}>
      <span style={{ fontSize:13, flexShrink:0 }}>{c.ic}</span><div>{children}</div>
    </div>
  );
}

const WaIcon = ()=>(
  <svg width="15" height="15" viewBox="0 0 24 24" fill="#25d366">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// ═══ MAIN APP ════════════════════════════════════════════════════════════════
export default function App() {
  const mob = useIsMobile();

  const [dob, setDob] = useState("1990-06-15");
  const [joinYear, setJoinYear] = useState(2021);
  const [retAge, setRetAge] = useState(60);
  const [basic, setBasic] = useState(0);
  const [currentDA, setCurrentDA] = useState(35);
  const [annualDA, setAnnualDA] = useState(6);
  const [incRate, setIncRate] = useState(2);
  const [govPct, setGovPct] = useState(10);
  const [existingCorpus, setExistingCorpus] = useState(0);
  const [npsRet, setNpsRet] = useState(8);
  const [annRate, setAnnRate] = useState(6.5);
  const [postDR, setPostDR] = useState(4);
  const [inf, setInf] = useState(6);
  const [tab, setTab] = useState("compare");
  const [pvOn, setPvOn] = useState(false);
  const [lang, setLang] = useState("en");
  const t = lang==="ml" ? ML : EN;

  // ── Scenario B state ──────────────────────────────────────────
  const [scMode, setScMode] = useState(false); // scenario comparison mode
  const [dobB, setDobB] = useState("1992-01-20");
  const [joinYearB, setJoinYearB] = useState(2018);
  const [retAgeB, setRetAgeB] = useState(60);
  const [basicB, setBasicB] = useState(0);
  const [currentDAB, setCurrentDAB] = useState(35);
  const [annualDAB, setAnnualDAB] = useState(6);
  const [incRateB, setIncRateB] = useState(2);
  const [govPctB, setGovPctB] = useState(10);
  const [existingCorpusB, setExistingCorpusB] = useState(0);
  const [npsRetB, setNpsRetB] = useState(8);
  const [annRateB, setAnnRateB] = useState(6.5);
  const [postDRB, setPostDRB] = useState(4);
  const [infB, setInfB] = useState(6);
  const [labelA, setLabelA] = useState("Profile A");
  const [labelB, setLabelB] = useState("Profile B");

  const R = useMemo(()=>simulate({ dob, joinYear, retAge, basic, currentDA, annualDA, incRate, npsRet, annRate, govPct, postDR, inf, existingCorpus }),
    [dob, joinYear, retAge, basic, currentDA, annualDA, incRate, npsRet, annRate, govPct, postDR, inf, existingCorpus]);

  const RB = useMemo(()=>simulate({ dob:dobB, joinYear:joinYearB, retAge:retAgeB, basic:basicB, currentDA:currentDAB, annualDA:annualDAB, incRate:incRateB, npsRet:npsRetB, annRate:annRateB, govPct:govPctB, postDR:postDRB, inf:infB, existingCorpus:existingCorpusB }),
    [dobB, joinYearB, retAgeB, basicB, currentDAB, annualDAB, incRateB, npsRetB, annRateB, govPctB, postDRB, infB, existingCorpusB]);

  const tabs = [
    {id:"compare",label:t.compare,icon:"⚖️"},
    {id:"growth",label:t.growth,icon:"📈"},
    {id:"pension",label:t.postRetire,icon:"🏖️"},
    {id:"table",label:t.details,icon:"📋"},
  ];

  const birthMonth    = parseInt(dob.split("-")[1]);
  const birthYear     = parseInt(dob.split("-")[0]);
  const retMonthName  = MONTH_NAMES[birthMonth-1];

  const shareOnWhatsApp = () => {
    if (!R) return;
    const winner = R.apsP>R.npsP?"APS":"NPS";
    const diff   = fmtF(Math.abs(R.apsP-R.npsP));
    const retStr = `${retMonthName} ${R.retYear}`;
    const msg = lang==="ml"
      ? `🏛️ എന്റെ പെൻഷൻ കണക്ക്\nknowyourpension.vercel.app\n\n📊 സേവനം: ${R.serviceYears} വർഷം\n🗓️ വിരമിക്കൽ: ${retStr}\n💰 Last Basic: ${fmtF(R.lB)}\n\n🛡️ APS: ${fmtF(R.apsP)}/മാസം\n📈 NPS: ${fmtF(R.npsP)}/മാസം\n🏦 NPS Corpus: ${fmt(R.fC)}\n\n✅ ${winner} ${diff} കൂടുതൽ\n\nകണക്കാക്കൂ 👇\nhttps://knowyourpension.vercel.app`
      : `🏛️ My Pension Comparison\nknowyourpension.vercel.app\n\n📊 Service: ${R.serviceYears} yrs\n🗓️ Retire: ${retStr}\n💰 Last Basic: ${fmtF(R.lB)}\n\n🛡️ APS: ${fmtF(R.apsP)}/mo\n📈 NPS: ${fmtF(R.npsP)}/mo\n🏦 NPS Corpus: ${fmt(R.fC)}\n\n✅ ${winner} pays ${diff} more\n\nCalculate yours 👇\nhttps://knowyourpension.vercel.app`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`,"_blank");
  };

  const TT = ({active,payload,label})=>{
    if (!active||!payload?.length) return null;
    return (
      <div style={{ ...glassSm, padding:"11px 13px", fontSize:11 }}>
        <div style={{ fontWeight:700, marginBottom:5, color:T.text }}>{label}</div>
        {payload.map((p,i)=>(
          <div key={i} style={{ display:"flex", alignItems:"center", gap:5, marginBottom:3 }}>
            <div style={{ width:7, height:7, borderRadius:7, background:p.color }}/>
            <span style={{ color:T.textDim }}>{p.name}:</span>
            <span style={{ color:T.text, fontWeight:700 }}>{fmt(p.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  const pad  = mob ? "14px 14px" : "22px 24px";
  const gCol = mob ? "1fr" : "repeat(auto-fill, minmax(185px, 1fr))";
  const chartH = mob ? 230 : 300;

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.text, fontFamily:"'DM Sans',-apple-system,sans-serif" }}>

      <div style={{ position:"relative", zIndex:1, maxWidth:860, margin:"0 auto", padding: mob?"0 12px 28px":"0 20px 40px" }}>

        {/* ── HEADER ───────────────────────────────────────────── */}
        <div style={{ padding: mob?"14px 0 12px":"20px 0 16px", borderBottom:`1px solid ${T.border}` }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:11 }}>
              <div style={{ width:42, height:42, borderRadius:11, background:"rgba(255,255,255,0.4)", border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0, backdropFilter:"blur(10px)" }}>🏛️</div>
              <div>
                <h1 style={{ fontSize:mob?17:21, fontWeight:700, margin:0, color:T.text, lineHeight:1.2 }}>{t.title}</h1>
                <p style={{ fontSize:11, color:T.textDim, margin:"2px 0 0" }}>{t.subtitle}</p>
              </div>
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", justifyContent:"flex-end" }}>
              <button onClick={()=>setLang(lang==="en"?"ml":"en")} style={{ padding:"7px 13px", borderRadius:100, border:`1px solid ${T.border}`, background:"rgba(255,255,255,0.4)", cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:700, color:T.text, backdropFilter:"blur(10px)" }}>
                {lang==="en"?"മലയാളം":"English"}
              </button>
              <button onClick={()=>setScMode(!scMode)} style={{ padding:"7px 13px", borderRadius:100, border:`2px solid ${scMode?"#7c3aed":T.border}`, background:scMode?"#7c3aed":"rgba(255,255,255,0.4)", cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:700, color:scMode?"#ffffff":T.text, display:"flex", alignItems:"center", gap:4, backdropFilter:"blur(10px)" }}>
                ⚡ {scMode?(lang==="ml"?"സിംഗിൾ മോഡ്":"Single Mode"):(lang==="ml"?"പ്രൊഫൈൽ താരതമ്യം":"Compare Profiles")}
              </button>
              {R&&!scMode&&(
                <button onClick={shareOnWhatsApp} style={{ padding:"7px 13px", borderRadius:100, border:"1px solid rgba(37,180,80,0.4)", background:"rgba(37,211,102,0.1)", cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:700, color:"#25d366", display:"flex", alignItems:"center", gap:5, backdropFilter:"blur(10px)" }}>
                  <WaIcon/>{mob?"":" "+t.whatsapp}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── CONFIGURE ────────────────────────────────────────── */}
        {!scMode && (
        <div style={{ ...glass, padding:pad, marginBottom:12, marginTop:16 }}>
          <Sec icon="⚙️" sub={t.configureSub}>{t.configure}</Sec>

          <div style={{ display:"grid", gridTemplateColumns:gCol, gap:11 }}>
            <DOBSelector value={dob} onChange={setDob} label={t.dob}/>
            <JoinYearSelector value={joinYear} onChange={setJoinYear} label={t.joinYear}/>
            <GlassInput label={t.retAge} value={retAge} onChange={setRetAge} min={56} max={62} helpText="Kerala CPS: 60 yrs"/>
            <GlassInput label={t.basicPay} value={basic} onChange={setBasic} min={0} max={500000} suffix="₹" helpText="Your current basic pay"/>
            <GlassInput label={t.currentDA} value={currentDA} onChange={setCurrentDA} min={0} max={100} suffix="%" helpText="Current DA (~35%)"/>
            <GlassInput label={t.annualDA} value={annualDA} onChange={setAnnualDA} min={0} max={12} suffix="%/yr" helpText="~6%/yr (3%×2)"/>
            <GlassInput label={t.incRate} value={incRate} onChange={setIncRate} min={0} max={10} step={0.5} suffix="%/yr" helpText="Annual basic increment"/>
            <GlassInput label={t.govtNPS} value={govPct} onChange={setGovPct} min={0} max={14} suffix="%" helpText="Default 10%, max 14%"/>
            <GlassInput label={t.existingCorpus} value={existingCorpus} onChange={setExistingCorpus} min={0} suffix="₹" helpText={t.existingCorpusHelp}/>
          </div>

          <div style={{ paddingTop:13, borderTop:`1px solid ${T.border}`, marginTop:13 }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.nps, marginBottom:10 }}>{t.advanced}</div>
            <div style={{ display:"grid", gridTemplateColumns:gCol, gap:11 }}>
              <GlassInput label={t.npsReturn} value={npsRet} onChange={setNpsRet} min={0} max={18} step={0.5} suffix="%" helpText="Historical: 9–12%"/>
              <GlassInput label={t.annuityRate} value={annRate} onChange={setAnnRate} min={0} max={10} step={0.5} suffix="%"/>
              <GlassInput label={t.postDR} value={postDR} onChange={setPostDR} min={0} max={10} step={0.5} suffix="%" helpText="APS indexed yearly"/>
              <GlassInput label={t.inflation} value={inf} onChange={setInf} min={0} max={15} step={0.5} suffix="%" helpText="For today's value"/>
            </div>
          </div>
        </div>
        )}

        {/* ── SCENARIO COMPARISON MODE ──────────────────────────── */}
        {scMode && (
        <div style={{ marginBottom:12, marginTop:16 }}>
          <div style={{ padding:"10px 14px", borderRadius:10, background:"rgba(124, 58, 237, 0.1)", border:"2px solid #7c3aed", marginBottom:12, fontSize:12, color:"#5b21b6", display:"flex", gap:8, alignItems:"center", backdropFilter:"blur(10px)" }}>
            <span>⚡</span>
            <span><strong>Scenario Comparison Mode</strong> — Fill both profiles below and compare side-by-side</span>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:10, marginBottom:10 }}>
            {[
              { label:"Profile A Name", val:labelA, set:setLabelA, color:"#1a56a0", bg:"rgba(239,246,255,0.7)", border:"#bfdbfe" },
              { label:"Profile B Name", val:labelB, set:setLabelB, color:"#7c3aed", bg:"rgba(245,243,255,0.7)", border:"#ddd6fe" },
            ].map((p,i)=>(
              <div key={i} style={{ padding:pad, borderRadius:16, background:p.bg, border:`2px solid ${p.border}`, backdropFilter:"blur(15px)" }}>
                <div style={{ marginBottom:10 }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:p.color, marginBottom:4 }}>{p.label}</label>
                  <input value={p.val} onChange={e=>p.set(e.target.value)}
                    style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${p.border}`, background:"rgba(255,255,255,0.6)", color:T.text, fontSize:14, fontWeight:700, fontFamily:"inherit", boxSizing:"border-box", outline:"none" }}
                  />
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
                  {i===0 ? <>
                    <DOBSelector value={dob} onChange={setDob} label={t.dob}/>
                    <JoinYearSelector value={joinYear} onChange={setJoinYear} label={t.joinYear}/>
                    <GlassInput label={t.basicPay} value={basic} onChange={setBasic} min={0} max={500000} suffix="₹" helpText="Current basic"/>
                    <GlassInput label={t.currentDA} value={currentDA} onChange={setCurrentDA} min={0} max={100} suffix="%"/>
                    <GlassInput label={t.annualDA} value={annualDA} onChange={setAnnualDA} min={0} max={12} suffix="%/yr"/>
                    <GlassInput label={t.incRate} value={incRate} onChange={setIncRate} min={0} max={10} step={0.5} suffix="%/yr"/>
                    <GlassInput label={t.govtNPS} value={govPct} onChange={setGovPct} min={0} max={14} suffix="%"/>
                    <GlassInput label={t.existingCorpus} value={existingCorpus} onChange={setExistingCorpus} min={0} suffix="₹"/>
                    <GlassInput label={t.npsReturn} value={npsRet} onChange={setNpsRet} min={0} max={18} step={0.5} suffix="%"/>
                    <GlassInput label={t.annuityRate} value={annRate} onChange={setAnnRate} min={0} max={10} step={0.5} suffix="%"/>
                    <GlassInput label={t.postDR} value={postDR} onChange={setPostDR} min={0} max={10} step={0.5} suffix="%"/>
                    <GlassInput label={t.inflation} value={inf} onChange={setInf} min={0} max={15} step={0.5} suffix="%"/>
                 </> : <>
                    <DOBSelector value={dobB} onChange={setDobB} label={t.dob}/>
                    <JoinYearSelector value={joinYearB} onChange={setJoinYearB} label={t.joinYear}/>
                    <GlassInput label={t.basicPay} value={basicB} onChange={setBasicB} min={0} max={500000} suffix="₹" helpText="Current basic"/>
                    <GlassInput label={t.currentDA} value={currentDAB} onChange={setCurrentDAB} min={0} max={100} suffix="%"/>
                    <GlassInput label={t.annualDA} value={annualDAB} onChange={setAnnualDAB} min={0} max={12} suffix="%/yr"/>
                    <GlassInput label={t.incRate} value={incRateB} onChange={setIncRateB} min={0} max={10} step={0.5} suffix="%/yr"/>
                    <GlassInput label={t.govtNPS} value={govPctB} onChange={setGovPctB} min={0} max={14} suffix="%"/>
                    <GlassInput label={t.existingCorpus} value={existingCorpusB} onChange={setExistingCorpusB} min={0} suffix="₹"/>
                    <GlassInput label={t.npsReturn} value={npsRetB} onChange={setNpsRetB} min={0} max={18} step={0.5} suffix="%"/>
                    <GlassInput label={t.annuityRate} value={annRateB} onChange={setAnnRateB} min={0} max={10} step={0.5} suffix="%"/>
                    <GlassInput label={t.postDR} value={postDRB} onChange={setPostDRB} min={0} max={10} step={0.5} suffix="%"/>
                    <GlassInput label={t.inflation} value={infB} onChange={setInfB} min={0} max={15} step={0.5} suffix="%"/>
                  </>}
                </div>
              </div>
            ))}
          </div>

          {/* Scenario Results */}
          {(R || RB) && (
          <div>
            <div style={{ ...glass, padding:pad, marginBottom:10 }}>
              <Sec icon="📊">Results Comparison</Sec>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead>
                    <tr>
                      <th style={{ padding:"10px 12px", textAlign:"left", color:T.textMuted, fontWeight:700, fontSize:10, textTransform:"uppercase", borderBottom:`2px solid ${T.border}` }}>Metric</th>
                      <th style={{ padding:"10px 12px", textAlign:"right", color:"#1a56a0", fontWeight:700, fontSize:12, borderBottom:`2px solid #bfdbfe`, background:"rgba(239,246,255,0.4)" }}>{labelA}</th>
                      <th style={{ padding:"10px 12px", textAlign:"right", color:"#7c3aed", fontWeight:700, fontSize:12, borderBottom:`2px solid #ddd6fe`, background:"rgba(245,243,255,0.4)" }}>{labelB}</th>
                      <th style={{ padding:"10px 12px", textAlign:"right", color:T.textMuted, fontWeight:700, fontSize:10, textTransform:"uppercase", borderBottom:`2px solid ${T.border}` }}>Diff</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label:"Service Years",    a:R?`${R.serviceYears} yrs`:"-",   b:RB?`${RB.serviceYears} yrs`:"-",  diff:R&&RB?`${R.serviceYears-RB.serviceYears} yrs`:"-", isNum:false },
                      { label:"Retirement",        a:R?`${MONTH_NAMES[R.retMonth-1]} ${R.retYear}`:"-", b:RB?`${MONTH_NAMES[RB.retMonth-1]} ${RB.retYear}`:"-", diff:"", isNum:false },
                      { label:"Last Basic Pay",    a:R?R.lB:null,   b:RB?RB.lB:null,   isNum:true },
                      { label:"APS Monthly",       a:R?R.apsP:null, b:RB?RB.apsP:null, isNum:true, highlight:true },
                      { label:"NPS Monthly",       a:R?R.npsP:null, b:RB?RB.npsP:null, isNum:true, highlight:true },
                      { label:"NPS Corpus",        a:R?R.fC:null,   b:RB?RB.fC:null,   isNum:true },
                      { label:"NPS Lump Sum (60%)",a:R?R.lump:null, b:RB?RB.lump:null, isNum:true },
                      { label:"Total Contributions",a:R?R.totC:null,b:RB?RB.totC:null, isNum:true },
                    ].map((row,i)=>{
                      const diff = row.isNum && R && RB ? (row.a||0)-(row.b||0) : null;
                      return (
                        <tr key={i} style={{ borderBottom:`1px solid ${T.border}`, background:i%2===0?"rgba(255,255,255,0.2)":"transparent" }}>
                          <td style={{ padding:"10px 12px", color:T.textDim, fontWeight:600, fontSize:11 }}>{row.label}</td>
                          <td style={{ padding:"10px 12px", textAlign:"right", fontWeight:row.highlight?700:500, color:row.highlight?"#1a56a0":T.text, background:"rgba(248,251,255,0.3)" }}>
                            {row.isNum ? (row.a ? fmtF(row.a) : "-") : row.a}
                          </td>
                          <td style={{ padding:"10px 12px", textAlign:"right", fontWeight:row.highlight?700:500, color:row.highlight?"#7c3aed":T.text, background:"rgba(251,249,255,0.3)" }}>
                            {row.isNum ? (row.b ? fmtF(row.b) : "-") : row.b}
                          </td>
                          <td style={{ padding:"10px 12px", textAlign:"right", fontWeight:700, fontSize:11,
                            color: diff===null ? T.textMuted : diff>0 ? "#1a56a0" : diff<0 ? "#7c3aed" : T.textMuted }}>
                            {diff===null ? (row.diff||"-") : diff===0 ? "=" : `${diff>0?"+":""}${fmt(Math.abs(diff))}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:10, marginBottom:10 }}>
              <div style={{ ...glass, padding:pad }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:14 }}>🛡️ APS Monthly Pension</div>
                {[{label:labelA, val:R?.apsP||0, color:"#1a56a0"},{label:labelB, val:RB?.apsP||0, color:"#7c3aed"}].map((b,i)=>(
                  <div key={i} style={{ marginBottom:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontSize:12, fontWeight:600, color:b.color }}>{b.label}</span>
                      <span style={{ fontSize:13, fontWeight:700, color:b.color }}>{fmtF(b.val)}</span>
                    </div>
                    <div style={{ height:12, borderRadius:6, background:"rgba(0,0,0,0.05)", overflow:"hidden" }}>
                      <div style={{ height:"100%", borderRadius:6, background:b.color, width:`${Math.min(100,b.val/Math.max(R?.apsP||1,RB?.apsP||1)*100)}%`, transition:"width 0.8s ease" }}/>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ ...glass, padding:pad }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:14 }}>📈 NPS Monthly Pension</div>
                {[{label:labelA, val:R?.npsP||0, color:"#1a56a0"},{label:labelB, val:RB?.npsP||0, color:"#7c3aed"}].map((b,i)=>(
                  <div key={i} style={{ marginBottom:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontSize:12, fontWeight:600, color:b.color }}>{b.label}</span>
                      <span style={{ fontSize:13, fontWeight:700, color:b.color }}>{fmtF(b.val)}</span>
                    </div>
                    <div style={{ height:12, borderRadius:6, background:"rgba(0,0,0,0.05)", overflow:"hidden" }}>
                      <div style={{ height:"100%", borderRadius:6, background:b.color, width:`${Math.min(100,b.val/Math.max(R?.npsP||1,RB?.npsP||1)*100)}%`, transition:"width 0.8s ease" }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {R&&RB&&(
            <div style={{ ...glass, padding:pad, marginBottom:10 }}>
              <Sec icon="📈">NPS Corpus Growth — Both Profiles</Sec>
              <ResponsiveContainer width="100%" height={chartH}>
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderLight}/>
                  <XAxis dataKey="year" type="number" domain={["dataMin","dataMax"]} stroke={T.textMuted} fontSize={9} tickFormatter={v=>mob?`'${String(v).slice(2)}`:v} allowDuplicatedCategory={false}/>
                  <YAxis stroke={T.textMuted} fontSize={9} tickFormatter={fmt} width={52}/>
                  <Tooltip content={<TT/>}/><Legend wrapperStyle={{fontSize:10,color:T.textDim,paddingTop:8}}/>
                  <Line data={R.data} type="monotone" dataKey="corpus" name={`${labelA} Corpus`} stroke="#1a56a0" strokeWidth={2.5} dot={false}/>
                  <Line data={RB.data} type="monotone" dataKey="corpus" name={`${labelB} Corpus`} stroke="#7c3aed" strokeWidth={2.5} dot={false} strokeDasharray="6 3"/>
                </LineChart>
              </ResponsiveContainer>
            </div>
            )}

            {R&&RB&&(
            <div style={{ ...glass, padding:pad }}>
              <Sec icon="🏖️">Post-Retirement APS Pension — Both Profiles</Sec>
              <ResponsiveContainer width="100%" height={chartH}>
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderLight}/>
                  <XAxis dataKey="year" type="number" domain={[0,25]} stroke={T.textMuted} fontSize={9} tickFormatter={v=>v===0?"Retire":`+${v}yr`} allowDuplicatedCategory={false}/>
                  <YAxis stroke={T.textMuted} fontSize={9} tickFormatter={fmt} width={52}/>
                  <Tooltip content={<TT/>}/><Legend wrapperStyle={{fontSize:10,color:T.textDim,paddingTop:8}}/>
                  <Line data={R.post} type="monotone" dataKey="apsP" name={`${labelA} APS`} stroke="#1a56a0" strokeWidth={2.5} dot={false}/>
                  <Line data={RB.post} type="monotone" dataKey="apsP" name={`${labelB} APS`} stroke="#7c3aed" strokeWidth={2.5} dot={false} strokeDasharray="6 3"/>
                  <Line data={R.post} type="monotone" dataKey="npsP" name={`${labelA} NPS`} stroke="#1a56a0" strokeWidth={1.5} dot={false} strokeDasharray="3 3"/>
                  <Line data={RB.post} type="monotone" dataKey="npsP" name={`${labelB} NPS`} stroke="#7c3aed" strokeWidth={1.5} dot={false} strokeDasharray="3 6"/>
                </LineChart>
              </ResponsiveContainer>
            </div>
            )}
          </div>
          )}
        </div>
        )}

        {/* ── EMPTY STATE ──────────────────────────────────────── */}
        {!R&&(
          <div style={{ ...glass, padding:mob?"30px 18px":"38px", marginBottom:12, textAlign:"center" }}>
            <div style={{ fontSize:42, marginBottom:10 }}>👆</div>
            <div style={{ fontSize:16, fontWeight:700, color:T.text, marginBottom:7 }}>{t.fillDetails}</div>
            <div style={{ fontSize:12, color:T.textDim }}>{t.fillDetailsSub}</div>
          </div>
        )}

        {R&&(<>
          {/* ── FACE-OFF ─────────────────────────────────────── */}
          <div style={{ ...glass, padding:pad, marginBottom:12 }}>
            <Sec icon="⚖️">{t.faceOff}</Sec>

            <div style={{ marginBottom:13, padding:"8px 12px", borderRadius:9, background:"rgba(240,253,244,0.6)", border:"1px solid rgba(187,247,208,0.5)", fontSize:12, color:"#166534", display:"flex", gap:7, alignItems:"center", flexWrap:"wrap" }}>
              <span>🗓️</span>
              <span>{lang==="ml"?"വിരമിക്കൽ:":"Retirement:"} <strong>{retMonthName} {R.retYear}</strong> · {R.serviceYears} {lang==="ml"?"വർഷം സേവനം":"years service"}</span>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 40px 1fr", alignItems:"center", gap:mob?9:12 }}>
              <div style={{ textAlign:"center", padding:mob?"18px 12px":"22px 16px", borderRadius:14, background:"rgba(255,255,255,0.4)", border:"1px solid rgba(17,24,39,0.1)" }}>
                <div style={{ fontSize:9, fontWeight:700, color:T.aps, textTransform:"uppercase", letterSpacing:2, marginBottom:9 }}>{t.apsAssured}</div>
                <div style={{ fontSize:mob?32:38, fontWeight:700, color:T.aps, letterSpacing:-1 }}><Anim value={pvOn?R.apsPV:R.apsP}/></div>
                <div style={{ fontSize:11, color:T.textDim, marginTop:7 }}>{(R.apsFac*100).toFixed(0)}% of {fmtF(R.lB)}</div>
                <div style={{ marginTop:10, display:"flex", gap:5, justifyContent:"center", flexWrap:"wrap" }}>
                  <Pill color={T.aps}>{t.guaranteed}</Pill><Pill color={T.aps}>{t.drIndexed}</Pill>
                </div>
              </div>

              {mob
                ? <div style={{ textAlign:"center", fontSize:13, color:T.textMuted, fontWeight:800 }}>── VS ──</div>
                : <div style={{ fontSize:16, textAlign:"center", color:T.textMuted, fontWeight:800 }}>VS</div>
              }

              <div style={{ textAlign:"center", padding:mob?"18px 12px":"22px 16px", borderRadius:14, background:"rgba(255,255,255,0.4)", border:"1px solid rgba(91,33,182,0.15)" }}>
                <div style={{ fontSize:9, fontWeight:700, color:T.nps, textTransform:"uppercase", letterSpacing:2, marginBottom:9 }}>{t.npsNational}</div>
                <div style={{ fontSize:mob?32:38, fontWeight:700, color:T.nps, letterSpacing:-1 }}><Anim value={pvOn?R.npsPV:R.npsP}/></div>
                <div style={{ fontSize:11, color:T.textDim, marginTop:7 }}>40% @ {annRate}% · {fmt(pvOn?R.lumpPV:R.lump)} lump</div>
                <div style={{ marginTop:10, display:"flex", gap:5, justifyContent:"center", flexWrap:"wrap" }}>
                  <Pill color={T.nps}>{t.lumpSum}</Pill><Pill color={T.dan}>{t.noDR}</Pill>
                </div>
              </div>
            </div>

            <div style={{ marginTop:14, padding:"12px 16px", borderRadius:11, background:"rgba(255,255,255,0.5)", border:`1px solid ${T.borderLight}`, textAlign:"center" }}>
              <div style={{ fontSize:mob?13:15, fontWeight:700, color:R.apsP>R.npsP?T.aps:T.nps }}>
                {R.apsP>R.npsP?"🛡️ APS":"📊 NPS"} pays {fmtF(Math.abs(R.apsP-R.npsP))}/month more
              </div>
              {R.brk&&R.apsP>R.npsP&&<div style={{ fontSize:11, color:T.textDim, marginTop:5 }}>APS recovers {fmt(R.lump)} lump in ~<strong style={{color:T.text}}>{R.brk} yrs</strong></div>}
            </div>

            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginTop:13, gap:5 }}>
              <button onClick={()=>setPvOn(!pvOn)} style={{ padding:mob?"10px 20px":"11px 26px", borderRadius:100, border:`1px solid ${pvOn?T.nps:T.border}`, background:pvOn?T.nps:"rgba(255,255,255,0.6)", cursor:"pointer", fontFamily:"inherit", fontSize:mob?12:14, fontWeight:700, color:pvOn?"#ffffff":T.textDim, boxShadow:pvOn?`0 0 18px ${T.npsGlow}`:"none", backdropFilter:"blur(5px)" }}>
                {pvOn?t.todayValueOn.replace("{{inf}}",inf):t.todayValue}
              </button>
              <p style={{ fontSize:10, color:T.textMuted, margin:0, textAlign:"center" }}>{t.todayValueHint}</p>
            </div>
          </div>

          {/* ── QUICK STATS ──────────────────────────────────── */}
          <div style={{ display:"grid", gridTemplateColumns:mob?"1fr 1fr":"repeat(4,1fr)", gap:9, marginBottom:12 }}>
            <GlassStat label={t.npsCorpus} icon="🏦" delay={0}   value={pvOn?Math.round(R.fC*R.rIA):R.fC} sub={`${fmt(R.totC)} contrib`} color={T.nps}/>
            <GlassStat label={t.npsLump}   icon="💵" delay={60}  value={pvOn?R.lumpPV:R.lump} sub="60% at retire" color={T.nps}/>
            <GlassStat label={t.lastBasic} icon="💰" delay={120} value={R.lB} sub={`Gross ${fmtF(R.lG)}`}/>
            <GlassStat label={t.service}   icon="📅" delay={180} value={`${R.serviceYears}y`} sub={`→ ${retMonthName} ${R.retYear}`}/>
          </div>

          {/* Notices */}
          <div style={{ display:"flex", flexDirection:"column", gap:9, marginBottom:12 }}>
            <Note type="bad"><strong>No DCRG:</strong> {t.noDCRG}</Note>
            <Note type="warn"><strong>⚠️ {t.goNotice}</strong></Note>
            {existingCorpus>0&&<Note type="ok"><strong>{lang==="ml"?"നിലവിലെ കോർപ്പസ്":"Existing corpus"} {fmt(existingCorpus)}</strong> {lang==="ml"?"പ്രൊജക്ഷനിൽ ഉൾപ്പെടുത്തി.":"included in NPS projection."}</Note>}
          </div>

          {/* ── TABS ─────────────────────────────────────────── */}
          <div style={{ display:"flex", gap:5, marginBottom:12, overflowX:"auto", paddingBottom:2 }}>
            {tabs.map(tb=>(
              <button key={tb.id} onClick={()=>setTab(tb.id)} style={{ padding:mob?"7px 12px":"8px 16px", borderRadius:100, background:tab===tb.id?T.nps:"rgba(255,255,255,0.4)", border:tab===tb.id?`1px solid ${T.nps}`:`1px solid ${T.border}`, color:tab===tb.id?"#ffffff":T.textDim, cursor:"pointer", fontFamily:"inherit", fontSize:mob?11:12, fontWeight:600, whiteSpace:"nowrap", backdropFilter:"blur(5px)" }}>
                {tb.icon} {tb.label}
              </button>
            ))}
          </div>

          {/* ── COMPARE ──────────────────────────────────────── */}
          {tab==="compare"&&(
            <div>
              <div style={{ display:"grid", gridTemplateColumns:mob?"1fr":"1fr 1fr", gap:10, marginBottom:10 }}>
                {[{title:"🍩 NPS Corpus Sources",data:[{name:"Your 10%",value:R.empC},{name:`Govt ${govPct}%`,value:R.govC},{name:"Returns",value:R.totR}],colors:[T.nps,T.acc,T.aps]},
                  {title:"💰 Retirement Split",data:[{name:"Lump 60%",value:R.lump},{name:"Annuity 40%",value:R.annCorp}],colors:[T.nps,T.acc]}
                ].map((ch,i)=>(
                  <div key={i} style={{ ...glass, padding:pad }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:12 }}>{ch.title}</div>
                    <ResponsiveContainer width="100%" height={190}>
                      <PieChart><Pie data={ch.data} cx="50%" cy="50%" innerRadius={46} outerRadius={72} paddingAngle={4} dataKey="value" animationDuration={900}>
                        {ch.colors.map((c,j)=><Cell key={j} fill={c}/>)}
                      </Pie><Tooltip formatter={v=>fmtF(v)} contentStyle={{background:"rgba(255,255,255,0.9)",border:`1px solid ${T.border}`,borderRadius:9,fontSize:10,color:T.text,backdropFilter:"blur(10px)"}}/><Legend wrapperStyle={{fontSize:10,color:T.textDim,paddingTop:8}}/></PieChart>
                    </ResponsiveContainer>
                  </div>
                ))}
              </div>

              <div style={{ ...glass, padding:pad, marginBottom:10 }}>
                <Sec icon="🕐" sub={t.revTimelineSub}>{t.revTimeline}</Sec>
                <div style={{ display:"flex", gap:9, overflowX:"auto", paddingBottom:4, WebkitOverflowScrolling:"touch" }}>
                  {R.data.filter(d=>d.isRev).map(d=>(
                    <div key={d.year} style={{ minWidth:150, padding:"11px 13px", borderRadius:11, flexShrink:0, background:"rgba(255,255,255,0.5)", border:`1px solid ${T.border}` }}>
                      <div style={{ fontWeight:700, color:d.revLabel?.includes("*")?T.acc:T.aps, fontSize:11 }}>{d.revLabel}</div>
                      <div style={{ color:T.textDim, marginTop:4, fontSize:10 }}>Basic: {fmtF(d.basic)}</div>
                      <div style={{ color:T.textDim, fontSize:10 }}>DA: {d.daPct}%</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ ...glass, padding:pad }}>
                <Sec icon="📝">{t.keyFacts}</Sec>
                <div style={{ display:"grid", gap:9 }}>
                  <Note type="ok"><strong>APS:</strong> 50% of last Basic for 30+ yrs. Less service: (Yrs÷60)×Basic.</Note>
                  <Note type="info"><strong>NPS:</strong> Emp 10% + Govt {govPct}% of (Basic+DA) monthly. Grows with DA, increments & revisions.</Note>
                  <Note type="warn"><strong>APS</strong> grows with DR ({postDR}%/yr) after retirement. NPS annuity is <em>fixed</em> — gap widens yearly.</Note>
                  <Note type="info"><strong>12th Pay Rev (Jun 2026):</strong> Basic×1.38, DA resets to 4%. Next revisions every 5 years.</Note>
                </div>
              </div>
            </div>
          )}

          {/* ── GROWTH ───────────────────────────────────────── */}
          {tab==="growth"&&(
            <div>
              <div style={{ ...glass, padding:pad, marginBottom:10 }}>
                <Sec icon="📈" sub={pvOn?`Today's ₹ at ${inf}% inflation`:"With increments, DA & revisions"}>Salary Growth</Sec>
                <ResponsiveContainer width="100%" height={chartH}>
                  <ComposedChart data={R.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderLight}/>
                    <XAxis dataKey="year" stroke={T.textMuted} fontSize={9} tickFormatter={v=>mob?`'${String(v).slice(2)}`:v}/>
                    <YAxis stroke={T.textMuted} fontSize={9} tickFormatter={fmt} width={52}/>
                    <Tooltip content={<TT/>}/><Legend wrapperStyle={{fontSize:10,color:T.textDim,paddingTop:8}}/>
                    <Area type="monotone" dataKey={pvOn?"annSalPV":"annSal"} name="Annual Salary" fill="rgba(17,24,39,0.05)" stroke={T.aps} strokeWidth={2}/>
                    <Line type="monotone" dataKey="basic" name="Basic" stroke={T.acc} strokeWidth={1.5} dot={false}/>
                    {R.data.filter(d=>d.isRev).map(d=><ReferenceLine key={d.year} x={d.year} stroke="rgba(239,68,68,0.25)" strokeDasharray="3 3"/>)}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div style={{ ...glass, padding:pad }}>
                <Sec icon="🏦" sub={`Return: ${npsRet}%`}>NPS Corpus Growth</Sec>
                <ResponsiveContainer width="100%" height={chartH}>
                  <AreaChart data={R.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderLight}/>
                    <XAxis dataKey="year" stroke={T.textMuted} fontSize={9} tickFormatter={v=>mob?`'${String(v).slice(2)}`:v}/>
                    <YAxis stroke={T.textMuted} fontSize={9} tickFormatter={fmt} width={52}/>
                    <Tooltip content={<TT/>}/><Legend wrapperStyle={{fontSize:10,color:T.textDim,paddingTop:8}}/>
                    <Area type="monotone" dataKey={pvOn?"corpusPV":"corpus"} name="NPS Corpus" fill={T.npsGlow} stroke={T.nps} strokeWidth={2}/>
                    <Area type="monotone" dataKey="totC" name="Contributions" fill={T.accGlow} stroke={T.acc} strokeWidth={1.5}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── POST-RETIRE ──────────────────────────────────── */}
          {tab==="pension"&&(
            <div>
              <div style={{ ...glass, padding:pad, marginBottom:10 }}>
                <Sec icon="📊" sub={`APS: +${postDR}%/yr · NPS: Fixed`}>Monthly Pension</Sec>
                <ResponsiveContainer width="100%" height={chartH}>
                  <LineChart data={R.post}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderLight}/>
                    <XAxis dataKey="label" stroke={T.textMuted} fontSize={9}/>
                    <YAxis stroke={T.textMuted} fontSize={9} tickFormatter={fmt} width={52}/>
                    <Tooltip content={<TT/>}/><Legend wrapperStyle={{fontSize:10,color:T.textDim,paddingTop:8}}/>
                    <Line type="monotone" dataKey={pvOn?"apsPV":"apsP"} name="APS" stroke={T.aps} strokeWidth={2.5} dot={false}/>
                    <Line type="monotone" dataKey={pvOn?"npsPV":"npsP"} name="NPS" stroke={T.nps} strokeWidth={2.5} dot={false} strokeDasharray="6 3"/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ ...glass, padding:pad, marginBottom:10 }}>
                <Sec icon="💰">Cumulative Pension</Sec>
                <ResponsiveContainer width="100%" height={chartH}>
                  <AreaChart data={R.post}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderLight}/>
                    <XAxis dataKey="label" stroke={T.textMuted} fontSize={9}/>
                    <YAxis stroke={T.textMuted} fontSize={9} tickFormatter={fmt} width={52}/>
                    <Tooltip content={<TT/>}/><Legend wrapperStyle={{fontSize:10,color:T.textDim,paddingTop:8}}/>
                    <Area type="monotone" dataKey={pvOn?"cAP":"cA"} name="APS Total" fill={T.apsGlow} stroke={T.aps} strokeWidth={2}/>
                    <Area type="monotone" dataKey={pvOn?"cNP":"cN"} name="NPS Total" fill={T.npsGlow} stroke={T.nps} strokeWidth={2}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={{ ...glass, padding:pad }}>
                <Sec icon="📐">APS Advantage</Sec>
                <ResponsiveContainer width="100%" height={mob?190:250}>
                  <BarChart data={R.post}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderLight}/>
                    <XAxis dataKey="label" stroke={T.textMuted} fontSize={9}/>
                    <YAxis stroke={T.textMuted} fontSize={9} tickFormatter={fmt} width={52}/>
                    <Tooltip content={<TT/>}/>
                    <Bar dataKey={pvOn?"advPV":"adv"} name="APS Advantage" radius={[5,5,0,0]}>
                      {R.post.map((e,i)=><Cell key={i} fill={(pvOn?e.advPV:e.adv)>=0?T.aps:T.nps} fillOpacity={0.4+(i/25)*0.5}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                {R.brk&&R.apsP>R.npsP&&<div style={{marginTop:10}}><Note type="ok"><strong>Insight:</strong> APS recovers {fmt(R.lump)} NPS lump sum in ~<strong>{R.brk} years</strong>.</Note></div>}
              </div>
            </div>
          )}

          {/* ── TABLE ────────────────────────────────────────── */}
          {tab==="table"&&(
            <div style={{ ...glass, padding:pad }}>
              <Sec icon="📋">Year-wise Breakdown</Sec>
              <div style={{ overflowX:"auto", borderRadius:9, WebkitOverflowScrolling:"touch" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:10, minWidth:640 }}>
                  <thead>
                    <tr>{["Year","Svc","Basic","DA%","Gross","Emp","Govt","Monthly","Corpus",...(pvOn?["PV"]:[])].map(h=>(
                      <th key={h} style={{padding:"9px 6px",textAlign:"right",color:T.textMuted,fontWeight:700,fontSize:8,textTransform:"uppercase",letterSpacing:0.5,whiteSpace:"nowrap",borderBottom:`1px solid ${T.border}`}}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {R.data.map((r,i)=>(
                      <tr key={i} style={{borderBottom:`1px solid ${T.borderLight}`,background:r.isRev?"rgba(255,255,255,0.4)":"transparent"}}>
                        <td style={{padding:"8px 6px",textAlign:"right",fontWeight:r.isRev?700:500,color:r.isRev?T.acc:T.text,fontSize:11}}>{r.year}</td>
                        <td style={{padding:"8px 6px",textAlign:"right",color:T.textMuted}}>{r.svc}</td>
                        <td style={{padding:"8px 6px",textAlign:"right",fontWeight:600,color:T.text}}>{fmtF(r.basic)}</td>
                        <td style={{padding:"8px 6px",textAlign:"right",color:T.nps,fontWeight:600}}>{r.daPct}%</td>
                        <td style={{padding:"8px 6px",textAlign:"right",color:T.aps,fontWeight:700}}>{fmtF(r.gross)}</td>
                        <td style={{padding:"8px 6px",textAlign:"right",color:T.textDim}}>{fmtF(r.nE)}</td>
                        <td style={{padding:"8px 6px",textAlign:"right",color:T.textDim}}>{fmtF(r.nG)}</td>
                        <td style={{padding:"8px 6px",textAlign:"right",color:T.acc,fontWeight:600}}>{fmtF(r.mC)}</td>
                        <td style={{padding:"8px 6px",textAlign:"right",color:T.nps,fontWeight:700}}>{fmt(r.corpus)}</td>
                        {pvOn&&<td style={{padding:"8px 6px",textAlign:"right",color:T.textMuted}}>{fmt(r.corpusPV)}</td>}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{borderTop:`2px solid ${T.border}`}}>
                      <td colSpan={5} style={{padding:"10px 6px",textAlign:"right",fontWeight:700,color:T.text}}>Totals →</td>
                      <td style={{padding:"10px 6px",textAlign:"right",fontWeight:700,color:T.acc}}>{fmt(R.empC)}</td>
                      <td style={{padding:"10px 6px",textAlign:"right",fontWeight:700,color:T.acc}}>{fmt(R.govC)}</td>
                      <td style={{padding:"10px 6px",textAlign:"right",fontWeight:800,color:T.acc}}>{fmt(R.totC)}</td>
                      <td style={{padding:"10px 6px",textAlign:"right",fontWeight:800,color:T.nps}}>{fmt(R.fC)}</td>
                      {pvOn&&<td style={{padding:"10px 6px",textAlign:"right",fontWeight:700,color:T.textMuted}}>{fmt(Math.round(R.fC*R.rIA))}</td>}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>)}

        {/* ── DISCLAIMER ───────────────────────────────────────── */}
        <div style={{ marginTop:12, padding:"12px 16px", borderRadius:13, fontSize:11, color:T.textMuted, lineHeight:1.7, background:"rgba(255,255,255,0.4)", border:`1px solid ${T.border}`, backdropFilter:"blur(5px)" }}>
          <strong style={{color:T.textDim}}>⚠️ {lang==="ml"?"നിരാകരണം":"Disclaimer"}:</strong> {t.disclaimer}
        </div>
      </div>
    </div>
  );
}
