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
            <h3 className="text-xl font-semibold mt-6 mb-3 text-accent">2.1 Informações fornecidas por você</h3>
            <p className="mb-4 leading-relaxed opacity-90">
              Ao utilizar nosso serviço, você pode nos fornecer:
            </p>
            <ul className="list-disc ml-8 mb-6 space-y-2 opacity-90">
              <li>Conteúdo de redações que você escreve</li>
              <li>Temas personalizados e textos de apoio, quando você opta por criá-los</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3 text-accent">2.2 Informações coletadas automaticamente</h3>
            <p className="mb-4 leading-relaxed opacity-90">
              Quando você acessa nosso site, podemos coletar automaticamente:
            </p>
            <ul className="list-disc ml-8 mb-6 space-y-2 opacity-90">
              <li>Dados técnicos como endereço IP, tipo e versão do navegador</li>
              <li>Informações sobre sua visita, incluindo as páginas que você visita</li>
              <li>Identificadores únicos armazenados em cookies</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-primary flex items-center">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">3</span>
              Como Usamos Suas Informações
            </h2>
            <p className="mb-4 leading-relaxed opacity-90">
              Utilizamos suas informações para:
            </p>
            <ul className="list-disc ml-8 mb-6 space-y-2 opacity-90">
              <li>Fornecer e melhorar nosso serviço de correção de redações</li>
              <li>Personalizar sua experiência no site</li>
              <li>Analisar como nosso site é utilizado para aprimoramento</li>
              <li>Desenvolver novos recursos e funcionalidades</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-primary flex items-center">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">4</span>
              Armazenamento de Dados
            </h2>
            <p className="mb-4 leading-relaxed opacity-90">
              Todas as redações e suas correções ficam armazenadas temporariamente no navegador local do 
              usuário (localStorage). Não mantemos um banco de dados persistente com suas redações, e elas 
              são automaticamente excluídas quando você limpa o cache do navegador.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-primary flex items-center">
              <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 text-lg">5</span>
              Tecnologias de Inteligência Artificial
            </h2>
            <p className="mb-4 leading-relaxed opacity-90">
              Nossos serviços utilizam modelos de inteligência artificial (IA) para correção das redações. 
              Os dados processados por estes modelos são enviados a provedores terceirizados de IA, sempre 
              respeitando as melhores práticas de privacidade.
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
              Seus Direitos
            </h2>
            <p className="mb-4 leading-relaxed opacity-90">
              De acordo com a Lei Geral de Proteção de Dados (LGPD) e outras leis aplicáveis, você tem o direito de:
            </p>
            <ul className="list-disc ml-8 mb-6 space-y-2 opacity-90">
              <li>Acessar os dados pessoais que mantemos sobre você</li>
              <li>Solicitar a exclusão de seus dados</li>
              <li>Corrigir informações imprecisas</li>
              <li>Retirar consentimento para processamento de dados</li>
            </ul>

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
              Contato
            </h2>
            <p className="mb-4 leading-relaxed opacity-90">
              Se você tiver dúvidas ou preocupações sobre esta Política de Privacidade, entre em contato 
              conosco através do e-mail: [creatixpy@gmail.com].
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
