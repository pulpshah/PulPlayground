export interface PromptNode {
    id: string;               // Neo4j UUID
    name: string;
    description?: string;
    projectId: string;        // Project ID this prompt belongs to
    createdAt: string;        // ISO timestamp
    updatedAt: string;
    latestVersion?: PromptVersionNode | null;
    versions?: PromptVersionNode[];
}

export interface PromptVersionNode {
    id: string;                      // UUID
    versionNumber: number;           // Auto-incremented
    template: string;                // Optional: full template if you want
    systemPrompt: string;            // Actual System Prompt with {variables}
    userPrompt: string;              // Actual User Prompt with {variables}
    inputSchema: PromptVariable[];   // JSON input schema
    outputSchema: PromptVariable[];  // JSON output schema
    createdAt: string;               // ISO timestamp
}
  
  
export interface PromptVariable {
    name: string;                    // e.g., "topic"
    type: "string" | "number" | "boolean" | "object" | "array";  // LangChain friendly types
    description?: string;            // Optional description for UI / API docs
}

export interface SavePromptVersionParams {
    systemPrompt: string;
    userPrompt: string;
    inputSchema: PromptVariable[];
    outputSchema: Record<string, unknown>;
}
