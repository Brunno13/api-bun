import { $ } from "bun";

// Configurações provenientes do Woodpecker CI (Secrets)
const LLM_URL = process.env.LOCAL_LLM_URL;
const LLM_MODEL = process.env.LOCAL_LLM_MODEL;
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
    // O git show com --format="" lista exclusivamente os arquivos modificados no HEAD.
    // Isso evita que o bot processe o repositório inteiro e reescreva testes intocados.
    let diffOutput = "";
    try {
      diffOutput = await $`git show --name-only --format="" HEAD`.quiet().text();
    } catch (e) {
      console.warn("⚠️ Aviso: Tentando mapear arquivos via diff local pendente.");
      diffOutput = await $`git diff --name-only HEAD`.quiet().text();
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
         // Fallback de segurança caso a IA não retorne os marcadores
         console.warn(`⚠️ A IA não usou os marcadores de código para ${file}. Tentando usar a resposta bruta.`);
         testCode = aiMessage;
      }

      // Evita gravar arquivos vazios ou quebrados
      if (testCode.trim().length > 0) {
        await Bun.write(testFileName, testCode);
        console.log(`✅ Teste ${testExists ? 'atualizado' : 'gerado'} e guardado em: ${testFileName}`);
        novosTestes++;
      } else {
          console.warn(`❌ Falha ao extrair código utilizável para ${file}`);
      }
    }

    // 4. Validação e Commit Automático
    if (novosTestes > 0) {
      console.log("🧪 Validando se a IA escreveu código funcional...");
      const testResult = await $`bun test`.quiet().catch(err => err);
      
      if (testResult.exitCode === 0) {
         console.log("🚀 SUCESSO! Os testes passaram. Enviando para o Gitea...");
         
         await $`git config --global user.name "Woodpecker AI Bot"`;
         await $`git config --global user.email "ai-bot@brunnoserver.duckdns.org"`;
         await $`git remote set-url origin http://${REPO_OWNER}:${GITEA_TOKEN}@192.168.31.215:3099/${REPO_OWNER}/${REPO_NAME}.git`;
         await $`git add .`;
         
         // Verifica se há alterações REAIS antes de tentar commitar
         const hasChanges = await $`git status --porcelain`.quiet().text();
         if (hasChanges.trim().length > 0) {
            // O [skip ci] impede que o push do bot acione a pipeline do Woodpecker num loop infinito
            await $`git commit -m "test: sincronizados via LLM Local [skip ci]"`;
            await $`git push origin HEAD:main`; 
            console.log("🎉 Commit do Bot guardado no repositório!");
         } else {
            console.log("ℹ️ Os testes gerados são iguais aos existentes, nenhuma alteração para commitar.");
         }
         
      } else {
         console.warn("💀 ALERTA: A IA gerou um teste inválido. Revertendo alterações para proteger a branch main.");
         await $`git restore --staged .`.quiet().catch(() => {});
         await $`git checkout -- .`.quiet().catch(() => {});
         await $`git clean -fd`.quiet().catch(() => {}); 
      }
    }

  } catch (error) {
     console.error("❌ Ocorreu um erro na execução do Bot:", error);
     process.exit(0); 
  }
}

runAIBot();