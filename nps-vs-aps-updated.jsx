import { useState, useMemo, useEffect, useRef } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
  ComposedChart, ReferenceLine
} from "recharts";

// ═══ Kerala Pay Revision Logic ══════════════════════════════════════════════
// type: "basic_only" → new_basic = basic * fitment
// type: "merge"      → new_basic = (basic + DA) * fitment  (6–8% fitment on merged pay)
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

const fmt = v => { if (v >= 1e7) return `₹${(v/1e7).toFixed(2)} Cr`; if (v >= 1e5) return `₹${(v/1e5).toFixed(2)} L`; if (v >= 1e3) return `₹${(v/1e3).toFixed(1)}K`; return `₹${Math.round(v)}`; };
const fmtF = v => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(v);
const pv = (fv, r, y) => y <= 0 ? fv : fv / Math.pow(1 + r/100, y);

function simulate(p) {
  const birthYear = parseInt(p.dob.split("-")[0]);
  const birthMonth = parseInt(p.dob.split("-")[1]);
  const retYear = birthYear + p.retAge;
  const retMonth = birthMonth;
  const serviceYears = retYear - p.joinYear;
  if (serviceYears <= 0 || p.basic <= 0) return null;

  const CUR = 2026;
  const data = [];
  let basic = p.basic;
  let daPct = p.currentDA;
  let corpus = 0, empC = 0, govC = 0;
  const daPerHalf = Math.round(p.annualDA / 2);

  for (let yr = p.joinYear; yr < retYear; yr++) {
    const svc = yr - p.joinYear + 1;
    const rev = REVISIONS.find(r => r.year === yr);
    if (rev && yr >= 2026) {
      if (rev.type === "merge") {
        // Merge basic + accumulated DA, then apply fitment (6-8%)
        const preMergeDA = Math.round(basic * daPct / 100);
        basic = Math.ceil(((basic + preMergeDA) * rev.fitment) / 100) * 100;
      } else {
        // 2026: only basic × 1.38, DA resets to balance
        basic = Math.ceil((basic * rev.fitment) / 100) * 100;
      }
      daPct = rev.balanceDA;
    }

    const da = Math.round(basic * daPct / 100);
    const gross = basic + da;
    const nE = Math.round(gross * 10 / 100);
    const nG = Math.round(gross * p.govPct / 100);
    const mC = nE + nG;
    const aC = mC * 12;
    empC += nE * 12;
    govC += nG * 12;
    corpus = corpus * (1 + p.npsRet / 100) + aC * (1 + p.npsRet / 200);

    const yFN = yr - CUR;
    const iA = pv(1, p.inf, Math.max(0, yFN));

    data.push({
      year: yr, svc, basic, daPct, da, gross,
      annSal: gross * 12, annSalPV: Math.round(gross * 12 * iA),
      nE, nG, mC, aC,
      corpus: Math.round(corpus), corpusPV: Math.round(corpus * iA),
      totC: empC + govC,
      isRev: !!rev && yr >= 2026, revLabel: rev && yr >= 2026 ? rev.label : null,
    });

    basic = Math.round(basic * (1 + p.incRate / 100));
    daPct += daPerHalf;
    daPct += (p.annualDA - daPerHalf);
    daPct = Math.round(daPct);
  }

  const last = data[data.length - 1];
  if (!last) return null;

  const rYFN = retYear - CUR;
  const rIA = pv(1, p.inf, Math.max(0, rYFN));
  const qs = Math.min(serviceYears, 33);
  const apsFac = qs >= 30 ? 0.50 : qs / 60;
  const apsP = Math.round(last.basic * apsFac);
  const fC = Math.round(corpus);
  const lump = Math.round(fC * 0.60);
  const annCorp = Math.round(fC * 0.40);
  const npsP = Math.round(annCorp * (p.annRate / 100) / 12);
  const totC = empC + govC;
  const totR = Math.max(0, fC - totC);

  const post = [];
  let cA = 0, cN = 0, cAP = 0, cNP = 0, curA = apsP, curN = npsP;
  for (let y = 0; y <= 25; y++) {
    if (y > 0) curA = Math.round(curA * (1 + p.postDR / 100));
    const pIA = pv(1, p.inf, Math.max(0, rYFN + y));
    cA += curA * 12; cN += curN * 12;
    cAP += Math.round(curA * 12 * pIA); cNP += Math.round(curN * 12 * pIA);
    post.push({
      year: y, label: y === 0 ? "Retire" : `+${y}yr`,
      apsP: curA, npsP: curN,
      apsPV: Math.round(curA * pIA), npsPV: Math.round(curN * pIA),
      cA, cN, cAP, cNP,
      adv: cA - cN, advPV: cAP - cNP,
    });
  }

  let brk = null;
  if (apsP > npsP) { const d = apsP - npsP; if (d > 0) brk = Math.ceil(lump / (d * 12)); }

  return {
    data, lB: last.basic, lD: last.da, lG: last.gross, lDP: last.daPct,
    serviceYears, qs, retYear, retMonth, apsP, apsPV: Math.round(apsP * rIA), apsFac,
    fC, lump, lumpPV: Math.round(lump * rIA), annCorp,
    npsP, npsPV: Math.round(npsP * rIA),
    empC, govC, totC, totR, post, brk, rIA,
  };
}

