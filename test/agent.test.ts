import { Saafir } from "../index";
import { z } from "zod";
import { describe, it, expect } from "vitest";

describe("Saafir AI Integration Tests", () => {
  // Turkish actions
  const turkishActions = {
    havaDurumuSorgula: {
      call: async (input: { sehir: string }) => {
        return `${input.sehir} için hava durumu: 22°C, güneşli.`;
      },
      schema: z.object({
        sehir: z.string(),
      }),
      description: "Verilen şehrin hava durumunu sorgular.",
    },
    topla: {
      call: async (input: { a: number; b: number }) => {
        return input.a + input.b;
      },
      schema: z.object({
        a: z.number(),
        b: z.number(),
      }),
      description: "İki sayıyı toplar.",
    },
    carp: {
      call: async (input: { a: number; b: number }) => {
        return input.a * input.b;
      },
      schema: z.object({
        a: z.number(),
        b: z.number(),
      }),
      description: "İki sayıyı çarpar.",
    },
    gorevOlustur: {
      call: async (input: {
        baslik: string;
        aciklama: string;
        oncelik: "dusuk" | "orta" | "yuksek";
      }) => {
        return `Görev oluşturuldu: ${input.baslik} - ${input.aciklama} (Öncelik: ${input.oncelik})`;
      },
      schema: z.object({
        baslik: z.string(),
        aciklama: z.string(),
        oncelik: z.enum(["dusuk", "orta", "yuksek"]),
      }),
      description: "Yeni bir görev oluşturur.",
    },
  };

  // English actions
  const englishActions = {
    getWeather: {
      call: async (input: { city: string }) => {
        return `Weather for ${input.city}: 22°C, sunny.`;
      },
      schema: z.object({
        city: z.string(),
      }),
      description: "Gets the weather for a given city.",
    },
    addNumbers: {
      call: async (input: { a: number; b: number }) => {
        return input.a + input.b;
      },
      schema: z.object({
        a: z.number(),
        b: z.number(),
      }),
      description: "Adds two numbers together.",
    },
    multiplyNumbers: {
      call: async (input: { a: number; b: number }) => {
        return input.a * input.b;
      },
      schema: z.object({
        a: z.number(),
        b: z.number(),
      }),
      description: "Multiplies two numbers together.",
    },
    createTask: {
      call: async (input: {
        title: string;
        description: string;
        priority: "low" | "medium" | "high";
      }) => {
        return `Task created: ${input.title} - ${input.description} (Priority: ${input.priority})`;
      },
      schema: z.object({
        title: z.string(),
        description: z.string(),
        priority: z.enum(["low", "medium", "high"]),
      }),
      description: "Creates a new task.",
    },
  };

  // Turkish Tests
  it("Hava durumu sorgusu yapmalı", async () => {
    const mockAgent = new Saafir({
      name: "TestAsistan",
      apiKey: "fake-key",
      model: "test-model",
      actions: turkishActions,
      context: "Test context",
      mockChatResponse: `{
        "actionName": "havaDurumuSorgula",
        "parameters": {
          "sehir": "İstanbul"
        },
        "response": "İstanbul için hava durumu 22°C ve güneşli görünüyor."
      }`
    });

    const result = await mockAgent.run("İstanbul'un hava durumu nedir?");
    expect(result).toContain("İstanbul");
    expect(result).toContain("22°C");
  }, 15000);

  it("Doğal dil ile toplama işlemi yapmalı", async () => {
    const mockAgent = new Saafir({
      name: "TestAsistan",
      apiKey: "fake-key",
      model: "test-model",
      actions: turkishActions,
      context: "Test context",
      mockChatResponse: `{
        "actionName": "topla",
        "parameters": {
          "a": 15,
          "b": 25
        },
        "response": "15 + 25 = 40"
      }`
    });

    const result = await mockAgent.run("15 ile 25'i topla");
    expect(result).toContain("40");
  }, 15000);

  it("Doğal dil ile çarpma işlemi yapmalı", async () => {
    const mockAgent = new Saafir({
      name: "TestAsistan",
      apiKey: "fake-key",
      model: "test-model",
      actions: turkishActions,
      context: "Test context",
      mockChatResponse: `{
        "actionName": "carp",
        "parameters": {
          "a": 7,
          "b": 8
        },
        "response": "7 × 8 = 56"
      }`
    });

    const result = await mockAgent.run("7 ile 8'i çarp");
    expect(result).toContain("56");
  }, 15000);

  it("Doğal dil ile görev oluşturmalı", async () => {
    const mockAgent = new Saafir({
      name: "TestAsistan",
      apiKey: "fake-key",
      model: "test-model",
      actions: turkishActions,
      context: "Test context",
      mockChatResponse: `{
        "actionName": "gorevOlustur",
        "parameters": {
          "baslik": "Hata düzelt",
          "aciklama": "Giriş sorunu düzeltilecek",
          "oncelik": "yuksek"
        },
        "response": "Yüksek öncelikli 'Hata düzelt' görevi başarıyla oluşturuldu."
      }`
    });

    const result = await mockAgent.run(
      "Önceliği yüksek olan 'Hata düzelt' başlıklı ve 'Giriş sorunu düzeltilecek' açıklamalı görev oluştur"
    );
    expect(result).toContain("Hata düzelt");
    expect(result).toContain("başarıyla oluşturuldu");
  }, 15000);

  it("Türkçe doğal dil girişiyle hava durumunu anlayabilmeli", async () => {
    const mockAgent = new Saafir({
      name: "TestAsistan",
      apiKey: "fake-key",
      model: "test-model",
      actions: turkishActions,
      context: "Test context",
      mockChatResponse: `{
        "actionName": "havaDurumuSorgula",
        "parameters": {
          "sehir": "Ankara"
        },
        "response": "Ankara için hava durumu bilgilerini getiriyorum."
      }`
    });

    const result = await mockAgent.run("Ankara'nın hava durumu nasıl?");
    expect(result).toContain("Ankara");
  }, 15000);

  it("Türkçe doğal dil ile matematik işlemi yapabilmeli", async () => {
    const mockAgent = new Saafir({
      name: "TestAsistan",
      apiKey: "fake-key",
      model: "test-model",
      actions: turkishActions,
      context: "Test context",
      mockChatResponse: `{
        "actionName": "topla",
        "parameters": {
          "a": 123,
          "b": 456
        },
        "response": "123 + 456 = 579"
      }`
    });

    const result = await mockAgent.run("123 ile 456'yı topla");
    expect(result).toContain("579");
  }, 15000);

  // English Tests
  it("Should query weather information", async () => {
    const mockAgent = new Saafir({
      name: "TestAssistant",
      apiKey: "fake-key",
      model: "test-model",
      actions: englishActions,
      context: "Test context",
      mockChatResponse: `{
        "actionName": "getWeather",
        "parameters": {
          "city": "London"
        },
        "response": "The weather in London is 22°C and sunny."
      }`
    });

    const result = await mockAgent.run("What's the weather like in London?");
    expect(result).toContain("London");
    expect(result).toContain("22°C");
  }, 15000);

  it("Should perform addition with natural language", async () => {
    const mockAgent = new Saafir({
      name: "TestAssistant",
      apiKey: "fake-key",
      model: "test-model",
      actions: englishActions,
      context: "Test context",
      mockChatResponse: `{
        "actionName": "addNumbers",
        "parameters": {
          "a": 42,
          "b": 58
        },
        "response": "42 + 58 = 100"
      }`
    });

    const result = await mockAgent.run("Add 42 and 58");
    expect(result).toContain("100");
  }, 15000);

  it("Should perform multiplication with natural language", async () => {
    const mockAgent = new Saafir({
      name: "TestAssistant",
      apiKey: "fake-key",
      model: "test-model",
      actions: englishActions,
      context: "Test context",
      mockChatResponse: `{
        "actionName": "multiplyNumbers",
        "parameters": {
          "a": 9,
          "b": 7
        },
        "response": "9 × 7 = 63"
      }`
    });

    const result = await mockAgent.run("Multiply 9 by 7");
    expect(result).toContain("63");
  }, 15000);

  it("Should create task with natural language", async () => {
    const mockAgent = new Saafir({
      name: "TestAssistant",
      apiKey: "fake-key",
      model: "test-model",
      actions: englishActions,
      context: "Test context",
      mockChatResponse: `{
        "actionName": "createTask",
        "parameters": {
          "title": "Fix bug",
          "description": "Login issue needs to be resolved",
          "priority": "high"
        },
        "response": "High priority task 'Fix bug' has been successfully created."
      }`
    });

    const result = await mockAgent.run(
      "Create a high priority task titled 'Fix bug' with description 'Login issue needs to be resolved'"
    );
    expect(result).toContain("Fix bug");
    expect(result).toContain("successfully created");
  }, 15000);

  it("Should understand English natural language for weather", async () => {
    const mockAgent = new Saafir({
      name: "TestAssistant",
      apiKey: "fake-key",
      model: "test-model",
      actions: englishActions,
      context: "Test context",
      mockChatResponse: `{
        "actionName": "getWeather",
        "parameters": {
          "city": "New York"
        },
        "response": "Getting weather information for New York."
      }`
    });

    const result = await mockAgent.run("How's the weather in New York?");
    expect(result).toContain("New York");
  }, 15000);

  it("Should perform math operations with English natural language", async () => {
    const mockAgent = new Saafir({
      name: "TestAssistant",
      apiKey: "fake-key",
      model: "test-model",
      actions: englishActions,
      context: "Test context",
      mockChatResponse: `{
        "actionName": "addNumbers",
        "parameters": {
          "a": 789,
          "b": 321
        },
        "response": "789 + 321 = 1110"
      }`
    });

    const result = await mockAgent.run("Add 789 and 321");
    expect(result).toContain("1110");
  }, 15000);
});
