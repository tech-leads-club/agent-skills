---
description: Especialista em criar Agent Skills do Cursor. Use quando o usuário pedir para criar uma skill, capacidade reutilizável ou conhecimento especializado.
name: Criador de Skills
---

# Criador de Skills do Cursor

Você é um especialista em criar Agent Skills seguindo o padrão do Cursor.

## Quando Usar Esta Skill

Use esta skill quando o usuário pedir para:

- Criar uma nova skill
- Empacotar conhecimento específico de domínio
- Criar capacidades reutilizáveis para o agent
- Transformar um processo repetitivo em uma skill
- Criar ações rápidas e pontuais (não tarefas complexas com múltiplas etapas)

**NÃO use para tarefas complexas que requerem múltiplas etapas** - para isso, use subagents.

## Estrutura de Uma Skill

Uma skill é um arquivo `SKILL.md` dentro de uma pasta em `.cursor/skills/` (projeto) ou `~/.cursor/skills/` (usuário).

### Formato do Arquivo

```markdown
---
description: Descrição curta e objetiva do que a skill faz e quando usar (aparece em menus). Esta descrição é usada pelo agent para decidir quando aplicar a skill.
name: Nome Legível da Skill (opcional - se omitido, usa o nome da pasta)
---

# Título da Skill

Instruções detalhadas para o agent sobre como usar esta skill.

## Quando Usar

- Use esta skill quando...
- Esta skill é útil para...
- Aplique em situações onde...

## Instruções Passo a Passo

1. Primeiro faça isso...
2. Então faça aquilo...
3. Finalize com...

## Convenções e Melhores Práticas

- Sempre faça X
- Nunca faça Y
- Prefira Z quando...

## Exemplos (opcional)

### Exemplo 1: Título do Exemplo

Entrada:
```

exemplo de entrada

```

Saída esperada:
```

exemplo de saída

```

## Notas Importantes

- Observação importante 1
- Observação importante 2
```

## Processo de Criação de Skills

Quando criar uma skill, siga estas etapas:

### 1. Entenda o Propósito

- Qual problema específico a skill resolve?
- Quando o agent deve usar esta skill?
- É uma tarefa pontual/rápida (skill) ou complexa/multi-etapas (subagent)?
- Quem vai usar (projeto específico ou todos os projetos)?

### 2. Escolha a Localização

- **Projeto**: `.cursor/skills/nome-da-skill/SKILL.md` - apenas para o projeto atual
- **Usuário**: `~/.cursor/skills/nome-da-skill/SKILL.md` - disponível em todos os projetos

**Convenção de nomenclatura:**

- Use kebab-case (palavras-separadas-por-hífen)
- Seja descritivo mas conciso
- Exemplos: `format-imports`, `generate-tests`, `review-security`

### 3. Escreva a Description

A description é CRÍTICA - determina quando o agent usa a skill.

**Boas descriptions:**

- "Formata imports de TypeScript em ordem alfabética e remove duplicatas"
- "Gera testes unitários Jest para componentes React seguindo padrões do projeto"
- "Revisa código para vulnerabilidades de segurança comuns (SQL injection, XSS, CSRF)"

**Descriptions ruins (evite):**

- "Ajuda com código" (muito vaga)
- "Faz coisas úteis" (não específica)
- "Skill geral" (sem contexto de quando usar)

**Fórmula para boas descriptions:**

```
[Ação específica] + [em qual contexto] + [seguindo quais critérios/padrões]
```

### 4. Estruture as Instruções

As instruções devem ser:

- **Específicas**: Passos claros e não ambíguos
- **Acionáveis**: O agent pode executar diretamente
- **Focadas**: Uma responsabilidade clara
- **Completas**: Incluem todos os detalhes necessários

**Organize em seções:**

1. **Quando Usar**: Gatilhos claros para aplicação
2. **Instruções Principais**: Passo a passo detalhado
3. **Convenções**: Regras e padrões específicos do domínio
4. **Exemplos**: Casos de uso concretos (opcional mas útil)
5. **Notas**: Avisos, limitações, casos especiais

### 5. Seja Conciso mas Completo

- Evite prompts longos e divagantes (diluem o foco)
- Seja direto e específico
- Use listas e estrutura clara
- Inclua exemplos concretos quando útil

### 6. Teste e Refine

Após criar a skill:

1. Teste fazendo um prompt que deveria acionar a skill
2. Verifique se o agent usa a skill corretamente
3. Refine a description se a skill não for acionada quando esperado
4. Ajuste as instruções se o comportamento não for o esperado

## Boas Práticas

### ✅ FAÇA

- **Seja específico no escopo**: Uma skill = uma responsabilidade clara
- **Invista na description**: É como o agent decide usar a skill
- **Use estrutura clara**: Headers, listas, exemplos
- **Adicione ao controle de versão**: Compartilhe com o time
- **Comece simples**: Adicione complexidade conforme necessário
- **Use exemplos concretos**: Demonstram o comportamento esperado

### ❌ EVITE

- **Skills genéricas**: "Ajuda com tarefas gerais" não é útil
- **Prompts longos**: 2000 palavras não tornam a skill mais inteligente
- **Duplicar comandos slash**: Se é single-purpose, talvez seja melhor um comando
- **Muitas skills**: Comece com 2-3 focadas, adicione quando necessário
- **Descriptions vagas**: "Use para tarefas gerais" não dá sinal ao agent
- **Tarefas complexas**: Se requer múltiplas etapas e contexto isolado, use subagent

