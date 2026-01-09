// ========== ESTADO ==========
let magiasSelecionadas = []; // Magias que o personagem possui
let magiasFiltradas = [];
let todasMagiasDisponiveis = []; // Todas as magias do JSON
let listaPorClasse = {}; // Lista de magias por classe
let magiasSelecionadasModal = []; // Magias marcadas no modal para adicionar

let personagem = {
    nome: '',
    classe: '',
    nivel: 1
};

// ========== ELEMENTOS DOM ==========
const livroFechado = document.getElementById('livroFechado');
const livroAberto = document.getElementById('livroAberto');
const btnFechar = document.getElementById('btnFechar');
const btnAdicionar = document.getElementById('btnAdicionar');
const modal = document.getElementById('modal');
const btnFecharModal = document.getElementById('btnFecharModal');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvarSelecionadas = document.getElementById('btnSalvarSelecionadas');
const magiasGrid = document.getElementById('magiasGrid');
const buscarMagia = document.getElementById('buscarMagia');
const filtroNivel = document.getElementById('filtroNivel');
const filtroEscola = document.getElementById('filtroEscola');
const nomePersonagem = document.getElementById('nomePersonagem');
const classePersonagem = document.getElementById('classePersonagem');
const nivelPersonagem = document.getElementById('nivelPersonagem');

// Elementos do modal
const magiasDisponiveis = document.getElementById('magiasDisponiveis');
const modalBuscar = document.getElementById('modalBuscar');
const modalClasse = document.getElementById('modalClasse');
const modalNivel = document.getElementById('modalNivel');
const modalEscola = document.getElementById('modalEscola');
const contadorSelecionadas = document.getElementById('contadorSelecionadas');

// ========== CARREGAR JSONs ==========
async function carregarDados() {
    try {
        const [resLista, resDetalhes] = await Promise.all([
            fetch('lista_magias_dnd.json'),
            fetch('magias_dnd.json')
        ]);
        
        listaPorClasse = await resLista.json();
        todasMagiasDisponiveis = await resDetalhes.json();
        
        console.log('Dados carregados:', todasMagiasDisponiveis.length, 'magias disponíveis');
    } catch (err) {
        console.error("Erro ao carregar JSONs:", err);
        magiasDisponiveis.innerHTML = '<p class="erro-msg">Erro ao carregar magias. Verifique se os arquivos JSON estão no diretório correto.</p>';
    }
}

// ========== FUNÇÕES DE STORAGE ==========
function carregarDadosLocais() {
    // Carregar personagem
    const personagemStorage = localStorage.getItem('spellsheet_personagem');
    if (personagemStorage) {
        personagem = JSON.parse(personagemStorage);
        nomePersonagem.value = personagem.nome;
        classePersonagem.value = personagem.classe;
        nivelPersonagem.value = personagem.nivel;
    }

    // Carregar magias selecionadas
    const magiasStorage = localStorage.getItem('spellsheet_magias');
    if (magiasStorage) {
        magiasSelecionadas = JSON.parse(magiasStorage);
    }
    
    magiasFiltradas = [...magiasSelecionadas];
    renderizarMagias();
}

function salvarPersonagem() {
    personagem = {
        nome: nomePersonagem.value,
        classe: classePersonagem.value,
        nivel: parseInt(nivelPersonagem.value) || 1
    };
    localStorage.setItem('spellsheet_personagem', JSON.stringify(personagem));
}

function salvarMagias() {
    localStorage.setItem('spellsheet_magias', JSON.stringify(magiasSelecionadas));
}

// ========== EXTRAIR NÍVEL DA MAGIA ==========
function extrairNivel(nivelStr) {
    if (!nivelStr) return 0;
    
    const str = nivelStr.toLowerCase();
    
    if (str.includes('truque') || str.includes('cantrip')) {
        return 0;
    }
    
    const match = str.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
}

