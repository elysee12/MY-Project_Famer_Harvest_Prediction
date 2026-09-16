/**
 * Toast — lightweight in-app notification system.
 *
 * Usage:
 *   import { useToast, ToastContainer } from '../../components/Common/Toast';
 *
 *   const { toasts, showToast } = useToast();
 *
 *   showToast('Member approved!', 'success');
 *   showToast('Something went wrong', 'error');
 *   showToast('Please fill all fields', 'warning');
 *   showToast('Data saved', 'info');
 *
 *   // Render once near the root of the page:
 *   <ToastContainer toasts={toasts} />
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  LuCircleCheck as CheckCircle,
  LuCircleX as XCircle,
  LuTriangleAlert as AlertTriangle,
  LuInfo as Info,
  LuX as X,
} from 'react-icons/lu';

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, showToast, removeToast };
}

// ── Single Toast item ─────────────────────────────────────────────────────────
function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Slide in
    const t1 = setTimeout(() => setVisible(true), 10);
    // Auto-dismiss
    const t2 = setTimeout(() => dismiss(), toast.duration || 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const dismiss = () => {
    setLeaving(true);
    setTimeout(() => onRemove(toast.id), 320);
  };

  const config = {
    success: {
      bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
      border: '#10b981',
      icon: <CheckCircle size={20} color="#059669" />,
      title: 'Success',
      titleColor: '#065f46',
      textColor: '#047857',
      progressColor: '#10b981',
    },
    error: {
      bg: 'linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%)',
      border: '#f87171',
      icon: <XCircle size={20} color="#dc2626" />,
      title: 'Error',
      titleColor: '#7f1d1d',
      textColor: '#991b1b',
      progressColor: '#ef4444',
    },
    warning: {
      bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      border: '#fbbf24',
      icon: <AlertTriangle size={20} color="#d97706" />,
      title: 'Warning',
      titleColor: '#78350f',
      textColor: '#92400e',
      progressColor: '#f59e0b',
    },
    info: {
      bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
      border: '#60a5fa',
      icon: <Info size={20} color="#2563eb" />,
      title: 'Info',
      titleColor: '#1e3a8a',
      textColor: '#1d4ed8',
      progressColor: '#3b82f6',
    },
  };

  const c = config[toast.type] || config.info;
  const duration = toast.duration || 4000;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        background: c.bg,
        border: `1.5px solid ${c.border}`,
        borderRadius: 14,
        padding: '14px 16px',
        minWidth: 300,
        maxWidth: 420,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.32s cubic-bezier(0.34,1.56,0.64,1)',
        opacity: visible && !leaving ? 1 : 0,
        transform: visible && !leaving
          ? 'translateX(0) scale(1)'
          : 'translateX(60px) scale(0.96)',
        cursor: 'default',
      }}
    >
      {/* Icon */}
      <div style={{ flexShrink: 0, marginTop: 1 }}>{c.icon}</div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: c.titleColor, marginBottom: 3 }}>
          {c.title}
        </div>
        <div style={{ fontSize: 13, color: c.textColor, lineHeight: 1.5, wordBreak: 'break-word' }}>
          {toast.message}
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={dismiss}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 2, borderRadius: 6, flexShrink: 0, marginTop: -2,
          color: c.textColor, opacity: 0.6, display: 'flex', alignItems: 'center',
        }}
        aria-label="Dismiss"
      >
        <X size={15} />
      </button>

      {/* Progress bar */}
      <div
        style={{
          position: 'absolute', bottom: 0, left: 0, height: 3,
          background: c.progressColor, borderRadius: '0 0 14px 14px',
          animation: `toast-progress ${duration}ms linear forwards`,
        }}
      />
    </div>
  );
}

// ── Container rendered at page root ──────────────────────────────────────────
export function ToastContainer({ toasts, onRemove }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          pointerEvents: 'none',
        }}
      >
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'all' }}>
            <ToastItem toast={t} onRemove={onRemove} />
          </div>
        ))}
      </div>
    </>
  );
}
