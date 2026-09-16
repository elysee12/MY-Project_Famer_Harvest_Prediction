/**
 * ConfirmModal — replaces window.confirm() with a beautiful dialog.
 *
 * Usage:
 *   import ConfirmModal from '../../components/Common/ConfirmModal';
 *
 *   const [confirm, setConfirm] = useState(null);
 *
 *   // Trigger:
 *   setConfirm({
 *     type: 'danger',           // 'danger' | 'warning' | 'success' | 'info'
 *     title: 'Approve Member',
 *     message: 'Are you sure you want to approve AKEZA Ange?',
 *     confirmLabel: 'Yes, Approve',
 *     cancelLabel: 'Cancel',
 *     onConfirm: () => doApprove(),
 *   });
 *
 *   // Render once per page:
 *   <ConfirmModal config={confirm} onClose={() => setConfirm(null)} />
 */

import React, { useEffect } from 'react';
import {
  LuCircleCheck as CheckCircle,
  LuCircleX as XCircle,
  LuTriangleAlert as AlertTriangle,
  LuInfo as Info,
  LuX as X,
} from 'react-icons/lu';

export default function ConfirmModal({ config, onClose }) {
  // Close on Escape key
  useEffect(() => {
    if (!config) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [config, onClose]);

  if (!config) return null;

  const types = {
    danger: {
      icon: <XCircle size={32} color="#dc2626" />,
      iconBg: '#fee2e2',
      confirmBg: 'linear-gradient(135deg, #dc2626, #ef4444)',
      confirmHover: '#b91c1c',
      titleColor: '#7f1d1d',
    },
    warning: {
      icon: <AlertTriangle size={32} color="#d97706" />,
      iconBg: '#fef3c7',
      confirmBg: 'linear-gradient(135deg, #d97706, #f59e0b)',
      confirmHover: '#b45309',
      titleColor: '#78350f',
    },
    success: {
      icon: <CheckCircle size={32} color="#059669" />,
      iconBg: '#d1fae5',
      confirmBg: 'linear-gradient(135deg, #059669, #10b981)',
      confirmHover: '#047857',
      titleColor: '#064e3b',
    },
    info: {
      icon: <Info size={32} color="#2563eb" />,
      iconBg: '#dbeafe',
      confirmBg: 'linear-gradient(135deg, #2563eb, #3b82f6)',
      confirmHover: '#1d4ed8',
      titleColor: '#1e3a8a',
    },
  };

  const t = types[config.type || 'info'];

  const handleConfirm = () => {
    config.onConfirm && config.onConfirm();
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 99998,
        background: 'rgba(15,23,42,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.18s ease',
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform:scale(0.94) translateY(16px) }
                             to   { opacity:1; transform:scale(1)    translateY(0) } }
      `}</style>

      <div
        style={{
          background: 'white',
          borderRadius: 20,
          padding: '32px 28px',
          maxWidth: 420,
          width: '90%',
          boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
          animation: 'slideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)',
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close X */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 14,
            background: '#f1f5f9', border: 'none', borderRadius: 8,
            width: 32, height: 32, display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', color: '#64748b',
          }}
        >
          <X size={16} />
        </button>

        {/* Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: t.iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
        }}>
          {t.icon}
        </div>

        {/* Title */}
        <div style={{
          fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 10,
        }}>
          {config.title || 'Confirm'}
        </div>

        {/* Message */}
        <div style={{
          fontSize: 14, color: '#475569', lineHeight: 1.65, marginBottom: 28,
        }}>
          {config.message}
        </div>

        {/* Sub-message */}
        {config.subMessage && (
          <div style={{
            fontSize: 13, color: '#94a3b8', lineHeight: 1.5,
            marginBottom: 24, marginTop: -16,
            background: '#f8fafc', borderRadius: 10, padding: '10px 14px',
            border: '1px solid #e2e8f0',
          }}>
            {config.subMessage}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9', color: '#64748b', border: 'none',
              borderRadius: 10, padding: '11px 22px',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.target.style.background = '#e2e8f0'}
            onMouseLeave={e => e.target.style.background = '#f1f5f9'}
          >
            {config.cancelLabel || 'Cancel'}
          </button>

          <button
            onClick={handleConfirm}
            style={{
              background: t.confirmBg, color: 'white', border: 'none',
              borderRadius: 10, padding: '11px 22px',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.target.style.opacity = '0.88'}
            onMouseLeave={e => e.target.style.opacity = '1'}
          >
            {config.confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
