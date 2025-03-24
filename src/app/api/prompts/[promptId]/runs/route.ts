import { NextRequest, NextResponse } from 'next/server';
import { getNeo4jSession } from '@/lib/neo4j';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest, { params }: { params: Promise<{ promptId: string }> }) {
  const session = getNeo4jSession();
  const promptId  = (await params).promptId;
  const {
    versionId, 
    input,
    output,
    rawOutput,
    tokenUsage,
    estimatedCost,
    latencyMs
  } = await req.json();

  const runId = uuidv4();

  const query = `
    MATCH (p:Prompt {id: $promptId})
    OPTIONAL MATCH (v:PromptVersion {id: $versionId})
    CREATE (r:Run {
      id: $runId,
      input: $input,
      output: $output,
      rawOutput: $rawOutput,
      tokenUsage: $tokenUsage,
      estimatedCost: $estimatedCost,
      latencyMs: $latencyMs,
      createdAt: datetime()
    })
    MERGE (p)-[:GENERATED_RUN]->(r)
    WITH r, v
    WHERE v IS NOT NULL
    MERGE (v)-[:GENERATED_RUN]->(r)
    RETURN r
  `;

  try {
    await session.run(query, {
      promptId,
      versionId: versionId || null,
      runId,
      input: JSON.stringify(input),
      output: JSON.stringify(output),
      rawOutput,
      tokenUsage,
      estimatedCost,
      latencyMs
    });

    await session.close();
    return NextResponse.json({ message: 'Run stored successfully' }, { status: 201 });
  } catch (error) {
    console.error('Failed to store run:', error);
    await session.close();
    return NextResponse.json({ error: 'Failed to store run' }, { status: 500 });
  }
}
