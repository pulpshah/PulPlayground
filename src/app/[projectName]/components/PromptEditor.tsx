'use client';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type PromptEditorProps = {
    promptName: string;
    systemPrompt: string;
    userPrompt: string;
    setUserPrompt: (prompt: string) => void;
    setSystemPrompt: (prompt: string) => void;
}

export default function PromptEditor({
  promptName,
  systemPrompt,
  userPrompt,
  setSystemPrompt,
  setUserPrompt,
}: PromptEditorProps) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit / Run Prompt: {promptName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>System Prompt (use <code>{'{input}'}</code>):</Label>
          <Textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} className="mt-2" rows={6} />
          <p className="text-sm text-muted-foreground mt-1">
            Include output JSON instructions directly in system prompt if needed.
          </p>
        </div>

        <div>
          <Label>User Prompt (use <code>{'{input}'}</code>):</Label>
          <Textarea value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)} className="mt-2" rows={6} />
        </div>

        <div className="text-sm text-muted-foreground">
          <strong>Encoding Guide:</strong> Use <code>{'{variableName}'}</code> anywhere in your prompts.
        </div>

        <div className="space-y-4">
          <Label>Detected Input Variables (all string)</Label>
          {extractedVars.length === 0 && <p className="text-muted-foreground">No variables detected yet.</p>}
          {extractedVars.map((variable) => (
            <div key={variable} className="flex items-center gap-4">
              <span className="font-mono">{variable}</span>
              <span className="text-muted-foreground">: string</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
