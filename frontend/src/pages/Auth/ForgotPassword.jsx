import React, { useState } from 'react';
import { T, API_BASE } from '../../constants/constants';

export default function ForgotPassword({ lang, setLang, onBack, isModal }) {
  const t = T[lang];
  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confPw, setConfPw] = useState("");
  const [role, setRole] = useState("farmer");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [step, setStep] = useState(1); // 1: Request, 2: Verify & Reset

  const isValidGmail = (value) => {
    const emailValue = value.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(emailValue) && emailValue.endsWith('@gmail.com');
  };

  const handleRequestOtp = async () => {
    setError("");
    setSuccess("");
    if (!resetEmail.trim()) {
      setError(lang === "en" ? "Email is required." : "Iimeyili irakenewe.");
      return;
    }
    if (!isValidGmail(resetEmail)) {
      setError(lang === "en" ? "Please use a valid Gmail address." : "Koresha iimeyili ya Gmail ifatika.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/forgot-password/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail.trim(), role })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(lang === "en" ? "OTP sent to your email!" : "OTP yoherejwe kuri iimeyili yawe!");
        setStep(2);
      } else {
        setError(data.error || (lang === "en" ? "Failed to send OTP." : "Gucunga OTP byanze."));
      }
    } catch (e) {
      setError(lang === "en" ? "Network error." : "Ikibazo cy'itumanaho.");
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    setError("");
    setSuccess("");
    
    if (!otp || !newPw || !confPw) {
      setError(t.allRequired);
      return;
    }
    
    if (newPw !== confPw) {
      setError(t.pwMismatch);
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/forgot-password/verify`, {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail.trim(), otp, new_password: newPw })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(t.resetDone);
        setTimeout(() => {
          onBack();
        }, 2000);
      } else {
        setError(data.error || (lang === "en" ? "Invalid OTP or reset failed." : "OTP ntiyemewe cyangwa guhindura byanze."));
      }
    } catch (e) {
      setError(lang === "en" ? "Network error." : "Ikibazo cy'itumanaho.");
    }
    setLoading(false);
  };

  const containerContent = (
    <div className="auth-container" style={{ margin: isModal ? "0 auto" : undefined }}>
      
      {/* Title and subtitle outside the card */}
      <div className="auth-title-container" style={{ marginTop: 20 }}>
        <h1 className="auth-title-main">{t.appName}</h1>
        <p className="auth-title-sub">{t.appSub}</p>
      </div>

      <div className="auth-card">
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}><i className="bi bi-unlock"></i></div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--g900)", margin: 0 }}>{t.forgotTitle}</h2>
          <p style={{ fontSize: 12, color: "var(--s500)", marginTop: 4, lineHeight: 1.5 }}>{t.forgotSub}</p>
        </div>

        {error && (
          <div style={{ background:'linear-gradient(135deg,#fff5f5,#fee2e2)', border:'1.5px solid #fca5a5', borderRadius:14, padding:'16px 20px', marginBottom:16, display:'flex', alignItems:'flex-start', gap:12 }}>
            <div style={{ width:34, height:34, background:'#dc2626', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <i className="bi bi-exclamation-lg" style={{ color:'white', fontSize:16 }}></i>
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:13, color:'#7f1d1d', marginBottom:3 }}>Error</div>
              <div style={{ fontSize:13, color:'#991b1b', lineHeight:1.5 }}>{error}</div>
            </div>
          </div>
        )}
        {success && (
          <div style={{ background:'linear-gradient(135deg,#f0fdfa,#ccfbf1)', border:'1.5px solid #5eead4', borderRadius:14, padding:'16px 20px', marginBottom:16, display:'flex', alignItems:'flex-start', gap:12 }}>
            <div style={{ width:34, height:34, background:'#0d9488', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <i className="bi bi-check-lg" style={{ color:'white', fontSize:16 }}></i>
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:13, color:'#0f3d38', marginBottom:3 }}>Success</div>
              <div style={{ fontSize:13, color:'#0f766e', lineHeight:1.5 }}>{success}</div>
            </div>
          </div>
        )}

        {step === 1 ? (
          <>
            <div className="fgrp">
              <label className="flabel"><i className="bi bi-person-badge"></i> Account Role</label>
              <select className="academic-input" value={role} onChange={e => setRole(e.target.value)}>
                <option value="farmer">Farmer</option>
                <option value="officer">Agricultural Officer</option>
              </select>
            </div>

            <div className="fgrp">
              <label className="flabel"><i className="bi bi-envelope"></i> Email Address</label>
              <input 
                className="academic-input" 
                placeholder="user@example.com"
                value={resetEmail} 
                onChange={e => setResetEmail(e.target.value)}
              />
            </div>

            <button className="auth-btn" onClick={handleRequestOtp} disabled={loading || !resetEmail}>
              {loading ? <><div className="spin" />{"Sending OTP…"}</> : (lang === "en" ? "Send OTP" : "Ohereza OTP")}
            </button>
          </>
        ) : (
          <>
            <div className="fgrp">
              <label className="flabel"><i className="bi bi-shield-lock"></i> {lang === "en" ? "Verification OTP" : "OTP yo kwemeza"}</label>
              <input 
                className="academic-input" 
                placeholder="Enter 6-digit OTP"
                value={otp} 
                onChange={e => setOtp(e.target.value)}
                maxLength={6}
              />
            </div>

            <div className="fgrp" style={{ position: "relative" }}>
              <label className="flabel"><i className="bi bi-lock"></i> {t.newPwLabel}</label>
              <input 
                className="academic-input" 
                type={showPw ? "text" : "password"} 
                placeholder={t.newPwLabel}
                value={newPw} 
                onChange={e => setNewPw(e.target.value)} 
                style={{ paddingRight: 46 }}
              />
              <button 
                type="button"
                onClick={() => setShowPw(!showPw)} 
                className="pw-toggle" 
                style={{ fontSize: 16, top: 32, textTransform: "none", background: "none", border: "none", position: "absolute", right: 12, cursor: "pointer", color: "var(--s400)" }}
              >
                {showPw ? <i className="bi bi-eye-slash"></i> : <i className="bi bi-eye"></i>}
              </button>
            </div>

            <div className="fgrp">
              <label className="flabel"><i className="bi bi-check2-circle"></i> {t.confirmNewPw}</label>
              <input 
                className="academic-input" 
                type="password" 
                placeholder={t.confirmNewPw}
                value={confPw} 
                onChange={e => setConfPw(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleResetPassword()}
              />
            </div>

            <button className="auth-btn" onClick={handleResetPassword} disabled={loading || !otp || !newPw || !confPw}>
              {loading ? <><div className="spin" />{"Resetting…"}</> : t.resetBtn}
            </button>
            
            <div style={{ textAlign: "center", marginTop: 10 }}>
              <span onClick={() => setStep(1)} style={{ fontSize: 12, cursor: "pointer", color: "var(--p600)" }}>
                {lang === "en" ? "Back to Email" : "Gusubira kuri Iimeyili"}
              </span>
            </div>
          </>
        )}

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <span onClick={onBack} className="auth-link-forgot" style={{ fontSize: 13, cursor: "pointer" }}>
            {t.backToLogin}
          </span>
        </div>

        <div style={{ textAlign: "center", marginTop: 24, paddingTop: 16, fontSize: 11, color: "var(--s500)", fontWeight: 500 }}>
          <i className="bi bi-check2-circle" style={{ marginRight: 4 }}></i> {lang === "rw" ? "Urunyobwe rw'Ubuhinzi bwa Bugesera" : "Bugesera Agricultural System"} · UNIVERSITY OF KIGALI
        </div>
      </div>

    </div>
  );

  if (isModal) {
    return containerContent;
  }

  return (
    <div className="auth-wrap">
      {containerContent}
    </div>
  );
}

