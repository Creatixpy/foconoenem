import Header from "../components/Header";
import Footer from "../components/Footer";
import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted-bg">
      <Header />

      <main className="flex-grow container mx-auto p-4 md:p-8 max-w-5xl">
        <section className="card card-gradient p-8 md:p-12 mb-8 border border-border-color animate-fadeIn">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-6 flex items-center">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            Termos de Serviço
          </h1>

          <div className="prose max-w-none text-foreground">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-8">
              <p className="text-sm font-medium text-foreground opacity-80 mb-0">
                Última atualização: {new Date().toLocaleDateString('pt-BR')}
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-primary flex items-center">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">1</span>
              Aceitação dos Termos
            </h2>
            <p className="mb-4 leading-relaxed opacity-90">
              Ao acessar ou usar o Foco no ENEM, você concorda em cumprir e estar vinculado a estes Termos de Serviço.
              Se você não concordar com qualquer parte destes termos, não poderá acessar ou utilizar nosso serviço.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-primary flex items-center">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">2</span>
              Descrição do Serviço
            </h2>
            <p className="mb-4 leading-relaxed opacity-90">
              O Foco no ENEM oferece:
            </p>
            <ul className="list-disc ml-8 mb-6 space-y-2 opacity-90">
              <li><strong>Simulado de redação:</strong> Com correção por inteligência artificial seguindo os critérios do ENEM</li>
              <li><strong>Simulado de questões:</strong> Questões objetivas de múltiplas disciplinas</li>
              <li><strong>Sistema de contas opcional:</strong> Dashboard com análises, gráficos e recomendações personalizadas</li>
              <li><strong>Notícias educacionais:</strong> Conteúdo relevante para estudantes do ENEM</li>
            </ul>
            <p className="mb-4 leading-relaxed opacity-90">
              Nosso serviço permite que estudantes pratiquem suas habilidades e recebam feedback detalhado,
              com a opção de acompanhar seu progresso ao longo do tempo através de uma conta gratuita.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-primary flex items-center">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">3</span>
              Sistema de Contas
            </h2>
            
            <h3 className="text-xl font-semibold mt-6 mb-3 text-accent">3.1 Uso sem Cadastro</h3>
            <p className="mb-4 leading-relaxed opacity-90">
              O cadastro NÃO é obrigatório. Você pode usar livremente:
            </p>
            <ul className="list-disc ml-8 mb-6 space-y-2 opacity-90">
              <li>Simulado de redação com correção completa</li>
              <li>Simulado de questões objetivas</li>
              <li>Visualização de resultados individuais</li>
              <li>Leitura de notícias educacionais</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3 text-accent">3.2 Benefícios da Conta</h3>
            <p className="mb-4 leading-relaxed opacity-90">
              Ao criar uma conta gratuita, você ganha acesso a:
            </p>
            <ul className="list-disc ml-8 mb-6 space-y-2 opacity-90">
              <li><strong>Dashboard de métricas:</strong> Visualize seu desempenho em gráficos interativos</li>
              <li><strong>Histórico completo:</strong> Todas suas redações e simulados salvos</li>
              <li><strong>Análises inteligentes:</strong> Identifique seus pontos fortes e fracos</li>
              <li><strong>Recomendações personalizadas:</strong> Saiba exatamente o que estudar</li>
              <li><strong>Evolução temporal:</strong> Acompanhe seu progresso ao longo do tempo</li>
              <li><strong>Estatísticas detalhadas:</strong> Médias, taxa de acerto, comparações</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3 text-accent">3.3 Criação de Conta</h3>
            <p className="mb-4 leading-relaxed opacity-90">
              Para criar uma conta, você precisará fornecer:
            </p>
            <ul className="list-disc ml-8 mb-6 space-y-2 opacity-90">
              <li>Email válido (usado para login e comunicação)</li>
              <li>Senha segura (mínimo 6 caracteres)</li>
              <li>Nome completo (para personalização)</li>
            </ul>
            <p className="mb-4 leading-relaxed opacity-90">
              Ao criar uma conta, você concorda em:
            </p>
            <ul className="list-disc ml-8 mb-6 space-y-2 opacity-90">
              <li>Fornecer informações precisas e verdadeiras</li>
              <li>Manter a confidencialidade de sua senha</li>
              <li>Notificar-nos imediatamente sobre qualquer uso não autorizado</li>
              <li>Ser responsável por todas as atividades em sua conta</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3 text-accent">3.4 Encerramento de Conta</h3>
            <p className="mb-4 leading-relaxed opacity-90">
              Você pode solicitar o encerramento de sua conta a qualquer momento através do email 
              de suporte. Ao encerrar sua conta:
            </p>
            <ul className="list-disc ml-8 mb-6 space-y-2 opacity-90">
              <li>Todos os seus dados pessoais serão excluídos</li>
              <li>Seu histórico será permanentemente apagado</li>
              <li>Esta ação é irreversível</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-primary flex items-center">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">4</span>
              Responsabilidades do Usuário
            </h2>
            <p className="mb-4 leading-relaxed opacity-90">
              Ao usar nosso serviço (com ou sem conta), você é responsável por:
            </p>
            <ul className="list-disc ml-8 mb-6 space-y-2 opacity-90">
              <li>Fornecer informações precisas e verdadeiras</li>
              <li>Usar o serviço de forma responsável e ética</li>
              <li>Não compartilhar suas credenciais de acesso</li>
              <li>Manter a segurança de sua conta</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-primary flex items-center">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">5</span>
              Horário de Funcionamento
            </h2>
            <p className="mb-4 leading-relaxed opacity-90">
              O serviço de simulado de redação está disponível apenas entre 7h e 22h (horário de Brasília).
              Fora deste período, você poderá navegar pelo site, mas não conseguirá submeter redações para correção.
              Esta limitação existe para gerenciar os recursos de IA e garantir um serviço de qualidade.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-primary flex items-center">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">6</span>
              Restrições de Uso
            </h2>
            <p className="mb-4 leading-relaxed opacity-90">
              Ao usar nosso serviço, você concorda em não:
            </p>
            <ul className="list-disc ml-8 mb-6 space-y-2 opacity-90">
              <li>Enviar conteúdo ofensivo, difamatório, pornográfico ou ilegal</li>
              <li>Utilizar o serviço para plagiar ou fraudar trabalhos acadêmicos</li>
              <li>Tentar acessar, modificar ou interferir nos sistemas do site</li>
              <li>Usar o serviço de maneira que possa sobrecarregar ou prejudicar a infraestrutura</li>
              <li>Compartilhar conteúdo que viole direitos autorais ou propriedade intelectual</li>
              <li>Utilizar ferramentas automatizadas ou bots para acessar o serviço</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-primary flex items-center">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">7</span>
              Propriedade Intelectual e Uso de Dados
            </h2>
            <p className="mb-4 leading-relaxed opacity-90">
              O conteúdo disponibilizado em nosso site, incluindo textos, gráficos, logotipos, imagens e software, 
              é de nossa propriedade ou de nossos licenciadores e é protegido por leis de direitos autorais.
            </p>
            <p className="mb-4 leading-relaxed opacity-90">
              Você mantém todos os direitos sobre as redações que envia para correção. No entanto, ao usar nosso serviço, 
              você nos concede uma licença limitada para:
            </p>
            <ul className="list-disc ml-8 mb-6 space-y-2 opacity-90">
              <li>Processar seu texto através de IA para fornecer correção</li>
              <li>Armazenar temporariamente (usuários sem conta) ou permanentemente (usuários com conta) seu conteúdo</li>
              <li>Gerar estatísticas e análises baseadas no seu desempenho (apenas para usuários com conta)</li>
              <li>Usar dados agregados e anônimos para melhorar o serviço</li>
            </ul>
            <p className="mb-4 leading-relaxed opacity-90">
              <strong>Importante:</strong> Seus dados individuais nunca são compartilhados publicamente ou vendidos a terceiros.
              Dados agregados e anônimos podem ser usados para estatísticas gerais.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-primary flex items-center">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">8</span>
              Limitação de Garantias
            </h2>
            <p className="mb-4 leading-relaxed opacity-90">
              Nosso serviço é fornecido &ldquo;como está&rdquo; e &ldquo;conforme disponível&rdquo;, sem garantias de qualquer tipo, 
              expressas ou implícitas. Não garantimos que:
            </p>
            <ul className="list-disc ml-8 mb-6 space-y-2 opacity-90">
              <li>O serviço atenderá às suas necessidades específicas</li>
              <li>O serviço será ininterrupto, pontual, seguro ou livre de erros</li>
              <li>Os resultados da correção serão precisos ou confiáveis</li>
              <li>A qualidade do serviço atenderá às suas expectativas</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-primary flex items-center">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">9</span>
              Limitação de Responsabilidade
            </h2>
            <p className="mb-4 leading-relaxed opacity-90">
              Em nenhuma circunstância seremos responsáveis por danos diretos, indiretos, incidentais, 
              especiais, consequenciais ou punitivos resultantes do uso ou incapacidade de usar nosso serviço.
            </p>
            <p className="mb-4 leading-relaxed opacity-90">
              O serviço de correção por IA é fornecido como ferramenta educacional e de prática, 
              e não substitui a avaliação humana em contextos oficiais. Não nos responsabilizamos por 
              decisões tomadas com base no feedback fornecido.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-primary flex items-center">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">10</span>
              Modificações ao Serviço
            </h2>
            <p className="mb-4 leading-relaxed opacity-90">
              Reservamo-nos o direito de modificar, suspender ou descontinuar, temporária ou permanentemente, 
              o serviço ou qualquer parte dele, a qualquer momento e sem aviso prévio.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-primary flex items-center">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">11</span>
              Alterações aos Termos
            </h2>
            <p className="mb-4 leading-relaxed opacity-90">
              Podemos modificar estes Termos de Serviço a qualquer momento. As alterações entrarão em vigor 
              imediatamente após serem publicadas no site. Ao continuar a usar o serviço após as alterações, 
              você aceita os termos modificados.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-primary flex items-center">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">12</span>
              Lei Aplicável
            </h2>
            <p className="mb-4 leading-relaxed opacity-90">
              Estes termos serão regidos e interpretados de acordo com as leis brasileiras, 
              independentemente de conflitos de disposições legais.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-primary flex items-center">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">13</span>
              Contato
            </h2>
            <p className="mb-4 leading-relaxed opacity-90">
              Se você tiver dúvidas sobre estes Termos de Serviço, entre em contato conosco através 
              do e-mail: <strong>creatixpy@gmail.com</strong>
            </p>
            <p className="mb-4 leading-relaxed opacity-90">
              <strong>Suporte:</strong> creatixpy@gmail.com<br/>
              <strong>Tempo de resposta:</strong> Até 48 horas
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