// ═══ Animated Number ════════════════════════════════════════════════════════
function Anim({ value, format = fmtF }) {
  const [d, setD] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const s = d, diff = value - s, st = performance.now();
    const run = now => {
      const p = Math.min((now - st) / 700, 1);
      setD(Math.round(s + diff * (1 - Math.pow(1 - p, 3))));
      if (p < 1) ref.current = requestAnimationFrame(run);
    };
    ref.current = requestAnimationFrame(run);
    return () => cancelAnimationFrame(ref.current);
  }, [value]);
  return <span>{format(d)}</span>;
}

// ═══ Dark Liquid Glass Theme ═══════════════════════════════════════════════
const T = {
  bg: "#0d1017",
  surface: "rgba(255,255,255,0.04)",
  surfaceHover: "rgba(255,255,255,0.07)",
  border: "rgba(255,255,255,0.08)",
  borderLight: "rgba(255,255,255,0.12)",
  text: "#e8eaed",
  textDim: "rgba(255,255,255,0.50)",
  textMuted: "rgba(255,255,255,0.30)",
  aps: "#34d399",
  nps: "#fb923c",
  acc: "#60a5fa",
  dan: "#f87171",
  apsGlow: "rgba(52,211,153,0.12)",
  npsGlow: "rgba(251,146,60,0.12)",
  accGlow: "rgba(96,165,250,0.10)",
};

const glass = {
  background: T.surface,
  backdropFilter: "blur(40px) saturate(140%)",
  WebkitBackdropFilter: "blur(40px) saturate(140%)",
  border: `1px solid ${T.border}`,
  borderRadius: 22,
  boxShadow: "0 4px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
};

const glassSm = {
  ...glass,
  borderRadius: 16,
  background: "rgba(255,255,255,0.06)",
  border: `1px solid ${T.borderLight}`,
  boxShadow: "0 2px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)",
};

const glassCard = {
  ...glass,
  borderRadius: 18,
  background: "rgba(255,255,255,0.05)",
  padding: "22px 24px",
  boxShadow: "0 2px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)",
};

// ═══ Select dropdown style ═══════════════════════════════════════════════════
const selectStyle = {
  width: "100%", padding: "12px 16px",
  borderRadius: 12,
  background: "rgba(255,255,255,0.06)",
  border: `1px solid rgba(255,255,255,0.12)`,
  color: "#e8eaed", fontSize: 15, fontWeight: 500, outline: "none",
  fontFamily: "inherit", boxSizing: "border-box",
  cursor: "pointer",
  appearance: "none", WebkitAppearance: "none",
};

function GlassStat({ label, value, sub, color, icon, delay = 0 }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      ...glassCard, position: "relative", overflow: "hidden",
      transform: v ? "translateY(0) scale(1)" : "translateY(16px) scale(0.97)",
      opacity: v ? 1 : 0,
      transition: "all 0.6s cubic-bezier(0.22,1,0.36,1)",
    }}>
      <div style={{ position: "absolute", top: -6, right: 0, fontSize: 48, opacity: 0.06, lineHeight: 1 }}>{icon}</div>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.8, color: T.textMuted, marginBottom: 8, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: color || T.text, letterSpacing: -0.5, fontFeatureSettings: "'tnum'" }}>
        {typeof value === "number" ? <Anim value={value} /> : value}
      </div>
      {sub && <div style={{ fontSize: 12, color: T.textMuted, marginTop: 8, lineHeight: 1.5 }}>{sub}</div>}
    </div>
  );
}

