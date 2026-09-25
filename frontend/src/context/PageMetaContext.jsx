import { createContext, useContext, useMemo, useState } from 'react';

const PageMetaContext = createContext(null);

export function PageMetaProvider({ children }) {
  const [meta, setMeta] = useState({});
  const value = useMemo(() => ({ meta, setMeta }), [meta]);
  return <PageMetaContext.Provider value={value}>{children}</PageMetaContext.Provider>;
}

export function usePageMeta() {
  const ctx = useContext(PageMetaContext);
  if (!ctx) return { meta: {}, setMeta: () => {} };
  return ctx;
}
