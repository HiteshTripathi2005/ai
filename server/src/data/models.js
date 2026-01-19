// Model mappings from client names to OpenRouter API IDs
export const modelMap = {
  "gemini-2.0-flash-exp": "google/gemini-2.0-flash-001",
  "z-ai/glm-4.5-air:free": "z-ai/glm-4.5-air:free",
  "qwen/qwen3-coder:free": "qwen/qwen3-coder:free",
  "mistralai/mistral-small-3.2-24b-instruct:free": "mistralai/mistral-small-3.2-24b-instruct:free",
  "openai/gpt-oss-20b:free": "openai/gpt-oss-20b:free",
  "xiaomi/mimo-v2-flash:free": "xiaomi/mimo-v2-flash:free",
  "meta-llama/llama-3.3-70b-instruct:free": "meta-llama/llama-3.3-70b-instruct:free",
  "nvidia/nemotron-3-nano-30b-a3b:free": "nvidia/nemotron-3-nano-30b-a3b:free",
  "arcee-ai/trinity-mini:free": "arcee-ai/trinity-mini:free",
};

// Get OpenRouter model ID from client model name
export const getOpenRouterModelId = (modelName) => {
  return modelMap[modelName] || "google/gemini-2.0-flash-001"; // default fallback
};
