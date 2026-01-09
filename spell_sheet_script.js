// ========== ESTADO ==========
let magiasSelecionadas = []; // Magias que o personagem possui
let magiasFiltradas = [];
let todasMagiasDisponiveis = []; // Todas as magias do JSON
let listaPorClasse = {}; // Lista de magias por classe
let magiasSelecionadasModal = []; // Magias marcadas no modal para adicionar
let regras = null; // Regras de magia do JSON

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
const btnRegras = document.getElementById('btnRegras');
const modal = document.getElementById('modal');
const modalRegras = document.getElementById('modalRegras');
const modalTooltip = document.getElementById('modalTooltip');
const btnFecharModal = document.getElementById('btnFecharModal');
const btnFecharModalRegras = document.getElementById('btnFecharModalRegras');
const btnFecharTooltip = document.getElementById('btnFecharTooltip');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvarSelecionadas = document.getElementById('btnSalvarSelecionadas');
const magiasGrid = document.getElementById('magiasGrid');
const buscarMagia = document.getElementById('buscarMagia');
const filtroNivel = document.getElementById('filtroNivel');
const filtroEscola = document.getElementById('filtroEscola');
const nomePersonagem = document.getElementById('nomePersonagem');
const classePersonagem = document.getElementById('classePersonagem');
const nivelPersonagem = document.getElementById('nivelPersonagem');
const regrasConteudo = document.getElementById('regrasConteudo');
const tooltipTitulo = document.getElementById('tooltipTitulo');
const tooltipConteudo = document.getElementById('tooltipConteudo');

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
        const [resLista, resDetalhes, resRegras] = await Promise.all([
            fetch('lista_magias_dnd.json'),
            fetch('magias_dnd.json'),
            fetch('regras_magia.json')
        ]);
        
        listaPorClasse = await resLista.json();
        todasMagiasDisponiveis = await resDetalhes.json();
        const regrasData = await resRegras.json();
        regras = regrasData.manual_magia;
        
        console.log('Dados carregados:', todasMagiasDisponiveis.length, 'magias disponíveis');
        console.log('Regras carregadas:', regras);
        console.log('Estrutura lista por classe:', listaPorClasse);
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
                    <div class="magia-info-item" onclick="mostrarRegraTooltip('tempo')">
                        <span class="magia-info-label">Tempo</span>
                        <span class="magia-info-valor">${magia['tempo de conjuração'] || 'N/A'}</span>
                    </div>
                    <div class="magia-info-item" onclick="mostrarRegraTooltip('alcance')">
                        <span class="magia-info-label">Alcance</span>
                        <span class="magia-info-valor">${magia.alcance || 'N/A'}</span>
                    </div>
                    <div class="magia-info-item" onclick="mostrarRegraTooltip('duracao')">
                        <span class="magia-info-label">Duração</span>
                        <span class="magia-info-valor">${magia.duração || 'N/A'}</span>
                    </div>
                    ${magia.componentes ? `
                    <div class="magia-info-item" onclick="mostrarRegraTooltip('componentes')">
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
    
    // CORREÇÃO: Filtrar por classe
    const classeSelecionada = modalClasse.value;
    if (classeSelecionada && listaPorClasse[classeSelecionada]) {
        const magiasClasse = listaPorClasse[classeSelecionada];
        
        // Extrair todos os nomes de magias de todos os níveis da classe
        // O JSON tem estrutura: { truques_nivel_0: [{nome, escola}, ...], nivel_1: [...], ... }
        const nomesMagiasClasse = Object.values(magiasClasse)
            .flat()
            .map(magiaObj => {
                // Normalizar o nome para comparação (minúsculas e sem espaços extras)
                return magiaObj.nome.toLowerCase().trim();
            });
        
        console.log('Magias da classe', classeSelecionada, ':', nomesMagiasClasse.length);
        
        magiasParaMostrar = magiasParaMostrar.filter(m => {
            const nomeNormalizado = m.nome.toLowerCase().trim();
            return nomesMagiasClasse.includes(nomeNormalizado);
        });
        
        console.log('Magias após filtro de classe:', magiasParaMostrar.length);
    }
    
    // Filtrar por nível
    const nivelSelecionado = modalNivel.value;
    if (nivelSelecionado) {
        magiasParaMostrar = magiasParaMostrar.filter(m => {
            const nivelMagia = extrairNivel(m.nivel);
            if (nivelSelecionado === 'truques_nivel_0') {
                return nivelMagia === 0;
            }
            const nivelNum = parseInt(nivelSelecionado.replace('nivel_', ''));
            return nivelMagia === nivelNum;
        });
    }
    
    // Filtrar por escola
    const escolaSelecionada = modalEscola.value;
    if (escolaSelecionada) {
        magiasParaMostrar = magiasParaMostrar.filter(m => {
            const escolaNormalizada = normalizarEscola(m.escola).toLowerCase();
            return escolaNormalizada === escolaSelecionada.toLowerCase();
        });
    }
    
    // Renderizar
    if (magiasParaMostrar.length === 0) {
        magiasDisponiveis.innerHTML = '<p class="loading-msg">Nenhuma magia encontrada com os filtros selecionados.</p>';
        return;
    }
    
    magiasDisponiveis.innerHTML = magiasParaMostrar.map(magia => {
        const nivel = extrairNivel(magia.nivel);
        const nivelTexto = nivel === 0 ? 'Truque' : `Nível ${nivel}`;
        const jaAdicionada = magiasSelecionadas.some(m => m.nome === magia.nome);
        const estaSelecionada = magiasSelecionadasModal.some(m => m.nome === magia.nome);
        
        return `
            <div class="magia-disponivel ${jaAdicionada ? 'ja-adicionada' : ''} ${estaSelecionada ? 'selecionada' : ''}" 
                 onclick="${!jaAdicionada ? `toggleSelecaoMagia(${JSON.stringify(magia).replace(/"/g, '&quot;')})` : ''}">
                <div class="magia-disponivel-header">
                    <div>
                        <div class="magia-disponivel-nome">${magia.nome}</div>
                        <div class="magia-disponivel-info">${nivelTexto} • ${normalizarEscola(magia.escola)}</div>
                    </div>
                    <div class="magia-checkbox">
                        ${jaAdicionada ? '✓ Adicionada' : (estaSelecionada ? '✓' : '')}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ========== TOGGLE SELEÇÃO ==========
function toggleSelecaoMagia(magia) {
    const index = magiasSelecionadasModal.findIndex(m => m.nome === magia.nome);
    
    if (index !== -1) {
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

// ========== EXIBIR REGRAS COMPLETAS ==========
function exibirRegrasCompletas() {
    if (!regras) {
        regrasConteudo.innerHTML = '<p class="loading-msg">Erro ao carregar regras.</p>';
        return;
    }
    
    let html = '';
    
    // Espaços de Magia
    if (regras.espacos_de_magia) {
        const espacos = regras.espacos_de_magia;
        html += `
            <div class="regra-secao">
                <h3 class="regra-titulo">${espacos.titulo}</h3>
                <p class="regra-texto">${espacos.descricao}</p>
                ${espacos.regras ? `
                    <div class="regra-subtitulo">Regras:</div>
                    <ul class="regra-lista">
                        ${espacos.regras.limite ? `<li><strong>Limite:</strong> ${espacos.regras.limite}</li>` : ''}
                        ${espacos.regras.uso ? `<li><strong>Uso:</strong> ${espacos.regras.uso}</li>` : ''}
                        ${espacos.regras.recuperacao ? `<li><strong>Recuperação:</strong> ${espacos.regras.recuperacao}</li>` : ''}
                        ${espacos.regras.excecoes ? `<li><strong>Exceções:</strong> ${espacos.regras.excecoes}</li>` : ''}
                    </ul>
                ` : ''}
            </div>
        `;
    }
    
    // Conjuração
    if (regras.conjuracao) {
        const conjuracao = regras.conjuracao;
        html += `
            <div class="regra-secao">
                <h3 class="regra-titulo">${conjuracao.titulo}</h3>
                ${conjuracao.tempos_de_conjuracao ? `
                    <div class="regra-subtitulo">Tempos de Conjuração:</div>
                    <ul class="regra-lista">
                        ${conjuracao.tempos_de_conjuracao.acao_simples ? `<li><strong>Ação Simples:</strong> ${conjuracao.tempos_de_conjuracao.acao_simples}</li>` : ''}
                        ${conjuracao.tempos_de_conjuracao.acao_bonus ? `
                            <li><strong>Ação Bônus:</strong> ${conjuracao.tempos_de_conjuracao.acao_bonus.regra}
                                <div class="regra-destaque">⚠️ Restrição: ${conjuracao.tempos_de_conjuracao.acao_bonus.restricao}</div>
                            </li>
                        ` : ''}
                        ${conjuracao.tempos_de_conjuracao.reacoes ? `<li><strong>Reações:</strong> ${conjuracao.tempos_de_conjuracao.reacoes}</li>` : ''}
                        ${conjuracao.tempos_de_conjuracao.rituais_e_tempos_maiores ? `
                            <li><strong>Rituais e Tempos Maiores:</strong>
                                <ul class="regra-lista">
                                    <li>${conjuracao.tempos_de_conjuracao.rituais_e_tempos_maiores.exigencia}</li>
                                    <li>${conjuracao.tempos_de_conjuracao.rituais_e_tempos_maiores.falha}</li>
                                </ul>
                            </li>
                        ` : ''}
                    </ul>
                ` : ''}
            </div>
        `;
    }
    
    // Componentes
    if (regras.componentes) {
        const componentes = regras.componentes;
        html += `
            <div class="regra-secao">
                <h3 class="regra-titulo">${componentes.titulo}</h3>
                ${componentes.tipos ? `
                    <div class="regra-subtitulo">Tipos de Componentes:</div>
                    ${componentes.tipos.verbal ? `
                        <p class="regra-texto"><strong>Verbal (${componentes.tipos.verbal.sigla}):</strong></p>
                        <p class="regra-texto">${componentes.tipos.verbal.acao}</p>
                        ${componentes.tipos.verbal.impedimento ? `<div class="regra-destaque">⚠️ Impedimento: ${componentes.tipos.verbal.impedimento}</div>` : ''}
                    ` : ''}
                    ${componentes.tipos.somatico ? `
                        <p class="regra-texto" style="margin-top: 15px;"><strong>Somático (${componentes.tipos.somatico.sigla}):</strong></p>
                        <p class="regra-texto">${componentes.tipos.somatico.acao}</p>
                        ${componentes.tipos.somatico.requisito ? `<div class="regra-destaque">📋 ${componentes.tipos.somatico.requisito}</div>` : ''}
                    ` : ''}
                    ${componentes.tipos.material ? `
                        <p class="regra-texto" style="margin-top: 15px;"><strong>Material (${componentes.tipos.material.sigla}):</strong></p>
                        <p class="regra-texto">${componentes.tipos.material.acao}</p>
                        <ul class="regra-lista">
                            <li>${componentes.tipos.material.foco_ou_bolsa}</li>
                            <li>${componentes.tipos.material.custo_ouro}</li>
                            <li>${componentes.tipos.material.consumo}</li>
                            <li>${componentes.tipos.material.uso_maos}</li>
                        </ul>
                    ` : ''}
                ` : ''}
            </div>
        `;
    }
    
    // Duração
    if (regras.duracao) {
        const duracao = regras.duracao;
        html += `
            <div class="regra-secao">
                <h3 class="regra-titulo">${duracao.titulo}</h3>
                ${duracao.instantanea ? `<p class="regra-texto"><strong>Instantânea:</strong> ${duracao.instantanea}</p>` : ''}
                ${duracao.concentracao ? `
                    <div class="regra-subtitulo">Concentração - Perda:</div>
                    <ul class="regra-lista">
                        ${duracao.concentracao.perda_de_concentracao.nova_magia ? `<li>${duracao.concentracao.perda_de_concentracao.nova_magia}</li>` : ''}
                        ${duracao.concentracao.perda_de_concentracao.sofrer_dano ? `<li>${duracao.concentracao.perda_de_concentracao.sofrer_dano}</li>` : ''}
                        ${duracao.concentracao.perda_de_concentracao.estado ? `<li>${duracao.concentracao.perda_de_concentracao.estado}</li>` : ''}
                        ${duracao.concentracao.perda_de_concentracao.voluntario ? `<li>${duracao.concentracao.perda_de_concentracao.voluntario}</li>` : ''}
                    </ul>
                ` : ''}
            </div>
        `;
    }
    
    // Mecânicas de Acerto
    if (regras.mecanicas_de_acerto) {
        const mecanicas = regras.mecanicas_de_acerto;
        html += `
            <div class="regra-secao">
                <h3 class="regra-titulo">Mecânicas de Acerto</h3>
                ${mecanicas.testes_de_resistencia ? `
                    <div class="regra-subtitulo">${mecanicas.testes_de_resistencia.titulo}</div>
                    <p class="regra-texto">${mecanicas.testes_de_resistencia.uso}</p>
                    <div class="regra-formula">CD = ${mecanicas.testes_de_resistencia.formula_cd}</div>
                    <p class="regra-texto">${mecanicas.testes_de_resistencia.resultado}</p>
                ` : ''}
                ${mecanicas.jogadas_de_ataque ? `
                    <div class="regra-subtitulo">${mecanicas.jogadas_de_ataque.titulo}</div>
                    <div class="regra-formula">Ataque = ${mecanicas.jogadas_de_ataque.formula_ataque}</div>
                    ${mecanicas.jogadas_de_ataque.distancia_e_desvantagem ? `
                        <div class="regra-destaque">
                            ${mecanicas.jogadas_de_ataque.distancia_e_desvantagem.regra}<br>
                            <strong>Exceção:</strong> ${mecanicas.jogadas_de_ataque.distancia_e_desvantagem.excecao}
                        </div>
                    ` : ''}
                ` : ''}
            </div>
        `;
    }
    
    // Regras Especiais
    if (regras.regras_especiais && regras.regras_especiais.combinando_efeitos) {
        const combinar = regras.regras_especiais.combinando_efeitos;
        html += `
            <div class="regra-secao">
                <h3 class="regra-titulo">${combinar.titulo}</h3>
                ${combinar.magias_diferentes ? `<p class="regra-texto"><strong>Magias Diferentes:</strong> ${combinar.magias_diferentes}</p>` : ''}
                ${combinar.magias_iguais ? `
                    <p class="regra-texto"><strong>Magias Iguais:</strong></p>
                    <div class="regra-destaque">
                        ${combinar.magias_iguais.regra}<br>
                        <strong>Aplicação:</strong> ${combinar.magias_iguais.aplicacao}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    regrasConteudo.innerHTML = html;
}

// ========== MOSTRAR TOOLTIP DE REGRA ESPECÍFICA ==========
function mostrarRegraTooltip(tipo) {
    if (!regras) return;
    
    let titulo = '';
    let conteudo = '';
    
    switch(tipo) {
        case 'tempo':
            titulo = 'Tempo de Conjuração';
            if (regras.conjuracao && regras.conjuracao.tempos_de_conjuracao) {
                const tempos = regras.conjuracao.tempos_de_conjuracao;
                conteudo = `
                    <div class="tooltip-secao">
                        <p><strong>Ação Simples:</strong> ${tempos.acao_simples || 'Padrão'}</p>
                    </div>
                    ${tempos.acao_bonus ? `
                        <div class="tooltip-secao">
                            <p class="tooltip-subtitulo">Ação Bônus:</p>
                            <p>${tempos.acao_bonus.regra}</p>
                            <div class="tooltip-destaque">⚠️ ${tempos.acao_bonus.restricao}</div>
                        </div>
                    ` : ''}
                    ${tempos.reacoes ? `
                        <div class="tooltip-secao">
                            <p><strong>Reações:</strong> ${tempos.reacoes}</p>
                        </div>
                    ` : ''}
                    ${tempos.rituais_e_tempos_maiores ? `
                        <div class="tooltip-secao">
                            <p class="tooltip-subtitulo">Rituais:</p>
                            <ul class="tooltip-lista">
                                <li>${tempos.rituais_e_tempos_maiores.exigencia}</li>
                                <li>${tempos.rituais_e_tempos_maiores.falha}</li>
                            </ul>
                        </div>
                    ` : ''}
                `;
            }
            break;
            
        case 'duracao':
            titulo = 'Duração';
            if (regras.duracao) {
                const duracao = regras.duracao;
                conteudo = `
                    ${duracao.instantanea ? `
                        <div class="tooltip-secao">
                            <p><strong>Instantânea:</strong> ${duracao.instantanea}</p>
                        </div>
                    ` : ''}
                    ${duracao.concentracao ? `
                        <div class="tooltip-secao">
                            <p class="tooltip-subtitulo">Concentração - Você perde se:</p>
                            <ul class="tooltip-lista">
                                ${duracao.concentracao.perda_de_concentracao.nova_magia ? `<li>${duracao.concentracao.perda_de_concentracao.nova_magia}</li>` : ''}
                                ${duracao.concentracao.perda_de_concentracao.sofrer_dano ? `<li>${duracao.concentracao.perda_de_concentracao.sofrer_dano}</li>` : ''}
                                ${duracao.concentracao.perda_de_concentracao.estado ? `<li>${duracao.concentracao.perda_de_concentracao.estado}</li>` : ''}
                                ${duracao.concentracao.perda_de_concentracao.voluntario ? `<li>${duracao.concentracao.perda_de_concentracao.voluntario}</li>` : ''}
                            </ul>
                        </div>
                    ` : ''}
                `;
            }
            break;
            
        case 'componentes':
            titulo = 'Componentes';
            if (regras.componentes && regras.componentes.tipos) {
                const tipos = regras.componentes.tipos;
                conteudo = `
                    ${tipos.verbal ? `
                        <div class="tooltip-secao">
                            <p class="tooltip-subtitulo">Verbal (${tipos.verbal.sigla}):</p>
                            <p>${tipos.verbal.acao}</p>
                            ${tipos.verbal.impedimento ? `<div class="tooltip-destaque">⚠️ ${tipos.verbal.impedimento}</div>` : ''}
                        </div>
                    ` : ''}
                    ${tipos.somatico ? `
                        <div class="tooltip-secao">
                            <p class="tooltip-subtitulo">Somático (${tipos.somatico.sigla}):</p>
                            <p>${tipos.somatico.acao}</p>
                            ${tipos.somatico.requisito ? `<div class="tooltip-destaque">📋 ${tipos.somatico.requisito}</div>` : ''}
                        </div>
                    ` : ''}
                    ${tipos.material ? `
                        <div class="tooltip-secao">
                            <p class="tooltip-subtitulo">Material (${tipos.material.sigla}):</p>
                            <p>${tipos.material.acao}</p>
                            <ul class="tooltip-lista">
                                <li>${tipos.material.foco_ou_bolsa}</li>
                                <li>${tipos.material.custo_ouro}</li>
                                <li>${tipos.material.consumo}</li>
                                <li>${tipos.material.uso_maos}</li>
                            </ul>
                        </div>
                    ` : ''}
                `;
            }
            break;
            
        case 'alcance':
            titulo = 'Alcance e Ataques';
            if (regras.mecanicas_de_acerto && regras.mecanicas_de_acerto.jogadas_de_ataque) {
                const ataque = regras.mecanicas_de_acerto.jogadas_de_ataque;
                conteudo = `
                    <div class="tooltip-secao">
                        <p class="tooltip-subtitulo">Jogadas de Ataque Mágico:</p>
                        <div class="tooltip-destaque">Ataque = ${ataque.formula_ataque}</div>
                    </div>
                    ${ataque.distancia_e_desvantagem ? `
                        <div class="tooltip-secao">
                            <p><strong>Distância e Desvantagem:</strong></p>
                            <p>${ataque.distancia_e_desvantagem.regra}</p>
                            <p><em>Exceção: ${ataque.distancia_e_desvantagem.excecao}</em></p>
                        </div>
                    ` : ''}
                `;
            }
            break;
    }
    
    if (conteudo) {
        tooltipTitulo.textContent = titulo;
        tooltipConteudo.innerHTML = conteudo;
        modalTooltip.classList.add('ativo');
    }
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

function abrirModalRegras() {
    exibirRegrasCompletas();
    modalRegras.classList.add('ativo');
}

function fecharModalRegras() {
    modalRegras.classList.remove('ativo');
}

function fecharTooltip() {
    modalTooltip.classList.remove('ativo');
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

// Modal Regras
btnRegras.addEventListener('click', abrirModalRegras);
btnFecharModalRegras.addEventListener('click', fecharModalRegras);
btnFecharTooltip.addEventListener('click', fecharTooltip);

modal.addEventListener('click', (e) => {
    if (e.target === modal) fecharModal();
});

modalRegras.addEventListener('click', (e) => {
    if (e.target === modalRegras) fecharModalRegras();
});

modalTooltip.addEventListener('click', (e) => {
    if (e.target === modalTooltip) fecharTooltip();
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
