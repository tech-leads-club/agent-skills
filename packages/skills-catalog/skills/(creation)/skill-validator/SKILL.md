---
name: skill-validator
description: "Estimates a skill's TrustScore (0-100) from security and quality checks, then reports what blocks the merge and how to fix it. Use when the user says validar skill, avaliar skill, auditar skill, nota de confianca, score this skill, qual a nota da minha skill, vai passar no CI, why was my skill blocked, or review this SKILL.md before the PR. Do NOT use for criar uma skill do zero (use skill-architect), revisar codigo de aplicacao, or explicar um TrustScore que o CI ja gerou."
license: CC-BY-4.0
metadata:
  author: github.com/may-santos
  version: 2.0.0
---

# Skill Validator

## Purpose

Estimar o TrustScore de uma skill já escrita antes do pull request, para o autor corrigir localmente em vez de descobrir o bloqueio no CI.

## Overview

O script pontua segurança e qualidade e agrega um **TrustScore** de 0 a 100. Skill abaixo de 70, ou com finding bloqueante, é bloqueada.

```
TrustScore = Security × 0.40 + Quality × 0.60
```

A divisão de trabalho é deliberada: `scripts/score_skill.py` calcula o que é determinístico (estrutura, frontmatter, limites, referências, evals, padrões de segurança) e **você** entrega o que o script não consegue — o veredito semântico do AI Judge para o grupo `qualidade`.

## Quick Start

Os comandos usam o `scripts/score_skill.py` desta skill. Resolva o caminho absoluto da pasta `skill-validator` — não assuma o cwd.

```bash
# Pass 1 — grupos determinísticos
python "<pasta-desta-skill>/scripts/score_skill.py" <pasta-avaliada>

# Pass 2 — depois de julgar o grupo qualidade (passo 3)
python "<pasta-desta-skill>/scripts/score_skill.py" <pasta-avaliada> --ai-quality-score 85
```

Requer Python 3.9+, só stdlib. Códigos de saída: `0` merge-eligible, `1` blocked, `2` pacote ilegível. Some `--json` para saída máquina.

## When to Use

- "Validate my skill before I open the PR"
- "Qual nota essa skill vai tirar?" / "Vai passar no gate?"
- "Why would this skill be blocked?"
- "Review this SKILL.md against the publishing standards"
- Depois de editar uma skill, para confirmar que a mudança não baixou a nota
- Pasta local, arquivo `SKILL.md`, ou URL github.com da pasta da skill

## Do NOT Use For

- **Criar uma skill do zero** → use `skill-architect`
- **Revisar código de aplicação** → use `code-reviewer`
- **Explicar um TrustScore que o CI já gerou** → leia os artefatos do pipeline; esta skill estima, não parseia relatório de CI
- **Mudar limiar ou peso** → isso vive neste script e é decisão de governança

## Instructions

### Step 1: Locate the skill package

Resolva a pasta que contém `SKILL.md`. Se o usuário nomear uma skill sem caminho, procure em `skills/` e em `.cursor/skills/`.

Se a origem for uma URL github.com, baixe só a pasta da skill (clone raso ou raw) para um diretório temporário e pontue esse caminho local. Não invente nota sem o script.

Se `SKILL.md` estiver ausente, pare e reporte: o gate `estrutura` falha na hora e nada mais pode ser pontuado. O arquivo tem que se chamar exatamente `SKILL.md` — o CI roda em Linux, onde caixa importa.

Se vier mais de uma pasta, repita o fluxo inteiro para cada uma.

### Step 2: Run the deterministic pass

Rode o comando Pass 1 do Quick Start. O grupo `qualidade` volta `not scored`; isso é esperado.

### Step 3: Judge the `qualidade` group

Note oito checks de 0 a 100 e tire a média: **clarity**, **completeness**, **accuracy**, **structure**, **examples**, **best_practices**, **conciseness**, **evals_coverage**.

Leia `references/scoring-rubric.md` seção 6 para o que cada check significa e as faixas. Seja estrito. Estimativa inflada cria confiança falsa.

Se a pasta `evals/` não existir, tire `evals_coverage` da média e divida pelos sete restantes.

### Step 4: Re-run with your verdict

Rode o comando Pass 2. Os quatro grupos de qualidade agora entram na conta (`estrutura` 30%, `conteúdo` 35%, `qualidade` 20%, `evals` 15%) e o TrustScore fecha.

### Step 5: Report and iterate

Apresente nesta ordem:

1. **TrustScore and classification**
2. **Dimension breakdown** — segurança e qualidade, depois os quatro grupos
3. **Blocking reasons**, se houver — isto importa mais do que a nota
4. **Prioritized fixes** — maior penalidade primeiro, cada uma com a edição concreta

