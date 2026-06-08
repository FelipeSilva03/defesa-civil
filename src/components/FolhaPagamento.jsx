import { useState, useEffect, useCallback } from "react";

const API_FOLHA   = `${import.meta.env.VITE_API_URL}/api/folha`;
const API_AGENTES = `${import.meta.env.VITE_API_URL}/api/agentes`;

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function abreviarCargo(cargo) {
  if (!cargo) return "Ag. de Prot. Def. Civil";
  if (/chefe/i.test(cargo))       return "Chefe de Div. Operacional";
  if (/coordenador/i.test(cargo)) return "Coordenador";
  if (/supervisor/i.test(cargo))  return "Supervisor";
  if (/motorista/i.test(cargo))   return "Motorista de Veículos Pesados";
  return "Ag. de Prot. Def. Civil";
}

const novaLinha = (nome = "", cargo = "") => ({
  nome:            nome ? nome.toUpperCase() : "",
  cargo:           cargo || "Ag. de Prot. Def. Civil",
  dias:            "30",
  faltas:          "",
  atestado:        "",
  extras50:        "",
  extras100:       "",
  adicNoturno:     "120",
  periculosidade:  "30%",
});

export default function FolhaPagamento() {
  const hoje = new Date();
  const [mesAno,    setMesAno]    = useState(`${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,"0")}`);
  const [linhas,    setLinhas]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [salvoOk,   setSalvoOk]   = useState(false);
  const [historico, setHistorico] = useState([]);

  const carregarMes = useCallback(async (ma) => {
    setLoading(true);
    try {
      const [rFolha, rAgentes] = await Promise.all([
        fetch(API_FOLHA   + "?t=" + Date.now()).then(r => r.ok ? r.json() : { folhas:  [] }).catch(() => ({ folhas:  [] })),
        fetch(API_AGENTES + "?t=" + Date.now()).then(r => r.ok ? r.json() : { agentes: [] }).catch(() => ({ agentes: [] })),
      ]);
      const folhas = rFolha.folhas || [];
      setHistorico(folhas.map(f => f.mesAno).sort().reverse());
      const folhaAtual = folhas.find(f => f.mesAno === ma);
      if (folhaAtual?.dados?.linhas?.length > 0) {
        setLinhas(folhaAtual.dados.linhas);
      } else {
        const agentes = (rAgentes.agentes || []).filter(a => a.nome);
        setLinhas(agentes.map(a => novaLinha(a.nome, abreviarCargo(a.cargo))));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregarMes(mesAno); }, [mesAno, carregarMes]);

  const salvar = async () => {
    setSaving(true); setSalvoOk(false);
    try {
      const r = await fetch(API_FOLHA, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mesAno, dados: { linhas } }),
      });
      if (r.ok) {
        setSalvoOk(true);
        setHistorico(h => (h.includes(mesAno) ? h : [mesAno, ...h]).sort().reverse());
        setTimeout(() => setSalvoOk(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  };

  const upd = (idx, campo, valor) =>
    setLinhas(prev => prev.map((l, i) => i === idx ? { ...l, [campo]: valor } : l));

  const exportarPDF = async () => {
    let logo64 = "";
    try {
      const r = await fetch("/logo-defesa-civil.jpg");
      const b = await r.blob();
      logo64 = await new Promise(res => { const rd = new FileReader(); rd.onloadend = () => res(rd.result); rd.readAsDataURL(b); });
    } catch {}

    const [ano, mes] = mesAno.split("-");
    const nomeMes = MESES[parseInt(mes) - 1];

    const linhasHTML = linhas.map((l, i) => `
      <tr>
        <td style="text-align:center">${i + 1}.</td>
        <td style="text-align:left;padding-left:6px">${l.nome || ""}</td>
        <td style="text-align:center">${l.cargo || ""}</td>
        <td style="text-align:center">${l.dias ?? ""}</td>
        <td style="text-align:center">${l.faltas ?? ""}</td>
        <td style="text-align:center">${l.atestado ?? ""}</td>
        <td style="text-align:center">${l.extras50 ?? ""}</td>
        <td style="text-align:center">${l.extras100 ?? ""}</td>
        <td style="text-align:center">${l.adicNoturno ?? ""}</td>
        <td style="text-align:center">${l.periculosidade ?? ""}</td>
      </tr>`).join("");

    const logoTag = logo64 ? `<img src="${logo64}" style="width:60px;height:60px;object-fit:contain" alt="">` : "";

    const html = `<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="UTF-8">
<title>Folha de Pagamento – ${nomeMes}/${ano}</title>
<style>
  @page { size: A4 portrait; margin: 15mm 12mm 12mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 9.5pt; color: #000; margin: 0; }
  .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 6px; }
  .header-mid { flex: 1; text-align: center; line-height: 1.5; }
  .sep { border: none; border-top: 1px solid #555; margin: 4px 0 8px; }
  .sep2 { border: none; border-top: 1px solid #999; margin: 2px 0 6px; }
  .titulo { text-align: center; font-weight: bold; font-size: 10pt; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 0.5px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #000; padding: 4px 5px; font-size: 8.5pt; vertical-align: middle; }
  th { background: #efefef; font-weight: bold; text-align: center; }
  .signature { text-align: center; margin-top: 55px; font-size: 9.5pt; }
  .assin-linha { display: inline-block; border-top: 1px solid #000; width: 280px; margin-bottom: 4px; }
  .footer { text-align: center; margin-top: 10px; font-size: 7.5pt; color: #666; border-top: 1px solid #ccc; padding-top: 4px; }
</style>
</head><body>
<div class="header">
  <div style="width:68px">${logoTag}</div>
  <div class="header-mid">
    <strong style="font-size:10.5pt">Prefeitura Municipal de Oriximiná</strong><br>
    <strong>Secretaria Municipal de Segurança Pública e Defesa Social</strong><br>
    <span style="font-size:8pt">Tv. Ângelo Augusto, nº 832 – Santa Terezinha – CEP: 68270-000 – Oriximiná/PA</span><br>
    <span style="font-size:8pt">E-mail: sec.semusp@oriximina.pa.gov.br</span>
  </div>
  <div style="width:68px;text-align:right">${logoTag}</div>
</div>
<hr class="sep">
<hr class="sep2">
<div class="titulo">Relação dos Agentes – Pagamento ${nomeMes}/${ano}</div>
<table>
  <thead>
    <tr>
      <th rowspan="2" style="width:28px">Nº</th>
      <th rowspan="2">NOME</th>
      <th rowspan="2" style="width:110px">CARGO</th>
      <th rowspan="2" style="width:36px">DIAS</th>
      <th rowspan="2" style="width:46px">FALTAS</th>
      <th rowspan="2" style="width:56px">ATESTADO</th>
      <th colspan="2">HORAS EXTRAS</th>
      <th rowspan="2" style="width:68px">ADIC. NOTURNO</th>
      <th rowspan="2" style="width:62px">PERICUL. 30%</th>
    </tr>
    <tr>
      <th style="width:42px">50%</th>
      <th style="width:42px">100%</th>
    </tr>
  </thead>
  <tbody>${linhasHTML}</tbody>
</table>
<div class="signature">
  <br><br>
  <div class="assin-linha"></div><br>
  <strong>Cezar Adriano Pinheiro Nobre</strong><br>
  Chefe de divisão operacional<br>
  Decreto N° 301/2025
</div>
<div class="footer">Trav. Ângelo Augusto, 832 - Santa Terezinha – CEP: 68.270-000 – Fone: (93) 992183618</div>
<script>window.onload = () => setTimeout(() => window.print(), 400);<\/script>
</body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url  = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };

  const [ano, mes] = mesAno.split("-");
  const nomeMesAtual = MESES[parseInt(mes) - 1];

  if (loading) return (
    <div className="text-center py-20 text-gray-500" style={{fontFamily:"system-ui"}}>
      <div className="text-4xl mb-3">💰</div>
      <p>Carregando folha de pagamento...</p>
    </div>
  );

  return (
    <div className="space-y-4" style={{fontFamily:"'Barlow Condensed',sans-serif"}}>

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-wider">FOLHA DE PAGAMENTO</h2>
          <p className="text-gray-500 text-sm" style={{fontFamily:"system-ui"}}>
            {nomeMesAtual}/{ano} · {linhas.length} agente(s)
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input type="month" value={mesAno} onChange={e => setMesAno(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500 text-sm"
            style={{fontFamily:"system-ui"}} />
          <button onClick={salvar} disabled={saving}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm tracking-wider transition-all disabled:opacity-60
              ${salvoOk ? "bg-green-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"}`}>
            {saving ? "💾 Salvando..." : salvoOk ? "✅ Salvo!" : "💾 SALVAR"}
          </button>
          <button onClick={exportarPDF}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-5 py-2.5 rounded-xl font-bold text-sm tracking-wider transition-all">
            📄 EXPORTAR PDF
          </button>
        </div>
      </div>

      {/* Meses salvos */}
      {historico.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {historico.map(h => {
            const [a, m] = h.split("-");
            return (
              <button key={h} onClick={() => setMesAno(h)}
                className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider transition-all border
                  ${mesAno === h
                    ? "bg-orange-500 border-orange-500 text-white"
                    : "border-gray-700 bg-gray-900 text-gray-400 hover:text-white hover:border-gray-500"}`}>
                {MESES[parseInt(m)-1].substring(0,3).toUpperCase()}/{a}
              </button>
            );
          })}
        </div>
      )}

      {/* Tabela */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" style={{fontFamily:"system-ui", minWidth:"860px"}}>
            <thead>
              <tr className="border-b border-gray-700 bg-gray-900/80">
                <th className="px-2 py-3 text-gray-500 font-bold text-xs tracking-wider text-center w-10">#</th>
                <th className="px-3 py-3 text-gray-400 font-bold text-xs tracking-wider text-left">NOME</th>
                <th className="px-3 py-3 text-gray-400 font-bold text-xs tracking-wider text-center w-36">CARGO</th>
                <th className="px-2 py-3 text-gray-400 font-bold text-xs tracking-wider text-center w-14">DIAS</th>
                <th className="px-2 py-3 text-red-400 font-bold text-xs tracking-wider text-center w-14">FALTAS</th>
                <th className="px-2 py-3 text-yellow-400 font-bold text-xs tracking-wider text-center w-16">ATEST.</th>
                <th className="px-2 py-3 text-orange-400 font-bold text-xs tracking-wider text-center w-14">
                  H.EX<br/><span className="text-orange-300 font-normal">50%</span>
                </th>
                <th className="px-2 py-3 text-orange-400 font-bold text-xs tracking-wider text-center w-14">
                  H.EX<br/><span className="text-orange-300 font-normal">100%</span>
                </th>
                <th className="px-2 py-3 text-blue-400 font-bold text-xs tracking-wider text-center w-20">NOTURNO</th>
                <th className="px-2 py-3 text-green-400 font-bold text-xs tracking-wider text-center w-20">PERICUL.</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l, idx) => (
                <tr key={idx} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors group">
                  <td className="px-2 py-1.5 text-gray-600 text-center text-xs">{idx + 1}</td>

                  {/* Nome */}
                  <td className="px-2 py-1">
                    <input value={l.nome} onChange={e => upd(idx, "nome", e.target.value.toUpperCase())}
                      className="w-full bg-transparent text-white text-sm px-2 py-1 rounded-lg outline-none focus:bg-gray-800 transition-colors"
                      placeholder="NOME DO AGENTE" />
                  </td>

                  {/* Cargo */}
                  <td className="px-2 py-1">
                    <input value={l.cargo} onChange={e => upd(idx, "cargo", e.target.value)}
                      className="w-full bg-transparent text-gray-400 text-xs px-2 py-1 rounded-lg outline-none focus:bg-gray-800 transition-colors text-center"
                      placeholder="Cargo" />
                  </td>

                  {/* Dias */}
                  <td className="px-1 py-1">
                    <input value={l.dias ?? ""} onChange={e => upd(idx, "dias", e.target.value)}
                      className="w-full bg-transparent text-white text-sm text-center px-1 py-1 rounded-lg outline-none focus:bg-gray-800 transition-colors"
                      placeholder="30" />
                  </td>

                  {/* Faltas */}
                  <td className="px-1 py-1">
                    <input value={l.faltas ?? ""} onChange={e => upd(idx, "faltas", e.target.value)}
                      className="w-full bg-transparent text-red-400 text-sm text-center px-1 py-1 rounded-lg outline-none focus:bg-gray-800 transition-colors"
                      placeholder="—" />
                  </td>

                  {/* Atestado */}
                  <td className="px-1 py-1">
                    <input value={l.atestado ?? ""} onChange={e => upd(idx, "atestado", e.target.value)}
                      className="w-full bg-transparent text-yellow-400 text-sm text-center px-1 py-1 rounded-lg outline-none focus:bg-gray-800 transition-colors"
                      placeholder="—" />
                  </td>

                  {/* Extras 50% */}
                  <td className="px-1 py-1">
                    <input value={l.extras50 ?? ""} onChange={e => upd(idx, "extras50", e.target.value)}
                      className="w-full bg-transparent text-orange-300 text-sm text-center px-1 py-1 rounded-lg outline-none focus:bg-gray-800 transition-colors"
                      placeholder="—" />
                  </td>

                  {/* Extras 100% */}
                  <td className="px-1 py-1">
                    <input value={l.extras100 ?? ""} onChange={e => upd(idx, "extras100", e.target.value)}
                      className="w-full bg-transparent text-orange-300 text-sm text-center px-1 py-1 rounded-lg outline-none focus:bg-gray-800 transition-colors"
                      placeholder="—" />
                  </td>

                  {/* Noturno */}
                  <td className="px-1 py-1">
                    <input value={l.adicNoturno ?? ""} onChange={e => upd(idx, "adicNoturno", e.target.value)}
                      className="w-full bg-transparent text-blue-300 text-sm text-center px-1 py-1 rounded-lg outline-none focus:bg-gray-800 transition-colors"
                      placeholder="120" />
                  </td>

                  {/* Periculosidade */}
                  <td className="px-1 py-1">
                    <input value={l.periculosidade ?? ""} onChange={e => upd(idx, "periculosidade", e.target.value)}
                      className="w-full bg-transparent text-green-300 text-sm text-center px-1 py-1 rounded-lg outline-none focus:bg-gray-800 transition-colors"
                      placeholder="30%" />
                  </td>

                  {/* Excluir */}
                  <td className="px-1 py-1 text-center">
                    <button onClick={() => setLinhas(prev => prev.filter((_,i) => i !== idx))}
                      className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg p-1 transition-all">
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}

              {linhas.length === 0 && (
                <tr>
                  <td colSpan="11" className="py-12 text-center text-gray-600" style={{fontFamily:"system-ui"}}>
                    <div className="text-3xl mb-2">💰</div>
                    <p className="text-sm">Nenhum agente. Clique em "+ ADICIONAR LINHA" abaixo.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between">
          <button onClick={() => setLinhas(prev => [...prev, novaLinha()])}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm font-bold tracking-wider transition-colors">
            + ADICIONAR LINHA
          </button>
          <span className="text-gray-600 text-xs" style={{fontFamily:"system-ui"}}>{linhas.length} agente(s)</span>
        </div>
      </div>

      <p className="text-gray-600 text-xs text-right" style={{fontFamily:"system-ui"}}>
        Clique em "SALVAR" para sincronizar com todos os aparelhos.
      </p>
    </div>
  );
}
