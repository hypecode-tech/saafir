# 🤖 Saafir (سفير) - AI Agent Framework

**Saafir** (Arapça'da "elçi/büyükelçi" anlamına gelir) TypeScript ile yazılmış güçlü ve esnek bir AI agent framework'üdür. OpenRouter API'sini kullanarak Claude, ChatGPT, Gemini, Qwen, DeepSeek gibi farklı AI modelleriyle çalışabilir.

## ✨ Özellikler

- 🌐 **Çoklu Model Desteği**: OpenRouter üzerinden 50+ AI modeli
- 🎯 **Akıllı Action Sistemi**: Nested action tree yapısı
- 🔍 **Otomatik Intent Detection**: Kullanıcı girdisinden otomatik action belirleme
- 📝 **Zod Schema Validation**: Tip güvenli input validasyonu  
- 🚀 **TypeScript**: Full type safety
- 🧪 **Test Ready**: Vitest ile test edilmiş

## 📦 Kurulum

```bash
npm install saafir
# veya
yarn add saafir
# veya
bun add saafir
```

## 🚀 Hızlı Başlangıç

```typescript
import { Saafir } from 'saafir';
import { z } from 'zod';

// Action'larınızı tanımlayın
const actions = {
  weather: {
    getCurrentWeather: {
      call: async (input: { city: string }) => {
        // Gerçek hava durumu API'si çağrısı
        return `${input.city} için hava durumu: 22°C, güneşli`;
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

// Agent'ınızı oluşturun
const agent = new Saafir({
  name: "MyAssistant",
  apiKey: "your-openrouter-api-key", // OpenRouter API key
  model: "anthropic/claude-3-haiku",
  actions,
  context: "Sen yardımcı bir AI asistanısın. Hava durumu ve hesaplama konularında yardım edebilirsin.",
});

// Kullanın!
const result = await agent.run("İstanbul'un hava durumu nasıl?");
console.log(result); // "İstanbul için hava durumu: 22°C, güneşli"
```

## 🎯 Action Sistemi

Saafir'in güçlü yanı nested action tree sistemidir:

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

## 🤖 Role Sistemi Açıklaması

Chat completion'larda `role` parametresi conversation'ın bağlamını belirler:

### `system` Role
- **Amaç**: AI'ya kimliğini ve davranış kurallarını söyler
- **Örnek**: "Sen bir hava durumu asistanısın"
- **Ne Zaman**: Conversation başlangıcında context vermek için

### `user` Role  
- **Amaç**: Kullanıcının gerçek sorusunu/isteğini temsil eder
- **Örnek**: "İstanbul'un hava durumu nasıl?"
- **Ne Zaman**: Kullanıcı input'u için

### `assistant` Role (kullanılmamış)
- **Amaç**: AI'nın önceki cevaplarını temsil eder
- **Ne Zaman**: Conversation history tutmak için

Kod örneğinizde:
```typescript
const extractedJson = await this.chat([
  { role: 'system', content: this.context },      // AI'ya kim olduğunu söylüyor
  { role: 'user', content: extractionPrompt },    // Gerçek talimatı veriyor
]);
```

## 🔧 API Referansı

### Saafir Options

```typescript
interface SaafirOptions {
  name: string;           // Agent adı
  apiKey: string;         // OpenRouter API key
  model: string;          // Kullanılacak model (ör: "anthropic/claude-3-haiku")
  actions: ActionTree;    // Action tanımları
  context?: string;       // System prompt (varsayılan: "You are a helpful AI agent.")
  referer?: string;       // HTTP-Referer header
  title?: string;         // X-Title header
}
```

### Action Definition

```typescript
interface ActionDefinition<TInput> {
  call: (input: TInput) => Promise<any>;  // Execute edilecek fonksiyon
  schema: ZodSchema<TInput>;              // Input validation schema'sı
}
```

## 🧪 Test Etme

```bash
npm test
# veya
yarn test  
# veya
bun test
```

## 📋 Desteklenen Modeller

OpenRouter üzerinden erişilebilen tüm modeller:
- **Anthropic**: Claude 3 Haiku, Sonnet, Opus
- **OpenAI**: GPT-4, GPT-3.5-turbo
- **Google**: Gemini Pro, Gemini Flash  
- **Meta**: Llama 2, Llama 3
- **Mistral**: Mistral 7B, Mixtral
- **Qwen**: Qwen-72B
- **DeepSeek**: DeepSeek Coder
- Ve daha fazlası...

## 🤝 Katkıda Bulunma

1. Fork'layın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit'leyin (`git commit -m 'feat: add amazing feature'`)
4. Push'layın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

MIT License - detaylar için [LICENSE](LICENSE) dosyasını inceleyin.

## 👤 Yazar

**Kaan Mert**
- Email: kaanmertagyol@gmail.com

## 🙏 Teşekkürler

- [OpenRouter](https://openrouter.ai) - Muhteşem API gateway
- [Zod](https://zod.dev) - Runtime type validation
- [Vitest](https://vitest.dev) - Lightning fast testing

---

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!
