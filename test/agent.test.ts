import { Saafir } from "../index";
import { z } from "zod";
import { describe, it, expect, vi } from "vitest";

describe("Saafir Tests", () => {
  // Mock OpenAI API çağrıları
  vi.mock("openai", () => ({
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn()
        }
      }
    }))
  }));

  const actions = {
    weather: {
      getCurrentWeather: {
        call: async (input: { city: string }) => {
          return `Hava durumu ${input.city} için: 22°C, güneşli`;
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
      multiply: {
        call: async (input: { a: number; b: number }) => {
          return input.a * input.b;
        },
        schema: z.object({
          a: z.number(),
          b: z.number(),
        }),
      },
    },
    user: {
      profile: {
        getUserInfo: {
          call: async (input: { userId: string }) => {
            return {
              id: input.userId,
              name: "Test Kullanıcı",
              email: "test@example.com"
            };
          },
          schema: z.object({
            userId: z.string(),
          }),
        },
      },
    },
  };

  const agent = new Saafir({
    name: "TestAgent",
    apiKey: "test-api-key",
    model: "anthropic/claude-3-haiku",
    actions,
    context: "Sen yardımcı bir AI asistanısın. Hava durumu, hesaplama ve kullanıcı bilgileri konusunda yardım edebilirsin.",
  });

  it("should find weather action correctly", async () => {
    const action = (agent as any).findAction(['weather', 'getCurrentWeather'], actions);
    expect(action).toBeDefined();
    expect(action?.schema).toBeDefined();
    expect(action?.call).toBeDefined();
  });

  it("should find calculator add action correctly", async () => {
    const action = (agent as any).findAction(['calculator', 'add'], actions);
    expect(action).toBeDefined();
    const result = await action?.call({ a: 5, b: 3 });
    expect(result).toBe(8);
  });

  it("should find nested user profile action correctly", async () => {
    const action = (agent as any).findAction(['user', 'profile', 'getUserInfo'], actions);
    expect(action).toBeDefined();
    const result = await action?.call({ userId: "123" });
    expect(result).toEqual({
      id: "123",
      name: "Test Kullanıcı",
      email: "test@example.com"
    });
  });

  it("should return null for non-existent action", async () => {
    const action = (agent as any).findAction(['nonexistent', 'action'], actions);
    expect(action).toBeNull();
  });

  it("should handle empty path", async () => {
    const action = (agent as any).findAction([], actions);
    expect(action).toBeNull();
  });
});
