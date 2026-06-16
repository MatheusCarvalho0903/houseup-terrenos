# HouseUp · Banco de Terrenos

Sistema interno da **HouseUp Construtora** (Uberlândia/MG) para gestão do banco de
terrenos: cadastro, aprovação e acompanhamento de oportunidades de terra para novos
empreendimentos residenciais.

Construído com **Next.js 14 (App Router) + TypeScript**, **Tailwind CSS** e
**Supabase** (Auth + Postgres + Storage). Deploy recomendado na **Vercel**.

---

## Sumário

- [Stack](#stack)
- [Perfis de acesso](#perfis-de-acesso)
- [1. Setup do Supabase](#1-setup-do-supabase)
- [2. Rodando localmente](#2-rodando-localmente)
- [3. Deploy na Vercel](#3-deploy-na-vercel)
- [4. Convidando o primeiro usuário admin](#4-convidando-o-primeiro-usuário-admin)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Decisões de produto](#decisões-de-produto)

---

## Stack

| Camada       | Tecnologia                                  |
| ------------ | -------------------------------------------- |
| Framework    | Next.js 14 (App Router, Server Actions)      |
| Linguagem    | TypeScript                                   |
| Estilo       | Tailwind CSS 3 (paleta HouseUp customizada)  |
| Backend      | Supabase (Postgres + Auth + Storage + RLS)   |
| Hospedagem   | Vercel                                       |

---

## Perfis de acesso

| Perfil    | Pode cadastrar | Pode editar/excluir | Pode aprovar | Vê pendentes de outros | Gerencia usuários |
| --------- | :-: | :-: | :-: | :-: | :-: |
| `admin`   | ✅ | ✅ | ✅ | ✅ | ✅ |
| `manager` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `broker`  | ✅ (sempre como `pendente`) | ❌ | ❌ | ❌ (só os próprios) | ❌ |

Toda a regra acima é garantida em **duas camadas**: middleware do Next.js (UX/roteamento)
e Row Level Security do Postgres (segurança real — vale mesmo se alguém chamar a API
diretamente).

---

## 1. Setup do Supabase

### 1.1. Criar o projeto

1. Acesse [supabase.com](https://supabase.com) → **New project**.
2. Escolha nome (ex.: `houseup-terrenos`), senha do banco e região (recomendado: `South America (São Paulo)`).
3. Aguarde o provisionamento (~2 min).

### 1.2. Aplicar o schema

1. No Dashboard, abra **SQL Editor → New query**.
2. Cole **todo** o conteúdo de [`supabase/schema.sql`](./supabase/schema.sql).
3. Clique em **Run**.

Isso cria:
- Enums `user_role` e `terreno_status`;
- Tabelas `profiles`, `terrenos`, `terreno_fotos`;
- Triggers que garantem `status = 'pendente'` para cadastros de `broker` e preenchem
  `approved_by`/`approved_at` automaticamente na aprovação;
- Todas as policies de **RLS**;
- O bucket de Storage `terreno-fotos` (público para leitura, 5MB/arquivo,
  apenas `jpg/png/webp`) com suas próprias policies.

> Re-executar o script é seguro — ele usa `create if not exists` / `drop policy if exists`.

### 1.3. Confirmar autenticação por email/senha

Em **Authentication → Providers**, confirme que **Email** está habilitado. Não é
necessário habilitar nenhum provedor OAuth — o sistema usa apenas login com
email + senha, sem cadastro público (usuários só entram por convite).

Em **Authentication → URL Configuration**, defina o **Site URL** como a URL onde o
app vai rodar (ex.: `https://terrenos.houseup.com.br` em produção, ou
`http://localhost:3000` em desenvolvimento) — é para lá que o link de convite/redefinição
de senha do email vai redirecionar.

### 1.4. Coletar as chaves de API

Em **Project Settings → API**, copie:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ secreta — nunca no client)

---

## 2. Rodando localmente

```bash
git clone <url-do-repositorio> houseup-terrenos
cd houseup-terrenos

# instalar dependências
npm install

# configurar variáveis de ambiente
cp .env.example .env.local
# preencha NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY e
# SUPABASE_SERVICE_ROLE_KEY com os valores do passo 1.4

# rodar em modo desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) — você será redirecionado para
`/login`. Veja a seção 4 para criar o primeiro acesso.

Scripts disponíveis:

```bash
npm run dev     # ambiente de desenvolvimento
npm run build   # build de produção
npm run start   # roda o build de produção localmente
npm run lint    # eslint
```

---

## 3. Deploy na Vercel

1. Suba o projeto para um repositório Git (GitHub/GitLab/Bitbucket).
2. Em [vercel.com](https://vercel.com) → **Add New → Project** → importe o repositório.
3. Em **Environment Variables**, adicione as três variáveis do `.env.example`
   (mesmos valores usados localmente):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Clique em **Deploy**.
5. Após o primeiro deploy, volte em **Authentication → URL Configuration** no
   Supabase e atualize o **Site URL** (e **Redirect URLs**, se necessário) para a
   URL pública gerada pela Vercel (ex.: `https://houseup-terrenos.vercel.app`).

Cada novo push na branch de produção gera um novo deploy automaticamente.

---

## 4. Convidando o primeiro usuário admin

A tela **/usuarios** (que envia convites) só é acessível para quem **já é admin** —
ou seja, o primeiro admin precisa ser criado manualmente, uma única vez, direto no
Supabase:

1. No Dashboard do Supabase, abra **Authentication → Users → Add user → Create new user**.
2. Preencha o email (e marque **Auto Confirm User**, ou use **Send invite email**
   se preferir que a pessoa defina a própria senha pelo link recebido).
3. O trigger do banco cria automaticamente uma linha em `profiles` para esse
   usuário, com `role = 'broker'` por padrão (sem metadados, esse é o fallback).
4. Promova esse usuário a admin. No **SQL Editor**, rode:

   ```sql
   update public.profiles
   set role = 'admin'
   where email = 'seu-email@houseup.com.br';
   ```

5. Faça login em `/login` com esse usuário — a partir daí, use a tela
   **Usuários → Convidar usuário** para convidar o restante do time (sócios,
   gestores e corretores parceiros), já escolhendo a role correta no convite.

> Convites feitos pela tela `/usuarios` usam `supabase.auth.admin.inviteUserByEmail`
> com `role` e `full_name` nos metadados — o trigger já cria o profile com a role
> certa automaticamente, sem precisar de ajuste manual depois do primeiro admin.

---

## Estrutura de pastas

```
houseup-terrenos/
├── supabase/
│   └── schema.sql              # schema completo (tabelas, enums, RLS, triggers, storage)
├── src/
│   ├── middleware.ts           # proteção de sessão + checagem de role por rota
│   ├── app/
│   │   ├── login/              # tela de login (pública)
│   │   └── (app)/               # grupo de rotas protegidas (sidebar/header)
│   │       ├── layout.tsx
│   │       ├── dashboard/
│   │       ├── terrenos/
│   │       │   ├── novo/
│   │       │   └── [id]/
│   │       │       ├── page.tsx       # detalhe
│   │       │       └── editar/
│   │       ├── aprovacoes/
│   │       ├── usuarios/
│   │       └── conta/
│   ├── actions/                # Server Actions (auth, terrenos, aprovações, usuários)
│   ├── components/
│   │   ├── ui/                 # botões, badges, modal, skeleton, empty state...
│   │   ├── layout/              # Sidebar, BottomNav, Header
│   │   ├── terrenos/            # card, form, uploader de fotos, carousel, filtros
│   │   ├── aprovacoes/
│   │   └── usuarios/
│   └── lib/
│       ├── supabase/            # clients (browser, server, admin)
│       ├── types.ts
│       ├── constants.ts
│       ├── queries.ts           # leituras compartilhadas (Server Components)
│       ├── auth.ts               # requireProfile / requireRole
│       ├── maps.ts               # embed do Google Maps
│       └── utils.ts
└── .env.example
```

---

## Decisões de produto

- **Rejeição de terreno**: o enum `terreno_status` definido para o projeto tem apenas
  `pendente | disponivel | em_negociacao | vendido` — não existe um status
  "rejeitado". Por isso, **rejeitar um terreno pendente remove o cadastro e suas
  fotos permanentemente** (com modal de confirmação); o corretor pode reenviar o
  terreno corrigido como um novo cadastro.
- **Mapa embed**: o campo `link_maps` aceita qualquer link do Google Maps. A página
  de detalhe tenta converter automaticamente para o formato embedável
  (`output=embed`); quando não é possível (link de outro formato/domínio), exibe um
  botão "Abrir no Google Maps" como alternativa.
- **Fotos**: o bucket `terreno-fotos` é público para leitura (necessário para exibir
  as imagens diretamente em `<Image>`), mas todo upload/exclusão é controlado por
  RLS no `storage.objects`, replicando as mesmas regras de propriedade/status da
  tabela `terrenos`.
