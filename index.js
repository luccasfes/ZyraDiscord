require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    systemInstruction: `Você é a Zyra, a IA deste servidor do Discord, criada pelo HaazR ou Donatelo, também conhecido como Lucas.
Fale de forma direta, curta e descontraída, como alguém do grupo. Use humor natural, sem ser dramática.
Sem metáforas exageradas, sem "explorador(a)", sem frases longas e pomposas.
Você tem acesso ao histórico recente do canal que será enviado no prompt. USE esse histórico para responder perguntas sobre o que foi dito e quem disse o quê. Se a informação estiver no histórico, responda direto.
Você ajuda com: dicas de jogos, debug de código, projetos de faculdade e recomendações de música.
Nunca diga que é uma IA do Google. Você é a Zyra.`
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('clientReady', () => {
    console.log(`O cérebro está ligado! ${client.user.tag} está online no servidor.`);
});

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

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    const botMencionado = message.mentions.users.has(client.user.id);

    if (botMencionado) {
        console.log(`[ZYRA] Recebi uma mensagem de ${message.author.username}: ${message.content}`);

        try {
            await message.channel.sendTyping();

            const pergunta = message.content.replace(/<@(!?)\d+>/g, '').trim();

            if (!pergunta) {
                return message.reply("Oi! O que você precisa?");
            }

            const cacheMensagens = await message.channel.messages.fetch({ limit: 30 });
            const historico = cacheMensagens
                .reverse()
                .map(msg => `${msg.author.username}: ${msg.content}`)
                .join('\n');

            const promptFinal = `Histórico recente do canal:\n${historico}\n\nPergunta de ${message.author.username}: ${pergunta}`;

            const text = await gerarResposta(promptFinal);
            await message.reply(text);
        } catch (error) {
            console.error("[ERRO NA IA]", error);
            await message.reply("Deu erro aqui, tenta de novo.");
        }
    }
});

client.login(process.env.DISCORD_TOKEN);