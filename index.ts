import OpenAI from "openai";
import { ZodSchema } from "zod";

export type ActionFunction<TInput> = (input: TInput) => Promise<any>;

export interface ActionDefinition<TInput> {
  call: ActionFunction<TInput>;
  schema: ZodSchema<TInput>;
  description?: string; // Açıklama alanı (isteğe bağlı)
}

export type ActionTree = {
  [key: string]: ActionDefinition<any>;
};

export interface SaafirOptions {
  name: string;
  apiKey: string;
  model: string;
  actions: ActionTree;
  context?: string;
  referer?: string;
  title?: string;
  debug?: boolean; // Debug modu eklendi
  mockChatResponse?: string; // Test için mock response
}

export class Saafir {
  private readonly name: string;
  private readonly actions: ActionTree;
  private readonly context: string;
  private readonly model: string;
  private readonly openai: OpenAI;
  private readonly debug: boolean;
  private readonly mockChatResponse?: string;

  constructor(options: SaafirOptions) {
    this.name = options.name;
    this.model = options.model;
    this.actions = options.actions;
    this.debug = options.debug || false;
    this.mockChatResponse = options.mockChatResponse;

    // Actions metadata (isim, açıklama, şema)
    const actionsMetadata = Object.entries(this.actions).map(
      ([name, action]) => ({
        name,
        description: action.description || "Açıklama yok.",
        schema: JSON.stringify(action.schema),
      })
    );

    this.context =
      options.context ||
      `Sen yardımcı bir yapay zekâ asistanısın.
Mevcut işlemler:
${actionsMetadata
  .map((a) => `- ${a.name}: ${a.description}\n  Şema: ${a.schema}`)
  .join("\n")}`;

    this.openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: options.apiKey,
      defaultHeaders: {
        ...(options.referer && { "HTTP-Referer": options.referer }),
        ...(options.title && { "X-Title": options.title }),
      },
    });
  }

  private findActionByName(name: string): ActionDefinition<any> | null {
    return this.actions[name] ?? null;
  }

  private async chat(
    messages: { role: "user" | "system"; content: string }[]
  ): Promise<string> {
    // Test için mock response varsa onu döndür
    if (this.mockChatResponse) {
      return this.mockChatResponse;
    }

    const res = await this.openai.chat.completions.create({
      model: this.model,
      messages,
    });
    return res.choices?.[0]?.message?.content?.trim() ?? "";
  }

  private async determineActionAndExtractParams(
    input: string
  ): Promise<{ actionName: string; parameters: any; response: string }> {
    const actionListStr = Object.entries(this.actions)
      .map(
        ([name, action]) =>
          `İşlem: "${name}"\nAçıklama: ${
            action.description || "Açıklama yok"
          }\nŞema: ${JSON.stringify(action.schema)}`
      )
      .join("\n\n");

    const prompt = `Sen bir yapay zekâ asistanısın. Kullanıcının girdisi ve aşağıdaki işlemler göz önüne alındığında, en uygun işlemi seç ve parametreleri şemasına göre çıkar.

${actionListStr}

Kullanıcı girişi: "${input}"

İşlemi seçtikten ve parametreleri çıkardıktan sonra, kullanıcıya verilecek cevabı da hazırla. Cevap kullanıcı dostu, kısa ve net olmalı.

Sadece aşağıdaki formatta bir JSON döndür:
- "actionName": string, seçilen işlemin adı
- "parameters": object, şemaya uygun çıkarılan parametreler
- "response": string, kullanıcıya verilecek cevap (işlem başarılı mesajı veya sonuç açıklaması)

Başka metin, açıklama veya markdown kullanma. Sadece JSON döndür.`;

    const response = await this.chat([
      { role: "system", content: this.context },
      { role: "user", content: prompt },
    ]);

    if (this.debug) console.log("[DEBUG] Yapay zekâ cevabı:", response);

    try {
      const clean = response.replace(/^```json\n|```$/g, "").trim();
      const parsed = JSON.parse(clean);

      if (
        typeof parsed.actionName === "string" &&
        typeof parsed.parameters === "object" &&
        typeof parsed.response === "string"
      ) {
        if (this.debug)
          console.log(`[DEBUG] Seçilen işlem: ${parsed.actionName}`);
        return parsed;
      }
      throw new Error("Yapay zekâdan geçersiz format döndü");
    } catch (err) {
      if (this.debug) console.error("[DEBUG] JSON ayrıştırma hatası:", err);
      throw new Error(`Yapay zekâ cevabı geçerli JSON değil: ${response}`);
    }
  }

  public async run(input: string): Promise<any> {
    try {
      const { actionName, parameters, response } =
        await this.determineActionAndExtractParams(input);
      const action = this.findActionByName(actionName);

      if (!action) {
        throw new Error(`İşlem "${actionName}" bulunamadı.`);
      }

      const validatedParams = action.schema.parse(parameters);

      if (this.debug) {
        console.log(
          `[DEBUG] "${actionName}" işlemi çalıştırılıyor, parametreler:`,
          validatedParams
        );
      }

      // Action'ı çalıştır (sonuç kullanılmayabilir, sadece side effect için)
      const result = await action.call(validatedParams);
      
      if (this.debug) {
        console.log(`[DEBUG] Action sonucu:`, result);
        console.log(`[DEBUG] AI hazırladığı yanıt:`, response);
      }

      // AI'ın hazırladığı response'u döndür
      return response;
    } catch (error) {
      if (this.debug) {
        console.error("[DEBUG] Hata oluştu:", error);
      }
      throw new Error(`İşlem çalıştırılırken hata oluştu: ${error}`);
    }
  }
}
