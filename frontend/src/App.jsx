import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { API_BASE } from "./constants/constants";
import { X } from "lucide-react";

// ── Auth & Public Pages ───────────────────────────────────────────────────────
import WelcomePage        from "./pages/Home/WelcomePage";
import Login              from "./pages/Auth/Login";
import Register           from "./pages/Auth/Register";
import ForgotPassword     from "./pages/Auth/ForgotPassword";

// ── Farmer Pages ──────────────────────────────────────────────────────────────
import FarmerDashboard    from "./pages/Farmer/FarmerDashboard";
import CooperativeDashboard from "./pages/Farmer/CooperativeDashboard";
import PredictScreen      from "./pages/Farmer/PredictScreen";
import ResultScreen       from "./pages/Farmer/ResultScreen";
import HistoryScreen      from "./pages/Farmer/HistoryScreen";
import WeatherScreen      from "./pages/Farmer/WeatherScreen";
import TipsScreen         from "./pages/Farmer/TipsScreen";
import NotificationsScreen from "./pages/Farmer/NotificationsScreen";
import ProfileScreen      from "./pages/Farmer/Profile/ProfileScreen";
import EditProfileScreen  from "./pages/Farmer/Profile/EditProfileScreen";
import ChangePasswordScreen from "./pages/Farmer/Profile/ChangePasswordScreen";
import LanguageScreen     from "./pages/Farmer/Profile/LanguageScreen";
import AboutAppScreen     from "./pages/Farmer/Profile/AboutAppScreen";

// ── Sector Officer Pages ───────────────────────────────────────────────────────
import SectorOfficerDashboard from "./pages/SectorOfficer/SectorOfficerDashboard";

// ── District Admin Pages ───────────────────────────────────────────────────────
import DistrictAdminDashboard from "./pages/DistrictAdmin/DistrictAdminDashboard";

// ── Common Components ─────────────────────────────────────────────────────────
import Sidebar            from "./components/Common/Sidebar";
import BottomNav          from "./components/Common/BottomNav";
import SmsNotification    from "./components/Common/SmsNotification";

// ── Inline CSS injection for styles not covered by index.css ──────────────────
const EXTRA_CSS = `
  .bottom-nav{display:flex}
  @media(min-width:768px){.bottom-nav{display:none}}
  .farmer-row{display:flex;justify-content:space-between;align-items:center;background:white;border:1px solid var(--s200);border-radius:var(--radius);padding:14px;margin-bottom:10px;cursor:pointer;transition:box-shadow .2s,transform .15s}
  .farmer-row:hover{box-shadow:var(--shadow);transform:translateX(2px)}
  .hvr{transition:box-shadow .2s,transform .2s}
  .hvr:hover{box-shadow:var(--shadow-md);transform:translateY(-2px)}
  .demo-pill{background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.3);color:white;border-radius:99px;padding:6px 14px;font-family:'Outfit',sans-serif;font-size:12px;font-weight:700;cursor:pointer;transition:background .2s}
  .demo-pill:hover{background:rgba(255,255,255,.3)}
  .pill-tabs{display:flex;gap:8px;flex-wrap:wrap}
  .pill-tab{padding:7px 16px;border-radius:99px;border:1.5px solid var(--s200);background:white;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;font-weight:600;color:var(--s600);transition:all .2s}
  .pill-tab:hover{border-color:var(--g400)}
  .pill-tab.act{border-color:var(--g600);background:var(--g100);color:var(--g800)}
  .avatar-sm{width:36px;height:36px;border-radius:10px;background:var(--g100);display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--g700);flex-shrink:0}
  .officer-chip{display:inline-flex;align-items:center;gap:8px;background:var(--g50);border:1px solid var(--g200);border-radius:99px;padding:6px 14px;font-size:12px;font-weight:700;color:var(--g800);margin-bottom:16px}
  .bar-row{display:flex;align-items:center;gap:12px;margin-bottom:12px}
  .bar-lbl{width:60px;font-size:12px;font-weight:700;color:var(--s700)}
  .bar-track{flex:1;height:8px;background:var(--s100);border-radius:99px;overflow:hidden}
  .bar-fill{height:100%;border-radius:99px;transition:width .6s ease}
  .bar-val{width:60px;text-align:right;font-size:12px;font-weight:700;color:var(--s600)}
  .notif-badge{position:absolute;top:-4px;right:-4px;width:16px;height:16px;background:var(--red,#ef4444);color:white;border-radius:50%;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center}
  .auth-modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,.72);display:flex;align-items:center;justify-content:center;padding:20px;z-index:1200;backdrop-filter:blur(6px)}
  .auth-modal-panel{
    width:min(520px,100%);
    max-height:calc(100vh - 40px);
    overflow-y:auto;
    border-radius:28px;
    box-shadow:0 24px 80px rgba(15,23,42,.35);
    background: radial-gradient(circle, rgba(17, 83, 40, 0.40) 0%, rgba(5, 38, 15, 0.82) 100%), url('/farm_bg.png');
    background-size: cover;
    background-position: center;
    position: relative;
    padding: 10px;
  }
  .auth-modal-panel::-webkit-scrollbar{display:none}
  .auth-modal-close{position:absolute;top:18px;right:18px;width:40px;height:40px;border-radius:999px;border:0;background:rgba(255,255,255,.12);color:white;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;z-index:10}
  .auth-modal-close:hover{background:rgba(255,255,255,.2)}
`;

