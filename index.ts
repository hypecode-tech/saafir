import OpenAI from "openai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
// Renkli console çıktısı için / For colorful console output
import chalk from "chalk";

export type ActionFunction<TInput> = (input: TInput) => Promise<any>;

export interface ActionDefinition<TInput> {
  call: ActionFunction<TInput>;
  schema: z.Schema<TInput>;
  description?: string; // Açıklama alanı (isteğe bağlı) / Description field (optional)
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
  debug?: boolean; // Debug modu eklendi / Debug mode added
  mockChatResponse?: string; // Test için mock response / Mock response for testing
  language?: string; // Yanıt dili (örn: "Turkish", "English", "Spanish") / Response language (e.g: "Turkish", "English", "Spanish")
}

export class Saafir {
  private readonly name: string;
  private readonly actions: ActionTree;
  private readonly context: string;
  private readonly model: string;
  private readonly openai: OpenAI;
  private readonly debug: boolean;
  private readonly mockChatResponse?: string;
  private readonly language: string;

  constructor(options: SaafirOptions) {
    this.name = options.name;
    this.model = options.model;
    this.actions = options.actions;
    this.debug = options.debug || false;
    this.mockChatResponse = options.mockChatResponse;
    this.language = options.language || "English";

    // Actions metadata (isim, açıklama, şema) / Actions metadata (name, description, schema)
    const actionsMetadata = Object.entries(this.actions).map(
      ([name, action]) => {
        return {
          name,
          description: action.description || "No description available.",
          schema: zodToJsonSchema(action.schema),
        };
      }
    );

    this.context =
      options.context ||
      `You are a helpful AI assistant.
Available actions:
${actionsMetadata
  .map((a) => {
    return `- ${a.name}: ${a.description}\n  Schema: ${JSON.stringify(a.schema)}`;
  })
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
    // Test için mock response varsa onu döndür / Return mock response if available for testing
    if (this.mockChatResponse) {
      return this.mockChatResponse;
    }

    const res = await this.openai.chat.completions.create({
      model: this.model,
      messages,
    });
    return res.choices?.[0]?.message?.content?.trim() ?? "";
  }

  // In Zod v4+ toJSONSchema
  // Example Usage:
  // import { z } from "zod/v4";
  // const schema = z.object({ name: z.string(), age: z.number() });
  // z.toJSONSchema(schema)
  // => {
  //   type: 'object',
  //   properties: { name: { type: 'string' }, age: { type: 'number' } },
  //   required: [ 'name', 'age' ],
  //   additionalProperties: false,
  // }
  // Example source: https://zod.dev/json-schema

  private async determineActionAndExtractParams(
    input: string
  ): Promise<{ actionName: string; parameters: any; response: string }> {
    this.debugLog('INPUT', 'User input received', { input });

    // Action listesini hazırla / Prepare action list
    const actionListStr = Object.entries(this.actions)
      .map(
        ([name, action]) => {
          return `Action: "${name}"\nDescription: ${action.description || "No description available"}\nSchema: ${JSON.stringify(zodToJsonSchema(action.schema))}`;
        }
      )
      .join("\n\n");

    this.debugLog('ACTIONS', 'Available actions prepared', {
      actionCount: Object.keys(this.actions).length,
      actions: Object.keys(this.actions)
    });

    if (this.debug) {
      console.log(chalk.gray('─'.repeat(60)));
      console.log(chalk.yellow.bold('🔍 ACTION DETAILS:'));
      Object.entries(this.actions).forEach(([name, action]) => {
        console.log(chalk.blue(`  • ${name}:`), action.description || "No description available");
        console.log(chalk.gray(`    Schema: ${JSON.stringify(zodToJsonSchema(action.schema))}`));
      });
      console.log(chalk.gray('─'.repeat(60)));
    }

    const prompt = `You are an AI assistant. Based on the user's input and the available actions below, select the most appropriate action and extract parameters according to its schema.

${actionListStr}

User input: "${input}"

After selecting the action and extracting parameters, prepare a user-friendly response in ${this.language}. The response should be concise and clear.

IMPORTANT: 
- Action names and parameter names must remain exactly as defined in the schema
- Only the response text should be in ${this.language}
- Parameter values should match the schema types exactly
- Make sure ISO date strings are strictly valid (e.g., 'YYYY-MM-DDTHH:MM:SSZ' where SS is max 59)
- If no year is specified in the user input, use the current year (${new Date().getFullYear()}) as default

Return only a JSON in the following format:
- "actionName": string, the exact name of the selected action
- "parameters": object, parameters extracted according to the schema
- "response": string, user-friendly response in ${this.language}

Do not include any other text, explanations, or markdown. Return only JSON.`;

    this.debugLog('AI_REQUEST', 'Sending request to AI', {
      promptLength: prompt.length,
      language: this.language
    });

    const response = await this.chat([
      { role: "system", content: this.context },
      { role: "user", content: prompt },
    ]);

    this.debugLog('AI_RESPONSE', 'Received response from AI', { 
      responseLength: response.length,
      response: response.substring(0, 200) + (response.length > 200 ? '...' : '')
    });

    try {
      this.debugLog('PARSING', 'Parsing AI response');
      
      const clean = response.replace(/^```json\n|```$/g, "").trim();
      const parsed = JSON.parse(clean);

      if (
        typeof parsed.actionName === "string" &&
        typeof parsed.parameters === "object" &&
        typeof parsed.response === "string"
      ) {
        this.debugLog('VALIDATION', 'AI response validated successfully', {
          selectedAction: parsed.actionName,
          parameters: parsed.parameters
        });
        return parsed;
      }
      throw new Error("Invalid format returned from AI");
    } catch (err) {
      this.debugLog('ERROR', 'JSON parsing failed', { error: err });
      throw new Error(`AI response is not valid JSON: ${response}`);
    }
  }

  private preprocessParameters(parameters: any, schema: z.Schema<any>): any {
    // Eğer schema bir object değilse, direk döndür / If schema is not an object, return directly
    if (!(schema instanceof z.ZodObject)) {
      return parameters;
    }

    const processed = { ...parameters };
    const shape = schema.shape;

    // Her property için kontrol et / Check each property
    Object.keys(shape).forEach(key => {
      const fieldSchema = shape[key];
      
      // String to Date conversion - AI'dan gelen string tarihlerini Date objesine çevir
      // String to Date conversion - Convert string dates from AI to Date objects
      if (fieldSchema instanceof z.ZodDate && 
          processed[key] && 
          typeof processed[key] === 'string') {
        try {
          processed[key] = new Date(processed[key]);
        } catch (error) {
          // Date parsing başarısız olursa orijinal değeri koru / Keep original value if date parsing fails
          this.debugLog('WARNING', `Date conversion failed for field ${key}`, { 
            originalValue: processed[key], 
            error 
          });
        }
      }
      
      // Optional Date conversion - Eğer optional bir date ise / If it's an optional date
      if (fieldSchema instanceof z.ZodOptional && 
          fieldSchema._def.innerType instanceof z.ZodDate &&
          processed[key] && 
          typeof processed[key] === 'string') {
        try {
          processed[key] = new Date(processed[key]);
        } catch (error) {
          this.debugLog('WARNING', `Optional date conversion failed for field ${key}`, { 
            originalValue: processed[key], 
            error 
          });
        }
      }

      // String to Boolean conversion - AI'dan gelen string boolean'ları boolean'a çevir
      // String to Boolean conversion - Convert string booleans from AI to boolean
      if (fieldSchema instanceof z.ZodBoolean && 
          processed[key] !== undefined && 
          typeof processed[key] === 'string') {
        const stringValue = processed[key].toLowerCase();
        if (stringValue === 'true' || stringValue === '1' || stringValue === 'yes') {
          processed[key] = true;
        } else if (stringValue === 'false' || stringValue === '0' || stringValue === 'no') {
          processed[key] = false;
        } else {
          this.debugLog('WARNING', `Boolean conversion failed for field ${key}`, { 
            originalValue: processed[key] 
          });
        }
      }

      // Optional Boolean conversion - Eğer optional bir boolean ise / If it's an optional boolean
      if (fieldSchema instanceof z.ZodOptional && 
          fieldSchema._def.innerType instanceof z.ZodBoolean &&
          processed[key] !== undefined && 
          typeof processed[key] === 'string') {
        const stringValue = processed[key].toLowerCase();
        if (stringValue === 'true' || stringValue === '1' || stringValue === 'yes') {
          processed[key] = true;
        } else if (stringValue === 'false' || stringValue === '0' || stringValue === 'no') {
          processed[key] = false;
        } else {
          this.debugLog('WARNING', `Optional boolean conversion failed for field ${key}`, { 
            originalValue: processed[key] 
          });
        }
      }

      // String to Array conversion - AI'dan gelen string array'leri array'e çevir
      // String to Array conversion - Convert string arrays from AI to array
      if (fieldSchema instanceof z.ZodArray && 
          processed[key] && 
          typeof processed[key] === 'string') {
        try {
          // JSON string olarak parse etmeyi dene / Try to parse as JSON string
          processed[key] = JSON.parse(processed[key]);
        } catch (error) {
          // JSON parse edilemezse virgülle ayrılmış string olarak dene / If JSON parsing fails, try comma-separated string
          try {
            processed[key] = processed[key].split(',').map((item: string) => item.trim());
          } catch (splitError) {
            this.debugLog('WARNING', `Array conversion failed for field ${key}`, { 
              originalValue: processed[key], 
              error 
            });
          }
        }
      }

      // Optional Array conversion - Eğer optional bir array ise / If it's an optional array
      if (fieldSchema instanceof z.ZodOptional && 
          fieldSchema._def.innerType instanceof z.ZodArray &&
          processed[key] && 
          typeof processed[key] === 'string') {
        try {
          processed[key] = JSON.parse(processed[key]);
        } catch (error) {
          try {
            processed[key] = processed[key].split(',').map((item: string) => item.trim());
          } catch (splitError) {
            this.debugLog('WARNING', `Optional array conversion failed for field ${key}`, { 
              originalValue: processed[key], 
              error 
            });
          }
        }
      }

      // String to Object conversion - AI'dan gelen string object'leri object'e çevir
      // String to Object conversion - Convert string objects from AI to object
      if (fieldSchema instanceof z.ZodObject && 
          processed[key] && 
          typeof processed[key] === 'string') {
        try {
          processed[key] = JSON.parse(processed[key]);
        } catch (error) {
          this.debugLog('WARNING', `Object conversion failed for field ${key}`, { 
            originalValue: processed[key], 
            error 
          });
        }
      }

      // Optional Object conversion - Eğer optional bir object ise / If it's an optional object
      if (fieldSchema instanceof z.ZodOptional && 
          fieldSchema._def.innerType instanceof z.ZodObject &&
          processed[key] && 
          typeof processed[key] === 'string') {
        try {
          processed[key] = JSON.parse(processed[key]);
        } catch (error) {
          this.debugLog('WARNING', `Optional object conversion failed for field ${key}`, { 
            originalValue: processed[key], 
            error 
          });
        }
      }

      // TODO: İleride başka dönüşümler buraya eklenebilir
      // TODO: Future conversions can be added here
      // - Number conversions (string → number)
      // - Custom transformations
      // - Nested object preprocessing
    });

    return processed;
  }

  public async run(input: string): Promise<any> {
    try {
      this.debugLog('INIT', 'Starting Saafir execution', {
        name: this.name,
        model: this.model,
        language: this.language
      });

      const { actionName, parameters, response } =
        await this.determineActionAndExtractParams(input);
      
      const action = this.findActionByName(actionName);

      if (!action) {
        this.debugLog('ERROR', 'Action not found', { actionName });
        throw new Error(`Action "${actionName}" not found.`);
      }

      this.debugLog('VALIDATION', 'Validating parameters with schema');
      
      // AI'dan gelen parametreleri ön işleme tabi tut / Preprocess parameters from AI
      const processedParams = this.preprocessParameters(parameters, action.schema);
      
      const validatedParams = action.schema.parse(processedParams);

      this.debugLog('EXECUTION', 'Executing action', {
        actionName,
        parameters: validatedParams
      });

      // Action'ı çalıştır (sonuç kullanılmayabilir, sadece side effect için) / Run action (result may not be used, only for side effects)
      const result = await action.call(validatedParams);

      this.debugLog('RESULT', 'Action executed successfully', {
        actionResult: result,
        aiResponse: response
      });

      console.log(chalk.gray('═'.repeat(60)));
      console.log(chalk.green.bold('✅ EXECUTION COMPLETED SUCCESSFULLY'));
      console.log(chalk.gray('═'.repeat(60)));

      // AI'ın hazırladığı response'u döndür / Return AI prepared response
      return response;
    } catch (error) {
      this.debugLog('ERROR', 'Execution failed', { error });
      
      console.log(chalk.gray('═'.repeat(60)));
      console.log(chalk.red.bold('❌ EXECUTION FAILED'));
      console.log(chalk.gray('═'.repeat(60)));
      
      throw new Error(`Error occurred while running action: ${error}`);
    }
  }

  private debugLog(stage: string, message: string, data?: any) {
    if (!this.debug) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const stageColors = {
      'INIT': chalk.blue,
      'INPUT': chalk.green, 
      'ACTIONS': chalk.yellow,
      'AI_REQUEST': chalk.magenta,
      'AI_RESPONSE': chalk.cyan,
      'PARSING': chalk.cyanBright,
      'VALIDATION': chalk.cyanBright.bold,
      'EXECUTION': chalk.red,
      'RESULT': chalk.green.bold,
      'ERROR': chalk.red.bold
    };
    
    const colorFn = stageColors[stage as keyof typeof stageColors] || chalk.white;
    
    console.log(chalk.gray(`[${timestamp}]`) + ' ' + colorFn(`[${stage}]`) + ' ' + message);
    
    if (data) {
      console.log(chalk.gray('  └─ ') + JSON.stringify(data, null, 2));
    }
    console.log(); // Boş satır ekle / Add empty line
  }
}
