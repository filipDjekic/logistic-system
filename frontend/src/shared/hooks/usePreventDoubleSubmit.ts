import { useCallback, useRef, useState } from 'react';

export function usePreventDoubleSubmit<TArgs extends unknown[]>(
  submitHandler: (...args: TArgs) => Promise<unknown> | unknown,
) {
  const submittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const guardedSubmit = useCallback(
    async (...args: TArgs) => {
      if (submittingRef.current) {
        return;
      }

      submittingRef.current = true;
      setIsSubmitting(true);

      try {
        return await submitHandler(...args);
      } finally {
        submittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [submitHandler],
  );

  return { guardedSubmit, isSubmitting };
}
