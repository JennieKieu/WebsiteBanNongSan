import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import ScrollToTop from "./components/ScrollToTop";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("app") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <div lang="vi" className="app-root">
      <ScrollToTop />
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4500,
          style: {
            background: "var(--c-surface)",
            color: "var(--c-text)",
            border: "1px solid var(--c-border)",
            boxShadow: "var(--shadow-popup)",
            fontSize: "0.9375rem",
          },
          success: {
            iconTheme: {
              primary: "#fff",
              secondary: "#2E7D32",
            },
          },
        }}
      />
      </div>
    </BrowserRouter>
  </React.StrictMode>
);