- Se `blocked` for true, trate os findings bloqueantes como obrigatórios e ofereça aplicar os consertos.
- Se `blocked` for false mas a nota estiver abaixo de 75, liste as vitórias mais baratas para chegar em HIGH_TRUST.
- Depois de qualquer conserto, **re-rode os passos 2 e 4** para confirmar que a nota andou. Repita até desbloquear.

Não reescreva a skill avaliada a menos que o usuário peça o conserto.

## Common Use Cases

| Situation | Resolution |
| --- | --- |
| Pre-PR check de uma skill saudável | As duas passadas, reporte a faixa, note as vitórias restantes mais baratas |
| Nota alta mas o gate falha | Finding `critical`/`high` ou gate group abaixo de 70 bloqueia independente da nota |
| Nota caiu depois de uma edição | Diff dos findings contra a rodada anterior; em geral reference quebrado ou limite de tamanho |
| Skill documenta padrões de ataque | Falso positivo esperado — suprima em `.trustscore-allowlist` com justificativa |
| Sem pasta `evals/` | Não é penalizado; o grupo sai e os pesos redistribuem |
| URL do GitHub | Baixe a pasta da skill e rode o script no caminho local |

## Best Practices

- **Reporte o bloqueio antes da nota.** Uma skill 90/SUPER_TRUST com finding `high` continua bloqueada; começar pelo número engana o autor.
- **Declare o caveat heurístico numa segurança 100.** A passada local é regex e mais estreita que um scanner de CI com YARA/AST.
- **Nunca suprima finding para subir a nota.** A allowlist é para documentação que descreve um padrão, não para código que o usa. Cada linha precisa de justificativa.
- **Conserte gate groups primeiro.** `estrutura` e `conteúdo` carregam 65% do peso de qualidade e são os únicos grupos que bloqueiam.
- **Confie nos grupos determinísticos.** Se eles discordarem do CI, a config mudou e esta skill precisa de atualização.

## Examples

### Example 1: Healthy skill

**Input:** "Validate `.cursor/skills/skill-architect` before I open the PR"

**Actions:** Pass 1 → julgue os oito checks (média 88) → Pass 2 com `--ai-quality-score 88`.

```
Merge: eligible
TrustScore: 93/100 — SUPER_TRUST
Security (40%): 100/100
Quality (60%): 89/100
- estrutura (30%) [gate]: 100/100
- conteúdo (35%) [gate]: 90/100
- qualidade (20%): 88/100
- evals (15%): 80/100
```

**Report:** merge-eligible em SUPER_TRUST. `conteúdo` perdeu 10 para uma seção Resources ausente. A passada de segurança é heurística, então o CI ainda pode achar mais.

### Example 2: High score, merge still blocked

**Input:** "This skill scored well, why is the gate failing?"

```
TrustScore (estimated): 81/100 — HIGH_TRUST
Merge: BLOCKED
Blocking reasons:
- Segurança [high] scripts/setup.sh:12 — credencial hardcoded
```

**Report:** finding `high` bloqueia independente da nota. Troque a credencial por variável de ambiente e re-rode para confirmar segurança 100.

### Example 3: Gate group failure

**Input:** "Why was my skill rejected?"

**Output:** `conteúdo` ficou em 55 (abaixo do gate 70) por `description` ausente, `name` fora de kebab-case e dois caminhos em `references/` quebrados.

**Report:** os três consertos na ordem de penalidade. Aplique e re-rode — `conteúdo` volta a 100 e a nota passa do limiar.

## Troubleshooting

**SKILL.md not found** — o caminho aponta para a pasta errada, ou o arquivo está com caixa errada. Passe a pasta que contém exatamente `SKILL.md`.

**invalid int value** ou **must be between 0 and 100** — o veredito veio como fração ou fora da faixa. Converta para porcentagem inteira: `0.85` vira `85`.

**Score disagrees with CI** — a passada de segurança é heurística e o veredito de `qualidade` difere do modelo de produção. Trate o resultado como estimativa com margem de cerca de uma faixa; os grupos determinísticos devem bater.

## Resources

- `references/scoring-rubric.md` — cada penalidade por código, as oito faixas do AI Judge, regras de bloqueio e contas trabalhadas. Leia quando um código estiver opaco ou ao julgar o passo 3.
- `scripts/score_skill.py` — rode; as constantes no topo são a fonte dos pesos e limiares.
- `.trustscore-allowlist` — arquivo opcional **na skill avaliada**, uma linha `path:CODE # justificativa`. Não faz parte deste pacote.
