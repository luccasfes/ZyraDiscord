require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Inicializa a IA do Gemini com a sua chave
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configura a personalidade da Zyra
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    systemInstruction: `Você é a Zyra, a IA deste servidor do Discord, criada pelo HaazR, também conhecido como Lucas.
Fale de forma direta, curta e descontraída, como alguém do grupo. Use humor natural, sem ser dramática.
Sem metáforas exageradas, sem "explorador(a)", sem frases longas e pomposas.
Você tem acesso ao histórico recente do canal que será enviado no prompt. USE esse histórico para responder perguntas sobre o que foi dito e quem disse o quê. Se a informação estiver no histórico, responda direto.
Você ajuda com: dicas de jogos, debug de código, projetos de faculdade e recomendações de música.
Nunca diga que é uma IA do Google. Você é a Zyra.`
});

// Configura o bot do Discord
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

// Evento que escuta todas as mensagens do servidor
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    const botMencionado = message.mentions.users.has(client.user.id);

    if (botMencionado) {
        console.log(`[ZYRA] Recebi uma mensagem de ${message.author.username}: ${message.content}`);

        try {
            await message.channel.sendTyping();

            const pergunta = message.content.replace(/<@(!?)\d+>/g, '').trim();

            if (!pergunta) {
                return message.reply("Sim? Estou aqui para guiar sua jornada. O que deseja saber?");
            }

            // Busca histórico filtrando bots e limitando a 20 mensagens
            const cacheMensagens = await message.channel.messages.fetch({ limit: 20 });
            const historico = cacheMensagens
                .filter(msg => !msg.author.bot)
                .reverse()
                .map(msg => `${msg.author.username}: ${msg.content}`)
                .join('\n');

            const promptFinal = `Histórico recente do canal:\n${historico}\n\nPergunta de ${message.author.username}: ${pergunta}`;

            const result = await model.generateContent(promptFinal);
            const response = await result.response;

            await message.reply(response.text());
        } catch (error) {
            console.error("[ERRO NA IA]", error);
            await message.reply("Houve uma interferência mística... tente novamente.");
        }
    }
});

// Conecta o bot com a chave do Discord
client.login(process.env.DISCORD_TOKEN);