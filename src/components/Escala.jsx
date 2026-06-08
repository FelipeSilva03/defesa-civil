import { useState, useEffect } from "react";
import { BASE_URL } from "../api";
const API = `${BASE_URL}/api/escalas`;

const CICLO = ["D", "C", "A", "B"];
const LETRAS = ["A", "B", "C", "D"];

const EQUIPES_DEFAULT = {
  A: { nome: "ALFA",   chefe: "AG LOBATO",   motorBrigadista: "AG RIVANE",   brigadistas: ["AG HARIELSON"] },
  B: { nome: "BRAVO",  chefe: "AG DOMINGAS", motorBrigadista: "AG ABIEL",    brigadistas: ["AG AZEVEDO"]   },
  C: { nome: "CHARLE", chefe: "AG ARANHA",   motorBrigadista: "AG ARANHA",   brigadistas: ["AG CARLOS", "AG KAREN"] },
  D: { nome: "DELTA",  chefe: "AG CORDEIRO", motorBrigadista: "AG CORDEIRO", brigadistas: ["AG MARCELO", "AG DONISON"] },
};

const COR = {
  A: { cel: "#16a34a", txt: "#fff" },
  B: { cel: "#ca8a04", txt: "#fff" },
  C: { cel: "#2563eb", txt: "#fff" },
  D: { cel: "#ea580c", txt: "#fff" },
};

function mesAtual() { return new Date().toISOString().slice(0, 7); }

function diasNoMes(mesAno) {
  const [a, m] = mesAno.split("-").map(Number);
  return new Date(a, m, 0).getDate();
}

function semana(mesAno, dia) {
  const [a, m] = mesAno.split("-").map(Number);
  const s = new Date(a, m - 1, dia).toLocaleDateString("pt-BR", { weekday: "short" });
  return s[0].toUpperCase();
}

function nomeMesAno(mesAno) {
  const [a, m] = mesAno.split("-").map(Number);
  const nome = new Date(a, m - 1, 1).toLocaleDateString("pt-BR", { month: "long" }).toUpperCase();
  return `${nome} – ${a}`;
}

function gerarTurnos(numDias, inicio) {
  const si = CICLO.indexOf(inicio);
  return Array.from({ length: numDias }, (_, i) => CICLO[(si + i) % 4]);
}

function calcInicioNoite(inicioDia) {
  return CICLO[(CICLO.indexOf(inicioDia) + 3) % 4];
}

