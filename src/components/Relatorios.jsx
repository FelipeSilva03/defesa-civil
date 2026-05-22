import { useContext, useRef } from "react";
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

  const handlePrint = () => window.print();

  return (
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
  );
}
