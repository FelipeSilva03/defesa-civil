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
  const rawCreds = process.env.GOOGLE_CREDENTIALS;
const credentials = JSON.parse(rawCreds);
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return auth.getClient();
}

// GET /api/ocorrencias — busca todas as respostas do Forms
app.get("/api/ocorrencias", async (req, res) => {
  try {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: "v4", auth: authClient });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: SHEET_RANGE,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.json({ ocorrencias: [] });
    }

    const headers = rows[0];
    const ocorrencias = rows.slice(1).map((row, index) => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i] || ""; });

      // Mapeia os campos do formulário para o modelo do sistema
      return {
        id: `OC-${new Date().getFullYear()}-${String(index + 1).padStart(3, "0")}`,
        dataHora: obj["Carimbo de data/hora"] || new Date().toISOString(),
        solicitante: [obj["Nome do solicitante"], obj["Telefone do solicitante"], obj["CPF/RG do solicitante"]].filter(Boolean).join(" - "),
        bairro: obj["Bairro / Comunidade"] || "Não informado",
        endereco: obj["Endereço completo / Referência"] || "",
        equipe: obj["Equipe"] || "ALFA",
        status: obj["Status"] || "Aguardando",
        descricao: obj["Descrição da ocorrência"] || "",
        arp: obj["Nome do agente responsável"] || "",
        categorias: {
          combateIncendioUrbano: obj["Combate a Incêndio Urbano"] || null,
          combateIncendioFlorestal: obj["Combate a Incêndio Florestal"] || null,
          atendimentoPreHospitalar: obj["Atendimento Pré Hospitalar (APH)"] || null,
          buscaSalvamento: obj["Busca e Salvamento"] || null,
          capturaAnimal: obj["Capturas de Animal"] || null,
          corteArvore: obj["Corte de Árvore de Risco"] || null,
          remocaoCadaver: obj["Remoção de Cadáver"] || null,
          apoioEventos: obj["Apoio a Eventos"] || null,
          defesaCivil: obj["Defesa Civil"] || null,
          outros: obj["Outros"] || null,
        },
        fotos: [],
        lat: parseFloat(obj["Latitude"] || "-1.7654"),
        lng: parseFloat(obj["Longitude"] || "-55.8661"),
        historico: [{ status: "Registrado", hora: "—", agente: obj["Nome do agente responsável"] || "Sistema" }],
      };
    });

    res.json({ total: ocorrencias.length, ocorrencias });
  } catch (error) {
    console.error("Erro ao buscar dados do Google Sheets:", error.message);
    res.status(500).json({ erro: "Falha ao conectar com Google Sheets", detalhe: error.message });
  }
});

// GET /api/ocorrencias/:id
app.get("/api/ocorrencias/:id", async (req, res) => {
  res.json({ mensagem: "Endpoint individual — implemente conforme necessidade" });
});

// PUT /api/ocorrencias/:id/status
app.put("/api/ocorrencias/:id/status", async (req, res) => {
  const { status, observacao } = req.body;
  // Aqui você pode gravar numa segunda aba da planilha o histórico de updates
  res.json({ sucesso: true, id: req.params.id, novoStatus: status });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor Defesa Civil rodando na porta ${PORT}`);
  console.log(`🔗 http://localhost:${PORT}/health`);
});
