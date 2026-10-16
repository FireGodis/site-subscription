# Fechou

O Fechou ajuda profissionais autônomos que cobram por serviço a calcular quanto cobrar e organizar clientes e propostas. A calculadora gratuita estima um preço de referência usando horas e custos; os planos pagos permitem guardar clientes, propostas e resultados reais dos trabalhos.

## O que já está implementado

- Landing responsiva em português e calculadora interativa sem cadastro.
- Cadastro e login por e-mail com confirmação via Supabase Auth.
- Área autenticada com clientes, propostas, status, resumo de recebimentos e links rápidos para lembrete no WhatsApp.
- Assinaturas mensais em BRL preparadas com Mercado Pago Preapproval.
- Cancelamento iniciado pelo próprio usuário; o painel só confirma depois da resposta do Mercado Pago.
- Webhook de assinatura com validação HMAC; o servidor confirma o estado com a API do Mercado Pago antes de alterar o plano.
- RLS e verificações de propriedade no PostgreSQL. Clientes e propostas só podem ser lidos por sua própria conta e por assinatura autorizada.
- Limites dos planos aplicados tanto na API quanto em triggers de banco.
- Painel administrativo restrito a `ADMIN_EMAILS`; não há flag de administrador controlável pelo navegador.

O projeto **não guarda cartão ou dinheiro de clientes do usuário**. Nesta versão, o usuário acompanha pagamentos que recebe fora da plataforma. IA foi deixada fora do MVP para não exigir uma chave adicional nem custo por uso antes de validar o produto.

## Planos iniciais

| Plano | Preço mensal sugerido | Clientes | Propostas |
|---|---:|---:|---:|
| Essencial | R$ 19 | 5 | 10/mês |
| Pro | R$ 39 | 50 | Ilimitadas |
| Estúdio | R$ 79 | 200 | Ilimitadas |

São hipóteses iniciais de preço e limite para validar disposição a pagar; ainda não há evidência de conversão. Revise após conversar com profissionais autônomos e observar uso real.

## Hipótese de mercado e posicionamento

O IBGE estimou 26,1 milhões de trabalhadores por conta própria em 2025. Esse número é um contexto amplo, não o mercado endereçável do Fechou: nem todos vendem serviços por projeto ou pagariam por um software. Já existem produtos brasileiros próximos, como [Orça App](https://orcaapp.com.br/) e [Mona Work](https://monawork.com.br/), então “mais um gerador de orçamento” seria uma posição fraca.

A hipótese de diferenciação é ligar a estimativa ao resultado real: horas e custos previstos antes do serviço, horas e custos realizados depois, e uma taxa líquida por hora para informar o próximo preço. Os valores do Fechou ficam abaixo/na faixa de produtos existentes para reduzir a barreira inicial, mas precisam ser validados. Primeiro teste recomendado: conversar com 10–15 profissionais independentes de uma só categoria e verificar se já registram horas/custos e se pagariam para aprender com esses dados. Não usar o número amplo do IBGE como previsão de receita.

## Rodar localmente

Requer Node.js 20.9+ e npm.

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

Abra `http://localhost:3000`. A landing e a calculadora funcionam antes de conectar os serviços. Cadastro, área paga e administração só funcionam após configurar Supabase e Mercado Pago.

## Configuração dos serviços

### 1. Supabase

1. Crie um projeto Supabase e execute [`supabase/migrations/0001_initial.sql`](supabase/migrations/0001_initial.sql) pelo SQL Editor.
2. Em Project Settings → API, configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` em `.env.local` e no ambiente de deploy.
3. Mantenha a service role somente em variáveis de servidor; nunca use o prefixo `NEXT_PUBLIC_` nela.
4. Em Authentication → URL Configuration, inclua os endereços locais e de produção como URLs permitidas para confirmação de e-mail. Desative cadastro público se quiser uma beta por convite.
5. Configure `ADMIN_EMAILS` com o e-mail da conta proprietária. Use allowlist pequena.

### 2. Mercado Pago

1. Crie/valide a conta de vendedor e uma aplicação de integração no Mercado Pago. Comece com credenciais de teste.
2. Configure o access token no servidor como `MERCADOPAGO_ACCESS_TOKEN`. Nunca coloque essa chave no frontend.
3. Cadastre o endpoint `https://SEU-DOMINIO/api/billing/webhook` como webhook para os tópicos `subscription_preapproval` e `subscription_authorized_payment`; copie o segredo de assinatura para `MERCADOPAGO_WEBHOOK_SECRET`.
4. Configure `NEXT_PUBLIC_APP_URL` com a origem HTTPS de produção para que retornos e callbacks usem o domínio certo.
5. Teste aprovação, pagamento recusado, pausa/cancelamento e notificações repetidas com usuários e cartões de teste antes de ativar credenciais de produção.

A rota de webhook valida `x-signature` e `x-request-id`, busca a assinatura ou fatura diretamente pela API do Mercado Pago e só então atualiza o banco com a service role. Uma assinatura autorizada sem uma cobrança aprovada fica aguardando a primeira confirmação; é uma cobrança recorrente aprovada que abre o painel. Pagamentos pendentes/recusados, assinaturas pausadas e canceladas ficam sem acesso.

## Publicação

O código está publicado em [FireGodis/site-subscription](https://github.com/FireGodis/site-subscription). Importe esse repositório no Vercel, selecione o preset Next.js e configure as variáveis de ambiente acima. Conectar GitHub ao Vercel publica uma URL HTTPS e ativa uma nova implantação a cada push. O projeto ainda não tem uma implantação pública: falta conectar a hospedagem e configurar as credenciais do Supabase e do Mercado Pago.

## Antes de cobrar clientes reais

- Preencha os dados do responsável, suporte, termos e aviso de privacidade. Os textos atuais são rascunhos e indicam campos pendentes.
- Reveja políticas de retenção, exclusão de conta e atendimento; faça a revisão contábil e jurídica adequada ao seu negócio.
- Confirme valores, taxas do provedor, tratamento tributário e regras de cancelamento com as contas e condições atuais do Mercado Pago.
- Rode fluxo de pagamento completo em sandbox e verifique webhooks no ambiente público HTTPS.
- Tenha um processo de backup/recuperação e um canal de suporte antes de convidar usuários externos.

## Stack

Next.js 15 · React 19 · TypeScript · Supabase Auth/Postgres/RLS · Mercado Pago Preapproval API.

