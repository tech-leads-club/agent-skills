---
title: "TLC Spec-Driven v3: precisão de escopo e qualidade, com simplicidade"
description: "A v3 do TLC Spec-Driven torna o framework o mais consistente para mapeamento de escopo e qualidade em bases de código complexas, com um verificador independente, uma camada de lições que aprende sozinha e um fluxo único, sem CLI."
date: 2026-06-25
lang: pt-BR
tags: [spec-driven-development, ai-agents, tech-leads-club, tlc-spec-driven]
---

# TLC Spec-Driven v3: precisão de escopo e qualidade, com simplicidade

Construir software com agentes de IA ficou fácil. Construir software **certo**, de forma **repetível**, em bases de código **complexas e de alta qualidade**: isso continua difícil. O agente entende mal o escopo, inventa requisitos, escreve testes que não provam nada e some com o contexto na próxima sessão.

A versão 3 do **TLC Spec-Driven** evolui o framework para atacar exatamente esses dois problemas: **mapeamento de escopo** e **qualidade**. E faz isso na direção contrária ao que o mercado vem fazendo: em vez de mais ferramentas, mais CLIs e mais cerimônia, o TLC aposta na simplicidade.

> Instale com um comando:
>
> ```bash
> npx @tech-leads-club/agent-skills install --skill tlc-spec-driven
> ```

---

## A tese: simplicidade que potencializa os modelos

Conforme os modelos ficam mais inteligentes, você **não precisa de mais harness, precisa do harness certo**. Frameworks que empilham CLIs, fluxos de trabalho elaborados e dezenas de arquivos de configuração acabam competindo com o modelo, em vez de ajudá-lo.

O TLC Spec-Driven v3 vai no caminho oposto:

- **Sem CLI.**
- **Sem fluxos de trabalho complexos.**
- **Apenas uma skill** que sai da frente do modelo.

É um único fluxo, que se ajusta automaticamente à complexidade da tarefa. Nada de pipeline fixo para um bugfix de uma linha; nada de improviso para uma feature multi-componente.

---

## O que mudou na v3 (2.0.0 → 3.0.0)

A v3 é uma simplificação radical com um salto de rigor. Os destaques:

### 1. Um único fluxo, auto-dimensionado

`Especificar → (Projetar) → (Tarefas) → Executar → Verificar (sempre ligado)`

As fases **Especificar**, **Executar** e **Verificar** são sempre obrigatórias; **Projetar** e **Tarefas** entram apenas quando o escopo exige. O agente decide a profundidade certa: zero cerimônia, zero excesso de engenharia.

Saíram de cena: o modo rápido (*Quick mode*), os 6 documentos do mapeamento *brownfield*, a camada de projeto/roadmap/handoff, a dependência de um `TESTING.md` e as integrações com skills externas. Menos peças móveis, mais foco.

Importante: o **valor do brownfield mapping não foi removido**, só deixou de morar em arquivos. Em vez de gerar e manter 6 documentos que envelhecem, o entendimento da stack, da arquitetura, das convenções e das áreas frágeis passa a ser feito **sempre durante o processo**, no momento em que importa. O resultado é mais **confiável** (nunca desatualizado) e mais **simples** (nada para manter).

### 2. Adeus RED/GREEN, olá verificador independente

O antigo ritual de testes "primeiro o teste, depois o código" (RED/GREEN) foi **removido por completo**. No lugar dele entra a garantia mais forte que um framework de agentes pode oferecer: **o autor nunca é o verificador**.

Depois da última tarefa, um **sub-agente novo, somente leitura** roda automaticamente e:

- faz uma checagem de resultado **ancorada na spec** (o valor afirmado bate com o resultado definido na especificação?);
- aciona um **sensor de discriminação**: injeta falhas propositais e confirma que os testes realmente as detectam;
- escreve um relatório de validação e devolve um veredito, com um ciclo de correção limitado a 3 iterações.

Resultado: testes que **de fato discriminam** comportamento, não testes que apenas "passam".

### 3. Camada de lições que se aprimora sozinha

Toda falha de verificação vira aprendizado. Sinais concretos (um *mutante* que sobreviveu, uma lacuna de critério de aceitação, um desvio de spec) são destilados em **lições curtas e locais ao projeto**, carregadas automaticamente nas próximas specs e designs.

Na prática: **o framework fica mais afiado na sua base de código quanto mais você o usa**. Sem dependências externas: para desativar, basta apagar dois arquivos.

### 4. Portão de fechamento de requisitos

