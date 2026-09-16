import React, { useState, useEffect } from 'react';
import { T, API_BASE } from '../../constants/constants';
import { LuDroplets as Droplets, LuGlobe as Globe, LuLock } from 'react-icons/lu';
import { LocationIcons, StatusIcons, WeatherIcons, AgricultureIcons, CommonIcons, ActionIcons, DataIcons } from '../../components/Common/Icons';

const { MapPin } = LocationIcons;
const { Trophy, TrendingUp, Star, Smile } = StatusIcons;
const { CloudRain } = WeatherIcons;
const { Sprout, Leaf } = AgricultureIcons;
const { CheckCircle } = ActionIcons;
const { LineChart } = DataIcons;

export default function WelcomePage({ lang, setLang, onOpenLogin, onOpenRegister }) {
  const t = T[lang];
  const [modelAccuracy, setModelAccuracy] = useState('');
  const [benchmarks, setBenchmarks] = useState({
    Maize: 23.2,
    Rice: 36.4
  });

  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then(r => r.json())
      .then(d => {
        if (d.accuracy) setModelAccuracy(parseFloat(d.accuracy).toFixed(1));
      })
      .catch(() => {});

    fetch(`${API_BASE}/api/model-info`)
      .then(r => r.json())
      .then(d => {
        if (d.benchmarks_kg_are) setBenchmarks(d.benchmarks_kg_are);
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#ecfbf6", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", color: "#0f172a" }}>

      {/* ── Navbar ── */}
      <header style={{
        background: "rgba(255,255,255,0.95)",
        borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
        padding: "0 32px", height: 80,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        boxShadow: "0 16px 40px rgba(15,23,42,0.08)", position: "sticky", top: 0, zIndex: 100
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src="/logo.svg" alt="logo" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", boxShadow: "0 2px 10px rgba(20,83,45,0.18)" }} onError={e => { e.target.src='/logo.png'; }} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#0f3d38", lineHeight: 1.1, letterSpacing: "-0.3px" }}>{t.appName}</div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginTop: 2 }}>Bugesera District · Rwanda</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setLang(l => l === "en" ? "rw" : "en")} style={{
            background: "#f1f5f9", border: "none", padding: "7px 14px", borderRadius: 99,
            fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#475569", display: "flex", alignItems: "center", gap: 6
          }}>
            <Globe size={14} color="#0f766e" /> {lang === "en" ? "Kinyarwanda" : "English"}
          </button>
          <button onClick={onOpenLogin} style={{
            background: "white", border: "1.5px solid #0d9488", color: "#0d9488",
            padding: "8px 18px", borderRadius: 99, fontSize: 13, fontWeight: 700, cursor: "pointer"
          }}>{t.login}</button>
          <button onClick={onOpenRegister} style={{
            background: "linear-gradient(135deg,#0f3d38,#0d9488)", color: "white",
            border: "none", padding: "8px 18px", borderRadius: 99, fontSize: 13, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 4px 12px rgba(13,148,136,0.35)"
          }}>{lang === "en" ? "Register" : "Iyandikishe"}</button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{
        backgroundImage: "linear-gradient(180deg, rgba(15,61,56,0.88) 0%, rgba(2,34,35,0.94) 100%), url('/farm_bg.png')",
        backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed",
        padding: "88px 24px", textAlign: "center", color: "white"
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 99, padding: "6px 16px", fontSize: 12, fontWeight: 700, marginBottom: 24
          }}>
            <LocationIcons.MapPin style={{ marginRight: 6, color: "#5eead4" }} /> {lang === "en" ? "Bugesera District · Rwanda · ML-Powered Agriculture" : "Akarere ka Bugesera · Rwanda · Ubuhinzi bw'Ikoranabuhanga"}
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 900, lineHeight: 1.15, marginBottom: 20, letterSpacing: "-0.5px" }}>
            {lang === "en" ? <>Grow Smarter.<br /><span style={{ color: "#5eead4" }}>Predict Your Harvest.</span></> : <>Hinga Kijyambere.<br /><span style={{ color: "#5eead4" }}>Teganya Umusaruro Wawe.</span></>}
          </h1>
          <p style={{ fontSize: 16, opacity: 0.88, lineHeight: 1.7, maxWidth: 580, margin: "0 auto 36px" }}>
            {lang === "en"
              ? "Bugesera District's official ML-powered harvest prediction portal. Get accurate yield forecasts, climate analysis, and expert recommendations, all in one place."
              : "Urubuga rw'akarere ka Bugesera rugufasha guteganya umusaruro w'imyaka ukoresheje ML. Bona igereranya ry'umusaruro, isuzuma ry'ibihe, n'inama z'inzobere, byose ahantu hamwe."}
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
            <button onClick={onOpenRegister} style={{
              background: "linear-gradient(135deg,#0f3d38,#0d9488)", color: "white",
              border: "none", padding: "14px 34px", borderRadius: 999, fontSize: 15, fontWeight: 800,
              cursor: "pointer", boxShadow: "0 18px 50px rgba(13,148,136,0.24)", display: "flex", alignItems: "center", gap: 10,
              minWidth: 200
            }}>
              <StatusIcons.Target style={{ marginRight: 8, color: "white" }} /> {lang === "en" ? "Get Started Free" : "Tangira Ubuntu"}
            </button>
            <button onClick={onOpenLogin} style={{
              background: "rgba(255,255,255,0.14)", color: "white",
              border: "1px solid rgba(255,255,255,0.28)", padding: "14px 30px", borderRadius: 999,
              fontSize: 15, fontWeight: 700, cursor: "pointer", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", gap: 8,
              minWidth: 180
            }}>
              <LuLock size={16} color="white" /> {lang === "en" ? "Sign In" : "Injira"}
            </button>
          </div>
          {/* Stats row */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 18,
            marginTop: 48,
            justifyItems: "center",
            width: "100%",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 30,
            padding: "22px",
            boxShadow: "0 25px 60px rgba(15,23,42,0.08)"
          }}>
            {[
              { val: "1",              lbl: lang === "en" ? "Sectors Covered" : "Imirenge" },
              { val: modelAccuracy ? `${modelAccuracy}%` : "…", lbl: lang === "en" ? "Prediction Reliability" : "Urwego rwo Kwizera" },
              { val: "2",              lbl: lang === "en" ? "Crop Types" : "Ubwoko bw'Ibihingwa" },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center", minWidth: 140, background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.22)", borderRadius: 22, padding: "24px 18px", minHeight: 120, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ fontSize: 34, fontWeight: 900, color: "#5eead4", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>{s.val}</div>
                <div style={{ fontSize: 12, opacity: 0.85, marginTop: 10, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase" }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ padding: "72px 24px", background: "#f8fbfc" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#ccfbf1", color: "#0f766e", borderRadius: 99, padding: "6px 16px", fontSize: 12, fontWeight: 800, marginBottom: 14 }}>
              <CommonIcons.Info style={{ color: "#0f766e" }} />
              {lang === "en" ? "How It Works" : "Uko Bikora"}
            </div>
            <h2 style={{ fontSize: 30, fontWeight: 900, color: "#0f172a", margin: "0 0 12px", letterSpacing: "-0.3px" }}>
              {lang === "en" ? "How the Harvest Prediction System Works?" : "Uko Sisitemu yo Guteganya Imyaka Ikora?"}
            </h2>
            <p style={{ fontSize: 15, color: "#64748b", maxWidth: 520, margin: "0 auto", lineHeight: 1.6 }}>
              {lang === "en"
                ? "Three simple steps to get your personalized harvest forecast powered by machine learning."
                : "Intambwe eshatu zoroshye kugira ngo ubone igereranya ry'umusaruro wawe rikoresheje machine learning."}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
            {[
              {
                step: "01", icon: <Sprout size={28} color="#0f766e" />, color: "#dcfce7", iconColor: "#0f766e",
                title: lang === "en" ? "Enter Your Farm Details" : "Injiza Amakuru y'Umurima",
                desc: lang === "en"
                  ? "Select your sector, choose your crop (Maize or Rice), enter your farm size and planting/planted date. The system auto-detects your soil type."
                  : "Hitamo umurenge wawe, ubwoko bw'igihingwa (Ibigori cyangwa Umuceri), wandike ubuso bw'umurima n'itariki yo gutera/wateje. Sisitemu izahita imenya ubwoko bw'ubutaka."
              },
              {
                step: "02", icon: <CloudRain size={28} color="#0d9488" />, color: "#ccfbf1", iconColor: "#0d9488",
                title: lang === "en" ? "Auto Climate Analysis" : "Isuzuma ry'Ibihe Bwite",
                desc: lang === "en"
                  ? "The system automatically loads historical climate data (rainfall, temperature, humidity, sunshine hours) for your exact sector in Bugesera."
                  : "Sisitemu izahita izana amakuru y'ibihe (imvura, ubushyuhe, ubuhehere, amasaha y'izuba) y'umurenge wawe mu Bugesera."
              },
              {
                step: "03", icon: <Trophy size={28} color="#d97706" />, color: "#fef3c7", iconColor: "#d97706",
                title: lang === "en" ? "Get ML Yield Forecast" : "Bona Igereranya ry'Umusaruro",
                desc: lang === "en"
                  ? "Receive your predicted yield in kg/are, total harvest estimate, confidence score, and personalized recommendations to maximize your crop value."
                  : "Bona umusaruro wateganyijwe mu kg/are, igiteganyo cy'isarura ryose, amanota y'inyemeza, n'inama zigufasha kwongera agaciro k'imyaka yawe."
              }
            ].map((w, i) => (
              <div key={i} style={{
                background: "white", border: "1px solid rgba(15,23,42,0.08)", borderRadius: 28,
                padding: 28, position: "relative", overflow: "hidden",
                boxShadow: "0 18px 42px rgba(15,23,42,0.08)", transition: "all 0.3s ease"
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.08)"; e.currentTarget.style.borderColor = "#5eead4"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
              >
                <div style={{ position: "absolute", top: 20, right: 20, fontSize: 48, fontWeight: 900, color: "#f1f5f9", fontFamily: "monospace", lineHeight: 1 }}>{w.step}</div>
                <div style={{ width: 52, height: 52, background: w.color, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 18, boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.05)" }}>
                  {w.icon}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", marginBottom: 10 }}>{w.title}</h3>
                <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.65, margin: 0 }}>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benchmarks ── */}
      <section style={{ padding: "64px 24px", background: "linear-gradient(135deg,#0f3d38,#0f766e)" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: "white", marginBottom: 8 }}>
            <LineChart style={{ display: "inline", marginRight: 8, width: 24, height: 24, color: "white" }} /> {lang === "en" ? "Bugesera District Yield Benchmarks" : "Impuzandengo y'Imyaka mu Karere ka Bugesera"}
          </h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", marginBottom: 36 }}>
            {lang === "en" ? "Based on 2020–2024 agricultural data from 15 sectors" : "Bigendeye ku makuru y'ubuhinzi 2020–2024 avuye mu mirenge 15"}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18 }}>
            {[
              { crop: lang === "en" ? "Maize" : "Ibigori", icon: <Leaf size={36} color="#22c55e" />, value: benchmarks.Maize, tip: lang === "en" ? "DAP + CAN advised" : "DAP + CAN birasabwa" },
              { crop: lang === "en" ? "Rice" : "Umuceri", icon: <Droplets size={36} color="#38bdf8" />, value: benchmarks.Rice, tip: lang === "en" ? "Urea at tillering" : "Urea irakenewe" }
            ].map(b => (
              <div key={b.crop} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 22, padding: "26px 18px", backdropFilter: "blur(12px)" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{b.icon}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 }}>{b.crop}</div>
                <div style={{ fontSize: 36, fontWeight: 900, color: "#5eead4", fontFamily: "monospace", margin: "6px 0" }}>{Number(b.value).toFixed(1)}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>kg/are avg · {b.tip}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "64px 24px", background: "#f0fdfa", textAlign: "center" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ background: "white", borderRadius: 32, padding: "42px 36px", boxShadow: "0 30px 80px rgba(15,23,42,0.08)", border: "1px solid rgba(15,23,42,0.06)" }}>
            <h2 style={{ fontSize: 30, fontWeight: 900, color: "#0f3d38", marginBottom: 16 }}>
              {lang === "en" ? "Ready to predict your harvest?" : "Witeguye guteganya umusaruro wawe?"}
            </h2>
            <p style={{ fontSize: 15, color: "#475569", marginBottom: 32, lineHeight: 1.8, maxWidth: 650, margin: "0 auto 32px" }}>
              {lang === "en"
                ? "Join farmers across Bugesera District using ML to plan smarter seasons."
                : "Injira mu bahinzi bo mu Karere ka Bugesera bakoresha ML gutegura ibihe by'ihinga neza."}
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
            <button onClick={onOpenRegister} style={{
              background: "linear-gradient(135deg,#0f3d38,#0d9488)", color: "white",
              border: "none", padding: "14px 34px", borderRadius: 999, fontSize: 15, fontWeight: 800,
              cursor: "pointer", boxShadow: "0 18px 45px rgba(13,148,136,0.22)", minWidth: 210
            }}>
              {lang === "en" ? "Create Free Account" : "Fungura Konti Ubuntu"}
            </button>
            <button onClick={onOpenLogin} style={{
              background: "white", border: "1.5px solid #0d9488", color: "#0d9488",
              padding: "14px 30px", borderRadius: 999, fontSize: 15, fontWeight: 700, cursor: "pointer",
              minWidth: 180
            }}>
              {lang === "en" ? "Sign In" : "Injira"}
            </button>
          </div>
        </div>
      </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: "#0f172a", color: "rgba(255,255,255,0.5)", padding: "20px 24px", textAlign: "center", fontSize: 12 }}>
        <CheckCircle size={14} color="white" style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} /> {lang === "en" ? "Bugesera Harvest Prediction System" : "Sisitemu yo Guteganya Imyaka ya Bugesera"} · UNIVERSITY OF KIGALI · 2024
      </footer>
    </div>
  );
}

