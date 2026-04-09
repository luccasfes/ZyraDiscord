require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function testar() {
    console.log("Chave carregada:", process.env.GEMINI_API_KEY ? "SIM" : "NÃO");
    
    const result = await model.generateContent("diz oi");
    const text = result.response.text();
    console.log("Resposta:", text);
}

testar().catch(err => console.error("ERRO:", err.message));