// ═══ Number Input — shows empty instead of 0 ════════════════════════════════
function GlassInput({ label, value, onChange, min, max, step, suffix, helpText, wide }) {
  const [str, setStr] = useState(value === 0 ? "" : String(value));

  // Sync local string only on external reset (when value goes back to 0 externally)
  const prevRef = useRef(value);
  useEffect(() => {
    if (value !== prevRef.current) {
      prevRef.current = value;
      setStr(value === 0 ? "" : String(value));
    }
  }, [value]);

  return (
    <div style={{ marginBottom: 0, gridColumn: wide ? "1 / -1" : undefined }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.textDim, marginBottom: 6, letterSpacing: 0.2 }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type="number" value={str} min={min} max={max} step={step}
          placeholder="0"
          onChange={e => {
            setStr(e.target.value);
            const n = e.target.value === "" ? 0 : Number(e.target.value);
            if (!isNaN(n)) onChange(n);
          }}
          style={{
            width: "100%", padding: "12px 16px",
            paddingRight: suffix ? 44 : 16,
            borderRadius: 12,
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${T.border}`,
            color: T.text, fontSize: 15, fontWeight: 500, outline: "none",
            fontFamily: "inherit", boxSizing: "border-box",
            backdropFilter: "blur(20px)",
            transition: "all 0.25s ease",
          }}
          onFocus={e => { e.target.style.borderColor = "rgba(96,165,250,0.4)"; e.target.style.boxShadow = "0 0 0 4px rgba(96,165,250,0.08)"; }}
          onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none"; }}
        />
        {suffix && <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: T.textMuted, fontWeight: 600 }}>{suffix}</span>}
      </div>
      {helpText && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 5 }}>{helpText}</div>}
    </div>
  );
}

// ═══ DOB Selector (Day / Month / Year selects) ════════════════════════════
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function DOBSelector({ value, onChange }) {
  const parts = value ? value.split("-") : ["1990","06","15"];
  const [yr, setYr] = useState(parts[0]);
  const [mo, setMo] = useState(parts[1]);
  const [dy, setDy] = useState(parts[2]);

  const daysInMonth = new Date(Number(yr), Number(mo), 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const months = MONTHS.map((m, i) => ({ val: String(i + 1).padStart(2, "0"), label: m }));
  const years = Array.from({ length: 45 }, (_, i) => 1960 + i); // 1960–2004

  const emit = (y, m, d) => {
    const safeDay = Math.min(Number(d), new Date(Number(y), Number(m), 0).getDate());
    onChange(`${y}-${m}-${String(safeDay).padStart(2, "0")}`);
  };

  const sel = (setter, field) => e => {
    const v = e.target.value;
    setter(v);
    if (field === "yr") emit(v, mo, dy);
    else if (field === "mo") emit(yr, v, dy);
    else emit(yr, mo, v);
  };

  return (
    <div style={{ marginBottom: 0 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.textDim, marginBottom: 6, letterSpacing: 0.2 }}>Date of Birth</label>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 3fr 2fr", gap: 6 }}>
        {/* Day */}
        <div style={{ position: "relative" }}>
          <select value={dy} onChange={sel(setDy, "dy")} style={selectStyle}>
            {days.map(d => <option key={d} value={String(d).padStart(2,"0")}>{d}</option>)}
          </select>
          <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:T.textMuted, fontSize:11 }}>▼</span>
        </div>
        {/* Month */}
        <div style={{ position: "relative" }}>
          <select value={mo} onChange={sel(setMo, "mo")} style={selectStyle}>
            {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
          </select>
          <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:T.textMuted, fontSize:11 }}>▼</span>
        </div>
        {/* Year */}
        <div style={{ position: "relative" }}>
          <select value={yr} onChange={sel(setYr, "yr")} style={selectStyle}>
            {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
          </select>
          <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:T.textMuted, fontSize:11 }}>▼</span>
        </div>
      </div>
      <div style={{ fontSize: 11, color: T.textMuted, marginTop: 5 }}>Day / Month / Year</div>
    </div>
  );
}

// ═══ Joining Year Selector ════════════════════════════════════════════════
function JoinYearSelector({ value, onChange }) {
  const years = Array.from({ length: 42 }, (_, i) => 2004 + i); // 2004–2045
  return (
    <div style={{ marginBottom: 0 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.textDim, marginBottom: 6, letterSpacing: 0.2 }}>Year of Joining Service</label>
      <div style={{ position: "relative" }}>
        <select value={value} onChange={e => onChange(Number(e.target.value))} style={selectStyle}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:T.textMuted, fontSize:11 }}>▼</span>
      </div>
      <div style={{ fontSize: 11, color: T.textMuted, marginTop: 5 }}>NPS applicable from 2004 onwards</div>
    </div>
  );
}

function Sec({ children, icon, sub }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, display: "flex", alignItems: "center", gap: 10, margin: 0, letterSpacing: -0.3 }}>
        <span style={{ fontSize: 24 }}>{icon}</span>{children}
      </h2>
      {sub && <p style={{ fontSize: 13, color: T.textMuted, margin: "5px 0 0 34px" }}>{sub}</p>}
    </div>
  );
}

function Pill({ children, color = T.acc }) {
  return <span style={{ display: "inline-block", padding: "5px 12px", borderRadius: 100, fontSize: 11, fontWeight: 600, color, background: `${color}15`, border: `1px solid ${color}25` }}>{children}</span>;
}

function Note({ children, type = "info" }) {
  const c = {
    info: { bg: "rgba(96,165,250,0.06)", tx: "#93c5fd", ic: "ℹ️", bd: "rgba(96,165,250,0.12)" },
    warn: { bg: "rgba(251,191,36,0.06)", tx: "#fcd34d", ic: "⚠️", bd: "rgba(251,191,36,0.12)" },
    ok: { bg: "rgba(52,211,153,0.06)", tx: "#6ee7b7", ic: "✅", bd: "rgba(52,211,153,0.12)" },
    bad: { bg: "rgba(248,113,113,0.06)", tx: "#fca5a5", ic: "🚫", bd: "rgba(248,113,113,0.12)" },
  }[type];
  return (
    <div style={{ padding: "14px 18px", borderRadius: 14, background: c.bg, border: `1px solid ${c.bd}`, fontSize: 13, color: c.tx, lineHeight: 1.6, display: "flex", gap: 10, backdropFilter: "blur(10px)" }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{c.ic}</span><div>{children}</div>
    </div>
  );
}

// ═══ Main App ═══════════════════════════════════════════════════════════════
export default function App() {
  const [dob, setDob] = useState("1990-06-15");
  const [joinYear, setJoinYear] = useState(2021);
  const [retAge, setRetAge] = useState(60);
  // All pay/rate inputs default to 0 — user must enter their own values
  const [basic, setBasic] = useState(0);
  const [currentDA, setCurrentDA] = useState(0);
  const [annualDA, setAnnualDA] = useState(0);
  const [incRate, setIncRate] = useState(0);
  const [npsRet, setNpsRet] = useState(0);
  const [annRate, setAnnRate] = useState(0);
  const [govPct, setGovPct] = useState(0);
  const [postDR, setPostDR] = useState(0);
  const [inf, setInf] = useState(0);
  const [tab, setTab] = useState("compare");
  const [pvOn, setPvOn] = useState(false);

  const R = useMemo(() => simulate({
    dob, joinYear, retAge, basic, currentDA, annualDA, incRate,
    npsRet, annRate, govPct, postDR, inf,
  }), [dob, joinYear, retAge, basic, currentDA, annualDA, incRate, npsRet, annRate, govPct, postDR, inf]);

  const tabs = [
    { id: "compare", label: "Compare", icon: "⚖️" },
    { id: "growth", label: "Growth", icon: "📈" },
    { id: "pension", label: "Post-Retire", icon: "🏖️" },
    { id: "table", label: "Details", icon: "📋" },
  ];

  const TT = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ ...glassSm, padding: "14px 18px", fontSize: 12, background: "rgba(13,16,23,0.92)", border: `1px solid ${T.borderLight}` }}>
        <div style={{ fontWeight: 700, marginBottom: 8, color: T.text, fontSize: 13 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: 10, background: p.color }} />
            <span style={{ color: T.textDim }}>{p.name}:</span>
            <span style={{ color: T.text, fontWeight: 700, fontFeatureSettings: "'tnum'" }}>{fmt(p.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg,
      color: T.text,
      fontFamily: "'DM Sans', -apple-system, 'SF Pro Display', sans-serif",
    }}>
      {/* Ambient glow orbs */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-15%", right: "-8%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(96,165,250,0.06) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", top: "35%", left: "-12%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(52,211,153,0.04) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "15%", width: 550, height: 550, borderRadius: "50%", background: "radial-gradient(circle, rgba(251,146,60,0.04) 0%, transparent 70%)", filter: "blur(80px)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ padding: "24px 24px 20px", maxWidth: 1140, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: "linear-gradient(135deg, rgba(96,165,250,0.15), rgba(52,211,153,0.10))",
              border: `1px solid ${T.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26, backdropFilter: "blur(20px)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}>🏛️</div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: -0.8, color: T.text }}>
                NPS vs APS Calculator
              </h1>
              <p style={{ fontSize: 14, color: T.textDim, margin: "2px 0 0", fontWeight: 500 }}>
                Kerala Contributory Pension Scheme
              </p>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 18px 40px" }}>

          {/* ═══ CONFIGURATION FIRST ═══ */}
          <div style={{ ...glass, padding: 28, marginBottom: 20 }}>
            <Sec icon="⚙️" sub="Enter your service details to generate personalised projections">Configure Your Profile</Sec>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 18 }}>
              <DOBSelector value={dob} onChange={setDob} />
              <JoinYearSelector value={joinYear} onChange={setJoinYear} />
              <GlassInput label="Retirement Age" value={retAge} onChange={setRetAge} min={56} max={62} helpText="CPS: 60 years" />
              <GlassInput label="Current Basic Pay (₹)" value={basic} onChange={setBasic} min={0} max={500000} suffix="₹" helpText="Your current basic pay" />
              <GlassInput label="Current DA %" value={currentDA} onChange={setCurrentDA} min={0} max={100} suffix="%" helpText="Present DA rate (now ~35%)" />
              <GlassInput label="Annual DA Increase" value={annualDA} onChange={setAnnualDA} min={0} max={12} suffix="%/yr" helpText="~6%/yr (3% per 6 months)" />
              <GlassInput label="Annual Increment" value={incRate} onChange={setIncRate} min={0} max={10} step={0.5} suffix="%/yr" helpText="Yearly increment on basic" />
              <GlassInput label="Govt NPS Contribution" value={govPct} onChange={setGovPct} min={0} max={14} suffix="%" helpText="Default 10%, max 14%" />
            </div>

            <div style={{ paddingTop: 14, borderTop: `1px solid ${T.border}`, marginTop: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.acc, marginBottom: 12 }}>Advanced / Return Settings</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(195px, 1fr))", gap: 18 }}>
                <GlassInput label="NPS Return Rate" value={npsRet} onChange={setNpsRet} min={0} max={18} step={0.5} suffix="%" helpText="Historical: 9–12%" />
                <GlassInput label="Annuity Rate" value={annRate} onChange={setAnnRate} min={0} max={10} step={0.5} suffix="%" />
                <GlassInput label="Post-Retirement DR" value={postDR} onChange={setPostDR} min={0} max={10} step={0.5} suffix="%" helpText="APS indexed yearly" />
                <GlassInput label="Inflation Rate" value={inf} onChange={setInf} min={0} max={15} step={0.5} suffix="%" helpText="For today's value calc" />
              </div>
            </div>
          </div>

          {/* ═══ RESULTS — shown only when inputs are valid ═══ */}
          {!R && (
            <div style={{
              ...glass, padding: 40, marginBottom: 20, textAlign: "center",
              background: "rgba(96,165,250,0.04)", border: `1px solid rgba(96,165,250,0.12)`
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👆</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 8 }}>
                Fill in your details above
              </div>
              <div style={{ fontSize: 14, color: T.textDim }}>
                Enter your Basic Pay, DA%, joining year and retirement age to see your pension comparison
              </div>
            </div>
          )}

          {/* ═══ RESULTS — Pension Face-Off ═══ */}
          {R && <div style={{ ...glass, padding: 28, marginBottom: 20 }}>
            <Sec icon="⚖️">Monthly Pension Face-Off</Sec>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 48px 1fr", alignItems: "center", gap: 16 }}>
              {/* APS */}
              <div style={{
                textAlign: "center", padding: "28px 20px", borderRadius: 20,
                background: `linear-gradient(145deg, ${T.apsGlow}, rgba(52,211,153,0.02))`,
                border: `1px solid rgba(52,211,153,0.15)`,
                backdropFilter: "blur(20px)",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.aps, textTransform: "uppercase", letterSpacing: 2.5, marginBottom: 14 }}>APS (Assured)</div>
                <div style={{ fontSize: 40, fontWeight: 700, color: T.aps, letterSpacing: -1, fontFeatureSettings: "'tnum'" }}>
                  <Anim value={pvOn ? R.apsPV : R.apsP} />
                </div>
                <div style={{ fontSize: 12, color: T.textDim, marginTop: 10 }}>
                  {(R.apsFac * 100).toFixed(0)}% of Last Basic ({fmtF(R.lB)})
                </div>
                <div style={{ marginTop: 16, display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                  <Pill color={T.aps}>✓ Guaranteed</Pill>
                  <Pill color={T.aps}>✓ DR Indexed</Pill>
                </div>
              </div>

              <div style={{ fontSize: 20, textAlign: "center", color: T.textMuted, fontWeight: 800 }}>VS</div>

              {/* NPS */}
              <div style={{
                textAlign: "center", padding: "28px 20px", borderRadius: 20,
                background: `linear-gradient(145deg, ${T.npsGlow}, rgba(251,146,60,0.02))`,
                border: `1px solid rgba(251,146,60,0.15)`,
                backdropFilter: "blur(20px)",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.nps, textTransform: "uppercase", letterSpacing: 2.5, marginBottom: 14 }}>NPS (National)</div>
                <div style={{ fontSize: 40, fontWeight: 700, color: T.nps, letterSpacing: -1, fontFeatureSettings: "'tnum'" }}>
                  <Anim value={pvOn ? R.npsPV : R.npsP} />
                </div>
                <div style={{ fontSize: 12, color: T.textDim, marginTop: 10 }}>
                  40% Annuity @ {annRate}% | Lump: {fmt(pvOn ? R.lumpPV : R.lump)}
                </div>
                <div style={{ marginTop: 16, display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                  <Pill color={T.nps}>60% Lump Sum</Pill>
                  <Pill color={T.dan}>⚠ No DR</Pill>
                </div>
              </div>
            </div>

            {/* Result bar */}
            <div style={{
              marginTop: 22, padding: "18px 24px", borderRadius: 16,
              background: R.apsP > R.npsP
                ? `linear-gradient(135deg, ${T.apsGlow}, rgba(52,211,153,0.03))`
                : `linear-gradient(135deg, ${T.npsGlow}, rgba(251,146,60,0.03))`,
              border: `1px solid ${R.apsP > R.npsP ? "rgba(52,211,153,0.15)" : "rgba(251,146,60,0.15)"}`,
              textAlign: "center",
            }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: R.apsP > R.npsP ? T.aps : T.nps }}>
                {R.apsP > R.npsP ? "🛡️ APS" : "📊 NPS"} pays {fmtF(Math.abs(R.apsP - R.npsP))}/month more
              </div>
              {R.brk && R.apsP > R.npsP && (
                <div style={{ fontSize: 13, color: T.textDim, marginTop: 8 }}>
                  APS recovers NPS lump sum ({fmt(R.lump)}) in ~<strong style={{ color: T.text }}>{R.brk} years</strong> through higher pension + DR
                </div>
              )}
            </div>

            {/* Today's Value Toggle — prominent */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 20, gap: 8 }}>
              <button onClick={() => setPvOn(!pvOn)} style={{
                padding: "14px 32px", borderRadius: 100,
                border: `2px solid ${pvOn ? "rgba(96,165,250,0.5)" : "rgba(255,255,255,0.15)"}`,
                background: pvOn
                  ? "linear-gradient(135deg, rgba(96,165,250,0.18), rgba(96,165,250,0.08))"
                  : "rgba(255,255,255,0.05)",
                cursor: "pointer", fontFamily: "inherit",
                fontSize: 16,         // bigger font
                fontWeight: 700,
                color: pvOn ? T.acc : T.textDim,
                transition: "all 0.25s",
                backdropFilter: "blur(10px)",
                boxShadow: pvOn ? "0 0 24px rgba(96,165,250,0.15)" : "none",
                letterSpacing: 0.2,
              }}>
                {pvOn
                  ? `📉 Showing Today's Value (${inf}% inflation) — ON`
                  : "📉 Show Amounts in Today's Value"}
              </button>
              <p style={{ fontSize: 13, color: T.textMuted, margin: 0, textAlign: "center", maxWidth: 380 }}>
                💡 Tap above to convert all future amounts to present-day purchasing power
              </p>
            </div>
          </div>}

          {R && (<>
          {/* Quick Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 14, marginBottom: 20 }}>
            <GlassStat label="NPS Total Corpus" icon="🏦" delay={0} value={pvOn ? Math.round(R.fC * R.rIA) : R.fC} sub={`Contrib: ${fmt(R.totC)} · Returns: ${fmt(R.totR)}`} color={T.acc} />
            <GlassStat label="NPS Lump Sum (60%)" icon="💵" delay={80} value={pvOn ? R.lumpPV : R.lump} sub={pvOn ? "In today's purchasing power" : "Tax-free at retirement"} color={T.nps} />
            <GlassStat label="Last Basic Pay" icon="💰" delay={160} value={R.lB} sub={`Gross: ${fmtF(R.lG)} · DA: ${R.lDP}%`} />
            <GlassStat label="Service" icon="📅" delay={240} value={`${R.serviceYears} yrs`} sub={`${joinYear} → ${R.retYear} · Retire @ ${retAge}`} />
          </div>

          {/* DCRG Warning */}
          <div style={{ marginBottom: 20 }}>
            <Note type="bad"><strong>No DCRG:</strong> Kerala state employees do NOT receive Death-cum-Retirement Gratuity under either APS or NPS.</Note>
          </div>

          {/* G.O. Notice */}
          <div style={{ marginBottom: 20 }}>
            <Note type="warn"><strong>⚠️ G.O.(P) No.33/2026/F.N dated 28.02.2026:</strong> The latest Government Order on the Assured Pension Scheme does <em>not</em> mention any lump sum payment. Until further clarification, employees should not assume a lump sum will be provided under APS.</Note>
          </div>

          {/* ═══ TABS ═══ */}
          <div style={{ display: "flex", gap: 6, marginBottom: 20, overflowX: "auto", paddingBottom: 2 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "10px 22px", borderRadius: 100,
                background: tab === t.id ? T.accGlow : "rgba(255,255,255,0.03)",
                border: tab === t.id ? `1px solid rgba(96,165,250,0.25)` : `1px solid ${T.border}`,
                color: tab === t.id ? T.acc : T.textDim,
                cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600,
                whiteSpace: "nowrap", transition: "all 0.25s",
                backdropFilter: "blur(20px)",
              }}>{t.icon} {t.label}</button>
            ))}
          </div>

          {/* ═══ COMPARE TAB ═══ */}
          {tab === "compare" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div style={{ ...glass, padding: 24 }}>
                  <Sec icon="🍩">NPS Corpus Sources</Sec>
                  <ResponsiveContainer width="100%" height={230}>
                    <PieChart><Pie data={[{ name: "Your 10%", value: R.empC }, { name: `Govt ${govPct}%`, value: R.govC }, { name: "Returns", value: R.totR }]} cx="50%" cy="50%" innerRadius={56} outerRadius={88} paddingAngle={4} dataKey="value" animationDuration={1000}>
                      <Cell fill={T.nps} /><Cell fill={T.acc} /><Cell fill={T.aps} />
                    </Pie><Tooltip formatter={v => fmtF(v)} contentStyle={{ background: "rgba(13,16,23,0.92)", border: `1px solid ${T.borderLight}`, borderRadius: 12, fontSize: 12, color: T.text }} /><Legend wrapperStyle={{ fontSize: 11, fontWeight: 600, color: T.textDim }} /></PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ ...glass, padding: 24 }}>
                  <Sec icon="💰">Retirement Split</Sec>
                  <ResponsiveContainer width="100%" height={230}>
                    <PieChart><Pie data={[{ name: "Lump Sum 60%", value: R.lump }, { name: "Annuity 40%", value: R.annCorp }]} cx="50%" cy="50%" innerRadius={56} outerRadius={88} paddingAngle={4} dataKey="value" animationDuration={1000}>
                      <Cell fill={T.nps} /><Cell fill={T.acc} />
                    </Pie><Tooltip formatter={v => fmtF(v)} contentStyle={{ background: "rgba(13,16,23,0.92)", border: `1px solid ${T.borderLight}`, borderRadius: 12, fontSize: 12, color: T.text }} /><Legend wrapperStyle={{ fontSize: 11, fontWeight: 600, color: T.textDim }} /></PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Revision Timeline */}
              <div style={{ ...glass, padding: 24, marginBottom: 20 }}>
                <Sec icon="🕐" sub="Pay revisions during your service">Revision Timeline</Sec>
                <div style={{ display: "flex", gap: 12, overflowX: "auto", padding: "4px 0" }}>
                  {R.data.filter(d => d.isRev).map(d => (
                    <div key={d.year} style={{
                      minWidth: 180, padding: "14px 18px", borderRadius: 14, flexShrink: 0,
                      background: d.revLabel?.includes("*") ? T.accGlow : T.apsGlow,
                      border: `1px solid ${d.revLabel?.includes("*") ? "rgba(96,165,250,0.15)" : "rgba(52,211,153,0.15)"}`,
                      backdropFilter: "blur(10px)",
                    }}>
                      <div style={{ fontWeight: 700, color: d.revLabel?.includes("*") ? T.acc : T.aps, fontSize: 13 }}>{d.revLabel}</div>
                      <div style={{ color: T.textDim, marginTop: 6, fontSize: 12 }}>Basic: {fmtF(d.basic)}</div>
                      <div style={{ color: T.textDim, fontSize: 12 }}>Gross: {fmtF(d.gross)} · DA: {d.daPct}%</div>
                      {d.revLabel?.includes("*") && <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>* Projected (Basic+DA merge + 6–7% fitment)</div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Facts */}
              <div style={{ ...glass, padding: 24 }}>
                <Sec icon="📝">Key Facts</Sec>
                <div style={{ display: "grid", gap: 12 }}>
                  <Note type="ok"><strong>APS:</strong> 50% of <em>last Basic Pay</em> for 30+ yrs service. Proportionate for less (Years ÷ 60 × Basic).</Note>
                  <Note type="info"><strong>NPS:</strong> Employee 10% + Govt {govPct}% of (Basic+DA) every month. Grows with DA, increments & revisions.</Note>
                  <Note type="warn"><strong>APS pension grows</strong> with Dearness Relief ({postDR}%/yr) after retirement. NPS annuity is <em>fixed</em> — the gap widens every year.</Note>
                  <Note type="info"><strong>12th Pay Rev (Jun 2026):</strong> Basic × 1.38. DA merges into basic, balance DA ~4%. Subsequent revisions every 5 years: Basic+DA × 1.06–1.07.</Note>
                  <Note type="bad"><strong>No DCRG:</strong> Kerala does NOT give gratuity under APS or NPS. Plan your retirement savings accordingly.</Note>
                </div>
              </div>
            </div>
          )}

          {/* ═══ GROWTH TAB ═══ */}
          {tab === "growth" && (
            <div>
              <div style={{ ...glass, padding: 28, marginBottom: 20 }}>
                <Sec icon="📈" sub={pvOn ? `Today's ₹ at ${inf}% inflation` : "With increments, DA & pay revisions"}>Salary Growth</Sec>
                <ResponsiveContainer width="100%" height={380}>
                  <ComposedChart data={R.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="year" stroke={T.textMuted} fontSize={11} fontWeight={600} />
                    <YAxis stroke={T.textMuted} fontSize={11} tickFormatter={fmt} />
                    <Tooltip content={<TT />} /><Legend wrapperStyle={{ fontSize: 12, fontWeight: 600, color: T.textDim }} />
                    <Area type="monotone" dataKey={pvOn ? "annSalPV" : "annSal"} name={pvOn ? "Annual (Today's ₹)" : "Annual Salary"} fill="rgba(52,211,153,0.08)" stroke={T.aps} strokeWidth={2.5} />
                    <Line type="monotone" dataKey="basic" name="Basic" stroke={T.acc} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="da" name="DA" stroke={T.nps} strokeWidth={1.5} dot={false} strokeDasharray="5 3" />
                    {R.data.filter(d => d.isRev).map(d => <ReferenceLine key={d.year} x={d.year} stroke="rgba(248,113,113,0.25)" strokeDasharray="3 3" label={{ value: "Rev", position: "top", style: { fontSize: 9, fill: T.dan, fontWeight: 700 } }} />)}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div style={{ ...glass, padding: 28 }}>
                <Sec icon="🏦" sub={`Return: ${npsRet}% · Emp 10% + Govt ${govPct}%`}>NPS Corpus</Sec>
                <ResponsiveContainer width="100%" height={340}>
                  <AreaChart data={R.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="year" stroke={T.textMuted} fontSize={11} fontWeight={600} />
                    <YAxis stroke={T.textMuted} fontSize={11} tickFormatter={fmt} />
                    <Tooltip content={<TT />} /><Legend wrapperStyle={{ fontSize: 12, fontWeight: 600, color: T.textDim }} />
                    <Area type="monotone" dataKey={pvOn ? "corpusPV" : "corpus"} name={pvOn ? "Corpus (Today's ₹)" : "NPS Corpus"} fill="rgba(251,146,60,0.08)" stroke={T.nps} strokeWidth={2.5} />
                    <Area type="monotone" dataKey="totC" name="Contributions" fill="rgba(96,165,250,0.05)" stroke={T.acc} strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ═══ POST-RETIRE TAB ═══ */}
          {tab === "pension" && (
            <div>
              <div style={{ ...glass, padding: 28, marginBottom: 20 }}>
                <Sec icon="📊" sub={`APS: +${postDR}% DR/yr · NPS: Fixed${pvOn ? ` · ${inf}% inflation adj` : ""}`}>Monthly Pension After Retirement</Sec>
                <ResponsiveContainer width="100%" height={340}>
                  <LineChart data={R.post}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="label" stroke={T.textMuted} fontSize={11} fontWeight={600} />
                    <YAxis stroke={T.textMuted} fontSize={11} tickFormatter={fmt} />
                    <Tooltip content={<TT />} /><Legend wrapperStyle={{ fontSize: 12, fontWeight: 600, color: T.textDim }} />
                    <Line type="monotone" dataKey={pvOn ? "apsPV" : "apsP"} name={pvOn ? "APS (Today's ₹)" : "APS Pension"} stroke={T.aps} strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey={pvOn ? "npsPV" : "npsP"} name={pvOn ? "NPS (Today's ₹)" : "NPS Pension"} stroke={T.nps} strokeWidth={3} dot={false} strokeDasharray="8 4" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ ...glass, padding: 28, marginBottom: 20 }}>
                <Sec icon="💰">Cumulative Pension</Sec>
                <ResponsiveContainer width="100%" height={340}>
                  <AreaChart data={R.post}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="label" stroke={T.textMuted} fontSize={11} fontWeight={600} />
                    <YAxis stroke={T.textMuted} fontSize={11} tickFormatter={fmt} />
                    <Tooltip content={<TT />} /><Legend wrapperStyle={{ fontSize: 12, fontWeight: 600, color: T.textDim }} />
                    <Area type="monotone" dataKey={pvOn ? "cAP" : "cA"} name={pvOn ? "APS (Today's ₹)" : "APS Total"} fill="rgba(52,211,153,0.06)" stroke={T.aps} strokeWidth={2.5} />
                    <Area type="monotone" dataKey={pvOn ? "cNP" : "cN"} name={pvOn ? "NPS (Today's ₹)" : "NPS Total"} fill="rgba(251,146,60,0.05)" stroke={T.nps} strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={{ ...glass, padding: 28 }}>
                <Sec icon="📐">APS Advantage</Sec>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={R.post}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="label" stroke={T.textMuted} fontSize={11} fontWeight={600} />
                    <YAxis stroke={T.textMuted} fontSize={11} tickFormatter={fmt} />
                    <Tooltip content={<TT />} />
                    <Bar dataKey={pvOn ? "advPV" : "adv"} name="APS Advantage" radius={[8, 8, 0, 0]}>
                      {R.post.map((e, i) => <Cell key={i} fill={(pvOn ? e.advPV : e.adv) >= 0 ? T.aps : T.nps} fillOpacity={0.15 + (i / 25) * 0.5} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                {R.brk && R.apsP > R.npsP && <div style={{ marginTop: 16 }}><Note type="ok"><strong>Insight:</strong> APS recovers the {fmt(R.lump)} NPS lump sum in ~<strong>{R.brk} years</strong> through higher pension + DR indexation.</Note></div>}
              </div>
            </div>
          )}

          {/* ═══ TABLE TAB ═══ */}
          {tab === "table" && (
            <div style={{ ...glass, padding: 28 }}>
              <Sec icon="📋" sub={`NPS: Emp 10% + Govt ${govPct}% of (Basic+DA) · DA: ${annualDA}%/yr · Inc: ${incRate}%`}>Year-wise Breakdown</Sec>
              <div style={{ overflowX: "auto", borderRadius: 14 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 950 }}>
                  <thead>
                    <tr>{["Year", "Svc", "Basic", "DA%", "DA", "Gross", "NPS Emp", "NPS Govt", "Monthly", "Corpus", ...(pvOn ? ["PV"] : [])].map(h => (
                      <th key={h} style={{ padding: "14px 8px", textAlign: "right", color: T.textMuted, fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8, whiteSpace: "nowrap", borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {R.data.map((r, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)`, background: r.isRev ? T.accGlow : "transparent" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                        onMouseLeave={e => e.currentTarget.style.background = r.isRev ? T.accGlow : "transparent"}>
                        <td style={{ padding: "11px 8px", textAlign: "right", fontWeight: r.isRev ? 700 : 500, color: r.isRev ? T.acc : T.text }}>{r.year}{r.isRev && <span style={{ fontSize: 9, display: "block", color: T.acc }}>★ Rev</span>}</td>
                        <td style={{ padding: "11px 8px", textAlign: "right", color: T.textMuted }}>{r.svc}</td>
                        <td style={{ padding: "11px 8px", textAlign: "right", fontWeight: 600, color: T.text }}>{fmtF(r.basic)}</td>
                        <td style={{ padding: "11px 8px", textAlign: "right", color: T.nps, fontWeight: 600 }}>{r.daPct}%</td>
                        <td style={{ padding: "11px 8px", textAlign: "right", color: T.textDim }}>{fmtF(r.da)}</td>
                        <td style={{ padding: "11px 8px", textAlign: "right", color: T.aps, fontWeight: 700 }}>{fmtF(r.gross)}</td>
                        <td style={{ padding: "11px 8px", textAlign: "right", color: T.textDim }}>{fmtF(r.nE)}</td>
                        <td style={{ padding: "11px 8px", textAlign: "right", color: T.textDim }}>{fmtF(r.nG)}</td>
                        <td style={{ padding: "11px 8px", textAlign: "right", color: T.acc, fontWeight: 600 }}>{fmtF(r.mC)}</td>
                        <td style={{ padding: "11px 8px", textAlign: "right", color: T.nps, fontWeight: 700 }}>{fmt(r.corpus)}</td>
                        {pvOn && <td style={{ padding: "11px 8px", textAlign: "right", color: T.textMuted }}>{fmt(r.corpusPV)}</td>}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: `2px solid ${T.borderLight}` }}>
                      <td colSpan={6} style={{ padding: "14px 8px", textAlign: "right", fontWeight: 700, color: T.text }}>Totals →</td>
                      <td style={{ padding: "14px 8px", textAlign: "right", fontWeight: 700, color: T.acc }}>{fmt(R.empC)}</td>
                      <td style={{ padding: "14px 8px", textAlign: "right", fontWeight: 700, color: T.acc }}>{fmt(R.govC)}</td>
                      <td style={{ padding: "14px 8px", textAlign: "right", fontWeight: 800, color: T.acc }}>{fmt(R.totC)}</td>
                      <td style={{ padding: "14px 8px", textAlign: "right", fontWeight: 800, color: T.nps, fontSize: 14 }}>{fmt(R.fC)}</td>
                      {pvOn && <td style={{ padding: "14px 8px", textAlign: "right", fontWeight: 700, color: T.textMuted }}>{fmt(Math.round(R.fC * R.rIA))}</td>}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
          </>)}

          {/* Disclaimer */}
          <div style={{
            marginTop: 28, padding: "18px 24px", borderRadius: 18, fontSize: 12, color: T.textMuted, lineHeight: 1.8,
            background: "rgba(255,255,255,0.02)", backdropFilter: "blur(20px)", border: `1px solid ${T.border}`,
          }}>
            <strong style={{ color: T.textDim }}>⚠️ Disclaimer:</strong> Illustrative comparison tool. Actual amounts depend on pay scales, promotions, DA rates, NPS performance & policy. Revisions marked * are projections using Basic+DA merge + 6–7% fitment. <strong>No DCRG in Kerala under APS or NPS.</strong> 12th Pay Rev (Jun 2026): Fitment 1.38× on Basic, balance DA 4%. Subsequent revisions every 5 years: (Basic+DA) × fitment. Inflation-adjusted at {inf}%. Consult your pension section for official calculations.
          </div>
        </div>
      </div>
    </div>
  );
}
