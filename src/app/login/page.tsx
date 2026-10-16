"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [mode,setMode]=useState<"in"|"up">("up"); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");
  async function submit(e:FormEvent){e.preventDefault();setBusy(true);setMessage("");
    const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if(!url||!key){setMessage("O cadastro estará disponível assim que o proprietário conectar o banco de dados Supabase.");setBusy(false);return;}
    const supabase=createBrowserClient(url,key);
    if(mode==="up") { const {error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:`${window.location.origin}/auth/callback`}}); setMessage(error?error.message:"Enviamos um link de confirmação para seu e-mail. Confirme e depois entre na sua conta."); }
    else { const {error}=await supabase.auth.signInWithPassword({email,password}); if(error)setMessage(error.message);else window.location.href="/painel"; }
    setBusy(false);
  }
  return <main className="auth-shell"><section className="auth-side"><Link href="/" className="brand"><span className="brandmark">f.</span> fechou</Link><div><div className="eyebrow" style={{color:"#d8eea8"}}><i/> Seu trabalho, com clareza</div><h1>Um próximo passo mais organizado começa aqui.</h1><p>Preço, proposta e acompanhamento no mesmo lugar. Sem planilha perdida entre mensagens.</p></div><Link href="/" style={{fontSize:13,color:"#d9e4dc"}}><ArrowLeft size={14} style={{verticalAlign:"-3px"}}/> Voltar ao início</Link></section><section className="auth-form-wrap"><form className="auth-form" onSubmit={submit}><Link href="/" className="eyebrow" style={{marginBottom:26}}><ArrowLeft size={14}/> Página inicial</Link><h2>{mode==="up"?"Crie sua conta":"Que bom ter você de volta"}</h2><p>{mode==="up"?"Comece organizando seu próximo orçamento.":"Entre para continuar de onde parou."}</p>{message&&<div className="form-alert">{message}</div>}<div className="field"><label htmlFor="email">E-mail</label><input id="email" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required/></div><div className="field"><label htmlFor="password">Senha</label><input id="password" type="password" minLength={8} autoComplete={mode==="up"?"new-password":"current-password"} value={password} onChange={e=>setPassword(e.target.value)} required/></div><button className="btn btn-dark" type="submit" disabled={busy}>{busy?"Só um instante…":mode==="up"?"Criar conta":"Entrar"}<ArrowRight size={15}/></button><p style={{fontSize:13,textAlign:"center",marginTop:20}}>{mode==="up"?"Já tem conta?":"Ainda não tem conta?"} <button type="button" onClick={()=>{setMode(mode==="up"?"in":"up");setMessage("")}} style={{border:0,background:"none",color:"#24694e",fontWeight:700,cursor:"pointer"}}>{mode==="up"?"Entrar":"Criar conta"}</button></p><p style={{fontSize:11,textAlign:"center",marginTop:28}}>Ao continuar, você concorda com nossos <Link href="/termos">Termos</Link> e <Link href="/privacidade">Aviso de privacidade</Link>.</p></form></section></main>;
}
