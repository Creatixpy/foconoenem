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
              O Foco no ENEM oferece um simulado de redação com correção por inteligência artificial, 
              seguindo os critérios de avaliação do Exame Nacional do Ensino Médio (ENEM). 
              Nosso serviço permite que estudantes pratiquem suas habilidades de redação e recebam feedback detalhado.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-primary flex items-center">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">3</span>
              Cadastro e Responsabilidades
            </h2>
            <p className="mb-4 leading-relaxed opacity-90">
              Atualmente, não exigimos cadastro para uso do serviço. No entanto, você é responsável por:
            </p>
            <ul className="list-disc ml-8 mb-6 space-y-2 opacity-90">
              <li>Fornecer informações precisas e verdadeiras em suas redações</li>
              <li>Manter a confidencialidade de quaisquer dados relacionados à sua utilização do serviço</li>
              <li>Usar o serviço de forma responsável e ética</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-primary flex items-center">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">4</span>
              Horário de Funcionamento
            </h2>
            <p className="mb-4 leading-relaxed opacity-90">
              O serviço de simulado de redação está disponível apenas entre 7h e 22h (horário de Brasília).
              Fora deste período, você poderá navegar pelo site, mas não conseguirá submeter redações para correção.
              Esta limitação existe para gerenciar os recursos de IA e garantir um serviço de qualidade.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-primary flex items-center">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">5</span>
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
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">6</span>
              Propriedade Intelectual
            </h2>
            <p className="mb-4 leading-relaxed opacity-90">
              O conteúdo disponibilizado em nosso site, incluindo textos, gráficos, logotipos, imagens e software, 
              é de nossa propriedade ou de nossos licenciadores e é protegido por leis de direitos autorais.
            </p>
            <p className="mb-4 leading-relaxed opacity-90">
              Você mantém todos os direitos sobre as redações que envia para correção. No entanto, ao usar nosso serviço, 
              você nos concede uma licença limitada para processar e armazenar temporariamente seu texto 
              com a finalidade de fornecer feedback.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-primary flex items-center">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">7</span>
              Limitação de Garantias
            </h2>
            <p className="mb-4 leading-relaxed opacity-90">
              Nosso serviço é fornecido "como está" e "conforme disponível", sem garantias de qualquer tipo, 
              expressas ou implícitas. Não garantimos que:
            </p>
            <ul className="list-disc ml-8 mb-6 space-y-2 opacity-90">
              <li>O serviço atenderá às suas necessidades específicas</li>
              <li>O serviço será ininterrupto, pontual, seguro ou livre de erros</li>
              <li>Os resultados da correção serão precisos ou confiáveis</li>
              <li>A qualidade do serviço atenderá às suas expectativas</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-primary flex items-center">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">8</span>
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
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">9</span>
              Modificações ao Serviço
            </h2>
            <p className="mb-4 leading-relaxed opacity-90">
              Reservamo-nos o direito de modificar, suspender ou descontinuar, temporária ou permanentemente, 
              o serviço ou qualquer parte dele, a qualquer momento e sem aviso prévio.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-primary flex items-center">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">10</span>
              Alterações aos Termos
            </h2>
            <p className="mb-4 leading-relaxed opacity-90">
              Podemos modificar estes Termos de Serviço a qualquer momento. As alterações entrarão em vigor 
              imediatamente após serem publicadas no site. Ao continuar a usar o serviço após as alterações, 
              você aceita os termos modificados.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-primary flex items-center">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">11</span>
              Lei Aplicável
            </h2>
            <p className="mb-4 leading-relaxed opacity-90">
              Estes termos serão regidos e interpretados de acordo com as leis brasileiras, 
              independentemente de conflitos de disposições legais.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-primary flex items-center">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">12</span>
              Contato
            </h2>
            <p className="mb-4 leading-relaxed opacity-90">
              Se você tiver dúvidas sobre estes Termos de Serviço, entre em contato conosco através 
              do e-mail: [creatixpy@gmail.com].
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
