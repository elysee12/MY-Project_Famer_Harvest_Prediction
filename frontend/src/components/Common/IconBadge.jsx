import React from "react";

/**
 * Reusable circular icon badge component
 * @param {JSX.Element} icon - The icon component to display
 * @param {string} bgColor - Background color (CSS color value or CSS variable)
 * @param {number} size - Badge diameter in pixels (default: 56)
 * @param {string} className - Additional CSS classes
 */
export default function IconBadge({ icon, bgColor = "var(--g500)", size = 56, className = "" }) {
  return (
    <div
      className={`icon-badge ${className}`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: bgColor,
        color: "white",
        boxShadow: `0 4px 12px rgba(0, 0, 0, 0.15)`,
      }}
    >
      {icon}
    </div>
  );
}
