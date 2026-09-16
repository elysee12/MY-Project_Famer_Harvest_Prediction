import React, { useState, useEffect } from 'react';
import { LuMessageSquare } from 'react-icons/lu';

export default function SmsNotification({ sms, onClear }) {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (sms) {
      setClosing(false);
      const t1 = setTimeout(() => setClosing(true), 6000);
      const t2 = setTimeout(onClear, 6700);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [sms, onClear]);

  if (!sms) return null;

  const handleDismiss = () => {
    setClosing(true);
    setTimeout(onClear, 300);
  };

  return (
    <div className="sms-overlay">
      <div className={`sms-card ${closing ? "hide" : ""}`}>
        <div className="sms-icon-bx"><LuMessageSquare size={22} /></div>
        <div className="sms-content" onClick={handleDismiss}>
          <div className="sms-header">
            <span className="sms-app">Messages</span>
            <span className="sms-time">Now</span>
          </div>
          <div className="sms-sender">Bugesera Harvest System</div>
          <div className="sms-body">
            Success! Your account is ready. Your ID is <strong>{sms.nid}</strong>. Welcome to smart farming!
          </div>
          <div className="sms-actions" style={{ marginTop: 8, borderTop: "1px solid #eee", paddingTop: 8, textAlign: "right" }}>
            <button onClick={(e) => { e.stopPropagation(); handleDismiss(); }} 
              style={{ background: "none", border: "none", color: "#007AFF", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              No thanks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
