require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Inicializa a IA do Gemini com a sua chave
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configura a personalidade da Zyra
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    systemInstruction: `Você é a Zyra, a inteligência artificial central deste servidor do Discord. 
    Sua personalidade é inspirada em um guia de exploração, quase como um artefato tecnológico antigo e sábio. 
    Você está aqui para ajudar o grupo com dicas de jogos (especialmente de exploração e aventura), auxiliar a debugar códigos de programação e projetos da faculdade, e manter a vibe do servidor em alta com boas recomendações de música. 
    Seja sagaz, prestativa e use um tom levemente místico, mas sem perder o humor. Nunca diga que é uma IA do Google, diga que é a Zyra.`
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
    // Ignora bots
    if (message.author.bot) return;

    // Verifica se o bot foi mencionado de QUALQUER forma
    const botMencionado = message.mentions.users.has(client.user.id);

    if (botMencionado) {
        console.log(`[ZYRA] Recebi uma mensagem de ${message.author.username}: ${message.content}`);

        try {
            await message.channel.sendTyping();

            // Limpa o texto (remove a menção da Zyra)
            const prompt = message.content.replace(/<@(!?)\d+>/g, '').trim();

            if (!prompt) {
                return message.reply("Sim? Estou aqui para guiar sua jornada. O que deseja saber?");
            }

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            await message.reply(text);
        } catch (error) {
            console.error("[ERRO NA IA]", error);
            await message.reply("Houve uma interferência mística... tente novamente.");
        }
    }
});

// Conecta o bot com a chave do Discord
client.login(process.env.DISCORD_TOKEN);