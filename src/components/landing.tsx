"use client";

import { useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, BarChart3, Check, ChevronRight, FileText, Wallet } from "lucide-react";

const brl = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);

function PriceCalculator() {
  const [monthlyCosts, setMonthlyCosts] = useState(900);
  const [workHours, setWorkHours] = useState(100);
  const [projectHours, setProjectHours] = useState(18);
  const [projectCosts, setProjectCosts] = useState(80);
  const [margin, setMargin] = useState(30);
  const hourly = useMemo(() => (monthlyCosts / Math.max(workHours, 1)) * (1 + margin / 100), [monthlyCosts, workHours, margin]);
  const total = hourly * projectHours + projectCosts;
  return <div className="calc-card">
    <h3>Calcule quanto cobrar por este serviço</h3><p>Preencha os custos e as horas. O resultado é um preço de referência para seu orçamento.</p>
    <div className="fields">
      <div className="field"><label>Custos fixos por mês (R$)</label><input type="number" min="0" value={monthlyCosts} onChange={e => setMonthlyCosts(+e.target.value)} /></div>
      <div className="field"><label>Horas de trabalho que você consegue cobrar por mês</label><input type="number" min="1" value={workHours} onChange={e => setWorkHours(+e.target.value)} /></div>
      <div className="field"><label>Horas previstas neste serviço</label><input type="number" min="0" value={projectHours} onChange={e => setProjectHours(+e.target.value)} /></div>
      <div className="field"><label>Materiais e outros custos deste serviço (R$)</label><input type="number" min="0" value={projectCosts} onChange={e => setProjectCosts(+e.target.value)} /></div>
    </div>
    <div className="field" style={{marginTop:14}}><label>Margem adicional para seu negócio: {margin}%</label><input type="range" min="0" max="100" value={margin} onChange={e => setMargin(+e.target.value)} /></div>
    <div className="calc-result"><div><span>Referência para cobrar pelo serviço</span><br/><small>{brl(hourly)}/hora · ajuste à sua realidade</small></div><strong>{brl(total)}</strong></div>
    <div style={{fontSize:11,color:"#78837b",marginTop:11}}>É uma estimativa: considere também impostos, experiência e os preços da sua região.</div>
  </div>;
}

