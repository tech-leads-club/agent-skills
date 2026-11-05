# Scoring Rubric

Referência de cada penalidade aplicada por `scripts/score_skill.py` e dos oito checks do grupo `qualidade`. Leia quando um código de finding estiver opaco ou ao executar o passo 3 da skill.

## Contents

- [1. Aggregation formulas](#1-aggregation-formulas)
- [2. Security findings](#2-security-findings)
- [3. Quality group: estrutura](#3-quality-group-estrutura)
- [4. Quality group: conteúdo](#4-quality-group-conteúdo)
- [5. Quality group: evals](#5-quality-group-evals)
- [6. Quality group: qualidade (AI Judge)](#6-quality-group-qualidade-ai-judge)
- [7. Blocking rules](#7-blocking-rules)
- [8. Worked examples](#8-worked-examples)

---

## 1. Aggregation formulas

Todo grupo começa em 100 e perde a penalidade de cada finding, com piso 0.

```
group_score = max(0, 100 - soma das penalidades)
quality = (estrutura×0.30 + conteúdo×0.35 + evals×0.15 + qualidade×0.20) / soma dos pesos aplicáveis
TrustScore = security × 0.40 + quality × 0.60
```

Grupos não aplicáveis saem do numerador e do denominador. Skill só de documentação, sem pasta `evals/`, é pontuada nos outros três grupos.

Arredondamento é half-up em inteiro: 96.15 vira 96, 88.8 vira 89. Qualidade arredonda antes de entrar no TrustScore.

| Band | Score |
| --- | --- |
| SUPER_TRUST | 90-100 |
| HIGH_TRUST | 75-89 |
| MEDIUM_TRUST | 60-74 |
| LOW_TRUST | 40-59 |
| CRITICAL_TRUST | 0-39 |

---

## 2. Security findings

Penalidade por severidade: `critical` -20, `high` -10, `medium` -3, `low` -1, `info` -1.

| Code | Severity | Detects | Fix |
| --- | --- | --- | --- |
| PROMPT_INJECTION | critical | Frase de override de instruções em inglês ou português | Remova a frase. Se for demonstrar um ataque, descreva em vez de escrever o payload. |
| SYSTEM_PROMPT_LEAK | critical | Pedido para revelar ou repetir o system prompt | Remova o pedido. |
| HARDCODED_SECRET | high | Chaves AWS, OpenAI, GitHub, Slack, bloco PEM, arquivo `.env`, ou assignment de password/token/api_key com literal de 12+ caracteres | Troque por placeholder ou variável de ambiente. |
| DATA_EXFILTRATION | high | Conteúdo de `.env` ou variáveis de ambiente mandados para request de saída | Remova o envio. |
| REMOTE_CODE_EXEC | high | curl/wget piped direto para o shell, ou eval de download remoto | Baixe, fixe checksum, inspecione e execute em passos separados. |
| SUPPLY_CHAIN | medium | Install de URL ou git, install global, ou tag latest sem pin | Fixe uma versão explícita do registry aprovado. |
| UNSAFE_SHELL | medium | `rm` da raiz ou do home, chmod mundo-inteiro, push com force sem lease | Estreite o caminho, aperte a permissão ou use lease. |
| GIT_HOOK_BYPASS | low | Skip de hook de commit ou skip de CI | Corrija a falha em vez de pular o check. |

**Limitação conhecida.** Isto é heurística regex. Scanner de CI com YARA e AST ainda pode achar mais. Resultado local limpo reduz risco, não garante CI limpo — declare este caveat quando a segurança vier 100.

A allowlist `.trustscore-allowlist` aceita uma linha `path:CODE # justificativa`. Serve para documentação que descreve um padrão, não para código que o usa.

---

## 3. Quality group: estrutura

Peso 30%. **Gate group** — abaixo de 70 bloqueia o merge.

| Code | Penalty | Condition | Fix |
| --- | --- | --- | --- |
| (hard failure) | — | `SKILL.md` ausente ou com caixa errada | Crie `SKILL.md` com essa caixa. O script sai com código 2. |
| FOLDER_NOT_KEBAB | -15 | Pasta com maiúscula, espaço ou underscore, ou não começa com letra | Renomeie para kebab-case. |
| NAME_FOLDER_MISMATCH | -10 | Frontmatter `name` diferente do nome da pasta | Deixe os dois idênticos. O registry deriva o slug de `name`. |
| README_IN_SKILL | -10 | Existe `README.md` dentro da pasta da skill | Apague. Skill é para o agente; onboarding humano fica fora do pacote. |

Se `name` estiver ausente, o mismatch não empilha: isso já é `NAME_MISSING` em conteúdo.

---

## 4. Quality group: conteúdo

Peso 35%. **Gate group** — abaixo de 70 bloqueia o merge.

### Frontmatter

| Code | Penalty | Condition | Fix |
| --- | --- | --- | --- |
| FRONTMATTER_MISSING | -15 | Arquivo não abre com um bloco `---` válido | Abra e feche o frontmatter com `---`. |
| NAME_MISSING | -15 | Sem campo `name` | Inclua `name` em kebab-case. |
| DESCRIPTION_MISSING | -15 | Sem campo `description` | Inclua a description em uma linha. |
| NAME_FORMAT | -15 | `name` não está em kebab-case | Letras minúsculas, dígitos e hífens, começando com letra. |
| NAME_TOO_LONG | -15 | `name` passa de 64 caracteres | Encurte o slug. |
| NAME_RESERVED | -15 | `name` contém `claude` ou `anthropic` | Tire o nome reservado. |
| DESCRIPTION_MULTILINE | -15 | `description` usa operador YAML multilinha | Deixe em uma única linha. `|` e `>` quebram o parser do registry. |

A `description` tem que ser uma linha só.

### Description quality

| Code | Penalty | Condition | Fix |
| --- | --- | --- | --- |
| DESCRIPTION_SHORT | -5 | Menos de 50 caracteres | Expanda com as frases que o usuário diria. |
| DESCRIPTION_LONG | -5 | Mais de 500 e até 1024 | Aperte o texto. |
| DESCRIPTION_TOO_LONG | -15 | Mais de 1024 | Limite duro. Mova detalhe para o corpo. |
| DESCRIPTION_ANGLE_BRACKETS | -15 | Contém `<` ou `>` | Remova; quebram o parser. |
| DESCRIPTION_VAGUE | -5 | Usa "helps with", "does stuff", "processes data", "utility for" ou equivalentes em português | Diga o resultado concreto. |
| DESCRIPTION_NO_TRIGGER | -5 | Sem cláusula Use when / quando o usuário | Inclua frases reais de ativação. |
| DESCRIPTION_NO_NEGATIVE | -5 | Sem cláusula Do NOT use for / não use | Inclua gatilhos negativos. |

Estrutura mandatória: `[o que faz] + [use when ...] + [do NOT use for ...]`. A description é o campo mais importante: progressive disclosure mostra só `name` + `description` antes de carregar o corpo.

`DESCRIPTION_LONG` e `DESCRIPTION_TOO_LONG` não empilham. Acima de 1024 vale só o limite duro.

### Body

| Code | Penalty | Condition | Fix |
| --- | --- | --- | --- |
| SECTION_MISSING | -2 cada | Falta uma seção do conjunto: Purpose, Instructions, Examples, Overview, When to Use, Quick Start, Common Use Cases, Best Practices, Resources (também aceita os nomes em português) | Inclua a seção. As nove não são todas obrigatórias, mas cada ausência custa 2. |
| LINES_NEAR_LIMIT | -5 | Mais de 400 linhas | Descarregue detalhe em `references/`. |
| LINES_EXCEEDED | -10 | Mais de 500 linhas | Limite duro. |
| TOKENS_EXCEEDED | -10 | Mais de cerca de 2000 tokens (4 caracteres por token) | Encurte o corpo. |
| REFERENCE_BROKEN | -10 cada, no máximo 10 | Caminho referido em `references/`, `scripts/`, `assets/`, `templates/` ou `evals/` não existe | Crie o arquivo ou corrija o caminho. Sempre barra para frente. |
| HARDCODED_DATE | -5 cada | Data ISO ou calendário brasileiro fora de bloco de código | Remova. Conteúdo temporal envelhece. |

---

## 5. Quality group: evals

Peso 15%. Não é gate: falhas baixam a nota e não bloqueiam.

Procura `evals/cases.json`, aceitando array no topo ou objeto com chave `cases`.

| Code | Penalty | Condition | Fix |
| --- | --- | --- | --- |
| (not applicable) | 0 | Sem pasta `evals/` | Skill só de documentação não é penalizada; o grupo some e os pesos redistribuem. |
| EVALS_MISNAMED | -100 | Pasta `evals/` existe sem `cases.json` | Renomeie para `evals/cases.json`. |
| EVALS_UNREADABLE | -100 | JSON não parseia | Corrija a sintaxe. |
| EVALS_SHAPE | -100 | Nem array nem objeto com `cases` | Use um dos dois formatos aceitos. |
| EVALS_TOO_FEW | -10 | Menos de 5 casos | Cubra happy path, edge e erro. |
| EVALS_NEAR_MINIMUM | -5 | 5 ou 6 casos | Amplie a margem. |
| EVALS_FIELD_MISSING | -5 cada | Caso sem `id`, `description`, `expected_output`, ou sem `input` e `context` | Preencha os campos. `input` para skill executável, `context` para cognitiva. |
| EVALS_CASE_SHAPE | -5 | Caso não é objeto JSON | Faça cada caso ser um objeto. |

O script local valida só estrutura, não executa os casos.

---

## 6. Quality group: qualidade (AI Judge)

Peso 20%. Não é gate. Semântica — o script não calcula; você nota no passo 3 e passa a média em `--ai-quality-score`.

Note cada check de 0 a 100 e tire a média simples dos oito.

| Check | 90-100 | 50-70 | 0-40 |
| --- | --- | --- | --- |
| clarity | Toda instrução é inequívoca numa leitura fria | Alguns passos pedem releitura | Contraditório ou confuso |
| completeness | Cobre o que a description promete, inclusive erro | Só happy path | Buracos grandes; o agente trava |
| accuracy | Correto e internamente consistente; comandos e caminhos funcionam | Desatualização menor | Informação errada que causa falha |
| structure | Passos numerados com ramificações explícitas | Organizado, difícil de navegar | Muro de prosa |
| examples | Pares concretos de entrada/saída para os cenários principais | Um exemplo fino | Nenhum |
| best_practices | Segue convenção do domínio; avisa gotcha real | Conselho genérico | Empurra anti-padrão |
| conciseness | Um termo por conceito, sem repetição, sem enchimento | Alguma redundância | Inchado; o agente vai pular instrução |
| evals_coverage | Casos cobrem happy path, edge e erro | Só happy path | Ausente ou trivial |

Seja estrito. Na dúvida entre duas faixas, fique na de baixo — estimativa inflada é pior do que estimativa nenhuma, porque cria confiança falsa.

Quando `evals` não se aplica (skill só de documentação, sem pasta `evals/`), tire `evals_coverage` da média e divida pelos sete checks restantes. Pontuar 0 penalizaria skills que o grupo evals isenta de propósito.

Dois termos-regra pesam em `clarity` e `conciseness`: um termo por conceito, sem sinônimo alternado; um default recomendado por decisão.

Quando o AI Judge não roda, o grupo fica `SKIPPED`, os pesos redistribuem, e a skill é marcada para revisão manual sem bloquear.

---

## 7. Blocking rules

Bloqueio é **independente da nota**. A nota nunca é rebaixada artificialmente; uma skill pode chegar a 90/SUPER_TRUST e ainda assim ser bloqueada.

A skill é bloqueada quando qualquer um vale:

1. Finding de segurança `critical` ou `high`
2. Gate group (`estrutura` ou `conteúdo`) abaixo de 70
3. TrustScore abaixo de 70

Falhas moles em `qualidade` ou `evals` baixam a nota e aparecem como aviso, mas não bloqueiam sozinhas.

Badges, só para referência: Gold em 90+, Silver em 80+, Bronze em 70+, nenhum abaixo de 70. Qualquer finding não bloqueante limita o badge a Silver.

---

## 8. Worked examples

### Clean skill with evals

```
Security = 100
estrutura = 100
conteúdo = 100 - 2 (Resources ausente) = 98
evals = 100 - 5 (6 casos, perto do mínimo) = 95
qualidade = 88

quality = 100×0.30 + 98×0.35 + 95×0.15 + 88×0.20
        = 30 + 34.3 + 14.25 + 17.6 = 96.15 = 96
TrustScore = 100×0.40 + 96×0.60 = 40 + 57.6 = 98 → SUPER_TRUST, eligible
```

### Documentation-only skill (evals excluded)

```
Security = 100 - 3 (um medium) = 97
estrutura = 100
conteúdo = 100 - 10 (5 seções ausentes) = 90
evals = não aplicável → peso redistribuído
qualidade = 80

pesos aplicáveis = 0.30 + 0.35 + 0.20 = 0.85
quality = (100×0.30 + 90×0.35 + 80×0.20) / 0.85
        = (30 + 31.5 + 16) / 0.85 = 91.2 = 91
TrustScore = 97×0.40 + 91×0.60 = 38.8 + 54.6 = 93 → SUPER_TRUST, eligible
```

### High score, blocked anyway

```
Security = 100 - 10 (um high: segredo hardcoded) = 90
quality = 88
TrustScore = 90×0.40 + 88×0.60 = 36 + 52.8 = 89 → HIGH_TRUST
Blocked: finding high bloqueia independente da nota.
```

O conserto é obrigatório, não opcional. Tirar o segredo devolve segurança 100 e levanta o TrustScore para 93, com o bloqueio limpo.

### Gate group failure

```
estrutura = 100
conteúdo = 100 - 15 (sem description) - 15 (name fora de kebab-case) - 20 (dois references quebrados) = 50
evals = não aplicável
qualidade = 70

quality = (100×0.30 + 50×0.35 + 70×0.20) / 0.85 = (30 + 17.5 + 14) / 0.85 = 72.4 = 72
TrustScore = 100×0.40 + 72×0.60 = 40 + 43.2 = 83 → HIGH_TRUST
Blocked: conteúdo ficou em 50, abaixo do gate 70.
```

Corrigir os três findings de conteúdo devolve o grupo a 100, sobe o TrustScore para 94 e limpa o bloqueio.
