'use client';

import { Select, SelectItem, SelectTrigger, SelectContent, SelectValue } from "@/components/ui/select";
import { PromptNode } from "@/types/prompt";

export default function PromptSelector({
  prompts,
  onSelect,
}: {
  prompts?: PromptNode[];
  onSelect: (prompt: PromptNode | null) => void;
}) {
  return (
    <Select onValueChange={(val) => onSelect((prompts ?? []).find((p) => p.id === val) || null)}>
      <SelectTrigger className="w-80">
        <SelectValue placeholder="Select a prompt" />
      </SelectTrigger>

      <SelectContent>
        {(prompts ?? []).length === 0 ? (
          <div className="text-muted-foreground text-sm px-4 py-2">No prompts available</div>
        ) : (
          (prompts ?? []).map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
