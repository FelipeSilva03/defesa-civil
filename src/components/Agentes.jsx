import { useState, useEffect, useRef } from "react";
import { agentes as agentesIniciais } from "../data/mockData";

const CARGOS = ["Agente de Proteção e Defesa Civil","Chefe de Divisão Operacional","Coordenador","Supervisor"];
const TIPOS  = ["falta","atestado","ponto_positivo","ponto_negativo"];
const VAZIO_A = { num:"", nome:"", cpf:"", contato:"", nascimento:"", cargo:"Agente de Proteção e Defesa Civil" };
const VAZIO_R = { tipo:"falta", data:"", descricao:"" };
const API = `${import.meta.env.VITE_API_URL}/api/agentes`;

const tipoLabel = { falta:"Falta", atestado:"Atestado Médico", ponto_positivo:"Ponto Positivo", ponto_negativo:"Ponto Negativo" };
const tipoIcon  = { falta:"❌", atestado:"🏥", ponto_positivo:"⭐", ponto_negativo:"⚠️" };
const tipoStyle = {
  falta:          "bg-red-500/10 border-red-500/30 text-red-400",
  atestado:       "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
  ponto_positivo: "bg-green-500/10 border-green-500/30 text-green-400",
  ponto_negativo: "bg-orange-500/10 border-orange-500/30 text-orange-400",
};

