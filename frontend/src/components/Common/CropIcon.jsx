import React from "react";
import { Leaf, Sprout, Droplets } from "lucide-react";

export default function CropIcon({ name, style, size = 24, color = "white" }) {
  const iconStyle = { ...style, width: size, height: size, color: color };
  
  switch (name) {
    case "Maize":
      return <Leaf style={iconStyle} />;
    case "Beans":
      return <Sprout style={iconStyle} />;
    case "Rice":
      return <Droplets style={iconStyle} />;
    default:
      return <Sprout style={iconStyle} />;
  }
}
