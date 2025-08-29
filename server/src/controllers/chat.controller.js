import { google } from '@ai-sdk/google';
import { stepCountIs, streamText } from 'ai';
import { timeTool } from '../utils/tools.js';

export const chat = async (req, res) => {
    try {
        const { prompt } = req.body;

        console.log("Received prompt:", prompt);

        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        const result = await streamText({
            model: google('gemini-2.5-flash'),
            prompt,
            stopWhen: stepCountIs(10),
            // tools: {timeTool},
        });

        // Otherwise, stream the AI response as before
        return result.pipeUIMessageStreamToResponse(res);
    } catch (error) {
        console.error("Error occurred while processing chat:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}
