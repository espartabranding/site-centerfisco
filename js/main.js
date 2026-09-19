// Canais de contato. Preencha para ativar os links e o envio do formulário.
// whatsapp: só números, com DDI e DDD (ex.: '5511999999999').
const CONTATO = {
  whatsapp: '555193649044',
  email: '',
  endereco: '',
};

const reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Cabeçalho: ganha fundo ao rolar */
const header = document.querySelector('[data-header]');
const atualizaHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
atualizaHeader();
window.addEventListener('scroll', atualizaHeader, { passive: true });

/* Menu mobile */
const toggle = document.querySelector('[data-nav-toggle]');
const rotuloToggle = toggle.querySelector('.visually-hidden');
const fechaMenu = () => {
  document.body.classList.remove('nav-open');
  toggle.setAttribute('aria-expanded', 'false');
  rotuloToggle.textContent = 'Abrir menu';
};
toggle.addEventListener('click', () => {
  const aberto = document.body.classList.toggle('nav-open');
  toggle.setAttribute('aria-expanded', String(aberto));
  rotuloToggle.textContent = aberto ? 'Fechar menu' : 'Abrir menu';
});
document.querySelectorAll('.menu a').forEach((a) => a.addEventListener('click', fechaMenu));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
    fechaMenu();
    toggle.focus();
  }
});

/* Títulos do banner: cada palavra vira uma máscara para entrar subindo */
document.querySelectorAll('[data-split]').forEach((titulo) => {
  let i = 0;
  const quebra = (no) => {
    [...no.childNodes].forEach((filho) => {
      if (filho.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        filho.textContent.split(/(\s+)/).forEach((parte) => {
          if (!parte) return;
          if (/^\s+$/.test(parte)) {
            frag.append(' ');
            return;
          }
          const w = document.createElement('span');
          w.className = 'w';
          const dentro = document.createElement('span');
          dentro.style.setProperty('--i', i++);
          dentro.textContent = parte;
          w.append(dentro);
          frag.append(w);
        });
        filho.replaceWith(frag);
      } else if (filho.nodeType === Node.ELEMENT_NODE) {
        quebra(filho);
      }
    });
  };
  titulo.setAttribute('aria-label', titulo.textContent.replace(/\s+/g, ' ').trim());
  quebra(titulo);
});

/* Página de notícias: filtro por tema */
const filtros = document.querySelector('[data-filtros]');
if (filtros) {
  const itens = document.querySelectorAll('[data-lista-noticias] .noticia');
  filtros.addEventListener('click', (e) => {
    const botao = e.target.closest('[data-filtro]');
    if (!botao) return;
    filtros.querySelectorAll('[data-filtro]').forEach((b) => b.setAttribute('aria-pressed', String(b === botao)));
    itens.forEach((item) => { item.hidden = Boolean(botao.dataset.filtro) && item.dataset.categoria !== botao.dataset.filtro; });
  });
}