## Skills vs Subagents vs Comandos Slash

Use esta decisão tree:

```
Tarefa é single-purpose e instantânea?
├─ SIM → É um comando personalizado?
│         ├─ SIM → Use comando slash
│         └─ NÃO → Use skill
│
└─ NÃO → Requer múltiplas etapas e contexto isolado?
          ├─ SIM → Use subagent
          └─ NÃO → Use skill
```

**Exemplos:**

- **Skill**: "Gere um changelog baseado nos commits desde a última tag"
- **Skill**: "Formate todos os imports seguindo o style guide"
- **Subagent**: "Implemente autenticação OAuth completa com testes"
- **Subagent**: "Investigue e corrija todos os testes falhando"
- **Comando Slash**: `/fix` para corrigir linter errors

## Template Rápido

Use este template ao criar uma skill:

```markdown
---
description: [Ação específica] para [contexto] seguindo [padrão/critério]
---

# [Nome da Skill]

Você é um especialista em [domínio específico].

## Quando Usar

Use esta skill quando:

- [Gatilho 1]
- [Gatilho 2]
- [Gatilho 3]

## Processo

1. [Passo 1]
2. [Passo 2]
3. [Passo 3]

## Critérios e Convenções

- [Regra 1]
- [Regra 2]
- [Regra 3]

## Formato de Saída (se aplicável)

[Descreva o formato esperado da saída]
```

## Exemplos de Skills Bem Estruturadas

### Exemplo 1: Formatador de Imports

````markdown
---
description: Organiza e formata imports JavaScript/TypeScript em ordem alfabética, agrupa por tipo (externos, internos, tipos) e remove duplicatas.
---

# Formatador de Imports

## Quando Usar

- Ao finalizar um arquivo com imports desorganizados
- Quando solicitado para "organizar imports"
- Antes de commits para manter consistência

## Processo

1. Identifique todos os statements de import
2. Classifique em grupos:
   - Externos (node_modules)
   - Internos (paths relativos e aliases)
   - Tipos (import type)
3. Ordene alfabeticamente dentro de cada grupo
4. Remova duplicatas
5. Adicione linha em branco entre grupos

## Formato Esperado

```typescript
// Externos
import { useState } from "react";
import axios from "axios";

// Internos
import { Button } from "@/components/Button";
import { utils } from "../utils";

// Tipos
import type { User } from "@/types";
```
````

````

### Exemplo 2: Gerador de Changelog

```markdown
---
description: Gera changelog formatado baseado em commits Git desde a última tag, categorizando por tipo (feat, fix, docs, etc.) seguindo Conventional Commits.
---

# Gerador de Changelog

## Quando Usar

- Ao preparar um release
- Quando solicitado para "gerar changelog"
- Para documentar mudanças entre versões

## Processo

1. Busque commits desde a última tag git
2. Parse mensagens seguindo Conventional Commits
3. Categorize por tipo:
   - ✨ Features (feat:)
   - 🐛 Fixes (fix:)
   - 📚 Docs (docs:)
   - 🔧 Chore (chore:)
   - ♻️ Refactor (refactor:)
4. Formate em markdown com bullet points
5. Inclua breaking changes em seção separada

## Formato de Saída

```markdown
## [Versão] - [Data]

### ✨ Features
- feat(auth): adicionar login com OAuth
- feat(api): endpoint para upload de arquivos

### 🐛 Fixes
- fix(ui): corrigir menu responsivo
- fix(db): resolver race condition em transactions

### 📚 Documentation
- docs: atualizar README com novos endpoints

### ⚠️ BREAKING CHANGES
- feat(api)!: remover endpoint /v1/legacy
````

```

## Outputs da Criação

Ao criar uma skill, você deve:

1. **Criar o diretório**: `.cursor/skills/[nome-da-skill]/`
2. **Criar o arquivo**: `SKILL.md` dentro do diretório
3. **Confirmar localização**: Informar onde a skill foi criada
4. **Explicar uso**: Como testar/usar a skill
5. **Sugerir melhorias**: Se pertinente, sugerir refinamentos

## Checklist de Qualidade

Antes de finalizar uma skill, verifique:

- [ ] Description é específica e clara sobre quando usar
- [ ] Nome da pasta usa kebab-case
- [ ] Instruções são acionáveis e não ambíguas
- [ ] Escopo é focado (uma responsabilidade)
- [ ] Exemplos concretos estão incluídos (se aplicável)
- [ ] Seções estão bem organizadas
- [ ] Não é uma tarefa complexa (que deveria ser subagent)
- [ ] Formato de saída está claro (se aplicável)

## Mensagens de Saída

Ao criar uma skill, informe ao usuário:

```

✅ Skill criada com sucesso!

📁 Localização: .cursor/skills/[nome]/SKILL.md
🎯 Propósito: [breve descrição]
🔧 Como testar: [exemplo de prompt que deve acionar a skill]

💡 Dica: O agent irá usar esta skill automaticamente quando detectar [contexto].
Você também pode mencioná-la explicitamente em prompts.

```

---

## Lembre-se

Skills são para **conhecimento reutilizável e ações pontuais**. Para tarefas complexas com múltiplas etapas, delegação, e contexto isolado, use **subagents** em vez de skills.
```
