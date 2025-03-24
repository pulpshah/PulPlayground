'use client';

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { SaveIcon, DatabaseIcon, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SaveButtonsProps {
  onSavePrompt: () => Promise<void>;
  onSaveRun: () => Promise<void>;
  isSaving: boolean;
  isRunning: boolean;
  hasEmptyRequiredInputs?: boolean;
}

export default function SaveButtons({
  onSavePrompt,
  onSaveRun,
  isSaving,
  isRunning,
  hasEmptyRequiredInputs = false
}: SaveButtonsProps) {
  const handleSavePrompt = async () => {
    try {
      await onSavePrompt();
      toast.success("Prompt version saved successfully");
    } catch (error) {
      toast.error("Failed to save prompt version: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleSaveRun = async () => {
    try {
      await onSaveRun();
      toast.success("Run saved successfully");
    } catch (error) {
      toast.error("Failed to save run: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const savePromptButton = (
    <Button 
      onClick={handleSavePrompt} 
      disabled={isSaving || !onSavePrompt}
      variant="outline"
    >
      {isSaving ? "Saving..." : (
        <>
          <SaveIcon className="mr-2 h-4 w-4" />
          Version Prompt
        </>
      )}
    </Button>
  );

  const saveRunButton = hasEmptyRequiredInputs ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            disabled={true}
            variant="default"
          >
            <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
            Save Result
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>All required inputs must be filled before saving results</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    <Button 
      onClick={handleSaveRun} 
      disabled={isRunning || !onSaveRun}
      variant="default"
    >
      {isRunning ? "Saving Run..." : (
        <>
          <DatabaseIcon className="mr-2 h-4 w-4" />
          Save Result
        </>
      )}
    </Button>
  );

  return (
    <div className="flex space-x-4">
      {savePromptButton}
      {saveRunButton}
    </div>
  );
} 