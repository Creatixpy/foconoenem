 "use client";
 
 import { useState } from "react";
 import Link from "next/link";
 
 const DONATION_AMOUNTS = [
   { value: 5, label: "R$ 5", description: "Ajuda uma redação corrigida" },
   { value: 10, label: "R$ 10", description: "Mantém a IA disponível por um turno" },
   { value: 25, label: "R$ 25", description: "Paga um dia de servidores e logs" },
   { value: 50, label: "R$ 50", description: "Garante novas features e melhorias" },
   { value: 100, label: "R$ 100", description: "Sustenta o projeto por um mês" },
 ];
 
 const impactItems = [
   {
     icon: "📚",
     title: "Conteúdo 100% gratuito",
     description: "Apoios mantêm as ferramentas abertas para qualquer estudante.",
   },
   {
     icon: "🤖",
     title: "Infraestrutura de IA",
     description: "Pagamos APIs e servidores para correções e simulados inteligentes.",
   },
   {
     icon: "🚀",
     title: "Novas funcionalidades",
     description: "Cada contribuição acelera a entrega de recursos pedidos pela comunidade.",
   },
 ];
 
 export default function DoacaoPage() {
   const [selectedAmount, setSelectedAmount] = useState<number | null>(25);
   const [customAmount, setCustomAmount] = useState<string>("");
   const [isProcessing, setIsProcessing] = useState(false);
   const [error, setError] = useState<string | null>(null);
 
   const parsedAmount = selectedAmount ?? parseFloat(customAmount.replace(",", "."));
 
   const handleDonation = async () => {
     try {
       setError(null);
       setIsProcessing(true);
 
       const amount = parsedAmount;
 
       if (!amount || amount < 5) {
         setError("O valor mínimo de doação é R$ 5,00.");
         setIsProcessing(false);
         return;
       }
 
       const response = await fetch("/api/doacao/checkout", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ amount }),
       });
 
       const data = await response.json();
 
       if (!response.ok) {
         throw new Error(data.error || "Erro ao processar doação");
       }
 
       if (data.url) {
         window.location.href = data.url;
       } else {
         throw new Error("URL de checkout não recebida");
       }
     } catch (err) {
       console.error("Erro na doação:", err);
       const message = err instanceof Error ? err.message : "Erro ao processar doação";
       setError(message);
       setIsProcessing(false);
     }
   };
 
   return (
     <main className="flex-grow">
       <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 lg:px-8">
           <div className="hero-accent absolute inset-0 blur-3xl" aria-hidden />
           <div className="container relative z-10 mx-auto max-w-5xl space-y-12">
            <div className="surface-card space-y-5 p-8 text-center shadow-xl md:p-12">
              <span className="hero-status shadow-glow justify-center text-sm">
                ❤️ 100% financiado pela comunidade
              </span>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                Doe para manter tudo gratuito e simples.
              </h1>
              <p className="mx-auto max-w-2xl text-base text-foreground/75">
                Pagamos APIs de IA, servidores e melhorias com pequenas contribuições. Qualquer valor mantém milhares de estudantes praticando.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/sobre" className="btn btn-outline px-6 py-3 text-sm">
                  Conheça o projeto
                </Link>
                <Link href="/noticias" className="btn btn-glass px-6 py-3 text-sm">
                  Ver impacto
                </Link>
              </div>
            </div>
 
             <div className="surface-card space-y-8 p-8 shadow-xl md:p-10">
               <div className="flex flex-col gap-4 text-center">
                 <h2 className="text-2xl font-semibold text-foreground">Escolha um valor</h2>
                 <p className="text-sm text-foreground/70">
                   Nosso custo médio por estudante ativa é de R$ 12,80/mês. Qualquer valor acima de R$ 5 já nos ajuda a manter a infraestrutura.
                 </p>
               </div>
               <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                 {DONATION_AMOUNTS.map((amount) => {
                   const isActive = parsedAmount === amount.value;
                   return (
                     <button
                       key={amount.value}
                       onClick={() => {
                         setSelectedAmount(amount.value);
                         setCustomAmount("");
                         setError(null);
                       }}
                       disabled={isProcessing}
                       className={`select-card surface-card flex h-full flex-col items-center gap-2 border border-border-color/60 p-5 text-center shadow-sm transition-all ${
                         isActive ? "select-card--active" : ""
                       } ${isProcessing ? "cursor-not-allowed opacity-60" : ""}`}
                     >
                       <span className="text-xl font-semibold text-primary">{amount.label}</span>
                       <p className="text-xs text-foreground/70">{amount.description}</p>
                     </button>
                   );
                 })}
               </div>
               <div className="space-y-2">
                 <p className="text-sm font-semibold text-foreground">Ou escolha seu próprio valor</p>
                 <div className="relative">
                   <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-semibold text-foreground/70">R$</span>
                   <input
                     type="number"
                     min="5"
                     step="1"
                     value={customAmount}
                     onChange={(event) => {
                       setCustomAmount(event.target.value);
                       setSelectedAmount(null);
                       setError(null);
                     }}
                     placeholder="Digite um valor (mínimo R$ 5)"
                     disabled={isProcessing}
                     className="w-full rounded-2xl border border-border-color/70 bg-card-bg/80 py-3 pl-12 pr-4 text-base text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                   />
                 </div>
               </div>
 
               {error && (
                 <div className="rounded-2xl border border-danger/30 bg-danger-light/30 p-3 text-center text-sm text-danger">{error}</div>
               )}
 
               <button
                 onClick={handleDonation}
                 disabled={isProcessing || !parsedAmount || parsedAmount < 5}
                 className="btn btn-primary w-full px-6 py-3 text-base disabled:cursor-not-allowed disabled:opacity-70"
               >
                 {isProcessing ? (
                   <span className="flex items-center justify-center gap-2">
                     <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                     Processando doação...
                   </span>
                 ) : (
                   <>
                     Confirmar doação
                     <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                     </svg>
                   </>
                 )}
               </button>
 
               <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm text-foreground/70">
                 <div className="flex items-center justify-center gap-2 font-semibold text-primary">
                   <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                   </svg>
                   Pagamento 100% seguro via Stripe
                 </div>
                 <p className="mt-2 text-xs">
                   Seus dados são criptografados de ponta a ponta. Não armazenamos informações de cartão. Receba o recibo de doação
                   diretamente no seu email.
                 </p>
               </div>
             </div>

             <div className="grid gap-6 md:grid-cols-3">
               {impactItems.map((impact) => (
                 <div key={impact.title} className="surface-card flex h-full flex-col gap-3 border border-border-color/70 p-6 text-center shadow-sm">
                   <span className="text-3xl">{impact.icon}</span>
                   <h3 className="text-lg font-semibold text-foreground">{impact.title}</h3>
                   <p className="text-sm text-foreground/70">{impact.description}</p>
                 </div>
               ))}
             </div>

             <div className="text-center text-sm text-foreground/80">
               Quer doar por Pix ou boleto? Entre em contato pelo nosso{" "}
               <Link href="mailto:contato@foconoenem.com" className="text-primary font-semibold hover:underline">
                 email oficial
               </Link>{" "}
               para combinarmos o melhor formato. Obrigado por manter o projeto vivo! 💙
             </div>

             <div className="text-center">
               <Link href="/" className="text-primary font-semibold hover:underline">
                 ← Voltar para a página inicial
               </Link>
             </div>
          </div>
      </section>
    </main>
  );
}
