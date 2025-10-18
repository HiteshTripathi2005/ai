import {createOpenRouter} from "@openrouter/ai-sdk-provider"
import { smoothStream, stepCountIs, streamText } from 'ai';
import { getMergedTools } from '../utils/tools.js';
import { systemPrompt } from '../utils/systemPrompt.js';
import Chat from '../models/Chat.js';


const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});


export const chat = async (req, res) => {
    try {
        const { prompt, chatId, model } = req.body;
        const userId = req.user._id;

        console.log("Received prompt:", prompt);

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
            parts: [{ type: 'text', text: prompt }]
        };
        chat.messages.push(userMessage);
        await chat.save();

        // Prepare assistant message structure
        const assistantMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            parts: []
        };

        // Load merged tools (local + MCP)
        const { tools: mergedTools, close: closeMcp } = await getMergedTools();

        // Select model based on request
        let selectedModel;
        switch (model) {
            case "gemini-2.0-flash-exp":
                selectedModel = openrouter.chat('google/gemini-2.5-flash');
                break;
            case "z-ai/glm-4.5-air:free":
                selectedModel = openrouter.chat('z-ai/glm-4.5-air:free');
                break;
            case "qwen/qwen3-coder:free":
                selectedModel = openrouter.chat('qwen/qwen3-coder:free');
                break;
            case "mistralai/mistral-small-3.2-24b-instruct:free":
                selectedModel = openrouter.chat('mistralai/mistral-small-3.2-24b-instruct:free');
                break;
            case "openai/gpt-oss-20b:free":
                selectedModel = openrouter.chat('openai/gpt-oss-20b:free');
                break;
            default:
                selectedModel = openrouter.chat('google/gemini-2.5-flash');
                break;
        }

        console.log("available tools:", Object.keys(mergedTools));

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

            // Add current user prompt
            messages.push({
                role: 'user',
                content: currentPrompt
            });

            return messages;
        };

        const messages = await buildMessagesArray(chat, prompt, userId);

        const result = await streamText({
            model: selectedModel,
            messages,
            stopWhen: stepCountIs(10),
            tools: mergedTools,
            experimental_context: {userId: userId},
            onStepFinish: async (step) => {
                console.log('Step finished:', 'hasText:', !!step.text, 'hasToolCalls:', !!step.toolCalls?.length, 'hasToolResults:', !!step.toolResults?.length);
                
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
                        console.log('Tool call object:', JSON.stringify(toolCall, null, 2));
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
        });

        // Set up cleanup after response is finished
        res.on('finish', async () => {
            try {
                await closeMcp();
                console.log('MCP connections closed successfully');
            } catch (closeError) {
                console.warn('Error closing MCP connections:', closeError);
            }
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
    switch (modelName) {
        case "gemini-2.0-flash-exp":
            return openrouter.chat('google/gemini-2.0-flash-001');
        case "z-ai/glm-4.5-air:free":
            return openrouter.chat('z-ai/glm-4.5-air:free');
        case "qwen/qwen3-coder:free":
            return openrouter.chat('qwen/qwen3-coder:free');
        case "mistralai/mistral-small-3.2-24b-instruct:free":
            return openrouter.chat('mistralai/mistral-small-3.2-24b-instruct:free');
        case "openai/gpt-oss-20b:free":
            return openrouter.chat('openai/gpt-oss-20b:free');
        default:
            return openrouter.chat('google/gemini-2.0-flash-001');
    }
};

// Multi-model chat - get responses from multiple models
export const multiModelChat = async (req, res) => {
    try {
        const { prompt, chatId, models } = req.body;
        const userId = req.user._id;

        console.log("Received multi-model prompt:", prompt, "Models:", models);

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
            parts: [{ type: 'text', text: prompt }]
        };
        chat.messages.push(userMessage);
        await chat.save();

        // Prepare assistant message structure for multi-model
        const assistantMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            isMultiModel: true,
            multiModelResponses: []
        };

        // Load merged tools (local + MCP)
        const { tools: mergedTools, close: closeMcp } = await getMergedTools();

        console.log("available tools:", Object.keys(mergedTools));

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

            try {
                const result = await streamText({
                    model: modelInstance,
                    system: systemPrompt,
                    prompt,
                    stopWhen: stepCountIs(10),
                    tools: mergedTools,
                    onStepFinish: async (step) => {
                        console.log(`[${modelName}] Step finished:`, 'hasText:', !!step.text, 'hasToolCalls:', !!step.toolCalls?.length, 'hasToolResults:', !!step.toolResults?.length);

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
                                console.log(`[${modelName}] Tool call:`, toolCall.toolName);
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
                                console.log(`[${modelName}] Tool result:`, toolResult.toolCallId);
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

        // Close MCP connections
        try {
            await closeMcp();
            console.log('MCP connections closed successfully');
        } catch (closeError) {
            console.warn('Error closing MCP connections:', closeError);
        }

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
