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
            Pratique com nossos simulados e receba feedback detalhado com
            análise baseada em inteligência artificial e nos critérios oficiais do
            exame.
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
              className="btn btn-outline group hover:bg-primary hover:text-white"
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
              Redação Dissertativa
            </h3>
            <p>
              Pratique sua redação com temas variados, receba feedback detalhado
              e melhore sua pontuação nas cinco competências avaliadas no ENEM.
            </p>
            <div className="mt-4">
              <Link href="/redacao" className="text-primary hover:underline flex items-center">
                Iniciar simulado
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
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
                  d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-primary">
              Questões de Múltipla Escolha
            </h3>
            <p>
              Teste seus conhecimentos com questões de Matemática, Português, Química, 
              Física e Geografia, recebendo correção automática e explicações.
            </p>
            <div className="mt-4">
              <Link href="/questoes" className="text-primary hover:underline flex items-center">
                Iniciar simulado
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
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
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-primary">
              Notícias do ENEM
            </h3>
            <p>
              Fique por dentro das últimas novidades, datas importantes, e conteúdos
              relacionados ao ENEM e ao mundo educacional.
            </p>
            <div className="mt-4">
              <Link href="/noticias" className="text-primary hover:underline flex items-center">
                Ver notícias
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
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
                <h3 className="font-semibold text-lg">Escolha um simulado</h3>
                <p className="text-foreground dark:text-gray-200 topic-description">
                  Acesse o simulado de redação para praticar sua escrita dissertativa ou o simulado de questões 
                  para testar seus conhecimentos em diversas disciplinas.
                </p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary-light text-primary-dark font-bold mr-3">
                2
              </span>
              <div>
                <h3 className="font-semibold text-lg">Realize o simulado</h3>
                <p className="text-foreground dark:text-gray-200 topic-description">
                  Escreva sua redação dissertativa-argumentativa ou responda às questões de múltipla escolha 
                  de acordo com as instruções fornecidas.
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
                  Quando finalizar, envie seu simulado para análise pela nossa inteligência artificial.
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
                  Em poucos segundos, receba sua nota, feedback detalhado e explicações para entender 
                  seu desempenho e como melhorar.
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
