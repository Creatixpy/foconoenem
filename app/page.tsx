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
            Simulados para o ENEM
          </h2>
          <p className="text-lg mb-8 max-w-3xl">
            Pratique para o ENEM com nossos simulados de redação e questões de
            múltipla escolha. Receba feedback detalhado com análise baseada em
            inteligência artificial e nos critérios oficiais do exame.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/redacao"
              className="btn btn-primary group"
            >
              Simulado de Redação
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
            <Link
              href="/questoes"
              className="btn btn-outline group"
            >
              Simulado de Questões
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
        </section>

        <section className="grid md:grid-cols-3 gap-8 mb-12 animate-stagger">
          <div className="card p-6 card-interactive border border-border-color">
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
            <p>
              Escolha entre o tema padrão, gere um tema automaticamente com nossa
              IA, ou defina seu próprio tema personalizado para praticar.
            </p>
          </div>
          <div className="card p-6 card-interactive border border-border-color">
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
              Critérios Oficiais
            </h3>
            <p>
              Sua redação será avaliada nos mesmos 5 critérios do ENEM, com
              pontuação de 0 a 1000 e feedback detalhado para cada competência.
            </p>
          </div>
          <div className="card p-6 card-interactive border border-border-color">
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
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-primary">
              Simulado de Questões
            </h3>
            <p>
              Teste seus conhecimentos com questões de múltipla escolha em
              Matemática, Português, Química, Física e Geografia, geradas por IA
              no estilo ENEM.
            </p>
          </div>
        </section>

        <section
          className="card p-8 border border-border-color animate-fadeIn"
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
            Como Funciona
          </h2>
          <ol className="space-y-6">
            <li className="flex items-start">
              <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary-light text-primary-dark font-bold mr-3">
                1
              </span>
              <div>
                <h3 className="font-semibold text-lg">Escolha seu simulado</h3>
                <p className="text-foreground dark:text-gray-200 topic-description">
                  Decida entre fazer um simulado de redação dissertativa ou um
                  conjunto de questões de múltipla escolha com conteúdos de
                  Matemática, Português, Química, Física e Geografia.
                </p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary-light text-primary-dark font-bold mr-3">
                2
              </span>
              <div>
                <h3 className="font-semibold text-lg">Pratique com qualidade</h3>
                <p className="text-foreground dark:text-gray-200 topic-description">
                  Resolva questões ou escreva sua redação seguindo as mesmas
                  regras do ENEM, em um ambiente que simula a experiência do
                  exame.
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
                  Envie sua redação ou suas respostas para análise pela nossa
                  inteligência artificial especializada em avaliação educacional.
                </p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary-light text-primary-dark font-bold mr-3">
                4
              </span>
              <div>
                <h3 className="font-semibold text-lg">Receba feedback detalhado</h3>
                <p className="text-foreground dark:text-gray-200 topic-description">
                  Em poucos segundos, receba sua nota com explicações para cada
                  resposta e recomendações personalizadas para melhorar seu
                  desempenho no ENEM.
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
