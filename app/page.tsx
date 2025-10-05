import Link from "next/link";
import Header from "./components/Header";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted-bg">
      <Header />

      <main className="flex-grow container mx-auto p-4 md:p-8 max-w-7xl">
        {/* Hero Section */}
        <section className="card card-gradient p-8 md:p-12 mb-12 relative overflow-hidden animate-fadeIn">
          <div className="absolute top-0 right-0 w-64 h-64 opacity-5 pointer-events-none">
            <svg
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold text-primary mb-4 leading-tight">
              Prepare-se para o ENEM
            </h2>
            <p className="text-lg md:text-xl mb-8 max-w-3xl text-foreground opacity-90">
              Escolha entre o simulado de redação para receber feedback detalhado
              ou o simulado de questões objetivas para testar seus conhecimentos
              nas diversas disciplinas do ENEM.
            </p>

            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              <div className="card card-interactive border-2 border-primary/20 p-6 md:p-8 hover:border-primary/40 transition-all duration-300 bg-gradient-to-br from-card-bg to-muted-bg">
                <div className="text-primary mb-6">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <svg
                      className="w-8 h-8"
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
                </div>
                <h3 className="text-2xl font-bold mb-3 text-foreground">
                  Simulado de Redação
                </h3>
                <p className="mb-6 text-foreground opacity-80 leading-relaxed">
                  Escreva sua redação dissertativa e receba uma correção detalhada
                  com nota e feedback para cada competência avaliada no ENEM.
                </p>
                <Link
                  href="/redacao"
                  className="btn btn-primary mt-auto group w-full justify-center text-base"
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

              <div className="card card-interactive border-2 border-accent/20 p-6 md:p-8 hover:border-accent/40 transition-all duration-300 bg-gradient-to-br from-card-bg to-muted-bg">
                <div className="text-accent mb-6">
                  <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center">
                    <svg
                      className="w-8 h-8"
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
                </div>
                <h3 className="text-2xl font-bold mb-3 text-foreground">
                  Simulado de Questões
                </h3>
                <p className="mb-6 text-foreground opacity-80 leading-relaxed">
                  Teste seus conhecimentos com questões objetivas de Matemática,
                  Português, Química, Física e Geografia para se preparar para o
                  exame.
                </p>
                <Link
                  href="/questoes"
                  className="btn btn-outline mt-auto group w-full justify-center text-base border-accent text-accent hover:bg-accent hover:text-white"
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
          </div>
        </section>

        {/* Features Section */}
        <section className="grid md:grid-cols-3 gap-6 md:gap-8 mb-12 animate-stagger">
          <div className="card card-gradient p-6 md:p-8 border border-border-color hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="text-primary mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <svg
                  className="w-7 h-7"
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
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground">
              Temas Variados
            </h3>
            <p className="text-foreground opacity-80 leading-relaxed">
              Escolha entre o tema padrão, gere um tema automaticamente com nossa
              IA, ou defina seu próprio tema personalizado para praticar suas
              redações.
            </p>
          </div>
          <div className="card card-gradient p-6 md:p-8 border border-border-color hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="text-success mb-4">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                <svg
                  className="w-7 h-7"
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
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground">
              Múltiplas Disciplinas
            </h3>
            <p className="text-foreground opacity-80 leading-relaxed">
              Pratique com questões objetivas de cinco disciplinas fundamentais:
              Matemática, Português, Química, Física e Geografia, cobrindo os
              principais conteúdos do ENEM.
            </p>
          </div>
          <div className="card card-gradient p-6 md:p-8 border border-border-color hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="text-accent mb-4">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                <svg
                  className="w-7 h-7"
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
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground">
              Feedback Inteligente
            </h3>
            <p className="text-foreground opacity-80 leading-relaxed">
              Receba análise completa sobre sua redação e entenda por que errou ou
              acertou cada questão objetiva com explicações detalhadas geradas por
              IA.
            </p>
          </div>
        </section>

        {/* How It Works - Essay Section */}
        <section
          className="card card-gradient p-8 md:p-12 border border-border-color animate-fadeIn mb-12 bg-gradient-to-br from-primary/5 to-accent/5"
          style={{ animationDelay: "0.3s" }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-8 flex items-center">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mr-3">
              <svg
                className="w-6 h-6"
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
            </div>
            Como Funciona o Simulado de Redação
          </h2>
          <ol className="space-y-6">
            <li className="flex items-start group">
              <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-white font-bold mr-4 text-lg shadow-md group-hover:scale-110 transition-transform">
                1
              </span>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2 text-foreground">Escolha um tema</h3>
                <p className="text-foreground opacity-80 leading-relaxed">
                  Acesse a página do simulado e escolha entre usar o tema padrão,
                  gerar um tema automaticamente com IA, ou definir seu próprio tema
                  personalizado.
                </p>
              </div>
            </li>
            <li className="flex items-start group">
              <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-white font-bold mr-4 text-lg shadow-md group-hover:scale-110 transition-transform">
                2
              </span>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2 text-foreground">Escreva sua redação</h3>
                <p className="text-foreground opacity-80 leading-relaxed">
                  Escreva sua redação dissertativa-argumentativa com no mínimo 7 e
                  no máximo 30 linhas, seguindo as mesmas regras do ENEM.
                </p>
              </div>
            </li>
            <li className="flex items-start group">
              <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-white font-bold mr-4 text-lg shadow-md group-hover:scale-110 transition-transform">
                3
              </span>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2 text-foreground">Submeta para correção</h3>
                <p className="text-foreground opacity-80 leading-relaxed">
                  Quando finalizar, clique em &ldquo;Concluir Redação&rdquo; para enviar seu
                  texto para análise pela nossa inteligência artificial.
                </p>
              </div>
            </li>
            <li className="flex items-start group">
              <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-white font-bold mr-4 text-lg shadow-md group-hover:scale-110 transition-transform">
                4
              </span>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2 text-foreground">Receba seu resultado</h3>
                <p className="text-foreground opacity-80 leading-relaxed">
                  Em poucos segundos, receba sua nota e feedback detalhado para
                  entender como melhorar em cada uma das cinco competências
                  avaliadas no ENEM.
                </p>
              </div>
            </li>
          </ol>
        </section>

        {/* How It Works - Questions Section */}
        <section
          className="card card-gradient p-8 md:p-12 border border-border-color animate-fadeIn bg-gradient-to-br from-accent/5 to-success/5"
          style={{ animationDelay: "0.5s" }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-accent mb-8 flex items-center">
            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center mr-3">
              <svg
                className="w-6 h-6"
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
            Como Funciona o Simulado de Questões
          </h2>
          <ol className="space-y-6">
            <li className="flex items-start group">
              <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-accent text-white font-bold mr-4 text-lg shadow-md group-hover:scale-110 transition-transform">
                1
              </span>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2 text-foreground">Inicie o simulado</h3>
                <p className="text-foreground opacity-80 leading-relaxed">
                  Acesse a página de simulado de questões e clique em &ldquo;Iniciar
                  Simulado&rdquo; para gerar um conjunto de 10 questões objetivas de
                  múltipla escolha.
                </p>
              </div>
            </li>
            <li className="flex items-start group">
              <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-accent text-white font-bold mr-4 text-lg shadow-md group-hover:scale-110 transition-transform">
                2
              </span>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2 text-foreground">Resolva as questões</h3>
                <p className="text-foreground opacity-80 leading-relaxed">
                  Resolva as questões de múltipla escolha sobre Matemática,
                  Português, Química, Física e Geografia. Escolha uma alternativa
                  para cada questão.
                </p>
              </div>
            </li>
            <li className="flex items-start group">
              <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-accent text-white font-bold mr-4 text-lg shadow-md group-hover:scale-110 transition-transform">
                3
              </span>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2 text-foreground">Finalize o simulado</h3>
                <p className="text-foreground opacity-80 leading-relaxed">
                  Quando terminar de responder todas as questões (ou quantas
                  conseguir), clique em &ldquo;Finalizar e Ver Resultados&rdquo; para
                  submeter suas respostas.
                </p>
              </div>
            </li>
            <li className="flex items-start group">
              <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-accent text-white font-bold mr-4 text-lg shadow-md group-hover:scale-110 transition-transform">
                4
              </span>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2 text-foreground">Confira seu desempenho</h3>
                <p className="text-foreground opacity-80 leading-relaxed">
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
