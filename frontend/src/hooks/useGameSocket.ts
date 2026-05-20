import { useEffect, useState } from 'react';
import { socket, connectSocket, disconnectSocket } from '@/services/socket';
import { useQueryClient } from '@tanstack/react-query';

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export function useGameSocket() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const queryClient = useQueryClient();

  useEffect(() => {
    connectSocket();

    const onConnect = () => setStatus('connected');
    const onDisconnect = () => setStatus('disconnected');
    const onReconnectAttempt = () => setStatus('connecting');

    // Mapeamento genérico para eventos do servidor
    const onRoundStart = (payload: unknown) => {
      // Exemplo de atualização de estado global via queryClient
      queryClient.setQueryData(['currentRound'], payload);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('reconnect_attempt', onReconnectAttempt);
    socket.on('ROUND_START', onRoundStart);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('reconnect_attempt', onReconnectAttempt);
      socket.off('ROUND_START', onRoundStart);
      disconnectSocket();
    };
  }, [queryClient]);

  return { status };
}
