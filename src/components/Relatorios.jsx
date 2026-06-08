import { useContext, useState, useEffect } from "react";
import { AppContext } from "../App";
import { BASE_URL } from "../api";

/* ── Mapeamentos ─────────────────────────────────────────────── */
const TIPO_LABEL = {
  combateIncendioUrbano:    "Incêndio Urbano",
  combateIncendioFlorestal: "Incêndio Florestal",
  atendimentoPreHospitalar: "Atend. Pré-Hospitalar",
  buscaSalvamento:          "Busca e Salvamento",
  capturaAnimal:            "Captura de Animal",
  corteArvore:              "Corte de Árvore",
  remocaoCadaver:           "Remoção de Cadáver",
  apoioEventos:             "Apoio a Eventos",
  defesaCivil:              "Defesa Civil",
  outros:                   "Outros",
};
const PALETA = ["#f97316","#3b82f6","#22c55e","#a855f7","#ef4444","#eab308","#06b6d4","#f43f5e","#84cc16","#14b8a6"];
const EQ_COR = { ALFA:"#f97316", BRAVO:"#3b82f6", CHARLIE:"#22c55e", DELTA:"#a855f7" };
const EQ_TW  = { ALFA:"bg-orange-500", BRAVO:"bg-blue-500", CHARLIE:"bg-green-500", DELTA:"bg-purple-500" };
const OF_COR = { Pendente:"#ef4444", "Em Andamento":"#eab308", Atendido:"#22c55e", Arquivado:"#6b7280" };

/* ── Geração de gráficos SVG ─────────────────────────────────── */
function svgDonut(dados, tam = 190) {
  const total = dados.reduce((s, d) => s + d.valor, 0);
  if (!total) return `<svg width="${tam}" height="${tam}"></svg>`;
  const cx = tam / 2, cy = tam / 2, R = tam * 0.42, ri = tam * 0.26;
  let ang = -Math.PI / 2;
  const paths = dados.filter(d => d.valor > 0).map(d => {
    const a = (d.valor / total) * 2 * Math.PI;
    const [x1,y1] = [cx+R*Math.cos(ang), cy+R*Math.sin(ang)];
    ang += a;
    const [x2,y2] = [cx+R*Math.cos(ang), cy+R*Math.sin(ang)];
    const [ix1,iy1] = [cx+ri*Math.cos(ang), cy+ri*Math.sin(ang)];
    const [ix2,iy2] = [cx+ri*Math.cos(ang-a), cy+ri*Math.sin(ang-a)];
    const la = a > Math.PI ? 1 : 0;
    const f = n => n.toFixed(2);
    return `<path d="M${f(x1)},${f(y1)}A${R},${R},0,${la},1,${f(x2)},${f(y2)}L${f(ix1)},${f(iy1)}A${ri},${ri},0,${la},0,${f(ix2)},${f(iy2)}Z" fill="${d.cor}" stroke="white" stroke-width="2"/>`;
  });
  return `<svg width="${tam}" height="${tam}" viewBox="0 0 ${tam} ${tam}" xmlns="http://www.w3.org/2000/svg">
    ${paths.join('')}
    <text x="${cx}" y="${cy-8}" text-anchor="middle" font-size="24" font-weight="900" fill="#111" font-family="Arial">${total}</text>
    <text x="${cx}" y="${cy+11}" text-anchor="middle" font-size="10" fill="#888" font-family="Arial">ocorrências</text>
  </svg>`;
}

