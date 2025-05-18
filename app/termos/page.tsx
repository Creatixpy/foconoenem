import Header from "../components/Header";
import Footer from "../components/Footer";
import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow container mx-auto p-4 md:p-8">
        <section className="card p-6 md:p-8 mb-8 border border-border-color">
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-6">
            Termos de Serviço
          </h1>

          <div className="prose max-w-none text-foreground">
            <p className="mb-4">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">1. Aceitação dos Termos</h2>
            <p className="mb-4">
              Ao acessar ou usar o Foco no ENEM, você concorda em cumprir e estar vinculado a estes Termos de Serviço.
              Se você não concordar com qualquer parte destes termos, não poderá acessar ou utilizar nosso serviço.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">2. Descrição do Serviço</h2>
            <p className="mb-4">
              O Foco no ENEM oferece um simulado de redação com correção por inteligência artificial, 
              seguindo os critérios de avaliação do Exame Nacional do Ensino Médio (ENEM). 
              Nosso serviço permite que estudantes pratiquem suas habilidades de redação e recebam feedback detalhado.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">3. Cadastro e Responsabilidades</h2>
            <p className="mb-4">
              Atualmente, não exigimos cadastro para uso do serviço. No entanto, você é responsável por:
            </p>
            <ul className="list-disc ml-6 mb-4">
              <li>Fornecer informações precisas e verdadeiras em suas redações</li>
              <li>Manter a confidencialidade de quaisquer dados relacionados à sua utilização do serviço</li>
              <li>Usar o serviço de forma responsável e ética</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3">4. Horário de Funcionamento</h2>
            <p className="mb-4">
              O serviço de simulado de redação está disponível apenas entre 7h e 22h (horário de Brasília).
              Fora deste período, você poderá navegar pelo site, mas não conseguirá submeter redações para correção.
              Esta limitação existe para gerenciar os recursos de IA e garantir um serviço de qualidade.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">5. Restrições de Uso</h2>
            <p className="mb-4">
              Ao usar nosso serviço, você concorda em não:
            </p>
            <ul className="list-disc ml-6 mb-4">
              <li>Enviar conteúdo ofensivo, difamatório, pornográfico ou ilegal</li>
              <li>Utilizar o serviço para plagiar ou fraudar trabalhos acadêmicos</li>
              <li>Tentar acessar, modificar ou interferir nos sistemas do site</li>
              <li>Usar o serviço de maneira que possa sobrecarregar ou prejudicar a infraestrutura</li>
              <li>Compartilhar conteúdo que viole direitos autorais ou propriedade intelectual</li>
              <li>Utilizar ferramentas automatizadas ou bots para acessar o serviço</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3">6. Propriedade Intelectual</h2>
            <p className="mb-4">
              O conteúdo disponibilizado em nosso site, incluindo textos, gráficos, logotipos, imagens e software, 
              é de nossa propriedade ou de nossos licenciadores e é protegido por leis de direitos autorais.
            </p>
            <p className="mb-4">
              Você mantém todos os direitos sobre as redações que envia para correção. No entanto, ao usar nosso serviço, 
              você nos concede uma licença limitada para processar e armazenar temporariamente seu texto 
              com a finalidade de fornecer feedback.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">7. Limitação de Garantias</h2>
            <p className="mb-4">
              Nosso serviço é fornecido "como está" e "conforme disponível", sem garantias de qualquer tipo, 
              expressas ou implícitas. Não garantimos que:
            </p>
            <ul className="list-disc ml-6 mb-4">
              <li>O serviço atenderá às suas necessidades específicas</li>
              <li>O serviço será ininterrupto, pontual, seguro ou livre de erros</li>
              <li>Os resultados da correção serão precisos ou confiáveis</li>
              <li>A qualidade do serviço atenderá às suas expectativas</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3">8. Limitação de Responsabilidade</h2>
            <p className="mb-4">
              Em nenhuma circunstância seremos responsáveis por danos diretos, indiretos, incidentais, 
              especiais, consequenciais ou punitivos resultantes do uso ou incapacidade de usar nosso serviço.
            </p>
            <p className="mb-4">
              O serviço de correção por IA é fornecido como ferramenta educacional e de prática, 
              e não substitui a avaliação humana em contextos oficiais. Não nos responsabilizamos por 
              decisões tomadas com base no feedback fornecido.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">9. Modificações ao Serviço</h2>
            <p className="mb-4">
              Reservamo-nos o direito de modificar, suspender ou descontinuar, temporária ou permanentemente, 
              o serviço ou qualquer parte dele, a qualquer momento e sem aviso prévio.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">10. Alterações aos Termos</h2>
            <p className="mb-4">
              Podemos modificar estes Termos de Serviço a qualquer momento. As alterações entrarão em vigor 
              imediatamente após serem publicadas no site. Ao continuar a usar o serviço após as alterações, 
              você aceita os termos modificados.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">11. Lei Aplicável</h2>
            <p className="mb-4">
              Estes termos serão regidos e interpretados de acordo com as leis brasileiras, 
              independentemente de conflitos de disposições legais.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">12. Contato</h2>
            <p className="mb-4">
              Se você tiver dúvidas sobre estes Termos de Serviço, entre em contato conosco através 
              do e-mail: [creatixpy@gmail.com].
            </p>
          </div>

          <div className="mt-8 flex justify-center">
            <Link href="/" className="btn btn-primary">
              Voltar para a página inicial
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
