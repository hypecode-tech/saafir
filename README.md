# 🤖 Saafir (سفير) - AI Agent Framework

> [🇹🇷 Türkçe README için tıklayın](README.tr.md)

**Saafir** (meaning "ambassador" in Arabic) is a powerful and flexible AI agent framework written in TypeScript. It works with various AI models like Claude, ChatGPT, Gemini, Qwen, DeepSeek through the OpenRouter API.

## ✨ Features

- 🌐 **Multi-Model Support**: 50+ AI models through OpenRouter
- 🎯 **Smart Action System**: Nested action tree structure
- 🔍 **Automatic Intent Detection**: Automatic action determination from user input
- 📝 **Zod Schema Validation**: Type-safe input validation
- 🚀 **TypeScript**: Full type safety
- 🧪 **Test Ready**: Tested with Vitest

## 📦 Installation

```bash
npm install saafir
# or
yarn add saafir
# or
bun add saafir
```

## 🚀 Quick Start

```typescript
import { Saafir } from 'saafir';
import { z } from 'zod';

// Define your actions
const actions = {
  weather: {
    getCurrentWeather: {
      call: async (input: { city: string }) => {
        // Real weather API call
        return `Weather for ${input.city}: 22°C, sunny`;
      },
      schema: z.object({
        city: z.string(),
      }),
    },
  },
  calculator: {
    add: {
      call: async (input: { a: number; b: number }) => {
        return input.a + input.b;
      },
      schema: z.object({
        a: z.number(),
        b: z.number(),
      }),
    },
  },
};

// Create your agent
const agent = new Saafir({
  name: "MyAssistant",
  apiKey: "your-openrouter-api-key", // OpenRouter API key
  model: "anthropic/claude-3-haiku",
  actions,
  context: "You are a helpful AI assistant that can help with weather and calculations.",
});

// Use it!
const result = await agent.run("What's the weather like in Istanbul?");
console.log(result); // "Weather for Istanbul: 22°C, sunny"
```

## 🎯 Action System

Saafir's powerful feature is its nested action tree system:

```typescript
const actions = {
  user: {
    profile: {
      get: { call: getUserProfile, schema: userSchema },
      update: { call: updateUserProfile, schema: updateSchema },
    },
    settings: {
      theme: { call: changeTheme, schema: themeSchema },
    },
  },
  data: {
    fetch: { call: fetchData, schema: fetchSchema },
    save: { call: saveData, schema: saveSchema },
  },
};
```

## 🤖 Role System Explanation

The `role` parameter in chat completions determines the context of the conversation:

### `system` Role
- **Purpose**: Tells the AI its identity and behavioral rules
- **Example**: "You are a weather assistant"
- **When**: At the beginning of conversation to provide context

### `user` Role  
- **Purpose**: Represents the user's actual question/request
- **Example**: "What's the weather like in Istanbul?"
- **When**: For user input

### `assistant` Role (not used)
- **Purpose**: Represents AI's previous responses
- **When**: To maintain conversation history

In your code example:
```typescript
const extractedJson = await this.chat([
  { role: 'system', content: this.context },      // Tells AI who it is
  { role: 'user', content: extractionPrompt },    // Gives the actual instruction
]);
```

## 🔧 API Reference

### Saafir Options

```typescript
interface SaafirOptions {
  name: string;           // Agent name
  apiKey: string;         // OpenRouter API key
  model: string;          // Model to use (e.g., "anthropic/claude-3-haiku")
  actions: ActionTree;    // Action definitions
  context?: string;       // System prompt (default: "You are a helpful AI agent.")
  referer?: string;       // HTTP-Referer header
  title?: string;         // X-Title header
}
```

### Action Definition

```typescript
interface ActionDefinition<TInput> {
  call: (input: TInput) => Promise<any>;  // Function to execute
  schema: ZodSchema<TInput>;              // Input validation schema
}
```

## 🧪 Testing

```bash
npm test
# or
yarn test
# or
bun test
```

## 📋 Supported Models

All models accessible through OpenRouter:
- **Anthropic**: Claude 3 Haiku, Sonnet, Opus
- **OpenAI**: GPT-4, GPT-3.5-turbo
- **Google**: Gemini Pro, Gemini Flash  
- **Meta**: Llama 2, Llama 3
- **Mistral**: Mistral 7B, Mixtral
- **Qwen**: Qwen-72B
- **DeepSeek**: DeepSeek Coder
- And many more...

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 👤 Author

**Kaan Mert**
- Email: kaanmertagyol@gmail.com

## 🙏 Acknowledgments

- [OpenRouter](https://openrouter.ai) - Amazing API gateway
- [Zod](https://zod.dev) - Runtime type validation
- [Vitest](https://vitest.dev) - Lightning fast testing

---

⭐ If you like this project, don't forget to give it a star!
