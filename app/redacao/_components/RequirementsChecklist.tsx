import { MAX_WORDS, MIN_WORDS } from '@/lib/contracts/essay-input';
import { themeRequirementState, wordRequirementState, type RequirementState } from '../essay-presentation';
import { CheckIcon, XIcon } from './icons';

export default function RequirementsChecklist({ hasTheme, wordCount, manualTheme, themeValidation }: {
  hasTheme: boolean; wordCount: number; manualTheme: string; themeValidation: string;
}) {
  const items: { label: string; state: RequirementState }[] = [
    { label: 'Tema válido selecionado', state: themeRequirementState(hasTheme, manualTheme, themeValidation) },
    { label: `Mínimo ${MIN_WORDS} palavras`, state: wordRequirementState(wordCount) === 'pending' ? 'pending' : 'met' },
    { label: `Máximo ${MAX_WORDS} palavras`, state: wordCount <= MAX_WORDS ? 'met' : 'violated' },
  ];
  return <ul className="space-y-2.5" aria-label="Requisitos para correção">
    {items.map(({ label, state }) => <li key={label} className="flex items-center gap-2.5 text-sm text-[var(--text-2)]">
      <span aria-hidden="true" className={`shrink-0 ${state === 'met' ? 'text-[var(--success)]' : state === 'violated' ? 'text-[var(--danger)]' : 'text-[var(--text-3)]'}`}>
        {state === 'met' ? <CheckIcon /> : state === 'violated' ? <XIcon /> : <span className="block h-3.5 w-3.5 rounded-full border border-current" />}
      </span>
      <span>{label}<span className="sr-only">: {state === 'met' ? 'cumprido' : state === 'violated' ? 'violado' : 'pendente'}</span></span>
    </li>)}
  </ul>;
}
