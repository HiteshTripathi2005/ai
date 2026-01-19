import {createOpenRouter} from "@openrouter/ai-sdk-provider"
import { smoothStream, stepCountIs, streamText, generateObject } from 'ai';
import { z } from 'zod';
import { systemPrompt } from '../utils/systemPrompt.js';
import Chat from '../models/Chat.js';
import { taskTool, timeTool } from "../utils/tools.js";
import { listEvents, createEvent, listCalendars, deleteEvent, createCalendar, deleteCalendar } from "../tools/calendar-tool.js";
import { listEmails, sendEmail } from "../tools/gmail-tool.js";
import { mcpToolsFromSmithery } from "../utils/mcp.js";
import { getOpenRouterModelId } from '../data/models.js';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const tools = {
    getCurrentTime: timeTool,
    task: taskTool,
    listEvents: listEvents,
    listCalendars: listCalendars,
    createEvent: createEvent,
    deleteEvent: deleteEvent,
    createCalendar: createCalendar,
    deleteCalendar: deleteCalendar,
    listEmails: listEmails,
    sendEmail: sendEmail,
}

export const chat = async (req, res) => {
    try {
        const { prompt, chatId, model, imageUrls } = req.body;
        const userId = req.user._id;
        const user = req.user;

        console.log("Received prompt:", prompt);
        console.log("Received imageUrls:", imageUrls);

        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        // Find or create chat
        let chat = null;
        if (chatId) {
            chat = await Chat.findOne({ _id: chatId, user: userId });
        }

        if (!chat) {
            const chatTitle = prompt.substring(0, 50) + (prompt.length > 50 ? '...' : '');
            console.log('Creating new chat with title:', chatTitle);
            chat = new Chat({
                user: userId,
                title: chatTitle,
                messages: []
            });
            await chat.save();
            console.log('New chat created with ID:', chat._id, 'and title:', chat.title);
        }

        // Add user message to chat
        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            parts: []
        };

        // Add images first if provided
        if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
            imageUrls.forEach(imageUrl => {
                userMessage.parts.push({
                    type: 'image',
                    image: imageUrl
                });
            });
        }

        // Add text after images
        userMessage.parts.push({ type: 'text', text: prompt });

        chat.messages.push(userMessage);
        await chat.save();

        // Prepare assistant message structure
        const assistantMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            parts: []
        };

        // Select model based on request
        const selectedModel = getModelInstance(model);

        const messages = await buildMessagesArray(chat, prompt, userId);

        const { tools: mcpTools, close: closeMcpTools } = await mcpToolsFromSmithery();
        const allTools = { ...tools, ...mcpTools };

        console.log("allTools names:", Object.keys(allTools));
        console.log("selectedModel:", selectedModel);
        const result = await streamText({
            model: selectedModel,
            messages,
            stopWhen: stepCountIs(10),
            tools: allTools,
            experimental_context: {user: user},
            onStepFinish: async (step) => {
                
                // Add text part if there's text and it's not empty
                if (step.text && step.text.trim()) {
                    assistantMessage.parts.push({
                        type: 'text',
                        text: step.text
                    });
                }
                
                // Add tool calls if present
                if (step.toolCalls && step.toolCalls.length > 0) {
                    for (const toolCall of step.toolCalls) {
                        assistantMessage.parts.push({
                            type: 'tool-call',
                            toolCallId: toolCall.toolCallId,
                            toolName: toolCall.toolName,
                            args: toolCall.args || toolCall.input || toolCall.arguments || {}
                        });
                    }
                }
                
                // Add tool results if present
                if (step.toolResults && step.toolResults.length > 0) {
                    for (const toolResult of step.toolResults) {
                        // Find the corresponding tool call part and update it with result
                        const toolCallPart = assistantMessage.parts.find(
                            p => p.type === 'tool-call' && p.toolCallId === toolResult.toolCallId
                        );
                        if (toolCallPart) {
                            toolCallPart.result = toolResult.result;
                        }
                    }
                }
            },
            experimental_transform: smoothStream({
                delayInMs: 43,
                chunking: "word"
            })
        });

        // Get the original response
        const originalResponse = result.pipeUIMessageStreamToResponse(res);

        // Save the assistant message after the stream is complete
        result.text.then(async (finalText) => {
            try {
                // Only add final text if we have no parts yet and the text is not empty
                if (finalText && finalText.trim() && assistantMessage.parts.length === 0) {
                    assistantMessage.parts.push({
                        type: 'text',
                        text: finalText
                    });
                }
                
                // Only save if we have parts
                if (assistantMessage.parts.length > 0) {
                    chat.messages.push(assistantMessage);
                    await chat.save();
                    console.log('Assistant message with parts saved to database');
                } else {
                    console.warn('No parts to save for assistant message');
                }

                // Update chat title after first message exchange if it's still the default
                if (chat.messages.length === 2 && (chat.title === 'New Chat' || chat.title.length < 10)) {
                    try {
                        // Create a more descriptive title based on the conversation
                        const userMessage = chat.messages.find(msg => msg.role === 'user');
                        
                        if (userMessage && userMessage.parts) {
                            const textPart = userMessage.parts.find(p => p.type === 'text');
                            const userText = textPart?.text || '';
                            
                            // Create title from user prompt, limited to 50 characters
                            let newTitle = userText.substring(0, 50);
                            if (userText.length > 50) {
                                newTitle += '...';
                            }
                            
                            // If the title would be too short, use more of the prompt
                            if (newTitle.length < 10 && userText.length > 10) {
                                newTitle = userText.substring(0, 100) + (userText.length > 100 ? '...' : '');
                            }
                            
                            if (newTitle.trim()) {
                                await Chat.findByIdAndUpdate(chat._id, { title: newTitle });
                                console.log('Chat title updated to:', newTitle);
                            }
                        }
                    } catch (titleError) {
                        console.error('Error updating chat title:', titleError);
                    }
                }
            } catch (error) {
                console.error('Error saving assistant message:', error);
                console.error('Assistant message parts:', JSON.stringify(assistantMessage.parts, null, 2));
            }
        }).catch(error => {
            console.error('Error getting final text:', error);
        }).finally(async () => {
            await closeMcpTools();
            console.log('MCP tools closed');
        });

        return originalResponse;
    } catch (error) {
        console.error("Error occurred while processing chat:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

// Get all chats for a user
export const getChats = async (req, res) => {
    try {
        const userId = req.user._id;

        const chats = await Chat.find({ user: userId, isActive: true })
            .sort({ updatedAt: -1 })
            .select('title messages createdAt updatedAt')
            .lean();

        res.status(200).json({
            success: true,
            data: chats
        });
    } catch (error) {
        console.error("Error fetching chats:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch chats"
        });
    }
}

// Create a new chat
export const createChat = async (req, res) => {
    try {
        const userId = req.user._id;
        const { title } = req.body;

        const chat = new Chat({
            user: userId,
            title: title || 'New Chat',
            messages: []
        });

        await chat.save();

        res.status(201).json({
            success: true,
            data: chat.toObject()
        });
    } catch (error) {
        console.error("Error creating chat:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create chat"
        });
    }
}

