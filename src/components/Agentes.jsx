import { useState } from "react";
import { agentes as agentesIniciais } from "../data/mockData";

const CARGOS = [
  "Agente de Proteção e Defesa Civil",
  "Chefe de Divisão Operacional",
  "Coordenador",
  "Supervisor",
];
const TIPOS_REGISTRO = ["falta", "atestado", "ponto_positivo"];
const VAZIO_AGENTE = { num:"", nome:"", cpf:"", contato:"", nascimento:"", cargo:"Agente de Proteção e Defesa Civil" };
const VAZIO_REG = { tipo:"falta", data:"", descricao:"" };

function carregar() {
  try { return JSON.parse(localStorage.getItem("dc_agentes") || "[]"); }
  catch { return agentesIniciais; }
}
function salvarLS(lista) { localStorage.setItem("dc_agentes", JSON.stringify(lista)); }

const tipoLabel = { falta:"Falta", atestado:"Atestado Médico", ponto_positivo:"Ponto Positivo" };
const tipoIcon  = { falta:"❌", atestado:"🏥", ponto_positivo:"⭐" };
const tipoStyle = {
  falta:          "bg-red-500/10 border-red-500/30 text-red-400",
  atestado:       "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
  ponto_positivo: "bg-green-500/10 border-green-500/30 text-green-400",
};

