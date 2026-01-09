let listaPorClasse = {};
let bancoDeMagias = [];
let todasMagiasAtual = [];
let paginaAtual = 0;
const MAGIAS_POR_PAGINA = 2; // Apenas 2 magias por vez (1 em cada página)

// Elementos
const grimorioFechado = document.getElementById('grimorioFechado');
const grimorioAberto = document.getElementById('grimorioAberto');
const btnFechar = document.getElementById('btnFechar');
const paginaEsquerda = document.getElementById('paginaEsquerda');
const paginaDireita = document.getElementById('paginaDireita');
const conteudoDireita = document.getElementById('conteudoDireita');
const indice = document.getElementById('indice');
const subIndice = document.getElementById('subIndice');
const conteudoMagias = document.getElementById('conteudoMagias');
const btnVoltarIndice = document.getElementById('btnVoltarIndice');
const classeAtual = document.getElementById('classeAtual');
const listaNiveis = document.getElementById('listaNiveis');

// Carregar JSONs
async function carregarDados() {
    try {
        const [resLista, resDetalhes] = await Promise.all([
            fetch('lista_magias_dnd.json'),
            fetch('magias_dnd.json')
        ]);
        
        listaPorClasse = await resLista.json();
        bancoDeMagias = await resDetalhes.json();
        
        configurarEventos();
    } catch (err) {
        console.error("Erro ao carregar JSONs:", err);
        paginaEsquerda.innerHTML = '<div class="erro-msg">Erro ao carregar dados.</div>';
    }
}

// Configurar eventos do índice
function configurarEventos() {
    document.querySelectorAll('.indice-item').forEach(item => {
        item.addEventListener('click', () => {
            const classe = item.dataset.classe;
            mostrarSubIndice(classe);
        });
    });
}

// Mostrar sub-índice de níveis
function mostrarSubIndice(classe) {
    virarPagina(() => {
        indice.style.display = 'none';
        conteudoDireita.innerHTML = '';
        subIndice.classList.add('ativo');
        
        classeAtual.textContent = classe.charAt(0).toUpperCase() + classe.slice(1);
        
        const niveis = [
            { key: 'truques_nivel_0', label: 'Truques (Nível 0)' },
            { key: 'nivel_1', label: 'Nível 1' },
            { key: 'nivel_2', label: 'Nível 2' },
            { key: 'nivel_3', label: 'Nível 3' },
            { key: 'nivel_4', label: 'Nível 4' },
            { key: 'nivel_5', label: 'Nível 5' },
            { key: 'nivel_6', label: 'Nível 6' },
            { key: 'nivel_7', label: 'Nível 7' },
            { key: 'nivel_8', label: 'Nível 8' },
            { key: 'nivel_9', label: 'Nível 9' }
        ];
        
        // Verificar quais níveis existem para a classe
        const dadosDaClasse = listaPorClasse[classe];
        
        listaNiveis.innerHTML = niveis.map(n => {
            const existe = dadosDaClasse && dadosDaClasse[n.key];
            const classDesativado = existe ? '' : ' desativado';
            return `<li class="sub-indice-item${classDesativado}" data-nivel="${n.key}" data-classe="${classe}">${n.label}</li>`;
        }).join('');
        
        listaNiveis.querySelectorAll('.sub-indice-item').forEach(item => {
            // Só adiciona evento de clique se não estiver desativado
            if (!item.classList.contains('desativado')) {
                item.addEventListener('click', () => {
                    const nivel = item.dataset.nivel;
                    const cls = item.dataset.classe;
                    mostrarMagias(cls, nivel);
                });
            }
        });
    });
}

// Voltar ao índice principal
btnVoltarIndice.addEventListener('click', () => {
    virarPagina(() => {
        subIndice.classList.remove('ativo');
        conteudoDireita.innerHTML = '';
        indice.style.display = 'block';
    });
});

// Mostrar magias
function mostrarMagias(classe, nivel) {
    const dadosDaClasse = listaPorClasse[classe];
    
    if (!dadosDaClasse || !dadosDaClasse[nivel]) {
        virarPagina(() => {
            subIndice.classList.remove('ativo');
            conteudoMagias.classList.add('ativo');
            conteudoDireita.innerHTML = '';
            conteudoMagias.innerHTML = `
                <button class="btn-voltar" id="btnVoltarMagias">← Voltar</button>
                <div class="erro-msg">A classe ${classe} não possui magias deste nível.</div>
            `;
            document.getElementById('btnVoltarMagias').addEventListener('click', voltarSubIndice);
        });
        return;
    }
    
    const nomesMagias = dadosDaClasse[nivel];
    todasMagiasAtual = [];
    
    nomesMagias.forEach(ref => {
        const nomeBusca = ref.nome.trim().toLowerCase();
        const info = bancoDeMagias.find(m => m.nome.trim().toLowerCase() === nomeBusca);
        
        if (info) {
            todasMagiasAtual.push(info);
        }
    });
    
    paginaAtual = 0;
    
    virarPagina(() => {
        subIndice.classList.remove('ativo');
        conteudoMagias.classList.add('ativo');
        
        const nivelLabel = nivel.replace('truques_nivel_0', 'Truques').replace('nivel_', 'Nível ');
        
        renderizarPaginaMagias(classe, nivelLabel);
    });
}

