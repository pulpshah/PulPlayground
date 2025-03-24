'use client';

import PromptSelector from "@/app/[projectName]/components/PromptSelector";
import PromptEditor from "@/app/[projectName]/components/PromptEditor";
import RunButton from "@/app/[projectName]/components/RunButton";
import VersionSelector from "./components/VersionSelector";
import ModelConfig from "./components/ModelConfig";
import InputEditor from "./components/InputEditor";
import RunResult from "./components/RunResult";
import SaveButtons from "./components/SaveButtons";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

import { useState, useEffect } from "react";
import { PromptNode, PromptVersionNode, SavePromptVersionParams } from "@/types/prompt";
import { RunPromptParams, SaveRunParams, JSONObject } from "@/types/run";
import { useParams } from "next/navigation";
import * as api from "./services/api";

export default function ProjectPage() {
  const { projectName } = useParams<{ projectName: string }>();

  const [prompts, setPrompts] = useState<PromptNode[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptNode | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<PromptVersionNode | null>(null);
  const [latestVersionId, setLatestVersionId] = useState<string | null>(null);

  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  const [model, setModel] = useState('llama-3.3-70b-versatile');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [maxRetries, setMaxRetries] = useState(3);
  const [runResult, setRunResult] = useState<string>('');
  
  // Stats from the last run
  const [tokenUsage, setTokenUsage] = useState(0);
  const [promptTokens, setPromptTokens] = useState(0);
  const [responseTokens, setResponseTokens] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [latencyMs, setLatencyMs] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [newPrompt, setNewPrompt] = useState({ name: '', description: '' });
  
  const [isRunning, setIsRunning] = useState(false);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [isSavingRun, setIsSavingRun] = useState(false);
  const [validateInputs, setValidateInputs] = useState(false);

  // Load prompts for the project
  useEffect(() => {
    const loadPrompts = async () => {
      try {
        const projectPrompts = await api.getProjectPrompts(projectName as string);
        setPrompts(projectPrompts);
      } catch (error) {
        toast.error("Failed to load prompts");
        console.error("Error loading prompts:", error);
      }
    };
    
    if (projectName) {
      loadPrompts();
    }
  }, [projectName]);

  // Update form when prompt or version changes
  useEffect(() => {
    if (selectedVersion) {
      console.log('DEBUG - Setting from selected version:', selectedVersion);
      setSystemPrompt(selectedVersion.systemPrompt);
      setUserPrompt(selectedVersion.userPrompt);
      setLatestVersionId(selectedVersion.id);
    } else if (selectedPrompt?.latestVersion) {
      console.log('DEBUG - Setting from latest version:', selectedPrompt.latestVersion);
      setSystemPrompt(selectedPrompt.latestVersion.systemPrompt);
      setUserPrompt(selectedPrompt.latestVersion.userPrompt);
      setLatestVersionId(selectedPrompt.latestVersion.id);
    }
  }, [selectedVersion, selectedPrompt]);

  const extractVariables = (text: string) => {
    const regex = /{(\w+)}/g;
    const vars = new Set<string>();
    let match;
    while ((match = regex.exec(text)) !== null) vars.add(match[1]);
    return Array.from(vars);
  };

  const extractedVars = Array.from(new Set([
    ...extractVariables(systemPrompt),
    ...extractVariables(userPrompt)
  ]));

  const validateVariableInputs = () => {
    if (extractedVars.length === 0) {
      return true; // No variables to validate
    }
    
    const allInputsFilled = extractedVars.every(variable => 
      inputValues[variable] && inputValues[variable].trim() !== ''
    );
    
    if (!allInputsFilled) {
      setValidateInputs(true);
      toast.error("Please fill in all required input variables");
      return false;
    }
    
    return true;
  };

  const handleCreatePrompt = async () => {
    try {
      const prompt = await api.createPrompt(
        projectName as string, 
        newPrompt.name, 
        newPrompt.description
      );
      setPrompts((prev) => [...prev, prompt]);
      setCreateOpen(false);
      setNewPrompt({ name: '', description: '' });
      toast.success("Prompt created successfully");
    } catch (error) {
      toast.error("Failed to create prompt");
      console.error("Error creating prompt:", error);
    }
  };

  const handleSavePromptVersion = async () => {
    if (!selectedPrompt) return;

    try {
      setIsSavingPrompt(true);

      const params: SavePromptVersionParams = {
        systemPrompt,
        userPrompt,
        inputSchema: extractedVars.map((name) => ({ name, type: "string" })),
        outputSchema: {}, // Empty object instead of array
      };

      const version = await api.savePromptVersion(selectedPrompt.id, params);
      setLatestVersionId(version.id);
      
      // Refresh prompts to update latest version
      const updatedPrompts = await api.getProjectPrompts(projectName as string);
      setPrompts(updatedPrompts);
      
      toast.success("Prompt version saved successfully");
    } catch (error) {
      toast.error("Failed to save prompt version");
      console.error("Error saving prompt version:", error);
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const handleRun = async () => {
    if (!selectedPrompt) return;
    
    // Validate all inputs are filled
    if (!validateVariableInputs()) {
      return;
    }

    try {
      setIsRunning(true);
      setRunResult('');
      
      console.log('DEBUG - System prompt before run:', systemPrompt);
      console.log('DEBUG - User prompt before run:', userPrompt);
      console.log('DEBUG - Input values:', inputValues);
      
      // Run the model using the current prompt state without saving a version
      const params: RunPromptParams = {
        systemPrompt,
        userPrompt,
        inputs: inputValues,
        model,
        temperature,
        max_tokens: maxTokens,
        max_retries: maxRetries,
      };
      
      console.log('DEBUG - Run parameters:', params);
      
      const result = await api.runPrompt(params);
      
      // Handle the response, ensuring we never set undefined or null
      const outputContent = result.output ? 
        (typeof result.output === 'object' ? JSON.stringify(result.output, null, 2) : String(result.output)) 
        : '';
      
      setRunResult(outputContent);
      
      // Save stats from the run
      setTokenUsage(result.tokenUsage || 0);
      setPromptTokens(result.promptTokens || 0);
      setResponseTokens(result.responseTokens || 0);
      setEstimatedCost(result.estimatedCost || 0);
      setLatencyMs(result.latencyMs || 0);
      
      toast.success("Run completed successfully");
    } catch (error) {
      console.error('DEBUG - Run error:', error);
      toast.error("Run failed");
      console.error("Error running prompt:", error);
      // Reset result on error
      setRunResult('');
    } finally {
      setIsRunning(false);
    }
  };

  // Helper function to try parsing a string as JSON
  const tryParseJson = (str: string): JSONObject | null => {
    try {
      return JSON.parse(str);
    } catch {
      // Ignore parse errors
      return null;
    }
  };

  const handleSaveRun = async () => {
    if (!selectedPrompt) return;
    
    // Validate all inputs are filled
    if (!validateVariableInputs()) {
      return;
    }
    
    // Ensure we have a run result to save
    if (!runResult) {
      toast.warning("No run result to save. Please run the prompt first");
      return;
    }

    try {
      setIsSavingRun(true);
      
      let versionId = latestVersionId;
      
      // Check if we need to create a new version because prompt has changed
      if (latestVersionId) {
        const versionMatches = await api.checkVersionMatch(
          latestVersionId,
          systemPrompt,
          userPrompt
        );
        
        if (!versionMatches) {
          toast.info("Creating new version as prompt has changed since last version");
          
          // Create a new version
          const params: SavePromptVersionParams = {
            systemPrompt,
            userPrompt,
            inputSchema: extractedVars.map((name) => ({ name, type: "string" })),
            outputSchema: {}, // Empty object instead of array
          };
          
          const version = await api.savePromptVersion(selectedPrompt.id, params);
          versionId = version.id;
        }
      } else if (selectedPrompt.id) {
        // Create a new version if none exists
        const params: SavePromptVersionParams = {
          systemPrompt,
          userPrompt,
          inputSchema: extractedVars.map((name) => ({ name, type: "string" })),
          outputSchema: {}, // Empty object instead of array
        };
        
        const version = await api.savePromptVersion(selectedPrompt.id, params);
        versionId = version.id;
      }
      
      // Save the run
      const parsedOutput = tryParseJson(runResult) || runResult;
      
      const runParams: SaveRunParams = {
        versionId: versionId as string, // Ensure this is a string
        input: inputValues,
        output: parsedOutput,
        rawOutput: runResult,
        tokenUsage: tokenUsage,
        promptTokens: promptTokens,
        responseTokens: responseTokens,
        estimatedCost: estimatedCost,
        latencyMs: latencyMs
      };
      
      await api.saveRun(selectedPrompt.id, runParams);
      
      toast.success("Run saved successfully");
      
      // Refresh latest prompt version after saving
      if (selectedPrompt.id) {
        const updatedPrompts = await api.getProjectPrompts(projectName as string);
        setPrompts(updatedPrompts);
      }
    } catch (error) {
      toast.error("Failed to save run");
      console.error("Error saving run:", error);
    } finally {
      setIsSavingRun(false);
    }
  };

  return (
    <>
      <Toaster />
      <div className="p-6 space-y-8">
        <div className="flex items-center justify-between">
          <PromptSelector prompts={prompts} onSelect={setSelectedPrompt} />
          <Button variant="outline" onClick={() => setCreateOpen(true)}>+ New Prompt</Button>
        </div>

        {/* Create Prompt Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Prompt</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="Prompt Name"
              value={newPrompt.name}
              onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
            />
            <Input
              placeholder="Prompt Description"
              value={newPrompt.description}
              onChange={(e) => setNewPrompt({ ...newPrompt, description: e.target.value })}
            />
            <DialogFooter>
              <Button onClick={handleCreatePrompt}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {selectedPrompt && (
          <>
            <VersionSelector
              versions={selectedPrompt.versions || []}
              onSelect={(v) => setSelectedVersion(v)}
            />

            <PromptEditor
              promptName={selectedPrompt.name}
              systemPrompt={systemPrompt}
              userPrompt={userPrompt}
              setSystemPrompt={setSystemPrompt}
              setUserPrompt={setUserPrompt}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ModelConfig
                model={model}
                setModel={setModel}
                temperature={temperature}
                setTemperature={setTemperature}
                maxTokens={maxTokens}
                setMaxTokens={setMaxTokens}
                maxRetries={maxRetries}
                setMaxRetries={setMaxRetries}
              />

              <InputEditor 
                variables={extractedVars} 
                inputValues={inputValues} 
                setInputValues={setInputValues} 
                validateInputs={validateInputs}
              />
            </div>

            <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:gap-4 md:justify-between md:items-center">
              <SaveButtons 
                onSavePrompt={handleSavePromptVersion}
                onSaveRun={handleSaveRun}
                isSaving={isSavingPrompt}
                isRunning={isSavingRun}
                hasEmptyRequiredInputs={extractedVars.length > 0 && extractedVars.some(variable => !inputValues[variable])}
              />
              
              <div className="w-full md:w-1/3">
                <RunButton 
                  onRun={handleRun} 
                  isRunning={isRunning}
                  disabled={!selectedPrompt}
                  hasEmptyRequiredInputs={extractedVars.length > 0 && extractedVars.some(variable => !inputValues[variable])}
                />
              </div>
            </div>

            <RunResult 
              result={runResult || ''} 
              isVisible={!!runResult} 
              tokenUsage={tokenUsage}
              promptTokens={promptTokens}
              responseTokens={responseTokens}
              estimatedCost={estimatedCost}
              latencyMs={latencyMs}
            />
          </>
        )}
      </div>
    </>
  );
}
