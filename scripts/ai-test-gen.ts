import { $ } from "bun";

const LLM_URL = process.env.LOCAL_LLM_URL || "[http://192.168.31.58:11434/v1/chat/completions](http://192.168.31.58:11434/v1/chat/completions)";
const LLM_MODEL = process.env.LOCAL_LLM_MODEL || "gemma4:12b";
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

    // 2. Identifica os arquivos .ts alterados no último push
    const diffOutput = await $`git diff --name-only HEAD^ HEAD`.quiet().text();
    const allFiles = diffOutput.split('\n').filter(f => f.endsWith('.ts') && !f.endsWith('.test.ts') && f.length > 0);

    if (allFiles.length === 0) {
      console.log("ℹ️ Nenhum arquivo fonte modificado. O AI Bot vai descansar.");
      process.exit(0);
    }

    let novosTestes = 0;

    // 3. Loop para processar apenas arquivos válidos
    for (const file of allFiles) {
      // Filtro Estrutural: Ignora interfaces, types, mensagens de erro, configs e injeção de dependência
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
        console.log(`⏩ Ignorando arquivo estrutural (não necessita testes de IA): ${file}`);
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
      
      // Crases escapadas para não quebrar a formatação do script
      let prompt = `Baseado nas diretrizes fornecidas, atue no seguinte arquivo: ${file}\n\nCódigo do arquivo:\n\`\`\`typescript\n${content}\n\`\`\`\n`;

      if (testExists) {
        console.log(`🔄 Arquivo já possui teste. Solicitando ATUALIZAÇÃO do teste para: ${file}...`);
        const existingTestContent = await Bun.file(testFileName).text();
        prompt += `\n⚠️ ATENÇÃO: Já existe um teste para este arquivo. Por favor, ATUALIZE-O para refletir as novas mudanças do código fonte, mantendo o que já funcionava.\n\nTeste Atual:\n\`\`\`typescript\n${existingTestContent}\n\`\`\``;
      } else {
        console.log(`🤖 Solicitando NOVO teste unitário para: ${file}...`);
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

      // Extrai apenas o código dentro do bloco markdown que a IA gerou
      const match = aiMessage.match(/\`\`\`(?:typescript|ts)\n([\s\S]*?)\`\`\`/);
      
      if (match && match[1]) {
        const testCode = match[1];
        await Bun.write(testFileName, testCode);
        console.log(`✅ Teste ${testExists ? 'atualizado' : 'gerado'} e guardado em: ${testFileName}`);
        novosTestes++;
      } else {
        console.warn(`⚠️ A IA não retornou o formato de código esperado para ${file}.`);
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
         
         await $`git add *.test.ts`;
         // O [skip ci] impede que o push do bot acione a pipeline do Woodpecker num loop infinito
         await $`git commit -m "test: sincronizados via LLM Local [skip ci]"`;
         await $`git push origin HEAD:main`; 
         
         console.log("🎉 Commit do Bot guardado no repositório!");
      } else {
         console.warn("💀 ALERTA: A IA gerou um teste inválido. A reverter os testes gerados para proteger a branch main.");
         await $`git restore --staged *.test.ts`.quiet().catch(() => {});
         await $`git checkout -- *.test.ts`.quiet().catch(() => {});
         await $`git clean -fd *.test.ts`.quiet().catch(() => {}); 
      }
    }

  } catch (error) {
     console.error("❌ Ocorreu um erro na execução do Bot:", error);
     // Não bloqueia a pipeline em caso de falha do Bot
     process.exit(0); 
  }
}

runAIBot();