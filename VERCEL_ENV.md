# 🚀 Configuração de Variáveis de Ambiente na Vercel

## 📋 Variáveis Necessárias

Configure estas variáveis no **Vercel Dashboard** → **Settings** → **Environment Variables**:

### 1. Groq API

```bash
GROQ_API_KEY=sua-chave-groq-aqui
```

**Como obter:**
1. Acesse: https://console.groq.com/keys
2. Crie uma nova API key
3. Copie e cole na Vercel

**Modelo usado:** `openai/gpt-oss-120b`

---

### 2. Supabase

```bash
NEXT_PUBLIC_SUPABASE_URL=https://wywcpbgipufylnaauewe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5d2NwYmdpcHVmeWxuYWF1ZXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODAwODAsImV4cCI6MjA2MzI1NjA4MH0.JNdRTT0MCxRUls0g8Clsle1G-CngLcP3KyCGUGlKvpA
```

**Informações do Projeto:**
- **Nome:** Foco no enem
- **ID:** wywcpbgipufylnaauewe
- **Região:** sa-east-1 (São Paulo, Brasil)
- **Status:** ✅ ACTIVE_HEALTHY
- **PostgreSQL:** 15.8.1.085

---

## 📊 Estrutura do Banco de Dados (Supabase)

### Tabelas Configuradas:

1. **essay_results** (0 registros)
   - Armazena correções de redações
   - Campos: nota, competências 1-5, feedback, etc.

2. **cached_themes** (1 registro)
   - Cache de temas gerados pela IA
   - Reduz custos em 60-70%

3. **rate_limits** (3 registros)
   - Controle de requisições por IP/endpoint
   - Proteção contra abuso

4. **analytics_events** (3 eventos)
   - Rastreamento de eventos do sistema
   - Métricas de uso e performance

5. **quiz_results** (0 registros)
   - Resultados de simulados de questões

6. **noticias** (7 notícias)
   - Sistema de notícias educacionais

7. **configuracoes** (1 registro)
   - Configurações gerais do sistema

---

## 🔐 Ambiente de Deploy

### Production (Vercel)
```bash
# Todas as variáveis acima devem ser configuradas
Environment: Production
```

### Preview (Branches)
```bash
# Mesmas variáveis de production
Environment: Preview
```

### Development (Local)
```bash
# Use o arquivo .env.local (já criado)
```

---

## ✅ Checklist de Deploy

- [ ] Configurar `GROQ_API_KEY` na Vercel
- [ ] Configurar `NEXT_PUBLIC_SUPABASE_URL` na Vercel
- [ ] Configurar `NEXT_PUBLIC_SUPABASE_ANON_KEY` na Vercel
- [ ] Verificar se todas as tabelas existem no Supabase
- [ ] Testar deploy de preview
- [ ] Fazer push para main e verificar production

---

## 🐛 Troubleshooting

### Erro: "supabaseUrl is required"
✅ **Solução:** Verifique se as variáveis `NEXT_PUBLIC_*` estão configuradas na Vercel

### Erro: "Groq API key not found"
✅ **Solução:** Configure a variável `GROQ_API_KEY` na Vercel

### Build passa mas runtime falha
✅ **Solução:** As variáveis `NEXT_PUBLIC_*` precisam estar no environment de **runtime**, não só de build

---

## 📞 Suporte

- **Supabase Dashboard:** https://supabase.com/dashboard/project/wywcpbgipufylnaauewe
- **Groq Console:** https://console.groq.com
- **Vercel Dashboard:** https://vercel.com/dashboard

---

**Última atualização:** Outubro 2025

