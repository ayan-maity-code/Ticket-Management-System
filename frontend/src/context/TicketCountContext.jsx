import { createContext, useContext, useMemo, useState } from 'react';

const TicketCountContext = createContext({ total: null, setTotal: () => {} });

export function TicketCountProvider({ children }) {
  const [total, setTotal] = useState(null);
  const value = useMemo(() => ({ total, setTotal }), [total]);
  return <TicketCountContext.Provider value={value}>{children}</TicketCountContext.Provider>;
}

export function useTicketCount() {
  return useContext(TicketCountContext);
}
