package com.ayan.supportticket.backend.ticket.dto;

import java.util.List;

public class TicketListResponse {

    private List<TicketSummary> items;

    public TicketListResponse() {}

    public TicketListResponse(List<TicketSummary> items) {
        this.items = items;
    }

    public List<TicketSummary> getItems() {
        return items;
    }

    public void setItems(List<TicketSummary> items) {
        this.items = items;
    }
}
