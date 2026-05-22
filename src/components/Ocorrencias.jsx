import { useContext, useState, useMemo } from "react";
import { AppContext } from "../App";
import { bairros, equipes, statusList } from "../data/mockData";

const statusColor = {"Finalizado":"text-green-400 bg-green-500/10 border-green-500/30","Em Atendimento":"text-yellow-400 bg-yellow-500/10 border-yellow-500/30","Aguardando":"text-blue-400 bg-blue-500/10 border-blue-500/30","Cancelado":"text-red-400 bg-red-500/10 border-red-500/30"};

const PER_PAGE = 5;

export default function Ocorrencias() {
  const { ocorrencias, navigateTo } = useContext(AppContext);
  const [busca, setBusca] = useState("");
  const [filtroEquipe, setFiltroEquipe] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroBairro, setFiltroBairro] = useState("");
  const [filtroData, setFiltroData] = useState("");
  const [pagina, setPagina] = useState(1);

  const filtradas = useMemo(() => {
    return ocorrencias.filter(o => {
      const texto = busca.toLowerCase();
      const matchBusca = !busca || o.id.toLowerCase().includes(texto) || o.bairro.toLowerCase().includes(texto) || o.descricao.toLowerCase().includes(texto) || o.solicitante.toLowerCase().includes(texto);
      const matchEquipe = !filtroEquipe || o.equipe === filtroEquipe;
      const matchStatus = !filtroStatus || o.status === filtroStatus;
      const matchBairro = !filtroBairro || o.bairro === filtroBairro;
      const matchData = !filtroData || o.dataHora.startsWith(filtroData);
      return matchBusca && matchEquipe && matchStatus && matchBairro && matchData;
    });
  }, [ocorrencias, busca, filtroEquipe, filtroStatus, filtroBairro, filtroData]);

  const totalPaginas = Math.ceil(filtradas.length / PER_PAGE);
  const paginadas = filtradas.slice((pagina-1)*PER_PAGE, pagina*PER_PAGE);

  const limparFiltros = () => { setBusca(""); setFiltroEquipe(""); setFiltroStatus(""); setFiltroBairro(""); setFiltroData(""); setPagina(1); };

  const getTipo = (o) => {
    const entry = Object.entries(o.categorias).find(([,v])=>v);
    return entry ? entry[1] : "—";
  };

  return (
    <div className="space-y-4" style={{fontFamily:"'Barlow Condensed',sans-serif"}}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-wider">OCORRÊNCIAS</h2>
          <p className="text-gray-500 text-sm">{filtradas.length} resultado(s) encontrado(s)</p>
        </div>
        <a href="https://docs.google.com/forms/d/e/1FAIpQLSfagyJfVIYB0IP2a8OMAFtttKGAzoORRI7Pdol_dXKP_FDzUw/viewform"
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-5 py-3 rounded-xl font-bold tracking-wider transition-all text-sm">
          <span>📝</span> NOVA OCORRÊNCIA
        </a>
      </div>

      {/* Busca */}
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input value={busca} onChange={e=>{setBusca(e.target.value);setPagina(1);}}
          placeholder="Buscar por ID, bairro, descrição, solicitante..."
          className="w-full bg-gray-900 border border-gray-800 focus:border-orange-500 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 outline-none transition-colors"
          style={{fontFamily:"system-ui"}}/>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { value:filtroEquipe, set:(v)=>{setFiltroEquipe(v);setPagina(1)}, options:equipes, label:"EQUIPE" },
          { value:filtroStatus, set:(v)=>{setFiltroStatus(v);setPagina(1)}, options:statusList, label:"STATUS" },
          { value:filtroBairro, set:(v)=>{setFiltroBairro(v);setPagina(1)}, options:bairros, label:"BAIRRO" },
        ].map((f,i)=>(
          <select key={i} value={f.value} onChange={e=>f.set(e.target.value)}
            className="bg-gray-900 border border-gray-800 focus:border-orange-500 rounded-xl px-3 py-3 text-gray-300 outline-none transition-colors text-sm"
            style={{fontFamily:"system-ui"}}>
            <option value="">{f.label}</option>
            {f.options.map(o=><option key={o} value={o}>{o}</option>)}
          </select>
        ))}
        <input type="date" value={filtroData} onChange={e=>{setFiltroData(e.target.value);setPagina(1);}}
          className="bg-gray-900 border border-gray-800 focus:border-orange-500 rounded-xl px-3 py-3 text-gray-300 outline-none transition-colors text-sm"
          style={{fontFamily:"system-ui"}}/>
      </div>

      {(busca||filtroEquipe||filtroStatus||filtroBairro||filtroData) && (
        <button onClick={limparFiltros} className="text-orange-400 text-sm hover:text-orange-300 tracking-wider">✕ LIMPAR FILTROS</button>
      )}

      {/* Tabela */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {/* Header desktop */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-gray-800 text-xs text-gray-500 tracking-widest">
          <div className="col-span-2">ID</div>
          <div className="col-span-1">DATA</div>
          <div className="col-span-2">BAIRRO</div>
          <div className="col-span-2">TIPO</div>
          <div className="col-span-1">EQUIPE</div>
          <div className="col-span-2">SOLICITANTE</div>
          <div className="col-span-2">STATUS</div>
        </div>

        {paginadas.length === 0 ? (
          <div className="text-center py-16 text-gray-500" style={{fontFamily:"system-ui"}}>
            <div className="text-4xl mb-3">🔍</div>
            <p>Nenhuma ocorrência encontrada com os filtros aplicados.</p>
          </div>
        ) : paginadas.map((o, i) => (
          <button key={o.id} onClick={()=>navigateTo('detalhe',o)}
            className={`w-full text-left group transition-colors ${i%2===0?'bg-gray-900':'bg-gray-900/50'} hover:bg-gray-800 border-b border-gray-800 last:border-0`}>
            {/* Mobile */}
            <div className="md:hidden px-4 py-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-gray-500 text-xs font-mono">{o.id}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${statusColor[o.status]}`}>{o.status}</span>
              </div>
              <div className="text-white font-bold group-hover:text-orange-400 transition-colors">{o.bairro}</div>
              <div className="text-gray-400 text-xs mt-1" style={{fontFamily:"system-ui"}}>{getTipo(o)} · {o.equipe} · {new Date(o.dataHora).toLocaleDateString('pt-BR')}</div>
            </div>
            {/* Desktop */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-4 items-center">
              <div className="col-span-2 text-gray-400 text-xs font-mono">{o.id}</div>
              <div className="col-span-1 text-gray-400 text-xs" style={{fontFamily:"system-ui"}}>{new Date(o.dataHora).toLocaleDateString('pt-BR')}</div>
              <div className="col-span-2 text-white font-semibold group-hover:text-orange-400 transition-colors text-sm">{o.bairro}</div>
              <div className="col-span-2 text-gray-400 text-xs truncate" style={{fontFamily:"system-ui"}}>{getTipo(o)}</div>
              <div className="col-span-1">
                <span className={`text-xs px-2 py-1 rounded-full font-bold border ${o.equipe==='ALFA'?'bg-orange-500/10 text-orange-400 border-orange-500/30':o.equipe==='BRAVO'?'bg-blue-500/10 text-blue-400 border-blue-500/30':o.equipe==='CHARLIE'?'bg-green-500/10 text-green-400 border-green-500/30':'bg-purple-500/10 text-purple-400 border-purple-500/30'}`}>{o.equipe}</span>
              </div>
              <div className="col-span-2 text-gray-400 text-xs truncate" style={{fontFamily:"system-ui"}}>{o.solicitante.split(' - ')[0]}</div>
              <div className="col-span-2">
                <span className={`text-xs px-2 py-1 rounded-full border font-bold ${statusColor[o.status]}`}>{o.status}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={()=>setPagina(p=>Math.max(1,p-1))} disabled={pagina===1}
            className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-gray-400 hover:text-white hover:border-orange-500 disabled:opacity-40 transition-all text-sm font-bold">←</button>
          {Array.from({length:totalPaginas},(_,i)=>i+1).map(p=>(
            <button key={p} onClick={()=>setPagina(p)}
              className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${pagina===p?'bg-orange-500 text-white':'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-orange-500'}`}>{p}</button>
          ))}
          <button onClick={()=>setPagina(p=>Math.min(totalPaginas,p+1))} disabled={pagina===totalPaginas}
            className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-gray-400 hover:text-white hover:border-orange-500 disabled:opacity-40 transition-all text-sm font-bold">→</button>
        </div>
      )}
    </div>
  );
}
