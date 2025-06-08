import OpenAI from 'openai';
import { ZodSchema } from 'zod';

/* 
* Action Function Type refers to a function which takes an input of type TInput and returns a Promise of any type.
*/
export type ActionFunction<TInput> = (input: TInput) => Promise<any>;

export interface ActionDefinition<TInput> {
  call: ActionFunction<TInput>; // The function to call when the action is executed
  schema: ZodSchema<TInput>;    // The Zod schema to validate the input for this action
}

export type ActionTree = {
  [key: string]: ActionTree | ActionDefinition<any>;
};

export interface SaafirOptions {
  name        : string;
  apiKey      : string;
  model       : string;
  actions     : ActionTree;
  context?    : string;
  referer?    : string;
  title?      : string;
}

export class Saafir {
  private readonly name       : string;
  private readonly actions    : ActionTree;
  private readonly context    : string;
  private readonly model      : string;
  private readonly openai     : OpenAI;

  constructor(options: SaafirOptions) {
    this.name = options.name;       // Your agent's name
    this.model = options.model;     // The model which you want to use.
    this.actions = options.actions; // Actions
    /* 
    * Here is IMPORTANT:
    * Your context should be relevant to actions you have defined.
    * For example, if you want to create an agent which able to answer questions about weather,
    * then you should set context to something like "You are a weather assistant that provides accurate weather information."
    */
    this.context = options.context || "You are a helpful AI agent."; 


    // Saafir uses (سفير) OpenRouter API, which is a wrapper around OpenAI's API. 
    // The main reason for using OpenRouter is that it is so flexible and allows to use different models like Claude,ChatGPT, Gemini, Qwen, DeepSeek and more.
    this.openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1", 
      apiKey: options.apiKey, // Your OpenRouter API key
      defaultHeaders: { // These headers are used to provide additional context to the API and they are also optional
        ...(options.referer && { "HTTP-Referer": options.referer }),
        ...(options.title && { "X-Title": options.title }),
      },
    });
  }

  private findAction(path: string[], current: ActionTree): ActionDefinition<any> | null {
    if (path.length === 0) return null;
    
    // Eğer tek bir string verilmişse, tüm tree'de ara
    if (path.length === 1) {
      const directResult = this.findActionByName(path[0], current);
      if (directResult) return directResult;
    }
    
    const [head, ...tail] = path;
    if (!head || !(head in current)) return null;
    const next = current[head];
    if (!next) return null;
    
    // ActionDefinition kontrolü
    if ('call' in next && 'schema' in next) {
      if (tail.length === 0) {
        return next as ActionDefinition<any>;
      }
      return null; // Daha derin path varsa ama bu bir ActionDefinition ise null dön
    }
    
    // ActionTree kontrolü
    if (typeof next === 'object' && !('call' in next) && !('schema' in next)) {
      return this.findAction(tail, next as ActionTree);
    }
    
    return null;
  }

  private findActionByName(actionName: string, tree: ActionTree): ActionDefinition<any> | null {
    for (const key in tree) {
      const value = tree[key];
      
      // Eğer key action adına eşitse ve bu bir ActionDefinition ise
      if (key === actionName && 'call' in value && 'schema' in value) {
        return value as ActionDefinition<any>;
      }
      
      // Eğer bu bir ActionTree ise, recursive olarak ara
      if (typeof value === 'object' && !('call' in value) && !('schema' in value)) {
        const result = this.findActionByName(actionName, value as ActionTree);
        if (result) return result;
      }
    }
    
    return null;
  }

  private async chat(messages: { role: 'user' | 'system'; content: string }[]): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages,
    });
    return (response.choices?.[0]?.message?.content || '').trim();
  }

  private async determineAction(input: string): Promise<string[]> {
    const prompt = `${this.context}\nGiven the following input, return the path to the most appropriate action from a nested action tree in dot notation. Do not include intermediate categories.\nInput: "${input}"`;
    const response = await this.chat([
      { role: 'system', content: this.context },
      { role: 'user', content: prompt },
    ]);
    return response.replace(/"/g, '').split(".").filter(Boolean);
  }

  public async run(input: string): Promise<any> {
    const path = await this.determineAction(input);
    const action = this.findAction(path, this.actions);
    if (!action) throw new Error("Action not found.");

    const schemaStr = JSON.stringify(action.schema.describe);
    const extractionPrompt = `${this.context}\nAccording to this JSON schema: ${schemaStr}, extract the correct data from the original input If input don't contain enough information to fill the schema then make aware the user about that issue.\nOriginal: ${input}`;

    const extractedJson = await this.chat([
      { role: 'system', content: this.context },
      { role: 'user', content: extractionPrompt },
    ]);

    const parsedInput = JSON.parse(extractedJson);
    const validated = action.schema.parse(parsedInput);
    return action.call(validated);
  }
}

