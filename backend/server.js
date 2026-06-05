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
const SHEET_RANGE = process.env.SHEET_RANGE || "Respostas ao formulário 1!A:AZ";

function getCredentials() {
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    return JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS_JSON, "base64").toString("utf8"));
  }
  return JSON.parse(readFileSync(join(__dirname, "credentials.json"), "utf8"));
}

function getAuthClient() {
  return new google.auth.GoogleAuth({
    credentials: getCredentials(),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

function getAuthClientRW() {
  return new google.auth.GoogleAuth({
    credentials: getCredentials(),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

// Google Forms registra horários em Brasília (UTC-3); sem o fuso explícito
// o Node.js trataria como UTC, exibindo 3h a menos no frontend.
function parseDataHora(str) {
  if (!str) return new Date().toISOString();
  // Já tem fuso informado — usar direto
  if (/[Z+\-]\d{2}:?\d{2}$/.test(str) || str.endsWith("Z")) return new Date(str).toISOString();
  // Formato ISO sem fuso: "2026-06-04" ou "2026-06-04T14:55"
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return new Date(str + (str.includes("T") ? "-03:00" : "T00:00:00-03:00")).toISOString();
  // Formato Google Forms: "04/06/2026 14:55:31" — tratar como Brasília (UTC-3)
  const m = str.match(/(\d{2})\/(\d{2})\/(\d{4})[,\s]+(\d{2}:\d{2}(?::\d{2})?)/);
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}T${m[4]}-03:00`).toISOString();
  const fallback = new Date(str);
  return isNaN(fallback) ? new Date().toISOString() : fallback.toISOString();
}

function horaLocal(isoStr) {
  return new Date(isoStr).toLocaleTimeString("pt-BR", {
    hour: "2-digit", minute: "2-digit", timeZone: "America/Belem",
  });
}

function normalizarStatus(s) {
  if (!s) return "Finalizado";
  if (/finaliz|concluíd|encerrad/i.test(s)) return "Finalizado";
  if (/atend|andament/i.test(s)) return "Em Atendimento";
  if (/cancel|trote/i.test(s)) return "Cancelado";
  return "Finalizado";
}

function driveUrlParaImagem(url) {
  if (!url) return null;
  let id = url.match(/[?&]id=([^&]+)/)?.[1];
  if (!id) id = url.match(/\/d\/([^/]+)/)?.[1];
  if (!id) return null;
  return `https://lh3.googleusercontent.com/d/${id}`;
}

function extrairFotos(headers, obj) {
  const fotos = [];
  headers.forEach(h => {
    const key = h.trim();
    const val = obj[key] || "";
    if (!val) return;
    if (/foto|imagem|image|upload|arquivo|anexo|picture/i.test(key)) {
      val.split(",").forEach(link => {
        const img = driveUrlParaImagem(link.trim());
        if (img) fotos.push(img);
      });
    }
    if (/drive\.google\.com/i.test(val) && !/foto|imagem/i.test(key)) {
      val.split(",").forEach(link => {
        const img = driveUrlParaImagem(link.trim());
        if (img && !fotos.includes(img)) fotos.push(img);
      });
    }
  });
  return fotos;
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
    fotos: extrairFotos(headers, obj),
    lat: null,
    lng: null,
    historico: [
      {
        status: "Registrado",
        hora: horaLocal(dataHoraRegistro),
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

// ─── AGENTES ─────────────────────────────────────────────────────────────────

const AGENTES_COLS = ["num","nome","cpf","contato","nascimento","cargo","registros"];

app.get("/api/agentes", async (_req, res) => {
  try {
    const sheets = google.sheets({ version: "v4", auth: getAuthClientRW() });
    await ensureSheetExists(sheets, "Agentes", AGENTES_COLS);
    const r = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: "Agentes!A:G" });
    const rows = r.data.values || [];
    if (rows.length < 2) return res.json({ agentes: [] });
    const headers = rows[0];
    const agentes = rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i] || ""; });
      try { obj.registros = JSON.parse(obj.registros || "[]"); } catch { obj.registros = []; }
      return obj;
    });
    res.json({ agentes });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.post("/api/agentes", async (req, res) => {
  try {
    const sheets = google.sheets({ version: "v4", auth: getAuthClientRW() });
    await ensureSheetExists(sheets, "Agentes", AGENTES_COLS);
    const { agentes } = req.body;
    await sheets.spreadsheets.values.clear({ spreadsheetId: SPREADSHEET_ID, range: "Agentes!A:Z" });
    const values = [AGENTES_COLS, ...(agentes || []).map(a => AGENTES_COLS.map(c => {
      if (c === "registros") return JSON.stringify(a.registros || []);
      return a[c] ?? "";
    }))];
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID, range: "Agentes!A1",
      valueInputOption: "RAW", requestBody: { values },
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ─── OFÍCIOS ─────────────────────────────────────────────────────────────────

const OFICIOS_COLS = ["id","numero","dataRecebimento","origem","assunto","descricao","status","responsavel","observacoes"];
const ARVORES_COLS = ["id","numero","dataSolicitacao","solicitante","contato","bairro","endereco","tipo","descricao","equipe","status","dataAtendimento","observacoes"];

async function ensureSheetExists(sheets, sheetName, cols) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const existe = meta.data.sheets.some(s => s.properties.title === sheetName);
  if (!existe) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: sheetName } } }] },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [cols] },
    });
  }
}

