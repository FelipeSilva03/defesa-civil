import express from "express";
import cors from "cors";
import { google } from "googleapis";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_RANGE = process.env.SHEET_RANGE || "Respostas ao formulário 1!A:Z";

function getAuthClient() {
  let credentials;
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    credentials = JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS_JSON, "base64").toString("utf8"));
  } else {
    credentials = JSON.parse(readFileSync(join(__dirname, "credentials.json"), "utf8"));
  }
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

function parseDataHora(str) {
  if (!str) return new Date().toISOString();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return new Date(str).toISOString();
  // Formato Google Forms: "18/01/2026 17:43:31"
  const m = str.match(/(\d{2})\/(\d{2})\/(\d{4})[,\s]+(\d{2}:\d{2}(?::\d{2})?)/);
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}T${m[4]}`).toISOString();
  const fallback = new Date(str);
  return isNaN(fallback) ? new Date().toISOString() : fallback.toISOString();
}

function normalizarStatus(s) {
  if (!s) return "Aguardando";
  if (/finaliz|concluíd|encerrad/i.test(s)) return "Finalizado";
  if (/atend|andament/i.test(s)) return "Em Atendimento";
  if (/cancel|trote/i.test(s)) return "Cancelado";
  return "Aguardando";
}

// Colunas exatas do Google Forms (com trim para remover espaços)
function transformarLinha(headers, row) {
  const obj = {};
  headers.forEach((h, j) => { obj[h.trim()] = (row[j] || "").trim(); });

  const get = (nome) => obj[nome] || "";

  // "Identificação da Ocorrência" é quando ocorreu; "Carimbo" é quando foi registrado
  const dataOcorrencia  = get("Identificação da Ocorrência");
  const dataRegistro    = get("Carimbo de data/hora");
  const dataHora        = parseDataHora(dataOcorrencia || dataRegistro);
  const dataHoraRegistro = parseDataHora(dataRegistro);

  const equipeRaw = get("Atendentes/Equipe");
  const equipe = equipeRaw.toUpperCase().replace(/^(EQUIPE\s+)/i, "").trim() || equipeRaw;

  const statusRaw = get("Status") || "";
  const status = normalizarStatus(statusRaw);

  const arp = get("Anotações de Responsabilidade Profissional");

  return {
    dataHora,
    solicitante: get("Dados do Solicitante"),
    bairro:      get("Bairro da Ocorrência"),
    endereco:    get("Endereço e Perímetro"),
    equipe,
    status,
    categorias: {
      combateIncendioUrbano:    get("Combate a Incêndio - Urbano")    || null,
      combateIncendioFlorestal: get("Combate a Incêndio - Florestal") || null,
      atendimentoPreHospitalar: get("Atendimento Pré Hospitalar")     || null,
      buscaSalvamento:          get("Busca e Salvamento")             || null,
      capturaAnimal:            get("Capturas de Animal")             || null,
      corteArvore:              get("Corte de Árvore de Risco")       || null,
      remocaoCadaver:           get("Remoção de Cadáver")             || null,
      apoioEventos:             get("Apoio a Eventos")                || null,
      defesaCivil:              get("Defesa Civil")                   || null,
      outros:                   get("Outros")                         || null,
    },
    descricao: get("Descrição da Ocorrência"),
    arp,
    email: get("Endereço de e-mail"),
    fotos: [],
    lat: null,
    lng: null,
    historico: [
      {
        status: "Registrado",
        hora: dataHoraRegistro.substring(11, 16),
        agente: arp || "Google Forms",
      },
    ],
  };
}

// ─── ROTAS ───────────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "ok", sistema: "Defesa Civil Oriximiná", versao: "1.0.0" });
});

// Diagnóstico: mostra colunas e primeiro exemplo
app.get("/api/debug-headers", async (_req, res) => {
  try {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: "v4", auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: SHEET_RANGE,
    });
    const rows = response.data.values || [];
    res.json({
      headers: rows[0] || [],
      exemplo: rows[1] || [],
      total_respostas: Math.max(0, rows.length - 1),
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// Rota principal
app.get("/api/ocorrencias", async (_req, res) => {
  try {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: "v4", auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: SHEET_RANGE,
    });

    const rows = response.data.values || [];
    if (rows.length < 2) return res.json({ ocorrencias: [], total: 0 });

    const headers = rows[0];

    const ocorrencias = rows
      .slice(1)
      .filter(row => row.some(c => c && c.trim()))
      .map((row, i) => {
        const oc = transformarLinha(headers, row);
        const ano = new Date(oc.dataHora).getFullYear();
        oc.id = `OC-${ano}-${String(i + 1).padStart(3, "0")}`;
        return oc;
      })
      .reverse(); // mais recentes primeiro

    res.json({ ocorrencias, total: ocorrencias.length });
  } catch (error) {
    console.error("Erro ao buscar ocorrências:", error.message);
    res.status(500).json({ erro: "Falha ao conectar com Google Sheets", detalhe: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n✅ Servidor Defesa Civil rodando na porta ${PORT}`);
  console.log(`   Planilha : ${SPREADSHEET_ID}`);
  console.log(`   Aba      : ${SHEET_RANGE}`);
  console.log(`   Debug    : http://localhost:${PORT}/api/debug-headers\n`);
});
