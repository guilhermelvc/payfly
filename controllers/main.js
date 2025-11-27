// Adicionando a classe que muda cor ao passar o mouse
let list = document.querySelectorAll(".navigation li");

function activeLink() {
    list.forEach((item) => {
        item.classList.remove("hovered");
    });
    this.classList.add("hovered");
}

list.forEach((item) => item.addEventListener("mouseover", activeLink));

// Menu Toggle para recolher e mostar a navegação
let toggle = document.querySelector(".toggle");
let navigation = document.querySelector(".navigation");
let main = document.querySelector(".main");

// Inicializar sidebar baseado no localStorage (padrão: fechado)
document.addEventListener("DOMContentLoaded", function () {
    const isMobile = window.innerWidth <= 480;

    if (isMobile) {
        // Em mobile, sempre iniciar fechado
        navigation.classList.remove("active");
        main.classList.remove("active");
    } else {
        // Em desktop, usar localStorage
        const sidebarState = localStorage.getItem("sidebarState");
        if (sidebarState === "open") {
            navigation.classList.add("active");
            main.classList.add("active");
        } else {
            navigation.classList.remove("active");
            main.classList.remove("active");
        }
    }

    // Fechar sidebar ao clicar em links de navegação no mobile
    const navigationLinks = document.querySelectorAll(".navigation ul li a");

    navigationLinks.forEach((link) => {
        link.addEventListener("click", function () {
            const isMobile = window.innerWidth <= 480;

            // Fechar sidebar apenas em mobile
            if (isMobile && navigation.classList.contains("active")) {
                navigation.classList.remove("active");
                main.classList.remove("active");
            }
        });
    });

    // Fechar sidebar ao clicar no overlay em mobile
    main.addEventListener("click", function (e) {
        const isMobile = window.innerWidth <= 480;

        // Se está em mobile e sidebar está aberta
        if (isMobile && main.classList.contains("active")) {
            // Se clicou no overlay (área escura)
            if (e.target === main || e.target.classList.contains("main")) {
                navigation.classList.remove("active");
                main.classList.remove("active");
            }
        }
    });
});

toggle.onclick = function () {
    navigation.classList.toggle("active");
    main.classList.toggle("active");

    // Salvar estado no localStorage apenas para desktop
    const isMobile = window.innerWidth <= 480;
    if (!isMobile) {
        const isOpen = navigation.classList.contains("active");
        localStorage.setItem("sidebarState", isOpen ? "open" : "closed");
    }
};

// Função de logout acessível em todas as páginas que carregam main.js
window.logout = async function logout() {
    const redirectUrl = new URL("../views/Login.html", window.location.href);

    try {
        if (window.app && typeof window.app.logout === "function") {
            await window.app.logout();
            return;
        }
    } catch (controllerError) {
        console.warn(
            "main.js: Falha ao usar AppController.logout",
            controllerError
        );
    }

    try {
        if (window.supabase?.auth) {
            await window.supabase.auth.signOut();
        }
    } catch (authError) {
        console.error("main.js: Erro ao encerrar sessão", authError);
    } finally {
        window.location.replace(redirectUrl.href);
    }
};

// Sistema de throttling para evitar múltiplas chamadas
let updateUserInfoThrottled = false;
let updateUserInfoTimer = null;

