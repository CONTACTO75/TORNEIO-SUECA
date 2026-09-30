# Torneio de Sueca: aplicação web

Aplicação para gerir torneios de sueca por pontos: inscrições, calendário automático, lançamento de
resultados em vários telemóveis ao mesmo tempo, classificação em tempo real, ecrã para a TV,
folhas de jogo para imprimir e exportação para Excel.

## O que tem

**Páginas públicas** (qualquer pessoa com o link):
- Classificação, com prémios e critérios de desempate.
- Jornadas, com os resultados mesa a mesa.
- Equipas e a folha de cada equipa, jornada a jornada. Substitui as antigas "folhas de controlo".
- Ecrã TV (`/t/<id>/tv`): classificação grande e a jornada em curso. Atualiza sozinho. Se houver
  mais de 16 equipas, alterna entre páginas.

**Gestão** (só a organização, com email e palavra-passe):
- **Resultados**: escreve-se o total de uma equipa e a outra é preenchida para dar 480. A app
  recusa somas erradas, pede confirmação antes de substituir um resultado e mostra quem o lançou
  e a que horas.
- **Equipas**: inscrição, suplente, contactos e pagamento. É possível colar a lista diretamente do Excel.
- **Calendário**: todos contra todos, gerado automaticamente. Com número ímpar de equipas, há uma
  folga por jornada. Sem sorteio, reproduz exatamente o calendário do Excel de 2026.
- **Penalizações**: somar ou descontar pontos com motivo (renúncia, falar durante o jogo, etc.).
- **Definições**: datas, jornadas por dia, pontos por jogo, jogos por jornada, critérios de
  desempate (e a sua ordem) e prémios.
- Imprimir folhas de jogo (4 por A4) e exportar tudo para Excel.

## Experimentar no computador

É preciso ter o [Node.js](https://nodejs.org) (versão 18 ou mais recente).

```bash
npm install
npm run dev
```

Abra o endereço que aparece (normalmente http://localhost:5173) e depois abra **/admin**.
Carregue em **Carregar torneio de 2026** para ver a app com os dados reais.

Sem configurar o Supabase, a app fica em **modo local**: os dados são guardados só naquele
navegador e não é pedida palavra-passe. Serve para testar. Também serve de plano B se não houver
internet no dia: o portátil ligado à TV faz tudo, com a TV num separador e a gestão noutro.

## Pôr online (grátis): Supabase + Vercel

### 1. Base de dados (Supabase)
1. Crie uma conta em https://supabase.com e um projeto novo. Escolha a região Europe (ex.: Frankfurt).
2. Abra **SQL Editor > New query**, cole o conteúdo de `supabase/schema.sql` e carregue em **Run**.
3. Em **Authentication > Sign In / Providers**, desligue **Allow new users to sign up**.
   **Isto é importante**: sem este passo, qualquer pessoa podia criar conta e alterar resultados.
4. Em **Authentication > Users > Add user**, crie uma conta para cada pessoa da organização
   (email e palavra-passe; marque "Auto confirm user").
5. Em **Project Settings > API**, copie o **Project URL** e a chave **anon public**.

### 2. Código (GitHub)
Crie um repositório no GitHub e envie esta pasta para lá (pode usar o GitHub Desktop ou
"Add file > Upload files" no site).

### 3. Site (Vercel)
1. Em https://vercel.com, faça **Add New > Project** e escolha o repositório. O Vercel deteta o Vite sozinho.
2. Em **Environment Variables**, acrescente:
   - `VITE_SUPABASE_URL`, com o Project URL
   - `VITE_SUPABASE_ANON_KEY`, com a chave anon public
3. Carregue em **Deploy**. Fica com um endereço do tipo `torneio-sueca.vercel.app`.
   Em Settings > Domains pode trocar o nome.

A chave "anon" pode estar no site sem problema: as regras de segurança do `schema.sql` só deixam
escrever quem tem sessão iniciada.

## No dia do torneio
1. Na gestão, confirme as equipas, marque os pagamentos e gere o calendário. Em Definições, ative
   "Mostrar este torneio na página inicial".
2. Imprima as folhas de jogo, só as do dia se preferir.
3. No portátil da TV, abra o **Ecrã TV** e carregue em "Ecrã inteiro".
4. Cada pessoa da organização entra em `/admin` no telemóvel e lança os totais das mesas à
   medida que as folhas chegam.
5. Partilhe o endereço principal (por exemplo, num QR code na mesa) para os jogadores
   acompanharem a classificação no telemóvel.
6. No fim, use **Exportar Excel** para guardar um arquivo.

## Estrutura
```
src/lib/schedule.js     calendário (método do círculo) e distribuição por dias
src/lib/standings.js    classificação, desempates e prémios
src/lib/db.js           escolhe Supabase ou modo local
src/lib/supabaseDb.js   acesso ao Supabase com tempo real
src/lib/localDb.js      modo local (localStorage)
src/pages/              páginas públicas, TV e gestão
supabase/schema.sql     tabelas e regras de segurança
```
