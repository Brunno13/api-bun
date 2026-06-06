Bun.serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);
    
    // Rota: /greet?nome=Brunno
    if (url.pathname === "/greet") {
      const nome = url.searchParams.get("nome") || "Mundo";
      return new Response(JSON.stringify({ mensagem: `Olá, ${nome}!` }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ erro: "Rota não encontrada" }), { 
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  },
});

console.log("API Bun rodando na porta 3000...");