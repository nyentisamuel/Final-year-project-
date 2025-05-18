let currentError: string | null = null;

export const setError = (message: string | null) => {
  currentError = message;
};
