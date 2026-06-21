import { $ } from "bun";

// Configurações provenientes do Woodpecker CI (Secrets)
const LLM_URL = process.env.LOCAL_LLM_URL || "http://192.168.31.200:11434/v1/chat/completions";
const LLM_MODEL = process.env.LOCAL_LLM_MODEL || "qwen2.5-coder";
const REPO_OWNER = process.env.CI_REPO_OWNER;
const REPO_NAME = process.env.CI_REPO_NAME;
const GITEA_TOKEN = process.env.GITEA_TOKEN;

async function runAIBot() {
  try {
    // 1. Carrega as "Skills" (Prompt de Sistema) do arquivo Markdown
    let baseSkills = "Você é um assistente de IA focado em testes unitários.";
    const skillsFile = Bun.file(".ai/test-skills.md");
    if (await skillsFile.exists()) {
      baseSkills = await skillsFile.text();
      console.log("🧠 Habilidades da IA carregadas do diretório .ai/test-skills.md");
    }

    // 2. Identifica APENAS os arquivos alterados neste push/commit
    let diffOutput = "";
    try {
      const prevSha = process.env.CI_PREV_COMMIT_SHA;
      const currSha = process.env.CI_COMMIT_SHA || "HEAD";
      
      // Utiliza as variáveis nativas do Woodpecker para comparar exatamente o que veio neste push
      if (prevSha && prevSha !== "0000000000000000000000000000000000000000") {
        diffOutput = await $`git diff --name-only ${prevSha} ${currSha}`.quiet().text();
      } else {
        diffOutput = await $`git diff-tree --no-commit-id --name-only -r ${currSha}`.quiet().text();
      }
    } catch (e) {
      console.warn("⚠️ Aviso: Comando Git falhou, usando git show como fallback.");
      diffOutput = await $`git show --name-only --format="" HEAD`.quiet().text();
    }
    
    const changedFiles = diffOutput.split('\n')
      .map(f => f.trim())
      .filter(f => f.endsWith('.ts') && !f.endsWith('.test.ts') && f.length > 0);

    if (changedFiles.length === 0) {
      console.log("ℹ️ Nenhum arquivo fonte modificado neste commit. O AI Bot vai descansar.");
      process.exit(0);
    }

    let novosTestes = 0;

    // 3. Loop para processar apenas arquivos VÁLIDOS e ALTERADOS
    for (const file of changedFiles) {
      if (
        file.includes('/domain/') || 
        file.includes('/messages/') || 
        file.includes('/errors/') || 
        file.includes('/utils/') || 
        file.includes('/auth/') || 
        file.includes('/db/') ||
        file.includes('/middlewares/') ||
        file.includes('types.ts') || 
        file.includes('errors.ts') || 
        file.includes('drizzle.config') || 
        file.includes('container.ts') || 
        file.includes('config.ts') || 
        file.endsWith('index.ts')
      ) {
        console.log(`⏭️ Ignorando arquivo estrutural (não necessita testes de IA): ${file}`);
        continue;
      }

      const content = await Bun.file(file).text();

      // Filtro Manual: Flag mágica de opt-out inserida pelo programador
      if (content.includes('// @no-ai-test')) {
        console.log(`🛡️ Arquivo bloqueado pelo programador (@no-ai-test): ${file}`);
        continue;
      }

      const testFileName = file.replace('.ts', '.test.ts');
      const testExists = await Bun.file(testFileName).exists();
      
      let prompt = `Baseado nas diretrizes fornecidas, atue no seguinte arquivo: ${file}\n\nCódigo do arquivo:\n\`\`\`typescript\n${content}\n\`\`\`\n`;

      // Como o arquivo já está na lista "changedFiles", ele sofreu alteração.
      if (testExists) {
        console.log(`🔄 Arquivo já possui teste e FOI ALTERADO. Solicitando ATUALIZAÇÃO do teste para: ${file}...`);
        const existingTestContent = await Bun.file(testFileName).text();
        prompt += `\n⚠️ ATENÇÃO: Já existe um teste para este arquivo. Por favor, ATUALIZE-O para refletir as novas mudanças do código fonte, mantendo o que já funcionava.\n\nTeste Atual:\n\`\`\`typescript\n${existingTestContent}\n\`\`\``;
      } else {
        console.log(`🤖 Arquivo modificado/novo não possui teste. Solicitando CRIAÇÃO de teste para: ${file}...`);
        prompt += `\nEscreva um novo teste unitário completo para este código.`;
      }

      const response = await fetch(LLM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: LLM_MODEL,
          messages: [
            { role: "system", content: baseSkills },
            { role: "user", content: prompt }
          ],
          temperature: 0.1
        })
      });

      if (!response.ok) {
        console.error(`❌ Erro ao acessar o LLM na rede: ${response.status} ${response.statusText}`);
        continue;
      }

      const data = await response.json();
      const aiMessage = data.choices[0].message.content;

      // Extrai apenas o código dentro do bloco markdown
      const match = aiMessage.match(/\`\`\`(?:typescript|ts)\n([\s\S]*?)\`\`\`/);
      
      let testCode = "";

      if (match && match[1]) {
        testCode = match[1];
      } else {
         console.warn(`⚠️ A IA não usou marcadores de código para ${file}. Limpando resposta bruta...`);
         const lines = aiMessage.split('\n');
         const codeLines = lines.filter((l: string) => !l.toLowerCase().includes('aqui está') && !l.toLowerCase().includes('claro') && !l.toLowerCase().includes('entendido'));
         testCode = codeLines.join('\n');
      }

      // Evita gravar arquivos vazios ou quebrados
      if (testCode.trim().length > 10) { // Garante que há pelo menos uma linha de código real
        try {
            await Bun.write(testFileName, testCode.trim());
            console.log(`✅ Teste ${testExists ? 'atualizado' : 'gerado'} e guardado em: ${testFileName}`);
            novosTestes++;
        } catch (e) {
            console.error(`❌ Erro de I/O ao gravar o arquivo ${testFileName}`, e);
        }
      } else {
          console.warn(`❌ Falha: A IA retornou um código vazio ou inútil para ${file}`);
      }
    }

    // 4. Validação e Commit Automático
    if (novosTestes > 0) {
      console.log(`🧪 ${novosTestes} novo(s) teste(s) gerado(s). Validando se a IA escreveu código funcional...`);
      
      try {
        const testResult = await $`bun test`.quiet();
        console.log("🚀 SUCESSO! Os testes passaram perfeitamente. Enviando para o Gitea...");
         
        await $`git config --global user.name "Woodpecker AI Bot"`;
        await $`git config --global user.email "ai-bot@brunnoserver.duckdns.org"`;
        await $`git remote set-url origin http://${REPO_OWNER}:${GITEA_TOKEN}@192.168.31.215:3099/${REPO_OWNER}/${REPO_NAME}.git`;
        await $`git add .`;
         
        const hasChanges = await $`git status --porcelain`.quiet().text();
        if (hasChanges.trim().length > 0) {
            await $`git commit -m "test: sincronizados via LLM Local [skip ci]"`;
            await $`git push origin HEAD:main`; 
            console.log("🎉 Commit do Bot guardado no repositório!");
        } else {
            console.log("ℹ️ Os testes gerados são iguais aos existentes, nenhuma alteração para commitar.");
        }
      } catch (err: any) {
         console.warn(`💀 ALERTA: A IA gerou um teste inválido (Exit code: ${err.exitCode}). Revertendo alterações...`);
         if(err.stdout) console.log("Detalhes da falha (stdout):", err.stdout.toString());
         if(err.stderr) console.error("Detalhes da falha (stderr):", err.stderr.toString());
         
         await $`git restore --staged .`.quiet().catch(() => {});
         await $`git checkout -- .`.quiet().catch(() => {});
         await $`git clean -fd`.quiet().catch(() => {}); 
      }
    } else {
       console.log("ℹ️ A IA não gerou nenhum código válido. Nada a commitar.");
    }

  } catch (error) {
     console.error("❌ Ocorreu um erro na execução do Bot:", error);
     process.exit(0); 
  }
}

runAIBot();