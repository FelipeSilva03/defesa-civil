import { google } from "googleapis";

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_RANGE = process.env.SHEET_RANGE || "Respostas ao formulário 1!A:AZ";

function getAuthClient() {
  const credentials = JSON.parse(
    Buffer.from(process.env.GOOGLE_CREDENTIALS_JSON, "base64").toString("utf8")
  );
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

function parseDataHora(str) {
  if (!str) return new Date().toISOString();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return new Date(str).toISOString();
  const m = str.match(/(\d{2})\/(\d{2})\/(\d{4})[,\s]+(\d{2}:\d{2}(?::\d{2})?)/);
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}T${m[4]}`).toISOString();
  const fallback = new Date(str);
  return isNaN(fallback) ? new Date().toISOString() : fallback.toISOString();
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
  // Formato: https://drive.google.com/open?id=FILE_ID
  let id = url.match(/[?&]id=([^&]+)/)?.[1];
  // Formato: https://drive.google.com/file/d/FILE_ID/view
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
      // pode ter múltiplos links separados por vírgula
      val.split(",").forEach(link => {
        const img = driveUrlParaImagem(link.trim());
        if (img) fotos.push(img);
      });
    }
    // também captura qualquer célula que contenha link do drive
    if (/drive\.google\.com/i.test(val) && !/foto|imagem/i.test(key)) {
      val.split(",").forEach(link => {
        const img = driveUrlParaImagem(link.trim());
        if (img && !fotos.includes(img)) fotos.push(img);
      });
    }
  });
  return fotos;
}

function transformarLinha(headers, row) {
  const obj = {};
  headers.forEach((h, j) => { obj[h.trim()] = (row[j] || "").trim(); });
  const get = (nome) => obj[nome] || "";

  const dataOcorrencia = get("Identificação da Ocorrência");
  const dataRegistro   = get("Carimbo de data/hora");
  const dataHora       = parseDataHora(dataOcorrencia || dataRegistro);
  const dataHoraReg    = parseDataHora(dataRegistro);

  const equipeRaw = get("Atendentes/Equipe");
  const equipe = equipeRaw.toUpperCase().replace(/^(EQUIPE\s+)/i, "").trim() || equipeRaw;

  return {
    dataHora,
    solicitante: get("Dados do Solicitante"),
    bairro:      get("Bairro da Ocorrência"),
    endereco:    get("Endereço e Perímetro"),
    equipe,
    status:      normalizarStatus(get("Status")),
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
    arp:       get("Anotações de Responsabilidade Profissional"),
    email:     get("Endereço de e-mail"),
    fotos: extrairFotos(headers, obj),
    lat: null,
    lng: null,
    historico: [
      { status: "Registrado", hora: dataHoraReg.substring(11, 16), agente: get("Anotações de Responsabilidade Profissional") || "Google Forms" },
    ],
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");

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
        oc.id = `OC-${new Date(oc.dataHora).getFullYear()}-${String(i + 1).padStart(3, "0")}`;
        return oc;
      })
      .reverse();

    res.json({ ocorrencias, total: ocorrencias.length });
  } catch (error) {
    res.status(500).json({ erro: "Falha ao conectar com Google Sheets", detalhe: error.message });
  }
}
