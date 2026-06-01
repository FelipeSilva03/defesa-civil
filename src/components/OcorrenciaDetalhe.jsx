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

  const handlePDF = () => {
    const tipo = getTipo();
    const cats = Object.entries(o.categorias).filter(([,v])=>v);
    const labelCat = {combateIncendioUrbano:"Incêndio Urbano",combateIncendioFlorestal:"Incêndio Florestal",atendimentoPreHospitalar:"Atend. Pré-Hospitalar",buscaSalvamento:"Busca e Salvamento",capturaAnimal:"Captura Animal",corteArvore:"Corte de Árvore",remocaoCadaver:"Remoção Cadáver",apoioEventos:"Apoio a Eventos",defesaCivil:"Defesa Civil",outros:"Outros"};
    const logoUrl = window.location.origin + "/logo-defesa-civil.jpg";

    const html = `<!DOCTYPE html><html lang="pt-BR"><head>
<meta charset="UTF-8"/>
<title>Ocorrência ${o.id}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:Arial,sans-serif;font-size:12px;color:#1a1a1a;background:#fff;padding:28px;}
  .header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #f97316;padding-bottom:14px;margin-bottom:18px;}
  .logo-wrap{display:flex;align-items:center;gap:12px;}
  .org-title{font-size:14px;font-weight:900;color:#f97316;letter-spacing:1px;}
  .org-sub{font-size:10px;color:#555;margin-top:2px;}
  .badge{background:#1f2937;color:#f97316;padding:5px 12px;border-radius:6px;font-weight:900;font-size:13px;letter-spacing:1px;}
  .sec{margin-bottom:16px;}
  .sec-title{font-size:9px;font-weight:900;letter-spacing:2px;color:#888;text-transform:uppercase;border-bottom:1px solid #e5e7eb;padding-bottom:5px;margin-bottom:10px;}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  .field-label{font-size:9px;font-weight:700;color:#aaa;letter-spacing:1px;text-transform:uppercase;margin-bottom:2px;}
  .field-val{font-size:12px;color:#1a1a1a;font-weight:600;}
  .desc{background:#f9fafb;border:1px solid #e5e7eb;border-radius:5px;padding:10px;font-size:11px;line-height:1.6;color:#374151;}
  .cat{display:flex;justify-content:space-between;background:#f9fafb;border:1px solid #e5e7eb;border-radius:4px;padding:5px 8px;margin-bottom:3px;font-size:11px;}
  .hist{display:flex;gap:8px;margin-bottom:6px;font-size:11px;}
  .dot{width:9px;height:9px;background:#f97316;border-radius:50%;flex-shrink:0;margin-top:2px;}
  .footer{margin-top:24px;border-top:1px solid #e5e7eb;padding-top:10px;display:flex;justify-content:space-between;font-size:9px;color:#aaa;}
  @page{margin:1cm;}
</style></head><body>
<div class="header">
  <div class="logo-wrap">
    <img src="${logoUrl}" style="width:52px;height:52px;border-radius:50%;object-fit:cover;" />
    <div>
      <div class="org-title">DEFESA CIVIL — ORIXIMINÁ/PA</div>
      <div class="org-sub">Agentes de Proteção e Defesa Civil</div>
      <div class="org-sub">Secretaria Municipal de Segurança Pública e Defesa Social</div>
    </div>
  </div>
  <div class="badge">${o.id}</div>
</div>

<div class="sec">
  <div class="sec-title">Informações Gerais</div>
  <div class="grid">
    ${[["Data / Hora",new Date(o.dataHora).toLocaleString('pt-BR')],["Status",o.status],["Equipe",o.equipe||"—"],["Agente (ARP)",o.arp||"—"],["Bairro",o.bairro||"—"],["Endereço",o.endereco||"—"],["Tipo / Categoria",tipo],["Solicitante",o.solicitante||"—"]]
      .map(([l,v])=>`<div><div class="field-label">${l}</div><div class="field-val">${v}</div></div>`).join("")}
  </div>
</div>

${cats.length>0?`<div class="sec"><div class="sec-title">Categorias Acionadas</div>${cats.map(([k,v])=>`<div class="cat"><span>${labelCat[k]||k}</span><strong>${v}</strong></div>`).join("")}</div>`:""}

<div class="sec">
  <div class="sec-title">Descrição da Ocorrência</div>
  <div class="desc">${o.descricao||"Sem descrição registrada."}</div>
</div>

${o.historico?.length>0?`<div class="sec"><div class="sec-title">Histórico</div>${o.historico.map(h=>`<div class="hist"><div class="dot"></div><div><strong>${h.status}</strong> · ${h.hora} · ${h.agente}</div></div>`).join("")}</div>`:""}

<div class="footer">
  <span>Gerado em ${new Date().toLocaleString('pt-BR')}</span>
  <span>Defesa Civil de Oriximiná/PA — (93) 99155-6518</span>
  <span>${o.id}</span>
</div>
</body></html>`;

    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-10000px;left:-10000px;width:1px;height:1px;border:0;";
    document.body.appendChild(iframe);
    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    iframe.contentWindow.focus();
    setTimeout(() => {
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 2000);
    }, 500);
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
          <button onClick={handlePDF} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl font-bold text-sm tracking-wider transition-all">
            📄 IMPRIMIR / PDF
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
                {["Finalizado","Em Atendimento","Cancelado"].map(s=><option key={s}>{s}</option>)}
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
