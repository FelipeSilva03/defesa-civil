import { useState, useEffect } from "react";

export default function LandingPage({ onLogin }) {
  const [stats, setStats] = useState([
    { label: "Ocorrências em 2026", value: "..." },
    { label: "Famílias Assistidas", value: "..." },
    { label: "Agentes Ativos", value: "48" },
    { label: "Equipes Operacionais", value: "4" },
  ]);

  useEffect(() => {
    fetch("https://defesa-civil-production.up.railway.app/api/ocorrencias")
      .then(r => r.json())
      .then(data => {
        const total = data.ocorrencias ? data.ocorrencias.length : 0;
        setStats([
          { label: "Ocorrências em 2026", value: total.toLocaleString() },
          { label: "Famílias Assistidas", value: (total * 3).toLocaleString() },
          { label: "Agentes Ativos", value: "48" },
          { label: "Equipes Operacionais", value: "4" },
        ]);
      });
  }, []);

  const servicos = [
    { icon: "🔥", title: "Combate a Incêndio", desc: "Urbano e florestal com equipes especializadas" },
    { icon: "🚑", title: "Atendimento Pré-Hospitalar", desc: "Suporte a vítimas e apoio ao SAMU" },
    { icon: "🔍", title: "Busca e Salvamento", desc: "Pessoas, animais e desobstrução de vias" },
    { icon: "🌧️", title: "Defesa Civil", desc: "Resposta a desastres, alagamentos e vendavais" },
    { icon: "🌳", title: "Corte de Árvores de Risco", desc: "Supressão e poda de emergência" },
    { icon: "🐊", title: "Captura de Animais", desc: "Domésticos e silvestres com segurança" },
  ];

  return (
    <div style={{ fontFamily: "'Barlow Condensed', 'Oswald', sans-serif" }} className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-orange-500/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-xl font-black">DC</div>
            <div>
              <div className="font-bold text-sm tracking-wider text-orange-400">DEFESA CIVIL</div>
              <div className="text-xs text-gray-400 tracking-widest">ORIXIMINÁ — PA</div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm tracking-wider">
            <a href="#servicos" className="text-gray-400 hover:text-orange-400 transition-colors">SERVIÇOS</a>
            <a href="#sobre" className="text-gray-400 hover:text-orange-400 transition-colors">SOBRE</a>
            <a href="#contato" className="text-gray-400 hover:text-orange-400 transition-colors">CONTATO</a>
            <button onClick={onLogin}
              className="bg-orange-500 hover:bg-orange-400 text-white px-5 py-2 rounded-lg font-bold tracking-wider transition-all">
              SISTEMA → 
            </button>
          </nav>
          <button onClick={onLogin} className="md:hidden bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold">
            ENTRAR
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-gray-950 to-gray-900" />
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(251,146,60,0.3) 40px, rgba(251,146,60,0.3) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(251,146,60,0.3) 40px, rgba(251,146,60,0.3) 41px)" }} />
        <div className="relative max-w-7xl mx-auto px-4 py-24 md:py-36">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/40 rounded-full px-4 py-1 text-orange-400 text-xs tracking-widest mb-6">
              <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
              SISTEMA OPERACIONAL ATIVO — 2026
            </div>
            <h1 className="text-5xl md:text-7xl font-black leading-none mb-6 tracking-tight">
              PROTEÇÃO E<br/>
              <span className="text-orange-500">DEFESA CIVIL</span><br/>
              ORIXIMINÁ
            </h1>
            <p className="text-gray-400 text-lg md:text-xl max-w-xl mb-10 leading-relaxed" style={{ fontFamily: "system-ui" }}>
              Centro de operações integrado para monitoramento, registro e resposta a ocorrências emergenciais em todo o município.
            </p>
            <div className="flex flex-wrap gap-4">
              <button onClick={onLogin}
                className="bg-orange-500 hover:bg-orange-400 text-white px-8 py-4 rounded-xl font-bold text-lg tracking-wider transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-400/40">
                ACESSAR SISTEMA
              </button>
              <a href="https://docs.google.com/forms/d/e/1FAIpQLSfagyJfVIYB0IP2a8OMAFtttKGAzoORRI7Pdol_dXKP_FDzUw/viewform"
                target="_blank" rel="noopener noreferrer"
                className="border border-gray-600 hover:border-orange-500 text-gray-300 hover:text-orange-400 px-8 py-4 rounded-xl font-bold text-lg tracking-wider transition-all">
                REGISTRAR OCORRÊNCIA
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-orange-500 py-10">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl md:text-5xl font-black text-white">{s.value}</div>
              <div className="text-orange-100 text-sm mt-1 tracking-wider">{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Serviços */}
      <section id="servicos" className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <div className="text-orange-400 text-sm tracking-widest mb-3">NOSSA ATUAÇÃO</div>
          <h2 className="text-4xl md:text-5xl font-black">SERVIÇOS OPERACIONAIS</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicos.map((s, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 hover:border-orange-500/50 rounded-2xl p-6 transition-all hover:bg-gray-900/80 group">
              <div className="text-4xl mb-4">{s.icon}</div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-orange-400 transition-colors">{s.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed" style={{ fontFamily: "system-ui" }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sobre */}
      <section id="sobre" className="bg-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-orange-400 text-sm tracking-widest mb-3">QUEM SOMOS</div>
            <h2 className="text-4xl md:text-5xl font-black mb-6">AGENTES DE PROTEÇÃO E DEFESA CIVIL</h2>
            <p className="text-gray-400 leading-relaxed mb-4" style={{ fontFamily: "system-ui" }}>
              A Defesa Civil de Oriximiná atua 24 horas por dia na proteção da população municipal, 
              com equipes treinadas para responder a emergências de forma rápida e eficiente.
            </p>
            <p className="text-gray-400 leading-relaxed" style={{ fontFamily: "system-ui" }}>
              Nosso sistema de gerenciamento integrado permite o acompanhamento em tempo real de todas 
              as ocorrências registradas pelos agentes em campo, garantindo transparência e eficiência operacional.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: "🏅", title: "4 Equipes", sub: "ALFA, BRAVO, CHARLIE, DELTA" },
              { icon: "📍", title: "18 Bairros", sub: "Cobertura total do município" },
              { icon: "📋", title: "Registro Digital", sub: "Formulário integrado" },
              { icon: "📊", title: "Relatórios", sub: "Análise mensal e anual" },
            ].map((item, i) => (
              <div key={i} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="font-bold text-lg">{item.title}</div>
                <div className="text-gray-400 text-xs mt-1">{item.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contato" className="py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="text-4xl mb-4">🆘</div>
          <h2 className="text-4xl font-black mb-4">EMERGÊNCIA?</h2>
          <p className="text-gray-400 mb-8" style={{ fontFamily: "system-ui" }}>
            Em caso de emergência, ligue imediatamente para o número do Corpo de Bombeiros
          </p>
          <div className="text-6xl font-black text-orange-500 mb-6">193</div>
          <a href="https://docs.google.com/forms/d/e/1FAIpQLSfagyJfVIYB0IP2a8OMAFtttKGAzoORRI7Pdol_dXKP_FDzUw/viewform"
            target="_blank" rel="noopener noreferrer"
            className="inline-block border border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white px-8 py-4 rounded-xl font-bold tracking-wider transition-all">
            FORMULÁRIO DE OCORRÊNCIA →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-sm font-black">DC</div>
            <span className="text-gray-400 text-sm">Defesa Civil — Oriximiná/PA — 2026</span>
          </div>
          <div className="text-gray-600 text-xs">Sistema de Gerenciamento de Ocorrências v1.0</div>
        </div>
      </footer>
    </div>
  );
}
