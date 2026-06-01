import { useContext, useState } from "react";
import { AppContext } from "../App";

const statusColor = {"Finalizado":"text-green-400 bg-green-500/10 border-green-500/30","Em Atendimento":"text-yellow-400 bg-yellow-500/10 border-yellow-500/30","Aguardando":"text-blue-400 bg-blue-500/10 border-blue-500/30","Cancelado":"text-red-400 bg-red-500/10 border-red-500/30"};

export default function OcorrenciaDetalhe() {
  const { selectedOcorrencia: o, navigateTo, ocorrencias, setOcorrencias } = useContext(AppContext);
  const [novoStatus, setNovoStatus] = useState(o?.status || "");
  const [obs, setObs] = useState("");
  const [saved, setSaved] = useState(false);

  if (!o) return (
    <div className="text-center py-20 text-gray-500" style={{fontFamily:"system-ui"}}>
      <div className="text-5xl mb-4">📋</div>
      <p>Nenhuma ocorrência selecionada.</p>
      <button onClick={()=>navigateTo('ocorrencias')} className="mt-4 text-orange-400 hover:text-orange-300 font-bold tracking-wider">← VOLTAR</button>
    </div>
  );

  const getTipo = () => {
    const entry = Object.entries(o.categorias).find(([,v])=>v);
    if (!entry) return "—";
    const labels = { combateIncendioUrbano:"Incêndio Urbano", combateIncendioFlorestal:"Incêndio Florestal", atendimentoPreHospitalar:"Atend. Pré-Hospitalar", buscaSalvamento:"Busca e Salvamento", capturaAnimal:"Captura Animal", corteArvore:"Corte de Árvore", remocaoCadaver:"Remoção Cadáver", apoioEventos:"Apoio a Eventos", defesaCivil:"Defesa Civil", outros:"Outros" };
    return `${labels[entry[0]] || entry[0]} — ${entry[1]}`;
  };

  const handleSalvar = () => {
    setOcorrencias(prev => prev.map(oc => oc.id === o.id ? { ...oc, status: novoStatus } : oc));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePrint = () => window.print();

  const handlePDF = () => {
    const tipo = getTipo();
    const cats = Object.entries(o.categorias).filter(([,v])=>v);
    const labelCat = {combateIncendioUrbano:"Incêndio Urbano",combateIncendioFlorestal:"Incêndio Florestal",atendimentoPreHospitalar:"Atend. Pré-Hospitalar",buscaSalvamento:"Busca e Salvamento",capturaAnimal:"Captura Animal",corteArvore:"Corte de Árvore",remocaoCadaver:"Remoção Cadáver",apoioEventos:"Apoio a Eventos",defesaCivil:"Defesa Civil",outros:"Outros"};

    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html><html lang="pt-BR"><head>
<meta charset="UTF-8"/>
<title>Ocorrência ${o.id}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; background: #fff; padding: 24px; }
  .header { display:flex; align-items:center; justify-content:space-between; border-bottom: 3px solid #f97316; padding-bottom: 16px; margin-bottom: 20px; }
  .logo { display:flex; align-items:center; gap: 12px; }
  .logo-box { width:48px; height:48px; background:#f97316; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:900; font-size:16px; }
  .org h1 { font-size:14px; font-weight:900; color:#f97316; letter-spacing:1px; }
  .org p { font-size:10px; color:#666; letter-spacing:1px; }
  .id-badge { background:#1f2937; color:#f97316; padding: 6px 14px; border-radius:6px; font-weight:900; font-size:13px; letter-spacing:1px; }
  .section { margin-bottom: 18px; }
  .section-title { font-size:10px; font-weight:900; letter-spacing:2px; color:#666; text-transform:uppercase; border-bottom:1px solid #e5e7eb; padding-bottom:6px; margin-bottom:12px; }
  .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .field label { font-size:9px; font-weight:700; color:#9ca3af; letter-spacing:1px; text-transform:uppercase; display:block; margin-bottom:3px; }
  .field span { font-size:12px; color:#1a1a1a; font-weight:600; }
  .descricao { background:#f9fafb; border:1px solid #e5e7eb; border-radius:6px; padding:12px; font-size:12px; line-height:1.6; color:#374151; }
  .status-badge { display:inline-block; padding:4px 12px; border-radius:20px; font-weight:900; font-size:11px; letter-spacing:1px; }
  .status-Finalizado { background:#d1fae5; color:#065f46; }
  .status-Em\\ Atendimento { background:#fef3c7; color:#92400e; }
  .status-Aguardando { background:#dbeafe; color:#1e40af; }
  .status-Cancelado { background:#fee2e2; color:#991b1b; }
  .cat-item { display:flex; justify-content:space-between; background:#f9fafb; border:1px solid #e5e7eb; border-radius:4px; padding:6px 10px; margin-bottom:4px; }
  .hist-item { display:flex; gap:10px; margin-bottom:8px; align-items:flex-start; }
  .hist-dot { width:10px; height:10px; background:#f97316; border-radius:50%; flex-shrink:0; margin-top:3px; }
  .footer { margin-top:30px; border-top:1px solid #e5e7eb; padding-top:12px; display:flex; justify-content:space-between; font-size:9px; color:#9ca3af; }
  @media print { body { padding:16px; } @page { margin:1cm; } }
</style></head><body>
<div class="header">
  <div class="logo">
    <div class="logo-box">DC</div>
    <div class="org">
      <h1>DEFESA CIVIL</h1>
      <p>AGENTES DE PROTEÇÃO E DEFESA CIVIL DE ORIXIMINÁ/PA</p>
      <p>Secretaria Municipal de Segurança Pública e Defesa Social</p>
    </div>
  </div>
  <div class="id-badge">${o.id}</div>
</div>

<div class="section">
  <div class="section-title">Informações Gerais</div>
  <div class="grid">
    <div class="field"><label>Data / Hora da Ocorrência</label><span>${new Date(o.dataHora).toLocaleString('pt-BR')}</span></div>
    <div class="field"><label>Status</label><span><span class="status-badge status-${o.status}">${o.status}</span></span></div>
    <div class="field"><label>Equipe</label><span>${o.equipe || "—"}</span></div>
    <div class="field"><label>Agente Responsável (ARP)</label><span>${o.arp || "—"}</span></div>
    <div class="field"><label>Bairro / Comunidade</label><span>${o.bairro || "—"}</span></div>
    <div class="field"><label>Endereço</label><span>${o.endereco || "—"}</span></div>
    <div class="field"><label>Tipo / Categoria</label><span>${tipo}</span></div>
    <div class="field"><label>Solicitante</label><span>${o.solicitante || "—"}</span></div>
  </div>
</div>

${cats.length > 0 ? `
<div class="section">
  <div class="section-title">Categorias Acionadas</div>
  ${cats.map(([k,v])=>`<div class="cat-item"><span>${labelCat[k]||k}</span><strong>${v}</strong></div>`).join("")}
</div>` : ""}

<div class="section">
  <div class="section-title">Descrição da Ocorrência</div>
  <div class="descricao">${o.descricao || "Sem descrição registrada."}</div>
</div>

${o.historico && o.historico.length > 0 ? `
<div class="section">
  <div class="section-title">Histórico</div>
  ${o.historico.map(h=>`<div class="hist-item"><div class="hist-dot"></div><div><strong>${h.status}</strong> &nbsp;·&nbsp; ${h.hora} &nbsp;·&nbsp; ${h.agente}</div></div>`).join("")}
</div>` : ""}

<div class="footer">
  <span>Gerado em ${new Date().toLocaleString('pt-BR')}</span>
  <span>Defesa Civil de Oriximiná/PA — (93) 99155-6518</span>
  <span>${o.id}</span>
</div>

<script>window.onload=()=>{window.print();}</script>
</body></html>`);
    win.document.close();
  };

  const temCoordenadas = o.lat != null && o.lng != null;
  const mapUrl = temCoordenadas
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${o.lng-0.01},${o.lat-0.01},${o.lng+0.01},${o.lat+0.01}&layer=mapnik&marker=${o.lat},${o.lng}`
    : "";

  return (
    <div className="space-y-5 max-w-5xl mx-auto" style={{fontFamily:"'Barlow Condensed',sans-serif"}}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={()=>navigateTo('ocorrencias')} className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-gray-800 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <div className="text-gray-500 text-xs font-mono">{o.id}</div>
            <h2 className="text-2xl font-black text-white tracking-wider">{o.bairro}</h2>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-xl font-bold text-sm tracking-wider transition-all">
            🖨️ IMPRIMIR
          </button>
          <button onClick={handlePDF} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold text-sm tracking-wider transition-all">
            📄 PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-5">
          {/* Info geral */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="font-bold text-white tracking-wider mb-4 text-sm border-b border-gray-800 pb-3">INFORMAÇÕES GERAIS</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label:"DATA / HORA", value: new Date(o.dataHora).toLocaleString('pt-BR') },
                { label:"EQUIPE", value: o.equipe },
                { label:"AGENTE RESPONSÁVEL", value: o.arp },
                { label:"TIPO / CATEGORIA", value: getTipo() },
                { label:"ENDEREÇO", value: o.endereco },
                { label:"BAIRRO/COMUNIDADE", value: o.bairro },
              ].map((item,i) => (
                <div key={i}>
                  <div className="text-xs text-gray-500 tracking-widest mb-1">{item.label}</div>
                  <div className="text-white font-semibold text-sm" style={{fontFamily:"system-ui"}}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Solicitante */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="font-bold text-white tracking-wider mb-4 text-sm border-b border-gray-800 pb-3">SOLICITANTE</h3>
            <p className="text-white text-sm" style={{fontFamily:"system-ui"}}>{o.solicitante}</p>
          </div>

          {/* Descrição */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="font-bold text-white tracking-wider mb-4 text-sm border-b border-gray-800 pb-3">DESCRIÇÃO DA OCORRÊNCIA</h3>
            <p className="text-gray-300 leading-relaxed text-sm" style={{fontFamily:"system-ui"}}>{o.descricao}</p>
          </div>

          {/* Fotos */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="font-bold text-white tracking-wider mb-4 text-sm border-b border-gray-800 pb-3">REGISTROS FOTOGRÁFICOS</h3>
            {o.fotos && o.fotos.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {o.fotos.map((foto,i) => (
                  <img key={i} src={foto} alt={`Foto ${i+1}`} className="rounded-xl object-cover aspect-square w-full"/>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600 border-2 border-dashed border-gray-800 rounded-xl" style={{fontFamily:"system-ui"}}>
                <div className="text-3xl mb-2">📷</div>
                <p className="text-sm">Nenhuma foto registrada para esta ocorrência.</p>
                <p className="text-xs mt-1 text-gray-700">Fotos enviadas pelo formulário aparecem aqui.</p>
              </div>
            )}
          </div>

          {/* Mapa */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="font-bold text-white tracking-wider mb-4 text-sm border-b border-gray-800 pb-3">LOCALIZAÇÃO NO MAPA</h3>
            {temCoordenadas ? (
              <>
                <div className="rounded-xl overflow-hidden" style={{height:"280px"}}>
                  <iframe
                    title="mapa-ocorrencia"
                    width="100%" height="100%"
                    src={mapUrl}
                    style={{border:0}}
                  />
                </div>
                <p className="text-gray-500 text-xs mt-2" style={{fontFamily:"system-ui"}}>
                  📍 Lat: {o.lat.toFixed(4)} · Lng: {o.lng.toFixed(4)} · {o.endereco}
                </p>
              </>
            ) : (
              <div className="text-center py-10 text-gray-600 border-2 border-dashed border-gray-800 rounded-xl" style={{fontFamily:"system-ui"}}>
                <div className="text-3xl mb-2">🗺️</div>
                <p className="text-sm">Coordenadas não disponíveis.</p>
                <p className="text-xs mt-1 text-gray-700">Endereço: {o.endereco || "—"}</p>
              </div>
            )}
          </div>
        </div>

        {/* Coluna lateral */}
        <div className="space-y-5">
          {/* Status */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="font-bold text-white tracking-wider mb-4 text-sm border-b border-gray-800 pb-3">STATUS DA OCORRÊNCIA</h3>
            <span className={`inline-block text-sm px-3 py-2 rounded-xl border font-bold mb-4 ${statusColor[o.status]}`}>{o.status}</span>
            <div className="mt-3">
              <label className="text-xs text-gray-500 tracking-widest block mb-2">ATUALIZAR STATUS</label>
              <select value={novoStatus} onChange={e=>setNovoStatus(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white outline-none text-sm mb-3" style={{fontFamily:"system-ui"}}>
                {["Aguardando","Em Atendimento","Finalizado","Cancelado"].map(s=><option key={s}>{s}</option>)}
              </select>
              <textarea value={obs} onChange={e=>setObs(e.target.value)} placeholder="Observações sobre a atualização..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white placeholder-gray-500 outline-none text-sm resize-none mb-3" style={{fontFamily:"system-ui"}} rows={3}/>
              <button onClick={handleSalvar}
                className={`w-full py-3 rounded-xl font-bold tracking-wider transition-all text-sm ${saved?'bg-green-500 text-white':'bg-orange-500 hover:bg-orange-400 text-white'}`}>
                {saved ? "✅ SALVO!" : "SALVAR ATUALIZAÇÃO"}
              </button>
            </div>
          </div>

          {/* Histórico */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="font-bold text-white tracking-wider mb-4 text-sm border-b border-gray-800 pb-3">HISTÓRICO</h3>
            <div className="space-y-3">
              {o.historico.map((h, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${i===0?'bg-orange-500':'bg-gray-600'}`}></div>
                    {i < o.historico.length-1 && <div className="w-px flex-1 bg-gray-800 mt-1"></div>}
                  </div>
                  <div className="pb-3">
                    <div className="text-white text-sm font-bold">{h.status}</div>
                    <div className="text-gray-500 text-xs" style={{fontFamily:"system-ui"}}>{h.hora} · {h.agente}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Categorias detalhadas */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="font-bold text-white tracking-wider mb-4 text-sm border-b border-gray-800 pb-3">CATEGORIAS ACIONADAS</h3>
            <div className="space-y-2">
              {Object.entries(o.categorias).filter(([,v])=>v).map(([k,v]) => {
                const labels = {combateIncendioUrbano:"🔥 Incêndio Urbano",combateIncendioFlorestal:"🌲 Incêndio Florestal",atendimentoPreHospitalar:"🚑 APH",buscaSalvamento:"🔍 Busca/Salvamento",capturaAnimal:"🐊 Captura Animal",corteArvore:"🌳 Corte Árvore",remocaoCadaver:"⚰️ Remoção Cadáver",apoioEventos:"🎪 Apoio Eventos",defesaCivil:"🏚️ Defesa Civil",outros:"📌 Outros"};
                return (
                  <div key={k} className="flex items-center justify-between bg-gray-800 rounded-xl px-3 py-2">
                    <span className="text-gray-300 text-xs">{labels[k]||k}</span>
                    <span className="text-orange-400 text-xs font-bold">{v}</span>
                  </div>
                );
              })}
              {Object.values(o.categorias).every(v=>!v) && <p className="text-gray-600 text-xs" style={{fontFamily:"system-ui"}}>Nenhuma categoria especificada.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
