import { useContext, useState } from "react";
import { AppContext } from "../App";

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

const EQ_COR = { ALFA:"#f97316", BRAVO:"#3b82f6", CHARLIE:"#22c55e", DELTA:"#a855f7" };
const EQ_COR_TW = { ALFA:"bg-orange-500", BRAVO:"bg-blue-500", CHARLIE:"bg-green-500", DELTA:"bg-purple-500" };

function periodoLabel(periodo, mesSel, anoSel) {
  if (periodo === "tudo") return "Todo o Período";
  if (periodo === "mes") return new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).toUpperCase();
  if (periodo === "mes-especifico") {
    const [a, m] = mesSel.split("-").map(Number);
    return new Date(a, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).toUpperCase();
  }
  if (periodo === "ano") return `ANO ${anoSel}`;
  return "";
}

export default function Relatorios() {
  const { ocorrencias } = useContext(AppContext);

  const [periodo,  setPeriodo]  = useState("mes");
  const [mesSel,   setMesSel]   = useState(new Date().toISOString().slice(0, 7));
  const [anoSel,   setAnoSel]   = useState(String(new Date().getFullYear()));

  const filtradas = ocorrencias.filter(o => {
    if (periodo === "tudo") return true;
    const d = new Date(o.dataHora);
    if (periodo === "mes") {
      const n = new Date();
      return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
    }
    if (periodo === "mes-especifico") {
      const [a, m] = mesSel.split("-").map(Number);
      return d.getMonth() === m - 1 && d.getFullYear() === a;
    }
    if (periodo === "ano") return d.getFullYear() === Number(anoSel);
    return true;
  });

  const total      = filtradas.length;
  const finalizadas = filtradas.filter(o => o.status === "Finalizado").length;
  const emAndamento = filtradas.filter(o => o.status === "Em Atendimento").length;
  const aguardando  = filtradas.filter(o => o.status === "Aguardando").length;
  const canceladas  = filtradas.filter(o => o.status === "Cancelado").length;
  const taxa        = total > 0 ? Math.round((finalizadas / total) * 100) : 0;

  const porEquipe = filtradas.reduce((acc, o) => { if (o.equipe) acc[o.equipe] = (acc[o.equipe] || 0) + 1; return acc; }, {});
  const porBairro = filtradas.reduce((acc, o) => { if (o.bairro) acc[o.bairro] = (acc[o.bairro] || 0) + 1; return acc; }, {});
  const top5      = Object.entries(porBairro).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const porTipo   = {};
  filtradas.forEach(o => Object.entries(o.categorias || {}).forEach(([k, v]) => { if (v) porTipo[k] = (porTipo[k] || 0) + 1; }));
  const tiposOrd  = Object.entries(porTipo).sort((a, b) => b[1] - a[1]);

  const label = periodoLabel(periodo, mesSel, anoSel);

  const gerarResumo = () => {
    if (total === 0) return "Não foram registradas ocorrências no período selecionado.";
    const eqTop  = Object.entries(porEquipe).sort((a, b) => b[1] - a[1])[0];
    const b3     = top5.slice(0, 3).map(([b]) => b).join(", ");
    const t3     = tiposOrd.slice(0, 3).map(([k]) => TIPO_LABEL[k] || k).join(", ");
    let txt = `Durante o período de ${label}, a Defesa Civil do Município de Oriximiná/PA registrou um total de ${total} ocorrência${total > 1 ? "s" : ""}. `;
    txt += `Das ocorrências registradas, ${finalizadas} foram finalizadas (${taxa}%)`;
    if (emAndamento) txt += `, ${emAndamento} em atendimento`;
    if (aguardando)  txt += `, ${aguardando} aguardando`;
    if (canceladas)  txt += ` e ${canceladas} cancelada${canceladas > 1 ? "s" : ""}`;
    txt += `. `;
    if (eqTop) txt += `A equipe com maior número de atendimentos foi a Equipe ${eqTop[0]}, com ${eqTop[1]} ocorrência${eqTop[1] > 1 ? "s" : ""} (${Math.round((eqTop[1] / total) * 100)}% do total). `;
    if (b3)    txt += `Os bairros com maior incidência foram: ${b3}. `;
    if (t3)    txt += `As principais categorias de atendimento foram: ${t3}.`;
    return txt;
  };

  const exportarPDF = async () => {
    let logo = "";
    try {
      const r = await fetch("/logo-defesa-civil.jpg");
      const b = await r.blob();
      logo = await new Promise(res => { const rd = new FileReader(); rd.onloadend = () => res(rd.result); rd.readAsDataURL(b); });
    } catch {}

    const kpis = [
      ["TOTAL DE OCORRÊNCIAS", total, "#f97316"],
      ["FINALIZADAS", finalizadas, "#22c55e"],
      ["EM ANDAMENTO", emAndamento, "#eab308"],
      ["TAXA DE CONCLUSÃO", `${taxa}%`, "#3b82f6"],
    ];

    const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<title>Relatório Defesa Civil — ${label}</title>
<style>
  * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; box-sizing:border-box; }
  body { font-family:Arial,sans-serif; background:white; color:#1a1a1a; margin:0; padding:20px; font-size:11px; }
  @page { size:A4 portrait; margin:12mm; }
  table { border-collapse:collapse; width:100%; font-size:10px; }
  th { padding:5px 8px; background:#f9fafb; border:1px solid #e5e7eb; text-align:left; font-size:9px; color:#555; letter-spacing:1px; font-weight:700; }
  td { padding:4px 8px; border:1px solid #e5e7eb; }
  .sec { font-size:10px; font-weight:900; letter-spacing:2px; color:#888; border-bottom:1px solid #e5e7eb; padding-bottom:5px; margin-bottom:12px; }
</style></head><body>

<div style="display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #f97316;padding-bottom:14px;margin-bottom:20px;">
  <div style="display:flex;align-items:center;gap:12px;">
    ${logo ? `<img src="${logo}" style="width:58px;height:58px;border-radius:50%;object-fit:cover;">` : ""}
    <div>
      <div style="font-size:18px;font-weight:900;color:#f97316;letter-spacing:1px;">RELATÓRIO OPERACIONAL</div>
      <div style="font-size:12px;font-weight:700;color:#333;">DEFESA CIVIL — ORIXIMINÁ/PA</div>
      <div style="font-size:10px;color:#555;">Secretaria Municipal de Segurança Pública e Defesa Social</div>
      <div style="font-size:10px;color:#888;">Gerado em ${new Date().toLocaleString("pt-BR")}</div>
    </div>
  </div>
  <div style="text-align:right;">
    <div style="background:#f97316;color:white;font-size:12px;font-weight:900;padding:7px 16px;border-radius:8px;letter-spacing:1px;">${label}</div>
    <div style="font-size:9px;color:#888;margin-top:5px;">${total} ocorrência${total !== 1 ? "s" : ""} registrada${total !== 1 ? "s" : ""}</div>
  </div>
</div>

<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px;">
  ${kpis.map(([l, v, c]) => `
    <div style="border:2px solid ${c}33;border-radius:8px;padding:10px;text-align:center;">
      <div style="font-size:26px;font-weight:900;color:${c};">${v}</div>
      <div style="font-size:9px;color:#888;letter-spacing:1px;margin-top:3px;">${l}</div>
    </div>`).join("")}
</div>

<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:14px;margin-bottom:20px;">
  <div style="font-size:9px;font-weight:700;color:#9a3412;letter-spacing:2px;margin-bottom:7px;">RESUMO EXECUTIVO</div>
  <p style="margin:0;line-height:1.7;color:#374151;">${gerarResumo()}</p>
</div>

<div style="margin-bottom:20px;">
  <div class="sec">DESEMPENHO POR EQUIPE</div>
  ${Object.entries(porEquipe).sort((a, b) => b[1] - a[1]).map(([eq, cnt]) => {
    const pct = Math.round((cnt / total) * 100);
    const cor = EQ_COR[eq] || "#f97316";
    return `<div style="margin-bottom:9px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
        <span style="font-weight:700;">EQUIPE ${eq}</span>
        <span style="color:#555;">${cnt} ocorrências (${pct}%)</span>
      </div>
      <div style="background:#f3f4f6;border-radius:4px;height:10px;">
        <div style="background:${cor};height:10px;border-radius:4px;width:${pct}%;"></div>
      </div>
    </div>`;
  }).join("")}
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
  <div>
    <div class="sec">TOP ${top5.length} BAIRROS</div>
    ${top5.map(([b, c], i) => `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
        <span style="color:#f97316;font-weight:900;width:16px;">${i + 1}</span>
        <div style="flex:1;">
          <div style="display:flex;justify-content:space-between;">
            <span style="font-weight:600;">${b}</span>
            <span style="color:#f97316;font-weight:700;">${c}</span>
          </div>
          <div style="background:#f3f4f6;border-radius:3px;height:6px;margin-top:2px;">
            <div style="background:#f97316;height:6px;border-radius:3px;width:${Math.round((c / top5[0][1]) * 100)}%;"></div>
          </div>
        </div>
      </div>`).join("")}
  </div>
  <div>
    <div class="sec">OCORRÊNCIAS POR TIPO</div>
    ${tiposOrd.map(([k, c]) => `
      <div style="display:flex;justify-content:space-between;padding:4px 8px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:4px;margin-bottom:3px;">
        <span>${TIPO_LABEL[k] || k}</span>
        <strong style="color:#f97316;">${c}</strong>
      </div>`).join("")}
  </div>
</div>

<div style="margin-bottom:20px;">
  <div class="sec">STATUS DAS OCORRÊNCIAS</div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
    ${[["Finalizadas", finalizadas, "#22c55e"], ["Em Andamento", emAndamento, "#eab308"], ["Aguardando", aguardando, "#3b82f6"], ["Canceladas", canceladas, "#dc2626"]].map(([l, v, c]) => `
      <div style="text-align:center;border:1px solid ${c}33;border-radius:8px;padding:10px;">
        <div style="font-size:22px;font-weight:900;color:${c};">${v}</div>
        <div style="font-size:9px;color:#888;margin-top:2px;">${l}</div>
        <div style="font-size:10px;color:#aaa;">${total > 0 ? Math.round((v / total) * 100) : 0}%</div>
      </div>`).join("")}
  </div>
</div>

<div>
  <div class="sec">LISTA COMPLETA DE OCORRÊNCIAS</div>
  <table>
    <thead><tr><th>ID</th><th>DATA</th><th>BAIRRO</th><th>EQUIPE</th><th>TIPO</th><th>STATUS</th></tr></thead>
    <tbody>
      ${filtradas.map((o, i) => {
        const tipo = Object.entries(o.categorias || {}).find(([, v]) => v)?.[1] || "—";
        const sc = { Finalizado: "#16a34a", "Em Atendimento": "#d97706", Cancelado: "#dc2626", Aguardando: "#2563eb" };
        return `<tr style="background:${i % 2 === 0 ? "#fff" : "#f9fafb"};">
          <td style="font-family:monospace;color:#666;font-size:9px;">${o.id}</td>
          <td>${new Date(o.dataHora).toLocaleDateString("pt-BR")}</td>
          <td style="font-weight:600;">${o.bairro}</td>
          <td>${o.equipe}</td>
          <td style="font-size:9px;color:#555;">${tipo}</td>
          <td style="font-weight:700;color:${sc[o.status] || "#333"};">${o.status}</td>
        </tr>`;
      }).join("")}
    </tbody>
  </table>
</div>

<div style="margin-top:24px;border-top:1px solid #e5e7eb;padding-top:10px;display:flex;justify-content:space-between;font-size:9px;color:#aaa;">
  <span>Defesa Civil de Oriximiná/PA · (93) 99155-6518 · brigadamunicipal2023@gmail.com</span>
  <span>${total} ocorrência${total !== 1 ? "s" : ""} · ${label}</span>
</div>

<script>window.addEventListener("load",function(){setTimeout(function(){window.print();},400);});<\/script>
</body></html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const nova = window.open(url, "_blank");
    if (!nova) window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const handleExportCSV = () => {
    const headers = ["ID","Data","Bairro","Equipe","Status","Tipo","Solicitante","Descrição"];
    const rows = filtradas.map(o => {
      const tipo = Object.entries(o.categorias || {}).find(([, v]) => v)?.[1] || "—";
      return [o.id, new Date(o.dataHora).toLocaleString("pt-BR"), o.bairro, o.equipe, o.status, tipo, `"${o.solicitante}"`, `"${o.descricao}"`];
    });
    const csv  = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `ocorrencias_${label.replace(/\s/g,"_")}.csv`; a.click();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-wider">RELATÓRIOS</h2>
          <p className="text-gray-500 text-sm" style={{ fontFamily: "system-ui" }}>Defesa Civil — Oriximiná/PA · {label}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleExportCSV}
            className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-sm tracking-wider transition-all">
            📊 EXCEL/CSV
          </button>
          <button onClick={exportarPDF}
            className="bg-orange-500 hover:bg-orange-400 text-white px-4 py-2 rounded-xl font-bold text-sm tracking-wider transition-all">
            🖨️ GERAR PDF
          </button>
        </div>
      </div>

      {/* Filtro de período */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <p className="text-xs text-gray-400 tracking-widest mb-3">PERÍODO DO RELATÓRIO</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {[["mes","Este mês"],["mes-especifico","Mês específico"],["ano","Ano"],["tudo","Todo o período"]].map(([v, l]) => (
            <button key={v} onClick={() => setPeriodo(v)}
              className={`px-4 py-2 rounded-xl font-bold text-sm tracking-wider transition-all border ${periodo === v ? "bg-orange-500 border-orange-500 text-white" : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"}`}>
              {l}
            </button>
          ))}
        </div>
        {periodo === "mes-especifico" && (
          <input type="month" value={mesSel} onChange={e => setMesSel(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500 text-sm" />
        )}
        {periodo === "ano" && (
          <select value={anoSel} onChange={e => setAnoSel(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500 text-sm">
            {[2024, 2025, 2026, 2027].map(a => <option key={a}>{a}</option>)}
          </select>
        )}
      </div>

      {total === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center text-gray-500" style={{ fontFamily: "system-ui" }}>
          <div className="text-4xl mb-3">📋</div>
          <p>Nenhuma ocorrência no período selecionado.</p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { l:"TOTAL",          v:total,        icon:"📋", cor:"text-orange-400" },
              { l:"FINALIZADAS",    v:finalizadas,  icon:"✅", cor:"text-green-400"  },
              { l:"EM ANDAMENTO",   v:emAndamento,  icon:"⚡", cor:"text-yellow-400" },
              { l:"TAXA CONCLUSÃO", v:`${taxa}%`,   icon:"📈", cor:"text-blue-400"   },
            ].map((c, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center">
                <div className="text-3xl mb-2">{c.icon}</div>
                <div className={`text-4xl font-black ${c.cor}`}>{c.v}</div>
                <div className="text-gray-500 text-xs tracking-wider mt-1">{c.l}</div>
              </div>
            ))}
          </div>

          {/* Resumo em texto */}
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-5">
            <p className="text-xs text-orange-400 tracking-widest font-bold mb-2">RESUMO EXECUTIVO</p>
            <p className="text-gray-300 text-sm leading-relaxed" style={{ fontFamily: "system-ui" }}>{gerarResumo()}</p>
          </div>

          {/* Por equipe */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="font-bold text-white tracking-wider mb-5 text-sm">DESEMPENHO POR EQUIPE</h3>
            <div className="space-y-4">
              {Object.entries(porEquipe).sort((a, b) => b[1] - a[1]).map(([eq, cnt]) => {
                const pct = Math.round((cnt / total) * 100);
                return (
                  <div key={eq}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white font-bold text-sm">EQUIPE {eq}</span>
                      <span className="text-gray-400 text-sm" style={{ fontFamily: "system-ui" }}>{cnt} oc. <span className="text-gray-600">({pct}%)</span></span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-3">
                      <div className={`${EQ_COR_TW[eq] || "bg-orange-500"} h-3 rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bairros + Tipos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="font-bold text-white tracking-wider mb-5 text-sm">TOP {top5.length} BAIRROS</h3>
              <div className="space-y-3">
                {top5.map(([b, c], i) => (
                  <div key={b} className="flex items-center gap-3">
                    <span className="text-orange-500 font-black text-xl w-6">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-white text-sm font-semibold">{b}</span>
                        <span className="text-orange-400 font-black">{c}</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${Math.round((c / top5[0][1]) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="font-bold text-white tracking-wider mb-5 text-sm">OCORRÊNCIAS POR TIPO</h3>
              <div className="space-y-2">
                {tiposOrd.map(([k, c]) => (
                  <div key={k} className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3">
                    <span className="text-gray-300 text-sm" style={{ fontFamily: "system-ui" }}>{TIPO_LABEL[k] || k}</span>
                    <span className="text-orange-400 font-black">{c}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="font-bold text-white tracking-wider mb-5 text-sm">STATUS GERAL</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { l:"Finalizado",    v:finalizadas,  cor:"text-green-400",  bar:"bg-green-500"  },
                { l:"Em Atendimento",v:emAndamento,  cor:"text-yellow-400", bar:"bg-yellow-500" },
                { l:"Aguardando",    v:aguardando,   cor:"text-blue-400",   bar:"bg-blue-500"   },
                { l:"Cancelado",     v:canceladas,   cor:"text-red-400",    bar:"bg-red-500"    },
              ].map((s, i) => {
                const pct = total > 0 ? Math.round((s.v / total) * 100) : 0;
                return (
                  <div key={i} className="text-center">
                    <div className={`text-3xl font-black ${s.cor}`}>{s.v}</div>
                    <div className="text-gray-400 text-xs mt-1 mb-2" style={{ fontFamily: "system-ui" }}>{s.l}</div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className={`${s.bar} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-gray-600 text-xs mt-1">{pct}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabela */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="font-bold text-white tracking-wider mb-5 text-sm">LISTA COMPLETA — {total} OCORRÊNCIA{total !== 1 ? "S" : ""}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ fontFamily: "system-ui" }}>
                <thead>
                  <tr className="border-b border-gray-800">
                    {["ID","DATA","BAIRRO","EQUIPE","TIPO","STATUS"].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-xs text-gray-500 tracking-wider font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((o, i) => {
                    const tipo  = Object.entries(o.categorias || {}).find(([, v]) => v)?.[1] || "—";
                    const sCols = { Finalizado:"text-green-400","Em Atendimento":"text-yellow-400",Aguardando:"text-blue-400",Cancelado:"text-red-400" };
                    return (
                      <tr key={o.id} className={`border-b border-gray-800/50 ${i % 2 ? "bg-gray-800/20" : ""}`}>
                        <td className="py-2 px-3 text-gray-500 font-mono text-xs">{o.id}</td>
                        <td className="py-2 px-3 text-gray-300">{new Date(o.dataHora).toLocaleDateString("pt-BR")}</td>
                        <td className="py-2 px-3 text-white font-semibold">{o.bairro}</td>
                        <td className="py-2 px-3 text-gray-300">{o.equipe}</td>
                        <td className="py-2 px-3 text-gray-400 text-xs">{tipo}</td>
                        <td className={`py-2 px-3 font-bold text-xs ${sCols[o.status] || "text-gray-400"}`}>{o.status}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
