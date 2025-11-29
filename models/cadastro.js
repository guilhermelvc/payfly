// Cadastro agora implementado usando Supabase Auth

// Aguarda um momento para garantir que o Supabase foi inicializado
document.addEventListener("DOMContentLoaded", function () {
  setTimeout(() => {
    if (!window.supabase) {
      console.error("Supabase não foi inicializado corretamente");
      alert("Erro de configuração do sistema. Recarregue a página.");
    }
  }, 1000);
});

function onChangeEmail() {
  const email = form.email().value;
  form.emailRequiredError().style.display = email ? "none" : "block";

  form.emailInvalidError().style.display = validateEmail(email)
    ? "none"
    : "block";

  toggleRegisterButtonDisable();
}

function onChangePassword() {
  const password = form.password().value;
  form.passwordRequiredError().style.display = password ? "none" : "block";

  form.passwordMinLengthError().style.display =
    password.length >= 6 ? "none" : "block";

  validatePasswordsMatch();
  toggleRegisterButtonDisable();
}

function onChangeConfirmPassword() {
  validatePasswordsMatch();
  toggleRegisterButtonDisable();
}

async function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  // Validações usando sistema toast
  if (!validateRequired(email, "E-mail")) return;
  if (!validateEmail(email)) return;
  if (!validateRequired(password, "Senha")) return;
  if (!validatePassword(password, 6)) return;
  if (!validateRequired(confirmPassword, "Confirmação de senha")) return;

  if (password !== confirmPassword) {
    showErrorToast(
      "Senhas não coincidem",
      "As senhas digitadas devem ser iguais."
    );
    return;
  }

  // Cadastro usando Supabase Auth
  if (!window.supabase) {
    console.error("Supabase não inicializado");
    showErrorToast(
      "Erro do Sistema",
      "Sistema de autenticação não está disponível. Tente novamente mais tarde."
    );
    return;
  }

  const loadingToast = showLoadingToast("Cadastrando", "Criando sua conta...");

  try {
    const { data, error } = await window.supabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: {
          name: email.split("@")[0], // Nome padrão baseado no email
        },
      },
    });

    if (error) {
      throw error;
    }

    // Verifica se o usuário foi criado com sucesso
    if (data.user) {
      removeToast(loadingToast);

      if (data.user.email_confirmed_at) {
        // Email já confirmado (configuração de desenvolvimento)
        showSuccessToast(
          "Cadastro realizado!",
          "Usuário cadastrado com sucesso! Redirecionando..."
        );
        setTimeout(() => {
          window.location.href = "../views/Login.html";
        }, 2000);
      } else {
        // Precisa confirmar email
        showSuccessToast(
          "Cadastro realizado!",
          `Um email de confirmação foi enviado para ${email}. Verifique sua caixa de entrada e spam, depois faça login.`,
          8000
        );
        setTimeout(() => {
          window.location.href = "../views/Login.html";
        }, 3000);
      }
    } else {
      removeToast(loadingToast);
      throw new Error(
        "Falha ao criar usuário: resposta inesperada do servidor"
      );
    }
  } catch (error) {
    removeToast(loadingToast);
    showErrorToast("Erro no cadastro", getErrorMessage(error));
  }
}

function getErrorMessage(error) {
  // Códigos de erro do Supabase Auth
  switch (error.message || error.code) {
    case "User already registered":
    case "auth/email-already-in-use":
      return "Este email já está cadastrado. Tente fazer login ou use outro email.";

    case "Password should be at least 6 characters":
      return "A senha deve ter pelo menos 6 caracteres.";

    case "Invalid email":
      return "Email inválido. Verifique o formato do email.";

    case "Signup is disabled":
      return "Cadastro temporariamente desabilitado. Tente novamente mais tarde.";

    case "Unable to validate email address: invalid format":
      return "Formato de email inválido.";

    case "Network request failed":
      return "Erro de conexão. Verifique sua internet e tente novamente.";

    default:
      console.error("Erro não mapeado:", error);
      return `Erro ao cadastrar usuário: ${
        error.message || "Erro desconhecido"
      }. Entre em contato com o suporte se o problema persistir.`;
  }
}

function login() {
  window.location.replace("../views/Login.html");
}

function validatePasswordsMatch() {
  const password = form.password().value;
  const confirmPassword = form.confirmPassword().value;

  form.confirmPasswordDoesntMatchError().style.display =
    password == confirmPassword ? "none" : "block";
}

function toggleRegisterButtonDisable() {
  form.registerButton().disabled = !isFormValid();
}

function isFormValid() {
  const email = form.email().value;
  if (!email || !validateEmail(email)) {
    return false;
  }

  const password = form.password().value;
  if (!password || password.length < 6) {
    return false;
  }

  const confirmPassword = form.confirmPassword().value;
  if (password != confirmPassword) {
    return false;
  }

  return true;
}

const form = {
  confirmPassword: () => document.getElementById("confirmPassword"),
  confirmPasswordDoesntMatchError: () =>
    document.getElementById("password-doesnt-match-error"),
  email: () => document.getElementById("email"),
  emailInvalidError: () => document.getElementById("email-invalid-error"),
  emailRequiredError: () => document.getElementById("email-required-error"),
  password: () => document.getElementById("password"),
  passwordMinLengthError: () =>
    document.getElementById("password-min-length-error"),
  passwordRequiredError: () =>
    document.getElementById("password-required-error"),
  registerButton: () => document.getElementById("register-button"),
};

/**
 * Cadastro com Google OAuth
 */
async function googleSignup() {
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
        "Erro no cadastro",
        "Falha ao iniciar cadastro com Google: " + error.message
      );
      return;
    }
  } catch (error) {
    console.error("Exceção no OAuth:", error);
    showErrorToast(
      "Erro no cadastro",
      "Falha inesperada no cadastro com Google"
    );
  }
}
