/**
 * Professional Agriculture Logo Component
 * Uses the actual logo.jpg from assets
 */
import logoImg from '../../assets/logo.jpg';

export function Logo({ size = 40, variant = 'default', className = '' }) {
  return (
    <div 
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.2,
        overflow: 'hidden',
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        background: '#ffffff'
      }}
    >
      <img 
        src={logoImg} 
        alt="Harvest Predictor Logo"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />
    </div>
  );
}

export function LogoWithText({ size = 40, showText = true, lang = 'en', variant = 'light' }) {
  const title = lang === 'en' ? 'Harvest Predictor' : 'Teganya Imyaka';
  const subtitle = 'Bugesera District · Rwanda';

  const textColors = {
    light: {
      title: '#ffffff',
      subtitle: 'rgba(255,255,255,0.7)'
    },
    dark: {
      title: '#1f2937',
      subtitle: '#6b7280'
    }
  };

  const colors = textColors[variant] || textColors.light;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Logo size={size} />
      {showText && (
        <div>
          <div style={{ 
            fontSize: 16, 
            fontWeight: 800, 
            color: colors.title,
            lineHeight: 1.2 
          }}>
            {title}
          </div>
          <div style={{ 
            fontSize: 10, 
            color: colors.subtitle,
            lineHeight: 1.2,
            marginTop: 2
          }}>
            {subtitle}
          </div>
        </div>
      )}
    </div>
  );
}

export default Logo;
