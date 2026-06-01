import { useContext, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AppContext } from "../App";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

export default function Relatorios() {
  const { ocorrencias } = useContext(AppContext);

  const total = ocorrencias.length;
  const finalizadas = ocorrencias.filter(o=>o.status==="Finalizado").length;
  const emAndamento = ocorrencias.filter(o=>o.status==="Em Atendimento").length;
  const canceladas = ocorrencias.filter(o=>o.status==="Cancelado").length;
  const taxaConclusao = Math.round((finalizadas/total)*100);

  const porEquipe = ocorrencias.reduce((acc,o)=>{acc[o.equipe]=(acc[o.equipe]||0)+1;return acc},{});
  const porBairro = ocorrencias.reduce((acc,o)=>{acc[o.bairro]=(acc[o.bairro]||0)+1;return acc},{});
  const top5Bairros = Object.entries(porBairro).sort((a,b)=>b[1]-a[1]).slice(0,5);

  const porTipo = {};
  ocorrencias.forEach(o=>{
    Object.entries(o.categorias).forEach(([k,v])=>{if(v){const l=k.replace(/([A-Z])/g,' $1').trim();porTipo[l]=(porTipo[l]||0)+1;}});
  });

  const handleExportCSV = () => {
    const headers = ["ID","Data","Bairro","Equipe","Status","Tipo","Solicitante","Descrição"];
    const rows = ocorrencias.map(o=>{
      const tipo = Object.entries(o.categorias).find(([,v])=>v)?.[1]||"—";
      return [o.id,new Date(o.dataHora).toLocaleString('pt-BR'),o.bairro,o.equipe,o.status,tipo,`"${o.solicitante}"`,`"${o.descricao}"`];
    });
    const csv = [headers,...rows].map(r=>r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download="ocorrencias_defesa_civil.csv"; a.click();
  };

  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (!printing) return;
    window.print();
    const t = setTimeout(() => setPrinting(false), 1500);
    return () => clearTimeout(t);
  }, [printing]);

  const handlePrint = () => setPrinting(true);

  const ov = {position:"fixed",top:0,left:0,right:0,bottom:0,background:"white",color:"#1a1a1a",zIndex:99999,overflow:"auto",padding:28,fontFamily:"Arial,sans-serif",fontSize:12};
  const secTit = {fontSize:10,fontWeight:900,letterSpacing:2,color:"#888",textTransform:"uppercase",borderBottom:"1px solid #e5e7eb",paddingBottom:5,marginBottom:10};

  return (
    <>
    {printing && createPortal(
      <div style={ov}>
        {/* Cabeçalho */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"3px solid #f97316",paddingBottom:14,marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <img src="/logo-defesa-civil.jpg" alt="Logo" style={{width:52,height:52,borderRadius:"50%",objectFit:"cover"}}/>
            <div>
              <div style={{fontSize:16,fontWeight:900,color:"#f97316",letterSpacing:1}}>RELATÓRIO — DEFESA CIVIL ORIXIMINÁ/PA</div>
              <div style={{fontSize:10,color:"#555",marginTop:2}}>Agentes de Proteção e Defesa Civil</div>
              <div style={{fontSize:10,color:"#555"}}>Gerado em {new Date().toLocaleString("pt-BR")}</div>
            </div>
          </div>
          <div style={{textAlign:"right",fontSize:11,color:"#555"}}>
            <div style={{fontWeight:700}}>{new Date().toLocaleDateString("pt-BR",{month:"long",year:"numeric"}).toUpperCase()}</div>
          </div>
        </div>

        {/* KPIs */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:20}}>
          {[["TOTAL",total,"#f97316"],["FINALIZADAS",finalizadas,"#22c55e"],["EM ANDAMENTO",emAndamento,"#eab308"],["TAXA CONCLUSÃO",`${taxaConclusao}%`,"#3b82f6"]]
            .map(([l,v,c])=>(
              <div key={l} style={{border:`2px solid ${c}33`,borderRadius:8,padding:"10px 14px",textAlign:"center"}}>
                <div style={{fontSize:28,fontWeight:900,color:c}}>{v}</div>
                <div style={{fontSize:9,color:"#888",letterSpacing:1,marginTop:2}}>{l}</div>
              </div>
            ))}
        </div>

        {/* Por equipe */}
        <div style={{marginBottom:18}}>
          <div style={secTit}>DESEMPENHO POR EQUIPE</div>
          {Object.entries(porEquipe).sort((a,b)=>b[1]-a[1]).map(([eq,cnt])=>{
            const pct=Math.round((cnt/total)*100);
            const cores={ALFA:"#f97316",BRAVO:"#3b82f6",CHARLIE:"#22c55e",DELTA:"#a855f7"};
            return (
              <div key={eq} style={{marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{fontWeight:700}}>EQUIPE {eq}</span>
                  <span style={{color:"#666"}}>{cnt} ocorrências ({pct}%)</span>
                </div>
                <div style={{background:"#f3f4f6",borderRadius:4,height:10}}>
                  <div style={{background:cores[eq]||"#f97316",height:10,borderRadius:4,width:`${pct}%`}}/>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bairros + Tipos */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:18}}>
          <div>
            <div style={secTit}>TOP 5 BAIRROS</div>
            {top5Bairros.map(([b,c],i)=>(
              <div key={b} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                <span style={{color:"#f97316",fontWeight:900,fontSize:14,width:16}}>{i+1}</span>
                <div style={{flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <span style={{fontWeight:600}}>{b}</span>
                    <span style={{color:"#f97316",fontWeight:700}}>{c}</span>
                  </div>
                  <div style={{background:"#f3f4f6",borderRadius:3,height:6,marginTop:2}}>
                    <div style={{background:"#f97316",height:6,borderRadius:3,width:`${(c/top5Bairros[0][1])*100}%`}}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div>
            <div style={secTit}>OCORRÊNCIAS POR TIPO</div>
            {Object.entries(porTipo).sort((a,b)=>b[1]-a[1]).map(([tipo,cnt])=>(
              <div key={tipo} style={{display:"flex",justifyContent:"space-between",padding:"4px 8px",background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:4,marginBottom:3}}>
                <span style={{textTransform:"capitalize"}}>{tipo}</span>
                <strong style={{color:"#f97316"}}>{cnt}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Tabela */}
        <div>
          <div style={secTit}>LISTA COMPLETA DE OCORRÊNCIAS</div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
            <thead>
              <tr style={{background:"#f9fafb"}}>
                {["ID","DATA","BAIRRO","EQUIPE","TIPO","STATUS"].map(h=>(
                  <th key={h} style={{padding:"5px 8px",textAlign:"left",border:"1px solid #e5e7eb",fontWeight:700,color:"#555",letterSpacing:1}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ocorrencias.map((o,i)=>{
                const tipo=Object.entries(o.categorias).find(([,v])=>v)?.[1]||"—";
                const sc={Finalizado:"#16a34a","Em Atendimento":"#d97706",Cancelado:"#dc2626",Aguardando:"#2563eb"};
                return (
                  <tr key={o.id} style={{background:i%2===0?"#fff":"#f9fafb"}}>
                    <td style={{padding:"4px 8px",border:"1px solid #e5e7eb",fontFamily:"monospace",color:"#666"}}>{o.id}</td>
                    <td style={{padding:"4px 8px",border:"1px solid #e5e7eb"}}>{new Date(o.dataHora).toLocaleDateString("pt-BR")}</td>
                    <td style={{padding:"4px 8px",border:"1px solid #e5e7eb",fontWeight:600}}>{o.bairro}</td>
                    <td style={{padding:"4px 8px",border:"1px solid #e5e7eb"}}>{o.equipe}</td>
                    <td style={{padding:"4px 8px",border:"1px solid #e5e7eb",color:"#555"}}>{tipo}</td>
                    <td style={{padding:"4px 8px",border:"1px solid #e5e7eb",fontWeight:700,color:sc[o.status]||"#333"}}>{o.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{marginTop:20,borderTop:"1px solid #e5e7eb",paddingTop:10,display:"flex",justifyContent:"space-between",fontSize:9,color:"#aaa"}}>
          <span>Defesa Civil de Oriximiná/PA — (93) 99155-6518</span>
          <span>{ocorrencias.length} ocorrências · Gerado em {new Date().toLocaleString("pt-BR")}</span>
        </div>
      </div>,
      document.body
    )}
    <div className="space-y-6 max-w-5xl mx-auto" style={{fontFamily:"'Barlow Condensed',sans-serif"}}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-wider">RELATÓRIOS E ESTATÍSTICAS</h2>
          <p className="text-gray-500 text-sm">Defesa Civil — Oriximiná/PA · {new Date().toLocaleDateString('pt-BR',{month:'long',year:'numeric'}).toUpperCase()}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl font-bold text-sm tracking-wider transition-all">
            📊 EXPORTAR CSV/EXCEL
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-xl font-bold text-sm tracking-wider transition-all">
            🖨️ IMPRIMIR
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {label:"TOTAL",value:total,icon:"📋",color:"text-orange-400"},
          {label:"FINALIZADAS",value:finalizadas,icon:"✅",color:"text-green-400"},
          {label:"EM ANDAMENTO",value:emAndamento,icon:"⚡",color:"text-yellow-400"},
          {label:"TAXA CONCLUSÃO",value:`${taxaConclusao}%`,icon:"📈",color:"text-blue-400"},
        ].map((c,i)=>(
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center">
            <div className="text-3xl mb-2">{c.icon}</div>
            <div className={`text-4xl font-black ${c.color}`}>{c.value}</div>
            <div className="text-gray-500 text-xs tracking-wider mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Por equipe */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h3 className="font-bold text-white tracking-wider mb-5 text-sm">DESEMPENHO POR EQUIPE</h3>
        <div className="space-y-3">
          {Object.entries(porEquipe).sort((a,b)=>b[1]-a[1]).map(([equipe,count],i)=>{
            const cores = {ALFA:"bg-orange-500",BRAVO:"bg-blue-500",CHARLIE:"bg-green-500",DELTA:"bg-purple-500"};
            const pct = Math.round((count/total)*100);
            return (
              <div key={equipe}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white font-bold text-sm">EQUIPE {equipe}</span>
                  <span className="text-gray-400 text-sm">{count} ocorrências <span className="text-gray-600">({pct}%)</span></span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3">
                  <div className={`${cores[equipe]||'bg-orange-500'} h-3 rounded-full transition-all`} style={{width:`${pct}%`}}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top bairros + Tipos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h3 className="font-bold text-white tracking-wider mb-5 text-sm">TOP 5 BAIRROS COM MAIS OCORRÊNCIAS</h3>
          <div className="space-y-3">
            {top5Bairros.map(([bairro,count],i)=>(
              <div key={bairro} className="flex items-center gap-3">
                <span className="text-orange-500 font-black text-xl w-6">{i+1}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white text-sm font-semibold">{bairro}</span>
                    <span className="text-orange-400 font-black">{count}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{width:`${(count/top5Bairros[0][1])*100}%`}}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h3 className="font-bold text-white tracking-wider mb-5 text-sm">OCORRÊNCIAS POR TIPO</h3>
          <div className="space-y-2">
            {Object.entries(porTipo).sort((a,b)=>b[1]-a[1]).map(([tipo,count])=>(
              <div key={tipo} className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3">
                <span className="text-gray-300 text-xs capitalize" style={{fontFamily:"system-ui"}}>{tipo}</span>
                <span className="text-orange-400 font-black text-sm">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h3 className="font-bold text-white tracking-wider mb-5 text-sm">STATUS GERAL DAS OCORRÊNCIAS</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {label:"Finalizado",count:finalizadas,color:"bg-green-500",text:"text-green-400"},
            {label:"Em Atendimento",count:emAndamento,color:"bg-yellow-500",text:"text-yellow-400"},
            {label:"Aguardando",count:ocorrencias.filter(o=>o.status==="Aguardando").length,color:"bg-blue-500",text:"text-blue-400"},
            {label:"Cancelado",count:canceladas,color:"bg-red-500",text:"text-red-400"},
          ].map((s,i)=>{
            const pct = Math.round((s.count/total)*100);
            return (
              <div key={i} className="text-center">
                <div className={`text-3xl font-black ${s.text}`}>{s.count}</div>
                <div className="text-gray-400 text-xs mt-1 mb-2">{s.label}</div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div className={`${s.color} h-2 rounded-full`} style={{width:`${pct}%`}}></div>
                </div>
                <div className="text-gray-600 text-xs mt-1">{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabela completa para impressão */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h3 className="font-bold text-white tracking-wider mb-5 text-sm">LISTA COMPLETA PARA RELATÓRIO</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{fontFamily:"system-ui"}}>
            <thead>
              <tr className="border-b border-gray-800">
                {["ID","DATA","BAIRRO","EQUIPE","TIPO","STATUS"].map(h=>(
                  <th key={h} className="text-left py-2 px-3 text-xs text-gray-500 tracking-wider font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ocorrencias.map((o,i)=>{
                const tipo = Object.entries(o.categorias).find(([,v])=>v)?.[1]||"—";
                const sCols = {"Finalizado":"text-green-400","Em Atendimento":"text-yellow-400","Aguardando":"text-blue-400","Cancelado":"text-red-400"};
                return (
                  <tr key={o.id} className={`border-b border-gray-800/50 ${i%2===0?'':'bg-gray-800/30'}`}>
                    <td className="py-2 px-3 text-gray-400 font-mono text-xs">{o.id}</td>
                    <td className="py-2 px-3 text-gray-300">{new Date(o.dataHora).toLocaleDateString('pt-BR')}</td>
                    <td className="py-2 px-3 text-white font-semibold">{o.bairro}</td>
                    <td className="py-2 px-3 text-gray-300">{o.equipe}</td>
                    <td className="py-2 px-3 text-gray-400 text-xs">{tipo}</td>
                    <td className={`py-2 px-3 font-bold text-xs ${sCols[o.status]}`}>{o.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </>
  );
}
