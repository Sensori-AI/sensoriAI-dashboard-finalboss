import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { farmData, period, sectors } = await req.json();
    
    console.log('Generating AI report for:', { period, sectors });

    // Use Lovable AI Gateway to generate intelligent report analysis
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `Você é um especialista em análise agrícola. Analise os seguintes dados da fazenda e gere um relatório profissional detalhado em português:

Período: ${period}
Setores analisados: ${sectors.join(', ')}

Dados:
- Índice de Vigor: ${farmData.vigor}%
- Falhas detectadas: ${farmData.falhas}%
- Daninhas identificadas: ${farmData.daninhas}%
- Área total: ${farmData.area} hectares

Gere um relatório estruturado com:
1. Resumo Executivo (síntese dos principais indicadores)
2. Análise Detalhada por Indicador (vigor, falhas, daninhas)
3. Tendências Identificadas (comparação com períodos anteriores se aplicável)
4. Recomendações Técnicas (ações prioritárias e preventivas)
5. Previsões e Alertas (riscos potenciais)

Use linguagem técnica mas acessível. Seja específico e prático nas recomendações.`;

const buildFallback = () => {
  const status = farmData.vigor > 80 ? 'Excelente' : farmData.vigor > 60 ? 'Bom' : 'Atenção Necessária';
  return `Resumo Executivo:
- Status geral: ${status}
- Vigor médio: ${farmData.vigor}%
- Falhas: ${farmData.falhas}%
- Daninhas: ${farmData.daninhas}%

Análise Detalhada:
• Vigor: ${farmData.vigor}% — ${farmData.vigor > 80 ? 'desempenho muito bom' : farmData.vigor > 60 ? 'bom, com oportunidades de melhoria' : 'abaixo do ideal; atenção imediata'}.
• Falhas: ${farmData.falhas}% — ${farmData.falhas > 15 ? 'acima do limite; revisar plantio e replantar áreas críticas' : 'dentro do esperado, monitorar pontos isolados'}.
• Daninhas: ${farmData.daninhas}% — ${farmData.daninhas > 20 ? 'alta pressão; aplicar controle imediato' : 'pressão moderada; planejar manejo seletivo'}.

Recomendações:
1) Manejo de daninhas focado nos setores com maior incidência.
2) Replantio em trechos com falhas acima de 15%.
3) Nutrição localizada para elevar vigor nas zonas médias/baixas.
4) Monitoramento semanal com mapas de calor e validação de campo.`;
};

let reportContent = '';

try {
  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { 
          role: 'user', 
          content: prompt 
        }
      ],
    }),
  });

  if (aiResponse.ok) {
    const aiData = await aiResponse.json();
    reportContent = aiData.choices?.[0]?.message?.content ?? buildFallback();
  } else {
    const errorText = await aiResponse.text();
    console.error('Lovable AI Gateway error:', aiResponse.status, errorText);
    const friendly = aiResponse.status === 429
      ? 'Limite de requisições de IA excedido. Tente novamente em instantes.'
      : aiResponse.status === 402
        ? 'Créditos de IA esgotados. Adicione créditos ao workspace para continuar.'
        : 'Falha ao gerar análise com IA.';
    reportContent = `${friendly}\n\nRelatório gerado sem IA (fallback):\n\n${buildFallback()}`;
  }
} catch (e) {
  console.error('Lovable AI fetch exception:', e);
  reportContent = `Erro ao acessar a IA.\n\nRelatório gerado sem IA (fallback):\n\n${buildFallback()}`;
}

    // Structure the report response
    const report = {
      id: crypto.randomUUID(),
      generated_at: new Date().toISOString(),
      period,
      sectors,
      data: farmData,
      ai_analysis: reportContent,
      summary: {
        vigor: farmData.vigor,
        falhas: farmData.falhas,
        daninhas: farmData.daninhas,
        status: farmData.vigor > 80 ? 'Excelente' : farmData.vigor > 60 ? 'Bom' : 'Atenção Necessária'
      }
    };

    console.log('AI report generated successfully');

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating AI report:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
