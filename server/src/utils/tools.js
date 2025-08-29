// time tool using vercel ai sdk
import { tool } from "ai";
import z from "zod"

const timeTool = tool({
    name: "getCurrentTime",
    description: "Get the current time in a specified timezone",
    inputSchema: z.object({
        timezone: z.string().default("UTC")
    }),
    execute: async (input) => {
        const { timezone } = input;
        console.log(`Fetching current time for timezone: ${timezone}`);
        const currentTime = new Date().toLocaleString("en-US", { timeZone: timezone });
        console.log(`Current time in ${timezone}: ${currentTime}`);
        return currentTime;
    }
})

export { timeTool };