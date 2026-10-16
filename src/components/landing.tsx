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
    <h3>Simule o preço do seu próximo trabalho</h3><p>Uma conta transparente que considera sua estrutura e seu tempo.</p>
    <div className="fields">
      <div className="field"><label>Custos fixos por mês (R$)</label><input type="number" min="0" value={monthlyCosts} onChange={e => setMonthlyCosts(+e.target.value)} /></div>
      <div className="field"><label>Horas faturáveis por mês</label><input type="number" min="1" value={workHours} onChange={e => setWorkHours(+e.target.value)} /></div>
      <div className="field"><label>Horas deste projeto</label><input type="number" min="0" value={projectHours} onChange={e => setProjectHours(+e.target.value)} /></div>
      <div className="field"><label>Custos extras do projeto (R$)</label><input type="number" min="0" value={projectCosts} onChange={e => setProjectCosts(+e.target.value)} /></div>
    </div>
    <div className="field" style={{marginTop:14}}><label>Margem para reinvestir: {margin}%</label><input type="range" min="0" max="100" value={margin} onChange={e => setMargin(+e.target.value)} /></div>
    <div className="calc-result"><div><span>Preço sugerido para o projeto</span><br/><small>{brl(hourly)}/hora · sem mistério</small></div><strong>{brl(total)}</strong></div>
    <div style={{fontSize:11,color:"#78837b",marginTop:11}}>Estimativa inicial, não substitui planejamento tributário. Ajuste a margem à sua realidade.</div>
  </div>;
}

export function Landing() {
  return <>
    <header className="wrap nav"><a className="brand" href="#inicio"><span className="brandmark">f.</span> fechou</a><nav className="navlinks"><a href="#como-funciona">Como funciona</a><a href="#planos">Planos</a><a href="#duvidas">Dúvidas</a><a className="btn btn-dark" href="/login">Acessar minha conta <ArrowRight size={15}/></a></nav></header>
    <main id="inicio">
      <section className="wrap hero"><div><div className="eyebrow"><i/> Preço com dados do seu trabalho</div><h1>Pare de chutar. Descubra quanto cada serviço <em>realmente paga.</em></h1><p>Calcule um preço com custos e horas. Depois da entrega, compare com o tempo e os gastos reais. Com o Fechou, seu próximo orçamento fica mais informado que o anterior.</p><div className="hero-actions"><a className="btn btn-dark" href="#calculadora">Calcular meu preço <ArrowRight size={16}/></a><a className="btn btn-light" href="/login">Conhecer o painel</a></div><div className="small-note">Comece pela calculadora. Sem cartão para experimentar.</div></div>
        <div className="hero-art"><div className="halo"/><div className="float-card float-a"><span className="dot"/> Preço por hora sugerido<span className="float-strong">R$ 87,50</span></div><div className="mock"><div className="mock-top"><span>Visão geral · outubro</span><span>•••</span></div><div className="mock-title">O seu mês, sem surpresas</div><div className="mock-price">R$ 8.420<span style={{fontSize:14,color:"#68746d",fontWeight:500}}>,00</span></div><div className="mock-caption"><span style={{color:"#54805a"}}>↑ 12%</span> em recebimentos acompanhados</div><div className="mock-chart">{[37,49,42,62,51,76,58,91,69,82,65,100].map((n,i)=><div key={i} className="bar" style={{height:`${n}%`}}/>)}</div><div className="mock-bottom"><span>MAI</span><span>JUN</span><span>JUL</span><span>AGO</span><span>SET</span><span>OUT</span></div></div><div className="float-card float-b"><span style={{color:"#78837b"}}>Proposta enviada</span><span className="float-strong"><BadgeCheck size={15} style={{verticalAlign:"-3px",color:"#5b9665"}}/> Aguardando resposta</span></div></div>
      </section>
      <section className="wrap trust"><strong>O essencial para trabalhar com mais tranquilidade:</strong><div className="trust-list"><span><Check size={14} style={{ verticalAlign: "-2px" }} /> Preço com contexto</span><span><Check size={14} style={{ verticalAlign: "-2px" }} /> Propostas organizadas</span><span><Check size={14} style={{ verticalAlign: "-2px" }} /> Recebimentos visíveis</span></div></section>
      <section className="section" id="como-funciona"><div className="wrap"><div className="section-head"><div className="eyebrow"><i/> Menos improviso, mais clareza</div><h2>O combinado começa antes do “fechou”.</h2><p>Fechou junta as pequenas rotinas que viram dor de cabeça quando ficam espalhadas em planilhas, mensagens e na memória.</p></div><div className="features">
        <article className="feature"><div className="feature-icon"><BarChart3 size={22}/></div><h3>Estime antes de aceitar</h3><p>Some horas e custos ao valor proposto e veja a taxa estimada por hora antes de se comprometer.</p></article>
        <article className="feature"><div className="feature-icon"><FileText size={22}/></div><h3>Registre o que foi combinado</h3><p>Guarde cliente, escopo, preço e prazo no mesmo lugar. Prepare uma mensagem de proposta para o WhatsApp.</p></article>
        <article className="feature"><div className="feature-icon"><Wallet size={22}/></div><h3>Compare estimativa e realidade</h3><p>Após receber, anote horas e custos reais. Veja quanto sobrou por hora nesse trabalho.</p></article>
      </div></div></section>
      <section className="calc-section" id="calculadora"><div className="wrap section calc-grid"><div className="calc-copy"><div className="eyebrow"><i/> Teste sem cadastro</div><h2>Seu tempo também entra na conta.</h2><p>Quando você cobra só pelo material, a conta costuma esquecer as horas de conversa, ajustes e entrega. Faça uma primeira estimativa gratuita.</p><p style={{fontSize:13}}>Depois, transforme a estimativa em uma proposta organizada dentro do painel.</p></div><PriceCalculator/></div></section>
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
