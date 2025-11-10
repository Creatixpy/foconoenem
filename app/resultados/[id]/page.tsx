import ResultadosPageClient from './ResultadosPageClient';

type ResultadosPageProps = {
  params: { id: string };
};

export default function ResultadosPage({ params }: ResultadosPageProps) {
  return <ResultadosPageClient essayId={params.id} />;
}