function svgBarrasH(itens, barW = 200, rowH = 24) {
  const max = Math.max(...itens.map(i => i.valor), 1);
  const lW = 130, vW = 36, W = lW + barW + vW, H = itens.length * (rowH + 5) + 8;
  const rows = itens.map((item, i) => {
    const y = i * (rowH + 5) + 4, bw = Math.max((item.valor/max)*barW, 3);
    const lbl = item.label.length > 20 ? item.label.slice(0,20)+'…' : item.label;
    return `
      <text x="${lW-6}" y="${y+rowH/2+4}" text-anchor="end" font-size="10" fill="#374151" font-family="Arial">${lbl}</text>
      <rect x="${lW}" y="${y+3}" width="${barW}" height="${rowH-6}" fill="#f3f4f6" rx="3"/>
      <rect x="${lW}" y="${y+3}" width="${bw}" height="${rowH-6}" fill="${item.cor||'#f97316'}" rx="3"/>
      <text x="${lW+barW+7}" y="${y+rowH/2+4}" font-size="11" font-weight="700" fill="${item.cor||'#f97316'}" font-family="Arial">${item.valor}</text>`;
  });
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${rows.join('')}</svg>`;
}

function svgBarrasV(itens, colW = 55, maxH = 110) {
  const max = Math.max(...itens.map(i => i.valor), 1);
  const gap = 12, W = itens.length*(colW+gap)+gap, H = maxH+50;
  const cols = itens.map((item, i) => {
    const x = i*(colW+gap)+gap, bh = Math.max((item.valor/max)*maxH,3), y = maxH-bh;
    return `
      <rect x="${x}" y="${y}" width="${colW}" height="${bh}" fill="${item.cor||'#f97316'}" rx="5"/>
      <text x="${x+colW/2}" y="${y-5}" text-anchor="middle" font-size="12" font-weight="900" fill="${item.cor||'#f97316'}" font-family="Arial">${item.valor}</text>
      <text x="${x+colW/2}" y="${maxH+20}" text-anchor="middle" font-size="10" font-weight="700" fill="#374151" font-family="Arial">${item.label}</text>
      <text x="${x+colW/2}" y="${maxH+34}" text-anchor="middle" font-size="9" fill="#888" font-family="Arial">${item.sub||''}</text>`;
  });
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${cols.join('')}</svg>`;
}

function svgLegenda(itens) {
  return itens.map(i => `
    <div style="display:flex;align-items:center;gap:7px;margin-bottom:5px;">
      <div style="width:12px;height:12px;background:${i.cor};border-radius:3px;flex-shrink:0;"></div>
      <span style="font-size:10px;color:#374151;font-family:Arial;flex:1;">${i.label}</span>
      <span style="font-size:10px;font-weight:700;color:#111;font-family:Arial;">${i.valor}</span>
    </div>`).join('');
}

/* ── Utilitários ─────────────────────────────────────────────── */
function periodoLabel(periodo, mesSel, anoSel) {
  if (periodo === "tudo") return "Todo o Período";
  if (periodo === "mes")  return new Date().toLocaleDateString("pt-BR",{month:"long",year:"numeric"}).toUpperCase();
  if (periodo === "mes-especifico") {
    const [a,m] = mesSel.split("-").map(Number);
    return new Date(a,m-1,1).toLocaleDateString("pt-BR",{month:"long",year:"numeric"}).toUpperCase();
  }
  return `ANO ${anoSel}`;
}

function filtrarPorPeriodo(lista, campo, periodo, mesSel, anoSel) {
  return lista.filter(item => {
    const raw = item[campo];
    if (!raw) return periodo === "tudo";
    const d = new Date(raw);
    if (periodo === "tudo") return true;
    if (periodo === "mes")  { const n=new Date(); return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear(); }
    if (periodo === "mes-especifico") { const [a,m]=mesSel.split("-").map(Number); return d.getMonth()===m-1&&d.getFullYear()===a; }
    return d.getFullYear()===Number(anoSel);
  });
}

