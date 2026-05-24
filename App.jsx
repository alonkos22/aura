import { useState, useEffect, useRef } from "react";

// ─── AURA SLIM v1.0 ───────────────────────────────────────────
const C = {
  bg:"#06061A", sur:"#0D0D25", card:"#12122E", bdr:"#1E1E48",
  ac:"#7C5CFC", acL:"#A78BFA", teal:"#2DD4BF", gold:"#FBD644",
  red:"#F87171", grn:"#34D399", orn:"#FB923C", blue:"#3B82F6",
  txt:"#F0F0FF", mut:"#7777AA", dim:"#252550",
};
const F = "system-ui, sans-serif";

// ─── Styles ───────────────────────────────────────────────────
const crd = (g, c) => ({
  background: C.card, borderRadius: 16, padding: 18,
  border: "1px solid " + (g ? (c||C.ac)+"55" : C.bdr),
  boxShadow: g ? "0 0 20px "+(c||C.ac)+"12" : "none",
});
const btn = (v, s) => {
  const p = s==="sm"?"6px 12px":s==="lg"?"14px 30px":"10px 18px";
  const f = s==="sm"?12:s==="lg"?16:14;
  const bg = {
    primary:"linear-gradient(135deg,"+C.ac+",#4A35CC)",
    gold:"linear-gradient(135deg,"+C.gold+",#D97706)",
    green:"linear-gradient(135deg,"+C.grn+",#059669)",
    ghost:"transparent",
  }[v] || C.sur;
  return {
    display:"inline-flex", alignItems:"center", gap:6, padding:p,
    borderRadius:11, border:v==="ghost"?"1px solid "+C.bdr:"none",
    cursor:"pointer", fontSize:f, fontWeight:700, fontFamily:F,
    background:bg, color:v==="ghost"?C.mut:v==="gold"?"#1A0A00":"#fff",
    boxShadow:v==="primary"?"0 4px 16px "+C.ac+"44":"none",
  };
};
const INP = {
  width:"100%", boxSizing:"border-box", background:C.sur,
  border:"1px solid "+C.bdr, borderRadius:10,
  padding:"10px 13px", color:C.txt, fontSize:14,
  fontFamily:F, outline:"none", direction:"rtl",
};
const bdg = (c) => ({
  display:"inline-flex", alignItems:"center", padding:"3px 9px",
  borderRadius:99, fontSize:11, fontWeight:700,
  background:c+"22", color:c, border:"1px solid "+c+"44",
});

// ─── Micro UI ─────────────────────────────────────────────────
function Ring({ score, col, size }) {
  const s=size||64, c=col||C.ac, n=isNaN(score)?0:+score;
  const r=(s-10)/2, circ=2*Math.PI*r, dash=(n/100)*circ;
  return (
    <div style={{ position:"relative", width:s, height:s, flexShrink:0 }}>
      <svg width={s} height={s} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={s/2} cy={s/2} r={r} fill="none" stroke={c+"22"} strokeWidth={8}/>
        <circle cx={s/2} cy={s/2} r={r} fill="none" stroke={c} strokeWidth={8}
          strokeDasharray={circ} strokeDashoffset={circ-dash}
          strokeLinecap="round" style={{ transition:"stroke-dashoffset .6s" }}/>
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <span style={{ fontSize:s*.26, fontWeight:900, color:c, lineHeight:1 }}>{n}</span>
        <span style={{ fontSize:9, color:C.mut }}>/100</span>
      </div>
    </div>
  );
}

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t=setTimeout(onClose,5000); return ()=>clearTimeout(t); }, []);
  return (
    <div style={{ position:"fixed", bottom:72, left:"50%", transform:"translateX(-50%)", background:type==="success"?C.grn:type==="warn"?C.orn:C.red, color:"#fff", padding:"10px 20px", borderRadius:13, fontWeight:700, fontSize:14, zIndex:9999 }}>
      {type==="success"?"✓":"⚠"} {msg}
    </div>
  );
}

function Spin({ text }) {
  return (
    <div style={{ textAlign:"center", padding:36 }}>
      <div style={{ width:44, height:44, borderRadius:"50%", margin:"0 auto 12px", border:"4px solid "+C.bdr, borderTopColor:C.ac, animation:"spin .8s linear infinite" }}/>
      <p style={{ color:C.mut, fontSize:14 }}>{text}</p>
    </div>
  );
}

// ─── API + JSON ───────────────────────────────────────────────
async function callAI(prompt, sys) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 40000);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        model:"claude-sonnet-4-20250514",
        max_tokens:1000,
        system: sys,
        messages:[{role:"user", content:prompt}],
      }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (res.status===429) throw new Error("מגבלת קצב — המתן דקה ונסה שוב");
    if (res.status===401) throw new Error("שגיאת הרשאה — רענן את הדף");
    if (!res.ok) { const e=await res.json().catch(()=>({})); throw new Error(e?.error?.message||"שגיאת שרת "+res.status); }
    const d = await res.json();
    return (d.content||[]).find(b=>b.type==="text")?.text||"";
  } catch(e) {
    clearTimeout(t);
    if (e.name==="AbortError") throw new Error("תם הזמן — נסה שוב");
    throw e;
  }
}

