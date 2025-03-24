import { NextRequest, NextResponse } from 'next/server';
import { getNeo4jSession } from '@/lib/neo4j';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) {
  const session = getNeo4jSession('READ');
  const versionId = (await params).versionId;

  try {
    // Execute query to find the version by ID
    const result = await session.executeRead(async (tx) => {
      const query = `
        MATCH (v:PromptVersion {id: $versionId})
        RETURN v {
          .*,
          createdAt: toString(v.createdAt)
        } as version
      `;
      
      const res = await tx.run(query, { versionId });
      return res.records;
    });
    
    if (!result.length) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }
    
    const version = result[0].get('version');
    return NextResponse.json({ version });
  } catch (error) {
    console.error('Error fetching prompt version:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompt version' }, 
      { status: 500 }
    );
  } finally {
    await session.close();
  }
} 