export default function Escala() {
  const [mesAno,     setMesAno]     = useState(mesAtual);
  const [inicioDia,  setInicioDia]  = useState("D");
  const [equipes,    setEquipes]    = useState(EQUIPES_DEFAULT);
  const [ferias,     setFerias]     = useState("");
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [editEq,     setEditEq]     = useState(null);
  const [formEq,     setFormEq]     = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}?mes=${mesAno}`)
      .then(r => r.json())
      .then(d => {
        if (d.escala) {
          setInicioDia(d.escala.inicioDia || "D");
          try { setEquipes(JSON.parse(d.escala.equipes)); } catch { setEquipes(EQUIPES_DEFAULT); }
          setFerias(d.escala.ferias || "");
        } else {
          setInicioDia("D");
          setFerias("");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [mesAno]);

  const salvar = async () => {
    setSaving(true);
    await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ escala: { mesAno, inicioDia, equipes: JSON.stringify(equipes), ferias } }),
    }).catch(() => {});
    setSaving(false);
  };

  const exportarPDF = async () => {
    const docEl = document.querySelector(".print-doc");
    if (!docEl) return;

    const clone = docEl.cloneNode(true);
    clone.querySelectorAll(".no-print").forEach(el => el.remove());
    clone.style.cssText = "font-family:Arial,sans-serif;background:white;color:black;padding:0;margin:0;border-radius:0;box-shadow:none;";

    // Converte todas as imagens para base64 (necessário para blob URL)
    await Promise.all([...clone.querySelectorAll("img")].map(async img => {
      try {
        const resp = await fetch(img.getAttribute("src"));
        const blob = await resp.blob();
        img.src = await new Promise(res => {
          const r = new FileReader();
          r.onloadend = () => res(r.result);
          r.readAsDataURL(blob);
        });
      } catch {
        img.src = window.location.origin + "/logo-defesa-civil.jpg";
      }
    }));

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Escala ${mesAno}</title>
  <style>
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: white; color: black; margin: 0; padding: 0; }
    table { border-collapse: collapse; }
    @page { size: A4 landscape; margin: 8mm; }
  </style>
</head>
<body>
${clone.outerHTML}
<script>window.addEventListener('load', function(){ setTimeout(function(){ window.print(); }, 400); });<\/script>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const nova = window.open(url, "_blank");
    if (!nova) window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const abrirEq = (l) => { setEditEq(l); setFormEq({ ...equipes[l], brigadistas: [...equipes[l].brigadistas] }); };
  const salvarEq = () => { setEquipes(eq => ({ ...eq, [editEq]: formEq })); setEditEq(null); };

  const numDias    = diasNoMes(mesAno);
  const turnosDia  = gerarTurnos(numDias, inicioDia);
  const turnosNoite = gerarTurnos(numDias, calcInicioNoite(inicioDia));
  const dias       = Array.from({ length: numDias }, (_, i) => i + 1);

  return (
    <>

      <div className="space-y-5" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>

        {/* Cabeçalho e controles */}
        <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-white tracking-wider">ESCALA DE TRABALHO</h2>
            <p className="text-gray-500 text-sm" style={{ fontFamily: "system-ui" }}>Escala mensal da brigada — Defesa Civil Oriximiná/PA</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {saving && <span className="text-gray-500 text-xs" style={{ fontFamily: "system-ui" }}>💾 Salvando...</span>}
            <input type="month" value={mesAno} onChange={e => setMesAno(e.target.value)}
              className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500 text-sm" />
            <button onClick={salvar}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm tracking-wider transition-all">
              💾 SALVAR
            </button>
            <button onClick={exportarPDF}
              className="bg-orange-500 hover:bg-orange-400 text-white px-4 py-2.5 rounded-xl font-bold text-sm tracking-wider transition-all">
              🖨️ IMPRIMIR / PDF
            </button>
          </div>
        </div>

        {/* Painel de configuração */}
        <div className="no-print bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-white tracking-wider text-sm border-b border-gray-800 pb-3">CONFIGURAÇÃO</h3>
          <div className="flex flex-wrap gap-8 items-start">
            <div>
              <p className="text-xs text-gray-400 tracking-widest mb-2">EQUIPE QUE ABRE O TURNO DIA NO DIA 1</p>
              <div className="flex gap-2">
                {LETRAS.map(l => (
                  <button key={l} onClick={() => setInicioDia(l)}
                    style={inicioDia === l ? { background: COR[l].cel, color: COR[l].txt } : {}}
                    className={`w-10 h-10 rounded-xl font-black text-base transition-all ${inicioDia === l ? "" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                    {l}
                  </button>
                ))}
              </div>
              <p className="text-gray-600 text-xs mt-1.5" style={{ fontFamily: "system-ui" }}>
                Turno noite abre com equipe <strong className="text-gray-400">{calcInicioNoite(inicioDia)}</strong>
              </p>
            </div>
            <div className="flex-1 min-w-[200px]">
              <p className="text-xs text-gray-400 tracking-widest mb-2">FÉRIAS</p>
              <input value={ferias} onChange={e => setFerias(e.target.value)}
                placeholder="Ex: AG Rildo, AG Felipe..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 outline-none focus:border-orange-500 text-sm"
                style={{ fontFamily: "system-ui" }} />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500" style={{ fontFamily: "system-ui" }}>Carregando...</div>
        ) : (
          /* ── DOCUMENTO IMPRIMÍVEL ── */
          <div className="print-doc bg-white text-gray-900 rounded-2xl p-6 overflow-hidden" style={{ fontFamily: "Arial, sans-serif" }}>

            {/* Cabeçalho institucional */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <img src="/logo-defesa-civil.jpg" alt="Logo"
                style={{ width: "72px", height: "72px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
              <div style={{ textAlign: "center", flex: 1, padding: "0 12px" }}>
                <div className="font-bold text-xs tracking-wide text-gray-700">PREFEITURA MUNICIPAL DE ORIXIMINÁ</div>
                <div className="font-bold text-xs tracking-wide text-gray-700">SECRETARIA MUNICIPAL DE SEGURANÇA PÚBLICA E DEFESA SOCIAL</div>
                <div className="font-bold text-xs tracking-wide text-gray-700">BRIGADA MUNICIPAL DE AGENTE DE PROTEÇÃO E DEFESA CIVIL</div>
                <div className="font-black text-lg tracking-wider underline mt-2">
                  ESCALA DE TRABALHO – MÊS DE {nomeMesAno(mesAno)}
                </div>
              </div>
              <img src="/logo-defesa-civil.jpg" alt="Logo"
                style={{ width: "72px", height: "72px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
            </div>

            {/* Tabela de escala */}
            <div className="overflow-x-auto">
              <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "10px", tableLayout: "fixed" }}>
                <thead>
                  <tr>
                    <th style={{ border: "1px solid #555", padding: "3px 4px", background: "#f3f4f6", textAlign: "left", width: "60px", fontWeight: "bold" }}>Dias</th>
                    {dias.map(d => (
                      <th key={d} style={{ border: "1px solid #555", padding: "2px 1px", background: "#f3f4f6", textAlign: "center", fontWeight: "bold", width: "22px" }}>{d}</th>
                    ))}
                  </tr>
                  <tr>
                    <th style={{ border: "1px solid #555", padding: "3px 4px", background: "#f9fafb", textAlign: "left", fontWeight: "bold" }}>Semana</th>
                    {dias.map(d => (
                      <th key={d} style={{ border: "1px solid #555", padding: "2px 1px", background: "#f9fafb", textAlign: "center", fontWeight: "bold", color: "#555" }}>
                        {semana(mesAno, d)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: "1px solid #555", padding: "4px", fontWeight: "bold", background: "#f9fafb", lineHeight: "1.2", fontSize: "9px" }}>
                      08:00<br />às<br />20:00
                    </td>
                    {turnosDia.map((eq, i) => (
                      <td key={i} style={{ border: "1px solid #555", textAlign: "center", fontWeight: "900", background: COR[eq].cel, color: COR[eq].txt, padding: "6px 2px" }}>
                        {eq}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td style={{ border: "1px solid #555", padding: "4px", fontWeight: "bold", background: "#f9fafb", lineHeight: "1.2", fontSize: "9px" }}>
                      20:00<br />às<br />08:00
                    </td>
                    {turnosNoite.map((eq, i) => (
                      <td key={i} style={{ border: "1px solid #555", textAlign: "center", fontWeight: "900", background: COR[eq].cel, color: COR[eq].txt, padding: "6px 2px" }}>
                        {eq}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Tabela de equipes */}
            <div className="mt-5">
              <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "10px" }}>
                <thead>
                  <tr>
                    <th colSpan={4} style={{ border: "1px solid #555", padding: "4px", textAlign: "center", background: "#f3f4f6", fontWeight: "bold", letterSpacing: "2px" }}>EQUIPES</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {LETRAS.map(l => {
                      const eq = equipes[l];
                      const isChefeMot = eq.motorBrigadista === eq.chefe;
                      return (
                        <td key={l} style={{ border: "1px solid #555", padding: "6px", verticalAlign: "top", width: "25%", position: "relative" }}>
                          <div style={{ background: COR[l].cel, color: COR[l].txt, textAlign: "center", fontWeight: "900", padding: "3px", marginBottom: "6px", letterSpacing: "1px" }}>
                            Equipe {eq.nome}
                          </div>
                          <div style={{ fontWeight: "bold", fontSize: "9px" }}>CHEFE {isChefeMot ? "E MOT." : ""} DE EQUIPE:</div>
                          <div style={{ fontWeight: "900", marginBottom: "3px" }}>{eq.chefe}</div>
                          {!isChefeMot && eq.motorBrigadista && (
                            <>
                              <div style={{ fontWeight: "bold", fontSize: "9px" }}>MT. BRIGADISTA:</div>
                              <div style={{ marginBottom: "3px" }}>{eq.motorBrigadista}</div>
                            </>
                          )}
                          {eq.brigadistas.map((b, i) => (
                            <div key={i}>
                              <div style={{ fontWeight: "bold", fontSize: "9px" }}>BRIGADISTA:</div>
                              <div>{b}</div>
                            </div>
                          ))}
                          <button onClick={() => abrirEq(l)}
                            className="no-print"
                            style={{ position: "absolute", top: "4px", right: "4px", background: "none", border: "none", cursor: "pointer", fontSize: "14px", opacity: 0.6 }}>
                            ✏️
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Férias + Assinatura */}
            <div className="mt-4 flex items-start justify-between gap-8" style={{ fontSize: "10px" }}>
              <div>
                {ferias && (
                  <>
                    <div style={{ fontWeight: "bold" }}>FÉRIAS</div>
                    <div>{ferias}</div>
                  </>
                )}
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: "900" }}>Cezar Adriano Pinheiro Nobre</div>
                <div style={{ fontWeight: "bold" }}>Chefe de divisão operacional</div>
                <div>Decreto 301/2025</div>
                <div style={{ color: "#6b7280", marginTop: "2px" }}>RUA 24 DE DEZEMBRO – SÃO JOSÉ OPERÁRIO</div>
                <div style={{ color: "#6b7280" }}>E-mail: brigadamunicipal2023@gmail.com</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal editar equipe */}
      {editEq && formEq && (
        <div className="no-print fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setEditEq(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ fontFamily: "system-ui" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-black text-white tracking-wider" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>
                EDITAR — EQUIPE {formEq.nome}
              </h3>
              <button onClick={() => setEditEq(null)} className="text-gray-500 hover:text-white text-xl">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 tracking-widest block mb-1.5">NOME DA EQUIPE</label>
                <input value={formEq.nome} onChange={e => setFormEq(f => ({ ...f, nome: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-orange-500 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400 tracking-widest block mb-1.5">CHEFE DE EQUIPE</label>
                <input value={formEq.chefe} onChange={e => setFormEq(f => ({ ...f, chefe: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-orange-500 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400 tracking-widest block mb-1.5">MOTORISTA/BRIGADISTA</label>
                <input value={formEq.motorBrigadista} onChange={e => setFormEq(f => ({ ...f, motorBrigadista: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-orange-500 text-sm" />
                <p className="text-xs text-gray-600 mt-1">Se igual ao Chefe, aparece como "Chefe e Mot. de Equipe"</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 tracking-widest block mb-1.5">BRIGADISTAS (um por linha)</label>
                <textarea
                  value={formEq.brigadistas.join("\n")}
                  onChange={e => setFormEq(f => ({ ...f, brigadistas: e.target.value.split("\n").filter(b => b.trim()) }))}
                  rows={4}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 outline-none focus:border-orange-500 text-sm resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditEq(null)}
                className="flex-1 py-3 rounded-xl font-bold tracking-wider text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 transition-all">
                CANCELAR
              </button>
              <button onClick={salvarEq}
                className="flex-1 py-3 rounded-xl font-bold tracking-wider text-sm bg-orange-500 hover:bg-orange-400 text-white transition-all">
                SALVAR
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
