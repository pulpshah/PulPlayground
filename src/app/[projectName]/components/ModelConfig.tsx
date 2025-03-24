'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface ModelConfigProps {
  model: string;
  setModel: (val: string) => void;
  temperature: number;
  setTemperature: (val: number) => void;
  maxTokens: number;
  setMaxTokens: (val: number) => void;
  maxRetries: number;
  setMaxRetries: (val: number) => void;
}

export default function ModelConfig({
  model,
  setModel,
  temperature,
  setTemperature,
  maxTokens,
  setMaxTokens,
  maxRetries,
  setMaxRetries,
}: ModelConfigProps) {
  const models = [
    'deepseek-r1-distill-llama-70b',
    'deepseek-r1-distill-qwen-32b',
    'llama-3.3-70b-versatile',
    'llama-3.3-70b-specdec',
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Model Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="model-select" className="text-right">Model</Label>
          <Select 
            value={model} 
            onValueChange={setModel}
          >
            <SelectTrigger id="model-select" className="col-span-3">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {models.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <Label>Temperature: {temperature.toFixed(1)}</Label>
          </div>
          <Slider 
            value={[temperature]} 
            onValueChange={(values: number[]) => setTemperature(values[0])}
            min={0} 
            max={1} 
            step={0.1} 
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="max-tokens" className="text-right">Max Tokens</Label>
          <Input
            id="max-tokens"
            type="number"
            min={1}
            value={maxTokens}
            onChange={(e) => setMaxTokens(parseInt(e.target.value))}
            className="col-span-3"
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="max-retries" className="text-right">Max Retries</Label>
          <Input
            id="max-retries"
            type="number"
            min={0}
            value={maxRetries}
            onChange={(e) => setMaxRetries(parseInt(e.target.value))}
            className="col-span-3"
          />
        </div>
      </CardContent>
    </Card>
  );
}
