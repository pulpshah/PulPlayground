'use client';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PlayCircle, Loader2, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RunButtonProps {
  onRun: () => Promise<void>;
  isRunning: boolean;
  disabled?: boolean;
  hasEmptyRequiredInputs?: boolean;
}

export default function RunButton({
  onRun,
  isRunning,
  disabled = false,
  hasEmptyRequiredInputs = false
}: RunButtonProps) {
  const handleRun = async () => {
    try {
      await onRun();
      toast.success("Run completed successfully");
    } catch (error) {
      toast.error("Run failed: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const buttonContent = isRunning ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
      Running...
    </>
  ) : (
    <>
      <PlayCircle className="mr-2 h-4 w-4" />
      Run Prompt
    </>
  );

  if (hasEmptyRequiredInputs) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              disabled={true}
              className="w-full" 
              variant="default"
            >
              <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
              Run Prompt
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>All required inputs must be filled before running</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button 
      onClick={handleRun} 
      disabled={isRunning || disabled}
      className="w-full"
    >
      {buttonContent}
    </Button>
  );
}
