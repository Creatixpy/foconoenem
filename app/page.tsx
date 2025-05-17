import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-blue-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Foco no ENEM</h1>
          <nav>
            <ul className="flex space-x-4">
              <li>
                <Link href="/" className="hover:underline">
                  Início
                </Link>
              </li>
              <li>
                <Link href="/redacao" className="hover:underline">
                  Simulado
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-8">
        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-3xl font-bold text-blue-800 mb-4">
            Simulado de Redação do ENEM
          </h2>
          <p className="text-lg mb-6">
            Pratique sua redação para o ENEM e receba feedback detalhado com
            análise baseada nos critérios oficiais.
          </p>
          <Link
            href="/redacao"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-full inline-block transition duration-200"
          >
            Iniciar Simulado
          </Link>
        </section>

        <section className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-3 text-blue-800">
              Tema Atual
            </h3>
            <p>
              "Os desafios da educação digital no Brasil contemporâneo"
            </p>
          </div>
          <div className="bg-blue-50 p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-3 text-blue-800">
              Critérios de Avaliação
            </h3>
            <p>
              Sua redação será avaliada nos mesmos 5 critérios do ENEM, com
              pontuação de 0 a 1000.
            </p>
          </div>
          <div className="bg-blue-50 p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-3 text-blue-800">
              Feedback Detalhado
            </h3>
            <p>
              Receba análise completa sobre pontos fortes e fracos da sua
              redação.
            </p>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-blue-800 mb-4">
            Como Funciona
          </h2>
          <ol className="list-decimal pl-6 space-y-3">
            <li>
              Acesse a página do simulado e leia com atenção o tema proposto e
              os textos de apoio.
            </li>
            <li>
              Escreva sua redação dissertativa-argumentativa com no mínimo 7 e
              no máximo 30 linhas.
            </li>
            <li>
              Quando finalizar, clique em "Concluir Redação" para enviar seu
              texto.
            </li>
            <li>
              Aguarde alguns instantes enquanto nossa tecnologia analisa seu
              texto.
            </li>
            <li>
              Receba sua nota e feedback detalhado para entender como melhorar.
            </li>
          </ol>
        </section>
      </main>

      <footer className="bg-gray-100 p-4 text-center text-gray-600 text-sm">
        <p>© {new Date().getFullYear()} Foco no ENEM - Todos os direitos reservados</p>
      </footer>
    </div>
  );
}
