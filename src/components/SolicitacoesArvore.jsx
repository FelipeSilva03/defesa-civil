import { useState, useEffect } from "react";
import { bairros, equipes } from "../data/mockData";

const STATUS = ["Pendente", "Vistoriado", "Agendado", "Concluído", "Cancelado"];
const TIPOS = ["Supressão", "Poda", "Vistoria", "Emergência"];

const statusStyle = {
  "Pendente":   "bg-red-500/10 border-red-500/30 text-red-400",
  "Vistoriado": "bg-blue-500/10 border-blue-500/30 text-blue-400",
  "Agendado":   "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
  "Concluído":  "bg-green-500/10 border-green-500/30 text-green-400",
  "Cancelado":  "bg-gray-500/10 border-gray-500/30 text-gray-400",
};

const tipoIcon = { "Supressão": "🪓", "Poda": "✂️", "Vistoria": "🔍", "Emergência": "⚠️" };

const VAZIO = {
  numero: "", dataSolicitacao: "", solicitante: "", contato: "",
  bairro: "", endereco: "", tipo: "Supressão", descricao: "",
  status: "Pendente", equipe: "", dataAtendimento: "", observacoes: "",
};

export default function SolicitacoesArvore() {
  const [itens, setItens] = useState(() => {
    try { return JSON.parse(localStorage.getItem("dc_arvores") || "[]"); }
    catch { return []; }
  });
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(VAZIO);
  const [detalhe, setDetalhe] = useState(null);

  useEffect(() => {
    localStorage.setItem("dc_arvores", JSON.stringify(itens));
  }, [itens]);

  const salvar = () => {
    if (!form.solicitante || !form.endereco || !form.bairro) return;
    const numero = form.numero || `ARV-${new Date().getFullYear()}-${String(itens.length + 1).padStart(3, "0")}`;
    if (editando !== null) {
      setItens(prev => prev.map((o, i) => i === editando ? { ...form, numero } : o));
      setEditando(null);
    } else {
      setItens(prev => [{ ...form, numero, id: Date.now() }, ...prev]);
    }
    setForm(VAZIO);
    setModalAberto(false);
  };

  const excluir = (i) => {
    if (!confirm("Excluir esta solicitação?")) return;
    setItens(prev => prev.filter((_, idx) => idx !== i));
    if (detalhe === i) setDetalhe(null);
  };

  const abrirEditar = (i) => {
    setForm({ ...itens[i] });
    setEditando(i);
    setModalAberto(true);
    setDetalhe(null);
  };

  const atualizarStatus = (i, novoStatus) => {
    setItens(prev => prev.map((o, idx) => idx === i ? { ...o, status: novoStatus } : o));
  };

  const filtrados = itens.filter(o => {
    const matchStatus = filtroStatus === "Todos" || o.status === filtroStatus;
    const matchBusca = !busca || [o.numero, o.solicitante, o.bairro, o.endereco, o.contato]
      .some(v => v?.toLowerCase().includes(busca.toLowerCase()));
    return matchStatus && matchBusca;
  });

  const contadores = STATUS.reduce((acc, s) => {
    acc[s] = itens.filter(o => o.status === s).length;
    return acc;
  }, {});

  const campo = (label, children, required = false) => (
    <div>
      <label className="text-xs text-gray-400 tracking-widest block mb-1.5">
        {label}{required && " *"}
      </label>
      {children}
    </div>
  );

  const input = (key, placeholder, type = "text") => (
    <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
      placeholder={placeholder}
      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 outline-none focus:border-orange-500 text-sm" />
  );

  return (
    <div className="space-y-6" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-wider">🌳 CORTE DE ÁRVORE</h2>
          <p className="text-gray-500 text-sm" style={{ fontFamily: "system-ui" }}>
            Solicitações de supressão, poda e vistoria de árvores de risco
          </p>
        </div>
        <button
          onClick={() => { setForm(VAZIO); setEditando(null); setModalAberto(true); }}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-5 py-2.5 rounded-xl font-bold text-sm tracking-wider transition-all"
        >
          + NOVA SOLICITAÇÃO
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { s: "Pendente",   color: "border-red-500/30 bg-red-500/5",    num: "text-red-400"    },
          { s: "Vistoriado", color: "border-blue-500/30 bg-blue-500/5",  num: "text-blue-400"   },
          { s: "Agendado",   color: "border-yellow-500/30 bg-yellow-500/5", num: "text-yellow-400" },
          { s: "Concluído",  color: "border-green-500/30 bg-green-500/5", num: "text-green-400"  },
          { s: "Cancelado",  color: "border-gray-500/30 bg-gray-500/5",  num: "text-gray-400"   },
        ].map(({ s, color, num }) => (
          <div key={s}
            className={`bg-gray-900 border rounded-2xl p-4 cursor-pointer transition-all ${color} ${filtroStatus === s ? "ring-2 ring-orange-500/50" : ""}`}
            onClick={() => setFiltroStatus(filtroStatus === s ? "Todos" : s)}>
            <div className={`text-3xl font-black ${num}`}>{contadores[s]}</div>
            <div className="text-xs text-gray-400 tracking-wider mt-1">{s.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* Busca e filtro */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
          <input type="text" value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por solicitante, bairro, endereço..."
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-600 outline-none focus:border-orange-500/50 text-sm"
            style={{ fontFamily: "system-ui" }} />
        </div>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white outline-none text-sm"
          style={{ fontFamily: "system-ui" }}>
          <option>Todos</option>
          {STATUS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {filtrados.length === 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center text-gray-600" style={{ fontFamily: "system-ui" }}>
            <div className="text-4xl mb-3">🌳</div>
            <p>{itens.length === 0 ? "Nenhuma solicitação cadastrada ainda." : "Nenhuma solicitação encontrada."}</p>
            {itens.length === 0 && (
              <button onClick={() => { setForm(VAZIO); setEditando(null); setModalAberto(true); }}
                className="mt-4 text-orange-400 hover:text-orange-300 font-bold tracking-wider text-sm">
                + Cadastrar primeira solicitação →
              </button>
            )}
          </div>
        )}

        {filtrados.map((o) => {
          const idx = itens.indexOf(o);
          return (
            <div key={o.id || idx} className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-5 transition-all">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="flex-1 cursor-pointer" onClick={() => setDetalhe(detalhe === idx ? null : idx)}>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-gray-500 font-mono text-xs">{o.numero}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${statusStyle[o.status]}`}>{o.status}</span>
                    <span className="text-gray-600 text-xs">{tipoIcon[o.tipo]} {o.tipo}</span>
                    {o.dataSolicitacao && (
                      <span className="text-gray-600 text-xs" style={{ fontFamily: "system-ui" }}>
                        {new Date(o.dataSolicitacao + "T00:00:00").toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>
                  <div className="text-white font-bold text-base">{o.solicitante}</div>
                  <div className="text-gray-400 text-sm mt-0.5" style={{ fontFamily: "system-ui" }}>
                    📍 {o.endereco} — {o.bairro}
                    {o.contato && <span className="ml-2">· 📞 {o.contato}</span>}
                    {o.equipe && <span className="ml-2">· Equipe {o.equipe}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select value={o.status} onChange={e => atualizarStatus(idx, e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-xs outline-none"
                    style={{ fontFamily: "system-ui" }}>
                    {STATUS.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <button onClick={() => abrirEditar(idx)} className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-all">✏️</button>
                  <button onClick={() => excluir(idx)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">🗑️</button>
                </div>
              </div>

              {detalhe === idx && (
                <div className="mt-4 pt-4 border-t border-gray-800 space-y-3">
                  {o.descricao && (
                    <div>
                      <div className="text-xs text-gray-500 tracking-widest mb-1">DESCRIÇÃO DA SITUAÇÃO</div>
                      <p className="text-gray-300 text-sm leading-relaxed" style={{ fontFamily: "system-ui" }}>{o.descricao}</p>
                    </div>
                  )}
                  {o.dataAtendimento && (
                    <div>
                      <div className="text-xs text-gray-500 tracking-widest mb-1">DATA DE ATENDIMENTO</div>
                      <p className="text-gray-300 text-sm" style={{ fontFamily: "system-ui" }}>
                        {new Date(o.dataAtendimento + "T00:00:00").toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  )}
                  {o.observacoes && (
                    <div>
                      <div className="text-xs text-gray-500 tracking-widest mb-1">OBSERVAÇÕES</div>
                      <p className="text-gray-300 text-sm leading-relaxed" style={{ fontFamily: "system-ui" }}>{o.observacoes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setModalAberto(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ fontFamily: "system-ui" }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-white tracking-wider" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                {editando !== null ? "EDITAR SOLICITAÇÃO" : "NOVA SOLICITAÇÃO"}
              </h3>
              <button onClick={() => setModalAberto(false)} className="text-gray-500 hover:text-white text-xl">✕</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {campo("Nº DA SOLICITAÇÃO", input("numero", "Gerado automaticamente"))}
                {campo("DATA DA SOLICITAÇÃO", input("dataSolicitacao", "", "date"))}
              </div>

              {campo("SOLICITANTE *", input("solicitante", "Nome do solicitante"), true)}

              <div className="grid grid-cols-2 gap-4">
                {campo("CONTATO", input("contato", "(93) 9xxxx-xxxx"))}
                {campo("TIPO DE SERVIÇO",
                  <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-orange-500 text-sm">
                    {TIPOS.map(t => <option key={t}>{t}</option>)}
                  </select>
                )}
              </div>

              {campo("BAIRRO *",
                <select value={form.bairro} onChange={e => setForm(f => ({ ...f, bairro: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-orange-500 text-sm">
                  <option value="">Selecione o bairro</option>
                  {bairros.map(b => <option key={b}>{b}</option>)}
                </select>, true
              )}

              {campo("ENDEREÇO *", input("endereco", "Rua, número, referência"), true)}

              {campo("DESCRIÇÃO DA SITUAÇÃO",
                <textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                  placeholder="Descreva a situação da árvore, risco apresentado..."
                  rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 outline-none focus:border-orange-500 text-sm resize-none" />
              )}

              <div className="grid grid-cols-2 gap-4">
                {campo("EQUIPE",
                  <select value={form.equipe} onChange={e => setForm(f => ({ ...f, equipe: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-orange-500 text-sm">
                    <option value="">Sem equipe</option>
                    {equipes.map(e => <option key={e}>{e}</option>)}
                  </select>
                )}
                {campo("STATUS",
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-orange-500 text-sm">
                    {STATUS.map(s => <option key={s}>{s}</option>)}
                  </select>
                )}
              </div>

              {campo("DATA DE ATENDIMENTO", input("dataAtendimento", "", "date"))}

              {campo("OBSERVAÇÕES",
                <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                  placeholder="Providências tomadas, agendamentos, pendências..."
                  rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 outline-none focus:border-orange-500 text-sm resize-none" />
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalAberto(false)}
                className="flex-1 py-3 rounded-xl font-bold tracking-wider text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 transition-all">
                CANCELAR
              </button>
              <button onClick={salvar}
                disabled={!form.solicitante || !form.endereco || !form.bairro}
                className="flex-1 py-3 rounded-xl font-bold tracking-wider text-sm bg-orange-500 hover:bg-orange-400 disabled:bg-gray-700 disabled:text-gray-500 text-white transition-all">
                {editando !== null ? "SALVAR" : "CADASTRAR"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
