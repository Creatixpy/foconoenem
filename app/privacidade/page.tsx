import Header from "../components/Header";
import Footer from "../components/Footer";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted-bg">
      <Header />

      <main className="flex-grow container mx-auto p-4 md:p-8 max-w-5xl">
        <section className="card card-gradient p-8 md:p-12 mb-8 border border-border-color animate-fadeIn">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-6 flex items-center">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            Política de Privacidade
          </h1>

          <div className="prose max-w-none text-foreground">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-8">
              <p className="text-sm font-medium text-foreground opacity-80 mb-0">
                Última atualização: {new Date().toLocaleDateString('pt-BR')}
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-primary flex items-center">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">1</span>
              Introdução
            </h2>
            <p className="mb-4 leading-relaxed opacity-90">
              O Foco no ENEM (&ldquo;nós&rdquo;, &ldquo;nosso&rdquo; ou &ldquo;site&rdquo;) está comprometido em proteger sua privacidade. 
              Esta Política de Privacidade explica como coletamos, usamos e protegemos suas informações 
              quando você utiliza nosso serviço de simulado de redação do ENEM.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-primary flex items-center">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">2</span>
              Informações que Coletamos
            </h2>
            
            <h3 className="text-xl font-semibold mt-6 mb-3 text-accent">2.1 Informações de Conta (Opcional)</h3>
            <p className="mb-4 leading-relaxed opacity-90">
              Se você optar por criar uma conta em nosso site, coletamos:
            </p>
            <ul className="list-disc ml-8 mb-6 space-y-2 opacity-90">
              <li><strong>Email:</strong> Para autenticação e comunicação</li>
              <li><strong>Senha:</strong> Criptografada e armazenada com segurança</li>
              <li><strong>Nome completo:</strong> Para personalização do perfil</li>
              <li><strong>Informações opcionais do perfil:</strong> Bio, objetivo, ano do ENEM</li>
              <li><strong>Foto de perfil:</strong> Se você optar por adicionar</li>
            </ul>
            <div className="bg-success-light border-l-4 border-success p-4 mb-6">
              <p className="text-sm font-medium text-success mb-0">
                ℹ️ <strong>Importante:</strong> A criação de conta é totalmente opcional. 
                Você pode usar todas as funcionalidades básicas sem se cadastrar.
              </p>
            </div>

            <h3 className="text-xl font-semibold mt-6 mb-3 text-accent">2.2 Informações fornecidas por você</h3>
            <p className="mb-4 leading-relaxed opacity-90">
              Ao utilizar nosso serviço (com ou sem conta), você pode nos fornecer:
            </p>
            <ul className="list-disc ml-8 mb-6 space-y-2 opacity-90">
              <li>Conteúdo de redações que você escreve</li>
              <li>Respostas em simulados de questões objetivas</li>
              <li>Temas personalizados e textos de apoio, quando você opta por criá-los</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3 text-accent">2.3 Dados de Desempenho (Para Usuários com Conta)</h3>
            <p className="mb-4 leading-relaxed opacity-90">
              Para usuários com conta, coletamos e armazenamos automaticamente:
            </p>
            <ul className="list-disc ml-8 mb-6 space-y-2 opacity-90">
              <li><strong>Histórico de redações:</strong> Todas as redações enviadas e suas correções</li>
              <li><strong>Notas e feedback:</strong> Pontuações e análises de cada competência</li>
              <li><strong>Resultados de simulados:</strong> Respostas, acertos e erros em questões</li>
              <li><strong>Estatísticas agregadas:</strong> Médias, evolução, taxa de acerto</li>
              <li><strong>Análises de progresso:</strong> Pontos fortes e áreas a melhorar</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3 text-accent">2.4 Informações Coletadas Automaticamente</h3>
            <p className="mb-4 leading-relaxed opacity-90">
              Quando você acessa nosso site, podemos coletar automaticamente:
            </p>
            <ul className="list-disc ml-8 mb-6 space-y-2 opacity-90">
              <li>Dados técnicos como endereço IP, tipo e versão do navegador</li>
              <li>Informações sobre sua visita, incluindo as páginas que você visita</li>
              <li>Cookies de sessão para autenticação (se você tiver conta)</li>
              <li>Cookies de preferências (tema claro/escuro)</li>
              <li>Eventos de uso para analytics (redação enviada, simulado iniciado, etc.)</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-primary flex items-center">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">3</span>
              Como Usamos Suas Informações
            </h2>
            <p className="mb-4 leading-relaxed opacity-90">
              Utilizamos suas informações para:
            </p>
            <ul className="list-disc ml-8 mb-6 space-y-2 opacity-90">
              <li><strong>Autenticação:</strong> Gerenciar sua conta e manter você logado</li>
              <li><strong>Correção de redações:</strong> Processar e fornecer feedback sobre suas redações</li>
              <li><strong>Simulados de questões:</strong> Gerar, avaliar e explicar questões objetivas</li>
              <li><strong>Análises de desempenho:</strong> Calcular estatísticas, gerar gráficos e identificar áreas de melhoria</li>
              <li><strong>Recomendações personalizadas:</strong> Sugerir o que e como estudar com base no seu progresso</li>
              <li><strong>Comunicação:</strong> Enviar emails importantes sobre sua conta (se você tiver uma)</li>
              <li><strong>Melhoria do serviço:</strong> Analisar como nosso site é utilizado para aprimoramento</li>
              <li><strong>Desenvolvimento:</strong> Criar novos recursos e funcionalidades baseados em dados agregados</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-primary flex items-center">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">4</span>
              Armazenamento de Dados
            </h2>
            
            <h3 className="text-xl font-semibold mt-6 mb-3 text-accent">4.1 Usuários sem Conta</h3>
            <p className="mb-4 leading-relaxed opacity-90">
              Para usuários não autenticados, os dados são temporários:
            </p>
            <ul className="list-disc ml-8 mb-6 space-y-2 opacity-90">
              <li>Redações e correções são armazenadas apenas para visualização imediata</li>
              <li>Nenhum dado pessoal é vinculado às redações</li>
              <li>Resultados não são acessíveis após fechar a página</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3 text-accent">4.2 Usuários com Conta</h3>
            <p className="mb-4 leading-relaxed opacity-90">
              Para usuários com conta, mantemos um banco de dados persistente e seguro:
            </p>
            <ul className="list-disc ml-8 mb-6 space-y-2 opacity-90">
              <li><strong>Infraestrutura:</strong> Dados armazenados no Supabase (PostgreSQL)</li>
              <li><strong>Localização:</strong> Servidores na América do Sul (região sa-east-1 - São Paulo)</li>
              <li><strong>Criptografia:</strong> Senhas criptografadas com bcrypt</li>
              <li><strong>Backup:</strong> Backups automáticos diários</li>
              <li><strong>Retenção:</strong> Dados mantidos enquanto sua conta estiver ativa</li>
              <li><strong>Segurança:</strong> Row Level Security (RLS) - você só acessa seus próprios dados</li>
            </ul>
            
            <div className="bg-primary/5 border-l-4 border-primary p-4 mb-6">
              <p className="text-sm font-medium text-foreground mb-0">
                🔒 <strong>Segurança:</strong> Implementamos Row Level Security (RLS) no banco de dados,
                garantindo que você só possa acessar seus próprios dados. Nem nós podemos ver dados de outros usuários sem autorização.
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-primary flex items-center">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">5</span>
              Tecnologias de Inteligência Artificial
            </h2>
            <p className="mb-4 leading-relaxed opacity-90">
              Nossos serviços utilizam modelos de inteligência artificial (IA) para:
            </p>
            <ul className="list-disc ml-8 mb-6 space-y-2 opacity-90">
              <li><strong>Correção de redações:</strong> Análise de texto e atribuição de notas por competência</li>
              <li><strong>Geração de questões:</strong> Criação de questões objetivas de múltipla escolha</li>
              <li><strong>Geração de temas:</strong> Criação de temas relevantes para redação</li>
              <li><strong>Explicações:</strong> Feedback detalhado e explicações de respostas</li>
            </ul>
            <p className="mb-4 leading-relaxed opacity-90">
              <strong>Provedor de IA:</strong> Groq (modelo GPT-OSS 120B)<br/>
              Os dados processados são enviados a este provedor terceirizado, sempre respeitando 
              as melhores práticas de privacidade. Seu conteúdo não é usado para treinar modelos de IA.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-primary flex items-center">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">6</span>
              Compartilhamento de Informações
            </h2>
            <p className="mb-4 leading-relaxed opacity-90">
              Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, exceto:
            </p>
            <ul className="list-disc ml-8 mb-6 space-y-2 opacity-90">
              <li>Com provedores de IA para processamento de redações</li>
              <li>Caso seja exigido por lei</li>
              <li>Para proteger nossos direitos e propriedade</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-primary flex items-center">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">7</span>
              Seus Direitos (LGPD)
            </h2>
            <p className="mb-4 leading-relaxed opacity-90">
              De acordo com a Lei Geral de Proteção de Dados (LGPD) e outras leis aplicáveis, você tem o direito de:
            </p>
            <ul className="list-disc ml-8 mb-6 space-y-2 opacity-90">
              <li><strong>Acesso:</strong> Visualizar todos os dados pessoais que mantemos sobre você</li>
              <li><strong>Correção:</strong> Atualizar informações imprecisas ou incompletas no seu perfil</li>
              <li><strong>Exclusão:</strong> Solicitar a exclusão completa de seus dados e conta</li>
              <li><strong>Portabilidade:</strong> Receber seus dados em formato legível por máquina</li>
              <li><strong>Revogação:</strong> Retirar consentimento para processamento de dados a qualquer momento</li>
              <li><strong>Oposição:</strong> Opor-se ao processamento de seus dados em certas circunstâncias</li>
              <li><strong>Informação:</strong> Saber com quem seus dados foram compartilhados</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3 text-accent">7.1 Como Exercer Seus Direitos</h3>
            <p className="mb-4 leading-relaxed opacity-90">
              <strong>Para usuários com conta:</strong>
            </p>
            <ul className="list-disc ml-8 mb-6 space-y-2 opacity-90">
              <li><strong>Visualizar/Editar dados:</strong> Acesse &ldquo;Minha Conta&rdquo; → &ldquo;Editar Perfil&rdquo;</li>
              <li><strong>Deletar conta:</strong> Entre em contato conosco (implementaremos autoatendimento em breve)</li>
              <li><strong>Exportar dados:</strong> Entre em contato conosco pelo email de suporte</li>
            </ul>

            <p className="mb-4 leading-relaxed opacity-90">
              <strong>Para todas as solicitações:</strong> creatixpy@gmail.com<br/>
              Responderemos em até 15 dias úteis.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-primary flex items-center">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">8</span>
              Segurança
            </h2>
            <p className="mb-4 leading-relaxed opacity-90">
              Implementamos medidas técnicas e organizacionais para proteger suas informações contra acesso 
              não autorizado, perda ou alteração. No entanto, nenhuma transmissão de dados pela internet ou 
              sistema de armazenamento é 100% seguro.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-primary flex items-center">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">9</span>
              Alterações nesta Política
            </h2>
            <p className="mb-4 leading-relaxed opacity-90">
              Podemos atualizar esta Política de Privacidade periodicamente. Recomendamos que você revise 
              esta página regularmente para ficar informado sobre quaisquer alterações.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-primary flex items-center">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">10</span>
              Cookies e Tecnologias Similares
            </h2>
            <p className="mb-4 leading-relaxed opacity-90">
              Utilizamos cookies e tecnologias similares para:
            </p>
            <ul className="list-disc ml-8 mb-6 space-y-2 opacity-90">
              <li><strong>Cookies essenciais:</strong> Manter você logado (sessão de autenticação)</li>
              <li><strong>Cookies de preferência:</strong> Lembrar suas configurações (tema claro/escuro)</li>
              <li><strong>Cookies de analytics:</strong> Entender como o site é usado (dados anônimos)</li>
            </ul>
            <p className="mb-4 leading-relaxed opacity-90">
              Você pode gerenciar cookies através das configurações do seu navegador, mas isso pode 
              limitar algumas funcionalidades do site.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-primary flex items-center">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">11</span>
              Exclusão de Conta e Dados
            </h2>
            <p className="mb-4 leading-relaxed opacity-90">
              Se você optar por excluir sua conta:
            </p>
            <ul className="list-disc ml-8 mb-6 space-y-2 opacity-90">
              <li>Todos os seus dados pessoais serão permanentemente removidos</li>
              <li>Seu histórico de redações e simulados será deletado</li>
              <li>Estatísticas e análises serão apagadas</li>
              <li>Esta ação é irreversível e não pode ser desfeita</li>
              <li>Dados agregados e anônimos podem ser mantidos para estatísticas gerais</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-primary flex items-center">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">12</span>
              Contato
            </h2>
            <p className="mb-4 leading-relaxed opacity-90">
              Se você tiver dúvidas ou preocupações sobre esta Política de Privacidade, entre em contato 
              conosco através do e-mail: <strong>creatixpy@gmail.com</strong>
            </p>
            <p className="mb-4 leading-relaxed opacity-90">
              <strong>Encarregado de Dados (DPO):</strong> creatixpy@gmail.com<br/>
              <strong>Tempo de resposta:</strong> Até 15 dias úteis
            </p>
          </div>

          <div className="mt-10 flex justify-center">
            <Link href="/" className="btn btn-primary inline-flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar para a página inicial
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
