export interface EmbedBranding {
  logoUrl?: string; // URL zum Logo (oben links)
  primaryColor?: string; // Akzentfarbe (Buttons, Hotspot-Glow)
  fontFamily?: string; // Google Font Name oder "system-ui"
  hideWatermark?: boolean; // ExhibitXR Wasserzeichen ausblenden (nur Pro)
  customCss?: string; // Optional: custom CSS injection (nur Enterprise)
}
