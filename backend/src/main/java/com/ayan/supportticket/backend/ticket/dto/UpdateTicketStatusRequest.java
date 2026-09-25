package com.ayan.supportticket.backend.ticket.dto;

import com.ayan.supportticket.backend.ticket.entity.TicketStatus;

import jakarta.validation.constraints.NotNull;

public class UpdateTicketStatusRequest {

    @NotNull(message = "Status is required")
    private TicketStatus status;

    public TicketStatus getStatus() {
        return status;
    }

    public void setStatus(TicketStatus status) {
        this.status = status;
    }
}