app.get("/api/oficios", async (_req, res) => {
  try {
    const sheets = google.sheets({ version: "v4", auth: getAuthClientRW() });
    await ensureSheetExists(sheets, "Ofícios", OFICIOS_COLS);
    const r = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: "Ofícios!A:I" });
    const rows = r.data.values || [];
    if (rows.length < 2) return res.json({ oficios: [] });
    const headers = rows[0];
    const oficios = rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i] || ""; });
      return obj;
    });
    res.json({ oficios });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.post("/api/oficios", async (req, res) => {
  try {
    const sheets = google.sheets({ version: "v4", auth: getAuthClientRW() });
    await ensureSheetExists(sheets, "Ofícios", OFICIOS_COLS);
    const { oficios } = req.body;
    await sheets.spreadsheets.values.clear({ spreadsheetId: SPREADSHEET_ID, range: "Ofícios!A:Z" });
    const values = [OFICIOS_COLS, ...(oficios || []).map(o => OFICIOS_COLS.map(c => o[c] ?? ""))];
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID, range: "Ofícios!A1",
      valueInputOption: "RAW", requestBody: { values },
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ─── ÁRVORES ─────────────────────────────────────────────────────────────────

app.get("/api/arvores", async (_req, res) => {
  try {
    const sheets = google.sheets({ version: "v4", auth: getAuthClientRW() });
    await ensureSheetExists(sheets, "Árvores", ARVORES_COLS);
    const r = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: "Árvores!A:M" });
    const rows = r.data.values || [];
    if (rows.length < 2) return res.json({ arvores: [] });
    const headers = rows[0];
    const arvores = rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i] || ""; });
      return obj;
    });
    res.json({ arvores });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.post("/api/arvores", async (req, res) => {
  try {
    const sheets = google.sheets({ version: "v4", auth: getAuthClientRW() });
    await ensureSheetExists(sheets, "Árvores", ARVORES_COLS);
    const { arvores } = req.body;
    await sheets.spreadsheets.values.clear({ spreadsheetId: SPREADSHEET_ID, range: "Árvores!A:Z" });
    const values = [ARVORES_COLS, ...(arvores || []).map(o => ARVORES_COLS.map(c => o[c] ?? ""))];
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID, range: "Árvores!A1",
      valueInputOption: "RAW", requestBody: { values },
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ─── ESCALAS ─────────────────────────────────────────────────────────────────

const ESCALAS_COLS = ["mesAno", "inicioDia", "equipes", "ferias"];

async function lerEscalas(sheets) {
  await ensureSheetExists(sheets, "Escalas", ESCALAS_COLS);
  const r = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: "Escalas!A:D" });
  const rows = r.data.values || [];
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] || ""; });
    return obj;
  });
}

app.get("/api/escalas", async (req, res) => {
  const mes = req.query.mes;
  try {
    const sheets = google.sheets({ version: "v4", auth: getAuthClientRW() });
    const todas = await lerEscalas(sheets);
    const escala = mes ? todas.find(e => e.mesAno === mes) : null;
    res.json({ escala: escala || null });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.post("/api/escalas", async (req, res) => {
  const { escala } = req.body;
  try {
    const sheets = google.sheets({ version: "v4", auth: getAuthClientRW() });
    const todas = await lerEscalas(sheets);
    const idx = todas.findIndex(e => e.mesAno === escala.mesAno);
    if (idx >= 0) { todas[idx] = escala; } else { todas.push(escala); }
    await sheets.spreadsheets.values.clear({ spreadsheetId: SPREADSHEET_ID, range: "Escalas!A:Z" });
    const values = [ESCALAS_COLS, ...todas.map(e => ESCALAS_COLS.map(c => e[c] ?? ""))];
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID, range: "Escalas!A1",
      valueInputOption: "RAW", requestBody: { values },
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n✅ Servidor Defesa Civil rodando na porta ${PORT}`);
  console.log(`   Planilha : ${SPREADSHEET_ID}`);
  console.log(`   Aba      : ${SHEET_RANGE}`);
  console.log(`   Debug    : http://localhost:${PORT}/api/debug-headers\n`);
});