export default function Agentes() {
  const [agentes,    setAgentes]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [erroSync,   setErroSync]   = useState(null);
  const [busca,      setBusca]      = useState("");
  const [selIdx,     setSelIdx]     = useState(null);
  const [modalA,     setModalA]     = useState(false);
  const [editIdx,    setEditIdx]    = useState(null);
  const [formA,      setFormA]      = useState(VAZIO_A);
  const [modalR,     setModalR]     = useState(false);
  const [formR,      setFormR]      = useState(VAZIO_R);
  const [filtroMes,  setFiltroMes]  = useState("");
  const [ultimaSync, setUltimaSync] = useState(null);
  const [salvouOk,   setSalvouOk]   = useState(false);

  const carregarRef  = useRef(null);
  const salvandoRef  = useRef(false);

  useEffect(() => {
    let active = true;

    const carregar = async (silencioso = false) => {
      if (salvandoRef.current) return; // não sobrescreve enquanto save está em andamento
      if (!silencioso) setLoading(true);
      try {
        const r = await fetch(API + "?t=" + Date.now());
        if (!r.ok) throw new Error("HTTP " + r.status);
        const d = await r.json();
        if (d.erro) throw new Error(d.erro);
        if (!active) return;

        if (d.agentes && d.agentes.length > 0) {
          setAgentes(d.agentes.map(a => ({ ...a, registros: Array.isArray(a.registros) ? a.registros : [] })));
          setErroSync(null);
          setUltimaSync(new Date());
        } else if (!silencioso) {
          // Servidor vazio no carregamento inicial — migra localStorage ou usa iniciais
          let lista;
          try {
            const salvo = JSON.parse(localStorage.getItem("dc_agentes") || "[]");
            lista = salvo.length > 0
              ? salvo.map(a => ({ ...a, registros: Array.isArray(a.registros) ? a.registros : [] }))
              : agentesIniciais.map(a => ({ ...a, registros: [] }));
          } catch { lista = agentesIniciais.map(a => ({ ...a, registros: [] })); }
          setAgentes(lista);
          fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agentes: lista }) });
          localStorage.removeItem("dc_agentes");
        }
      } catch {
        if (!active) return;
        if (!silencioso) setErroSync("Sem conexão com o servidor.");
      } finally {
        if (active && !silencioso) setLoading(false);
      }
    };

    carregarRef.current = () => carregar(false);
    carregar(false);
    const iv = setInterval(() => carregar(true), 10000); // polling a cada 10s
    return () => { active = false; clearInterval(iv); };
  }, []);

  const sync = async (lista) => {
    salvandoRef.current = true;
    setSaving(true);
    setErroSync(null);
    try {
      const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agentes: lista }) });
      if (!r.ok) throw new Error("HTTP " + r.status);
      setSalvouOk(true);
      setTimeout(() => setSalvouOk(false), 3000);
    } catch {
      setErroSync("Falha ao salvar — verifique a conexão");
    } finally {
      salvandoRef.current = false;
      setSaving(false);
    }
  };

  const upd = (lista) => { setAgentes(lista); sync(lista); };

  // ── Agente CRUD ──────────────────────────────────────────────
  const novoAgente = () => {
    setFormA({ ...VAZIO_A, num: String(agentes.length + 1).padStart(2,"0") });
    setEditIdx(null); setModalA(true);
  };
  const editarAgente = (idx, e) => {
    e?.stopPropagation();
    setFormA({ ...agentes[idx] }); setEditIdx(idx); setModalA(true);
  };
  const salvarAgente = () => {
    if (!formA.nome) return;
    const nova = editIdx !== null
      ? agentes.map((a, i) => i === editIdx ? { ...a, ...formA } : a)
      : [...agentes, { ...formA, registros: [] }];
    upd(nova); setModalA(false);
  };
  const excluirAgente = (idx, e) => {
    e?.stopPropagation();
    if (!confirm(`Excluir ${agentes[idx].nome}?`)) return;
    upd(agentes.filter((_, i) => i !== idx));
    if (selIdx === idx) setSelIdx(null);
  };

  // ── Registro CRUD ─────────────────────────────────────────────
  const salvarReg = () => {
    if (!formR.data || !formR.descricao || selIdx === null) return;
    const nova = agentes.map((a, i) => i === selIdx
      ? { ...a, registros: [...(a.registros || []), { ...formR, id: Date.now() }] }
      : a);
    upd(nova); setModalR(false); setFormR(VAZIO_R);
  };
  const excluirReg = (regId) => {
    const nova = agentes.map((a, i) => i === selIdx
      ? { ...a, registros: (a.registros || []).filter(r => r.id !== regId) }
      : a);
    upd(nova);
  };

  // ── Ficha PDF ─────────────────────────────────────────────────
  const exportarFicha = async (ag) => {
    let logo64 = "";
    try {
      const r = await fetch("/logo-defesa-civil.jpg");
      const b = await r.blob();
      logo64 = await new Promise(res => { const rd = new FileReader(); rd.onloadend = () => res(rd.result); rd.readAsDataURL(b); });
    } catch {}

    const todos = ag.registros || [];
    const cntAll = (t) => todos.filter(r => r.tipo === t).length;
    const inicial = ag.nome?.charAt(0) || "?";
    const isChefe = ag.cargo === "Chefe de Divisão Operacional";

    const tipoLabelPdf = { falta:"Falta", atestado:"Atestado Médico", ponto_positivo:"Ponto Positivo", ponto_negativo:"Ponto Negativo" };
    const tipoColor = { falta:"#ef4444", atestado:"#eab308", ponto_positivo:"#22c55e", ponto_negativo:"#f97316" };
    const tipoBg    = { falta:"#fef2f2", atestado:"#fefce8", ponto_positivo:"#f0fdf4", ponto_negativo:"#fff7ed" };

    const regsOrdenados = [...todos].sort((a,b) => (b.data||"").localeCompare(a.data||""));
    const regsHTML = regsOrdenados.length === 0
      ? `<tr><td colspan="3" style="text-align:center;color:#999;padding:16px">Nenhum registro cadastrado</td></tr>`
      : regsOrdenados.map(r => `
          <tr>
            <td style="text-align:center;white-space:nowrap">
              <span style="background:${tipoBg[r.tipo]};color:${tipoColor[r.tipo]};border:1px solid ${tipoColor[r.tipo]}40;
                border-radius:12px;padding:2px 8px;font-size:8.5pt;font-weight:bold">
                ${tipoLabelPdf[r.tipo] || r.tipo}
              </span>
            </td>
            <td style="text-align:center;white-space:nowrap;color:#555;font-size:9pt">
              ${r.data ? new Date(r.data+"T00:00:00").toLocaleDateString("pt-BR") : "—"}
            </td>
            <td style="font-size:9pt">${r.descricao || "—"}</td>
          </tr>`).join("");

    const logoTag = logo64 ? `<img src="${logo64}" style="width:58px;height:58px;object-fit:contain" alt="">` : "";

    const html = `<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="UTF-8">
<title>Ficha — ${ag.nome}</title>
<style>
  @page { size: A4 portrait; margin: 14mm 12mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 9.5pt; color: #111; margin: 0; }
  .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 6px; }
  .header-mid { flex: 1; text-align: center; line-height: 1.5; }
  .sep  { border:none; border-top:2px solid #333; margin:4px 0 10px; }
  .sep2 { border:none; border-top:1px solid #ccc; margin:10px 0; }
  .titulo { text-align:center; font-weight:bold; font-size:11pt; text-transform:uppercase; letter-spacing:1px; margin-bottom:14px; }
  .avatar { width:70px;height:70px;border-radius:12px;display:flex;align-items:center;justify-content:center;
    font-size:30pt;font-weight:900;color:#fff;background:${isChefe?"#f97316":"#374151"};margin-right:16px;flex-shrink:0; }
  .dados-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px 16px; margin-bottom:14px; }
  .dado .label { font-size:7.5pt;color:#888;text-transform:uppercase;letter-spacing:.6px;margin-bottom:2px; }
  .dado .valor { font-size:10pt;font-weight:bold;color:#111; }
  .kpi-row { display:flex; gap:10px; margin-bottom:14px; }
  .kpi { flex:1; border-radius:10px; padding:10px 8px; text-align:center; border:1px solid; }
  .kpi .num  { font-size:22pt; font-weight:900; line-height:1; }
  .kpi .desc { font-size:7pt; text-transform:uppercase; letter-spacing:.5px; margin-top:2px; color:#555; }
  table { width:100%; border-collapse:collapse; }
  th { background:#f3f4f6; border:1px solid #d1d5db; padding:5px 8px; font-size:8.5pt; text-transform:uppercase; letter-spacing:.4px; }
  td { border:1px solid #e5e7eb; padding:5px 8px; vertical-align:middle; }
  .section-title { font-weight:bold; font-size:9pt; text-transform:uppercase; letter-spacing:.6px; color:#374151;
    border-bottom:1px solid #e5e7eb; padding-bottom:4px; margin-bottom:8px; }
  .signature { text-align:center; margin-top:40px; font-size:9.5pt; }
  .assin-linha { display:inline-block; border-top:1px solid #000; width:260px; margin-bottom:4px; }
  .footer { text-align:center; margin-top:10px; font-size:7.5pt; color:#888; border-top:1px solid #e5e7eb; padding-top:4px; }
  .cargo-badge { display:inline-block; background:${isChefe?"#fff7ed":"#f3f4f6"};
    color:${isChefe?"#ea580c":"#374151"}; border:1px solid ${isChefe?"#fed7aa":"#d1d5db"};
    border-radius:8px; padding:2px 10px; font-size:9pt; font-weight:bold; }
</style>
</head><body>
<div class="header">
  <div style="width:62px">${logoTag}</div>
  <div class="header-mid">
    <strong style="font-size:10.5pt">Prefeitura Municipal de Oriximiná</strong><br>
    <strong>Secretaria Municipal de Segurança Pública e Defesa Social</strong><br>
    <span style="font-size:8pt">Tv. Ângelo Augusto, nº 832 – Santa Terezinha – CEP: 68270-000 – Oriximiná/PA</span>
  </div>
  <div style="width:62px;text-align:right">${logoTag}</div>
</div>
<hr class="sep">
<div class="titulo">Ficha Individual do Agente</div>
<div style="display:flex;align-items:center;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:14px 18px;margin-bottom:14px">
  <div class="avatar">${inicial}</div>
  <div>
    <div style="font-size:17pt;font-weight:900;color:#111;line-height:1.1">${ag.nome || "—"}</div>
    <div style="margin-top:4px"><span class="cargo-badge">${ag.cargo || "—"}</span></div>
    ${ag.num ? `<div style="margin-top:4px;font-size:8.5pt;color:#888">Agente N° ${ag.num}</div>` : ""}
  </div>
</div>
<div class="section-title">Dados Cadastrais</div>
<div class="dados-grid">
  <div class="dado"><div class="label">N° na Lista</div><div class="valor">${ag.num || "—"}</div></div>
  <div class="dado"><div class="label">CPF</div><div class="valor">${ag.cpf || "—"}</div></div>
  <div class="dado"><div class="label">Contato</div><div class="valor">${ag.contato || "—"}</div></div>
  <div class="dado"><div class="label">Data de Nascimento</div><div class="valor">${ag.nascimento || "—"}</div></div>
  <div class="dado"><div class="label">Cargo</div><div class="valor">${ag.cargo || "—"}</div></div>
</div>
<hr class="sep2">
<div class="section-title">Resumo de Ocorrências</div>
<div class="kpi-row">
  <div class="kpi" style="background:#fef2f2;border-color:#fecaca">
    <div class="num" style="color:#dc2626">${cntAll("falta")}</div>
    <div class="desc">Faltas</div>
  </div>
  <div class="kpi" style="background:#fefce8;border-color:#fde68a">
    <div class="num" style="color:#ca8a04">${cntAll("atestado")}</div>
    <div class="desc">Atestados</div>
  </div>
  <div class="kpi" style="background:#f0fdf4;border-color:#bbf7d0">
    <div class="num" style="color:#16a34a">${cntAll("ponto_positivo")}</div>
    <div class="desc">Pontos Positivos</div>
  </div>
  <div class="kpi" style="background:#fff7ed;border-color:#fed7aa">
    <div class="num" style="color:#ea580c">${cntAll("ponto_negativo")}</div>
    <div class="desc">Pontos Negativos</div>
  </div>
</div>
<hr class="sep2">
<div class="section-title">Histórico de Registros (${todos.length})</div>
<table>
  <thead>
    <tr>
      <th style="width:120px">Tipo</th>
      <th style="width:80px">Data</th>
      <th>Descrição</th>
    </tr>
  </thead>
  <tbody>${regsHTML}</tbody>
</table>
<div class="signature">
  <br><br>
  <div class="assin-linha"></div><br>
  <strong>Cezar Adriano Pinheiro Nobre</strong><br>
  Chefe de divisão operacional<br>
  Decreto N° 301/2025
</div>
<div class="footer">
  Gerado em ${new Date().toLocaleDateString("pt-BR")} · Trav. Ângelo Augusto, 832 – CEP: 68.270-000 – Fone: (93) 992183618
</div>
<script>window.onload = () => setTimeout(() => window.print(), 400);<\/script>
</body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url  = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };

  // ── Dados derivados ───────────────────────────────────────────
  const filtrados = agentes
    .map((a, i) => ({ a, i }))
    .filter(({ a }) => !busca ||
      a.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      a.contato?.includes(busca) ||
      a.cpf?.includes(busca));

  const chefeIdx = agentes.findIndex(a => a.cargo === "Chefe de Divisão Operacional");
  const chefe    = chefeIdx >= 0 ? agentes[chefeIdx] : null;
  const semDados = agentes.filter(a => !a.cpf || !a.contato).length;

  const agSel = selIdx !== null ? agentes[selIdx] : null;
  const regs  = (agSel?.registros || []).filter(r => !filtroMes || r.data?.startsWith(filtroMes));
  const cnt   = (t) => regs.filter(r => r.tipo === t).length;

  // ── PERFIL ────────────────────────────────────────────────────
  if (agSel) return (
    <div className="space-y-6" style={{ fontFamily:"'Barlow Condensed',sans-serif" }}>
      <div className="flex items-center gap-4 flex-wrap">
        <button onClick={() => setSelIdx(null)} className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-gray-800 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-black text-2xl flex-shrink-0 ${agSel.cargo==="Chefe de Divisão Operacional"?"bg-orange-500 text-white":"bg-gray-700 text-gray-300"}`}>
          {agSel.nome?.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="text-white font-black text-2xl tracking-wider">{agSel.nome}</div>
          <div className="text-gray-400 text-sm" style={{fontFamily:"system-ui"}}>{agSel.cargo}</div>
        </div>
        <button onClick={() => exportarFicha(agSel)} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-xl font-bold text-sm tracking-wider transition-all">📄 FICHA</button>
        <button onClick={() => editarAgente(selIdx)} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-xl font-bold text-sm tracking-wider transition-all">✏️ EDITAR</button>
        <button onClick={() => { setModalR(true); setFormR(VAZIO_R); }} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-4 py-2 rounded-xl font-bold text-sm tracking-wider transition-all">+ REGISTRO</button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h3 className="font-bold text-white tracking-wider mb-4 text-sm border-b border-gray-800 pb-3">DADOS CADASTRAIS</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4" style={{fontFamily:"system-ui"}}>
          {[["N°",agSel.num],["CPF",agSel.cpf],["CONTATO",agSel.contato],["NASCIMENTO",agSel.nascimento],["CARGO",agSel.cargo]].map(([l,v])=>(
            <div key={l}><div className="text-xs text-gray-500 tracking-widest mb-1">{l}</div><div className="text-white font-semibold text-sm">{v||"—"}</div></div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex gap-3 flex-1">
          {[["falta","Faltas","border-red-500/30 bg-red-500/5","text-red-400"],["atestado","Atestados","border-yellow-500/30 bg-yellow-500/5","text-yellow-400"],["ponto_positivo","Pontos Positivos","border-green-500/30 bg-green-500/5","text-green-400"],["ponto_negativo","Pontos Negativos","border-orange-500/30 bg-orange-500/5","text-orange-400"]].map(([tipo,label,color,num])=>(
            <div key={tipo} className={`bg-gray-900 border rounded-2xl p-4 flex-1 ${color}`}>
              <div className={`text-3xl font-black ${num}`}>{cnt(tipo)}</div>
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

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
          <h3 className="font-bold text-white tracking-wider text-sm">REGISTROS</h3>
          <span className="text-gray-500 text-xs" style={{fontFamily:"system-ui"}}>{regs.length} registro(s)</span>
        </div>
        {regs.length === 0 ? (
          <div className="text-center py-10 text-gray-600" style={{fontFamily:"system-ui"}}>
            <div className="text-3xl mb-2">📋</div>
            <p className="text-sm">Nenhum registro{filtroMes?" neste mês":""}.</p>
          </div>
        ) : (
          [...regs].sort((a,b) => b.data?.localeCompare(a.data)).map(r => (
            <div key={r.id} className="flex items-start justify-between px-5 py-4 border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
              <div className="flex items-start gap-4">
                <span className={`text-xs px-2 py-1 rounded-full border font-bold flex-shrink-0 mt-0.5 ${tipoStyle[r.tipo]}`}>{tipoIcon[r.tipo]} {tipoLabel[r.tipo]}</span>
                <div>
                  <div className="text-white font-semibold text-sm" style={{fontFamily:"system-ui"}}>{r.descricao}</div>
                  {r.data && <div className="text-gray-500 text-xs mt-1" style={{fontFamily:"system-ui"}}>{new Date(r.data+"T00:00:00").toLocaleDateString("pt-BR")}</div>}
                </div>
              </div>
              <button onClick={() => excluirReg(r.id)} className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all flex-shrink-0">🗑️</button>
            </div>
          ))
        )}
      </div>

      {modalR && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={e=>e.target===e.currentTarget&&setModalR(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md" style={{fontFamily:"system-ui"}}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-white tracking-wider" style={{fontFamily:"'Barlow Condensed',sans-serif"}}>NOVO REGISTRO</h3>
              <button onClick={()=>setModalR(false)} className="text-gray-500 hover:text-white text-xl">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 tracking-widest block mb-1.5">TIPO *</label>
                <div className="grid grid-cols-3 gap-2">
                  {TIPOS.map(t=>(
                    <button key={t} onClick={()=>setFormR(f=>({...f,tipo:t}))}
                      className={`py-2 rounded-xl text-xs font-bold tracking-wider transition-all border ${formR.tipo===t?"bg-orange-500 border-orange-500 text-white":"bg-gray-800 border-gray-700 text-gray-400 hover:border-orange-500"}`}>
                      {tipoIcon[t]} {tipoLabel[t]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 tracking-widest block mb-1.5">DATA *</label>
                <input type="date" value={formR.data} onChange={e=>setFormR(f=>({...f,data:e.target.value}))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-orange-500 text-sm"/>
              </div>
              <div>
                <label className="text-xs text-gray-400 tracking-widest block mb-1.5">DESCRIÇÃO *</label>
                <textarea value={formR.descricao} onChange={e=>setFormR(f=>({...f,descricao:e.target.value}))}
                  placeholder={formR.tipo==="falta"?"Ex: Falta sem justificativa":formR.tipo==="atestado"?"Ex: Atestado médico — gripe":"Ex: Excelente desempenho na ocorrência"}
                  rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 outline-none focus:border-orange-500 text-sm resize-none"/>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={()=>setModalR(false)} className="flex-1 py-3 rounded-xl font-bold tracking-wider text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 transition-all">CANCELAR</button>
              <button onClick={salvarReg} disabled={!formR.data||!formR.descricao}
                className="flex-1 py-3 rounded-xl font-bold tracking-wider text-sm bg-orange-500 hover:bg-orange-400 disabled:bg-gray-700 disabled:text-gray-500 text-white transition-all">SALVAR</button>
            </div>
          </div>
        </div>
      )}
      {modalA && <ModalAgente formA={formA} setFormA={setFormA} onSave={salvarAgente} onClose={()=>setModalA(false)} editIdx={editIdx}/>}
    </div>
  );

  // ── LISTA ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6" style={{ fontFamily:"'Barlow Condensed',sans-serif" }}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-wider">AGENTES</h2>
          <p className="text-gray-500 text-sm" style={{fontFamily:"system-ui"}}>Brigada de Incêndio — Defesa Civil Oriximiná/PA</p>
        </div>
        <div className="flex items-center gap-3">
          {saving && <span className="text-gray-500 text-xs" style={{fontFamily:"system-ui"}}>💾 Salvando...</span>}
          {salvouOk && !saving && <span className="text-green-400 text-xs" style={{fontFamily:"system-ui"}}>✅ Salvo!</span>}
          {erroSync && <span className="text-red-400 text-xs" style={{fontFamily:"system-ui"}}>⚠️ {erroSync}</span>}
          {ultimaSync && !erroSync && !saving && (
            <span className="text-gray-600 text-xs hidden md:block" style={{fontFamily:"system-ui"}} title="Última sincronização com o servidor">
              🔁 {ultimaSync.toLocaleTimeString("pt-BR", {hour:"2-digit",minute:"2-digit"})}
            </span>
          )}
          <button onClick={() => carregarRef.current?.()} title="Atualizar dados"
            className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-base">🔄</button>
          <button onClick={novoAgente} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-5 py-2.5 rounded-xl font-bold text-sm tracking-wider transition-all">+ NOVO AGENTE</button>
        </div>
      </div>

      {/* Estado de erro sem dados */}
      {erroSync && agentes.length === 0 && !loading && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center" style={{fontFamily:"system-ui"}}>
          <div className="text-4xl mb-3">📡</div>
          <p className="text-red-400 font-semibold mb-1">Não foi possível conectar ao servidor</p>
          <p className="text-gray-500 text-sm mb-4">Verifique sua conexão e tente novamente.</p>
          <button onClick={() => carregarRef.current?.()}
            className="bg-orange-500 hover:bg-orange-400 text-white px-6 py-2.5 rounded-xl font-bold text-sm tracking-wider transition-all">
            🔄 TENTAR NOVAMENTE
          </button>
        </div>
      )}

      {!erroSync || agentes.length > 0 ? (<>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-900 border border-orange-500/30 bg-orange-500/5 rounded-2xl p-5"><div className="text-4xl font-black text-white">{agentes.length}</div><div className="text-xs text-gray-400 tracking-wider mt-1">TOTAL DE AGENTES</div></div>
          <div className="bg-gray-900 border border-green-500/30 bg-green-500/5 rounded-2xl p-5"><div className="text-4xl font-black text-white">{agentes.length-semDados}</div><div className="text-xs text-gray-400 tracking-wider mt-1">CADASTROS COMPLETOS</div></div>
          <div className="bg-gray-900 border border-yellow-500/30 bg-yellow-500/5 rounded-2xl p-5"><div className="text-4xl font-black text-white">{semDados}</div><div className="text-xs text-gray-400 tracking-wider mt-1">DADOS INCOMPLETOS</div></div>
        </div>

        {chefe && (
          <button onClick={() => setSelIdx(chefeIdx)} className="w-full bg-gray-900 border border-orange-500/40 hover:border-orange-500 rounded-2xl p-5 flex items-center justify-between gap-5 transition-colors text-left">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black text-2xl flex-shrink-0">{chefe.nome?.charAt(0)}</div>
              <div>
                <div className="text-xs text-orange-400 tracking-widest mb-1">CHEFIA — clique para ver perfil</div>
                <div className="text-white font-black text-xl tracking-wide">{chefe.nome}</div>
                <div className="text-gray-400 text-sm" style={{fontFamily:"system-ui"}}>{chefe.cargo}</div>
                {chefe.contato && <div className="text-gray-500 text-xs mt-1" style={{fontFamily:"system-ui"}}>📞 {chefe.contato}</div>}
              </div>
            </div>
            <span className="text-gray-500 text-2xl">›</span>
          </button>
        )}

        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
          <input type="text" value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar por nome, CPF ou telefone..."
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-600 outline-none focus:border-orange-500/50 text-sm" style={{fontFamily:"system-ui"}}/>
        </div>

        {loading && <div className="text-center py-10 text-gray-500" style={{fontFamily:"system-ui"}}>Carregando agentes...</div>}
        <div className="space-y-2">
          {filtrados.map(({ a, i }) => {
            const isChefe = a.cargo === "Chefe de Divisão Operacional";
            const totalRegs = a.registros?.length || 0;
            return (
              <button key={i} onClick={() => setSelIdx(i)}
                className={`w-full flex items-center justify-between bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl px-5 py-4 transition-all text-left group ${isChefe?"bg-orange-500/5":""}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0 ${isChefe?"bg-orange-500 text-white":"bg-gray-800 text-gray-400"}`}>{a.nome?.charAt(0)}</div>
                  <div>
                    <div className="text-white font-bold text-sm group-hover:text-orange-400 transition-colors">{a.nome}</div>
                    <div className="text-gray-500 text-xs" style={{fontFamily:"system-ui"}}>{a.contato || "—"}{totalRegs > 0 ? ` · ${totalRegs} registro(s)` : ""}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 text-xs hidden md:block" style={{fontFamily:"system-ui"}}>{a.cargo}</span>
                  <button onClick={e=>editarAgente(i,e)} className="p-1.5 text-gray-600 hover:text-white hover:bg-gray-700 rounded-lg transition-all">✏️</button>
                  <button onClick={e=>excluirAgente(i,e)} className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">🗑️</button>
                  <span className="text-gray-600">›</span>
                </div>
              </button>
            );
          })}
          {filtrados.length === 0 && !loading && <div className="text-center py-10 text-gray-600" style={{fontFamily:"system-ui"}}>Nenhum agente encontrado.</div>}
        </div>

        <div className="text-gray-600 text-xs text-right" style={{fontFamily:"system-ui"}}>Secretaria Municipal de Segurança Pública e Defesa Social — Oriximiná/PA · {agentes.length} agentes</div>
      </>) : null}

      {modalA && <ModalAgente formA={formA} setFormA={setFormA} onSave={salvarAgente} onClose={()=>setModalA(false)} editIdx={editIdx}/>}
    </div>
  );
}

function ModalAgente({ formA, setFormA, onSave, onClose, editIdx }) {
  const inp = (key, ph, type="text") => (
    <input type={type} value={formA[key]||""} onChange={e=>setFormA(f=>({...f,[key]:e.target.value}))} placeholder={ph}
      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 outline-none focus:border-orange-500 text-sm"/>
  );
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" style={{fontFamily:"system-ui"}}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-white tracking-wider" style={{fontFamily:"'Barlow Condensed',sans-serif"}}>{editIdx!==null?"EDITAR AGENTE":"NOVO AGENTE"}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
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
            <select value={formA.cargo||""} onChange={e=>setFormA(f=>({...f,cargo:e.target.value}))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-orange-500 text-sm">
              {["Agente de Proteção e Defesa Civil","Chefe de Divisão Operacional","Coordenador","Supervisor"].map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold tracking-wider text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 transition-all">CANCELAR</button>
          <button onClick={onSave} disabled={!formA.nome} className="flex-1 py-3 rounded-xl font-bold tracking-wider text-sm bg-orange-500 hover:bg-orange-400 disabled:bg-gray-700 disabled:text-gray-500 text-white transition-all">{editIdx!==null?"SALVAR":"CADASTRAR"}</button>
        </div>
      </div>
    </div>
  );
}