// ========== NORMALIZAR ESCOLA ==========
function normalizarEscola(escola) {
    if (!escola) return '';
    
    const escolaLower = escola.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remove acentos
    
    const mapa = {
        'abjuracao': 'Abjuração',
        'adivinhacao': 'Adivinhação',
        'conjuracao': 'Conjuração',
        'encantamento': 'Encantamento',
        'evocacao': 'Evocação',
        'ilusao': 'Ilusão',
        'necromancia': 'Necromancia',
        'transmutacao': 'Transmutação'
    };
    
    return mapa[escolaLower] || escola;
}

// ========== RENDERIZAÇÃO DAS MAGIAS SELECIONADAS ==========
function renderizarMagias() {
    if (magiasFiltradas.length === 0) {
        magiasGrid.innerHTML = `
            <div class="mensagem-vazia">
                <p>Sua folha de magias está em branco.</p>
                <p>Clique em "Adicionar Magia" para começar!</p>
            </div>
        `;
        return;
    }

    magiasGrid.innerHTML = magiasFiltradas.map(magia => {
        const nivel = extrairNivel(magia.nivel);
        const nivelTexto = nivel === 0 ? 'Truque' : `Nível ${nivel}`;
        
        return `
            <div class="magia-card" data-nome="${magia.nome}">
                <div class="magia-header">
                    <div class="magia-titulo">${magia.nome}</div>
                    <button class="btn-remover" onclick="removerMagia('${magia.nome.replace(/'/g, "\\'")}')">✕</button>
                </div>
                <div class="magia-nivel">${nivelTexto}</div>
                <div class="magia-escola">${normalizarEscola(magia.escola)}</div>
                <div class="magia-info">
                    <div class="magia-info-item">
                        <span class="magia-info-label">Tempo</span>
                        <span class="magia-info-valor">${magia['tempo de conjuração'] || 'N/A'}</span>
                    </div>
                    <div class="magia-info-item">
                        <span class="magia-info-label">Alcance</span>
                        <span class="magia-info-valor">${magia.alcance || 'N/A'}</span>
                    </div>
                    <div class="magia-info-item">
                        <span class="magia-info-label">Duração</span>
                        <span class="magia-info-valor">${magia.duração || 'N/A'}</span>
                    </div>
                    ${magia.componentes ? `
                    <div class="magia-info-item">
                        <span class="magia-info-label">Componentes</span>
                        <span class="magia-info-valor">${magia.componentes}</span>
                    </div>
                    ` : ''}
                </div>
                <div class="magia-descricao">${magia.descrição || 'Sem descrição disponível.'}</div>
            </div>
        `;
    }).join('');
}

// ========== FILTROS DAS MAGIAS SELECIONADAS ==========
function filtrarMagiasSelecionadas() {
    const busca = buscarMagia.value.toLowerCase();
    const nivel = filtroNivel.value;
    const escola = filtroEscola.value;

    magiasFiltradas = magiasSelecionadas.filter(magia => {
        const nomeMagia = magia.nome.toLowerCase();
        const nivelMagia = extrairNivel(magia.nivel);
        const escolaMagia = normalizarEscola(magia.escola);
        
        const matchBusca = nomeMagia.includes(busca);
        const matchNivel = !nivel || nivelMagia.toString() === nivel;
        const matchEscola = !escola || escolaMagia === escola;
        
        return matchBusca && matchNivel && matchEscola;
    });

    renderizarMagias();
}

// ========== REMOVER MAGIA ==========
function removerMagia(nomeMagia) {
    mostrarConfirmacaoRemover(nomeMagia);
}

