// Use Supabase to manage user profile and password
(async function initUserSettings() {
  if (!window.supabase) return;
  const { data } = await window.supabase.auth.getUser();
  const user = data?.user || null;
  if (!user) {
    showErrorToast("Acesso negado", "Nenhum usuário logado.");
    return;
  }

  const userEmail = user.email;
  // Busca perfil do usuário na tabela `usuarios`
  let userName = user.user_metadata?.full_name || "";
  try {
    const { data: rows } = await window.supabase
      .from("usuarios")
      .select("nome")
      .eq("id", user.id)
      .limit(1);
    if (rows && rows.length) userName = rows[0].nome || userName;
  } catch (e) {
    console.warn("Erro lendo tabela usuarios:", e);
  }

  document.getElementById("descricao").value = userName || "";
  document.getElementById("email").value = userEmail || "";

  // Atualizar nome no sidebar
  const sidebarNameElement = document.getElementById("user-sidebar-name");
  if (sidebarNameElement) {
    sidebarNameElement.textContent = userName || userEmail || "Usuário";
  }

  const identities = user.identities || [];
  const isGoogleAuth = identities.some((i) => i.provider === "google");

  const emailInput = document.getElementById("email");
  const currentPasswordInput = document.getElementById("current-password");
  const newPasswordInput = document.getElementById("password");
  const resetPasswordBtn = document.getElementById("reset-password-btn");

  if (isGoogleAuth) {
    if (emailInput) {
      emailInput.disabled = true;
      emailInput.classList.add("input-readonly");
    }
    if (currentPasswordInput) {
      currentPasswordInput.disabled = true;
      currentPasswordInput.value = "";
      currentPasswordInput.placeholder = "Indisponível para contas Google";
      currentPasswordInput.classList.add("input-readonly");
    }
    if (newPasswordInput) {
      newPasswordInput.disabled = true;
      newPasswordInput.value = "";
      newPasswordInput.placeholder = "Indisponível para contas Google";
      newPasswordInput.classList.add("input-readonly");
    }
    if (resetPasswordBtn) {
      resetPasswordBtn.style.display = "none";
    }

    showInfoToast(
      "Conta Google",
      "Você está logado com o Google e não pode alterar a senha."
    );
  } else {
    if (emailInput) {
      emailInput.disabled = false;
      emailInput.removeAttribute("disabled");
      emailInput.classList.remove("input-readonly");
    }
    if (currentPasswordInput) {
      currentPasswordInput.disabled = false;
      currentPasswordInput.placeholder = "Senha Atual";
      currentPasswordInput.classList.remove("input-readonly");
    }

    if (resetPasswordBtn) {
      resetPasswordBtn.style.display = "block";
    }
  }
})();

// Save user name into `users` table
async function saveUserName(event) {
  event.preventDefault();
  if (!window.supabase)
    return showErrorToast("Erro do sistema", "Supabase não inicializado");

  const { data } = await window.supabase.auth.getUser();
  const user = data?.user;
  if (!user) return showErrorToast("Acesso negado", "Usuário não autenticado");

  const userName = document.getElementById("descricao").value.trim();
  if (!userName)
    return showWarningToast("Campo obrigatório", "Por favor, insira um nome.");

  const emailInput = document.getElementById("email");
  const currentPasswordInput = document.getElementById("current-password");
  const newPasswordInput = document.getElementById("password");

  const typedEmail = emailInput ? emailInput.value.trim() : user.email;
  const currentPassword = currentPasswordInput?.value.trim() || "";
  const newPassword = newPasswordInput?.value.trim() || "";

  const isGoogleAuth = (user.identities || []).some(
    (identity) => identity.provider === "google"
  );

  const emailChanged = !isGoogleAuth && typedEmail && typedEmail !== user.email;
  const wantsPasswordChange =
    !isGoogleAuth && (currentPassword.length || newPassword.length);

  if (wantsPasswordChange && (!currentPassword || !newPassword)) {
    return showWarningToast(
      "Campos obrigatórios",
      "Informe a senha atual e a nova senha para atualizar sua senha."
    );
  }

  console.log("💾 Iniciando atualização de configurações", {
    userId: user.id,
    emailChanged,
    wantsPasswordChange,
  });

  try {
    if (wantsPasswordChange) {
      const { error: reauthError } =
        await window.supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });

      if (reauthError) {
        console.error("❌ Reautenticação falhou", reauthError);
        return showErrorToast(
          "Senha incorreta",
          "Não foi possível validar a senha atual informada."
        );
      }
    }

    const authPayload = {
      data: {
        name: userName,
        full_name: userName,
      },
    };

    if (emailChanged) authPayload.email = typedEmail;
    if (wantsPasswordChange) authPayload.password = newPassword;

    const { data: authData, error: authError } =
      await window.supabase.auth.updateUser(authPayload);
    if (authError) {
      console.error("❌ Erro ao atualizar perfil Auth", authError);
      throw authError;
    }

    const updatedAuthUser = authData?.user || user;
    const finalEmail = emailChanged
      ? typedEmail
      : updatedAuthUser.email || user.email;

    const { error: upsertError } = await window.supabase
      .from("usuarios")
      .upsert({
        id: user.id,
        nome: userName,
        email: finalEmail,
      });

    if (upsertError) {
      console.error("❌ Erro ao atualizar tabela usuarios", upsertError);
      throw upsertError;
    }

    if (emailInput) {
      emailInput.value = finalEmail;
    }
    if (currentPasswordInput) currentPasswordInput.value = "";
    if (newPasswordInput) newPasswordInput.value = "";

    // Verificação tardia para garantir persistência
    setTimeout(async () => {
      try {
        const { data: verificacao } = await window.supabase
          .from("usuarios")
          .select("nome")
          .eq("id", user.id)
          .limit(1);

        if (verificacao && verificacao[0]) {
          const nomeSalvo = verificacao[0].nome;
          if (nomeSalvo !== userName || nomeSalvo.includes("@")) {
            await window.supabase
              .from("usuarios")
              .update({ nome: userName })
              .eq("id", user.id);
          }
        }
      } catch (verError) {
        console.warn("⚠️ Verificação pós-salvamento falhou", verError);
      }
    }, 2000);

    showSuccessToast(
      "Configurações salvas",
      "Suas configurações foram atualizadas com sucesso."
    );

    if (window.forceUserNameRefresh) {
      await window.forceUserNameRefresh();
    } else {
      if (window.updateUserInfo) {
        await window.updateUserInfo();
      }
      await updateUserInfoConfig();
    }
  } catch (err) {
    console.error("Erro completo:", err);
    showErrorToast(
      "Erro ao salvar",
      "Falha ao salvar as configurações: " + (err.message || err)
    );
  }
}

