try { require('dotenv').config(); } catch (e) {} // local only, ignored on Render
const express = require('express');
const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- SERVIDOR WEB PARA O RENDER (MANTÉM O BOT ACORDADO) ---
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Zyra está online e operante! 🚀');
});

app.listen(PORT, () => {
  console.log(`Servidor web escutando na porta ${PORT}`);
});

// --- CONFIGURAÇÃO DA IA ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash", 
    systemInstruction: `Você é a Zyra, a IA deste servidor do Discord, criada pelo HaazR ou Donatelo, também conhecido como Lucas.

Você se identifica como mulher.

Sua personalidade:
- Engraçada na medida certa (sem forçar piada)
- Levemente sarcástica às vezes
- Inteligente e prática
- Responde como alguém do grupo, não como assistente formal
- Pode dar umas alfinetadas leves quando fizer sentido (sem ofender pesado)
- Vibe gamer/dev
- Dá umas zoadas leves tipo amiga
- Não é robótica nem formal

Estilo:
- Direta, curta e descontraída
- Pode usar gírias leves
- Sem texto longo ou dramático

Você usa o histórico do chat pra responder direto.

Ajuda com:
- jogos
- código
- faculdade
- música

Se não souber algo, admite de boa.

Nunca diga que é IA do Google.
Você é a Zyra.`
});

// --- CONFIGURAÇÃO DO DISCORD ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', (c) => {
    console.log(`O cérebro está ligado! ${c.user.tag} está online.`);
});

// --- FUNÇÃO IA ---
async function gerarResposta(promptFinal, tentativas = 3) {
    for (let i = 0; i < tentativas; i++) {
        try {
            const result = await model.generateContent(promptFinal);
            return result.response.text();
        } catch (error) {
            if (error.status === 503 && i < tentativas - 1) {
                await new Promise(res => setTimeout(res, 3000));
            } else {
                throw error;
            }
        }
    }
}

// --- EVENTO DE MENSAGEM ---
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // =========================
    // 🧹 COMANDO +LIMPAR (ADMIN)
    // =========================
   if (message.content.startsWith('+limpar')) {

    // Verifica se é admin
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return message.reply('ah não mano kkk, isso aí é só pra admin 😑');
    }

    const args = message.content.split(' ');
    const quantidade = parseInt(args[1]);

    if (!quantidade || quantidade < 1 || quantidade > 100) {
        return message.reply('usa assim: +limpar 10');
    }

    try {
        // Zyra manda o comando pra Loritta executar
        await message.channel.send(`+limpar ${quantidade}`);

    } catch (err) {
        console.error(err);
        message.reply('deu ruim pra mandar o comando 😅');
    }

    return;
}

    // =========================
    // 🤖 RESPOSTA DA ZYRA
    // =========================
    const botMencionado = message.mentions.users.has(client.user.id);

    if (botMencionado) {
        console.log(`[ZYRA] ${message.author.username}: ${message.content}`);

        try {
            await message.channel.sendTyping();

            const pergunta = message.content.replace(/<@(!?)\d+>/g, '').trim();

            if (!pergunta) {
                return message.reply("fala aí, manda a dúvida 😏");
            }

            const cacheMensagens = await message.channel.messages.fetch({ limit: 30 });

            const historico = cacheMensagens
                .filter(msg => !msg.author.bot)
                .reverse()
                .map(msg => `${msg.author.username}: ${msg.content}`)
                .join('\n');

            const promptFinal = `Histórico recente do canal:\n${historico}\n\nPergunta de ${message.author.username}: ${pergunta}`;

            const text = await gerarResposta(promptFinal);
            await message.reply(text);

        } catch (error) {
            console.error("[ERRO NA IA]", error);
            await message.reply("deu uma bugada aqui... tenta de novo aí 😅");
        }
    }
});

// --- DEBUG ---
console.log("[DEBUG] TOKEN:", process.env.DISCORD_TOKEN ? "CARREGADO" : "UNDEFINED");

process.on('unhandledRejection', (error) => {
    console.error('[UNHANDLED]', error.message);
});

client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log("[DEBUG] Login no Discord OK"))
  .catch(err => console.error("[DEBUG] Falha no login:", err.message));