// Renderizar página de magias
function renderizarPaginaMagias(classe, nivelLabel) {
    const inicio = paginaAtual * MAGIAS_POR_PAGINA;
    const fim = inicio + MAGIAS_POR_PAGINA;
    const magiasPaginaAtual = todasMagiasAtual.slice(inicio, fim);
    const totalPaginas = Math.ceil(todasMagiasAtual.length / MAGIAS_POR_PAGINA);
    
    // Dividir: 1 magia na esquerda, 1 na direita
    const magiasEsquerda = magiasPaginaAtual.slice(0, 1);
    const magiasDireita = magiasPaginaAtual.slice(1, 2);
    
    // Página Esquerda (sempre tem o cabeçalho e botão voltar)
    conteudoMagias.innerHTML = `
        <button class="btn-voltar" id="btnVoltarMagias">← Voltar</button>
        <h2 class="magias-titulo">${classe.charAt(0).toUpperCase() + classe.slice(1)}</h2>
        <p class="magias-subtitulo">${nivelLabel} - Página ${paginaAtual + 1}/${totalPaginas}</p>
        ${renderizarMagias(magiasEsquerda)}
    `;
    
    // Página Direita (magia + botões de navegação)
    conteudoDireita.innerHTML = `
        ${renderizarMagias(magiasDireita)}
        <div class="navegacao-paginas">
            ${paginaAtual > 0 ? '<button class="btn-pagina-anterior" id="btnPaginaAnterior">← Página Anterior</button>' : ''}
            ${paginaAtual < totalPaginas - 1 ? '<button class="btn-proxima-pagina" id="btnProximaPagina">Próxima Página →</button>' : ''}
        </div>
    `;
    
    // Event listeners
    document.getElementById('btnVoltarMagias').addEventListener('click', voltarSubIndice);
    
    const btnProxima = document.getElementById('btnProximaPagina');
    if (btnProxima) {
        btnProxima.addEventListener('click', () => {
            paginaAtual++;
            virarPagina(() => {
                renderizarPaginaMagias(classe, nivelLabel);
            });
        });
    }
    
    const btnAnterior = document.getElementById('btnPaginaAnterior');
    if (btnAnterior) {
        btnAnterior.addEventListener('click', () => {
            paginaAtual--;
            virarPagina(() => {
                renderizarPaginaMagias(classe, nivelLabel);
            });
        });
    }
}

// Renderizar magias
function renderizarMagias(magias) {
    if (!magias || magias.length === 0) return '';
    
    return magias.map(magia => `
        <div class="magia-card">
            <div class="magia-titulo">${magia.nome}</div>
            <div class="magia-escola">Escola de ${magia.escola}</div>
            <div class="magia-stats">
                <p><strong>Tempo:</strong> ${magia['tempo de conjuração']}</p>
                <p><strong>Alcance:</strong> ${magia.alcance}</p>
                <p><strong>Duração:</strong> ${magia.duração}</p>
            </div>
            <div class="magia-descricao">${magia.descrição}</div>
        </div>
    `).join('');
}

// Voltar ao sub-índice
function voltarSubIndice() {
    virarPagina(() => {
        conteudoMagias.classList.remove('ativo');
        conteudoDireita.innerHTML = '';
        subIndice.classList.add('ativo');
        paginaAtual = 0;
    });
}

// Animação de virar página
function virarPagina(callback) {
    paginaEsquerda.classList.add('virando-pagina');
    paginaDireita.classList.add('virando-pagina');
    
    setTimeout(() => {
        callback();
        paginaEsquerda.classList.remove('virando-pagina');
        paginaDireita.classList.remove('virando-pagina');
    }, 300);
}

// Abrir grimório - CORRIGIDO
grimorioFechado.addEventListener('click', () => {
    // 1. Esconde a capa e mostra o livro aberto
    grimorioFechado.style.display = 'none';
    grimorioAberto.classList.add('ativo');
    grimorioAberto.style.display = 'block';

    // 2. GARANTIA: Força o índice principal a aparecer sempre ao abrir
    indice.style.display = 'block'; 
    
    // 3. Esconde qualquer outro menu que possa ter ficado aberto
    subIndice.classList.remove('ativo');
    conteudoMagias.classList.remove('ativo');
    conteudoDireita.innerHTML = '';
});

// Fechar grimório - CORRIGIDO
btnFechar.addEventListener('click', () => {
    // 1. Inicia animação de saída
    grimorioAberto.classList.remove('ativo');
    
    setTimeout(() => {
        // 2. Troca os displays
        grimorioAberto.style.display = 'none';
        grimorioFechado.style.display = 'flex';
        
        // 3. Reset total de estados internos para a próxima abertura
        indice.style.display = 'block';
        subIndice.classList.remove('ativo');
        conteudoMagias.classList.remove('ativo');
        
        // 4. Limpa textos gerados dinamicamente
        conteudoMagias.innerHTML = '';
        conteudoDireita.innerHTML = '';
        paginaAtual = 0;
    }, 300); 
});

// Iniciar
carregarDados();