// ========== MODAL - RENDERIZAR MAGIAS DISPONÍVEIS ==========
function renderizarMagiasDisponiveis() {
    let magiasParaMostrar = [...todasMagiasDisponiveis];
    
    // Filtrar por busca
    const busca = modalBuscar.value.toLowerCase();
    if (busca) {
        magiasParaMostrar = magiasParaMostrar.filter(m => 
            m.nome.toLowerCase().includes(busca)
        );
    }
    
    // Filtrar por classe
    const classeEscolhida = modalClasse.value;
    if (classeEscolhida) {
        const magiasClasse = new Set();
        const niveis = Object.keys(listaPorClasse[classeEscolhida] || {});
        
        niveis.forEach(nivel => {
            listaPorClasse[classeEscolhida][nivel].forEach(magia => {
                magiasClasse.add(magia.nome.toLowerCase());
            });
        });
        
        magiasParaMostrar = magiasParaMostrar.filter(m => 
            magiasClasse.has(m.nome.toLowerCase())
        );
    }
    
    // Filtrar por nível
    const nivelEscolhido = modalNivel.value;
    if (nivelEscolhido) {
        const nivelNum = nivelEscolhido === 'truques_nivel_0' ? 0 : parseInt(nivelEscolhido.replace('nivel_', ''));
        magiasParaMostrar = magiasParaMostrar.filter(m => 
            extrairNivel(m.nivel) === nivelNum
        );
    }
    
    // Filtrar por escola
    const escolaEscolhida = modalEscola.value;
    if (escolaEscolhida) {
        magiasParaMostrar = magiasParaMostrar.filter(m => 
            normalizarEscola(m.escola).toLowerCase() === escolaEscolhida.toLowerCase() ||
            m.escola.toLowerCase().includes(escolaEscolhida)
        );
    }
    
    // Ordenar alfabeticamente
    magiasParaMostrar.sort((a, b) => a.nome.localeCompare(b.nome));
    
    if (magiasParaMostrar.length === 0) {
        magiasDisponiveis.innerHTML = '<p class="mensagem-vazia">Nenhuma magia encontrada com esses filtros.</p>';
        return;
    }
    
    magiasDisponiveis.innerHTML = magiasParaMostrar.map(magia => {
        const nivel = extrairNivel(magia.nivel);
        const nivelTexto = nivel === 0 ? 'Truque' : `Nível ${nivel}`;
        const jaSelecionada = magiasSelecionadas.some(m => m.nome === magia.nome);
        const marcada = magiasSelecionadasModal.some(m => m.nome === magia.nome);
        
        return `
            <div class="magia-disponivel ${jaSelecionada ? 'ja-adicionada' : ''} ${marcada ? 'selecionada' : ''}" 
                 data-nome="${magia.nome}" 
                 onclick="toggleSelecaoMagia('${magia.nome.replace(/'/g, "\\'")}')">
                <div class="magia-disponivel-header">
                    <div>
                        <div class="magia-disponivel-nome">${magia.nome}</div>
                        <div class="magia-disponivel-info">${nivelTexto} • ${normalizarEscola(magia.escola)}</div>
                    </div>
                    <div class="magia-checkbox">
                        ${jaSelecionada ? '✓ Adicionada' : (marcada ? '✓' : '')}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ========== TOGGLE SELEÇÃO DE MAGIA ==========
function toggleSelecaoMagia(nomeMagia) {
    // Verifica se já está na spell sheet
    if (magiasSelecionadas.some(m => m.nome === nomeMagia)) {
        return; // Não permite selecionar magias já adicionadas
    }
    
    const magia = todasMagiasDisponiveis.find(m => m.nome === nomeMagia);
    if (!magia) return;
    
    const index = magiasSelecionadasModal.findIndex(m => m.nome === nomeMagia);
    
    if (index > -1) {
        // Remove da seleção
        magiasSelecionadasModal.splice(index, 1);
    } else {
        // Adiciona à seleção
        magiasSelecionadasModal.push(magia);
    }
    
    atualizarContadorSelecionadas();
    renderizarMagiasDisponiveis();
}

// ========== ATUALIZAR CONTADOR ==========
function atualizarContadorSelecionadas() {
    contadorSelecionadas.textContent = magiasSelecionadasModal.length;
}

// ========== SALVAR MAGIAS SELECIONADAS ==========
function salvarMagiasSelecionadas() {
    if (magiasSelecionadasModal.length === 0) {
        mostrarConfirmacao(0, true); // true = erro
        return;
    }
    
    const quantidade = magiasSelecionadasModal.length;
    
    // Adiciona as magias selecionadas
    magiasSelecionadas.push(...magiasSelecionadasModal);
    
    // Salva no localStorage
    salvarMagias();
    
    // Limpa seleção do modal
    magiasSelecionadasModal = [];
    
    // Atualiza a visualização
    filtrarMagiasSelecionadas();
    
    // Fecha o modal
    fecharModal();
    
    // Mostra confirmação personalizada
    mostrarConfirmacao(quantidade);
}

// ========== MODAL ==========
function abrirModal() {
    magiasSelecionadasModal = [];
    atualizarContadorSelecionadas();
    renderizarMagiasDisponiveis();
    modal.classList.add('ativo');
}

function fecharModal() {
    modal.classList.remove('ativo');
    magiasSelecionadasModal = [];
    atualizarContadorSelecionadas();
}

// ========== MODAL DE CONFIRMAÇÃO ==========
function mostrarConfirmacao(quantidade, isErro = false) {
    const modalConfirmacao = document.getElementById('modalConfirmacao');
    const numeroMagias = document.getElementById('numeroMagias');
    const confirmacaoTexto = document.querySelector('.confirmacao-texto');
    const confirmacaoTitulo = document.querySelector('.confirmacao-titulo');
    const confirmacaoIcone = document.querySelector('.confirmacao-icone');
    
    if (isErro) {
        confirmacaoTitulo.textContent = 'Atenção!';
        confirmacaoTexto.innerHTML = 'Selecione pelo menos uma magia para adicionar.';
        confirmacaoIcone.textContent = '⚠️';
        confirmacaoIcone.style.background = 'linear-gradient(135deg, #d4af37 0%, #b8941f 100%)';
    } else {
        confirmacaoTitulo.textContent = 'Magias Adicionadas!';
        numeroMagias.textContent = quantidade;
        confirmacaoTexto.innerHTML = `<span id="numeroMagias">${quantidade}</span> magia(s) adicionada(s) com sucesso à sua spell sheet.`;
        confirmacaoIcone.textContent = '✓';
        confirmacaoIcone.style.background = 'linear-gradient(135deg, #2d8b1a 0%, #1a5d0f 100%)';
    }
    
    modalConfirmacao.classList.add('ativo');
}

function fecharConfirmacao() {
    const modalConfirmacao = document.getElementById('modalConfirmacao');
    modalConfirmacao.classList.remove('ativo');
}

function mostrarConfirmacaoRemover(nomeMagia) {
    const modalConfirmacao = document.getElementById('modalConfirmacao');
    const confirmacaoTexto = document.querySelector('.confirmacao-texto');
    const confirmacaoTitulo = document.querySelector('.confirmacao-titulo');
    const confirmacaoIcone = document.querySelector('.confirmacao-icone');
    const btnConfirmacaoOk = document.getElementById('btnConfirmacaoOk');
    
    confirmacaoTitulo.textContent = 'Remover Magia?';
    confirmacaoTexto.innerHTML = `Tem certeza que deseja remover <strong style="color: #8b1810;">${nomeMagia}</strong> da sua spell sheet?`;
    confirmacaoIcone.textContent = '🗑️';
    confirmacaoIcone.style.background = 'linear-gradient(135deg, #8b1810 0%, #5d0f0a 100%)';
    
    // Remove listener antigo e adiciona novo
    const novoBtn = btnConfirmacaoOk.cloneNode(true);
    btnConfirmacaoOk.parentNode.replaceChild(novoBtn, btnConfirmacaoOk);
    
    novoBtn.textContent = 'Sim, Remover';
    novoBtn.style.background = 'linear-gradient(135deg, #8b1810 0%, #5d0f0a 100%)';
    novoBtn.style.borderColor = '#a82010';
    
    novoBtn.addEventListener('click', () => {
        confirmarRemocao(nomeMagia);
    });
    
    modalConfirmacao.classList.add('ativo');
}

function confirmarRemocao(nomeMagia) {
    magiasSelecionadas = magiasSelecionadas.filter(m => m.nome !== nomeMagia);
    salvarMagias();
    filtrarMagiasSelecionadas();
    
    // Mostra feedback de remoção
    const modalConfirmacao = document.getElementById('modalConfirmacao');
    const confirmacaoTexto = document.querySelector('.confirmacao-texto');
    const confirmacaoTitulo = document.querySelector('.confirmacao-titulo');
    const confirmacaoIcone = document.querySelector('.confirmacao-icone');
    const btnConfirmacaoOk = document.querySelector('.btn-confirmacao-ok');
    
    confirmacaoTitulo.textContent = 'Magia Removida!';
    confirmacaoTexto.innerHTML = `<strong>${nomeMagia}</strong> foi removida da sua spell sheet.`;
    confirmacaoIcone.textContent = '✓';
    confirmacaoIcone.style.background = 'linear-gradient(135deg, #2d8b1a 0%, #1a5d0f 100%)';
    
    btnConfirmacaoOk.textContent = 'OK';
    btnConfirmacaoOk.style.background = 'linear-gradient(135deg, #2d8b1a 0%, #1a5d0f 100%)';
    btnConfirmacaoOk.style.borderColor = '#3aa020';
    
    // Remove listener antigo e adiciona o normal
    const novoBtn = btnConfirmacaoOk.cloneNode(true);
    btnConfirmacaoOk.parentNode.replaceChild(novoBtn, btnConfirmacaoOk);
    
    novoBtn.addEventListener('click', fecharConfirmacao);
    
    // Auto-fecha após 2 segundos
    setTimeout(() => {
        if (modalConfirmacao.classList.contains('ativo')) {
            fecharConfirmacao();
        }
    }, 2000);
}

// ========== EVENT LISTENERS ==========

// Abrir/Fechar livro
livroFechado.addEventListener('click', () => {
    livroFechado.style.display = 'none';
    livroAberto.classList.add('ativo');
});

btnFechar.addEventListener('click', () => {
    livroAberto.classList.remove('ativo');
    setTimeout(() => {
        livroFechado.style.display = 'flex';
    }, 300);
});

// Salvar dados do personagem
nomePersonagem.addEventListener('blur', salvarPersonagem);
classePersonagem.addEventListener('blur', salvarPersonagem);
nivelPersonagem.addEventListener('blur', salvarPersonagem);

// Modal
btnAdicionar.addEventListener('click', abrirModal);
btnFecharModal.addEventListener('click', fecharModal);
btnCancelar.addEventListener('click', fecharModal);
btnSalvarSelecionadas.addEventListener('click', salvarMagiasSelecionadas);

modal.addEventListener('click', (e) => {
    if (e.target === modal) fecharModal();
});

// Filtros das magias selecionadas
buscarMagia.addEventListener('input', filtrarMagiasSelecionadas);
filtroNivel.addEventListener('change', filtrarMagiasSelecionadas);
filtroEscola.addEventListener('change', filtrarMagiasSelecionadas);

// Filtros do modal
modalBuscar.addEventListener('input', renderizarMagiasDisponiveis);
modalClasse.addEventListener('change', renderizarMagiasDisponiveis);
modalNivel.addEventListener('change', renderizarMagiasDisponiveis);
modalEscola.addEventListener('change', renderizarMagiasDisponiveis);

// Modal de confirmação
const btnConfirmacaoOk = document.getElementById('btnConfirmacaoOk');
if (btnConfirmacaoOk) {
    btnConfirmacaoOk.addEventListener('click', fecharConfirmacao);
}

const modalConfirmacao = document.getElementById('modalConfirmacao');
if (modalConfirmacao) {
    modalConfirmacao.addEventListener('click', (e) => {
        if (e.target === modalConfirmacao) fecharConfirmacao();
    });
}

// ========== INICIALIZAÇÃO ==========
async function inicializar() {
    await carregarDados();
    carregarDadosLocais();
}

inicializar();