// Função centralizada para atualizar informações do usuário
window.updateUserInfo = async function (forceUpdate = false) {
    // Throttling - evita múltiplas chamadas em sequência rápida (exceto se forçado)
    if (!forceUpdate && updateUserInfoThrottled) {
        console.debug("main.js: updateUserInfo throttled - ignorando chamada");
        return;
    }

    if (!forceUpdate) {
        updateUserInfoThrottled = true;
        clearTimeout(updateUserInfoTimer);
        updateUserInfoTimer = setTimeout(() => {
            updateUserInfoThrottled = false;
        }, 1000); // 1 segundo de throttle
    }

    if (!window.supabase) {
        console.warn("main.js: Supabase não disponível");
        return;
    }

    const { data } = await window.supabase.auth.getUser();
    const user = data?.user || null;

    if (user) {
        const userEmail = user.email;
        console.debug("main.js: Autenticado como:", userEmail);

        // SEMPRE busca da tabela usuarios primeiro (não usa fallbacks iniciais)
        let userName = null;

        try {
            const { data: rows, error } = await window.supabase
                .from("usuarios")
                .select("nome, email")
                .eq("id", user.id)
                .limit(1);

            if (error) {
                console.error(
                    "main.js: Erro ao buscar dados do usuário:",
                    error
                );
                userName = user.email.split("@")[0]; // Fallback seguro
            } else {
                console.debug(
                    "main.js: Dados do usuário encontrados:",
                    rows?.length || 0,
                    "registros"
                );

                if (rows && rows.length) {
                    const dbName = rows[0].nome;
                    const dbEmail = rows[0].email;

                    // Verifica se o nome não é igual ao email (evita mostrar email como nome)
                    if (dbName && dbName !== dbEmail && !dbName.includes("@")) {
                        userName = dbName;
                        console.debug("main.js: Nome carregado:", userName);
                    } else {
                        console.debug("main.js: Usando username do email");
                        userName = user.email.split("@")[0];

                        // Atualiza o nome na tabela para não ser igual ao email
                        try {
                            await window.supabase
                                .from("usuarios")
                                .update({ nome: userName })
                                .eq("id", user.id);
                            console.log(
                                "main.js: Nome na tabela corrigido para:",
                                userName
                            );
                        } catch (updateError) {
                            console.warn(
                                "main.js: Erro ao corrigir nome na tabela:",
                                updateError
                            );
                        }
                    }
                } else {
                    console.log(
                        "main.js: Usuário não encontrado na tabela usuarios"
                    );
                    userName = user.email.split("@")[0];
                    await createOrUpdateUserRecord(user);
                }
            }
        } catch (e) {
            console.warn("main.js: Erro lendo tabela usuarios:", e);
            userName = user.email.split("@")[0]; // Fallback final
        }

        // Só atualiza se temos um nome válido e o elemento existe
        const el = document.getElementById("user-email");
        if (el && userName) {
            el.textContent = userName;
            console.log("main.js: Nome exibido na tela:", userName);
        }
        // Elemento user-email não existe no painel principal, isso é normal

        // Atualizar nome no sidebar
        const sidebarNameElement = document.getElementById("user-sidebar-name");
        if (sidebarNameElement && userName) {
            sidebarNameElement.textContent = userName;
            console.debug("main.js: Interface atualizada para:", userName);
        }
    } else {
        const el = document.getElementById("user-info");
        if (el) el.textContent = "Nenhum usuário logado.";
    }
};

// Função global para forçar refresh do nome do usuário
window.forceUserNameRefresh = async function () {
    console.log("Forçando refresh do nome do usuário (ignorando throttle)");

    // Reseta o throttle para permitir atualização imediata
    updateUserInfoThrottled = false;
    clearTimeout(updateUserInfoTimer);

    // Chama updateUserInfo com forceUpdate = true
    if (window.updateUserInfo) {
        await window.updateUserInfo(true);
        console.log("updateUserInfo(true) executada no refresh");
    }

    // Aguarda um pouco e dispara evento customizado para outras páginas/scripts
    setTimeout(() => {
        window.dispatchEvent(
            new CustomEvent("userNameUpdated", {
                detail: { timestamp: Date.now() },
            })
        );
        console.log("Evento userNameUpdated disparado");
    }, 500);
};

// Listener para o evento de atualização do nome
window.addEventListener("userNameUpdated", function (event) {
    console.log("Evento userNameUpdated recebido:", event.detail);
    // Re-executa updateUserInfo quando o evento é disparado
    setTimeout(() => {
        if (window.updateUserInfo) {
            window.updateUserInfo();
        }
    }, 100);
});

// Função auxiliar para criar/atualizar registro do usuário
async function createOrUpdateUserRecord(user) {
    try {
        const defaultName =
            user.user_metadata?.name || user.email.split("@")[0];

        const { error } = await window.supabase.from("usuarios").upsert({
            id: user.id,
            nome: defaultName,
            email: user.email,
        });

        if (error) {
            console.error("Erro ao criar/atualizar usuário:", error);
        } else {
            console.log("Usuário criado/atualizado com sucesso:", defaultName);
        }
    } catch (e) {
        console.error("Erro na função createOrUpdateUserRecord:", e);
    }
}
