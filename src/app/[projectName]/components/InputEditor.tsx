'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InputEditorProps {
  variables: string[];
  inputValues: Record<string, string>;
  setInputValues: (values: Record<string, string>) => void;
  validateInputs?: boolean;
}

export default function InputEditor({
  variables,
  inputValues,
  setInputValues,
  validateInputs = false
}: InputEditorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center">
            Input Variables
            {variables.length > 0 && <span className="ml-2 text-xs text-red-500">Required</span>}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {variables.length === 0 && (
          <p className="text-muted-foreground">No variables detected in prompt templates.</p>
        )}
        
        {variables.map((variable) => {
          const isRequired = validateInputs && !inputValues[variable];
          return (
            <div key={variable} className="grid grid-cols-4 items-center gap-4">
              <Label 
                htmlFor={`var-${variable}`} 
                className={`text-right flex items-center ${isRequired ? 'text-red-500' : ''}`}
              >
                {variable}:
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id={`var-${variable}`}
                className={`col-span-3 ${isRequired ? 'border-red-500 ring-red-500' : ''}`}
                placeholder={`Enter value for ${variable}`}
                value={inputValues[variable] || ""}
                onChange={(e) => 
                  setInputValues({ ...inputValues, [variable]: e.target.value })
                }
                required
                aria-required="true"
              />
            </div>
          );
        })}
        
        {validateInputs && variables.some(variable => !inputValues[variable]) && (
          <p className="text-red-500 text-sm">All input variables must be filled before running</p>
        )}
      </CardContent>
    </Card>
  );
} 