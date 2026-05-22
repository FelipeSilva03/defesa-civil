import { useState } from "react";

const users = [
  { email: "admin@defesacivil.gov.br", senha: "admin123", nome: "Administrador Geral", role: "admin", equipe: null },
  { email: "coord@defesacivil.gov.br", senha: "coord123", nome: "Coord. Paulo Mendes", role: "coordenador", equipe: "ALFA" },
  { email: "agente@defesacivil.gov.br", senha: "agente123", nome: "Ag. Felipe Martins", role: "agente", equipe: "ALFA" },
];

export default function Login({ onLogin, onBack }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setErro("");
    setTimeout(() => {
      const user = users.find(u => u.email === email && u.senha === senha);
      if (user) { onLogin(user); } else { setErro("Email ou senha incorretos."); }
      setLoading(false);
    }, 800);
  };

  const loginRapido = (u) => { setEmail(u.email); setSenha(u.senha); };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4" style={{fontFamily:"'Barlow Condensed',sans-serif"}}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center text-3xl font-black text-white mx-auto mb-4">DC</div>
          <h1 className="text-3xl font-black text-white tracking-wider">DEFESA CIVIL</h1>
          <p className="text-gray-400 text-sm tracking-widest mt-1">SISTEMA OPERACIONAL — ORIXIMINÁ/PA</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-6 tracking-wider">ACESSO AO SISTEMA</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 tracking-widest block mb-2">EMAIL</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.gov.br"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors" style={{fontFamily:"system-ui"}} required/>
            </div>
            <div>
              <label className="text-xs text-gray-400 tracking-widest block mb-2">SENHA</label>
              <input type="password" value={senha} onChange={e=>setSenha(e.target.value)} placeholder="••••••••"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors" required/>
            </div>
            {erro && <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm" style={{fontFamily:"system-ui"}}>⚠️ {erro}</div>}
            <button type="submit" disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-orange-800 text-white py-4 rounded-xl font-bold text-lg tracking-wider transition-all mt-2">
              {loading ? "AUTENTICANDO..." : "ENTRAR →"}
            </button>
          </form>
          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-xs text-gray-500 tracking-widest mb-3">ACESSO RÁPIDO (DEMONSTRAÇÃO)</p>
            <div className="space-y-2">
              {users.map((u,i) => (
                <button key={i} onClick={()=>loginRapido(u)}
                  className="w-full flex items-center justify-between bg-gray-800 hover:bg-gray-700 rounded-xl px-4 py-3 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${u.role==='admin'?'bg-red-400':u.role==='coordenador'?'bg-yellow-400':'bg-green-400'}`}></div>
                    <span className="text-white text-sm font-semibold">{u.nome}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-bold tracking-wider ${u.role==='admin'?'bg-red-500/20 text-red-400':u.role==='coordenador'?'bg-yellow-500/20 text-yellow-400':'bg-green-500/20 text-green-400'}`}>
                    {u.role.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <button onClick={onBack} className="mt-4 w-full text-gray-500 hover:text-gray-300 text-sm transition-colors py-2">← Voltar ao site</button>
      </div>
    </div>
  );
}