// Get a specific chat
export const getChat = async (req, res) => {
    try {
        const userId = req.user._id;
        const { chatId } = req.params;

        const chat = await Chat.findOne({ _id: chatId, user: userId, isActive: true }).lean();

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: "Chat not found"
            });
        }

        res.status(200).json({
            success: true,
            data: chat
        });
    } catch (error) {
        console.error("Error fetching chat:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch chat"
        });
    }
}

// Delete a chat
export const deleteChat = async (req, res) => {
    try {
        const userId = req.user._id;
        const { chatId } = req.params;

        // Check if this is the last chat
        const chatCount = await Chat.countDocuments({ user: userId, isActive: true });

        if (chatCount <= 1) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete the last chat"
            });
        }

        const chat = await Chat.findOneAndDelete(
            { _id: chatId, user: userId, isActive: true }
        );

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: "Chat not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Chat deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting chat:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete chat"
        });
    }
}

// Update chat title
export const updateChatTitle = async (req, res) => {
    try {
        const userId = req.user._id;
        const { chatId } = req.params;
        const { title } = req.body;

        if (!title || title.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Title is required"
            });
        }

        const chat = await Chat.findOneAndUpdate(
            { _id: chatId, user: userId, isActive: true },
            { title: title.trim() },
            { new: true }
        ).lean();

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: "Chat not found"
            });
        }

        res.status(200).json({
            success: true,
            data: chat
        });
    } catch (error) {
        console.error("Error updating chat title:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update chat title"
        });
    }
}

// Helper function to get model instance
const getModelInstance = (modelName) => {
    const openRouterModelId = getOpenRouterModelId(modelName);
    return openrouter.chat(openRouterModelId);
};

