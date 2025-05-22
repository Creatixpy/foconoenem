import Link from "next/link";
import Header from "./components/Header";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow container mx-auto p-4 md:p-8">
        <section className="card p-8 mb-12 relative overflow-hidden animate-fadeIn">
          <div className="absolute top-0 right-0 w-64 h-64 opacity-10 pointer-events-none">
            <svg
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold text-primary mb-4">
            Prepare-se para o ENEM
          </h2>
          <p className="text-lg mb-8 max-w-3xl">
            Escolha entre o simulado de redação para receber feedback detalhado
            ou o simulado de questões objetivas para testar seus conhecimentos
            nas diversas disciplinas do ENEM.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="card border border-border-color p-6 hover:shadow-lg transition-all">
              <div className="text-primary mb-4">
                <svg
                  className="w-10 h-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Simulado de Redação
              </h3>
              <p className="mb-6 text-foreground">
                Escreva sua redação dissertativa e receba uma correção detalhada
                com nota e feedback para cada competência avaliada no ENEM.
              </p>
              <Link
                href="/redacao"
                className="btn btn-primary mt-auto group w-full md:w-auto justify-center"
              >
                Praticar Redação
                <svg
                  className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
            </div>

            <div className="card border border-border-color p-6 hover:shadow-lg transition-all">
              <div className="text-primary mb-4">
                <svg
                  className="w-10 h-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Simulado de Questões
              </h3>
              <p className="mb-6 text-foreground">
                Teste seus conhecimentos com questões objetivas de Matemática,
                Português, Química, Física e Geografia para se preparar para o
                exame.
              </p>
              <Link
                href="/questoes"
                className="btn bg-primary-light text-primary hover:bg-primary hover:text-white border border-primary mt-auto group w-full md:w-auto justify-center"
              >
                Resolver Questões
                <svg
                  className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-8 mb-12 animate-stagger">
          <div className="card p-6 border border-border-color shadow-sm hover:shadow-md transition-all duration-300">
            <div className="text-primary mb-4">
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-primary">
              Temas Variados
            </h3>
            <p className="text-foreground">
              Escolha entre o tema padrão, gere um tema automaticamente com nossa
              IA, ou defina seu próprio tema personalizado para praticar suas
              redações.
            </p>
          </div>
          <div className="card p-6 border border-border-color shadow-sm hover:shadow-md transition-all duration-300">
            <div className="text-primary mb-4">
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-primary">
              Múltiplas Disciplinas
            </h3>
            <p className="text-foreground">
              Pratique com questões objetivas de cinco disciplinas fundamentais:
              Matemática, Português, Química, Física e Geografia, cobrindo os
              principais conteúdos do ENEM.
            </p>
          </div>
          <div className="card p-6 border border-border-color shadow-sm hover:shadow-md transition-all duration-300">
            <div className="text-primary mb-4">
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-primary">
              Feedback Inteligente
            </h3>
            <p className="text-foreground">
              Receba análise completa sobre sua redação e entenda por que errou ou
              acertou cada questão objetiva com explicações detalhadas geradas por
              IA.
            </p>
          </div>
        </section>

        <section
          className="card p-8 border border-border-color animate-fadeIn mb-12"
          style={{ animationDelay: "0.3s" }}
        >
          <h2 className="text-2xl font-bold text-primary mb-6 flex items-center">
            <svg
              className="w-6 h-6 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Como Funciona o Simulado de Redação
          </h2>
          <ol className="space-y-6">
            <li className="flex items-start">
              <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary-light text-primary-dark font-bold mr-3">
                1
              </span>
              <div>
                <h3 className="font-semibold text-lg">Escolha um tema</h3>
                <p className="text-foreground dark:text-gray-200 topic-description">
                  Acesse a página do simulado e escolha entre usar o tema padrão,
                  gerar um tema automaticamente com IA, ou definir seu próprio tema
                  personalizado.
                </p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary-light text-primary-dark font-bold mr-3">
                2
              </span>
              <div>
                <h3 className="font-semibold text-lg">Escreva sua redação</h3>
                <p className="text-foreground dark:text-gray-200 topic-description">
                  Escreva sua redação dissertativa-argumentativa com no mínimo 7 e
                  no máximo 30 linhas, seguindo as mesmas regras do ENEM.
                </p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary-light text-primary-dark font-bold mr-3">
                3
              </span>
              <div>
                <h3 className="font-semibold text-lg">Submeta para correção</h3>
                <p className="text-foreground dark:text-gray-200 topic-description">
                  Quando finalizar, clique em "Concluir Redação" para enviar seu
                  texto para análise pela nossa inteligência artificial.
                </p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary-light text-primary-dark font-bold mr-3">
                4
              </span>
              <div>
                <h3 className="font-semibold text-lg">Receba seu resultado</h3>
                <p className="text-foreground dark:text-gray-200 topic-description">
                  Em poucos segundos, receba sua nota e feedback detalhado para
                  entender como melhorar em cada uma das cinco competências
                  avaliadas no ENEM.
                </p>
              </div>
            </li>
          </ol>
        </section>

        <section
          className="card p-8 border border-border-color animate-fadeIn"
          style={{ animationDelay: "0.5s" }}
        >
          <h2 className="text-2xl font-bold text-primary mb-6 flex items-center">
            <svg
              className="w-6 h-6 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
            Como Funciona o Simulado de Questões
          </h2>
          <ol className="space-y-6">
            <li className="flex items-start">
              <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary-light text-primary-dark font-bold mr-3">
                1
              </span>
              <div>
                <h3 className="font-semibold text-lg">Inicie o simulado</h3>
                <p className="text-foreground dark:text-gray-200 topic-description">
                  Acesse a página de simulado de questões e clique em "Iniciar
                  Simulado" para gerar um conjunto de 10 questões objetivas de
                  múltipla escolha.
                </p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary-light text-primary-dark font-bold mr-3">
                2
              </span>
              <div>
                <h3 className="font-semibold text-lg">Resolva as questões</h3>
                <p className="text-foreground dark:text-gray-200 topic-description">
                  Resolva as questões de múltipla escolha sobre Matemática,
                  Português, Química, Física e Geografia. Escolha uma alternativa
                  para cada questão.
                </p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary-light text-primary-dark font-bold mr-3">
                3
              </span>
              <div>
                <h3 className="font-semibold text-lg">Finalize o simulado</h3>
                <p className="text-foreground dark:text-gray-200 topic-description">
                  Quando terminar de responder todas as questões (ou quantas
                  conseguir), clique em "Finalizar e Ver Resultados" para
                  submeter suas respostas.
                </p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary-light text-primary-dark font-bold mr-3">
                4
              </span>
              <div>
                <h3 className="font-semibold text-lg">Confira seu desempenho</h3>
                <p className="text-foreground dark:text-gray-200 topic-description">
                  Receba imediatamente seu resultado com quantidade de acertos e
                  erros, além de explicações detalhadas para cada questão,
                  mostrando por que cada alternativa está correta ou incorreta.
                </p>
              </div>
            </li>
          </ol>
        </section>
      </main>

      <Footer />
    </div>
  );
}
