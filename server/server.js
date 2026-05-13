// server.js

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const pdf = require("pdf-parse");
const dotenv = require("dotenv");

const OpenAI = require("openai");

const chunkText = require("./components/chunkText");
const calculateSimilarity = require("./components/similarity");

dotenv.config();

const app = express();

/* ---------------- MIDDLEWARE ---------------- */

app.use(cors());
app.use(express.json());

/* ---------------- UPLOAD FOLDER ---------------- */

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

/* ---------------- MULTER ---------------- */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files allowed"));
    }
    cb(null, true);
  },
});

/* ---------------- GROQ CONFIG ---------------- */

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

/* ---------------- STORE DOCUMENT ---------------- */

let documentData = {
  fileName: "",
  extractedText: "",
  chunks: [],
};

/* ---------------- HOME ---------------- */

app.get("/", (req, res) => {
  res.send("SmartDocAI Backend Running 🚀");
});

/* ---------------- UPLOAD PDF ---------------- */

app.post("/upload", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No PDF uploaded",
      });
    }

    const filePath = req.file.path;
    const dataBuffer = fs.readFileSync(filePath);

    const pdfData = await pdf(dataBuffer);

    const extractedText = pdfData.text.replace(/\s+/g, " ").trim();

    const chunks = chunkText(extractedText);

    documentData = {
      fileName: req.file.filename,
      extractedText,
      chunks,
    };

    return res.status(200).json({
      success: true,
      message: "PDF uploaded successfully",
      fileName: req.file.filename,
      totalChunks: chunks.length,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Error processing PDF",
    });
  }
});

/* ---------------- ASK QUESTION ---------------- */

app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    if (documentData.chunks.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Upload a PDF first",
      });
    }

    /* ---------------- FIND BEST CHUNK ---------------- */

    let bestChunk = "";
    let highestScore = 0;

    documentData.chunks.forEach((chunk) => {
      const score = calculateSimilarity(question, chunk);

      if (score > highestScore) {
        highestScore = score;
        bestChunk = chunk;
      }
    });

    if (highestScore < 1 || !bestChunk) {
      return res.status(200).json({
        success: true,
        answer: "Not available in document",
        source: null,
        fileName: documentData.fileName,
      });
    }

    /* ---------------- PROMPT ---------------- */

const prompt = `
You are SmartDocAI, a document analysis assistant.

Your task:
- Read the given document context carefully
- Understand the content fully
- Extract ONLY the important information

OUTPUT FORMAT RULES:
1. Give the answer in clear bullet points
2. Use main headings where needed
3. Under each heading, add sub-points
4. Keep it simple and easy to understand
5. Do NOT add extra information outside the document
6. If information is not found, say: "Not available in document"

FORMAT EXAMPLE:

- Main Topic
  - Point 1
  - Point 2

- Another Topic
  - Point 1
  - Point 2

DOCUMENT:
${bestChunk}

QUESTION:
${question}
`;
    /* ---------------- GROQ AI CALL ---------------- */

    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a document QA assistant.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const response = result.choices[0].message.content;

    /* ---------------- RESPONSE ---------------- */

    return res.status(200).json({
      success: true,
      answer: response,
      source: bestChunk,
      fileName: documentData.fileName,
    });
  } catch (error) {
    console.log("ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Error generating answer",
    });
  }
});

/* ---------------- DOCUMENT INFO ---------------- */

app.get("/document", (req, res) => {
  return res.status(200).json({
    fileName: documentData.fileName,
    extractedText: documentData.extractedText,
    totalChunks: documentData.chunks.length,
  });
});

/* ---------------- SERVER START ---------------- */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});