function GlobalStyle() {
  return createPortal(<style>{EXTRA_CSS}</style>, document.head);
}

const dashboardPathForRole = (role) => {
  if (role === "admin" || role === "district") return "/admin";
  if (role === "sector" || role === "officer") return "/sector";
  if (role === "cooperative") return "/cooperative";
  return "/farmer";
};

// ── App Root ──────────────────────────────────────────────────────────────────
export default function App() {
  const [user,          setUser]          = useState(null);
  const [authMode,      setAuthMode]      = useState("welcome");   // welcome | login | register | forgot
  const [screen,        setScreen]        = useState("dashboard");  // farmer screen key
  const [history,       setHist]          = useState([]);
  const [result,        setResult]        = useState(null);
  const [lang,          setLang]          = useState("en");
  const [sms,           setSms]           = useState(null);
  const [notifications, setNotifications] = useState([]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const nav      = (s) => setScreen(s);
  const saveRes  = (r) => setHist((prev) => [r, ...prev]);
  const addNotif = (title, message) =>
    setNotifications((prev) => [
      { id: Date.now().toString(), title, message, date: new Date().toISOString(), read: false },
      ...prev,
    ]);

  const logout = () => {
    setUser(null);
    setAuthMode("welcome");
    setScreen("dashboard");
    setHist([]);
    setResult(null);
    setNotifications([]);
    window.history.replaceState(null, "", "/");
  };

  const openAuthModal = (mode) => setAuthMode(mode);
  const closeAuthModal = () => setAuthMode("welcome");

  const handleLogin = (u) => {
    console.log('🔵 HANDLE LOGIN CALLED');
    console.log('🔵 User object received:', JSON.stringify(u, null, 2));
    console.log('🔵 User role:', u.role);
    console.log('🔵 Is cooperative?:', u.role === 'cooperative');
    
    setUser(u);
    setAuthMode("welcome");
    setScreen("dashboard");
    window.history.replaceState(null, "", dashboardPathForRole(u.role));
  };

  useEffect(() => {
    if (!user) {
      window.history.replaceState(null, "", "/");
      return;
    }
    window.history.replaceState(null, "", dashboardPathForRole(user.role));
  }, [user]);

  // ── Fetch farmer/cooperative data after login ──────────────────────────────────────────
  useEffect(() => {
    if (!user || (user.role !== "farmer" && user.role !== "cooperative")) return;

    // Fetch prediction history
    fetch(`${API_BASE}/api/predictions?farmer_id=${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.predictions) {
          setHist(
            data.predictions.map((p) => ({
              ...p,
              id: p.prediction_id || p.id,
              crop: p.crop || p.crop_type || "Maize",
              timestamp: p.timestamp || p.created_at || new Date().toISOString(),
              sector: p.sector || p.sector_name || user.sector || "Bugesera",
            }))
          );
        }
      })
      .catch(() => setHist([]));

    // Fetch advice / notifications
    fetch(`${API_BASE}/api/notifications/${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.advice) {
          setNotifications(
            data.advice.map((a) => ({
              id: a.id || a.advice_id,
              title: a.subject || (lang === "en" ? "Agriculture Advice" : "Inama ku Buhinzi"),
              message: a.message,
              date: a.created_at || new Date().toISOString(),
              read: false,
              sender:
                a.officer_type === "district"
                  ? `${a.officer_name} (District)`
                  : `${a.officer_name} (${a.officer_sector || "Sector"})`,
            }))
          );
        }
      })
      .catch(() => {});
  }, [user]);

  // ── Shared props passed to most farmer pages ─────────────────────────────
  const sharedProps = { lang, setLang, notifications, setNotifications };

  // ── Not logged in → Welcome / Auth flow ───────────────────────────────────
  if (!user) {
    return (
      <>
        <GlobalStyle />
        <SmsNotification sms={sms} onClear={() => setSms(null)} />

        <WelcomePage
          lang={lang}
          setLang={setLang}
          onOpenLogin={() => openAuthModal("login")}
          onOpenRegister={() => openAuthModal("register")}
        />

        {authMode !== "welcome" && (
          <div className="auth-modal-overlay" onClick={closeAuthModal}>
            <div className="auth-modal-panel" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="auth-modal-close" aria-label="Close" onClick={closeAuthModal}>
                <X size={20} />
              </button>
              {authMode === "login" && (
                <Login
                  lang={lang}
                  setLang={setLang}
                  onLogin={handleLogin}
                  onRegister={() => openAuthModal("register")}
                  onForgot={() => openAuthModal("forgot")}
                  onBack={closeAuthModal}
                  setSms={setSms}
                  addNotif={addNotif}
                  isModal
                />
              )}

              {authMode === "register" && (
                <Register
                  lang={lang}
                  setLang={setLang}
                  onLogin={() => openAuthModal("login")}
                  onBack={() => openAuthModal("login")}
                  onNavigate={(page) => {
                    if (page === "login") openAuthModal("login");
                    if (page === "welcome") closeAuthModal();
                  }}
                  setSms={setSms}
                  isModal
                />
              )}

              {authMode === "forgot" && (
                <ForgotPassword
                  lang={lang}
                  setLang={setLang}
                  onBack={() => openAuthModal("login")}
                  onNavigate={(page) => {
                    if (page === "login") openAuthModal("login");
                  }}
                  isModal
                />
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  // ── System Admin ──────────────────────────────────────────────────────────
  if (user.role === "admin" || user.role === "district") {
    return (
      <>
        <GlobalStyle />
        <SmsNotification sms={sms} onClear={() => setSms(null)} />
        <DistrictAdminDashboard
          user={user}
          onLogout={logout}
          lang={lang}
          setLang={setLang}
        />
      </>
    );
  }

  // ── Sector Officer ────────────────────────────────────────────────────────
  if (user.role === "sector" || user.role === "officer") {
    return (
      <>
        <GlobalStyle />
        <SmsNotification sms={sms} onClear={() => setSms(null)} />
        <SectorOfficerDashboard
          user={user}
          onLogout={logout}
          lang={lang}
          setLang={setLang}
        />
      </>
    );
  }

  // ── Farmer/Cooperative Dashboard ─────────────────────────────────────────────────────
  const renderScreen = () => {
    switch (screen) {
      case "dashboard":
        // Use CooperativeDashboard for cooperative members, FarmerDashboard for farmers
        console.log('🟢 RENDERING DASHBOARD');
        console.log('🟢 User role:', user?.role);
        console.log('🟢 Should show cooperative?:', user?.role === "cooperative");
        const DashboardComponent = user.role === "cooperative" ? CooperativeDashboard : FarmerDashboard;
        console.log('🟢 Dashboard component:', DashboardComponent === CooperativeDashboard ? 'COOPERATIVE (Blue)' : 'FARMER (Green)');
        return (
          <DashboardComponent
            user={user}
            onNavigate={nav}
            history={history}
            onResult={(p) => { setResult(p); nav("result"); }}
            {...sharedProps}
          />
        );
      case "predict":
        return (
          <PredictScreen
            user={user}
            onNavigate={nav}
            onResult={(p) => { setResult(p); nav("result"); }}
            onSave={saveRes}
            history={history}
            {...sharedProps}
          />
        );
      case "result":
        return (
          <ResultScreen
            result={result}
            onNavigate={nav}
            onSave={saveRes}
            history={history}
            {...sharedProps}
          />
        );
      case "history":
        return (
          <HistoryScreen
            predictions={history}
            onNavigate={nav}
            setSelectedPred={(p) => { setResult(p); nav("result"); }}
            user={user}
            {...sharedProps}
          />
        );
      case "weather":
        return <WeatherScreen onNavigate={nav} user={user} {...sharedProps} />;
      case "tips":
        return <TipsScreen onNavigate={nav} user={user} {...sharedProps} />;
      case "notifications":
        return (
          <NotificationsScreen
            onNavigate={nav}
            notifications={notifications}
            setNotifications={setNotifications}
            user={user}
            {...sharedProps}
          />
        );
      case "profile":
        return <ProfileScreen user={user} onNavigate={nav} onLogout={logout} {...sharedProps} />;
      case "edit-profile":
        return <EditProfileScreen user={user} onNavigate={nav} setUser={setUser} {...sharedProps} />;
      case "change-password":
        return <ChangePasswordScreen user={user} onNavigate={nav} {...sharedProps} />;
      case "language":
        return <LanguageScreen onNavigate={nav} {...sharedProps} />;
      case "about":
        return <AboutAppScreen onNavigate={nav} {...sharedProps} />;
      default:
        return (
          <FarmerDashboard
            user={user}
            onNavigate={nav}
            history={history}
            onResult={(p) => { setResult(p); nav("result"); }}
            {...sharedProps}
          />
        );
    }
  };

  return (
    <>
      <GlobalStyle />
      <SmsNotification sms={sms} onClear={() => setSms(null)} />
      <div className="web-layout">
        <Sidebar
          current={screen}
          onNavigate={nav}
          user={user}
          onLogout={logout}
          lang={lang}
          setLang={setLang}
        />
        <div className="main-content">
          <div className="shell">
            {renderScreen()}
          </div>
          <BottomNav current={screen} onNavigate={nav} lang={lang} user={user} />
        </div>
      </div>
    </>
  );
}
