import { useState, useEffect, createContext, useContext } from "react";
import Dashboard from "./components/Dashboard";
import Ocorrencias from "./components/Ocorrencias";
import OcorrenciaDetalhe from "./components/OcorrenciaDetalhe";
import Login from "./components/Login";
import LandingPage from "./components/LandingPage";
import Relatorios from "./components/Relatorios";
import Agentes from "./components/Agentes";
import Oficios from "./components/Oficios";
import SolicitacoesArvore from "./components/SolicitacoesArvore";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import { mockOcorrencias } from "./data/mockData";

export const AppContext = createContext(null);

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("landing");
  const [ocorrencias, setOcorrencias] = useState(mockOcorrencias);

  useEffect(() => {
    const buscar = () => {
      fetch(`${import.meta.env.VITE_API_URL}/api/ocorrencias`)
        .then(r => r.json())
        .then(data => {
          if (!data.ocorrencias) return;
          setOcorrencias(data.ocorrencias);

          // IDs já vistos (salvo no localStorage)
          const vistos = new Set(JSON.parse(localStorage.getItem("dc_notif_vistos") || "[]"));
          const novas = data.ocorrencias.filter(o => o.id && !vistos.has(o.id));

          if (novas.length > 0) {
            setNotifications(gerarNotificacoes(novas));
            // Marca todas as atuais como vistas
            data.ocorrencias.forEach(o => { if (o.id) vistos.add(o.id); });
            localStorage.setItem("dc_notif_vistos", JSON.stringify([...vistos]));
          }
        })
        .catch(() => {});
    };

    buscar();
    const intervalo = setInterval(buscar, 30000); // atualiza a cada 30 segundos
    return () => clearInterval(intervalo);
  }, []);

  const atualizarAgora = () => {
    fetch(`${import.meta.env.VITE_API_URL}/api/ocorrencias`)
      .then(r => r.json())
      .then(data => {
        if (!data.ocorrencias) return;
        setOcorrencias(data.ocorrencias);
        const vistos = new Set(JSON.parse(localStorage.getItem("dc_notif_vistos") || "[]"));
        const novas = data.ocorrencias.filter(o => o.id && !vistos.has(o.id));
        if (novas.length > 0) {
          setNotifications(gerarNotificacoes(novas));
          data.ocorrencias.forEach(o => { if (o.id) vistos.add(o.id); });
          localStorage.setItem("dc_notif_vistos", JSON.stringify([...vistos]));
        }
      })
      .catch(() => {});
  };
  const [selectedOcorrencia, setSelectedOcorrencia] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);

  function gerarNotificacoes(lista) {
    const agora = new Date();
    const formatTempo = (data) => {
      const diff = Math.floor((agora - new Date(data)) / 60000);
      if (diff < 60) return `${diff}min`;
      if (diff < 1440) return `${Math.floor(diff / 60)}h`;
      return `${Math.floor(diff / 1440)}d`;
    };
    const tipoIcon = (categorias) => {
      if (categorias?.combateIncendioUrbano || categorias?.combateIncendioFlorestal) return "🔥";
      if (categorias?.atendimentoPreHospitalar) return "🚑";
      if (categorias?.capturaAnimal) return "🐊";
      if (categorias?.corteArvore) return "🌳";
      if (categorias?.defesaCivil) return "🏚️";
      if (categorias?.buscaSalvamento) return "🔍";
      return "📋";
    };
    const recentes = lista.filter(o => {
      const diff = (agora - new Date(o.dataHora)) / 3600000; // horas
      return diff <= 24;
    }).slice(0, 8);

    return recentes.map((o, i) => ({
      id: i + 1,
      msg: `${tipoIcon(o.categorias)} ${o.bairro} — ${Object.values(o.categorias).find(Boolean) || "Ocorrência registrada"}`,
      time: formatTempo(o.dataHora),
      read: false,
      ocorrencia: o,
    }));
  }

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
    sidebarOpen, setSidebarOpen, selectedOcorrencia, atualizarAgora
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
            {page === "arvores" && <SolicitacoesArvore />}
          </main>
        </div>
      </div>
    </AppContext.Provider>
  );
}
