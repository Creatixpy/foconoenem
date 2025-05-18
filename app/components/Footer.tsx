export default function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-800 p-6 text-center">
      <div className="container mx-auto">
        <p className="text-gray-600 dark:text-gray-300">
          © {new Date().getFullYear()} Foco no ENEM - Todos os direitos reservados
        </p>
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Ferramenta de auxílio para estudantes | Não é um site oficial do ENEM ou INEP
        </div>
      </div>
    </footer>
  );
}