export default function Agentes() {
  const [agentes, setAgentes] = useState(carregar);
  const [busca, setBusca]     = useState("");
  const [perfil, setPerfil]   = useState(null); // índice do agente selecionado
  const [modalAgente, setModalAgente] = useState(false);
  const [editando, setEditando]       = useState(null);
  const [formAgente, setFormAgente]   = useState(VAZIO_AGENTE);
  const [modalReg, setModalReg]       = useState(false);
  const [formReg, setFormReg]         = useState(VAZIO_REG);
  const [filtroMes, setFiltroMes]     = useState("");

  const atualizar = (lista) => { setAgentes(lista); salvarLS(lista); };

  /* ── CRUD Agentes ── */
  const abrirNovo = () => {
    setFormAgente({ ...VAZIO_AGENTE, num: String(agentes.length + 1).padStart(2,"0") });
    setEditando(null); setModalAgente(true);
  };
  const abrirEditar = (i) => {
    setFormAgente({ ...agentes[i] }); setEditando(i); setModalAgente(true);
  };
  const salvarAgente = () => {
    if (!formAgente.nome) return;
    const nova = editando !== null
      ? agentes.map((a,i) => i===editando ? {...formAgente} : a)
      : [...agentes, { ...formAgente, registros:[] }];
    atualizar(nova); setModalAgente(false);
    if (editando !== null && perfil === editando) setPerfil(editando);
  };
  const excluirAgente = (i) => {
    if (!confirm(`Excluir ${agentes[i].nome}?`)) return;
    atualizar(agentes.filter((_,idx)=>idx!==i));
    if (perfil === i) setPerfil(null);
  };

  /* ── CRUD Registros ── */
  const adicionarRegistro = () => {
    if (!formReg.data || !formReg.descricao) return;
    const lista = agentes.map((a,i) => i===perfil
      ? { ...a, registros: [...(a.registros||[]), { ...formReg, id: Date.now() }] }
      : a);
    atualizar(lista); setModalReg(false); setFormReg(VAZIO_REG);
  };
  const excluirRegistro = (regId) => {
    const lista = agentes.map((a,i) => i===perfil
      ? { ...a, registros: (a.registros||[]).filter(r=>r.id!==regId) }
      : a);
    atualizar(lista);
  };

  const filtrados = agentes.filter(a =>
    a.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    (a.contato && a.contato.includes(busca)) ||
    (a.cpf && a.cpf.includes(busca))
  );

  const chefe = agentes.find(a => a.cargo==="Chefe de Divisão Operacional");
  const semDados = agentes.filter(a => !a.cpf || !a.contato).length;
  const agenteAtual = perfil !== null ? agentes[perfil] : null;

  /* Filtra registros por mês */
  const registrosFiltrados = (agenteAtual?.registros || []).filter(r => {
    if (!filtroMes) return true;
    return r.data?.startsWith(filtroMes);
  });

  const contReg = (tipo) => registrosFiltrados.filter(r=>r.tipo===tipo).length;

  const inp = (key, ph, type="text") => (
    <input type={type} value={formAgente[key]||""} onChange={e=>setFormAgente(f=>({...f,[key]:e.target.value}))} placeholder={ph}
      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 outline-none focus:border-orange-500 text-sm"/>
  );

  /* ── PERFIL INDIVIDUAL ── */
  if (agenteAtual) {
    return (
      <div className="space-y-6" style={{fontFamily:"'Barlow Condensed',sans-serif"}}>
        {/* Header perfil */}
        <div className="flex items-center gap-4">
          <button onClick={()=>setPerfil(null)} className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-gray-800 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-black text-2xl flex-shrink-0 ${agenteAtual.cargo==="Chefe de Divisão Operacional"?"bg-orange-500 text-white":"bg-gray-700 text-gray-300"}`}>
            {agenteAtual.nome?.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="text-white font-black text-2xl tracking-wider">{agenteAtual.nome}</div>
            <div className="text-gray-400 text-sm" style={{fontFamily:"system-ui"}}>{agenteAtual.cargo}</div>
          </div>
          <button onClick={()=>{ setFormAgente({...agenteAtual}); setEditando(perfil); setModalAgente(true); }}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-xl font-bold text-sm tracking-wider transition-all">
            ✏️ EDITAR
          </button>
          <button onClick={()=>{ setModalReg(true); setFormReg(VAZIO_REG); }}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-4 py-2 rounded-xl font-bold text-sm tracking-wider transition-all">
            + REGISTRO
          </button>
        </div>

        {/* Dados básicos */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h3 className="font-bold text-white tracking-wider mb-4 text-sm border-b border-gray-800 pb-3">DADOS CADASTRAIS</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4" style={{fontFamily:"system-ui"}}>
            {[["N° NA LISTA",agenteAtual.num],["CPF",agenteAtual.cpf],["CONTATO",agenteAtual.contato],["DATA DE NASCIMENTO",agenteAtual.nascimento],["CARGO",agenteAtual.cargo]].map(([l,v])=>(
              <div key={l}><div className="text-xs text-gray-500 tracking-widest mb-1">{l}</div><div className="text-white font-semibold text-sm">{v||"—"}</div></div>
            ))}
          </div>
        </div>

        {/* Cards resumo do mês */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex gap-3 flex-1">
            {[["falta","Faltas","border-red-500/30 bg-red-500/5","text-red-400"],["atestado","Atestados","border-yellow-500/30 bg-yellow-500/5","text-yellow-400"],["ponto_positivo","Pontos Positivos","border-green-500/30 bg-green-500/5","text-green-400"]].map(([tipo,label,color,num])=>(
              <div key={tipo} className={`bg-gray-900 border rounded-2xl p-4 flex-1 ${color}`}>
                <div className={`text-3xl font-black ${num}`}>{contReg(tipo)}</div>
                <div className="text-xs text-gray-400 tracking-wider mt-1">{label.toUpperCase()}</div>
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs text-gray-500 tracking-widest block mb-1.5">FILTRAR POR MÊS</label>
            <input type="month" value={filtroMes} onChange={e=>setFiltroMes(e.target.value)}
              className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-white outline-none focus:border-orange-500 text-sm" style={{fontFamily:"system-ui"}}/>
          </div>
        </div>

        {/* Lista de registros */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
            <h3 className="font-bold text-white tracking-wider text-sm">REGISTROS</h3>
            <span className="text-gray-500 text-xs" style={{fontFamily:"system-ui"}}>{registrosFiltrados.length} registro(s)</span>
          </div>
          {registrosFiltrados.length === 0 ? (
            <div className="text-center py-10 text-gray-600" style={{fontFamily:"system-ui"}}>
              <div className="text-3xl mb-2">📋</div>
              <p className="text-sm">Nenhum registro{filtroMes?" neste mês":""}.</p>
            </div>
          ) : (
            [...registrosFiltrados].sort((a,b)=>b.data?.localeCompare(a.data)).map(r=>(
              <div key={r.id} className="flex items-start justify-between px-5 py-4 border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <div className="flex items-start gap-4">
                  <span className={`text-xs px-2 py-1 rounded-full border font-bold flex-shrink-0 mt-0.5 ${tipoStyle[r.tipo]}`}>
                    {tipoIcon[r.tipo]} {tipoLabel[r.tipo]}
                  </span>
                  <div>
                    <div className="text-white font-semibold text-sm" style={{fontFamily:"system-ui"}}>{r.descricao}</div>
                    {r.data && <div className="text-gray-500 text-xs mt-1" style={{fontFamily:"system-ui"}}>{new Date(r.data+"T00:00:00").toLocaleDateString("pt-BR")}</div>}
                  </div>
                </div>
                <button onClick={()=>excluirRegistro(r.id)} className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all flex-shrink-0">🗑️</button>
              </div>
            ))
          )}
        </div>

        {/* Modal novo registro */}
        {modalReg && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={e=>e.target===e.currentTarget&&setModalReg(false)}>
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md" style={{fontFamily:"system-ui"}}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-white tracking-wider" style={{fontFamily:"'Barlow Condensed',sans-serif"}}>NOVO REGISTRO</h3>
                <button onClick={()=>setModalReg(false)} className="text-gray-500 hover:text-white text-xl">✕</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 tracking-widest block mb-1.5">TIPO *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {TIPOS_REGISTRO.map(t=>(
                      <button key={t} onClick={()=>setFormReg(f=>({...f,tipo:t}))}
                        className={`py-2 rounded-xl text-xs font-bold tracking-wider transition-all border ${formReg.tipo===t?"bg-orange-500 border-orange-500 text-white":"bg-gray-800 border-gray-700 text-gray-400 hover:border-orange-500"}`}>
                        {tipoIcon[t]} {tipoLabel[t]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 tracking-widest block mb-1.5">DATA *</label>
                  <input type="date" value={formReg.data} onChange={e=>setFormReg(f=>({...f,data:e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-orange-500 text-sm"/>
                </div>
                <div>
                  <label className="text-xs text-gray-400 tracking-widest block mb-1.5">DESCRIÇÃO *</label>
                  <textarea value={formReg.descricao} onChange={e=>setFormReg(f=>({...f,descricao:e.target.value}))}
                    placeholder={formReg.tipo==="falta"?"Ex: Falta sem justificativa":formReg.tipo==="atestado"?"Ex: Atestado médico — gripe":"Ex: Excelente desempenho na ocorrência"}
                    rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 outline-none focus:border-orange-500 text-sm resize-none"/>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={()=>setModalReg(false)} className="flex-1 py-3 rounded-xl font-bold tracking-wider text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 transition-all">CANCELAR</button>
                <button onClick={adicionarRegistro} disabled={!formReg.data||!formReg.descricao}
                  className="flex-1 py-3 rounded-xl font-bold tracking-wider text-sm bg-orange-500 hover:bg-orange-400 disabled:bg-gray-700 disabled:text-gray-500 text-white transition-all">SALVAR</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── LISTA DE AGENTES ── */
  return (
    <div className="space-y-6" style={{fontFamily:"'Barlow Condensed',sans-serif"}}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-wider">AGENTES</h2>
          <p className="text-gray-500 text-sm" style={{fontFamily:"system-ui"}}>Brigada de Incêndio — Defesa Civil Oriximiná/PA</p>
        </div>
        <button onClick={abrirNovo} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-5 py-2.5 rounded-xl font-bold text-sm tracking-wider transition-all">
          + NOVO AGENTE
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-orange-500/30 bg-orange-500/5 rounded-2xl p-5"><div className="text-4xl font-black text-white">{agentes.length}</div><div className="text-xs text-gray-400 tracking-wider mt-1">TOTAL DE AGENTES</div></div>
        <div className="bg-gray-900 border border-green-500/30 bg-green-500/5 rounded-2xl p-5"><div className="text-4xl font-black text-white">{agentes.length-semDados}</div><div className="text-xs text-gray-400 tracking-wider mt-1">CADASTROS COMPLETOS</div></div>
        <div className="bg-gray-900 border border-yellow-500/30 bg-yellow-500/5 rounded-2xl p-5"><div className="text-4xl font-black text-white">{semDados}</div><div className="text-xs text-gray-400 tracking-wider mt-1">DADOS INCOMPLETOS</div></div>
      </div>

      {chefe && (
        <div className="bg-gray-900 border border-orange-500/40 rounded-2xl p-5 flex items-center justify-between gap-5 cursor-pointer hover:border-orange-500 transition-colors"
          onClick={()=>setPerfil(agentes.indexOf(chefe))}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black text-2xl flex-shrink-0">{chefe.nome?.charAt(0)}</div>
            <div>
              <div className="text-xs text-orange-400 tracking-widest mb-1">CHEFIA — clique para ver perfil</div>
              <div className="text-white font-black text-xl tracking-wide">{chefe.nome}</div>
              <div className="text-gray-400 text-sm" style={{fontFamily:"system-ui"}}>{chefe.cargo}</div>
              {chefe.contato && <div className="text-gray-500 text-xs mt-1" style={{fontFamily:"system-ui"}}>📞 {chefe.contato}</div>}
            </div>
          </div>
          <span className="text-gray-600 text-2xl">›</span>
        </div>
      )}

      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
        <input type="text" value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar por nome, CPF ou telefone..."
          className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-600 outline-none focus:border-orange-500/50 text-sm" style={{fontFamily:"system-ui"}}/>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="px-4 py-3 text-left text-xs text-gray-500 tracking-widest">N°</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 tracking-widest">NOME</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 tracking-widest hidden sm:table-cell">CONTATO</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 tracking-widest hidden lg:table-cell">CARGO</th>
              <th className="px-4 py-3 text-xs text-gray-500 tracking-widest w-24">AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((a)=>{
              const idx = agentes.indexOf(a);
              const isChefe = a.cargo==="Chefe de Divisão Operacional";
              const totalRegs = (a.registros||[]).length;
              return (
                <tr key={idx} className={`border-b border-gray-800/50 transition-colors hover:bg-gray-800/40 cursor-pointer ${isChefe?"bg-orange-500/5":""}`}
                  onClick={()=>setPerfil(idx)}>
                  <td className="px-4 py-3 text-gray-500 font-mono text-sm">{a.num}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0 ${isChefe?"bg-orange-500 text-white":"bg-gray-800 text-gray-400"}`}>{a.nome?.charAt(0)}</div>
                      <div>
                        <div className="text-white font-bold text-sm">{a.nome}</div>
                        <div className="flex gap-1 mt-0.5">
                          {totalRegs>0&&<span className="text-gray-500 text-xs" style={{fontFamily:"system-ui"}}>{totalRegs} registro(s)</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell"><span className="text-gray-300 text-sm" style={{fontFamily:"system-ui"}}>{a.contato||<span className="text-gray-700">—</span>}</span></td>
                  <td className="px-4 py-3 hidden lg:table-cell"><span className="text-gray-400 text-xs" style={{fontFamily:"system-ui"}}>{a.cargo}</span></td>
                  <td className="px-4 py-3" onClick={e=>e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <button onClick={()=>abrirEditar(idx)} className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700 rounded-lg transition-all">✏️</button>
                      <button onClick={()=>excluirAgente(idx)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">🗑️</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtrados.length===0&&<tr><td colSpan={5} className="px-4 py-10 text-center text-gray-600" style={{fontFamily:"system-ui"}}>Nenhum agente encontrado.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="text-gray-600 text-xs text-right" style={{fontFamily:"system-ui"}}>
        Secretaria Municipal de Segurança Pública e Defesa Social — Oriximiná/PA · {agentes.length} agentes cadastrados
      </div>

      {/* Modal agente */}
      {modalAgente && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={e=>e.target===e.currentTarget&&setModalAgente(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" style={{fontFamily:"system-ui"}}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-white tracking-wider" style={{fontFamily:"'Barlow Condensed',sans-serif"}}>{editando!==null?"EDITAR AGENTE":"NOVO AGENTE"}</h3>
              <button onClick={()=>setModalAgente(false)} className="text-gray-500 hover:text-white text-xl">✕</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-gray-400 tracking-widest block mb-1.5">N° NA LISTA</label>{inp("num","Ex: 19")}</div>
                <div><label className="text-xs text-gray-400 tracking-widest block mb-1.5">DATA DE NASC.</label>{inp("nascimento","DD/MM/AAAA")}</div>
              </div>
              <div><label className="text-xs text-gray-400 tracking-widest block mb-1.5">NOME COMPLETO *</label>{inp("nome","Nome completo")}</div>
              <div><label className="text-xs text-gray-400 tracking-widest block mb-1.5">CPF</label>{inp("cpf","000.000.000-00")}</div>
              <div><label className="text-xs text-gray-400 tracking-widest block mb-1.5">CONTATO</label>{inp("contato","(93) 9xxxx-xxxx")}</div>
              <div><label className="text-xs text-gray-400 tracking-widest block mb-1.5">CARGO</label>
                <select value={formAgente.cargo} onChange={e=>setFormAgente(f=>({...f,cargo:e.target.value}))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-orange-500 text-sm">
                  {CARGOS.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={()=>setModalAgente(false)} className="flex-1 py-3 rounded-xl font-bold tracking-wider text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 transition-all">CANCELAR</button>
              <button onClick={salvarAgente} disabled={!formAgente.nome} className="flex-1 py-3 rounded-xl font-bold tracking-wider text-sm bg-orange-500 hover:bg-orange-400 disabled:bg-gray-700 disabled:text-gray-500 text-white transition-all">{editando!==null?"SALVAR":"CADASTRAR"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
