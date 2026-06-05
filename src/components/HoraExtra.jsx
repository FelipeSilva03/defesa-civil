import { useState, useEffect } from "react";

const API = `${import.meta.env.VITE_API_URL}/api/agentes`;
const VAZIO_H = { mes: "", horas: "", descricao: "" };
const mesAtual = () => new Date().toISOString().slice(0, 7);

export default function HoraExtra() {
  const [agentes,       setAgentes]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [mes,           setMes]           = useState(mesAtual());
  const [brigadaSel,    setBrigadaSel]    = useState(null);
  const [agSel,         setAgSel]         = useState(null);
  const [modalH,        setModalH]        = useState(false);
  const [formH,         setFormH]         = useState(VAZIO_H);
  const [modalBrigada,  setModalBrigada]  = useState(false);
  const [novaBrigada,   setNovaBrigada]   = useState("");

  useEffect(() => {
    fetch(API)
      .then(r => r.json())
      .then(d => {
        const lista = (d.agentes || []).map(a => ({
          ...a,
          horasExtras: Array.isArray(a.horasExtras) ? a.horasExtras : [],
          brigada: a.brigada || null,
        }));
        setAgentes(lista);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const sync = async (lista) => {
    setSaving(true);
    await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agentes: lista }) });
    setSaving(false);
  };

  const upd = (lista) => { setAgentes(lista); sync(lista); };

  // ── Derived ───────────────────────────────────────────────────
  const brigadas = [...new Set(agentes.map(a => a.brigada).filter(Boolean))].sort();

  const horasDoMes = (a, filtroMes) =>
    (a.horasExtras || [])
      .filter(h => !filtroMes || h.mes === filtroMes)
      .reduce((sum, h) => sum + Number(h.horas || 0), 0);

  const totalHorasMes = agentes.reduce((sum, a) => sum + horasDoMes(a, mes), 0);

  const agentesVisiveis = agentes.map((a, i) => ({ a, i })).filter(({ a }) => {
    if (!brigadaSel) return true;
    if (brigadaSel === "__sem__") return !a.brigada;
    return a.brigada === brigadaSel;
  });

  // ── Actions ───────────────────────────────────────────────────
  const salvarHora = () => {
    if (!formH.mes || !formH.horas || !formH.descricao || agSel === null) return;
    const nova = agentes.map((a, i) => i === agSel
      ? { ...a, horasExtras: [...(a.horasExtras || []), { ...formH, id: Date.now(), horas: Number(formH.horas) }] }
      : a);
    upd(nova); setModalH(false); setFormH(VAZIO_H);
  };

  const excluirHora = (hId) => {
    const nova = agentes.map((a, i) => i === agSel
      ? { ...a, horasExtras: (a.horasExtras || []).filter(h => h.id !== hId) }
      : a);
    upd(nova);
  };

  const salvarBrigada = () => {
    if (agSel === null) return;
    // só muda o campo brigada — horasExtras ficam intactas
    const nova = agentes.map((a, i) => i === agSel
      ? { ...a, brigada: novaBrigada.trim() || null }
      : a);
    upd(nova); setModalBrigada(false);
  };

  // ── PERFIL ────────────────────────────────────────────────────
  const agSelecionado = agSel !== null ? agentes[agSel] : null;

  if (agSelecionado) {
    const horasMesPerfil = horasDoMes(agSelecionado, mes);
    const registros = [...(agSelecionado.horasExtras || [])]
      .sort((a, b) => b.mes?.localeCompare(a.mes))
      .filter(h => !mes || h.mes === mes);

    return (
      <div className="space-y-6" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>
        <div className="flex items-center gap-4">
          <button onClick={() => setAgSel(null)} className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-gray-800 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div className="w-14 h-14 bg-orange-500/20 border border-orange-500/40 rounded-xl flex items-center justify-center font-black text-2xl text-orange-400 flex-shrink-0">
            {agSelecionado.nome?.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="text-white font-black text-2xl tracking-wider">{agSelecionado.nome}</div>
            <div className="text-gray-400 text-sm" style={{ fontFamily: "system-ui" }}>
              {agSelecionado.brigada || <span className="text-gray-600">Sem equipe</span>}
            </div>
          </div>
          <button
            onClick={() => { setNovaBrigada(agSelecionado.brigada || ""); setModalBrigada(true); }}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-xl font-bold text-sm tracking-wider transition-all">
            👥 EQUIPE
          </button>
          <button
            onClick={() => { setFormH({ ...VAZIO_H, mes }); setModalH(true); }}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-4 py-2 rounded-xl font-bold text-sm tracking-wider transition-all">
            + HORAS
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-900 border border-orange-500/30 bg-orange-500/5 rounded-2xl p-5">
            <div className="text-4xl font-black text-white">{horasMesPerfil}h</div>
            <div className="text-xs text-gray-400 tracking-wider mt-1">EXTRAS — {mes || "TODOS"}</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="text-4xl font-black text-white">{(agSelecionado.horasExtras || []).length}</div>
            <div className="text-xs text-gray-400 tracking-wider mt-1">REGISTROS TOTAIS</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="text-2xl font-black text-white truncate">{agSelecionado.brigada || "—"}</div>
            <div className="text-xs text-gray-400 tracking-wider mt-1">EQUIPE</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs text-gray-500 tracking-widest">FILTRAR POR MÊS</label>
          <input type="month" value={mes} onChange={e => setMes(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500 text-sm" style={{ fontFamily: "system-ui" }} />
          {mes && <button onClick={() => setMes("")} className="text-gray-500 hover:text-white text-xs tracking-wider">✕ LIMPAR</button>}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
            <h3 className="font-bold text-white tracking-wider text-sm">REGISTROS DE HORA EXTRA</h3>
            <span className="text-gray-500 text-xs" style={{ fontFamily: "system-ui" }}>{registros.length} registro(s)</span>
          </div>
          {registros.length === 0 ? (
            <div className="text-center py-10 text-gray-600" style={{ fontFamily: "system-ui" }}>
              <div className="text-3xl mb-2">⏱️</div>
              <p className="text-sm">Nenhum registro{mes ? " neste mês" : ""}.</p>
            </div>
          ) : (
            registros.map(h => (
              <div key={h.id} className="flex items-start justify-between px-5 py-4 border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl px-3 py-2 text-center flex-shrink-0 min-w-[56px]">
                    <div className="text-orange-400 font-black text-xl leading-none">{h.horas}h</div>
                    <div className="text-gray-500 text-xs mt-1" style={{ fontFamily: "system-ui" }}>{h.mes}</div>
                  </div>
                  <div className="pt-1">
                    <div className="text-white font-semibold text-sm" style={{ fontFamily: "system-ui" }}>{h.descricao}</div>
                  </div>
                </div>
                <button onClick={() => excluirHora(h.id)} className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all flex-shrink-0">🗑️</button>
              </div>
            ))
          )}
        </div>

        {/* Modal nova hora */}
        {modalH && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setModalH(false)}>
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md" style={{ fontFamily: "system-ui" }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-white tracking-wider" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>NOVO REGISTRO</h3>
                <button onClick={() => setModalH(false)} className="text-gray-500 hover:text-white text-xl">✕</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 tracking-widest block mb-1.5">MÊS *</label>
                  <input type="month" value={formH.mes} onChange={e => setFormH(f => ({ ...f, mes: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-orange-500 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 tracking-widest block mb-1.5">HORAS *</label>
                  <input type="number" min="0.5" step="0.5" value={formH.horas} onChange={e => setFormH(f => ({ ...f, horas: e.target.value }))}
                    placeholder="Ex: 8"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 outline-none focus:border-orange-500 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 tracking-widest block mb-1.5">DESCRIÇÃO *</label>
                  <textarea value={formH.descricao} onChange={e => setFormH(f => ({ ...f, descricao: e.target.value }))}
                    placeholder="Ex: Operação de combate a incêndio"
                    rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 outline-none focus:border-orange-500 text-sm resize-none" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setModalH(false)} className="flex-1 py-3 rounded-xl font-bold tracking-wider text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 transition-all">CANCELAR</button>
                <button onClick={salvarHora} disabled={!formH.mes || !formH.horas || !formH.descricao}
                  className="flex-1 py-3 rounded-xl font-bold tracking-wider text-sm bg-orange-500 hover:bg-orange-400 disabled:bg-gray-700 disabled:text-gray-500 text-white transition-all">SALVAR</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal mudar equipe */}
        {modalBrigada && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setModalBrigada(false)}>
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md" style={{ fontFamily: "system-ui" }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-white tracking-wider" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>MUDAR EQUIPE</h3>
                <button onClick={() => setModalBrigada(false)} className="text-gray-500 hover:text-white text-xl">✕</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 tracking-widest block mb-1.5">EQUIPE</label>
                  <input value={novaBrigada} onChange={e => setNovaBrigada(e.target.value)}
                    placeholder="Ex: Brigada Alpha"
                    list="brigadas-list"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 outline-none focus:border-orange-500 text-sm" />
                  <datalist id="brigadas-list">
                    {brigadas.map(b => <option key={b} value={b} />)}
                  </datalist>
                  <p className="text-xs text-gray-600 mt-2">Os registros de hora extra não serão alterados.</p>
                </div>
                {brigadas.length > 0 && (
                  <div>
                    <label className="text-xs text-gray-500 tracking-widest block mb-2">EQUIPES EXISTENTES</label>
                    <div className="flex flex-wrap gap-2">
                      {brigadas.map(b => (
                        <button key={b} onClick={() => setNovaBrigada(b)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider border transition-all ${novaBrigada === b ? "bg-orange-500 border-orange-500 text-white" : "bg-gray-800 border-gray-700 text-gray-400 hover:border-orange-500"}`}>
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setModalBrigada(false)} className="flex-1 py-3 rounded-xl font-bold tracking-wider text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 transition-all">CANCELAR</button>
                <button onClick={salvarBrigada}
                  className="flex-1 py-3 rounded-xl font-bold tracking-wider text-sm bg-orange-500 hover:bg-orange-400 text-white transition-all">SALVAR</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── LISTA ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-wider">HORA EXTRA</h2>
          <p className="text-gray-500 text-sm" style={{ fontFamily: "system-ui" }}>Controle de horas extras por equipe</p>
        </div>
        <div className="flex items-center gap-3">
          {saving && <span className="text-gray-500 text-xs" style={{ fontFamily: "system-ui" }}>💾 Salvando...</span>}
          <input type="month" value={mes} onChange={e => setMes(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500 text-sm" style={{ fontFamily: "system-ui" }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-orange-500/30 bg-orange-500/5 rounded-2xl p-5">
          <div className="text-4xl font-black text-white">{totalHorasMes}h</div>
          <div className="text-xs text-gray-400 tracking-wider mt-1">TOTAL EXTRAS — {mes}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="text-4xl font-black text-white">{brigadas.length}</div>
          <div className="text-xs text-gray-400 tracking-wider mt-1">EQUIPES</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="text-4xl font-black text-white">{agentes.length}</div>
          <div className="text-xs text-gray-400 tracking-wider mt-1">AGENTES</div>
        </div>
      </div>

      {/* Filtro por equipe */}
      <div className="flex gap-2 flex-wrap">
        {[{ id: null, label: "TODAS" }, ...brigadas.map(b => ({ id: b, label: b.toUpperCase() })), { id: "__sem__", label: "SEM EQUIPE" }].map(({ id, label }) => (
          <button key={String(id)} onClick={() => setBrigadaSel(id === brigadaSel ? null : id)}
            className={`px-4 py-2 rounded-xl font-bold text-sm tracking-wider transition-all border ${
              brigadaSel === id || (id === null && !brigadaSel)
                ? "bg-orange-500 border-orange-500 text-white"
                : "bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-600"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-10 text-gray-500" style={{ fontFamily: "system-ui" }}>Carregando agentes...</div>}

      {/* Agrupado por equipe (vista geral) */}
      {!brigadaSel && !loading && (
        <div className="space-y-8">
          {brigadas.map(brigada => {
            const membros = agentes.map((a, i) => ({ a, i })).filter(({ a }) => a.brigada === brigada);
            const totalB = membros.reduce((sum, { a }) => sum + horasDoMes(a, mes), 0);
            return (
              <div key={brigada}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-black text-white tracking-wider">{brigada.toUpperCase()}</h3>
                    <span className="text-gray-500 text-xs" style={{ fontFamily: "system-ui" }}>{membros.length} agente(s)</span>
                  </div>
                  <span className="text-orange-400 font-bold text-sm">{totalB}h em {mes}</span>
                </div>
                <div className="space-y-2">
                  {membros.map(({ a, i }) => (
                    <AgentCard key={i} a={a} i={i} mes={mes} horasDoMes={horasDoMes} onSelect={setAgSel} />
                  ))}
                </div>
              </div>
            );
          })}
          {agentes.some(a => !a.brigada) && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="font-bold text-gray-500 tracking-wider">SEM EQUIPE</h3>
                <span className="text-gray-600 text-xs" style={{ fontFamily: "system-ui" }}>{agentes.filter(a => !a.brigada).length} agente(s)</span>
              </div>
              <div className="space-y-2">
                {agentes.map((a, i) => !a.brigada && (
                  <AgentCard key={i} a={a} i={i} mes={mes} horasDoMes={horasDoMes} onSelect={setAgSel} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lista filtrada */}
      {brigadaSel && !loading && (
        <div className="space-y-2">
          {agentesVisiveis.map(({ a, i }) => (
            <AgentCard key={i} a={a} i={i} mes={mes} horasDoMes={horasDoMes} onSelect={setAgSel} />
          ))}
          {agentesVisiveis.length === 0 && (
            <div className="text-center py-10 text-gray-600" style={{ fontFamily: "system-ui" }}>Nenhum agente nesta equipe.</div>
          )}
        </div>
      )}
    </div>
  );
}

function AgentCard({ a, i, mes, horasDoMes, onSelect }) {
  const horas = horasDoMes(a, mes);
  return (
    <button onClick={() => onSelect(i)}
      className="w-full flex items-center justify-between bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl px-5 py-4 transition-all text-left group">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center font-black text-sm text-gray-400 flex-shrink-0">
          {a.nome?.charAt(0)}
        </div>
        <div>
          <div className="text-white font-bold text-sm group-hover:text-orange-400 transition-colors">{a.nome}</div>
          <div className="text-gray-500 text-xs" style={{ fontFamily: "system-ui" }}>{a.cargo}</div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {horas > 0 ? (
          <div className="text-right">
            <div className="text-orange-400 font-black text-lg leading-none">{horas}h</div>
            <div className="text-gray-600 text-xs mt-0.5" style={{ fontFamily: "system-ui" }}>{mes}</div>
          </div>
        ) : (
          <span className="text-gray-700 font-bold">0h</span>
        )}
        <span className="text-gray-600">›</span>
      </div>
    </button>
  );
}
