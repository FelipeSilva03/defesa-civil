import { useContext, useEffect, useRef } from "react";
import { AppContext } from "../App";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

const statusColor = { "Finalizado":"text-green-400","Em Atendimento":"text-yellow-400","Aguardando":"text-blue-400","Cancelado":"text-red-400" };
const statusBg = { "Finalizado":"bg-green-500/10 border-green-500/30","Em Atendimento":"bg-yellow-500/10 border-yellow-500/30","Aguardando":"bg-blue-500/10 border-blue-500/30","Cancelado":"bg-red-500/10 border-red-500/30" };

export default function Dashboard() {
  const { ocorrencias, navigateTo } = useContext(AppContext);
  const chartTipoRef = useRef(null);
  const chartEquipeRef = useRef(null);
  const chartMensalRef = useRef(null);
  const tipoChart = useRef(null);
  const equipeChart = useRef(null);
  const mensalChart = useRef(null);

  const total = ocorrencias.length;

  // contar tipos
  const tiposCount = {};
  ocorrencias.forEach(o => {
    Object.entries(o.categorias).forEach(([k,v]) => {
      if(v) {
        const label = k.replace(/([A-Z])/g,' $1').trim();
        tiposCount[label] = (tiposCount[label]||0)+1;
      }
    });
  });

  // por equipe
  const equipeCount = {};
  ocorrencias.forEach(o => { equipeCount[o.equipe]=(equipeCount[o.equipe]||0)+1; });

  useEffect(() => {
    // Tipo chart
    if(tipoChart.current) tipoChart.current.destroy();
    if(chartTipoRef.current) {
      tipoChart.current = new Chart(chartTipoRef.current, {
        type: 'doughnut',
        data: {
          labels: Object.keys(tiposCount),
          datasets: [{ data: Object.values(tiposCount), backgroundColor: ['#f97316','#3b82f6','#10b981','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#84cc16'], borderWidth: 0 }]
        },
        options: { responsive: true, plugins: { legend: { position:'bottom', labels: { color:'#9ca3af', font:{size:11} } } } }
      });
    }
    // Equipe chart
    if(equipeChart.current) equipeChart.current.destroy();
    if(chartEquipeRef.current) {
      equipeChart.current = new Chart(chartEquipeRef.current, {
        type: 'bar',
        data: {
          labels: Object.keys(equipeCount),
          datasets: [{ label:'Ocorrências', data: Object.values(equipeCount),
            backgroundColor: ['#f97316','#3b82f6','#10b981','#f59e0b'], borderRadius: 8, borderWidth: 0 }]
        },
        options: { responsive: true, plugins:{legend:{display:false}}, scales:{
          x:{ticks:{color:'#9ca3af'},grid:{display:false}},
          y:{ticks:{color:'#9ca3af'},grid:{color:'#1f2937'}}
        }}
      });
    }
    // Mensal chart
    if(mensalChart.current) mensalChart.current.destroy();
    if(chartMensalRef.current) {
      mensalChart.current = new Chart(chartMensalRef.current, {
        type:'line',
        data:{
          labels:['Jan','Fev','Mar','Abr','Mai','Jun'],
          datasets:[{
            label:'Ocorrências',data:[42,38,55,49,62,48],
            borderColor:'#f97316',backgroundColor:'rgba(249,115,22,0.1)',
            tension:0.4,fill:true,pointBackgroundColor:'#f97316',pointRadius:5
          }]
        },
        options:{responsive:true,plugins:{legend:{display:false}},scales:{
          x:{ticks:{color:'#9ca3af'},grid:{display:false}},
          y:{ticks:{color:'#9ca3af'},grid:{color:'#1f2937'}}
        }}
      });
    }
    return () => {
      if(tipoChart.current) tipoChart.current.destroy();
      if(equipeChart.current) equipeChart.current.destroy();
      if(mensalChart.current) mensalChart.current.destroy();
    };
  }, [ocorrencias]);

  const recentes = [...ocorrencias].sort((a,b)=>new Date(b.dataHora)-new Date(a.dataHora)).slice(0,5);

  return (
    <div className="space-y-6" style={{fontFamily:"'Barlow Condensed',sans-serif"}}>
      {/* Card */}
      <div className="bg-gray-900 border border-orange-500/40 bg-orange-500/5 rounded-2xl p-5 w-full md:w-64">
        <div className="flex items-start justify-between mb-3">
          <span className="text-2xl">📋</span>
        </div>
        <div className="text-4xl font-black text-white">{total}</div>
        <div className="text-xs text-gray-400 tracking-wider mt-1">TOTAL DE OCORRÊNCIAS</div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="font-bold text-white tracking-wider mb-4 text-sm">POR TIPO DE OCORRÊNCIA</h3>
          <canvas ref={chartTipoRef} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="font-bold text-white tracking-wider mb-4 text-sm">POR EQUIPE</h3>
          <canvas ref={chartEquipeRef} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="font-bold text-white tracking-wider mb-4 text-sm">OCORRÊNCIAS MENSAIS — 2026</h3>
          <canvas ref={chartMensalRef} />
        </div>
      </div>

      {/* Recentes */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white tracking-wider text-sm">OCORRÊNCIAS RECENTES</h3>
          <button onClick={()=>navigateTo('ocorrencias')} className="text-orange-400 text-xs hover:text-orange-300 tracking-wider">VER TODAS →</button>
        </div>
        <div className="space-y-2">
          {recentes.map(o => {
            const tipo = Object.entries(o.categorias).find(([,v])=>v)?.[1] || "—";
            return (
              <button key={o.id} onClick={()=>navigateTo('detalhe',o)}
                className="w-full flex items-center justify-between bg-gray-800 hover:bg-gray-750 rounded-xl px-4 py-3 transition-colors text-left group">
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 text-xs font-mono">{o.id}</span>
                  <span className="text-white text-sm font-semibold group-hover:text-orange-400 transition-colors">{o.bairro}</span>
                  <span className="text-gray-400 text-xs hidden md:block" style={{fontFamily:"system-ui"}}>{tipo}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full border font-bold ${statusBg[o.status]} ${statusColor[o.status]}`}>{o.status}</span>
                  <span className="text-gray-500 text-xs hidden md:block">{o.equipe}</span>
                  <span className="text-gray-500 text-xs">{new Date(o.dataHora).toLocaleDateString('pt-BR')}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bairros */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h3 className="font-bold text-white tracking-wider mb-4 text-sm">OCORRÊNCIAS POR BAIRRO</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {Object.entries(ocorrencias.reduce((acc,o)=>{acc[o.bairro]=(acc[o.bairro]||0)+1;return acc},{}))
            .sort((a,b)=>b[1]-a[1]).map(([bairro,count]) => (
            <div key={bairro} className="bg-gray-800 rounded-xl px-3 py-2 flex items-center justify-between">
              <span className="text-gray-300 text-xs">{bairro}</span>
              <span className="text-orange-400 font-black text-sm">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