// Change password for email/password users
async function changePassword() {
  const newPassword = document.getElementById("password").value;
  if (!newPassword)
    return showWarningToast(
      "Campo obrigatório",
      "Por favor, insira uma nova senha."
    );
  try {
    const { error } = await window.supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    showSuccessToast("Senha alterada!", "Senha atualizada com sucesso.");
  } catch (err) {
    showErrorToast(
      "Erro na senha",
      "Falha ao alterar a senha: " + (err.message || err)
    );
  }
}

// Send password reset email
async function sendPasswordResetEmail() {
  const { data } = await window.supabase.auth.getUser();
  const user = data?.user;
  if (!user) return showErrorToast("Acesso negado", "Usuário não autenticado");
  try {
    const { error } = await window.supabase.auth.resetPasswordForEmail(
      user.email
    );
    if (error) throw error;
    showSuccessToast(
      "E-mail enviado!",
      "E-mail de redefinição de senha enviado para " + user.email
    );
  } catch (err) {
    showErrorToast(
      "Erro no e-mail",
      "Falha ao enviar o e-mail de redefinição: " + (err.message || err)
    );
  }
}

// Função para atualizar informações do usuário no header
async function updateUserInfoConfig() {
  if (!window.supabase) {
    console.warn("Supabase não disponível (configuracoes.js)");
    return;
  }

  const { data } = await window.supabase.auth.getUser();
  const user = data?.user || null;

  if (user) {
    const userEmail = user.email;
    console.log("updateUserInfoConfig - Carregando dados do usuário:", user.id);

    // Primeiro tenta buscar o nome da tabela usuarios
    let userName = user.user_metadata?.full_name || user.email;

    try {
      const { data: rows, error } = await window.supabase
        .from("usuarios")
        .select("nome, email")
        .eq("id", user.id)
        .limit(1);

      if (error) {
        console.error("updateUserInfoConfig - Erro ao buscar dados:", error);
      } else {
        console.log("updateUserInfoConfig - Dados encontrados:", rows);

        if (rows && rows.length && rows[0].nome) {
          userName = rows[0].nome;
          console.log(
            "updateUserInfoConfig - Nome carregado da tabela:",
            userName
          );
        } else {
          console.log(
            "updateUserInfoConfig - Usuário não encontrado ou sem nome, usando fallback"
          );
          userName = user.user_metadata?.name || user.email.split("@")[0];
        }
      }
    } catch (e) {
      console.warn("updateUserInfoConfig - Erro lendo tabela usuarios:", e);
    }

    const el = document.getElementById("user-email");
    if (el) {
      el.textContent = userName;
      console.log("updateUserInfoConfig - Nome exibido na tela:", userName);
    }

    // Atualizar nome no sidebar
    const sidebarNameElement = document.getElementById("user-sidebar-name");
    if (sidebarNameElement) {
      sidebarNameElement.textContent = userName || userEmail || "Usuário";
      console.log(
        "updateUserInfoConfig - Nome atualizado no sidebar:",
        userName
      );
    }
  } else {
    const el = document.getElementById("user-info");
    if (el) el.textContent = "Nenhum usuário logado.";
  }
}