// Multi-model chat - get responses from multiple models
export const multiModelChat = async (req, res) => {
    try {
        const { prompt, chatId, models, imageUrls } = req.body;
        const userId = req.user._id;

        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        if (!models || !Array.isArray(models) || models.length === 0) {
            return res.status(400).json({ error: "At least one model is required" });
        }

        // Find or create chat
        let chat = null;
        if (chatId) {
            chat = await Chat.findOne({ _id: chatId, user: userId });
        }

        if (!chat) {
            const chatTitle = prompt.substring(0, 50) + (prompt.length > 50 ? '...' : '');
            chat = new Chat({
                user: userId,
                title: chatTitle,
                messages: []
            });
            await chat.save();
        }

        // Add user message to chat
        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            parts: []
        };

        // Add images first if provided
        if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
            imageUrls.forEach(imageUrl => {
                userMessage.parts.push({
                    type: 'image',
                    image: imageUrl
                });
            });
        }

        // Add text after images
        userMessage.parts.push({ type: 'text', text: prompt });

        chat.messages.push(userMessage);
        await chat.save();

        // Prepare assistant message structure for multi-model
        const assistantMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            isMultiModel: true,
            multiModelResponses: []
        };

        // Set up SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Store model responses
        const modelResponses = {};

        // Process each model in parallel
        const modelPromises = models.map(async (modelName) => {
            const modelInstance = getModelInstance(modelName);
            const modelResponse = {
                model: modelName,
                parts: [],
                show: false,
                selected: false
            };

            const { tools: mcpTools, close: closeMcpTools } = await mcpToolsFromSmithery();
            const allTools = { ...tools, ...mcpTools };

            try {
                const result = await streamText({
                    model: modelInstance,
                    system: systemPrompt,
                    prompt,
                    stopWhen: stepCountIs(10),
                    tools: allTools,
                    onStepFinish: async (step) => {
                        
                        // Add text part first (matches single-model order)
                        if (step.text && step.text.trim()) {
                            modelResponse.parts.push({
                                type: 'text',
                                text: step.text
                            });
                        }

                        // Add tool calls if present (after text, matches single-model order)
                        if (step.toolCalls && step.toolCalls.length > 0) {
                            for (const toolCall of step.toolCalls) {
                                // Stream tool call start event
                                res.write(`data: ${JSON.stringify({
                                    type: 'tool-input-available',
                                    model: modelName,
                                    toolCallId: toolCall.toolCallId,
                                    toolName: toolCall.toolName,
                                    input: toolCall.args || toolCall.input || toolCall.arguments || {}
                                })}\n\n`);

                                // Add to model response
                                modelResponse.parts.push({
                                    type: 'tool-call',
                                    toolCallId: toolCall.toolCallId,
                                    toolName: toolCall.toolName,
                                    args: toolCall.args || toolCall.input || toolCall.arguments || {}
                                });
                            }
                        }

                        // Update tool results if present (matches single-model - updates existing tool calls)
                        if (step.toolResults && step.toolResults.length > 0) {
                            for (const toolResult of step.toolResults) {
                                // Stream tool result event
                                res.write(`data: ${JSON.stringify({
                                    type: 'tool-output-available',
                                    model: modelName,
                                    toolCallId: toolResult.toolCallId,
                                    output: toolResult.result
                                })}\n\n`);

                                // Update the existing tool call part with result
                                const toolCallPart = modelResponse.parts.find(
                                    p => p.type === 'tool-call' && p.toolCallId === toolResult.toolCallId
                                );
                                if (toolCallPart) {
                                    toolCallPart.result = toolResult.result;
                                }
                            }
                        }
                    },
                    experimental_transform: smoothStream({
                        delayInMs: 43,
                        chunking: "word"
                    })
                });

                // Stream the response
                for await (const chunk of result.textStream) {
                    // Send streaming update to client
                    res.write(`data: ${JSON.stringify({
                        type: 'text-delta',
                        model: modelName,
                        delta: chunk
                    })}\n\n`);
                }

                // Get final text
                const finalText = await result.text;
                if (finalText && finalText.trim() && modelResponse.parts.length === 0) {
                    modelResponse.parts.push({
                        type: 'text',
                        text: finalText
                    });
                }

                modelResponses[modelName] = modelResponse;
                
                // Send completion event for this model
                res.write(`data: ${JSON.stringify({
                    type: 'model-complete',
                    model: modelName
                })}\n\n`);

            } catch (error) {
                console.error(`Error with model ${modelName}:`, error);
                modelResponse.parts.push({
                    type: 'text',
                    text: `Error: Failed to get response from ${modelName}`
                });
                modelResponses[modelName] = modelResponse;
            } finally {
                await closeMcpTools();
                console.log(`MCP tools closed`);
            }
        });

        // Wait for all models to complete
        await Promise.all(modelPromises);

        // Add all model responses to assistant message
        assistantMessage.multiModelResponses = Object.values(modelResponses);

        // Save to database
        chat.messages.push(assistantMessage);
        await chat.save();

        // Send final completion with message ID
        res.write(`data: ${JSON.stringify({
            type: 'complete',
            messageId: assistantMessage.id,
            chatId: chat._id
        })}\n\n`);

        res.end();


    } catch (error) {
        console.error("Error occurred while processing multi-model chat:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
};

// Select preferred model response
export const selectModelResponse = async (req, res) => {
    try {
        const userId = req.user._id;
        const { chatId, messageId, selectedModel } = req.body;

        if (!chatId || !messageId || !selectedModel) {
            return res.status(400).json({
                success: false,
                message: "chatId, messageId, and selectedModel are required"
            });
        }

        const chat = await Chat.findOne({ _id: chatId, user: userId, isActive: true });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: "Chat not found"
            });
        }

        // Find the message and update the selected model
        const message = chat.messages.find(msg => msg.id === messageId);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found"
            });
        }

        if (!message.isMultiModel || !message.multiModelResponses) {
            return res.status(400).json({
                success: false,
                message: "Message is not a multi-model response"
            });
        }

        // Update all responses: mark selected one as show=true and selected=true
        message.multiModelResponses.forEach(response => {
            if (response.model === selectedModel) {
                response.show = true;
                response.selected = true;
            } else {
                response.show = false;
                response.selected = false;
            }
        });

        await chat.save();

        res.status(200).json({
            success: true,
            message: "Model response selected successfully",
            data: {
                chatId: chat._id,
                messageId: message.id,
                selectedModel
            }
        });
    } catch (error) {
        console.error("Error selecting model response:", error);
        res.status(500).json({
            success: false,
            message: "Failed to select model response"
        });
    }
}


