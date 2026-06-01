import { google } from "googleapis";
import { Buffer } from "buffer";

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = "Árvores";

const COLS = ["id","numero","dataSolicitacao","solicitante","contato","bairro","endereco","tipo","descricao","equipe","status","dataAtendimento","observacoes"];

function getAuth() {
  const credentials = JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS_JSON, "base64").toString("utf8"));
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

async function ensureSheet(sheets) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const exists = meta.data.sheets.some(s => s.properties.title === SHEET_NAME);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: SHEET_NAME } } }] },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [COLS] },
    });
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });
    await ensureSheet(sheets);

    if (req.method === "GET") {
      const r = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:M`,
      });
      const rows = r.data.values || [];
      if (rows.length < 2) return res.json({ arvores: [] });
      const headers = rows[0];
      const arvores = rows.slice(1).map(row => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = row[i] || ""; });
        return obj;
      });
      return res.json({ arvores });
    }

    if (req.method === "POST") {
      const { arvores } = req.body;
      await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:Z`,
      });
      const values = [COLS, ...(arvores || []).map(o => COLS.map(c => o[c] ?? ""))];
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: "RAW",
        requestBody: { values },
      });
      return res.json({ ok: true });
    }
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}
