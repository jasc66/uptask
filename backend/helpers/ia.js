import OpenAI from 'openai';

const cliente = new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: process.env.NVIDIA_BASE_URL ?? 'https://integrate.api.nvidia.com/v1',
});

const MODELO = process.env.NVIDIA_MODEL ?? 'meta/llama-3.1-8b-instruct';

export const completar = async (mensajes, opciones = {}) => {
    const respuesta = await cliente.chat.completions.create({
        model: MODELO,
        messages: mensajes,
        temperature: opciones.temperatura ?? 0.7,
        max_tokens: opciones.maxTokens ?? 1024,
        stream: false,
    });
    return respuesta.choices[0]?.message?.content ?? '';
};

export const completarStream = async (mensajes, onChunk, opciones = {}) => {
    const stream = await cliente.chat.completions.create({
        model: MODELO,
        messages: mensajes,
        temperature: opciones.temperatura ?? 0.7,
        max_tokens: opciones.maxTokens ?? 1024,
        stream: true,
    });
    for await (const chunk of stream) {
        const texto = chunk.choices[0]?.delta?.content ?? '';
        if (texto) onChunk(texto);
    }
};

export default cliente;