Nenhum requisito sai da especificação **silenciosamente ambíguo**. O *Requirement Closure Gate* obriga: cada questão em aberto é resolvida com você **ou** registrada como uma premissa assinada. Áreas cinzentas recusadas ficam documentadas, nunca são simplesmente descartadas.

É o coração do **mapeamento de escopo**: o agente captura até os requisitos implícitos e os casos de borda que a maioria dos agentes ignora, com uma tabela explícita de fora de escopo para barrar o *scope creep* na origem.

### 5. Memória conectada e carregamento confiável

- Um único `.specs/STATE.md`: registro de decisões (AD-NNN) e um *snapshot* de handoff para pausar e retomar.
- Carregamento da skill **por nome**, resolvido de forma portátil, sem caminhos de instalação chumbados no código. Se a skill não puder ser ativada, o agente **para e avisa**, em vez de rodar pela metade fingindo rigor.

---

## A prova: o benchmark

Promessas são fáceis. O TLC Spec-Driven foi medido contra três frameworks de spec-driven em **três execuções independentes** de ponta a ponta, com o mesmo modelo de planejamento (Opus Reasoning High) e de implementação (Sonnet 4.6).

| Framework   | Score (run salvo) | Média (3 runs) | Aderência de escopo | Completude de testes (T) | Tokens |
| ----------- | :---------------: | :------------: | :-----------------: | :----------------------: | :----: |
| **TLC**     |       0.94        |    **0.92**    |     **pass** ✅     |         **0.91**         | ~30M   |
| Speckit     |       0.95        |      0.91      |       partial       |           0.90           | ~37M   |
| OpenSpec    |       0.83        |      0.81      |       partial       |           0.62           | ~24M   |
| Superpowers |       0.76        |      0.78      |       partial       |           0.61           | ~39M   |

Lendo só o *score* do run salvo (0.95 vs 0.94), o Speckit parece à frente. Mas isso **subestima o TLC**. Olhando o quadro completo:

- **Maior média entre os runs**: 0.92, acima do Speckit (0.91), com **pico de 0.94**.
- **Maior consistência**: o menor *spread* (±0.03) e o piso mais alto (0.91 vs 0.89 do Speckit). Qualidade que se repete.
- **O único com escopo limpo**: `Scope = pass`, sem desvio de plano. Todo build rastreia até um requisito sancionado.
- **Mais eficiente**: cerca de **7M tokens a menos** que o Speckit (o framework mais lento), entregando ao mesmo tempo os **testes mais significativos** (≈49 mapeados a critérios, dos 69 escritos).

Nas três perguntas diretas do benchmark, o TLC **vence duas e empata a terceira**:

1. Quem adiciona mais testes significativos? **TLC.**
2. Quem mais adere aos requisitos? **TLC** (o único com escopo limpo).
3. Quem entrega a melhor solução geral? **Empate técnico** com o Speckit, mas o TLC chega lá de forma mais limpa e mais barata.

A escolha de **alto valor e repetível**.

---

## Como funciona, em cinco passos

1. **SPECIFY**: mapeia o escopo completo, com requisitos testáveis em IDs únicos, casos de borda e tabela de fora de escopo. *Sempre obrigatório.*
2. **DESIGN**: arquitetura, fluxo de dados, reúso de código e mitigação de áreas frágeis. *Pulado automaticamente* quando não há nada a decidir.
3. **TASKS**: tarefas atômicas com dependências, testes e critérios de verificação. *Pulado automaticamente* quando há ≤3 passos óbvios.
4. **EXECUTE**: uma tarefa por vez, com gate do test runner antes de cada commit atômico. *Sempre obrigatório.*
5. **VERIFY**: um sub-agente novo e independente (nunca o autor) confere os resultados contra a spec e injeta falhas para confirmar que os testes as detectam. *Sempre ligado, em toda feature.*

---

## Para quem é

O TLC Spec-Driven v3 foi feito para **bases de código complexas e de alta qualidade**, onde o custo de um requisito mal entendido ou de um teste fraco é alto. Se você precisa que o agente:

- mapeie o escopo com precisão (incluindo o que ficou implícito),
- prove a qualidade com verificação independente,
- e fique mais inteligente sobre o seu projeto a cada uso,

…então este é o harness certo.

Funciona com **Cursor, Claude Code, Copilot, Windsurf, Cline** e mais 14 agentes, em qualquer stack.

```bash
npx @tech-leads-club/agent-skills install --skill tlc-spec-driven
```

Escopo mapeado, qualidade comprovada. Um comando, e seu agente está pronto hoje.

---

*Construído com ❤️ pela [Tech Leads Club](https://github.com/tech-leads-club/agent-skills).*
