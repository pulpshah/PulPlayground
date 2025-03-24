import { NextRequest, NextResponse } from 'next/server';
import { getNeo4jSession } from '@/lib/neo4j';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const session = getNeo4jSession('READ');
  const query = `MATCH (p:PromptProject) RETURN p ORDER BY p.createdAt`;

  try {
    const result = await session.run(query);
    const projects = result.records.map(record => record.get('p').properties);
    await session.close();
    return NextResponse.json({ projects });
  } catch (error) {
    console.error(error);
    await session.close();
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}
// Create a new PromptProject node
export async function POST(req: NextRequest) {
  const { name, description } = await req.json();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const session = getNeo4jSession();
  const projectId = uuidv4();
  const query = `
    CREATE (p:PromptProject {
      id: $projectId,
      name: $name,
      description: $description,
      createdAt: datetime()
    }) RETURN p
  `;

  try {
    const result = await session.run(query, { projectId, name, description });
    const project = result.records[0].get('p').properties;
    await session.close();
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Failed to create project:', error);
    await session.close();
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}

