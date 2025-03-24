'use client';

import { PromptNode, PromptVersionNode, SavePromptVersionParams } from "@/types/prompt";
import { RunPromptParams, SaveRunParams } from "@/types/run";

/**
 * Fetch all prompts for a project
 */
export async function getProjectPrompts(projectName: string): Promise<PromptNode[]> {
  const response = await fetch(`/api/projects/${projectName}/prompts`);
  const data = await response.json();
  return data.prompts;
}

/**
 * Create a new prompt
 */
export async function createPrompt(projectName: string, name: string, description: string): Promise<PromptNode> {
  const response = await fetch(`/api/projects/${projectName}/prompts`, {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  });
  const data = await response.json();
  return data.prompt;
}

/**
 * Save a new prompt version
 */
export async function savePromptVersion(promptId: string, params: SavePromptVersionParams): Promise<PromptVersionNode> {
  const response = await fetch(`/api/prompts/${promptId}/versions`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
  
  const data = await response.json();
  return data.version;
}

/**
 * Fetch a specific version from Neo4j
 */
export async function getPromptVersion(versionId: string): Promise<PromptVersionNode | null> {
  const response = await fetch(`/api/prompts/versions/${versionId}`);
  if (!response.ok) {
    return null;
  }
  const data = await response.json();
  return data.version;
}

/**
 * Check if current version matches the stored version in Neo4j
 */
export async function checkVersionMatch(
  versionId: string, 
  systemPrompt: string, 
  userPrompt: string,
): Promise<boolean> {
  const version = await getPromptVersion(versionId);
  if (!version) return false;
  
  // Compare core fields - only check system and user prompts now
  // We're not separately tracking output schemas anymore
  return (
    version.systemPrompt === systemPrompt &&
    version.userPrompt === userPrompt
  );
}

/**
 * Run a prompt with LangChain
 */
export async function runPrompt(params: RunPromptParams): Promise<{ 
  output: string | Record<string, unknown>; 
  rawOutput: string; 
  tokenUsage: number;
  promptTokens: number;
  responseTokens: number;
  estimatedCost: number;
  latencyMs: number;
}> {
  const response = await fetch(`/api/run/langchain`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    console.error('API Error Response:', data);
    throw new Error(`API error: ${data.error || response.statusText} - ${data.details || ''}`);
  }
  
  return data;
}

/**
 * Save a run to the database
 */
export async function saveRun(promptId: string, params: SaveRunParams): Promise<{ id: string }> {
  const response = await fetch(`/api/prompts/${promptId}/runs`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
  
  return response.json();
} 