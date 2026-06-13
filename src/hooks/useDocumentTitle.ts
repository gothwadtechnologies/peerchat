import { useEffect } from 'react';

export function useDocumentTitle(title: string, suffix: string = 'GrixChat') {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${suffix}` : `${suffix} | The Ultimate Social Messaging App`;
    document.title = fullTitle;
  }, [title, suffix]);
}
