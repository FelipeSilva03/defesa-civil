import { useState } from "react";
import { agentes as agentesIniciais } from "../data/mockData";

const CARGOS = [
  "Agente de Proteção e Defesa Civil",
  "Chefe de Divisão Operacional",
  "Coordenador",
  "Supervisor",
];

const VAZIO = { num: "", nome: "", cpf: "", contato: "", nascimento: "", cargo: "Agente de Proteção e Defesa Civil" };

function carregarAgentes() {
  try {
    const salvo = localStorage.getItem("dc_agentes");
    return salvo ? JSON.parse(salvo) : agentesIniciais;
  } catch { return agentesIniciais; }
}

function salvarAgentes(lista) {
  localStorage.setItem("dc_agentes", JSON.stringify(lista));
}

export default function Agentes() {
  const [agentes, setAgentes] = useState(carregarAgentes);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null); // índice ou null
  const [form, setForm] = useState(VAZIO);

  const atualizar = (lista) => { setAgentes(lista); salvarAgentes(lista); };

  const abrirNovo = () => {
    const proximoNum = String(agentes.length + 1).padStart(2, "0");
    setForm({ ...VAZIO, num: proximoNum });
    setEditando(null);
    setModalAberto(true);
  };

  const abrirEditar = (i) => {
    setForm({ ...agentes[i] });
    setEditando(i);
    setModalAberto(true);
  };

  const salvar = () => {
    if (!form.nome) return;
    if (editando !== null) {
      const nova = agentes.map((a, i) => i === editando ? { ...form } : a);
      atualizar(nova);
    } else {
      atualizar([...agentes, { ...form }]);
    }
    setModalAberto(false);
  };

  const excluir = (i) => {
    if (!confirm(`Excluir ${agentes[i].nome}?`)) return;
    atualizar(agentes.filter((_, idx) => idx !== i));
  };

  const filtrados = agentes.filter(a =>
    a.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    (a.contato && a.contato.includes(busca)) ||
    (a.cpf && a.cpf.includes(busca))
  );

  const chefe = agentes.find(a => a.cargo === "Chefe de Divisão Operacional");
  const semDados = agentes.filter(a => !a.cpf || !a.contato).length;

  const inp = (key, placeholder, type = "text") => (
    <input type={type} value={form[key] || ""} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
      placeholder={placeholder}
      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 outline-none focus:border-orange-500 text-sm" />
  );

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
        <button onClick={abrirNovo}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-5 py-2.5 rounded-xl font-bold text-sm tracking-wider transition-all">
          + NOVO AGENTE
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-orange-500/30 bg-orange-500/5 rounded-2xl p-5">
          <div className="text-4xl font-black text-white">{agentes.length}</div>
          <div className="text-xs text-gray-400 tracking-wider mt-1">TOTAL DE AGENTES</div>
        </div>
        <div className="bg-gray-900 border border-green-500/30 bg-green-500/5 rounded-2xl p-5">
          <div className="text-4xl font-black text-white">{agentes.length - semDados}</div>
          <div className="text-xs text-gray-400 tracking-wider mt-1">CADASTROS COMPLETOS</div>
        </div>
        <div className="bg-gray-900 border border-yellow-500/30 bg-yellow-500/5 rounded-2xl p-5">
          <div className="text-4xl font-black text-white">{semDados}</div>
          <div className="text-xs text-gray-400 tracking-wider mt-1">DADOS INCOMPLETOS</div>
        </div>
      </div>

      {/* Chefe */}
      {chefe && (
        <div className="bg-gray-900 border border-orange-500/40 rounded-2xl p-5 flex items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black text-2xl flex-shrink-0">
              {chefe.nome.charAt(0)}
            </div>
            <div>
              <div className="text-xs text-orange-400 tracking-widest mb-1">CHEFIA</div>
              <div className="text-white font-black text-xl tracking-wide">{chefe.nome}</div>
              <div className="text-gray-400 text-sm" style={{ fontFamily: "system-ui" }}>{chefe.cargo}</div>
              {chefe.contato && <div className="text-gray-500 text-xs mt-1" style={{ fontFamily: "system-ui" }}>📞 {chefe.contato}</div>}
            </div>
          </div>
          <button onClick={() => abrirEditar(agentes.indexOf(chefe))}
            className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-all flex-shrink-0">✏️</button>
        </div>
      )}

      {/* Busca */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
        <input type="text" value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nome, CPF ou telefone..."
          className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-600 outline-none focus:border-orange-500/50 text-sm"
          style={{ fontFamily: "system-ui" }} />
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
              <th className="px-4 py-3 text-xs text-gray-500 tracking-widest w-20">AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((a) => {
              const idx = agentes.indexOf(a);
              const isChefe = a.cargo === "Chefe de Divisão Operacional";
              return (
                <tr key={idx} className={`border-b border-gray-800/50 transition-colors hover:bg-gray-800/40 ${isChefe ? "bg-orange-500/5" : ""}`}>
                  <td className="px-4 py-3 text-gray-500 font-mono text-sm">{a.num}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0 ${isChefe ? "bg-orange-500 text-white" : "bg-gray-800 text-gray-400"}`}>
                        {a.nome?.charAt(0)}
                      </div>
                      <div>
                        <div className="text-white font-bold text-sm">{a.nome}</div>
                        {isChefe && <div className="text-orange-400 text-xs tracking-wider">CHEFIA</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-gray-400 font-mono text-xs" style={{ fontFamily: "system-ui" }}>{a.cpf || <span className="text-gray-700">—</span>}</span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-gray-300 text-sm" style={{ fontFamily: "system-ui" }}>{a.contato || <span className="text-gray-700">—</span>}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-gray-400 text-sm" style={{ fontFamily: "system-ui" }}>{a.nascimento || <span className="text-gray-700">—</span>}</span>
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <span className="text-gray-400 text-xs" style={{ fontFamily: "system-ui" }}>{a.cargo}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => abrirEditar(idx)} className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700 rounded-lg transition-all" title="Editar">✏️</button>
                      <button onClick={() => excluir(idx)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Excluir">🗑️</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-600" style={{ fontFamily: "system-ui" }}>
                  Nenhum agente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-gray-600 text-xs text-right" style={{ fontFamily: "system-ui" }}>
        Secretaria Municipal de Segurança Pública e Defesa Social — Oriximiná/PA · {agentes.length} agentes cadastrados
      </div>

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setModalAberto(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ fontFamily: "system-ui" }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-white tracking-wider" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                {editando !== null ? "EDITAR AGENTE" : "NOVO AGENTE"}
              </h3>
              <button onClick={() => setModalAberto(false)} className="text-gray-500 hover:text-white text-xl">✕</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 tracking-widest block mb-1.5">N° NA LISTA</label>
                  {inp("num", "Ex: 19")}
                </div>
                <div>
                  <label className="text-xs text-gray-400 tracking-widest block mb-1.5">DATA DE NASC.</label>
                  {inp("nascimento", "DD/MM/AAAA")}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 tracking-widest block mb-1.5">NOME COMPLETO *</label>
                {inp("nome", "Nome completo do agente")}
              </div>

              <div>
                <label className="text-xs text-gray-400 tracking-widest block mb-1.5">CPF</label>
                {inp("cpf", "000.000.000-00")}
              </div>

              <div>
                <label className="text-xs text-gray-400 tracking-widest block mb-1.5">CONTATO</label>
                {inp("contato", "(93) 9xxxx-xxxx")}
              </div>

              <div>
                <label className="text-xs text-gray-400 tracking-widest block mb-1.5">CARGO</label>
                <select value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-orange-500 text-sm">
                  {CARGOS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalAberto(false)}
                className="flex-1 py-3 rounded-xl font-bold tracking-wider text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 transition-all">
                CANCELAR
              </button>
              <button onClick={salvar} disabled={!form.nome}
                className="flex-1 py-3 rounded-xl font-bold tracking-wider text-sm bg-orange-500 hover:bg-orange-400 disabled:bg-gray-700 disabled:text-gray-500 text-white transition-all">
                {editando !== null ? "SALVAR" : "CADASTRAR"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
