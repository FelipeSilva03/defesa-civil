import { useContext, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AppContext } from "../App";

const statusColor = {"Finalizado":"text-green-400 bg-green-500/10 border-green-500/30","Em Atendimento":"text-yellow-400 bg-yellow-500/10 border-yellow-500/30","Aguardando":"text-blue-400 bg-blue-500/10 border-blue-500/30","Cancelado":"text-red-400 bg-red-500/10 border-red-500/30"};

export default function OcorrenciaDetalhe() {
  const { selectedOcorrencia: o, navigateTo, ocorrencias, setOcorrencias } = useContext(AppContext);
  const [novoStatus, setNovoStatus] = useState(o?.status || "");
  const [obs, setObs] = useState("");
  const [saved, setSaved] = useState(false);
  const [printing, setPrinting] = useState(false);

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

  useEffect(() => {
    if (!printing) return;
    const imagens = document.querySelectorAll("#dc-print-overlay img");
    if (imagens.length === 0) {
      window.print();
      const t = setTimeout(() => setPrinting(false), 1500);
      return () => clearTimeout(t);
    }
    let carregadas = 0;
    const total = imagens.length;
    const tentar = () => {
      carregadas++;
      if (carregadas >= total) {
        window.print();
        setTimeout(() => setPrinting(false), 1500);
      }
    };
    imagens.forEach(img => {
      if (img.complete) { tentar(); }
      else { img.onload = tentar; img.onerror = tentar; }
    });
    const fallback = setTimeout(() => { window.print(); setTimeout(() => setPrinting(false), 1500); }, 5000);
    return () => clearTimeout(fallback);
  }, [printing]);

  const handlePDF = () => setPrinting(true);

  const temCoordenadas = o.lat != null && o.lng != null;
  const mapUrl = temCoordenadas
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${o.lng-0.01},${o.lat-0.01},${o.lng+0.01},${o.lat+0.01}&layer=mapnik&marker=${o.lat},${o.lng}`
    : "";

  const tipo = getTipo();
  const cats = Object.entries(o.categorias).filter(([,v])=>v);
  const labelCat = {combateIncendioUrbano:"Incêndio Urbano",combateIncendioFlorestal:"Incêndio Florestal",atendimentoPreHospitalar:"Atend. Pré-Hospitalar",buscaSalvamento:"Busca e Salvamento",capturaAnimal:"Captura Animal",corteArvore:"Corte de Árvore",remocaoCadaver:"Remoção Cadáver",apoioEventos:"Apoio a Eventos",defesaCivil:"Defesa Civil",outros:"Outros"};

  const overlay = {position:"fixed",top:0,left:0,right:0,bottom:0,background:"white",color:"#1a1a1a",zIndex:99999,overflow:"auto",padding:28,fontFamily:"Arial,sans-serif",fontSize:12};

  return (
    <>
    {printing && createPortal(
      <div id="dc-print-overlay" style={overlay}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"3px solid #f97316",paddingBottom:14,marginBottom:18}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <img src="/logo-defesa-civil.jpg" alt="Logo" style={{width:52,height:52,borderRadius:"50%",objectFit:"cover"}}/>
            <div>
              <div style={{fontSize:14,fontWeight:900,color:"#f97316",letterSpacing:1}}>DEFESA CIVIL — ORIXIMINÁ/PA</div>
              <div style={{fontSize:10,color:"#555",marginTop:2}}>Agentes de Proteção e Defesa Civil</div>
              <div style={{fontSize:10,color:"#555"}}>Secretaria Municipal de Segurança Pública e Defesa Social</div>
            </div>
          </div>
          <div style={{background:"#1f2937",color:"#f97316",padding:"5px 12px",borderRadius:6,fontWeight:900,fontSize:13,letterSpacing:1}}>{o.id}</div>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:9,fontWeight:900,letterSpacing:2,color:"#888",textTransform:"uppercase",borderBottom:"1px solid #e5e7eb",paddingBottom:5,marginBottom:10}}>Informações Gerais</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[["Data / Hora",new Date(o.dataHora).toLocaleString('pt-BR')],["Status",o.status],["Equipe",o.equipe||"—"],["Agente (ARP)",o.arp||"—"],["Bairro",o.bairro||"—"],["Endereço",o.endereco||"—"],["Tipo / Categoria",tipo],["Solicitante",o.solicitante||"—"]]
              .map(([l,v])=>(
                <div key={l}>
                  <div style={{fontSize:9,fontWeight:700,color:"#aaa",letterSpacing:1,textTransform:"uppercase",marginBottom:2}}>{l}</div>
                  <div style={{fontSize:12,color:"#1a1a1a",fontWeight:600}}>{v}</div>
                </div>
              ))}
          </div>
        </div>
        {cats.length>0&&<div style={{marginBottom:16}}>
          <div style={{fontSize:9,fontWeight:900,letterSpacing:2,color:"#888",textTransform:"uppercase",borderBottom:"1px solid #e5e7eb",paddingBottom:5,marginBottom:10}}>Categorias Acionadas</div>
          {cats.map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:4,padding:"5px 8px",marginBottom:3,fontSize:11}}>
              <span>{labelCat[k]||k}</span><strong>{v}</strong>
            </div>
          ))}
        </div>}
        <div style={{marginBottom:16}}>
          <div style={{fontSize:9,fontWeight:900,letterSpacing:2,color:"#888",textTransform:"uppercase",borderBottom:"1px solid #e5e7eb",paddingBottom:5,marginBottom:10}}>Descrição da Ocorrência</div>
          <div style={{background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:5,padding:10,fontSize:11,lineHeight:1.6,color:"#374151"}}>{o.descricao||"Sem descrição registrada."}</div>
        </div>
        {o.historico?.length>0&&<div style={{marginBottom:16}}>
          <div style={{fontSize:9,fontWeight:900,letterSpacing:2,color:"#888",textTransform:"uppercase",borderBottom:"1px solid #e5e7eb",paddingBottom:5,marginBottom:10}}>Histórico</div>
          {o.historico.map((h,i)=>(
            <div key={i} style={{display:"flex",gap:8,marginBottom:6,fontSize:11}}>
              <div style={{width:9,height:9,background:"#f97316",borderRadius:"50%",flexShrink:0,marginTop:2}}/>
              <div><strong>{h.status}</strong> · {h.hora} · {h.agente}</div>
            </div>
          ))}
        </div>}
        {o.fotos?.length>0&&<div style={{marginBottom:16}}>
          <div style={{fontSize:9,fontWeight:900,letterSpacing:2,color:"#888",textTransform:"uppercase",borderBottom:"1px solid #e5e7eb",paddingBottom:5,marginBottom:10}}>Registros Fotográficos</div>
          <table style={{borderCollapse:"collapse",width:"100%"}}>
            <tbody>
              {Array.from({length:Math.ceil(o.fotos.length/2)},(_,row)=>(
                <tr key={row}>
                  {[0,1].map(col=>{
                    const f=o.fotos[row*2+col];
                    return (
                      <td key={col} width="240" style={{padding:4,verticalAlign:"top"}}>
                        {f&&<img src={f} width="230" style={{display:"block",borderRadius:6,height:"auto"}}/>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>}
        <div style={{marginTop:24,borderTop:"1px solid #e5e7eb",paddingTop:10,display:"flex",justifyContent:"space-between",fontSize:9,color:"#aaa"}}>
          <span>Gerado em {new Date().toLocaleString('pt-BR')}</span>
          <span>Defesa Civil de Oriximiná/PA — (93) 99155-6518</span>
          <span>{o.id}</span>
        </div>
      </div>,
      document.body
    )}
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
    </>
  );
}
