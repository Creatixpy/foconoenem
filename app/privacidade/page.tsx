import Header from "../components/Header";
import Footer from "../components/Footer";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow container mx-auto p-4 md:p-8">
        <section className="card p-6 md:p-8 mb-8 border border-border-color">
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-6">
            Política de Privacidade
          </h1>

          <div className="prose max-w-none text-foreground">
            <p className="mb-4">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">1. Introdução</h2>
            <p className="mb-4">
              O Foco no ENEM ("nós", "nosso" ou "site") está comprometido em proteger sua privacidade. 
              Esta Política de Privacidade explica como coletamos, usamos e protegemos suas informações 
              quando você utiliza nosso serviço de simulado de redação do ENEM.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">2. Informações que Coletamos</h2>
            <h3 className="text-lg font-medium mt-4 mb-2">2.1 Informações fornecidas por você</h3>
            <p className="mb-4">
              Ao utilizar nosso serviço, você pode nos fornecer:
            </p>
            <ul className="list-disc ml-6 mb-4">
              <li>Conteúdo de redações que você escreve</li>
              <li>Temas personalizados e textos de apoio, quando você opta por criá-los</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">2.2 Informações coletadas automaticamente</h3>
            <p className="mb-4">
              Quando você acessa nosso site, podemos coletar automaticamente:
            </p>
            <ul className="list-disc ml-6 mb-4">
              <li>Dados técnicos como endereço IP, tipo e versão do navegador</li>
              <li>Informações sobre sua visita, incluindo as páginas que você visita</li>
              <li>Identificadores únicos armazenados em cookies</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3">3. Como Usamos Suas Informações</h2>
            <p className="mb-4">
              Utilizamos suas informações para:
            </p>
            <ul className="list-disc ml-6 mb-4">
              <li>Fornecer e melhorar nosso serviço de correção de redações</li>
              <li>Personalizar sua experiência no site</li>
              <li>Analisar como nosso site é utilizado para aprimoramento</li>
              <li>Desenvolver novos recursos e funcionalidades</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3">4. Armazenamento de Dados</h2>
            <p className="mb-4">
              Todas as redações e suas correções ficam armazenadas temporariamente no navegador local do 
              usuário (localStorage). Não mantemos um banco de dados persistente com suas redações, e elas 
              são automaticamente excluídas quando você limpa o cache do navegador.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">5. Tecnologias de Inteligência Artificial</h2>
            <p className="mb-4">
              Nossos serviços utilizam modelos de inteligência artificial (IA) para correção das redações. 
              Os dados processados por estes modelos são enviados a provedores terceirizados de IA, sempre 
              respeitando as melhores práticas de privacidade.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">6. Compartilhamento de Informações</h2>
            <p className="mb-4">
              Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, exceto:
            </p>
            <ul className="list-disc ml-6 mb-4">
              <li>Com provedores de IA para processamento de redações</li>
              <li>Caso seja exigido por lei</li>
              <li>Para proteger nossos direitos e propriedade</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3">7. Seus Direitos</h2>
            <p className="mb-4">
              De acordo com a Lei Geral de Proteção de Dados (LGPD) e outras leis aplicáveis, você tem o direito de:
            </p>
            <ul className="list-disc ml-6 mb-4">
              <li>Acessar os dados pessoais que mantemos sobre você</li>
              <li>Solicitar a exclusão de seus dados</li>
              <li>Corrigir informações imprecisas</li>
              <li>Retirar consentimento para processamento de dados</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3">8. Segurança</h2>
            <p className="mb-4">
              Implementamos medidas técnicas e organizacionais para proteger suas informações contra acesso 
              não autorizado, perda ou alteração. No entanto, nenhuma transmissão de dados pela internet ou 
              sistema de armazenamento é 100% seguro.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">9. Alterações nesta Política</h2>
            <p className="mb-4">
              Podemos atualizar esta Política de Privacidade periodicamente. Recomendamos que você revise 
              esta página regularmente para ficar informado sobre quaisquer alterações.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">10. Contato</h2>
            <p className="mb-4">
              Se você tiver dúvidas ou preocupações sobre esta Política de Privacidade, entre em contato 
              conosco através do e-mail: [inserir e-mail de contato].
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
