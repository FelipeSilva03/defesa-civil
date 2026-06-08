import { useState, useEffect } from "react";

const STATUS = ["Pendente", "Em Andamento", "Atendido", "Arquivado"];
const statusStyle = {
  "Pendente":     "bg-red-500/10 border-red-500/30 text-red-400",
  "Em Andamento": "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
  "Atendido":     "bg-green-500/10 border-green-500/30 text-green-400",
  "Arquivado":    "bg-gray-500/10 border-gray-500/30 text-gray-400",
};
const VAZIO = { numero:"", dataRecebimento:"", origem:"", assunto:"", descricao:"", status:"Pendente", responsavel:"", observacoes:"" };
import { BASE_URL } from "../api";
const API = `${BASE_URL}/api/oficios`;

export default function Oficios() {
  const [oficios, setOficios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(VAZIO);
  const [detalhe, setDetalhe] = useState(null);

  useEffect(() => {
    fetch(API).then(r => r.json()).then(d => { setOficios(d.oficios || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const sync = async (lista) => {
    setSaving(true);
    await fetch(API, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ oficios: lista }) });
    setSaving(false);
  };

  const salvar = async () => {
    if (!form.numero || !form.assunto || !form.origem) return;
    let nova;
    if (editando !== null) {
      nova = oficios.map((o, i) => i === editando ? { ...form } : o);
      setEditando(null);
    } else {
      nova = [{ ...form, id: Date.now().toString() }, ...oficios];
    }
    setOficios(nova);
    setForm(VAZIO);
    setModalAberto(false);
    await sync(nova);
  };

  const excluir = async (i) => {
    if (!confirm("Excluir este ofício?")) return;
    const nova = oficios.filter((_, idx) => idx !== i);
    setOficios(nova);
    if (detalhe === i) setDetalhe(null);
    await sync(nova);
  };

  const atualizarStatus = async (i, novoStatus) => {
    const nova = oficios.map((o, idx) => idx === i ? { ...o, status: novoStatus } : o);
    setOficios(nova);
    await sync(nova);
  };

  const abrirEditar = (i) => { setForm({ ...oficios[i] }); setEditando(i); setModalAberto(true); setDetalhe(null); };

  const filtrados = oficios.filter(o => {
    const matchStatus = filtroStatus === "Todos" || o.status === filtroStatus;
    const matchBusca = !busca || [o.numero, o.origem, o.assunto, o.responsavel].some(v => v?.toLowerCase().includes(busca.toLowerCase()));
    return matchStatus && matchBusca;
  });

  const contadores = STATUS.reduce((acc, s) => { acc[s] = oficios.filter(o => o.status === s).length; return acc; }, {});

  return (
    <div className="space-y-6" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-wider">OFÍCIOS RECEBIDOS</h2>
          <p className="text-gray-500 text-sm" style={{ fontFamily: "system-ui" }}>Controle de documentos e correspondências oficiais</p>
        </div>
        <div className="flex items-center gap-3">
          {saving && <span className="text-gray-500 text-xs" style={{fontFamily:"system-ui"}}>💾 Salvando...</span>}
          <button onClick={() => { setForm(VAZIO); setEditando(null); setModalAberto(true); }}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-5 py-2.5 rounded-xl font-bold text-sm tracking-wider transition-all">
            + NOVO OFÍCIO
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[["Pendente","border-red-500/30 bg-red-500/5","text-red-400"],["Em Andamento","border-yellow-500/30 bg-yellow-500/5","text-yellow-400"],["Atendido","border-green-500/30 bg-green-500/5","text-green-400"],["Arquivado","border-gray-500/30 bg-gray-500/5","text-gray-400"]]
          .map(([s, color, num]) => (
          <div key={s} className={`bg-gray-900 border rounded-2xl p-5 cursor-pointer transition-all ${color} ${filtroStatus===s?"ring-2 ring-orange-500/50":""}`}
            onClick={() => setFiltroStatus(filtroStatus===s?"Todos":s)}>
            <div className={`text-4xl font-black ${num}`}>{contadores[s]}</div>
            <div className="text-xs text-gray-400 tracking-wider mt-1">{s.toUpperCase()}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
          <input type="text" value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por número, origem, assunto..."
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-600 outline-none focus:border-orange-500/50 text-sm"
            style={{ fontFamily: "system-ui" }} />
        </div>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white outline-none text-sm" style={{ fontFamily: "system-ui" }}>
          <option>Todos</option>
          {STATUS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {loading && <div className="text-center py-10 text-gray-500" style={{fontFamily:"system-ui"}}>Carregando...</div>}
        {!loading && filtrados.length === 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center text-gray-600" style={{ fontFamily: "system-ui" }}>
            <div className="text-4xl mb-3">📂</div>
            <p>{oficios.length === 0 ? "Nenhum ofício cadastrado ainda." : "Nenhum ofício encontrado."}</p>
            {oficios.length === 0 && <button onClick={() => { setForm(VAZIO); setEditando(null); setModalAberto(true); }} className="mt-4 text-orange-400 hover:text-orange-300 font-bold tracking-wider text-sm">+ Cadastrar primeiro ofício →</button>}
          </div>
        )}
        {filtrados.map((o) => {
          const idx = oficios.indexOf(o);
          return (
            <div key={o.id||idx} className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-5 transition-all">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="flex-1 cursor-pointer" onClick={() => setDetalhe(detalhe===idx?null:idx)}>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-gray-500 font-mono text-xs">{o.numero||"S/N"}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${statusStyle[o.status]}`}>{o.status}</span>
                    {o.dataRecebimento && <span className="text-gray-600 text-xs" style={{fontFamily:"system-ui"}}>Recebido: {new Date(o.dataRecebimento+"T00:00:00").toLocaleDateString("pt-BR")}</span>}
                  </div>
                  <div className="text-white font-bold text-base tracking-wide">{o.assunto}</div>
                  <div className="text-gray-400 text-sm mt-1" style={{fontFamily:"system-ui"}}>{o.origem}{o.responsavel?` · Resp: ${o.responsavel}`:""}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select value={o.status} onChange={e => atualizarStatus(idx, e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-xs outline-none" style={{fontFamily:"system-ui"}}>
                    {STATUS.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <button onClick={() => abrirEditar(idx)} className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-all">✏️</button>
                  <button onClick={() => excluir(idx)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">🗑️</button>
                </div>
              </div>
              {detalhe===idx && (
                <div className="mt-4 pt-4 border-t border-gray-800 space-y-3">
                  {o.descricao && <div><div className="text-xs text-gray-500 tracking-widest mb-1">DESCRIÇÃO</div><p className="text-gray-300 text-sm leading-relaxed" style={{fontFamily:"system-ui"}}>{o.descricao}</p></div>}
                  {o.observacoes && <div><div className="text-xs text-gray-500 tracking-widest mb-1">OBSERVAÇÕES</div><p className="text-gray-300 text-sm leading-relaxed" style={{fontFamily:"system-ui"}}>{o.observacoes}</p></div>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={e => e.target===e.currentTarget&&setModalAberto(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{fontFamily:"system-ui"}}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-white tracking-wider" style={{fontFamily:"'Barlow Condensed',sans-serif"}}>{editando!==null?"EDITAR OFÍCIO":"NOVO OFÍCIO"}</h3>
              <button onClick={() => setModalAberto(false)} className="text-gray-500 hover:text-white text-xl">✕</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-gray-400 tracking-widest block mb-1.5">Nº DO OFÍCIO</label><input value={form.numero} onChange={e=>setForm(f=>({...f,numero:e.target.value}))} placeholder="Ex: 001/2026" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 outline-none focus:border-orange-500 text-sm"/></div>
                <div><label className="text-xs text-gray-400 tracking-widest block mb-1.5">DATA RECEBIMENTO</label><input type="date" value={form.dataRecebimento} onChange={e=>setForm(f=>({...f,dataRecebimento:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-orange-500 text-sm"/></div>
              </div>
              <div><label className="text-xs text-gray-400 tracking-widest block mb-1.5">ORIGEM / REMETENTE *</label><input value={form.origem} onChange={e=>setForm(f=>({...f,origem:e.target.value}))} placeholder="Ex: Prefeitura, SEMAS..." className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 outline-none focus:border-orange-500 text-sm"/></div>
              <div><label className="text-xs text-gray-400 tracking-widest block mb-1.5">ASSUNTO *</label><input value={form.assunto} onChange={e=>setForm(f=>({...f,assunto:e.target.value}))} placeholder="Assunto do ofício" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 outline-none focus:border-orange-500 text-sm"/></div>
              <div><label className="text-xs text-gray-400 tracking-widest block mb-1.5">DESCRIÇÃO</label><textarea value={form.descricao} onChange={e=>setForm(f=>({...f,descricao:e.target.value}))} placeholder="Resumo do conteúdo..." rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 outline-none focus:border-orange-500 text-sm resize-none"/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-gray-400 tracking-widest block mb-1.5">RESPONSÁVEL</label><input value={form.responsavel} onChange={e=>setForm(f=>({...f,responsavel:e.target.value}))} placeholder="Nome" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 outline-none focus:border-orange-500 text-sm"/></div>
                <div><label className="text-xs text-gray-400 tracking-widest block mb-1.5">STATUS</label><select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-orange-500 text-sm">{STATUS.map(s=><option key={s}>{s}</option>)}</select></div>
              </div>
              <div><label className="text-xs text-gray-400 tracking-widest block mb-1.5">OBSERVAÇÕES</label><textarea value={form.observacoes} onChange={e=>setForm(f=>({...f,observacoes:e.target.value}))} placeholder="Providências, andamento..." rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 outline-none focus:border-orange-500 text-sm resize-none"/></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalAberto(false)} className="flex-1 py-3 rounded-xl font-bold tracking-wider text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 transition-all">CANCELAR</button>
              <button onClick={salvar} disabled={!form.numero||!form.assunto||!form.origem} className="flex-1 py-3 rounded-xl font-bold tracking-wider text-sm bg-orange-500 hover:bg-orange-400 disabled:bg-gray-700 disabled:text-gray-500 text-white transition-all">{editando!==null?"SALVAR":"CADASTRAR"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
