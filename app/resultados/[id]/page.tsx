import ResultadosPageClient from './ResultadosPageClient';

type ResultadosPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ResultadosPage({ params }: ResultadosPageProps) {
  const { id } = await params;
  return <ResultadosPageClient essayId={id} />;
}