// Chama a função para inicializar a exibição do usuário
(function () {
  if (window.updateUserInfo) {
    window.updateUserInfo();
  } else {
    updateUserInfoConfig();
  }
})();

// =============== Funções de Exclusão de Conta ===============

// Abrir modal de confirmação de exclusão
function openDeleteAccountModal() {
  const modal = document.getElementById("deleteAccountModal");
  if (modal) {
    modal.classList.add("active");
  }
}

// Fechar modal de confirmação de exclusão
function closeDeleteAccountModal() {
  const modal = document.getElementById("deleteAccountModal");
  if (modal) {
    modal.classList.remove("active");
  }
}

// Confirmar e executar exclusão da conta
async function confirmDeleteAccount() {
  try {
    if (!window.supabase) {
      alert("❌ Erro: Supabase não inicializado");
      return;
    }

    // Verificar se usuário está logado
    const { data: userData } = await window.supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      alert("❌ Erro: Usuário não autenticado");
      return;
    }

    // Mostrar indicador de carregamento
    const deleteBtn = document.querySelector(
      'button[onclick="confirmDeleteAccount()"]'
    );
    const originalText = deleteBtn.textContent;
    deleteBtn.textContent = "Excluindo...";
    deleteBtn.disabled = true;

    console.log("🗑️ Iniciando exclusão da conta para usuário:", user.id);

    // Tentar usar função SQL personalizada para exclusão completa e segura
    const { data: deleteResult, error: deleteError } =
      await window.supabase.rpc("delete_user_data", {
        user_uuid: user.id,
      });

    if (deleteError || !deleteResult?.success) {
      console.warn(
        "⚠️ Função SQL não disponível, usando método alternativo..."
      );

      // Método alternativo: exclusão manual por tabela
      let receitasCount = 0,
        despesasCount = 0;

      // 1. Excluir receitas
      const { data: receitas } = await window.supabase
        .from("receitas")
        .select("id")
        .eq("usuario_id", user.id);

      receitasCount = receitas?.length || 0;

      const { error: receitasError } = await window.supabase
        .from("receitas")
        .delete()
        .eq("usuario_id", user.id);

      if (receitasError) {
        console.error("Erro ao excluir receitas:", receitasError);
      }

      // 2. Excluir despesas
      const { data: despesas } = await window.supabase
        .from("despesas")
        .select("id")
        .eq("usuario_id", user.id);

      despesasCount = despesas?.length || 0;

      const { error: despesasError } = await window.supabase
        .from("despesas")
        .delete()
        .eq("usuario_id", user.id);

      if (despesasError) {
        console.error("Erro ao excluir despesas:", despesasError);
      }

      // 3. Excluir dados da tabela usuarios
      const { error: usuarioError } = await window.supabase
        .from("usuarios")
        .delete()
        .eq("id", user.id);

      if (usuarioError) {
        console.error("Erro ao excluir dados do usuário:", usuarioError);
      }

      console.log("✅ Exclusão manual concluída:", {
        receitas: receitasCount,
        despesas: despesasCount,
        usuario_id: user.id,
      });
    } else {
      console.log("✅ Dados excluídos via função SQL:", {
        receitas: deleteResult.receitas_excluidas,
        despesas: deleteResult.despesas_excluidas,
        usuario_id: deleteResult.usuario_id,
      });
    }

    // 4. Limpar dados locais
    localStorage.clear();
    console.log("✅ Dados locais limpos");

    // 5. Fazer logout (a exclusão da conta auth precisa ser feita pelo admin)
    await window.supabase.auth.signOut();
    console.log("✅ Logout realizado");

    // Fechar modal
    closeDeleteAccountModal();

    // Mostrar mensagem de sucesso
    alert(
      `🗑️ CONTA EXCLUÍDA COM SUCESSO!\n\n✅ Dados removidos permanentemente:\n• Dados pessoais e configurações\n• Receitas cadastradas\n• Despesas cadastradas\n• Configurações da conta\n\n⚠️ IMPORTANTE: Para completar a exclusão, entre em contato com o suporte para remover a conta de autenticação.\n\nVocê será redirecionado para a página inicial.`
    );

    // Redirecionar para página inicial
    setTimeout(() => {
      window.location.replace("../index.html");
    }, 2000);
  } catch (error) {
    console.error("❌ Erro durante exclusão da conta:", error);

    // Restaurar botão
    const deleteBtn = document.querySelector(
      'button[onclick="confirmDeleteAccount()"]'
    );
    deleteBtn.textContent = "Sim, Excluir Tudo";
    deleteBtn.disabled = false;

    alert(
      "❌ Erro ao excluir a conta. Tente novamente.\n\nSe o problema persistir, entre em contato com o suporte."
    );
  }
}

// Fechar modal ao clicar fora dele
document.addEventListener("click", function (event) {
  const modal = document.getElementById("deleteAccountModal");
  if (event.target === modal) {
    closeDeleteAccountModal();
  }
});
