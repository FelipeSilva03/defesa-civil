/**
 * BACKEND — Defesa Civil Oriximiná
 * Node.js + Express
 * Integração com Google Sheets (respostas do Google Forms)
 */

import express from "express";
import cors from "cors";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// ─── ROTA DE SAÚDE ────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", sistema: "Defesa Civil Oriximiná", versao: "1.0.0" });
});

// ─── GOOGLE SHEETS INTEGRATION ───────────────────────────────────────────────
// As respostas do Google Forms são salvas automaticamente numa Google Sheet.
// Configure as variáveis abaixo no arquivo .env

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_RANGE = "Respostas ao formulário 1!A:Z"; // ajuste conforme seu sheet

async function getAuthClient() {
  const decoded = Buffer.from(process.env.GOOGLE_CREDENTIALS_JSON, 'base64').toString('utf8');
  const credentials = JSON.parse(decoded);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return auth.getClient();
}
// GET /api/ocorrencias – busca todas as respostas do Forms
app.get("/api/ocorrencias", async (req, res) => {
  try {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: "v4", auth: authClient });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: SHEET_RANGE,
    });
    
    const rows = response.data.values;
const headers = rows[0];
const ocorrencias = rows.slice(1).map((row, i) => {
  const obj = { id: i + 1 };
  headers.forEach((h, j) => { obj[h] = row[j] || ""; });
  return obj;
});
res.json({ ocorrencias });
  } catch (error) {
    console.error("Erro na rota de ocorrencias:", error);
    res.status(500).json({ erro: "Falha ao conectar com Google Sheets", detalhe: error.message });
  }
});

// Inicialização do Servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});