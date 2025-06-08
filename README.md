# 🤖 Saafir (سفير) - AI Agent Framework

> [🇹🇷 Türkçe README için tıklayın](README.tr.md)

**Saafir** (meaning "ambassador" in Arabic) is a powerful and flexible AI agent framework written in TypeScript. It works with various AI models like Claude, ChatGPT, Gemini, Qwen, DeepSeek through the OpenRouter API.

## ✨ Features

- 🌐 **Multi-Model Support**: 50+ AI models through OpenRouter
- 🎯 **Simple Action System**: Flat action structure for easy management
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
  getCurrentWeather: {
    call: async (input: { city: string }) => {
      // Real weather API call
      return `Weather for ${input.city}: 22°C, sunny`;
    },
    schema: z.object({
      city: z.string(),
    }),
    description: "Gets current weather for a city",
  },
  addNumbers: {
    call: async (input: { a: number; b: number }) => {
      return input.a + input.b;
    },
    schema: z.object({
      a: z.number(),
      b: z.number(),
    }),
    description: "Adds two numbers together",
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

Saafir uses a simple flat action structure where each action is defined at the root level:

```typescript
const actions = {
  getCurrentWeather: {
    call: async (input: { city: string }) => {
      return `Weather for ${input.city}: 22°C, sunny`;
    },
    schema: z.object({
      city: z.string(),
    }),
    description: "Gets current weather for a city",
  },
  addNumbers: {
    call: async (input: { a: number; b: number }) => {
      return input.a + input.b;
    },
    schema: z.object({
      a: z.number(),
      b: z.number(),
    }),
    description: "Adds two numbers together",
  },
  createTask: {
    call: async (input: { title: string; description: string; priority: string }) => {
      return `Task created: ${input.title}`;
    },
    schema: z.object({
      title: z.string(),
      description: z.string(),
      priority: z.enum(["low", "medium", "high"]),
    }),
    description: "Creates a new task",
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
  actions: Actions;       // Flat action definitions
  context?: string;       // System prompt (default: "You are a helpful AI agent.")
  referer?: string;       // HTTP-Referer header
  title?: string;         // X-Title header
}
```

### Action Definition

```typescript
interface ActionDefinition<TInput> {
  call: (input: TInput) => Promise<any>;     // Function to execute
  schema: ZodSchema<TInput>;                 // Input validation schema
  description: string;                       // Action description for AI
}

// Actions is a flat object mapping action names to definitions
type Actions = Record<string, ActionDefinition<any>>;
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
