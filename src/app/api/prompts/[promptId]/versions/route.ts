import { NextRequest, NextResponse } from 'next/server';
import { getNeo4jSession } from '@/lib/neo4j';
import { PromptVersionNode } from '@/types/prompt';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest, { params }: { params: Promise<{ promptId: string }> }) {  
  const session = getNeo4jSession('READ');
  const promptId = (await params).promptId;

  const query = `
    MATCH (p:Prompt {id: $promptId})-[:HAS_VERSION]->(v:PromptVersion)
    RETURN v ORDER BY v.versionNumber DESC
  `;

  try {
    const result = await session.run(query, { promptId });
    const versions: PromptVersionNode[] = result.records.map((record) => {
      const v = record.get('v').properties;
      return {
        id: v.id,
        versionNumber: v.versionNumber.toNumber(),
        systemPrompt: v.systemPrompt,
        userPrompt: v.userPrompt,
        template: v.template,
        inputSchema: JSON.parse(v.inputSchema),
        outputSchema: JSON.parse(v.outputSchema),
        createdAt: v.createdAt instanceof Date ? v.createdAt.toISOString() : v.createdAt,
      };
    });

    console.log(versions[0].createdAt);

    await session.close();
    return NextResponse.json({ versions });
  } catch (error) {
    console.error('Failed to fetch prompt versions:', error);
    await session.close();
    return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ promptId: string }> }) {
  
  const promptId = (await params).promptId;
  const { systemPrompt, userPrompt, inputSchema, outputSchema } = await req.json();
  const session = getNeo4jSession();
  const versionId = uuidv4();
  

  // Auto-increment versionNumber
  const query = `
    MATCH (p:Prompt {id: $promptId})
    OPTIONAL MATCH (p)-[:HAS_VERSION]->(v:PromptVersion)
    WITH p, COALESCE(MAX(v.versionNumber), 0) + 1 AS nextVersion
    CREATE (newV:PromptVersion {
      id: $versionId,
      versionNumber: nextVersion,
      systemPrompt: $systemPrompt,
      userPrompt: $userPrompt,
      template: "",
      inputSchema: $inputSchema,
      outputSchema: $outputSchema,
      createdAt: datetime()
    })
    MERGE (p)-[:HAS_VERSION]->(newV)
    WITH p, newV
    OPTIONAL MATCH (p)-[old:LATEST_VERSION]->(:PromptVersion)
    DELETE old
    MERGE (p)-[:LATEST_VERSION]->(newV)
    RETURN newV
  `;

  try {
    const result = await session.run(query, {
      promptId: promptId,
      versionId,
      systemPrompt,
      userPrompt,
      inputSchema: JSON.stringify(inputSchema),
      outputSchema: JSON.stringify(outputSchema),
    });

    const newVersion = result.records[0].get('newV').properties;
    await session.close();

    return NextResponse.json({
      version: {
        ...newVersion,
        versionNumber: typeof newVersion.versionNumber === 'object' && 'toNumber' in newVersion.versionNumber
                        ? newVersion.versionNumber.toNumber() 
                        : Number(newVersion.versionNumber),
        inputSchema: JSON.parse(newVersion.inputSchema),
        outputSchema: JSON.parse(newVersion.outputSchema),
      }
    });
  } catch (error) {
    console.error('Failed to save new version:', error);
    await session.close();
    return NextResponse.json({ error: 'Failed to save version' }, { status: 500 });
  }
}
