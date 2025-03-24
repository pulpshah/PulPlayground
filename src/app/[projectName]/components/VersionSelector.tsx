'use client';

import { PromptVersionNode } from "@/types/prompt";
import { Select, SelectItem, SelectTrigger, SelectContent, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function VersionSelector({
  versions,
  onSelect
}: {
  versions: PromptVersionNode[];
  onSelect: (version: PromptVersionNode | null) => void;
}) {
  // Sort versions in descending order (newest first)
  const sortedVersions = [...versions].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (versions.length === 0) {
    return (
      <div className="text-muted-foreground text-sm italic">
        No versions yet. This will be the first version when you run.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Select a Version</Label>
      <Select onValueChange={(val) => onSelect(versions.find(v => v.id === val) || null)}>
        <SelectTrigger className="w-80">
          <SelectValue placeholder="Select a version" />
        </SelectTrigger>
        <SelectContent>
          {sortedVersions.map((version) => (
            <SelectItem key={version.id} value={version.id}>
              Version {version.versionNumber} - {new Date(version.createdAt).toLocaleString()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
