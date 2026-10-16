"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { ArrowDownRight, ArrowRight, Bell, Check, CircleDollarSign, FileText, LayoutDashboard, LogOut, Plus, Users, X } from "lucide-react";
import type { PlanId } from "@/lib/plans";

type Client = { id: string; name: string; email: string | null; phone: string | null; created_at: string };
type Proposal = {
  id: string; title: string; amount: number; status: string; due_date: string | null; scope: string | null;
  estimated_hours: number | null; actual_hours: number | null; estimated_costs: number; actual_costs: number;
  created_at: string; client: { name: string; phone: string | null } | null;
};
type Modal = "client" | "proposal" | "realization" | null;
const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const statusLabel: Record<string, string> = { sent: "Em negociação", approved: "Aprovada", paid: "Recebida", cancelled: "Cancelada" };

function getBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Banco de dados indisponível.");
  return createBrowserClient(url, key);
}

export function Paywall({ email }: { email: string }) {
  const [busy, setBusy] = useState<PlanId | "">("");
  const [message, setMessage] = useState("");
  async function go(plan: PlanId) {
    setBusy(plan); setMessage("");
    try {
      const response = await fetch("/api/billing/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível iniciar a assinatura.");
      window.location.href = result.url;
    } catch (error) { setMessage(error instanceof Error ? error.message : "Falha inesperada."); setBusy(""); }
  }
  return <main className="dashboard"><header className="wrap nav"><Link className="brand" href="/"><span className="brandmark">f.</span> fechou</Link><button className="btn btn-light" onClick={async () => { await getBrowserClient().auth.signOut(); window.location.href = "/"; }}>Sair <LogOut size={14} /></button></header>
    <div className="wrap" style={{ maxWidth: 940, paddingTop: 70, paddingBottom: 80 }}><div className="eyebrow"><i /> Sua conta está quase pronta</div><h1 style={{ font: "800 38px Manrope", letterSpacing: "-.04em", margin: "16px 0 8px" }}>Olá, {email.split("@")[0]}.</h1><p style={{ color: "#68746d", lineHeight: 1.7 }}>Escolha um plano para salvar seus clientes e propostas no Fechou. Você cancela sua assinatura direto pelo painel.</p>{message && <div className="form-alert">{message}</div>}
      <div className="plans-grid" style={{ marginTop: 30 }}>{([{ id: "essencial", name: "Essencial", price: 19, features: "5 clientes · 10 propostas/mês" }, { id: "pro", name: "Pro", price: 39, features: "50 clientes · propostas ilimitadas" }, { id: "estudio", name: "Estúdio", price: 79, features: "200 clientes · propostas ilimitadas" }] as const).map(plan => <article className={`plan ${plan.id === "pro" ? "featured" : ""}`} key={plan.id}>{plan.id === "pro" && <div className="badge">Mais escolhido</div>}<h3>{plan.name}</h3><div className="price">{money(plan.price)}<small> / mês</small></div><p style={{ color: "#68746d", fontSize: 13, minHeight: 35 }}>{plan.features}</p><button className={`btn ${plan.id === "pro" ? "btn-dark" : "btn-outline"}`} disabled={!!busy} onClick={() => go(plan.id)}>{busy === plan.id ? "Indo para pagamento…" : "Assinar agora"}<ArrowRight size={15} /></button></article>)}</div>
      <p style={{ fontSize: 11, color: "#78837b", marginTop: 20 }}>Conta: {email} · Você continuará no Fechou após a confirmação do Mercado Pago.</p></div></main>;
}

