import { useCallback, useState } from 'react';
import { ApiError, api } from './api';

export function useAction(refresh: () => Promise<boolean>, onUnauthorized: () => void) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const run = useCallback(async <T,>(key: string, path: string, body: unknown, successMessage: string): Promise<T | null> => {
    setBusy(key);
    setError('');
    setSuccess('');
    try {
      const result = await api.post<T>(path, body);
      const refreshed = await refresh();
      setSuccess(refreshed ? successMessage : `${successMessage} La actualización de la vista quedó pendiente.`);
      return result;
    } catch (caught) {
      const message = caught instanceof ApiError ? caught.message : 'No se pudo completar la operación. Intenta otra vez.';
      setError(message);
      if (caught instanceof ApiError && caught.status === 401) onUnauthorized();
      return null;
    } finally {
      setBusy(null);
    }
  }, [onUnauthorized, refresh]);

  const dismiss = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);

  return { busy, error, success, run, dismiss };
}
