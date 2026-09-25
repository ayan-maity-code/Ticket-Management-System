package com.ayan.supportticket.backend.ticket.domain;

import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

import com.ayan.supportticket.backend.ticket.entity.TicketStatus;

@Component
public class TicketStatusTransitionPolicy {

    private static final Map<TicketStatus, Set<TicketStatus>> ALLOWED = Map.of(
            TicketStatus.OPEN, Set.of(TicketStatus.IN_PROGRESS, TicketStatus.CANCELLED),
            TicketStatus.IN_PROGRESS, Set.of(TicketStatus.RESOLVED, TicketStatus.CANCELLED),
            TicketStatus.RESOLVED, Set.of(TicketStatus.CLOSED),
            TicketStatus.CLOSED, Set.of(),
            TicketStatus.CANCELLED, Set.of());

    public boolean isAllowed(TicketStatus from, TicketStatus to) {
        if (from == null || to == null) {
            return false;
        }
        if (from == to) {
            return false;
        }
        return ALLOWED.getOrDefault(from, Set.of()).contains(to);
    }
}