export function Dashboard({ email, clients: initialClients, proposals: initialProposals, admin }: { email: string; clients: Client[]; proposals: Proposal[]; admin: boolean }) {
  const [clients, setClients] = useState(initialClients);
  const [proposals, setProposals] = useState(initialProposals);
  const [modal, setModal] = useState<Modal>(null);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalAmount, setProposalAmount] = useState("");
  const [proposalClient, setProposalClient] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [estimatedCosts, setEstimatedCosts] = useState("0");
  const [scope, setScope] = useState("");
  const [actualHours, setActualHours] = useState("");
  const [actualCosts, setActualCosts] = useState("0");

  const openValue = proposals.filter(p => !["cancelled", "paid"].includes(p.status)).reduce((sum, p) => sum + Number(p.amount), 0);
  const paidValue = proposals.filter(p => p.status === "paid").reduce((sum, p) => sum + Number(p.amount), 0);
  const realized = proposals.filter(p => p.status === "paid" && Number(p.actual_hours) > 0);
  const averageHourly = realized.length ? realized.reduce((sum, p) => sum + (Number(p.amount) - Number(p.actual_costs || 0)) / Number(p.actual_hours), 0) / realized.length : 0;

  async function saveClient(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    const response = await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: clientName, email: clientEmail, phone: clientPhone }) });
    const result = await response.json(); setBusy(false);
    if (!response.ok) { setMessage(result.error); return; }
    setClients([result.client, ...clients]); setClientName(""); setClientEmail(""); setClientPhone(""); setModal(null);
  }

  async function saveProposal(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    const response = await fetch("/api/proposals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      client_id: proposalClient || clients[0]?.id, title: proposalTitle, amount: Number(proposalAmount), estimated_hours: estimatedHours ? Number(estimatedHours) : undefined,
      estimated_costs: Number(estimatedCosts) || 0, scope: scope || undefined
    }) });
    const result = await response.json(); setBusy(false);
    if (!response.ok) { setMessage(result.error); return; }
    const client = clients.find(c => c.id === (proposalClient || clients[0]?.id));
    setProposals([{ ...result.proposal, client: client ? { name: client.name, phone: client.phone } : null }, ...proposals]);
    setProposalTitle(""); setProposalAmount(""); setEstimatedHours(""); setEstimatedCosts("0"); setScope(""); setModal(null);
  }

  async function setStatus(proposal: Proposal, status: "approved" | "paid" | "cancelled") {
    const response = await fetch("/api/proposals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: proposal.id, status }) });
    if (response.ok) setProposals(proposals.map(p => p.id === proposal.id ? { ...p, status } : p));
  }

  function openActuals(proposal: Proposal) {
    setSelectedProposal(proposal); setActualHours(proposal.actual_hours ? String(proposal.actual_hours) : proposal.estimated_hours ? String(proposal.estimated_hours) : "");
    setActualCosts(String(proposal.actual_costs || 0)); setModal("realization");
  }

  async function saveActuals(event: FormEvent) {
    event.preventDefault(); if (!selectedProposal) return; setBusy(true); setMessage("");
    const actual = { actual_hours: Number(actualHours), actual_costs: Number(actualCosts) || 0 };
    const response = await fetch("/api/proposals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selectedProposal.id, ...actual }) });
    const result = await response.json().catch(() => ({})); setBusy(false);
    if (!response.ok) { setMessage(result.error || "Não foi possível salvar o realizado."); return; }
    setProposals(proposals.map(p => p.id === selectedProposal.id ? { ...p, ...actual } : p)); setModal(null); setSelectedProposal(null);
  }

  async function signOut() { await getBrowserClient().auth.signOut(); window.location.href = "/"; }
  async function cancelSubscription() {
    if (!window.confirm("Cancelar sua assinatura recorrente? O acesso ao painel será encerrado depois que o Mercado Pago confirmar.")) return;
    setBusy(true); const response = await fetch("/api/billing/cancel", { method: "POST" }); const result = await response.json().catch(() => ({})); setBusy(false);
    if (!response.ok) { setMessage(result.error || "Não foi possível cancelar agora."); return; } window.location.href = "/painel";
  }
  function shareProposal(proposal: Proposal) {
    if (!proposal.client?.phone) { setMessage("Adicione um telefone ao cliente para preparar a proposta no WhatsApp."); return; }
    const phone = proposal.client.phone.replace(/\D/g, "");
    const details = [proposal.scope, proposal.estimated_hours ? `Estimativa: ${proposal.estimated_hours} horas` : ""].filter(Boolean).join("\n");
    const text = `Oi, ${proposal.client.name}! Conforme conversamos, segue minha proposta para ${proposal.title}: ${money(Number(proposal.amount))}.${details ? `\n\n${details}` : ""}\n\nMe avise se quiser conversar sobre algum detalhe.`;
    window.open(`https://wa.me/${phone.startsWith("55") ? phone : `55${phone}`}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }
  return <main className="dashboard"><div className="dash-layout"><aside className="sidebar"><Link className="brand" href="/"><span className="brandmark">f.</span> fechou</Link><div className="side-label">Espaço de trabalho</div><a className="side-link active"><LayoutDashboard size={17} /> Visão geral</a><a href="#clientes" className="side-link"><Users size={17} /> Clientes</a><a href="#propostas" className="side-link"><FileText size={17} /> Propostas</a><div className="side-label">Conta</div>{admin && <Link href="/admin" className="side-link"><CircleDollarSign size={17} /> Administração</Link>}<button className="side-link" style={{ border: 0, background: "transparent", width: "100%", cursor: "pointer", marginTop: 24 }} onClick={signOut}><LogOut size={17} /> Sair da conta</button><div className="side-user"><div style={{ fontSize: 12, fontWeight: 700 }}>{email}</div><div style={{ fontSize: 11, color: "#879188", marginTop: 4 }}>Plano ativo</div></div></aside>
      <section className="dash-main"><div className="dash-top"><div><h1>Seu preço fica mais preciso a cada entrega.</h1><p>Acompanhe o que está em negociação e compare estimativa com resultado real.</p></div><div style={{ display: "flex", gap: 8 }}><button className="btn btn-light" title="Notificações"><Bell size={17} /></button><button className="btn btn-light" style={{ fontSize: 11 }} disabled={busy} onClick={cancelSubscription}>Cancelar plano</button></div></div>
        {message && <div className="notice" style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>{message}<button onClick={() => setMessage("")} aria-label="Fechar" style={{ border: 0, background: "none", cursor: "pointer" }}><X size={15} /></button></div>}
        <div className="stats"><div className="stat-card"><span>Em negociação</span><strong>{money(openValue)}</strong><small><ArrowDownRight size={13} style={{ verticalAlign: "-2px" }} /> propostas sem recebimento</small></div><div className="stat-card"><span>Recebido e marcado</span><strong>{money(paidValue)}</strong><small>Registros marcados como pagos</small></div><div className="stat-card"><span>Clientes na conta</span><strong>{clients.length}</strong><small>De um total de até 200</small></div><div className="stat-card"><span>Média líquida por hora</span><strong>{realized.length ? money(averageHourly) : "—"}</strong><small>{realized.length ? `Em ${realized.length} entregas medidas` : "Registre horas após receber"}</small></div></div>
        <div className="panel" id="propostas"><div className="panel-head"><h2>Serviços e propostas</h2><button className="btn btn-dark" style={{ padding: "10px 14px", fontSize: 12 }} onClick={() => clients.length ? setModal("proposal") : setMessage("Adicione um cliente antes de criar sua primeira proposta.")}><Plus size={15} /> Novo serviço</button></div>
          {proposals.length === 0 ? <div className="empty">Cadastre um cliente e transforme sua próxima estimativa em uma proposta.</div> : <div style={{ overflowX: "auto" }}><table className="table"><thead><tr><th>Trabalho / cliente</th><th>Preço e taxa/hora</th><th>Status</th><th>Próxima ação</th></tr></thead><tbody>{proposals.map(p => { const hours = Number(p.actual_hours || p.estimated_hours || 0); const costs = Number(p.actual_hours ? p.actual_costs : p.estimated_costs || 0); const rate = hours ? (Number(p.amount) - costs) / hours : 0; return <tr key={p.id}><td><strong>{p.title}</strong><br /><span style={{ fontSize: 11, color: "#849087" }}>{p.client?.name ?? "Cliente"}</span>{p.scope && <div style={{ fontSize: 11, color: "#849087", maxWidth: 260 }}>{p.scope}</div>}</td><td>{money(Number(p.amount))}<br /><span style={{ fontSize: 11, color: "#54805a" }}>{hours ? `${money(rate)}/h ${p.actual_hours ? "real" : "estimada"}` : "Adicione uma estimativa de horas"}</span></td><td><span className={`pill ${p.status === "sent" ? "orange" : p.status === "cancelled" ? "gray" : ""}`}>{statusLabel[p.status] ?? p.status}</span></td><td style={{ whiteSpace: "nowrap" }}>{p.status === "sent" && <><button className="btn btn-light" style={{ padding: "7px 9px", fontSize: 11 }} onClick={() => shareProposal(p)}>Enviar por WhatsApp</button> <button className="btn btn-light" style={{ padding: "7px 9px", fontSize: 11 }} onClick={() => setStatus(p, "approved")}>Aprovar</button></>}{p.status === "approved" && <button className="btn btn-dark" style={{ padding: "7px 9px", fontSize: 11 }} onClick={() => setStatus(p, "paid")}>Marcar recebido</button>}{p.status === "paid" && <button className="btn btn-light" style={{ padding: "7px 9px", fontSize: 11 }} onClick={() => openActuals(p)}>{p.actual_hours ? "Atualizar realizado" : "Registrar realizado"}</button>}</td></tr>; })}</tbody></table></div>}</div>
        <div className="panel" id="clientes"><div className="panel-head"><h2>Seus clientes</h2><button className="btn btn-light" style={{ padding: "10px 14px", fontSize: 12 }} onClick={() => setModal("client")}><Plus size={15} /> Novo cliente</button></div>{clients.length === 0 ? <div className="empty">Cadastre seu primeiro cliente para preparar uma proposta.</div> : <div style={{ overflowX: "auto" }}><table className="table"><thead><tr><th>Nome</th><th>E-mail</th><th>Telefone</th><th>Desde</th></tr></thead><tbody>{clients.slice(0, 8).map(client => <tr key={client.id}><td><strong>{client.name}</strong></td><td>{client.email || "—"}</td><td>{client.phone || "—"}</td><td>{new Date(client.created_at).toLocaleDateString("pt-BR")}</td></tr>)}</tbody></table></div>}</div>
        <div style={{ fontSize: 11, color: "#879188", textAlign: "center", marginTop: 20 }}>A média por hora considera valores recebidos menos custos reais informados, divididos pelas horas registradas.</div></section></div>
    {modal && <div role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setModal(null); }} style={{ position: "fixed", inset: 0, background: "#10251dc9", display: "grid", placeItems: "center", padding: 18, zIndex: 5 }}><form className="calc-card" onSubmit={modal === "client" ? saveClient : modal === "proposal" ? saveProposal : saveActuals} style={{ width: "min(480px,100%)", maxHeight: "90vh", overflowY: "auto" }}><div className="panel-head"><h3>{modal === "client" ? "Adicionar cliente" : modal === "proposal" ? "Estimar um serviço" : `Registrar realizado · ${selectedProposal?.title ?? ""}`}</h3><button type="button" className="btn btn-light" onClick={() => setModal(null)}><X size={15} /></button></div>
      {modal === "client" ? <><div className="field"><label>Nome</label><input autoFocus value={clientName} onChange={event => setClientName(event.target.value)} required minLength={2} maxLength={100} /></div><div className="field" style={{ marginTop: 13 }}><label>E-mail (opcional)</label><input type="email" value={clientEmail} onChange={event => setClientEmail(event.target.value)} /></div><div className="field" style={{ marginTop: 13 }}><label>Telefone com DDD (opcional)</label><input value={clientPhone} onChange={event => setClientPhone(event.target.value)} /></div></>
      : modal === "proposal" ? <><div className="field"><label>Cliente</label><select value={proposalClient || clients[0]?.id} onChange={event => setProposalClient(event.target.value)} required>{clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}</select></div><div className="field" style={{ marginTop: 13 }}><label>Nome do serviço</label><input autoFocus value={proposalTitle} onChange={event => setProposalTitle(event.target.value)} required minLength={3} maxLength={120} /></div><div className="fields" style={{ marginTop: 13 }}><div className="field"><label>Preço proposto (R$)</label><input type="number" min="1" step="0.01" value={proposalAmount} onChange={event => setProposalAmount(event.target.value)} required /></div><div className="field"><label>Horas estimadas</label><input type="number" min="0.1" step="0.1" value={estimatedHours} onChange={event => setEstimatedHours(event.target.value)} /></div></div><div className="field" style={{ marginTop: 13 }}><label>Custos extras estimados (R$)</label><input type="number" min="0" step="0.01" value={estimatedCosts} onChange={event => setEstimatedCosts(event.target.value)} /></div><div className="field" style={{ marginTop: 13 }}><label>O que está incluído? (opcional)</label><textarea rows={3} maxLength={4000} value={scope} onChange={event => setScope(event.target.value)} /></div><p style={{ color: "#68746d", fontSize: 12 }}>Depois da entrega, registre as horas e custos reais para aprender sua taxa líquida por hora.</p></>
      : <><p style={{ color: "#68746d", fontSize: 13 }}>Compare a estimativa com o que foi necessário para concluir o serviço.</p><div className="fields" style={{ marginTop: 13 }}><div className="field"><label>Horas trabalhadas</label><input autoFocus type="number" min="0.1" step="0.1" value={actualHours} onChange={event => setActualHours(event.target.value)} required /></div><div className="field"><label>Custos extras reais (R$)</label><input type="number" min="0" step="0.01" value={actualCosts} onChange={event => setActualCosts(event.target.value)} /></div></div>{actualHours && Number(actualHours) > 0 && selectedProposal && <div className="calc-result"><div><span>Taxa líquida deste trabalho</span><br /><small>Valor recebido menos os custos informados</small></div><strong>{money((Number(selectedProposal.amount) - Number(actualCosts || 0)) / Number(actualHours))}<small>/h</small></strong></div>}</>}
      <button className="btn btn-dark" style={{ width: "100%", marginTop: 18 }} disabled={busy}>{busy ? "Salvando…" : modal === "client" ? "Salvar cliente" : modal === "proposal" ? "Salvar estimativa" : "Salvar realizado"}<Check size={15} /></button></form></div>}
  </main>;
}
