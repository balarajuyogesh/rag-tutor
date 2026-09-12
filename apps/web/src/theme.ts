import { alpha, createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#3f3151", dark: "#2b2138", light: "#e9e2ef" },
    secondary: { main: "#a95f36", dark: "#794326", light: "#f2ded0" },
    background: { default: "#f6f1e7", paper: "#fffdf8" },
    text: { primary: "#2b2927", secondary: "#706a63" },
    divider: "#ded5c7",
  },
  typography: {
    fontFamily: 'Inter, "Segoe UI", sans-serif',
    h1: {
      fontFamily: '"DM Serif Display", "Iowan Old Style", Georgia, serif',
      fontSize: "clamp(2.1rem, 5vw, 3.5rem)",
      fontWeight: 400,
      letterSpacing: "-0.035em",
      lineHeight: 1.05,
    },
    h2: { fontWeight: 650, letterSpacing: "-0.02em" },
    button: { textTransform: "none", fontWeight: 650 },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { boxShadow: "none", borderRadius: 12 },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 9, fontWeight: 600 },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: alpha("#2b2927", 0.92) },
      },
    },
  },
});
