import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const RunSchema = z.object({
  systemPrompt: z.string(),
  userPrompt: z.string(),
  inputs: z.record(z.string()),
  model: z.string(),
  temperature: z.number(),
  max_tokens: z.number(),
  max_retries: z.number(),
});

// Cost per 1000 tokens - approximated values
const MODEL_COSTS = {
  'llama-3.3-70b-versatile': 0.0007,
  'llama-3.3-70b-specdec': 0.0007,
  'deepseek-r1-distill-llama-70b': 0.0005,
  'deepseek-r1-distill-qwen-32b': 0.0004
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { systemPrompt, userPrompt, inputs, model, temperature, max_tokens, max_retries } = RunSchema.parse(body);
    
    const startTime = Date.now();

    // Replace variables in prompts
    let processedSystemPrompt = systemPrompt;
    let processedUserPrompt = userPrompt;
    
    // Simple variable replacement
    Object.entries(inputs).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      processedSystemPrompt = processedSystemPrompt.replace(regex, String(value));
      processedUserPrompt = processedUserPrompt.replace(regex, String(value));
    });

    console.log('DEBUG - Processed System Prompt:', processedSystemPrompt);
    console.log('DEBUG - Processed User Prompt:', processedUserPrompt);

    // Prepare the request to Groq API
    const groqRequest = {
      messages: [
        {
          role: "system",
          content: processedSystemPrompt
        },
        {
          role: "user", 
          content: processedUserPrompt
        }
      ],
      model,
      temperature,
      max_tokens,
    };

    console.log('DEBUG - Groq Request:', JSON.stringify(groqRequest, null, 2));

    // Make the API call to Groq
    const apiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify(groqRequest)
    });

    // Parse the response
    const groqData = await apiResponse.json();

    if (!apiResponse.ok) {
      console.error('Groq API Error:', groqData);
      return NextResponse.json({ 
        error: 'Failed to get response from Groq API', 
        details: groqData.error?.message || 'Unknown error'
      }, { status: apiResponse.status });
    }

    const endTime = Date.now();
    const latencyMs = endTime - startTime;

    console.log('DEBUG - Groq Response:', groqData);
    
    // Extract the response content
    const output = groqData.choices[0]?.message?.content || '';
    let parsedOutput = output;

    // Try to parse JSON from the output if it looks like JSON
    if (output.trim().startsWith('{') || output.trim().startsWith('[')) {
      try {
        // Try to extract JSON from the response
        const jsonMatch = output.match(/```(?:json)?([\s\S]*?)```/) || 
                          output.match(/({[\s\S]*})/) ||
                          output.match(/([\[\{][\s\S]*[\]\}])/);
        
        if (jsonMatch && jsonMatch[1]) {
          const jsonContent = jsonMatch[1].trim();
          parsedOutput = JSON.parse(jsonContent);
        } else {
          // Try to parse the whole response as JSON
          parsedOutput = JSON.parse(output);
        }
      } catch (e) {
        console.warn('Failed to parse JSON output:', e);
        // Keep the original output if parsing fails
      }
    }
    
    // Use actual token count from Groq if available
    const promptTokens = groqData.usage?.prompt_tokens || Math.ceil((processedSystemPrompt.length + processedUserPrompt.length) / 4);
    const responseTokens = groqData.usage?.completion_tokens || Math.ceil(output.length / 4);
    const totalTokens = groqData.usage?.total_tokens || promptTokens + responseTokens;
    
    // Calculate estimated cost
    const costPer1000Tokens = MODEL_COSTS[model as keyof typeof MODEL_COSTS] || 0.0005; // Default if model not found
    const estimatedCost = (totalTokens / 1000) * costPer1000Tokens;

    return NextResponse.json({
      output: parsedOutput,
      rawOutput: output,
      model,
      temperature,
      max_tokens,
      max_retries,
      tokenUsage: totalTokens,
      promptTokens,
      responseTokens,
      estimatedCost,
      latencyMs,
    });
  } catch (err) {
    console.error('Error processing request:', err);
    return NextResponse.json({ error: 'Failed to process request', details: `${err}` }, { status: 500 });
  }
}
