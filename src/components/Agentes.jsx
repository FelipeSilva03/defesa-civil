import { useState } from "react";
import { agentes } from "../data/mockData";

export default function Agentes() {
  const [busca, setBusca] = useState("");

  const filtrados = agentes.filter(a =>
    a.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (a.contato && a.contato.includes(busca)) ||
    (a.cpf && a.cpf.includes(busca))
  );

  const chefe = agentes.find(a => a.cargo === "Chefe de Divisão Operacional");
  const total = agentes.length;
  const semDados = agentes.filter(a => !a.cpf || !a.contato).length;

  return (
    <div className="space-y-6" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-wider">AGENTES</h2>
          <p className="text-gray-500 text-sm" style={{ fontFamily: "system-ui" }}>
            Brigada de Incêndio — Defesa Civil Oriximiná/PA
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-xl font-bold text-sm tracking-wider transition-all"
        >
          🖨️ IMPRIMIR
        </button>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-orange-500/30 bg-orange-500/5 rounded-2xl p-5">
          <div className="text-4xl font-black text-white">{total}</div>
          <div className="text-xs text-gray-400 tracking-wider mt-1">TOTAL DE AGENTES</div>
        </div>
        <div className="bg-gray-900 border border-green-500/30 bg-green-500/5 rounded-2xl p-5">
          <div className="text-4xl font-black text-white">{total - semDados}</div>
          <div className="text-xs text-gray-400 tracking-wider mt-1">CADASTROS COMPLETOS</div>
        </div>
        <div className="bg-gray-900 border border-yellow-500/30 bg-yellow-500/5 rounded-2xl p-5">
          <div className="text-4xl font-black text-white">{semDados}</div>
          <div className="text-xs text-gray-400 tracking-wider mt-1">DADOS INCOMPLETOS</div>
        </div>
      </div>

      {/* Chefe */}
      {chefe && (
        <div className="bg-gray-900 border border-orange-500/40 rounded-2xl p-5 flex items-center gap-5">
          <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black text-2xl flex-shrink-0">
            {chefe.nome.charAt(0)}
          </div>
          <div>
            <div className="text-xs text-orange-400 tracking-widest mb-1">CHEFIA</div>
            <div className="text-white font-black text-xl tracking-wide">{chefe.nome}</div>
            <div className="text-gray-400 text-sm" style={{ fontFamily: "system-ui" }}>{chefe.cargo}</div>
            {chefe.contato && (
              <div className="text-gray-500 text-xs mt-1" style={{ fontFamily: "system-ui" }}>
                📞 {chefe.contato}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Busca */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
        <input
          type="text"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nome, CPF ou telefone..."
          className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-600 outline-none focus:border-orange-500/50 text-sm"
          style={{ fontFamily: "system-ui" }}
        />
      </div>

      {/* Tabela */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="px-4 py-3 text-left text-xs text-gray-500 tracking-widest">N°</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 tracking-widest">NOME</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 tracking-widest hidden md:table-cell">CPF</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 tracking-widest hidden sm:table-cell">CONTATO</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 tracking-widest hidden lg:table-cell">NASCIMENTO</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 tracking-widest hidden xl:table-cell">CARGO</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((a, i) => (
              <tr
                key={a.num}
                className={`border-b border-gray-800/50 transition-colors hover:bg-gray-800/40 ${
                  a.cargo === "Chefe de Divisão Operacional" ? "bg-orange-500/5" : ""
                }`}
              >
                <td className="px-4 py-3 text-gray-500 font-mono text-sm">{a.num}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0 ${
                      a.cargo === "Chefe de Divisão Operacional"
                        ? "bg-orange-500 text-white"
                        : "bg-gray-800 text-gray-400"
                    }`}>
                      {a.nome.charAt(0)}
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm">{a.nome}</div>
                      {a.cargo === "Chefe de Divisão Operacional" && (
                        <div className="text-orange-400 text-xs tracking-wider">CHEFIA</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-gray-400 font-mono text-xs" style={{ fontFamily: "system-ui" }}>
                    {a.cpf || <span className="text-gray-700">—</span>}
                  </span>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="text-gray-300 text-sm" style={{ fontFamily: "system-ui" }}>
                    {a.contato || <span className="text-gray-700">—</span>}
                  </span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="text-gray-400 text-sm" style={{ fontFamily: "system-ui" }}>
                    {a.nascimento || <span className="text-gray-700">—</span>}
                  </span>
                </td>
                <td className="px-4 py-3 hidden xl:table-cell">
                  <span className="text-gray-400 text-xs" style={{ fontFamily: "system-ui" }}>
                    {a.cargo}
                  </span>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-600" style={{ fontFamily: "system-ui" }}>
                  Nenhum agente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-gray-600 text-xs text-right" style={{ fontFamily: "system-ui" }}>
        Secretaria Municipal de Segurança Pública e Defesa Social — Oriximiná/PA · {total} agentes cadastrados
      </div>
    </div>
  );
}