// Build messages array with system prompt and conversation history
const buildMessagesArray = async (chat, currentPrompt, userId) => {
    const messages = [];

    // Add system message
    messages.push({
        role: 'system',
        content: systemPrompt
    });

    // Get past messages from current chat only (excluding the current user message we just added)
    const currentChatPastMessages = chat.messages.slice(0, -1); // Exclude the last message (current user prompt)

    // Take last 10 messages from current chat to keep context manageable
    const recentMessages = currentChatPastMessages.slice(-10);

    // Convert past messages to simplified format (only text and tool call names)
    for (const msg of recentMessages) {
        if (msg.role === 'user' || msg.role === 'assistant') {
            const content = [];

            // Extract text content
            const textParts = msg.parts.filter(p => p.type === 'text');
            for (const textPart of textParts) {
                if (textPart.text && textPart.text.trim()) {
                    content.push({
                        type: 'text',
                        text: textPart.text
                    });
                }
            }

            // Extract tool call names (simplified, no args to reduce size)
            const toolCallParts = msg.parts.filter(p => p.type === 'tool-call');
            for (const toolCallPart of toolCallParts) {
                content.push({
                    type: 'text',
                    text: `Used tool: ${toolCallPart.toolName}`
                });
            }

            if (content.length > 0) {
                messages.push({
                    role: msg.role,
                    content: content
                });
            }
        }
    }

    // Add current user prompt (including images if present)
    const currentMessageContent = [];

    // Check if the last message has images and add them first
    const lastUserMessage = chat.messages[chat.messages.length - 1];
    if (lastUserMessage && lastUserMessage.role === 'user') {
        const imageParts = lastUserMessage.parts.filter(p => p.type === 'image');
        imageParts.forEach(imagePart => {
            currentMessageContent.push({
                type: 'image',
                image: imagePart.image
            });
        });
    }

    // Add text after images
    currentMessageContent.push({ type: 'text', text: currentPrompt });

    messages.push({
        role: 'user',
        content: currentMessageContent
    });

    return messages;
};

