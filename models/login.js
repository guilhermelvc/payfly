// Observe auth state and redirect to painel when logged in
if (window.supabase) {
  window.supabase.auth.onAuthStateChange((event, session) => {
    if (session && session.user) {
      // Detectar ambiente para redirecionamento correto
      const isGitHubPages = window.location.hostname.includes("github.io");
      let targetUrl;

      if (isGitHubPages) {
        const baseUrl =
          window.location.origin +
          window.location.pathname.split("/").slice(0, -2).join("/");
        targetUrl = baseUrl + "/views/Painel.html";
      } else {
        targetUrl = "../views/Painel.html";
      }

      window.location.replace(targetUrl);
    }
  });
} else {
  console.error("Supabase não está disponível para auth listener");
}

function onChangeEmail() {
  toggleButtonsDisable();
  toggleEmailErrors();
}

function onChangePassword() {
  toggleButtonsDisable();
  togglePasswordErrors();
}

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  // Validação usando sistema toast
  if (!validateRequired(email, "E-mail")) return;
  if (!validateEmail(email)) return;
  if (!validateRequired(password, "Senha")) return;

  const loadingToast = showLoadingToast(
    "Entrando",
    "Verificando suas credenciais..."
  );

  try {
    const result = await window.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (result.error) throw result.error;

    // Remove toast de carregamento e mostra sucesso
    removeToast(loadingToast);
    showSuccessToast("Login realizado!", "Redirecionando para o painel...");

    setTimeout(() => {
      window.location.replace("../views/Painel.html");
    }, 1000);
  } catch (error) {
    removeToast(loadingToast);
    showErrorToast("Falha no login", getErrorMessage(error));
  }
}

function getErrorMessage(error) {
  if (!error) return "Erro desconhecido";
  // Supabase returns error.message
  return error.message || JSON.stringify(error);
}

function register() {
  window.location.replace("../views/Cadastro.html");
}

async function recoverPassword() {
  const email = document.getElementById("email").value;

  if (!validateRequired(email, "E-mail")) return;
  if (!validateEmail(email)) return;

  const loadingToast = showLoadingToast(
    "Enviando",
    "Processando recuperação de senha..."
  );

  try {
    const { data, error } = await window.supabase.auth.resetPasswordForEmail(
      email
    );
    if (error) throw error;

    removeToast(loadingToast);
    showSuccessToast(
      "E-mail enviado!",
      "Verifique sua caixa de entrada para redefinir a senha."
    );
  } catch (error) {
    removeToast(loadingToast);
    showErrorToast("Erro na recuperação", getErrorMessage(error));
  }
}

function toggleEmailErrors() {
  const email = document.getElementById("email").value;
  if (!email) {
    document.getElementById("email-required-error").style.display = "block";
  } else {
    document.getElementById("email-required-error").style.display = "none";
  }

  if (email && validateEmailFormat(email)) {
    document.getElementById("email-invalid-error").style.display = "none";
  } else if (email) {
    document.getElementById("email-invalid-error").style.display = "block";
  }
}

function togglePasswordErrors() {
  const password = document.getElementById("password").value;
  if (!password) {
    document.getElementById("password-required-error").style.display = "block";
  } else {
    document.getElementById("password-required-error").style.display = "none";
  }
}

function toggleButtonsDisable() {
  const emailValid = isEmailValid();
  document.getElementById("recover-password-button").disabled = !emailValid;

  const passwordValid = isPasswordValid();
  document.getElementById("login-button").disabled =
    !emailValid || !passwordValid;
}

function isEmailValid() {
  const email = document.getElementById("email").value;
  if (!email) {
    return false;
  }
  return validateEmailFormat(email);
}

function isPasswordValid() {
  const password = document.getElementById("password").value;
  if (!password) {
    return false;
  }
  return true;
}

// Função para validação de formato de email (não mostra toast)
function validateEmailFormat(email) {
  return /\S+@\S+\.\S+/.test(email);
}

async function googleLogin() {
  if (!window.supabase) {
    console.error("Supabase não está disponível");
    showErrorToast(
      "Erro de configuração",
      "Sistema de autenticação não disponível"
    );
    return;
  }

  if (!window.SUPABASE_CONFIGURED) {
    console.error("Supabase não está configurado corretamente");
    showErrorToast("Erro de configuração", "Configure o Supabase corretamente");
    return;
  }

  // Detecta se está no GitHub Pages ou localmente
  const isGitHubPages = window.location.hostname.includes("github.io");
  let redirectUrl;

  if (isGitHubPages) {
    // GitHub Pages: https://username.github.io/repository-name/views/Painel.html
    const pathParts = window.location.pathname.split("/").filter((p) => p);
    // Remove 'views' e arquivos .html do caminho
    const basePathParts = pathParts.filter(
      (part) => part !== "views" && !part.endsWith(".html")
    );
    const basePath = basePathParts.join("/");
    redirectUrl =
      window.location.origin + "/" + basePath + "/views/Painel.html";
  } else {
    // Desenvolvimento local: http://localhost/views/Painel.html ou file:///
    if (window.location.protocol === "file:") {
      const currentPath = window.location.pathname;
      const basePath = currentPath.substring(0, currentPath.lastIndexOf("/"));
      redirectUrl = "file://" + basePath + "/views/Painel.html";
    } else {
      redirectUrl = window.location.origin + "/views/Painel.html";
    }
  }

  try {
    const { data, error } = await window.supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      console.error("Erro no OAuth:", error);
      showErrorToast(
        "Erro no login",
        "Falha ao iniciar login com Google: " + error.message
      );
      return;
    }
  } catch (error) {
    console.error("Exceção no OAuth:", error);
    showErrorToast("Erro no login", "Falha inesperada no login com Google");
  }
}
