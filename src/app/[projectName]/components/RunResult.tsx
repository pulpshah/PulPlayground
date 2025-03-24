'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clipboard, Check, InfoIcon } from "lucide-react";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RunResultProps {
  result: string;
  isVisible: boolean;
  tokenUsage?: number;
  promptTokens?: number;
  responseTokens?: number;
  estimatedCost?: number;
  latencyMs?: number;
}

export default function RunResult({ 
  result = '', 
  isVisible,
  tokenUsage = 0,
  promptTokens = 0,
  responseTokens = 0,
  estimatedCost = 0,
  latencyMs = 0
}: RunResultProps) {
  const [copied, setCopied] = useState(false);
  
  // Add a safety check for result
  const safeResult = result || '';
  const isJson = safeResult && (safeResult.trim().startsWith('{') || safeResult.trim().startsWith('['));

  const copyToClipboard = () => {
    navigator.clipboard.writeText(safeResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isVisible || !safeResult) {
    return null;
  }

  // Format the token cost for better readability
  const formatCost = (cost: number) => {
    if (cost < 0.000001) return `< $0.000001`;
    return `$${cost.toFixed(6)}`;
  };

  // Safely parse JSON if it is valid
  const renderJsonContent = () => {
    try {
      return JSON.stringify(JSON.parse(safeResult), null, 2);
    } catch (e) {
      console.error('Error parsing JSON:', e);
      // If JSON parsing fails, return the original content
      return safeResult;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>{isJson ? 'JSON Result' : 'Run Result'}</CardTitle>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-xs text-muted-foreground flex items-center cursor-help">
                  <span className="font-medium text-foreground">{tokenUsage}</span> tokens
                  <InfoIcon className="h-3 w-3 ml-1" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="left">
                <div className="text-xs">
                  <div className="flex justify-between">
                    <span>Prompt:</span> 
                    <span className="font-medium ml-4">{promptTokens} tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Response:</span> 
                    <span className="font-medium ml-4">{responseTokens} tokens</span>
                  </div>
                  <div className="mt-1 pt-1 border-t flex justify-between">
                    <span>Total:</span> 
                    <span className="font-medium ml-4">{tokenUsage} tokens</span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {estimatedCost > 0 && 
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-muted-foreground cursor-help">
                    {formatCost(estimatedCost)}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <div className="text-xs">Estimated cost based on token usage</div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          }
          
          {latencyMs > 0 && 
            <span className="text-xs text-muted-foreground">
              {(latencyMs / 1000).toFixed(2)}s
            </span>
          }
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={copyToClipboard}
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Clipboard className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isJson ? (
          <pre className="whitespace-pre-wrap bg-muted p-4 rounded-md text-sm overflow-auto max-h-[500px] font-mono">
            {renderJsonContent()}
          </pre>
        ) : (
          <pre className="whitespace-pre-wrap bg-muted p-4 rounded-md text-sm overflow-auto max-h-[500px]">
            {safeResult}
          </pre>
        )}
      </CardContent>
    </Card>
  );
} 