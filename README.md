This is an AI-powered web application that allows users to upload PDF documents and ask questions based strictly on the uploaded content. The system ensures answers are derived only from the document, and if information is not available, it responds with "Not available in document".

Tech Stack::
Frontend: React
Backend: Node.js, Express
PDF Parsing: pdf-parse
AI Model: Grok API

System Architecture
User uploads PDF file
Backend extracts text using pdf-parse
User asks a question via UI
Backend sends document context + question to Grok API
AI returns answer strictly based on document
If not found → returns fallback message

# Install frontend dependencies
npm install
npm run dev
# Install backend dependencies
npm install
node server.js
