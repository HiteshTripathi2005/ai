import { google } from '@ai-sdk/google';
import { stepCountIs, streamText } from 'ai';
import { getMergedTools } from '../utils/tools.js';
import { systemPrompt } from '../utils/systemPrompt.js';
import Chat from '../models/Chat.js';

export const chat = async (req, res) => {
    try {
        const { prompt, chatId } = req.body;
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

        const result = await streamText({
            model: google('gemini-2.5-flash'),
            system: systemPrompt,
            prompt,
            stopWhen: stepCountIs(10),
            tools: mergedTools,
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
                        assistantMessage.parts.push({
                            type: 'tool-call',
                            toolCallId: toolCall.toolCallId,
                            toolName: toolCall.toolName,
                            args: toolCall.args || {}
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
            }
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
