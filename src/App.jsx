import { useState, useEffect, createContext, useContext } from "react";
import Dashboard from "./components/Dashboard";
import Ocorrencias from "./components/Ocorrencias";
import OcorrenciaDetalhe from "./components/OcorrenciaDetalhe";
import Login from "./components/Login";
import LandingPage from "./components/LandingPage";
import Relatorios from "./components/Relatorios";
import Agentes from "./components/Agentes";
import Oficios from "./components/Oficios";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import { mockOcorrencias } from "./data/mockData";

export const AppContext = createContext(null);

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("landing");
  const [ocorrencias, setOcorrencias] = useState(mockOcorrencias);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/ocorrencias`)
      .then(r => r.json())
      .then(data => { if(data.ocorrencias) setOcorrencias(data.ocorrencias); })
      .catch(() => console.log("Usando dados locais"));
  }, []);
  const [selectedOcorrencia, setSelectedOcorrencia] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([
    { id: 1, msg: "Nova ocorrência registrada - Bela Vista", time: "2min", read: false },
    { id: 2, msg: "Equipe ALFA finalizou atendimento", time: "8min", read: false },
    { id: 3, msg: "Relatório mensal disponível", time: "1h", read: true },
  ]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const handleLogin = (userData) => {
    setUser(userData);
    setPage("dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    setPage("landing");
  };

  const navigateTo = (p, data = null) => {
    setPage(p);
    if (data) setSelectedOcorrencia(data);
  };

  const ctx = {
    user, ocorrencias, setOcorrencias, darkMode, setDarkMode,
    notifications, setNotifications, navigateTo, handleLogout,
    sidebarOpen, setSidebarOpen, selectedOcorrencia
  };

  if (page === "landing") {
    return (
      <AppContext.Provider value={ctx}>
        <LandingPage onLogin={() => setPage("login")} />
      </AppContext.Provider>
    );
  }

  if (page === "login") {
    return (
      <AppContext.Provider value={ctx}>
        <Login onLogin={handleLogin} onBack={() => setPage("landing")} />
      </AppContext.Provider>
    );
  }

  return (
    <AppContext.Provider value={ctx}>
      <div className={`flex h-screen overflow-hidden ${darkMode ? "bg-gray-950 text-white" : "bg-gray-100 text-gray-900"}`}>
        <Sidebar page={page} navigateTo={navigateTo} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar page={page} />
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {page === "dashboard" && <Dashboard />}
            {page === "ocorrencias" && <Ocorrencias />}
            {page === "detalhe" && <OcorrenciaDetalhe />}
            {page === "relatorios" && <Relatorios />}
            {page === "agentes" && <Agentes />}
            {page === "oficios" && <Oficios />}
          </main>
        </div>
      </div>
    </AppContext.Provider>
  );
}
