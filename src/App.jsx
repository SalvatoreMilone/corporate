import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import About from "./pages/About";
import I18nDemo from "./pages/I18nDemo";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./pages/ErrorBoundary";
import ToastProvider from "./components/ui/ToastProvider";
import useReloadTranslations from "./hooks/useReloadTranslations";

function App() {
  // Use our custom hook to ensure translations load properly
  useReloadTranslations();
  
  return (
    <Router>
      <ToastProvider />
      <ErrorBoundary>
        <Routes>
          <Route
            path="/"
            element={
              <Layout>
                <Home />
              </Layout>
            }
          />
          <Route
            path="/about"
            element={
              <Layout>
                <About />
              </Layout>
            }
          />
          <Route
            path="/i18n"
            element={
              <Layout>
                <I18nDemo />
              </Layout>
            }
          />
          <Route
            path="*"
            element={
              <Layout>
                <NotFound />
              </Layout>
            }
          />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}

export default App;