import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initTheme } from "./store/themeStore";

// Initialize theme before render
initTheme();
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
