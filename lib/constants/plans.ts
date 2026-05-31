import {
  MAX_PLAN_NAME,
  MAX_PLAN_PRICE_DISPLAY,
  MAX_PLAN_TRIAL_DAYS,
} from './subscriptions';

export const FREE_PLAN_NAME = 'Gratuito' as const;
export const FREE_PLAN_PRICE_DISPLAY = 'R$ 0' as const;

export const PLAN_FEATURES = {
  free: [
    'Correções de redação com IA padrão',
    'Temas e textos de apoio reaproveitados quando disponíveis',
    'Simulados com banco de questões da plataforma',
    'Histórico, estatísticas e acompanhamento básico',
    'Acesso às notícias e busca no acervo aprovado',
  ],
  max: [
    'Correções de redação com IA Max',
    'Temas inéditos com textos de apoio gerados sob demanda',
    'Simulados com mais questões novas e menos repetição',
    'Menos dependência de cache compartilhado nas respostas',
    'Painel de assinatura com renovação e cancelamento pelo Stripe',
    `${MAX_PLAN_TRIAL_DAYS} dias grátis no primeiro ciclo`,
  ],
} as const;

export const MAX_PLAN_BENEFITS = [
  {
    title: 'Redação com IA Max',
    description:
      'Correções estruturadas nas cinco competências com uma camada de IA premium para usuários assinantes.',
  },
  {
    title: 'Temas mais frescos',
    description:
      'Geração sob demanda de tema e textos de apoio, reduzindo dependência do acervo compartilhado.',
  },
  {
    title: 'Simulados mais inéditos',
    description:
      'Prioriza questões novas por disciplina antes de recorrer ao banco salvo para completar o simulado.',
  },
  {
    title: 'Assinatura transparente',
    description:
      `Teste por ${MAX_PLAN_TRIAL_DAYS} dias, acompanhe o status e gerencie cobrança com segurança pelo Stripe.`,
  },
] as const;

export const PLAN_COMPARISON_ROWS = [
  {
    feature: 'Correção de redações',
    free: 'IA padrão',
    max: 'IA Max',
  },
  {
    feature: 'Geração de temas',
    free: 'Cache e geração quando necessário',
    max: 'Temas sob demanda',
  },
  {
    feature: 'Questões de simulado',
    free: 'Mistura banco salvo e novas questões',
    max: 'Prioriza questões novas',
  },
  {
    feature: 'Histórico e estatísticas',
    free: 'Incluído',
    max: 'Incluído',
  },
  {
    feature: 'Gestão da assinatura',
    free: 'Não aplicável',
    max: 'Portal seguro Stripe',
  },
] as const;

export const MAX_PLAN_MARKETING = {
  name: MAX_PLAN_NAME,
  price: MAX_PLAN_PRICE_DISPLAY,
  trialDays: MAX_PLAN_TRIAL_DAYS,
  tagline: 'Mais IA, mais questões inéditas e uma preparação mais personalizada para o ENEM.',
} as const;
