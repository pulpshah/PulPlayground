import { NextRequest, NextResponse } from 'next/server';
import { getNeo4jSession } from '@/lib/neo4j';
import { PromptVersionNode } from '@/types/prompt';
import { v4 as uuidv4 } from 'uuid';
import { Node } from 'neo4j-driver';



export async function GET(req: NextRequest, { params }: { params: Promise<{ projectName: string }> }) {
  const session = getNeo4jSession('READ');
  const  projectName  = (await params).projectName;


  const query = `
    MATCH (proj:PromptProject {name: $projectName})-[:HAS_PROMPT]->(p:Prompt)
    OPTIONAL MATCH (p)-[:LATEST_VERSION]->(latest:PromptVersion)
    OPTIONAL MATCH (p)-[:HAS_VERSION]->(v:PromptVersion)
    WITH p, latest, collect(v) AS versions
    RETURN p, latest, versions
    ORDER BY p.createdAt
  `;

  try {
    const result = await session.run(query, { projectName: decodeURIComponent(projectName) });

    const prompts = result.records.map((record) => {
      const p = (record.get('p') as Node).properties;
      const latestProps = record.get('latest') ? (record.get('latest') as Node).properties : null;
      const versionsArr = (record.get('versions') as Node[]) || [];

      const latestVersion: PromptVersionNode | null = latestProps ? {
        id: latestProps.id,
        versionNumber: typeof latestProps.versionNumber === 'object' && 'toNumber' in latestProps.versionNumber
          ? latestProps.versionNumber.toNumber()
          : Number(latestProps.versionNumber),
        systemPrompt: latestProps.systemPrompt,
        userPrompt: latestProps.userPrompt,
        template: latestProps.template,
        inputSchema: JSON.parse(latestProps.inputSchema),
        outputSchema: JSON.parse(latestProps.outputSchema),
        createdAt: latestProps.createdAt?.toString() || new Date().toISOString(),
      } : null;

      const versions: PromptVersionNode[] = versionsArr.map((vNode) => {
        const props = vNode.properties;
        return {
          id: props.id,
          versionNumber: typeof props.versionNumber === 'object' && 'toNumber' in props.versionNumber
            ? props.versionNumber.toNumber()
            : Number(props.versionNumber),
          systemPrompt: props.systemPrompt,
          userPrompt: props.userPrompt,
          template: props.template,
          inputSchema: JSON.parse(props.inputSchema),
          outputSchema: JSON.parse(props.outputSchema),
          createdAt: props.createdAt?.toString() || new Date().toISOString(),
        };
      });

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        latestVersion,
        versions,
      };
    });

    console.log(prompts[0].versions[0].createdAt);

    await session.close();
    return NextResponse.json({ prompts });
  } catch (error) {
    console.error('Failed to fetch prompts:', error);
    await session.close();
    return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 });
  }
}


export async function POST(req: NextRequest, { params }: { params: Promise<{ projectName: string }> }) {
  const { name, description } = await req.json();
  const session = getNeo4jSession();
  const promptId = uuidv4();
  const projectName = (await params).projectName;


  const query = `
    MATCH (proj:PromptProject {name: $projectName})
    CREATE (p:Prompt {
      id: $promptId,
      name: $name,
      description: $description,
      createdAt: datetime(),
      updatedAt: datetime()
    })
    CREATE (proj)-[:HAS_PROMPT]->(p)
    RETURN p
  `;

  try {
    const result = await session.run(query, {
      projectName: decodeURIComponent(projectName),
      promptId,
      name,
      description,
    });
    const prompt = result.records[0].get('p').properties;
    await session.close();
    return NextResponse.json({ prompt }, { status: 201 });
  } catch (error) {
    console.error('Failed to create prompt:', error);
    await session.close();
    return NextResponse.json({ error: 'Failed to create prompt' }, { status: 500 });
  }
}
