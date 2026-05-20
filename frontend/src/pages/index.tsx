import { useQuery } from '@tanstack/react-query';
import { useGameSocket } from '@/hooks/useGameSocket';
import { Button } from '@/components/ui/button';

export default function Home() {

  // Testando requisição REST via React Query para o serviço de Wallets (ou Games)
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['healthcheck'],
    queryFn: async () => {
      // Utilizando o proxy configurado no next.config.ts para evitar bloqueios de CORS
      const res = await fetch('/api/wallets/health');

      console.log(res);
      if (!res.ok) throw new Error('Falha na rede');
      return res.json();
    },
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-zinc-950 text-zinc-50">
      <div className="z-10 max-w-5xl w-full flex flex-col items-center justify-between font-mono text-sm gap-8">
        <h1 className="text-4xl font-bold mb-4 tracking-tighter">
          Jungle Gaming <span className="text-green-500">Crash</span>
        </h1>

        <div className="flex flex-col md:flex-row gap-8 w-full max-w-2xl">

          {/* Box REST API */}
          <div className="flex-1 border border-zinc-800 rounded-xl p-6 bg-zinc-900/50">
            <h2 className="text-xl font-semibold mb-4 border-b border-zinc-800 pb-2">Status REST API (Wallets)</h2>
            <div className="mb-4 min-h-12">
              {isLoading && <span className="text-zinc-400 animate-pulse">Carregando...</span>}
              {isError && <span className="text-red-400">Erro ao conectar (serviço fora do ar?)</span>}
              {data && (
                <pre className="text-xs bg-black p-2 rounded border border-zinc-800 overflow-auto">
                  {JSON.stringify(data, null, 2)}
                </pre>
              )}
            </div>
            <Button onClick={() => refetch()} variant="outline" className="w-full">
              Refazer Requisição
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