export function Landing() {
  return <>
    <header className="wrap nav"><a className="brand" href="#inicio"><span className="brandmark">f.</span> fechou</a><nav className="navlinks"><a href="#como-funciona">Como funciona</a><a href="#planos">Planos</a><a href="#duvidas">Dúvidas</a><a className="btn btn-dark" href="/login">Entrar <ArrowRight size={15}/></a></nav></header>
    <main id="inicio">
      <section className="wrap hero"><div><div className="eyebrow"><i/> Orçamentos para quem trabalha por conta própria</div><h1>Saiba quanto cobrar pelo seu serviço.</h1><p>Some suas horas e os custos do trabalho para calcular um preço de referência. Depois, organize clientes e propostas no mesmo lugar.</p><div className="hero-actions"><a className="btn btn-dark" href="#calculadora">Calcular meu orçamento <ArrowRight size={16}/></a><a className="btn btn-light" href="#como-funciona">Ver como funciona</a></div><div className="small-note">A calculadora é grátis e não precisa de cadastro.</div></div>
        <div className="hero-art"><div className="halo"/><div className="float-card float-a"><span className="dot"/> Inclua seu tempo e seus custos<span className="float-strong">Antes de enviar o preço</span></div><div className="mock"><div className="mock-top"><span>Exemplo de orçamento</span><span>•••</span></div><div className="mock-title">Serviço de design</div><div className="mock-price">R$ 1.040</div><div className="mock-caption">12 horas de trabalho + custos do projeto</div><div className="quote-lines"><div><span>Seu tempo</span><strong>R$ 960</strong></div><div><span>Materiais e custos</span><strong>R$ 80</strong></div><div className="quote-total"><span>Preço de referência</span><strong>R$ 1.040</strong></div></div></div><div className="float-card float-b"><span style={{color:"#78837b"}}>Depois do serviço</span><span className="float-strong"><BadgeCheck size={15} style={{verticalAlign:"-3px",color:"#5b9665"}}/> Veja se valeu a pena</span></div></div>
      </section>
      <section className="wrap trust"><strong>Feito para autônomos que precisam:</strong><div className="trust-list"><span><Check size={14} style={{ verticalAlign: "-2px" }} /> Saber quanto cobrar</span><span><Check size={14} style={{ verticalAlign: "-2px" }} /> Organizar clientes e propostas</span><span><Check size={14} style={{ verticalAlign: "-2px" }} /> Aprender com cada trabalho</span></div></section>
      <section className="section" id="como-funciona"><div className="wrap"><div className="section-head"><div className="eyebrow"><i/> Orçamento, organização e aprendizado</div><h2>Do cálculo ao próximo orçamento.</h2><p>Use o Fechou para decidir um preço, guardar o combinado e entender o que cada serviço realmente rende.</p></div><div className="features">
        <article className="feature"><div className="feature-icon"><BarChart3 size={22}/></div><h3>1. Calcule um preço</h3><p>Informe suas despesas, as horas disponíveis e o tempo previsto para o serviço. A calculadora mostra uma referência de valor.</p></article>
        <article className="feature"><div className="feature-icon"><FileText size={22}/></div><h3>2. Organize o orçamento</h3><p>Salve cliente, serviço, valor e prazo. Gere uma mensagem pronta para revisar e enviar pelo WhatsApp.</p></article>
        <article className="feature"><div className="feature-icon"><Wallet size={22}/></div><h3>3. Veja o resultado real</h3><p>Registre quanto tempo e dinheiro gastou. Descubra quanto o trabalho rendeu por hora para orientar o próximo preço.</p></article>
      </div></div></section>
      <section className="calc-section" id="calculadora"><div className="wrap section calc-grid"><div className="calc-copy"><div className="eyebrow"><i/> Calculadora gratuita</div><h2>Faça uma conta antes de passar o preço.</h2><p>Coloque seus custos mensais, quantas horas consegue cobrar, o tempo do serviço e os gastos com materiais. O Fechou mostra um valor de referência.</p><p style={{fontSize:13}}>Não sabe algum número? Use uma estimativa e ajuste depois.</p></div><PriceCalculator/></div></section>
      <section className="section" id="planos"><div className="wrap"><div className="section-head"><div className="eyebrow"><i/> Comece pequeno, cresça no seu ritmo</div><h2>Planos claros, sem surpresa no cartão.</h2><p>Teste o essencial e escolha um plano mensal quando a organização fizer diferença no seu dia a dia.</p></div><div className="plans-grid">
        <Plan name="Essencial" price="R$ 19" desc="Para organizar os primeiros trabalhos." items={["Calculadora de preço", "Até 5 clientes ativos", "Até 10 propostas por mês", "Acompanhamento de status"]} id="essencial"/>
        <Plan name="Pro" price="R$ 39" desc="Para quem já vive de projeto em projeto." items={["Tudo do Essencial", "Até 50 clientes ativos", "Propostas sem limite", "Resumo de recebimentos", "Links rápidos para cobrança"]} id="pro" featured/>
        <Plan name="Estúdio" price="R$ 79" desc="Para uma operação pequena e organizada." items={["Tudo do Pro", "Até 200 clientes ativos", "Propostas sem limite", "Resumo de recebimentos", "Lembretes por WhatsApp"]} id="estudio"/>
      </div><p style={{textAlign:"center",fontSize:11,color:"#7b867e",marginTop:20}}>Valores de lançamento para validar o produto. Cancele quando quiser. A cobrança real só é ativada depois que o proprietário configurar o Mercado Pago.</p></div></section>
      <section className="section" id="duvidas" style={{paddingTop:12}}><div className="wrap"><div className="section-head"><h2>Dúvidas comuns</h2><p>O necessário para experimentar com tranquilidade.</p></div><div className="faq"><details><summary>Preciso colocar cartão para começar?</summary><p>Não para conhecer a página e usar a calculadora. Para salvar clientes e propostas no painel, crie uma conta. O acesso ao espaço de trabalho pede um plano ativo.</p></details><details><summary>Como funcionam as cobranças mensais?</summary><p>Os planos são cobrados por assinatura recorrente pelo Mercado Pago. O site só libera recursos pagos depois de confirmar a assinatura no servidor. A integração de produção requer credenciais da sua conta.</p></details><details><summary>A calculadora define o preço certo por mim?</summary><p>Ela mostra uma referência baseada nos valores que você informou. Sua experiência, complexidade, impostos e mercado também influenciam a proposta final.</p></details><details><summary>Meus clientes conseguem ver meus dados?</summary><p>Não. O painel usa autenticação e políticas no banco para que cada conta só leia e altere os próprios registros.</p></details></div></div></section>
      <section className="wrap"><div className="cta"><div><h2>Comece pelo próximo orçamento.</h2><p>Clareza para cobrar bem e cuidar do trabalho que vem depois.</p></div><a className="btn" href="/login">Criar minha conta <ArrowRight size={16}/></a></div></section>
    </main>
    <footer className="wrap"><a className="brand" href="#inicio" style={{fontSize:17}}><span className="brandmark" style={{width:25,height:25,borderRadius:9,fontSize:13}}>f.</span> fechou</a><span>Um projeto independente para quem vive do próprio trabalho.</span><span>© {new Date().getFullYear()} Fechou</span></footer>
  </>;
}

function Plan({name,price,desc,items,id,featured=false}:{name:string;price:string;desc:string;items:string[];id:string;featured?:boolean}) {
  return <article className={`plan ${featured?"featured":""}`}>{featured&&<div className="badge">Mais escolhido</div>}<h3>{name}</h3><div className="plan-desc">{desc}</div><div className="price">{price}<small> / mês</small></div><ul>{items.map(item=><li key={item}>{item}</li>)}</ul><a href={`/login?plan=${id}`} className={`btn ${featured?"btn-dark":"btn-outline"}`}>Escolher {name} <ChevronRight size={15}/></a></article>;
}

