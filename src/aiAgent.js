// PNGIE-RDC — Module Agents IA
// Appelle réellement l'API Claude (api.anthropic.com), avec des "tools"
// (function calling) limités aux données que l'agent a le droit de lire —
// même moteur RBAC que pour les humains, pas un accès parallèle.
//
// ⚠️ Nécessite la variable d'environnement ANTHROPIC_API_KEY.
// Sans elle, l'agent répond honnêtement qu'il n'est pas configuré,
// au lieu de simuler une réponse.

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

// Chaque "tool" correspond à un endpoint interne déjà protégé par permission.
// L'agent ne peut appeler que les tools listés dans TOOLS_BY_PERMISSION[agent.permission_code].
const TOOL_DEFINITIONS = {
  'page:ministeres:read': {
    name: 'lister_ministeres',
    description: "Liste les ministères de la RDC avec leurs attributions.",
    input_schema: { type: 'object', properties: {} },
  },
  'page:ia:read': {
    name: 'lister_alertes_fraude',
    description: "Liste les contrôles et audits en cours avec conclusions (détection de fraude / IGF).",
    input_schema: { type: 'object', properties: {} },
  },
  'page:budget:read': {
    name: 'consulter_cycle_gouvernance',
    description: "Consulte le cycle instruction→exécution→contrôle→décision (budget, recouvrement, etc.).",
    input_schema: { type: 'object', properties: {} },
  },
};

// Exécute le tool demandé, en interrogeant directement la base — jamais
// au-delà de ce que la permission de l'agent autorise.
async function executeTool(db, toolName) {
  if (toolName === 'lister_ministeres') {
    return db.all(`
      SELECT o.nom, o.description FROM organization o
      JOIN organization_type ot ON ot.id = o.type_id
      WHERE ot.code = 'MINISTERE' ORDER BY o.nom LIMIT 50`);
  }
  if (toolName === 'lister_alertes_fraude') {
    return db.all(`
      SELECT c.objet, c.statut, am.conclusion, am.rapport_final
      FROM controle c LEFT JOIN audit_mission am ON am.controle_id = c.controle_id`);
  }
  if (toolName === 'consulter_cycle_gouvernance') {
    return db.all(`SELECT titre, statut, echeance FROM instruction`);
  }
  return { error: 'Tool inconnu.' };
}

/**
 * Fait parler un agent IA. Retourne { ok:true, reply } ou { ok:false, error }.
 * N'appelle JAMAIS l'API si l'agent n'a pas de permission_code valide pour le rôle appelant —
 * le contrôle RBAC est vérifié par le serveur AVANT d'arriver ici (voir server.js).
 */
async function askAgent(db, agent, userMessage, conversationHistory = []) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: "Agent IA non configuré : ANTHROPIC_API_KEY absente de l'environnement. " +
             "Le reste du système (permissions, journalisation) fonctionne ; seul l'appel au modèle est en attente d'une clé.",
    };
  }

  const tool = agent.permission_code && TOOL_DEFINITIONS[agent.permission_code];
  const tools = tool ? [tool] : [];

  const systemPrompt = agent.system_prompt ||
    `Tu es ${agent.nom}, un agent IA du PNGIE-RDC (rôle : ${agent.role_ia}). ` +
    `Tu ne dois répondre qu'avec des données que tes outils te fournissent, jamais en inventant des chiffres. ` +
    `Si tu n'as pas d'outil pertinent pour une question, dis-le clairement.`;

  const messages = [...conversationHistory, { role: 'user', content: userMessage }];

  try {
    let response = await callClaude(apiKey, systemPrompt, messages, tools);

    // Boucle simple de function-calling (1 aller-retour d'outil max, suffisant pour la démo)
    const toolUse = response.content?.find(b => b.type === 'tool_use');
    if (toolUse) {
      const toolResult = await executeTool(db, toolUse.name);
      messages.push({ role: 'assistant', content: response.content });
      messages.push({
        role: 'user',
        content: [{ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify(toolResult) }],
      });
      response = await callClaude(apiKey, systemPrompt, messages, tools);
    }

    const text = response.content?.filter(b => b.type === 'text').map(b => b.text).join('\n') || '';
    return { ok: true, reply: text, raw: response };
  } catch (err) {
    return { ok: false, error: 'Erreur API Anthropic : ' + err.message };
  }
}

async function callClaude(apiKey, system, messages, tools) {
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: MODEL, max_tokens: 1000, system, messages, tools }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
  return data;
}

module.exports = { askAgent };
