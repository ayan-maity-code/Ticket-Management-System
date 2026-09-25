package com.akshat.supportticket.backend.ticket.controller;

import com.akshat.supportticket.backend.common.exception.BadRequestException;
import com.akshat.supportticket.backend.ticket.dto.CreateTicketRequest;
import com.akshat.supportticket.backend.ticket.dto.TicketListResponse;
import com.akshat.supportticket.backend.ticket.dto.TicketResponse;
import com.akshat.supportticket.backend.ticket.dto.UpdateTicketRequest;
import com.akshat.supportticket.backend.ticket.dto.UpdateTicketStatusRequest;
import com.akshat.supportticket.backend.ticket.entity.TicketStatus;
import com.akshat.supportticket.backend.ticket.service.TicketService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @PostMapping
    public ResponseEntity<TicketResponse> createTicket(@Valid @RequestBody CreateTicketRequest request) {
        TicketResponse response = ticketService.createTicket(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public TicketListResponse listTickets(
            @RequestParam(required = false) String q, @RequestParam(required = false) String status) {
        TicketStatus statusFilter = parseStatus(status);
        return ticketService.listTickets(q, statusFilter);
    }

    @GetMapping("/{ticketId}")
    public TicketResponse getTicket(@PathVariable UUID ticketId) {
        return ticketService.getTicket(ticketId);
    }

    @PatchMapping("/{ticketId}")
    public TicketResponse updateTicket(
            @PathVariable UUID ticketId, @Valid @RequestBody UpdateTicketRequest request) {
        return ticketService.updateTicket(ticketId, request);
    }

    @PatchMapping("/{ticketId}/status")
    public TicketResponse changeStatus(
            @PathVariable UUID ticketId, @Valid @RequestBody UpdateTicketStatusRequest request) {
        return ticketService.changeStatus(ticketId, request.getStatus());
    }

    private static TicketStatus parseStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        try {
            return TicketStatus.valueOf(status.trim());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid status filter value: " + status);
        }
    }
}
