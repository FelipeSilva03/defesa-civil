# 🚒 Sistema de Gerenciamento de Ocorrências — Defesa Civil Oriximiná/PA

## Visão Geral

Sistema completo para centralizar, visualizar e gerenciar todas as ocorrências registradas pelos agentes em campo via Google Forms.

---

## 📁 Estrutura do Projeto

```
defesa-civil-sistema/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── TUTORIAL.md
├── src/
│   ├── main.jsx              ← Entrada React
│   ├── App.jsx               ← Roteamento principal
│   ├── index.css             ← Estilos globais
│   ├── components/
│   │   ├── LandingPage.jsx   ← Página institucional pública
│   │   ├── Login.jsx         ← Tela de login (3 perfis)
│   │   ├── Sidebar.jsx       ← Menu lateral
│   │   ├── Topbar.jsx        ← Barra superior
│   │   ├── Dashboard.jsx     ← Painel com gráficos
│   │   ├── Ocorrencias.jsx   ← Lista + filtros + busca
│   │   ├── OcorrenciaDetalhe.jsx ← Detalhe + mapa + histórico
│   │   └── Relatorios.jsx    ← Relatórios + exportação
│   └── data/
│       └── mockData.js       ← Dados de exemplo baseados no seu formulário
└── backend/
    ├── server.js             ← Node.js + Express + Google Sheets API
    ├── package.json
    └── .env.example
```

---

## 🚀 Instalação Local (Frontend)

### Pré-requisitos
- Node.js 18+ instalado
- npm ou yarn

### Passo a passo

```bash
# 1. Entre na pasta do projeto
cd defesa-civil-sistema

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento
npm run dev

# 4. Acesse no navegador
# http://localhost:5173
```

### Credenciais de acesso (demo)

| Perfil        | Email                          | Senha      |
|--------------|-------------------------------|-----------|
| Administrador | admin@defesacivil.gov.br      | admin123  |
| Coordenador   | coord@defesacivil.gov.br      | coord123  |
| Agente        | agente@defesacivil.gov.br     | agente123 |

---

## 🔗 Integrando com o Google Forms

### Passo 1 — Vincule o Forms a uma Planilha

1. Abra seu Google Forms
2. Clique na aba **"Respostas"**
3. Clique no ícone verde do Google Sheets (criar planilha)
4. Uma planilha será criada automaticamente com todas as respostas

### Passo 2 — Configure a API do Google

1. Acesse: https://console.cloud.google.com
2. Crie um projeto (ex: `defesa-civil-orx`)
3. Ative a **Google Sheets API**
4. Crie uma **Conta de Serviço** (Service Account)
5. Baixe o arquivo `credentials.json`
6. Copie o `credentials.json` para a pasta `backend/`

### Passo 3 — Compartilhe a planilha

1. Abra a planilha de respostas do Forms
2. Clique em **Compartilhar**
3. Adicione o email da sua conta de serviço (termina em `@...iam.gserviceaccount.com`)
4. Dê permissão de **Leitor**

### Passo 4 — Configure o .env

```bash
# backend/.env
GOOGLE_SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
PORT=3001
```

O ID da planilha está na URL:
`https://docs.google.com/spreadsheets/d/SEU_ID_AQUI/edit`

### Passo 5 — Inicie o backend

```bash
cd backend
npm install
npm run dev
```

### Passo 6 — Conecte o frontend ao backend

No arquivo `src/App.jsx`, substitua os dados mock pela chamada à API:

```javascript
// Dentro de um useEffect, no App.jsx:
useEffect(() => {
  fetch("http://localhost:3001/api/ocorrencias")
    .then(r => r.json())
    .then(data => setOcorrencias(data.ocorrencias));
}, []);
```

---

## ☁️ Publicando Online (Vercel)

### Frontend no Vercel

```bash
# 1. Instale o Vercel CLI
npm install -g vercel

# 2. Faça login
vercel login

# 3. Deploy
vercel --prod

# Ou conecte direto pelo GitHub:
# vercel.com → New Project → Import Git Repository
```

### Backend no Vercel (Serverless)

Crie o arquivo `api/ocorrencias.js` na raiz:

```javascript
// api/ocorrencias.js — Vercel Serverless Function
export default async function handler(req, res) {
  // Cole aqui a lógica do backend/server.js
  res.json({ ocorrencias: [] });
}
```

### Backend no Railway (alternativa gratuita)

1. Acesse: https://railway.app
2. New Project → Deploy from GitHub
3. Selecione a pasta `backend/`
4. Configure as variáveis de ambiente no painel
5. Deploy automático!

---

## 📱 Sistema Mobile

O sistema é totalmente responsivo. Para instalar como app no celular:

1. Acesse a URL do sistema no celular
2. No Chrome: Menu → "Adicionar à tela inicial"
3. No Safari (iOS): Compartilhar → "Adicionar à tela de início"

---

## 🔄 Atualizações em Tempo Real

Para receber novas ocorrências automaticamente, adicione no `App.jsx`:

```javascript
useEffect(() => {
  const interval = setInterval(() => {
    fetch("/api/ocorrencias")
      .then(r => r.json())
      .then(data => setOcorrencias(data.ocorrencias));
  }, 30000); // Atualiza a cada 30 segundos
  return () => clearInterval(interval);
}, []);
```

---

## 📊 Exportação Excel

Para gerar `.xlsx` verdadeiro (além do CSV), instale:

```bash
npm install xlsx
```

```javascript
import * as XLSX from 'xlsx';

const exportarExcel = (dados) => {
  const ws = XLSX.utils.json_to_sheet(dados);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Ocorrências");
  XLSX.writeFile(wb, "ocorrencias_defesa_civil.xlsx");
};
```

---

## 🔒 Autenticação com Firebase (Opcional)

Para autenticação real em produção:

```bash
npm install firebase
```

```javascript
// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

---

## 📞 Suporte

Sistema desenvolvido para a Defesa Civil de Oriximiná/PA.

- Formulário de ocorrências: https://docs.google.com/forms/d/e/1FAIpQLSfagyJfVIYB0IP2a8OMAFtttKGAzoORRI7Pdol_dXKP_FDzUw/viewform
- Emergências: **193**

