package com.akshat.supportticket.backend.common.exception;

import com.akshat.supportticket.backend.ticket.entity.TicketStatus;

public class IllegalStatusTransitionException extends RuntimeException {

    private final TicketStatus from;
    private final TicketStatus to;

    public IllegalStatusTransitionException(TicketStatus from, TicketStatus to) {
        super("Cannot transition ticket from " + from + " to " + to + ".");
        this.from = from;
        this.to = to;
    }

    public TicketStatus getFrom() {
        return from;
    }

    public TicketStatus getTo() {
        return to;
    }
}
