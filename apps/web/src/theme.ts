import { alpha, createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#165d52", dark: "#0d463d", light: "#d9eee9" },
    secondary: { main: "#d16f3f" },
    background: { default: "#f5f6f1", paper: "#ffffff" },
    text: { primary: "#17211f", secondary: "#66716e" },
    divider: "#dfe4df",
  },
  typography: {
    fontFamily: 'Inter, "Segoe UI", sans-serif',
    h1: {
      fontFamily: '"DM Serif Display", Georgia, serif',
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
        tooltip: { backgroundColor: alpha("#17211f", 0.92) },
      },
    },
  },
});
