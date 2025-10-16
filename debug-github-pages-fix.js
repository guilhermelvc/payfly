// Script para testar a correção do problema de duplicação de "views" no GitHub Pages
// Execute este script no console do navegador para verificar se as URLs estão sendo geradas corretamente

console.log('🔧 Testando correção do GitHub Pages - Duplicação de "views"');

// Simular diferentes cenários de URL
const testCases = [
  {
    name: "GitHub Pages - Login",
    url: {
      hostname: "guilhermelvc.github.io",
      pathname: "/payfly/views/Login.html",
      origin: "https://guilhermelvc.github.io",
    },
    expected: "https://guilhermelvc.github.io/payfly/views/Painel.html",
  },
  {
    name: "GitHub Pages - Cadastro",
    url: {
      hostname: "guilhermelvc.github.io",
      pathname: "/payfly/views/Cadastro.html",
      origin: "https://guilhermelvc.github.io",
    },
    expected: "https://guilhermelvc.github.io/payfly/views/Painel.html",
  },
  {
    name: "GitHub Pages - Root",
    url: {
      hostname: "guilhermelvc.github.io",
      pathname: "/payfly/",
      origin: "https://guilhermelvc.github.io",
    },
    expected: "https://guilhermelvc.github.io/payfly/views/Painel.html",
  },
  {
    name: "Localhost",
    url: {
      hostname: "localhost",
      pathname: "/views/Login.html",
      origin: "http://localhost",
    },
    expected: "http://localhost/views/Painel.html",
  },
];

function testRedirectUrlGeneration(testCase) {
  const window = { location: testCase.url };

  // Reproduzir a lógica corrigida
  const isGitHubPages = window.location.hostname.includes("github.io");
  let redirectUrl;

  if (isGitHubPages) {
    const pathParts = window.location.pathname.split("/").filter((p) => p);
    // Remove 'views' e arquivos .html do caminho
    const basePathParts = pathParts.filter(
      (part) => part !== "views" && !part.endsWith(".html")
    );
    const basePath = basePathParts.join("/");
    redirectUrl =
      window.location.origin + "/" + basePath + "/views/Painel.html";
  } else {
    if (window.location.protocol === "file:") {
      const currentPath = window.location.pathname;
      const basePath = currentPath.substring(0, currentPath.lastIndexOf("/"));
      redirectUrl = "file://" + basePath + "/views/Painel.html";
    } else {
      redirectUrl = window.location.origin + "/views/Painel.html";
    }
  }

  const passed = redirectUrl === testCase.expected;

  console.log(`${passed ? "✅" : "❌"} ${testCase.name}`);
  console.log(`   Input: ${testCase.url.origin}${testCase.url.pathname}`);
  console.log(`   Expected: ${testCase.expected}`);
  console.log(`   Generated: ${redirectUrl}`);

  if (!passed) {
    console.log(`   🚨 ERRO: URL incorreta gerada!`);
  }

  return passed;
}

console.log("\n📋 Executando testes...\n");

let allPassed = true;
testCases.forEach((testCase) => {
  const passed = testRedirectUrlGeneration(testCase);
  allPassed = allPassed && passed;
  console.log("");
});

if (allPassed) {
  console.log(
    "🎉 Todos os testes passaram! A correção está funcionando corretamente."
  );
} else {
  console.log("❌ Alguns testes falharam. Verifique a implementação.");
}

console.log("\n🔍 Para testar manualmente no GitHub Pages:");
console.log("1. Acesse: https://guilhermelvc.github.io/payfly/");
console.log('2. Clique em "Login com Google"');
console.log(
  "3. Verifique se redireciona para: https://guilhermelvc.github.io/payfly/views/Painel.html"
);
console.log(
  "4. NÃO deve aparecer: https://guilhermelvc.github.io/payfly/views/views/Painel.html"
);