// Comparison chat - get responses from 3 models and let AI choose the best
export const comparisonChat = async (req, res) => {
    try {
        const { prompt, chatId, imageUrls } = req.body;
        const userId = req.user._id;
        const user = req.user;

        console.log("Comparison chat - Received prompt:", prompt);
        console.log("User system prompt:", user.systemPrompt);

        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        // Find or create chat
        let chat = null;
        if (chatId) {
            chat = await Chat.findOne({ _id: chatId, user: userId });
        }

        if (!chat) {
            const chatTitle = prompt.substring(0, 50) + (prompt.length > 50 ? '...' : '');
            chat = new Chat({
                user: userId,
                title: chatTitle,
                messages: []
            });
            await chat.save();
        }

        // Add user message to chat
        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            parts: []
        };

        // Add images first if provided
        if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
            imageUrls.forEach(imageUrl => {
                userMessage.parts.push({
                    type: 'image',
                    image: imageUrl
                });
            });
        }

        // Add text after images
        userMessage.parts.push({ type: 'text', text: prompt });

        chat.messages.push(userMessage);
        await chat.save();

        // Define 3 models to compare
        const modelsToCompare = [
            { name: 'gemini-2.0-flash-exp', id: 'google/gemini-2.0-flash-001' },
            { name: 'claude-3.5-sonnet', id: 'anthropic/claude-3.5-sonnet' },
            { name: 'gpt-4o-mini', id: 'openai/gpt-4o-mini' }
        ];

        // Prepare message content for models
        const messageContent = [];
        if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
            imageUrls.forEach(imageUrl => {
                messageContent.push({
                    type: 'image',
                    image: imageUrl
                });
            });
        }
        messageContent.push({ type: 'text', text: prompt });

        console.log('Fetching responses from 3 models in parallel...');

        // Get responses from all 3 models in parallel
        const modelResponses = await Promise.allSettled(
            modelsToCompare.map(async (model) => {
                try {
                    const modelInstance = openrouter.chat(model.id);
                    const result = await streamText({
                        model: modelInstance,
                        messages: [
                            {
                                role: 'user',
                                content: messageContent
                            }
                        ],
                        maxTokens: 2000,
                    });

                    const fullText = await result.text;
                    return {
                        modelName: model.name,
                        response: fullText,
                        success: true
                    };
                } catch (error) {
                    console.error(`Error with model ${model.name}:`, error);
                    return {
                        modelName: model.name,
                        response: `Error: ${error.message}`,
                        success: false
                    };
                }
            })
        );

        // Extract successful responses
        const responses = modelResponses.map((result, index) => {
            if (result.status === 'fulfilled') {
                return result.value;
            } else {
                return {
                    modelName: modelsToCompare[index].name,
                    response: 'Failed to get response',
                    success: false
                };
            }
        });

        console.log('Received responses from all models');

        // Prepare evaluation prompt for Gemini
        const evaluationPrompt = `${user.systemPrompt}

Here are three AI responses to the user's question: "${prompt}"

Response 1 (${responses[0].modelName}):
${responses[0].response}

Response 2 (${responses[1].modelName}):
${responses[1].response}

Response 3 (${responses[2].modelName}):
${responses[2].response}

Based on your evaluation criteria, analyze these responses and select which one is the best. Return the option number (1, 2, or 3) and a brief explanation of why you chose it.`;

        // Define schema for structured output
        const evaluationSchema = z.object({
            selectedOption: z.number().min(1).max(3).describe('The number of the selected response (1, 2, or 3)'),
            reasoning: z.string().describe('Brief explanation of why this response was selected as the best')
        });

        // Get Gemini to evaluate and return structured decision
        console.log('Asking Gemini to evaluate and select best response...');
        const evaluatorModel = openrouter.chat('google/gemini-2.0-flash-001');

        const result = await generateObject({
            model: evaluatorModel,
            schema: evaluationSchema,
            prompt: evaluationPrompt,
        });

        const { selectedOption, reasoning } = result.object;
        console.log(`Gemini selected option ${selectedOption}: ${reasoning}`);

        // Get the winning response
        const winningResponse = responses[selectedOption - 1];
        console.log(`Sending response from ${winningResponse.modelName}`);

        // Prepare assistant message with the winning response
        const assistantMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            parts: [{
                type: 'text',
                text: winningResponse.response
            }],
            metadata: {
                selectedModel: winningResponse.modelName,
                reasoning: reasoning,
                comparedModels: responses.map(r => r.modelName)
            }
        };

        // Save assistant message to chat
        chat.messages.push(assistantMessage);
        await chat.save();

        console.log('Comparison chat completed and saved');

        // Send complete response with metadata
        res.status(200).json({
            success: true,
            data: {
                chatId: chat._id,
                message: assistantMessage,
                comparisonResult: {
                    selectedModel: winningResponse.modelName,
                    reasoning: reasoning,
                    allModels: responses.map(r => ({
                        name: r.modelName,
                        wasSelected: r.modelName === winningResponse.modelName
                    }))
                }
            }
        });

    } catch (error) {
        console.error("Error in comparison chat:", error);

        res.status(500).json({
            success: false,
            message: "Failed to process comparison chat",
            error: error.message
        });
    }
};