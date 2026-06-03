import { useContext, useState } from "react";
import { AppContext } from "../App";

const pageTitles = {
  dashboard: "Dashboard",
  ocorrencias: "Ocorrências",
  detalhe: "Detalhe da Ocorrência",
  relatorios: "Relatórios",
};

export default function Topbar({ page }) {
  const { darkMode, setDarkMode, notifications, setNotifications, sidebarOpen, setSidebarOpen, navigateTo, atualizarAgora } = useContext(AppContext);
  const [atualizando, setAtualizando] = useState(false);
  const handleAtualizar = () => {
    setAtualizando(true);
    atualizarAgora?.();
    setTimeout(() => setAtualizando(false), 1500);
  };
  const [showNotif, setShowNotif] = useState(false);
  const unread = notifications.filter(n => !n.read).length;

  const markAllRead = () => setNotifications(n => n.map(x => ({ ...x, read: true })));

  return (
    <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between flex-shrink-0 z-10" style={{fontFamily:"'Barlow Condensed',sans-serif"}}>
      <div className="flex items-center gap-4">
        <button onClick={()=>setSidebarOpen(!sidebarOpen)}
          className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <div>
          <h1 className="text-white font-bold tracking-wider text-lg leading-none">{pageTitles[page] || page}</h1>
          <div className="text-gray-500 text-xs">{new Date().toLocaleDateString('pt-BR', {weekday:'long',day:'2-digit',month:'long',year:'numeric'})}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Status live */}
        <div className="hidden md:flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-3 py-1">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          <span className="text-green-400 text-xs font-bold tracking-wider">SISTEMA ONLINE</span>
        </div>

        {/* Atualizar */}
        <button onClick={handleAtualizar} title="Atualizar dados do Forms"
          className={`p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-lg ${atualizando?"animate-spin":""}`}>
          🔄
        </button>

        {/* Dark mode */}
        <button onClick={()=>setDarkMode(!darkMode)}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-lg">
          {darkMode ? "☀️" : "🌙"}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button onClick={()=>setShowNotif(!showNotif)}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors relative">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">{unread}</span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-12 w-80 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                <span className="font-bold text-white tracking-wider text-sm">NOTIFICAÇÕES</span>
                <button onClick={markAllRead} className="text-xs text-orange-400 hover:text-orange-300">Marcar todas lidas</button>
              </div>
              {notifications.length === 0 && (
                <div className="px-4 py-6 text-center text-gray-500 text-sm" style={{fontFamily:"system-ui"}}>Nenhuma notificação</div>
              )}
              {notifications.map(n => (
                <div key={n.id}
                  onClick={() => { if (n.ocorrencia) { navigateTo('detalhe', n.ocorrencia); setShowNotif(false); setNotifications(prev => prev.map(x => x.id === n.id ? {...x, read: true} : x)); } }}
                  className={`px-4 py-3 border-b border-gray-800 last:border-0 flex gap-3 transition-colors ${n.ocorrencia ? 'cursor-pointer hover:bg-gray-800' : ''} ${n.read ? 'opacity-50' : ''}`}
                  style={{fontFamily:"system-ui"}}>
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.read ? 'bg-gray-600' : 'bg-orange-400'}`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm">{n.msg}</p>
                    <p className="text-gray-500 text-xs mt-1">há {n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
