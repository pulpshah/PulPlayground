export type JSONPrimitive = string | number | boolean | null;
export type JSONValue = JSONPrimitive | JSONObject | JSONArray;
export interface JSONObject { [key: string]: JSONValue | JSONArray | JSONObject; }
export type JSONArray = Array<JSONValue>

export interface RunNode {
  id: string;
  input: JSONObject;              // Strict JSON object
  output: JSONObject;             // Strict JSON output
  rawOutput: string;             
  tokenUsage: number;
  promptTokens: number;
  responseTokens: number;
  estimatedCost: number;
  latencyMs: number;
  createdAt: string;
  promptVersionId: string;        // Reference to the prompt version
}

export interface RunPromptParams {
  systemPrompt: string;
  userPrompt: string;
  inputs: Record<string, string>;
  model: string;
  temperature: number;
  max_tokens: number;
  max_retries: number;
}

export interface SaveRunParams {
  versionId: string;
  input: Record<string, string>;
  output: string | JSONObject;
  rawOutput: string;
  tokenUsage: number;
  promptTokens: number;
  responseTokens: number;
  estimatedCost: number;
  latencyMs: number;
}
