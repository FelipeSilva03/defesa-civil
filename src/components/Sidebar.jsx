import { useContext } from "react";
import { AppContext } from "../App";

const navItems = [
  { id: "dashboard",  icon: "📊", label: "DASHBOARD"   },
  { id: "ocorrencias",icon: "📋", label: "OCORRÊNCIAS"  },
  { id: "relatorios", icon: "📈", label: "RELATÓRIOS"   },
  { id: "agentes",    icon: "👥", label: "AGENTES"      },
];

export default function Sidebar({ page, navigateTo }) {
  const { user, darkMode, sidebarOpen, setSidebarOpen, handleLogout } = useContext(AppContext);

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-20" onClick={()=>setSidebarOpen(false)}/>
      )}

      <aside className={`
        ${sidebarOpen ? "w-56" : "w-0 md:w-16"} 
        transition-all duration-300 overflow-hidden
        bg-gray-900 border-r border-gray-800 flex flex-col z-30
        fixed md:relative h-full
      `} style={{fontFamily:"'Barlow Condensed',sans-serif"}}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-800 flex items-center gap-3 min-w-[224px]">
          <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center font-black text-white flex-shrink-0">DC</div>
          {sidebarOpen && (
            <div>
              <div className="text-white font-bold text-sm tracking-wider leading-none">DEFESA CIVIL</div>
              <div className="text-gray-500 text-xs tracking-widest">ORIXIMINÁ/PA</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 min-w-[224px]">
          {navItems.map(item => (
            <button key={item.id} onClick={()=>navigateTo(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left
                ${page===item.id ? "bg-orange-500 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}>
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="font-bold tracking-wider text-sm">{item.label}</span>}
            </button>
          ))}

          <div className="pt-4 border-t border-gray-800 mt-4">
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSfagyJfVIYB0IP2a8OMAFtttKGAzoORRI7Pdol_dXKP_FDzUw/viewform"
              target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-all">
              <span className="text-lg flex-shrink-0">📝</span>
              {sidebarOpen && <span className="font-bold tracking-wider text-sm">FORMULÁRIO</span>}
            </a>
          </div>
        </nav>

        {/* User */}
        <div className="p-3 border-t border-gray-800 min-w-[224px]">
          {sidebarOpen && user && (
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-8 h-8 bg-orange-500/20 border border-orange-500/40 rounded-lg flex items-center justify-center text-orange-400 font-bold text-sm flex-shrink-0">
                {user.nome.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <div className="text-white text-xs font-bold truncate">{user.nome}</div>
                <div className={`text-xs font-bold tracking-wider ${user.role==='admin'?'text-red-400':user.role==='coordenador'?'text-yellow-400':'text-green-400'}`}>
                  {user.role.toUpperCase()}
                </div>
              </div>
            </div>
          )}
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <span className="flex-shrink-0">🚪</span>
            {sidebarOpen && <span className="text-sm font-bold tracking-wider">SAIR</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