/* Revelação ao rolar */
const revelaveis = document.querySelectorAll('[data-reveal]');
if (reduzMovimento || !('IntersectionObserver' in window)) {
  revelaveis.forEach((el) => el.classList.add('is-visible'));
} else {
  const obs = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (entrada.isIntersecting) {
        entrada.target.classList.add('is-visible');
        obs.unobserve(entrada.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  revelaveis.forEach((el) => obs.observe(el));
}

/* Carrosséis do celular: arrastáveis para os dois lados e cíclicos.
   Cópias dos cartões antes e depois dos originais; ao parar numa cópia, o trilho
   pula sem animação para o cartão original equivalente. */
const celular = window.matchMedia('(max-width: 640px)');
document.querySelectorAll('[data-carrossel]').forEach((trilho) => {
  const originais = [...trilho.children];
  const total = originais.length;
  let pontos = null;
  let espera = 0;

  const todos = () => [...trilho.children];
  const posicao = (el) => el.offsetLeft - (trilho.clientWidth - el.offsetWidth) / 2;
  const maisProximo = () => {
    const itens = todos();
    let melhor = 0;
    itens.forEach((el, i) => {
      if (Math.abs(posicao(el) - trilho.scrollLeft) < Math.abs(posicao(itens[melhor]) - trilho.scrollLeft)) melhor = i;
    });
    return melhor;
  };
  const vaiPara = (el, suave) => trilho.scrollTo({ left: posicao(el), behavior: suave && !reduzMovimento ? 'smooth' : 'instant' });

  const marcaPonto = () => {
    const real = (((maisProximo() - total) % total) + total) % total;
    pontos.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-current', String(i === real)));
  };
  const reposiciona = () => {
    const k = maisProximo();
    if (k < total || k >= total * 2) vaiPara(todos()[total + ((k % total) + total) % total], false);
  };
  const aoRolar = () => {
    marcaPonto();
    clearTimeout(espera);
    espera = setTimeout(reposiciona, 140); // navegadores sem o evento scrollend
  };

  const liga = () => {
    const copia = (el) => {
      const c = el.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.inert = true;
      c.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
      c.classList.add('is-visible');
      return c;
    };
    trilho.prepend(...originais.map(copia));
    trilho.append(...originais.map(copia));
    originais.forEach((el) => el.classList.add('is-visible'));
    trilho.classList.add('carrossel-ativo', 'is-visible');

    pontos = document.createElement('div');
    pontos.className = 'carrossel-pontos';
    originais.forEach((el, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `Ir para o item ${i + 1} de ${total}`);
      b.addEventListener('click', () => vaiPara(originais[i], true));
      pontos.append(b);
    });
    trilho.after(pontos);
    vaiPara(originais[0], false);
    marcaPonto();
    trilho.addEventListener('scroll', aoRolar, { passive: true });
  };

  const desliga = () => {
    trilho.removeEventListener('scroll', aoRolar);
    todos().forEach((el) => { if (!originais.includes(el)) el.remove(); });
    trilho.classList.remove('carrossel-ativo');
    pontos?.remove();
    pontos = null;
  };

  const confere = () => (celular.matches ? !pontos && liga() : pontos && desliga());
  confere();
  celular.addEventListener('change', confere);
});

/* Canais de contato */
const linkWhats = document.querySelector('[data-contact="whatsapp"]');
const linkEmail = document.querySelector('[data-contact="email"]');
const textoEndereco = document.querySelector('[data-contact="endereco"]');

function formataTelefone(n) {
  const m = n.replace(/\D/g, '').replace(/^55/, '').match(/^(\d{2})(\d{4,5})(\d{4})$/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : n;
}

if (CONTATO.whatsapp) {
  const urlWhats = `https://wa.me/${CONTATO.whatsapp}`;
  if (linkWhats) {
    linkWhats.href = urlWhats;
    linkWhats.textContent = formataTelefone(CONTATO.whatsapp);
  }
  document.querySelectorAll('.icone-redondo').forEach((a) => {
    a.href = urlWhats;
    a.target = '_blank';
    a.rel = 'noopener';
  });
}
if (CONTATO.email && linkEmail) {
  linkEmail.href = `mailto:${CONTATO.email}`;
  linkEmail.textContent = CONTATO.email;
}
if (CONTATO.endereco && textoEndereco) textoEndereco.textContent = CONTATO.endereco;

/* Botões e links com assunto já escolhem a opção no formulário */
const assunto = document.getElementById('f-assunto');
document.querySelectorAll('[data-plan]').forEach((el) => {
  el.addEventListener('click', () => {
    assunto.value = el.dataset.plan;
  });
});

/* Simulador: indica o plano da CenterFisco Saúde pelos limites de cada um */
const PLANOS = {
  essencial: { nome: 'Essencial', preco: 'R$ 1.000/mês', nivel: 1, assunto: 'Plano Essencial (Saúde)', motivo: 'Para quem atua sozinho, com até 2 colaboradores.' },
  master: { nome: 'Master', preco: 'R$ 1.850/mês', nivel: 2, assunto: 'Plano Master (Saúde)', motivo: 'Para até 3 sócios e 5 colaboradores, com apoio a convênios e setor público.' },
  personal: { nome: 'Master Personal', preco: 'a partir de R$ 2.500/mês', nivel: 3, assunto: 'Plano Master Personal (Saúde)', motivo: 'Para estruturas maiores ou em expansão, com acompanhamento de um sócio-diretor.' },
};
const simulador = document.querySelector('[data-simulador]');
if (simulador) {
  const valores = { socios: 1, colaboradores: 0 };
  const limites = { socios: [1, 10], colaboradores: [0, 30] };
  const convenios = simulador.querySelector('[data-convenios][value="sim"]');
  const motivoResultado = simulador.querySelector('[data-resultado-motivo]');
  const barrasResultado = simulador.querySelector('[data-resultado-barras]');
  const nomeResultado = simulador.querySelector('[data-resultado-plano]');
  const precoResultado = simulador.querySelector('[data-resultado-preco]');
  const botaoResultado = simulador.querySelector('[data-resultado-botao]');
  const cards = document.querySelectorAll('[data-plano]');
  const detalhe = document.querySelector('[data-plano-detalhe]');
  let chaveAtual = 'essencial';

  const indica = () => {
    // Essencial: titular e até 2 colaboradores. Master: até 3 sócios e 5 colaboradores, com convênios.
    if (valores.socios > 3 || valores.colaboradores > 5) return 'personal';
    if (valores.socios > 1 || valores.colaboradores > 2 || convenios.checked) return 'master';
    return 'essencial';
  };

  const atualiza = () => {
    Object.entries(valores).forEach(([campo, valor]) => {
      simulador.querySelector(`[data-valor="${campo}"]`).textContent = valor;
      simulador.querySelector(`[data-menos="${campo}"]`).disabled = valor <= limites[campo][0];
      simulador.querySelector(`[data-mais="${campo}"]`).disabled = valor >= limites[campo][1];
    });
    const chave = indica();
    const plano = PLANOS[chave];
    nomeResultado.textContent = plano.nome;
    precoResultado.textContent = plano.preco;
    motivoResultado.textContent = plano.motivo;
    barrasResultado.className = `barras barras-grande barras-${plano.nivel}`;
    chaveAtual = chave;
    if (!detalhe.hidden) mostraPlano();
  };

  // Mostra só o plano indicado, abaixo do simulador
  function mostraPlano({ rolar = false } = {}) {
    detalhe.hidden = false;
    botaoResultado.setAttribute('aria-expanded', 'true');
    cards.forEach((card) => { card.hidden = card.dataset.plano !== chaveAtual; });
    const visivel = detalhe.querySelector(`[data-plano="${chaveAtual}"]`);
    if (rolar) {
      visivel.scrollIntoView({ behavior: reduzMovimento ? 'auto' : 'smooth', block: 'center' });
      visivel.querySelector('.plano-nome').focus({ preventScroll: true });
    }
  }
  botaoResultado.addEventListener('click', () => mostraPlano({ rolar: true }));

  simulador.addEventListener('click', (e) => {
    const botao = e.target.closest('[data-mais], [data-menos]');
    if (!botao) return;
    const campo = botao.dataset.mais || botao.dataset.menos;
    const [min, max] = limites[campo];
    valores[campo] = Math.min(max, Math.max(min, valores[campo] + (botao.dataset.mais ? 1 : -1)));
    atualiza();
  });
  simulador.querySelectorAll('[data-convenios]').forEach((opcao) => opcao.addEventListener('change', atualiza));
  atualiza();
}

/* Formulário: monta a mensagem e abre o WhatsApp (ou o e-mail) */
const form = document.querySelector('[data-contact-form]');
const status = document.querySelector('[data-form-status]');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  status.className = 'form-status';

  let primeiroInvalido = null;
  form.querySelectorAll('[required]').forEach((campo) => {
    const valido = campo.value.trim() !== '';
    campo.setAttribute('aria-invalid', String(!valido));
    if (!valido && !primeiroInvalido) primeiroInvalido = campo;
  });
  const email = form.email;
  const emailInvalido = email.value !== '' && !email.checkValidity();
  if (emailInvalido) email.setAttribute('aria-invalid', 'true');
  else email.removeAttribute('aria-invalid');

  if (primeiroInvalido || emailInvalido) {
    status.textContent = primeiroInvalido
      ? 'Preencha nome, WhatsApp e o assunto para enviar.'
      : 'Confira o e-mail informado.';
    status.classList.add('is-error');
    (primeiroInvalido || email).focus();
    return;
  }

  const dados = new FormData(form);
  const texto = [
    `Olá, CenterFisco! Meu nome é ${dados.get('nome')}.`,
    `Assunto: ${dados.get('assunto')}`,
    `WhatsApp: ${dados.get('telefone')}`,
    dados.get('email') ? `E-mail: ${dados.get('email')}` : '',
    dados.get('mensagem') ? `\n${dados.get('mensagem')}` : '',
  ].filter(Boolean).join('\n');

  if (CONTATO.whatsapp) {
    window.open(`https://wa.me/${CONTATO.whatsapp}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
    status.textContent = 'Sua mensagem está pronta no WhatsApp. É só tocar em enviar.';
    status.classList.add('is-ok');
  } else if (CONTATO.email) {
    const titulo = encodeURIComponent(`Contato pelo site: ${dados.get('assunto')}`);
    window.location.href = `mailto:${CONTATO.email}?subject=${titulo}&body=${encodeURIComponent(texto)}`;
    status.textContent = 'Sua mensagem está pronta no seu e-mail. É só enviar.';
    status.classList.add('is-ok');
  } else {
    status.textContent = 'O envio ainda não está disponível. Tente novamente em breve.';
    status.classList.add('is-error');
  }
});

form.querySelectorAll('input, select').forEach((campo) => {
  campo.addEventListener('input', () => campo.removeAttribute('aria-invalid'));
});