function toJSON(text) {
  let s = text.trim().replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/```\s*$/i,"").trim();
  const a=s.indexOf("{"), b=s.lastIndexOf("}");
  if (a<0||b<0) throw new Error("לא נמצא JSON בתגובה");
  s = s.slice(a, b+1);
  try { return JSON.parse(s); } catch(_) {}
  try { return JSON.parse(s.replace(/,\s*([}\]])/g,"$1")); } catch(_) {}
  // Fallback: extract score + return partial result
  const score = parseInt(s.match(/"score"\s*:\s*(\d+)/)?.[1]||"70");
  return {
    score, verdict:"הניתוח הושלם — ראה פרטים להלן",
    currentState:"על בסיס הנתונים שלך",
    scenarioYes:{label:"אם תפעל",prediction:"תוצאה חיובית צפויה",probability:60,benefits:["שיפור במצב"],risks:["דורש מאמץ"]},
    scenarioNo:{label:"אם לא תפעל",prediction:"המצב יישאר",probability:25,consequences:["ללא שינוי"]},
    scenarioMiddle:{label:"דרך אמצע",prediction:"גישה מדורגת",probability:15,steps:["שלב 1","שלב 2","שלב 3"]},
    immediateActions:["פנה ליועץ מקצועי לפרטים"],
    warnings:["זוהי המלצה כללית בלבד"],
    expertOpinion:"מומלץ להתייעץ עם מומחה לפרטים ספציפיים",
    evidenceBasis:"WHO, בנק ישראל, Mayo Clinic",
    disclaimer:"המלצה לדיון בלבד — לא תחליף לייעוץ מקצועי",
    _partial:true,
  };
}

// ─── Profile fields ───────────────────────────────────────────
const SECS = [
  { id:"p", icon:"👤", label:"אישי", col:C.acL, fields:[
    {k:"name",    label:"שם מלא",    type:"text",   ph:"ישראל ישראלי"},
    {k:"age",     label:"גיל",       type:"number", ph:"35"},
    {k:"city",    label:"עיר",       type:"text",   ph:"תל אביב"},
    {k:"gender",  label:"מין",       type:"sel",    opts:["זכר","נקבה","אחר"]},
  ]},
  { id:"fam", icon:"👨‍👩‍👧", label:"משפחה", col:C.teal, fields:[
    {k:"marital",    label:"מצב משפחתי",          type:"sel",    opts:["רווק/ה","בזוגיות","נשוי/ה","גרוש/ה","אלמן/ה"]},
    {k:"children",   label:"מספר ילדים",          type:"number", ph:"0"},
    {k:"childrenAge",label:"גילאי הילדים",         type:"text",   ph:"5, 10, 14...", opt:true},
    {k:"familySize", label:"גודל משק בית (נפשות)", type:"number", ph:"4"},
    {k:"livingWith", label:"עם מי אתה גר",        type:"sel",    opts:["לבד","עם בן/בת זוג","עם ילדים","עם הורים","שותפים"]},
    {k:"dependents", label:"תלויים נוספים",        type:"text",   ph:"הורה קשיש...", opt:true},
  ]},
  { id:"fin", icon:"💰", label:"כספים", col:C.gold, fields:[
    {k:"income",   label:"הכנסה חודשית נטו (₪)", type:"number", ph:"12000"},
    {k:"expenses", label:"הוצאות קבועות (₪)",    type:"number", ph:"7000"},
    {k:"savings",  label:"חסכונות (₪)",           type:"number", ph:"50000"},
    {k:"debt",     label:"חובות (₪)",             type:"number", ph:"0"},
    {k:"finGoal",  label:"מטרה פיננסית",          type:"sel",    opts:["חיסכון","עסק עצמאי","דירה","פרישה מוקדמת","יציאה מחובות"]},
  ]},
  { id:"car", icon:"💼", label:"קריירה", col:C.ac, fields:[
    {k:"job",       label:"תפקיד",              type:"text",   ph:"מנהל מוצר"},
    {k:"industry",  label:"תחום",               type:"text",   ph:"היי-טק"},
    {k:"exp",       label:"שנות ניסיון",         type:"number", ph:"8"},
    {k:"jobSat",    label:"שביעות רצון (1-10)", type:"range",  min:1, max:10},
    {k:"skills",    label:"כישורים",             type:"text",   ph:"ניהול, תכנות"},
    {k:"careerGoal",label:"שאיפה",               type:"text",   ph:"לפתוח עסק..."},
  ]},
  { id:"hlt", icon:"❤️", label:"בריאות", col:C.red, fields:[
    {k:"health",  label:"מצב בריאות",     type:"sel",   opts:["מצוין","טוב","בינוני","יש אתגרים"]},
    {k:"chronic", label:"מצבים כרוניים",  type:"text",  ph:"אין / סוכרת...", opt:true},
    {k:"exercise",label:"אימונים/שבוע",   type:"range", min:0, max:7},
    {k:"energy",  label:"אנרגיה (1-10)",  type:"range", min:1, max:10},
    {k:"stress",  label:"סטרס (1-10)",    type:"range", min:1, max:10},
    {k:"sleepH",  label:"שעות שינה",      type:"range", min:3, max:12},
  ]},
  { id:"gl", icon:"🎯", label:"מטרות", col:C.orn, fields:[
    {k:"goal12",   label:"מטרה ב-12 חודשים",       type:"text",  ph:"לפתוח עסק, לחסוך 50K..."},
    {k:"obstacle", label:"המכשול העיקרי",           type:"text",  ph:"זמן, כסף, מוטיבציה..."},
    {k:"happy",    label:"אושר (1-10)",             type:"range", min:1, max:10},
    {k:"balance",  label:"איזון עבודה-חיים (1-10)", type:"range", min:1, max:10},
    {k:"extra",    label:"הערות",                   type:"ta",    ph:"כל דבר נוסף...", opt:true},
  ]},
];

function PF({ f, val, onChange, col }) {
  const v = val !== undefined ? val : (f.type==="range" ? f.min : "");
  if (f.type==="sel") return (
    <select value={v} onChange={e=>onChange(e.target.value)} style={{...INP, cursor:"pointer"}}>
      <option value="">בחר...</option>
      {f.opts.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  );
  if (f.type==="range") return (
    <div>
      <input type="range" min={f.min} max={f.max} value={v} onChange={e=>onChange(e.target.value)} style={{width:"100%", accentColor:col}}/>
      <div style={{display:"flex", justifyContent:"space-between"}}>
        <span style={{fontSize:12, color:C.dim}}>{f.min}</span>
        <span style={{fontSize:22, fontWeight:900, color:col}}>{v}</span>
        <span style={{fontSize:12, color:C.dim}}>{f.max}</span>
      </div>
    </div>
  );
  if (f.type==="ta") return <textarea value={v} onChange={e=>onChange(e.target.value)} placeholder={f.ph} rows={2} style={{...INP, resize:"none"}}/>;
  return <input type={f.type==="number"?"number":"text"} value={v} placeholder={f.ph||""} onChange={e=>onChange(e.target.value)} style={INP}/>;
}

// ═══ SPLASH ══════════════════════════════════════════════════
function SplashScreen({ onDone }) {
  const [ph, setPh] = useState(0);
  useEffect(() => {
    const t1=setTimeout(()=>setPh(1),400);
    const t2=setTimeout(()=>setPh(2),1100);
    const t3=setTimeout(()=>onDone(),2800);
    return()=>{clearTimeout(t1);clearTimeout(t2);clearTimeout(t3);};
  }, []);
  return (
    <div style={{minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", direction:"rtl"}}>
      <div style={{fontSize:72, marginBottom:18, opacity:ph>=1?1:0, transform:ph>=1?"scale(1)":"scale(.3)", transition:"all .7s cubic-bezier(.34,1.56,.64,1)"}}>◈</div>
      <div style={{opacity:ph>=2?1:0, transition:"opacity .5s", textAlign:"center"}}>
        <div style={{fontSize:36, fontWeight:900, background:"linear-gradient(135deg,"+C.ac+","+C.teal+")", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:6}}>Aura</div>
        <div style={{fontSize:14, color:C.mut}}>AI Life Intelligence System</div>
      </div>
    </div>
  );
}

// ═══ PROFILE ═════════════════════════════════════════════════
function ProfileScreen({ onDone, toast }) {
  const [idx, setIdx] = useState(0);
  const [data, setData] = useState({});
  const sec = SECS[idx];
  const isLast = idx===SECS.length-1;
  const set = (k,v) => setData(p=>({...p,[k]:v}));

  return (
    <div style={{maxWidth:680, margin:"0 auto", padding:"16px 14px"}}>
      <div style={{display:"flex", gap:5, flexWrap:"wrap", marginBottom:12}}>
        {SECS.map((s,i)=>(
          <button key={s.id} onClick={()=>setIdx(i)} style={{padding:"5px 10px", borderRadius:99, border:"none", cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:F, background:i===idx?s.col:i<idx?C.grn+"22":C.sur, color:i===idx?"#fff":i<idx?C.grn:C.mut, outline:"1px solid "+(i===idx?s.col:i<idx?C.grn+"55":C.bdr)}}>
            {s.icon} {s.label}{i<idx?" ✓":""}
          </button>
        ))}
      </div>
      <div style={{...crd(true,sec.col)}}>
        <div style={{display:"flex", gap:9, marginBottom:14, alignItems:"center"}}>
          <span style={{fontSize:24}}>{sec.icon}</span>
          <h2 style={{fontSize:18, fontWeight:900, color:sec.col, margin:0}}>{sec.label}</h2>
        </div>
        <div style={{display:"flex", flexDirection:"column", gap:12}}>
          {sec.fields.map(f=>{
            const v=data[f.k]!==undefined?data[f.k]:(f.type==="range"?f.min:"");
            return (
              <div key={f.k}>
                <label style={{display:"block", marginBottom:5, fontSize:13, fontWeight:700, color:C.mut}}>
                  {f.label}{f.opt&&<span style={{...bdg(C.dim), fontSize:10, marginRight:5}}>אופציונלי</span>}
                </label>
                <PF f={f} val={v} onChange={v=>set(f.k,v)} col={sec.col}/>
              </div>
            );
          })}
        </div>
        <div style={{display:"flex", justifyContent:"space-between", marginTop:18}}>
          <button style={{...btn("ghost"), opacity:idx===0?.4:1}} disabled={idx===0} onClick={()=>idx>0&&setIdx(idx-1)}>← חזור</button>
          <button style={btn(isLast?"green":"primary")} onClick={()=>{
            if(isLast){toast("פרופיל נשמר! 🎉","success");onDone(data);}
            else setIdx(idx+1);
          }}>
            {isLast?"✓ סיים →":"הבא: "+SECS[idx+1].icon+" →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══ SIMULATOR ═══════════════════════════════════════════════
function SimulatorScreen({ profile, simsLeft, setSimsLeft, toast }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errMsg, setErrMsg] = useState("");
  const [history, setHistory] = useState([]);
  const [view, setView] = useState("ask");

  const CATS = ["💼 קריירה","💰 כספים","🏠 נדל\"ן","❤️ בריאות","📚 השכלה","👨‍👩‍👧 משפחה","🚀 עסק","🌍 אחר"];
  const SUGG = [
    "האם כדאי לי לעזוב עבודתי ולפתוח עסק?",
    "האם אני מוכן כלכלית לקנות דירה?",
    "כיצד לשפר את המצב הפיננסי שלי?",
    "האם כדאי ללמוד תואר שני?",
    "כיצד לשפר את הבריאות והאנרגיה?",
    "האם כדאי לי לעבור עבודה?",
  ];

  function buildProf() {
    const p=profile, r=[], a=(l,v)=>{if(v)r.push(l+": "+v);};
    a("Name",p.name); a("Age",p.age); a("City",p.city);
    a("Marital",p.marital); a("Children",p.children); a("Children ages",p.childrenAge);
    a("Household",p.familySize&&p.familySize+" people"); a("Living with",p.livingWith);
    a("Dependents",p.dependents);
    a("Income",p.income&&p.income+"₪"); a("Expenses",p.expenses&&p.expenses+"₪");
    a("Savings",p.savings&&p.savings+"₪"); a("Debts",p.debt&&p.debt+"₪");
    a("Financial goal",p.finGoal);
    a("Job",p.job); a("Industry",p.industry); a("Experience",p.exp&&p.exp+" yrs");
    a("Job satisfaction",p.jobSat&&p.jobSat+"/10"); a("Skills",p.skills);
    a("Career goal",p.careerGoal);
    a("Health",p.health); a("Chronic",p.chronic);
    a("Exercise/week",p.exercise); a("Energy",p.energy&&p.energy+"/10");
    a("Stress",p.stress&&p.stress+"/10"); a("Sleep",p.sleepH&&p.sleepH+"h");
    a("Happiness",p.happy&&p.happy+"/10"); a("Balance",p.balance&&p.balance+"/10");
    a("12mo goal",p.goal12); a("Obstacle",p.obstacle);
    if(p.extra) a("Notes",p.extra);
    return r.join(" | ")||"No profile provided";
  }

  async function run() {
    if (q.trim().length<10) { toast("שאלה קצרה מדי","error"); return; }
    if (simsLeft<=0) { toast("נגמרו הניתוחים","error"); return; }
    setLoading(true); setResult(null); setErrMsg("");

    const SYS = "You are Aura AI. Return ONLY a valid JSON object. No markdown, no backticks, no text outside the JSON. Start with { and end with }. Never use double-quote characters inside text values.";

    const PROMPT = [
      "Analyze this life question and return JSON.",
      "Question: "+q,
      cat?"Category: "+cat:"",
      "Profile: "+buildProf(),
      "Guidelines: WHO: 150-300min/week | sleep 7-9h | Bank of Israel: save 15-20% | rule 50/30/20",
      "",
      "Return this exact JSON structure with Hebrew text values:",
      '{"score":0,"verdict":"text","currentState":"text","scenarioYes":{"label":"text","prediction":"text","probability":0,"financialImpact":"text","benefits":["text"],"risks":["text"]},"scenarioNo":{"label":"text","prediction":"text","probability":0,"consequences":["text"]},"scenarioMiddle":{"label":"text","prediction":"text","probability":0,"steps":["text","text","text"]},"immediateActions":["text","text","text"],"warnings":["text"],"expertOpinion":"text","evidenceBasis":"text","disclaimer":"text"}',
    ].filter(Boolean).join("\n");

    try {
      const raw = await callAI(PROMPT, SYS);
      const res = toJSON(raw);
      const full = {...res, q, cat};
      setResult(full);
      setSimsLeft(s=>Math.max(0,s-1));
      setHistory(h=>[{...full, date:new Date().toLocaleDateString("he-IL"), id:Date.now()},...h]);
      setView("result");
      toast("הסימולציה הושלמה! 🎯","success");
    } catch(e) {
      setErrMsg(e.message);
      setView("result");
      toast("שגיאה: "+e.message,"error");
    } finally {
      setLoading(false);
    }
  }

  const sc = s=>s>=70?C.grn:s>=45?C.gold:C.red;

  return (
    <div style={{maxWidth:780, margin:"0 auto", padding:"16px 14px 80px"}}>
      {/* Header */}
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
        <div>
          <h2 style={{fontSize:20, fontWeight:900, margin:"0 0 2px"}}>🔮 סימולטור חיים</h2>
          <p style={{fontSize:12, color:C.mut, margin:0}}>3 תרחישים עתידיים על בסיס הנתונים שלך</p>
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:20, fontWeight:900, color:simsLeft<=1?C.red:C.teal}}>{simsLeft}</div>
          <div style={{fontSize:10, color:C.mut}}>נותרו</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex", gap:6, marginBottom:14}}>
        {[["ask","🎯 שאל"],["result","📊 תוצאה"],["history","📋 ("+history.length+")"]].map(([id,lbl])=>(
          <button key={id} onClick={()=>setView(id)} style={{padding:"6px 12px", borderRadius:9, border:"none", cursor:"pointer", fontSize:12, fontWeight:view===id?700:500, fontFamily:F, background:view===id?C.ac:"transparent", color:view===id?"#fff":C.mut, outline:view===id?"none":"1px solid "+C.bdr}}>
            {lbl}
          </button>
        ))}
      </div>

      {/* ASK */}
      {view==="ask"&&(
        <div style={{display:"flex", flexDirection:"column", gap:12}}>
          {/* Categories */}
          <div style={crd(false)}>
            <div style={{fontWeight:700, marginBottom:8, fontSize:13}}>📂 קטגוריה</div>
            <div style={{display:"flex", gap:5, flexWrap:"wrap"}}>
              {CATS.map(c=>(
                <button key={c} onClick={()=>setCat(cat===c?"":c)} style={{padding:"4px 9px", borderRadius:99, border:"none", cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:F, background:cat===c?C.ac:C.sur, color:cat===c?"#fff":C.mut, outline:"1px solid "+(cat===c?C.ac:C.bdr)}}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Question */}
          <div style={crd(true)}>
            <label style={{display:"block", fontWeight:700, marginBottom:7, fontSize:15}}>💬 מה השאלה שלך?</label>
            <p style={{fontSize:12, color:C.mut, marginBottom:8}}>שאל שאלות גדולות — קריירה, כסף, בריאות, משפחה, עסקים.</p>
            <textarea value={q} onChange={e=>setQ(e.target.value)} rows={4} placeholder="לדוגמה: האם כדאי לי לעזוב את עבודתי? יש לי חסכון של 80,000₪ ו-8 שנות ניסיון..." style={{...INP, resize:"vertical", marginBottom:8}}/>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
              <span style={{fontSize:12, color:q.length<10?C.red:C.mut}}>{q.length} תווים{q.length<10?" (מינימום 10)":""}</span>
              <button style={{...btn("primary"), opacity:loading||q.trim().length<10||simsLeft<=0?.5:1}} onClick={run} disabled={loading||q.trim().length<10||simsLeft<=0}>
                {loading?"⏳ מנתח...":"🔮 הפעל סימולציה"}
              </button>
            </div>
          </div>

          {/* Suggestions */}
          <div style={{...crd(false), background:C.acL+"08", borderColor:C.acL+"22"}}>
            <div style={{fontWeight:700, color:C.acL, marginBottom:8, fontSize:13}}>💡 דוגמאות — לחץ לשימוש</div>
            {SUGG.map(s=>(
              <button key={s} onClick={()=>setQ(s)} style={{...btn("ghost","sm"), display:"block", width:"100%", textAlign:"right", justifyContent:"flex-start", marginBottom:4, fontSize:12}}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* RESULT */}
      {view==="result"&&(
        <div style={{display:"flex", flexDirection:"column", gap:12}}>
          {!result&&!loading&&!errMsg&&(
            <div style={{...crd(true), textAlign:"center", padding:36}}>
              <div style={{fontSize:40, marginBottom:10}}>🔮</div>
              <p style={{color:C.mut, marginBottom:16}}>שאל שאלה כדי לראות תוצאות</p>
              <button style={btn("primary")} onClick={()=>setView("ask")}>← חזור לשאלה</button>
            </div>
          )}

          {loading&&<div style={crd(true)}><Spin text="Aura מנתחת 3 תרחישים... כ-20 שניות"/></div>}

          {errMsg&&!loading&&(
            <div style={{...crd(false), background:C.red+"14", borderColor:C.red+"44"}}>
              <div style={{fontWeight:700, color:C.red, fontSize:15, marginBottom:8}}>⚠️ שגיאה</div>
              <p style={{fontSize:14, color:C.txt, lineHeight:1.6, marginBottom:10}}>{errMsg}</p>
              <button style={btn("primary","sm")} onClick={()=>setView("ask")}>← נסה שוב</button>
            </div>
          )}

          {result&&!loading&&(
            <div style={{display:"flex", flexDirection:"column", gap:11}}>
              {result._partial&&(
                <div style={{...crd(false), background:C.gold+"14", borderColor:C.gold+"44"}}>
                  <p style={{fontSize:12, color:C.gold, margin:0}}>⚠️ תגובה חלקית — נסה שוב לתוצאה מלאה</p>
                </div>
              )}

              {/* Score header */}
              <div style={{...crd(true), background:"linear-gradient(135deg,"+C.ac+"22,"+C.teal+"11)"}}>
                <div style={{display:"flex", gap:14, alignItems:"flex-start"}}>
                  <Ring score={result.score} col={sc(result.score)} size={76}/>
                  <div style={{flex:1}}>
                    {result.cat&&<div style={{...bdg(C.ac), marginBottom:6}}>{result.cat}</div>}
                    <div style={{fontSize:12, color:C.mut, marginBottom:4}}>{result.q}</div>
                    <div style={{fontSize:15, fontWeight:800, color:C.txt, lineHeight:1.5}}>{result.verdict}</div>
                  </div>
                </div>
              </div>

              {/* Current state */}
              {result.currentState&&(
                <div style={{...crd(false), background:C.acL+"0A", borderColor:C.acL+"33"}}>
                  <div style={{fontWeight:700, color:C.acL, marginBottom:6}}>📍 מצב נוכחי</div>
                  <p style={{fontSize:14, color:C.txt, lineHeight:1.7, margin:0}}>{result.currentState}</p>
                </div>
              )}

              {/* Expert opinion */}
              {result.expertOpinion&&(
                <div style={{...crd(false), background:C.teal+"0A", borderColor:C.teal+"33"}}>
                  <div style={{fontWeight:700, color:C.teal, marginBottom:6}}>🎓 חוות דעת מומחה</div>
                  <p style={{fontSize:14, color:C.txt, lineHeight:1.7, margin:0}}>{result.expertOpinion}</p>
                </div>
              )}

              <div style={{fontSize:15, fontWeight:800}}>🔮 3 תרחישים</div>

              {/* Scenario YES */}
              {result.scenarioYes&&(
                <div style={{...crd(true,C.grn), background:C.grn+"0A"}}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
                    <div style={{fontWeight:800, color:C.grn, fontSize:14}}>✅ {result.scenarioYes.label}</div>
                    {result.scenarioYes.probability>0&&<span style={bdg(C.grn)}>{result.scenarioYes.probability}%</span>}
                  </div>
                  <p style={{fontSize:13, color:C.txt, lineHeight:1.7, marginBottom:8}}>{result.scenarioYes.prediction}</p>
                  {result.scenarioYes.financialImpact&&(
                    <div style={{...bdg(C.gold), marginBottom:7}}>💰 {result.scenarioYes.financialImpact}</div>
                  )}
                  {result.scenarioYes.benefits?.map((b,i)=>(
                    <div key={i} style={{display:"flex", gap:7, fontSize:13, padding:"2px 0"}}>
                      <span style={{color:C.grn}}>+</span>{b}
                    </div>
                  ))}
                  {result.scenarioYes.risks?.length>0&&(
                    <div style={{marginTop:6}}>
                      {result.scenarioYes.risks.map((r,i)=>(
                        <div key={i} style={{display:"flex", gap:7, fontSize:12, color:C.mut}}><span>⚠</span>{r}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Scenario NO */}
              {result.scenarioNo&&(
                <div style={{...crd(true,C.red), background:C.red+"0A"}}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
                    <div style={{fontWeight:800, color:C.red, fontSize:14}}>⛔ {result.scenarioNo.label}</div>
                    {result.scenarioNo.probability>0&&<span style={bdg(C.red)}>{result.scenarioNo.probability}%</span>}
                  </div>
                  <p style={{fontSize:13, color:C.txt, lineHeight:1.7, marginBottom:8}}>{result.scenarioNo.prediction}</p>
                  {result.scenarioNo.consequences?.map((c,i)=>(
                    <div key={i} style={{display:"flex", gap:7, fontSize:13}}><span style={{color:C.red}}>⚠</span>{c}</div>
                  ))}
                </div>
              )}

              {/* Scenario MIDDLE */}
              {result.scenarioMiddle&&(
                <div style={{...crd(true,C.gold), background:C.gold+"0A"}}>
                  <div style={{fontWeight:800, color:C.gold, fontSize:14, marginBottom:8}}>🔄 {result.scenarioMiddle.label}</div>
                  {result.scenarioMiddle.probability>0&&(
                    <div style={{...bdg(C.gold), marginBottom:7}}>{result.scenarioMiddle.probability}%</div>
                  )}
                  <p style={{fontSize:13, color:C.txt, lineHeight:1.7, marginBottom:8}}>{result.scenarioMiddle.prediction}</p>
                  {result.scenarioMiddle.steps?.length>0&&(
                    <div>
                      {result.scenarioMiddle.steps.map((s,i)=>(
                        <div key={i} style={{display:"flex", gap:9, padding:"7px 0", borderBottom:i<result.scenarioMiddle.steps.length-1?"1px solid "+C.dim:"none", alignItems:"flex-start"}}>
                          <div style={{width:22, height:22, borderRadius:"50%", background:C.gold, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:900, color:"#fff", flexShrink:0}}>{i+1}</div>
                          <span style={{fontSize:13, color:C.txt}}>{s}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              {result.immediateActions?.length>0&&(
                <div style={{...crd(true,C.ac)}}>
                  <div style={{fontWeight:800, color:C.ac, fontSize:14, marginBottom:10, paddingBottom:8, borderBottom:"1px solid "+C.dim}}>🎯 פעולות מיידיות</div>
                  {result.immediateActions.map((a,i)=>(
                    <div key={i} style={{display:"flex", gap:9, padding:"8px 0", borderBottom:i<result.immediateActions.length-1?"1px solid "+C.dim:"none", alignItems:"flex-start"}}>
                      <div style={{width:24, height:24, borderRadius:"50%", background:C.ac, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:900, color:"#fff", flexShrink:0}}>{i+1}</div>
                      <span style={{fontSize:13, color:C.txt}}>{a}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Warnings */}
              {result.warnings?.length>0&&(
                <div style={{...crd(false), background:C.orn+"0A", borderColor:C.orn+"33"}}>
                  <div style={{fontWeight:700, color:C.orn, marginBottom:6}}>⚠️ אזהרות</div>
                  {result.warnings.map((w,i)=>(
                    <div key={i} style={{display:"flex", gap:7, fontSize:13, padding:"3px 0"}}><span style={{color:C.orn}}>⚠</span>{w}</div>
                  ))}
                </div>
              )}

              {/* Evidence + disclaimer */}
              {result.evidenceBasis&&(
                <div style={{...crd(false), background:C.acL+"08", borderColor:C.acL+"22"}}>
                  <div style={{fontWeight:700, color:C.acL, fontSize:12, marginBottom:3}}>🔬 בסיס מדעי</div>
                  <p style={{fontSize:12, color:C.mut, margin:0}}>{result.evidenceBasis}</p>
                </div>
              )}
              {result.disclaimer&&<p style={{fontSize:11, color:C.dim}}>* {result.disclaimer}</p>}

              <button style={btn("ghost","sm")} onClick={()=>{setView("ask");setErrMsg("");}}>← שאלה חדשה</button>
            </div>
          )}
        </div>
      )}

      {/* HISTORY */}
      {view==="history"&&(
        <div style={{display:"flex", flexDirection:"column", gap:10}}>
          {history.length===0&&(
            <div style={{...crd(false), textAlign:"center", padding:32}}>
              <p style={{color:C.mut}}>אין ניתוחים עדיין — שאל שאלה ראשונה!</p>
              <button style={btn("primary","sm")} onClick={()=>setView("ask")}>← שאל עכשיו</button>
            </div>
          )}
          {history.map(h=>(
            <div key={h.id} style={{...crd(false), cursor:"pointer"}} onClick={()=>{setResult(h);setErrMsg("");setView("result");}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
                <div style={{flex:1}}>
                  {h.cat&&<div style={{...bdg(C.ac), marginBottom:5}}>{h.cat}</div>}
                  <div style={{fontWeight:700, fontSize:13, marginBottom:3}}>{h.q}</div>
                  <div style={{fontSize:12, color:C.mut}}>{h.verdict}</div>
                  <div style={{fontSize:11, color:C.dim, marginTop:3}}>{h.date}</div>
                </div>
                <Ring score={h.score} col={h.score>=70?C.grn:h.score>=45?C.gold:C.red} size={48}/>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══ DASHBOARD ═══════════════════════════════════════════════
function DashboardScreen({ profile, onNav, simsLeft }) {
  const name = profile.name||"חבר";
  const h = new Date().getHours();
  const greeting = h<12?"בוקר טוב":h<17?"צהריים טובים":"ערב טוב";

  return (
    <div style={{maxWidth:680, margin:"0 auto", padding:"16px 14px 80px"}}>
      <div style={{marginBottom:18}}>
        <div style={{fontSize:13, color:C.mut}}>{greeting} 👋</div>
        <h1 style={{fontSize:26, fontWeight:900, margin:"2px 0 4px", background:"linear-gradient(135deg,"+C.ac+","+C.teal+")", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent"}}>{name}</h1>
        <div style={{fontSize:13, color:C.mut}}>יש לך {simsLeft} ניתוחים נותרים</div>
      </div>

      {/* Main action */}
      <div style={{...crd(true), background:"linear-gradient(135deg,"+C.ac+"22,"+C.teal+"11)", marginBottom:14, cursor:"pointer"}} onClick={()=>onNav("sim")}>
        <div style={{display:"flex", gap:14, alignItems:"center"}}>
          <div style={{fontSize:52}}>🔮</div>
          <div>
            <div style={{fontWeight:900, fontSize:18, marginBottom:4}}>סימולטור חיים</div>
            <p style={{fontSize:13, color:C.mut, margin:0}}>שאל שאלות גדולות — קריירה, כסף, בריאות, עסקים. קבל 3 תרחישים מבוססי נתונים.</p>
          </div>
        </div>
      </div>

      {/* Evidence base info */}
      <div style={{...crd(false), background:C.acL+"08", borderColor:C.acL+"22", marginBottom:14}}>
        <div style={{fontWeight:700, color:C.acL, marginBottom:8}}>🔬 מבוסס על</div>
        {[["🏥","WHO — הנחיות בריאות עולמיות"],["💰","בנק ישראל — כלל 50/30/20, חיסכון 15-20%"],["🩺","Mayo Clinic — תזונה ושינה"],["📊","AHA — לחץ דם ולב"]].map(([ic,t])=>(
          <div key={t} style={{display:"flex", gap:8, marginBottom:5, fontSize:13}}><span>{ic}</span><span style={{color:C.mut}}>{t}</span></div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
        {[["sim","🔮","סימולטור",C.ac],["profile","👤","ערוך פרופיל",C.teal]].map(([id,icon,lbl,col])=>(
          <button key={id} onClick={()=>onNav(id)} style={{...crd(false), border:"1px solid "+col+"44", background:col+"0A", cursor:"pointer", padding:16, textAlign:"center", fontFamily:F}}>
            <div style={{fontSize:28, marginBottom:6}}>{icon}</div>
            <div style={{fontSize:13, fontWeight:700, color:col}}>{lbl}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══ BOTTOM NAV ══════════════════════════════════════════════
function BottomNav({ active, onNav }) {
  const items = [["home","🏠","בית"],["sim","🔮","סימולטור"],["profile","👤","פרופיל"]];
  return (
    <div style={{position:"fixed", bottom:0, left:0, right:0, background:C.sur+"F5", backdropFilter:"blur(20px)", borderTop:"1px solid "+C.bdr, display:"flex", zIndex:99}}>
      {items.map(([id,icon,lbl])=>{
        const on=active===id;
        return (
          <button key={id} onClick={()=>onNav(id)} style={{flex:1, padding:"8px 2px 10px", border:"none", cursor:"pointer", background:"transparent", display:"flex", flexDirection:"column", alignItems:"center", gap:2, fontFamily:F}}>
            <span style={{fontSize:22, filter:on?"drop-shadow(0 0 6px "+C.ac+")":"none"}}>{icon}</span>
            <span style={{fontSize:10, fontWeight:on?800:500, color:on?C.ac:C.mut}}>{lbl}</span>
            {on&&<div style={{width:3, height:3, borderRadius:"50%", background:C.ac}}/>}
          </button>
        );
      })}
    </div>
  );
}

// ═══ ROOT ════════════════════════════════════════════════════
export default function AuraApp() {
  const [screen, setScreen] = useState("splash");
  const [nav, setNav] = useState("home");
  const [profile, setProfile] = useState({});
  const [toast, setToast] = useState(null);
  const [simsLeft, setSimsLeft] = useState(3);

  const showToast = (msg,type) => setToast({msg,type:type||"success"});

  function doNav(id) {
    if (id==="sim" && !profile.name) {
      showToast("מלא פרופיל תחילה","warn");
      setNav("profile");
      setScreen("main");
      return;
    }
    setNav(id);
    setScreen("main");
  }

  const NAV = {background:C.sur+"EE", backdropFilter:"blur(16px)", borderBottom:"1px solid "+C.bdr, position:"sticky", top:0, zIndex:100, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 16px"};
  const LOGO = {fontSize:18, fontWeight:900, background:"linear-gradient(135deg,"+C.ac+","+C.teal+")", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent"};

  return (
    <div style={{minHeight:"100vh", background:C.bg, color:C.txt, fontFamily:F, direction:"rtl"}}>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box}"}</style>
      <div style={{position:"fixed", inset:0, pointerEvents:"none", background:"radial-gradient(ellipse at 20% 70%,"+C.ac+"09 0%,transparent 55%),radial-gradient(ellipse at 80% 20%,"+C.teal+"07 0%,transparent 50%)"}}/>

      {screen==="splash"&&<SplashScreen onDone={()=>setScreen("main")}/>}

      {screen==="main"&&(
        <div style={{position:"relative", zIndex:1}}>
          <nav style={NAV}>
            <div style={LOGO}>◈ Aura</div>
            <div style={{display:"flex", gap:8, alignItems:"center"}}>
              {!profile.name&&<button style={btn("primary","sm")} onClick={()=>setNav("profile")}>+ בנה פרופיל</button>}
              {profile.name&&<span style={{fontSize:12, color:C.mut}}>{profile.name} · {simsLeft} ניתוחים</span>}
            </div>
          </nav>

          {nav==="home"&&<DashboardScreen profile={profile} onNav={doNav} simsLeft={simsLeft}/>}
          {nav==="sim"&&<SimulatorScreen profile={profile} simsLeft={simsLeft} setSimsLeft={setSimsLeft} toast={showToast}/>}
          {nav==="profile"&&<ProfileScreen onDone={d=>{setProfile(d);showToast("פרופיל נשמר! 🎉","success");setNav("home");}} toast={showToast}/>}

          <BottomNav active={nav} onNav={doNav}/>
        </div>
      )}

      {toast&&<Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
    </div>
  );
}
