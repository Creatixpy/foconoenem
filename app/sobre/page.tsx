import Header from "../components/Header";
import Footer from "../components/Footer";
import Link from "next/link";

export const metadata = {
  title: "Sobre - Foco no ENEM",
  description: "Conheça a história e missão do Foco no ENEM, uma plataforma criada por alunos para ajudar estudantes a se prepararem para o ENEM.",
};

export default function SobrePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted-bg">
      <Header />

      <main className="flex-grow container mx-auto p-4 md:p-8 max-w-5xl">
        {/* Hero Section */}
        <div className="card card-gradient p-8 md:p-12 mb-8 text-center animate-fadeIn">
          <div className="inline-block p-4 bg-primary/10 rounded-full mb-6">
            <svg
              className="w-16 h-16 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            Sobre o Foco no ENEM
          </h1>
          
          <p className="text-xl text-foreground opacity-90 max-w-3xl mx-auto">
            💙 <strong>Criado por alunos, para alunos</strong>
          </p>
        </div>

        {/* Nossa História */}
        <div className="card card-gradient p-8 md:p-10 mb-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <span className="text-4xl">📖</span>
            Nossa História
          </h2>
          
          <div className="space-y-4 text-foreground opacity-90 leading-relaxed">
            <p className="text-lg">
              O <strong>Foco no ENEM</strong> nasceu da vontade de democratizar o acesso à educação 
              de qualidade para todos os estudantes que sonham em conquistar uma vaga no ensino superior.
            </p>
            
            <p className="text-lg">
              Desenvolvido por estudantes que passaram pelas mesmas dificuldades e desafios da 
              preparação para o ENEM, nossa plataforma foi criada com um objetivo claro: 
              <strong> tornar o estudo mais acessível, eficiente e personalizado</strong>.
            </p>
            
            <p className="text-lg">
              Sabemos que estudar para o ENEM pode ser desafiador, especialmente quando os recursos 
              são limitados. Por isso, oferecemos ferramentas gratuitas de alta qualidade, incluindo 
              correção de redações com inteligência artificial e simulados personalizados.
            </p>
          </div>
        </div>

        {/* Nossa Missão */}
        <div className="card card-gradient p-8 md:p-10 mb-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <span className="text-4xl">🎯</span>
            Nossa Missão
          </h2>
          
          <div className="space-y-4 text-foreground opacity-90 leading-relaxed">
            <p className="text-lg">
              Nossa missão é <strong>empoderar estudantes de todo o Brasil</strong> com ferramentas 
              modernas e acessíveis para a preparação do ENEM, eliminando barreiras financeiras e 
              geográficas que impedem tantos jovens de alcançarem seus objetivos educacionais.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mt-6">
              <div className="bg-muted-bg/50 p-6 rounded-lg">
                <div className="text-3xl mb-3">🆓</div>
                <h3 className="font-semibold mb-2 text-lg">100% Gratuito</h3>
                <p className="text-sm opacity-80">
                  Acreditamos que educação de qualidade deve ser acessível a todos
                </p>
              </div>
              
              <div className="bg-muted-bg/50 p-6 rounded-lg">
                <div className="text-3xl mb-3">🤖</div>
                <h3 className="font-semibold mb-2 text-lg">Tecnologia IA</h3>
                <p className="text-sm opacity-80">
                  Utilizamos inteligência artificial para correções e feedbacks personalizados
                </p>
              </div>
              
              <div className="bg-muted-bg/50 p-6 rounded-lg">
                <div className="text-3xl mb-3">💪</div>
                <h3 className="font-semibold mb-2 text-lg">Feito por Alunos</h3>
                <p className="text-sm opacity-80">
                  Entendemos suas dificuldades porque já passamos por elas
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* O que oferecemos */}
        <div className="card card-gradient p-8 md:p-10 mb-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <span className="text-4xl">✨</span>
            O que Oferecemos
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-l-4 border-primary pl-6 py-4">
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <span>✍️</span> Correção de Redações
              </h3>
              <p className="text-foreground opacity-80">
                Receba feedback detalhado sobre sua redação seguindo as 5 competências do ENEM, 
                com sugestões de melhoria e pontuação estimada.
              </p>
            </div>
            
            <div className="border-l-4 border-primary pl-6 py-4">
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <span>📝</span> Simulados Personalizados
              </h3>
              <p className="text-foreground opacity-80">
                Pratique com questões que seguem o padrão ENEM, receba análise de desempenho 
                e identifique seus pontos fortes e fracos.
              </p>
            </div>
            
            <div className="border-l-4 border-primary pl-6 py-4">
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <span>📰</span> Notícias e Atualidades
              </h3>
              <p className="text-foreground opacity-80">
                Mantenha-se atualizado com as principais notícias relevantes para a redação 
                e questões de atualidades do ENEM.
              </p>
            </div>
            
            <div className="border-l-4 border-primary pl-6 py-4">
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <span>🎲</span> Temas Aleatórios
              </h3>
              <p className="text-foreground opacity-80">
                Pratique redação com temas gerados por IA que seguem o perfil das propostas 
                oficiais do ENEM.
              </p>
            </div>
          </div>
        </div>

        {/* Nossos Valores */}
        <div className="card card-gradient p-8 md:p-10 mb-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <span className="text-4xl">💎</span>
            Nossos Valores
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2 text-primary">🌟 Acessibilidade</h3>
              <p className="text-foreground opacity-80">
                Mantemos nossa plataforma gratuita e acessível para que todos possam estudar, 
                independentemente de sua situação financeira.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2 text-primary">🔒 Privacidade</h3>
              <p className="text-foreground opacity-80">
                Respeitamos sua privacidade e protegemos seus dados. Não compartilhamos suas 
                informações pessoais com terceiros.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2 text-primary">🚀 Inovação</h3>
              <p className="text-foreground opacity-80">
                Estamos sempre buscando novas tecnologias e métodos para melhorar a experiência 
                de estudo dos nossos usuários.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2 text-primary">🤝 Comunidade</h3>
              <p className="text-foreground opacity-80">
                Acreditamos no poder da comunidade estudantil e incentivamos a colaboração e 
                o apoio mútuo entre os estudantes.
              </p>
            </div>
          </div>
        </div>

        {/* Apoie o Projeto */}
        <div className="card card-gradient p-8 md:p-10 mb-8 text-center bg-gradient-to-r from-primary/10 to-primary/5">
          <h2 className="text-3xl font-bold text-primary mb-4">
            ❤️ Apoie o Projeto
          </h2>
          
          <p className="text-lg text-foreground opacity-90 mb-6 max-w-2xl mx-auto">
            O Foco no ENEM é mantido por doações de pessoas que acreditam na democratização 
            da educação. Sua contribuição nos ajuda a manter os servidores, APIs de IA e 
            desenvolver novas funcionalidades.
          </p>
          
          <Link
            href="/doacao"
            className="btn btn-primary btn-lg inline-flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            Fazer uma Doação
          </Link>
        </div>

        {/* Agradecimentos */}
        <div className="card card-gradient p-8 md:p-10 mb-8 text-center">
          <h2 className="text-3xl font-bold text-primary mb-4">
            🙏 Agradecimentos
          </h2>
          
          <p className="text-lg text-foreground opacity-90 max-w-2xl mx-auto">
            Agradecemos a todos os estudantes que utilizam nossa plataforma, aos apoiadores 
            que tornam este projeto possível, e a toda comunidade que nos motiva a continuar 
            crescendo e melhorando a cada dia.
          </p>
          
          <div className="mt-8 text-2xl">
            💙 Juntos, rumo à aprovação! 🎓
          </div>
        </div>

        {/* Link de volta */}
        <div className="text-center mb-8">
          <Link href="/" className="text-primary hover:underline inline-flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Voltar para a página inicial
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