/* ── Componente ──────────────────────────────────────────────── */
export default function Relatorios() {
  const { ocorrencias } = useContext(AppContext);
  const [periodo,  setPeriodo]  = useState("mes");
  const [mesSel,   setMesSel]   = useState(new Date().toISOString().slice(0,7));
  const [anoSel,   setAnoSel]   = useState(String(new Date().getFullYear()));
  const [oficios,  setOficios]  = useState([]);
  const [arvores,  setArvores]  = useState([]);

  useEffect(() => {
      fetch(`${BASE_URL}/api/oficios`).then(r=>r.json()).then(d=>setOficios(d.oficios||[])).catch(()=>{});
    fetch(`${BASE_URL}/api/arvores`).then(r=>r.json()).then(d=>setArvores(d.arvores||[])).catch(()=>{});
  }, []);

  /* ── Dados filtrados ─── */
  const ocFiltradas = filtrarPorPeriodo(ocorrencias, "dataHora",       periodo, mesSel, anoSel);
  const ofFiltrados = filtrarPorPeriodo(oficios,     "dataRecebimento", periodo, mesSel, anoSel);
  const arFiltradas = filtrarPorPeriodo(arvores,     "dataSolicitacao", periodo, mesSel, anoSel);

  /* ── Stats ocorrências ─── */
  const total       = ocFiltradas.length;
  const finalizadas = ocFiltradas.filter(o=>o.status==="Finalizado").length;
  const emAndamento = ocFiltradas.filter(o=>o.status==="Em Atendimento").length;
  const aguardando  = ocFiltradas.filter(o=>o.status==="Aguardando").length;
  const canceladas  = ocFiltradas.filter(o=>o.status==="Cancelado").length;
  const taxa        = total>0 ? Math.round((finalizadas/total)*100) : 0;

  const porEquipe = ocFiltradas.reduce((a,o)=>{ if(o.equipe)a[o.equipe]=(a[o.equipe]||0)+1; return a; },{});
  const porBairro = ocFiltradas.reduce((a,o)=>{ if(o.bairro)a[o.bairro]=(a[o.bairro]||0)+1; return a; },{});
  const top6      = Object.entries(porBairro).sort((a,b)=>b[1]-a[1]).slice(0,6);

  const porTipoMap = {};
  ocFiltradas.forEach(o=>Object.entries(o.categorias||{}).forEach(([k,v])=>{ if(v)porTipoMap[k]=(porTipoMap[k]||0)+1; }));
  const tiposOrd  = Object.entries(porTipoMap).sort((a,b)=>b[1]-a[1]);

  /* ── Stats ofícios ─── */
  const ofTotal  = ofFiltrados.length;
  const ofStatus = ofFiltrados.reduce((a,o)=>{ a[o.status]=(a[o.status]||0)+1; return a; },{});

  /* ── Stats árvores ─── */
  const arTotal = arFiltradas.length;

  /* ── Dados para gráficos ─── */
  const dadosTipo = tiposOrd.map(([k,v],i)=>({ label: TIPO_LABEL[k]||k, valor:v, cor: PALETA[i%PALETA.length] }));
  const dadosBairro = top6.map(([b,c])=>({ label:b, valor:c, cor:"#f97316" }));
  const dadosEquipe = Object.entries(porEquipe).sort((a,b)=>b[1]-a[1])
    .map(([eq,c])=>({ label:eq, sub:`${Math.round((c/total)*100)}%`, valor:c, cor:EQ_COR[eq]||"#f97316" }));
  const dadosOfStatus = Object.entries(ofStatus).map(([s,c])=>({ label:s, valor:c, cor:OF_COR[s]||"#888" }));

  const label = periodoLabel(periodo, mesSel, anoSel);

  /* ── Resumo textual ─── */
  const gerarResumo = () => {
    const eqTop = Object.entries(porEquipe).sort((a,b)=>b[1]-a[1])[0];
    const b3    = top6.slice(0,3).map(([b])=>b).join(", ");
    const t3    = tiposOrd.slice(0,3).map(([k])=>TIPO_LABEL[k]||k).join(", ");
    let txt = `Durante o período de ${label}, a Defesa Civil do Município de Oriximiná/PA registrou um total de ${total} ocorrência${total!==1?"s":""}`;
    if (!total) return "Nenhuma ocorrência registrada no período selecionado.";
    txt += `, com taxa de conclusão de ${taxa}%. `;
    if (eqTop) txt += `A equipe com maior volume de atendimentos foi a Equipe ${eqTop[0]}, responsável por ${eqTop[1]} ocorrência${eqTop[1]!==1?"s":""} (${Math.round((eqTop[1]/total)*100)}% do total). `;
    if (b3)    txt += `Os bairros com maior incidência foram: ${b3}. `;
    if (t3)    txt += `As principais categorias de atendimento foram: ${t3}. `;
    if (ofTotal) txt += `Foram recebidos ${ofTotal} ofício${ofTotal!==1?"s":""} no período`;
    if (ofStatus["Atendido"]) txt += `, dos quais ${ofStatus["Atendido"]} foram atendidos`;
    if (ofStatus["Pendente"]) txt += ` e ${ofStatus["Pendente"]} permanecem pendentes`;
    if (ofTotal) txt += ". ";
    if (arTotal) txt += `Foram registradas ${arTotal} solicitação${arTotal!==1?"s":""} de corte/poda de árvores.`;
    return txt;
  };

  /* ── Exportar PDF ─── */
  const exportarPDF = async () => {
    let logo = "";
    try {
      const r = await fetch("/logo-defesa-civil.jpg");
      const b = await r.blob();
      logo = await new Promise(res=>{ const rd=new FileReader(); rd.onloadend=()=>res(rd.result); rd.readAsDataURL(b); });
    } catch {}

    const svgTipo   = svgDonut(dadosTipo, 200);
    const svgBairro = svgBarrasH(dadosBairro, 210, 26);
    const svgEq     = svgBarrasV(dadosEquipe, 65, 130);
    const svgOf     = svgBarrasH(dadosOfStatus, 160, 26);
    const legenda   = svgLegenda(dadosTipo);

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>Relatório Operacional — Defesa Civil Oriximiná/PA</title>
<style>
  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box;}
  body{font-family:Arial,sans-serif;background:white;color:#1a1a1a;margin:0;padding:20px;font-size:11px;}
  @page{size:A4 portrait;margin:12mm;}
  .sec{font-size:9px;font-weight:900;letter-spacing:2px;color:#888;border-bottom:2px solid #f97316;padding-bottom:4px;margin-bottom:14px;text-transform:uppercase;}
  .card{border-radius:8px;padding:12px 16px;text-align:center;}
  table{border-collapse:collapse;width:100%;font-size:10px;}
  th{padding:5px 8px;background:#f9fafb;border:1px solid #e5e7eb;text-align:left;font-size:9px;color:#555;letter-spacing:1px;font-weight:700;}
  td{padding:4px 8px;border:1px solid #e5e7eb;}
</style></head><body>

<!-- CABEÇALHO -->
<div style="display:flex;align-items:center;justify-content:space-between;border-bottom:4px solid #f97316;padding-bottom:16px;margin-bottom:22px;">
  <div style="display:flex;align-items:center;gap:14px;">
    ${logo?`<img src="${logo}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;">`:""}
    <div>
      <div style="font-size:20px;font-weight:900;color:#f97316;letter-spacing:1px;">RELATÓRIO OPERACIONAL</div>
      <div style="font-size:13px;font-weight:700;color:#1a1a1a;">DEFESA CIVIL — ORIXIMINÁ/PA</div>
      <div style="font-size:10px;color:#555;margin-top:2px;">Agentes de Proteção e Defesa Civil</div>
      <div style="font-size:10px;color:#555;">Secretaria Municipal de Segurança Pública e Defesa Social</div>
    </div>
  </div>
  <div style="text-align:right;">
    <div style="background:#f97316;color:white;font-size:13px;font-weight:900;padding:8px 18px;border-radius:10px;letter-spacing:1px;">${label}</div>
    <div style="font-size:10px;color:#888;margin-top:6px;">Gerado em ${new Date().toLocaleString("pt-BR")}</div>
  </div>
</div>

<!-- KPIs OCORRÊNCIAS -->
<div class="sec">OCORRÊNCIAS</div>
<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:22px;">
  ${[["TOTAL",total,"#f97316"],["FINALIZADAS",finalizadas,"#22c55e"],["EM ANDAMENTO",emAndamento,"#eab308"],["AGUARDANDO",aguardando,"#3b82f6"],["TAXA CONCLUSÃO",`${taxa}%`,"#a855f7"]].map(([l,v,c])=>`
  <div class="card" style="border:2px solid ${c}33;background:${c}08;">
    <div style="font-size:28px;font-weight:900;color:${c};">${v}</div>
    <div style="font-size:8px;color:#888;letter-spacing:1px;margin-top:3px;">${l}</div>
  </div>`).join("")}
</div>

<!-- KPIs OFÍCIOS + ÁRVORES -->
<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:22px;">
  <div style="border:1px solid #e5e7eb;border-radius:10px;padding:14px;">
    <div style="font-size:9px;font-weight:900;letter-spacing:2px;color:#888;margin-bottom:10px;">OFÍCIOS RECEBIDOS</div>
    <div style="display:flex;align-items:center;gap:12px;">
      <div style="font-size:36px;font-weight:900;color:#3b82f6;">${ofTotal}</div>
      <div style="flex:1;">${svgOf}</div>
    </div>
  </div>
  <div style="border:1px solid #e5e7eb;border-radius:10px;padding:14px;">
    <div style="font-size:9px;font-weight:900;letter-spacing:2px;color:#888;margin-bottom:10px;">SOLICITAÇÕES DE ÁRVORE</div>
    <div style="font-size:36px;font-weight:900;color:#22c55e;">${arTotal}</div>
    <div style="font-size:10px;color:#555;margin-top:4px;">${arFiltradas.filter(a=>a.status==="Concluído").length} concluídas · ${arFiltradas.filter(a=>a.status==="Pendente").length} pendentes</div>
  </div>
</div>

<!-- RESUMO EXECUTIVO -->
<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px;margin-bottom:22px;">
  <div style="font-size:9px;font-weight:900;color:#9a3412;letter-spacing:2px;margin-bottom:8px;">RESUMO EXECUTIVO</div>
  <p style="margin:0;line-height:1.75;color:#374151;font-size:11px;">${gerarResumo()}</p>
</div>

<!-- GRÁFICOS: TIPOS + BAIRROS -->
<div class="sec">ANÁLISE POR TIPO E BAIRRO</div>
<div style="display:grid;grid-template-columns:220px 1fr;gap:24px;margin-bottom:22px;align-items:start;">
  <div style="text-align:center;">
    <div style="font-size:10px;font-weight:700;color:#555;margin-bottom:8px;">TIPOS DE OCORRÊNCIA</div>
    ${svgTipo}
    <div style="margin-top:10px;text-align:left;">${legenda}</div>
  </div>
  <div>
    <div style="font-size:10px;font-weight:700;color:#555;margin-bottom:8px;">BAIRROS COM MAIS OCORRÊNCIAS</div>
    ${svgBairro}
  </div>
</div>

<!-- GRÁFICO: EQUIPES -->
<div class="sec">DESEMPENHO POR EQUIPE</div>
<div style="margin-bottom:22px;text-align:center;">
  ${svgEq}
</div>

<!-- OFÍCIOS DETALHES -->
${ofFiltrados.length>0?`
<div class="sec">OFÍCIOS RECEBIDOS NO PERÍODO</div>
<table style="margin-bottom:22px;">
  <thead><tr><th>Nº</th><th>DATA</th><th>ORIGEM</th><th>ASSUNTO</th><th>STATUS</th></tr></thead>
  <tbody>
    ${ofFiltrados.slice(0,20).map((o,i)=>{
      const c={Pendente:"#ef4444","Em Andamento":"#d97706",Atendido:"#16a34a",Arquivado:"#6b7280"};
      return `<tr style="background:${i%2?"#f9fafb":"#fff"};">
        <td style="font-family:monospace;font-size:9px;color:#666;">${o.numero||"S/N"}</td>
        <td>${o.dataRecebimento?new Date(o.dataRecebimento+"T00:00:00").toLocaleDateString("pt-BR"):""}</td>
        <td style="font-weight:600;">${o.origem||""}</td>
        <td style="color:#374151;">${o.assunto||""}</td>
        <td style="font-weight:700;color:${c[o.status]||"#333"};">${o.status}</td>
      </tr>`;
    }).join("")}
  </tbody>
</table>`:""}

<!-- RODAPÉ -->
<div style="margin-top:30px;border-top:1px solid #e5e7eb;padding-top:12px;display:flex;justify-content:space-between;align-items:flex-end;">
  <div style="font-size:9px;color:#aaa;line-height:1.6;">
    Defesa Civil de Oriximiná/PA<br>
    (93) 99155-6518 · brigadamunicipal2023@gmail.com<br>
    Rua 24 de Dezembro — São José Operário
  </div>
  <div style="text-align:center;font-size:9px;color:#aaa;">
    ${total} ocorrência${total!==1?"s":""} · ${ofTotal} ofício${ofTotal!==1?"s":""} · ${label}
  </div>
  <div style="text-align:right;">
    <div style="border-top:1px solid #555;width:200px;padding-top:4px;font-size:9px;color:#555;text-align:center;">
      Cezar Adriano Pinheiro Nobre<br>Chefe de Divisão Operacional — Decreto 301/2025
    </div>
  </div>
</div>

<script>window.addEventListener("load",function(){setTimeout(function(){window.print();},400);});<\/script>
</body></html>`;

    const blob = new Blob([html],{type:"text/html;charset=utf-8"});
    const url  = URL.createObjectURL(blob);
    const nova = window.open(url,"_blank");
    if (!nova) window.location.href = url;
    setTimeout(()=>URL.revokeObjectURL(url),60000);
  };

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <div className="space-y-6 max-w-5xl mx-auto" style={{fontFamily:"'Barlow Condensed',sans-serif"}}>

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-wider">RELATÓRIOS</h2>
          <p className="text-gray-500 text-sm" style={{fontFamily:"system-ui"}}>Defesa Civil — Oriximiná/PA · {label}</p>
        </div>
        <button onClick={exportarPDF}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-5 py-2.5 rounded-xl font-bold text-sm tracking-wider transition-all">
          🖨️ GERAR RELATÓRIO PDF
        </button>
      </div>

      {/* Filtro */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <p className="text-xs text-gray-400 tracking-widest mb-3">PERÍODO</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {[["mes","Este mês"],["mes-especifico","Mês específico"],["ano","Ano"],["tudo","Todo o período"]].map(([v,l])=>(
            <button key={v} onClick={()=>setPeriodo(v)}
              className={`px-4 py-2 rounded-xl font-bold text-sm tracking-wider transition-all border ${periodo===v?"bg-orange-500 border-orange-500 text-white":"bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"}`}>
              {l}
            </button>
          ))}
        </div>
        {periodo==="mes-especifico"&&<input type="month" value={mesSel} onChange={e=>setMesSel(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500 text-sm"/>}
        {periodo==="ano"&&<select value={anoSel} onChange={e=>setAnoSel(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500 text-sm">{[2024,2025,2026,2027].map(a=><option key={a}>{a}</option>)}</select>}
      </div>

      {/* KPIs ocorrências */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          {l:"TOTAL",       v:total,       c:"text-orange-400",  b:"border-orange-500/30 bg-orange-500/5"},
          {l:"FINALIZADAS", v:finalizadas, c:"text-green-400",   b:"border-green-500/30 bg-green-500/5"},
          {l:"ANDAMENTO",   v:emAndamento, c:"text-yellow-400",  b:"border-yellow-500/30 bg-yellow-500/5"},
          {l:"AGUARDANDO",  v:aguardando,  c:"text-blue-400",    b:"border-blue-500/30 bg-blue-500/5"},
          {l:"TAXA",        v:`${taxa}%`,  c:"text-purple-400",  b:"border-purple-500/30 bg-purple-500/5"},
        ].map((k,i)=>(
          <div key={i} className={`bg-gray-900 border ${k.b} rounded-2xl p-4 text-center`}>
            <div className={`text-3xl font-black ${k.c}`}>{k.v}</div>
            <div className="text-gray-500 text-xs tracking-wider mt-1">{k.l}</div>
          </div>
        ))}
      </div>

      {/* KPIs ofícios + árvores */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-blue-500/30 bg-blue-500/5 rounded-2xl p-5">
          <p className="text-xs text-gray-500 tracking-widest mb-1">OFÍCIOS</p>
          <div className="text-4xl font-black text-blue-400">{ofTotal}</div>
          <div className="flex gap-3 mt-2 flex-wrap" style={{fontFamily:"system-ui"}}>
            {Object.entries(ofStatus).map(([s,c])=>(<span key={s} className="text-xs text-gray-400">{s}: <strong className="text-white">{c}</strong></span>))}
          </div>
        </div>
        <div className="bg-gray-900 border border-green-500/30 bg-green-500/5 rounded-2xl p-5">
          <p className="text-xs text-gray-500 tracking-widest mb-1">CORTE DE ÁRVORE</p>
          <div className="text-4xl font-black text-green-400">{arTotal}</div>
          <div className="text-gray-400 text-xs mt-2" style={{fontFamily:"system-ui"}}>
            {arFiltradas.filter(a=>a.status==="Concluído").length} concluídas · {arFiltradas.filter(a=>a.status==="Pendente").length} pendentes
          </div>
        </div>
      </div>

      {/* Resumo */}
      <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-5">
        <p className="text-xs text-orange-400 tracking-widest font-bold mb-2">RESUMO EXECUTIVO</p>
        <p className="text-gray-300 text-sm leading-relaxed" style={{fontFamily:"system-ui"}}>{gerarResumo()}</p>
      </div>

      {total===0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center text-gray-500" style={{fontFamily:"system-ui"}}>
          <div className="text-4xl mb-3">📋</div><p>Nenhuma ocorrência no período.</p>
        </div>
      ) : (
        <>
          {/* Gráfico tipos + bairros */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h3 className="font-bold text-white tracking-wider mb-4 text-sm">TIPOS DE OCORRÊNCIA</h3>
              <div className="flex gap-4 items-center flex-wrap">
                <div dangerouslySetInnerHTML={{__html:svgDonut(dadosTipo,160)}}/>
                <div className="flex-1 min-w-[140px]">
                  {dadosTipo.map((d,i)=>(
                    <div key={i} className="flex items-center gap-2 mb-1.5">
                      <div className="w-3 h-3 rounded flex-shrink-0" style={{background:d.cor}}/>
                      <span className="text-gray-300 text-xs flex-1" style={{fontFamily:"system-ui"}}>{d.label}</span>
                      <span className="text-white font-bold text-xs">{d.valor}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h3 className="font-bold text-white tracking-wider mb-4 text-sm">BAIRROS COM MAIS OCORRÊNCIAS</h3>
              <div className="space-y-2">
                {top6.map(([b,c],i)=>(
                  <div key={b} className="flex items-center gap-2">
                    <span className="text-orange-500 font-black w-5 text-sm">{i+1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-white font-semibold" style={{fontFamily:"system-ui"}}>{b}</span>
                        <span className="text-orange-400 font-bold">{c}</span>
                      </div>
                      <div className="bg-gray-800 rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{width:`${Math.round((c/top6[0][1])*100)}%`}}/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Equipes */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="font-bold text-white tracking-wider mb-5 text-sm">DESEMPENHO POR EQUIPE</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {dadosEquipe.map(d=>(
                <div key={d.label} className="text-center bg-gray-800 rounded-2xl p-4">
                  <div className="text-4xl font-black" style={{color:d.cor}}>{d.valor}</div>
                  <div className="font-bold text-white mt-1 text-sm">EQUIPE {d.label}</div>
                  <div className="text-gray-500 text-xs mt-0.5" style={{fontFamily:"system-ui"}}>{d.sub} do total</div>
                  <div className="mt-2 bg-gray-700 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{background:d.cor, width:d.sub}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="font-bold text-white tracking-wider mb-4 text-sm">STATUS GERAL DAS OCORRÊNCIAS</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[["Finalizadas",finalizadas,"text-green-400","bg-green-500"],["Em Andamento",emAndamento,"text-yellow-400","bg-yellow-500"],["Aguardando",aguardando,"text-blue-400","bg-blue-500"],["Canceladas",canceladas,"text-red-400","bg-red-500"]].map(([l,v,tc,bc])=>(
                <div key={l} className="text-center">
                  <div className={`text-3xl font-black ${tc}`}>{v}</div>
                  <div className="text-gray-400 text-xs mt-1 mb-2" style={{fontFamily:"system-ui"}}>{l}</div>
                  <div className="bg-gray-800 rounded-full h-2">
                    <div className={`${bc} h-2 rounded-full`} style={{width:total>0?`${Math.round((v/total)*100)}%`:"0%"}}/>
                  </div>
                  <div className="text-gray-600 text-xs mt-1">{total>0?Math.round((v/total)*100):0}%</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
