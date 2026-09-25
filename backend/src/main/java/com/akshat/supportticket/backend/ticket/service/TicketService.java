package com.akshat.supportticket.backend.ticket.service;

import com.akshat.supportticket.backend.common.exception.BadRequestException;
import com.akshat.supportticket.backend.common.exception.IllegalStatusTransitionException;
import com.akshat.supportticket.backend.common.exception.TicketNotFoundException;
import com.akshat.supportticket.backend.comment.entity.Comment;
import com.akshat.supportticket.backend.comment.repository.CommentRepository;
import com.akshat.supportticket.backend.ticket.domain.TicketStatusTransitionPolicy;
import com.akshat.supportticket.backend.ticket.dto.CreateTicketRequest;
import com.akshat.supportticket.backend.ticket.dto.TicketListResponse;
import com.akshat.supportticket.backend.ticket.dto.TicketMapper;
import com.akshat.supportticket.backend.ticket.dto.TicketResponse;
import com.akshat.supportticket.backend.ticket.dto.TicketSummary;
import com.akshat.supportticket.backend.ticket.dto.UpdateTicketRequest;
import com.akshat.supportticket.backend.ticket.entity.Ticket;
import com.akshat.supportticket.backend.ticket.entity.TicketStatus;
import com.akshat.supportticket.backend.ticket.repository.TicketRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;
    private final CommentRepository commentRepository;
    private final TicketStatusTransitionPolicy transitionPolicy;

    public TicketService(
            TicketRepository ticketRepository,
            CommentRepository commentRepository,
            TicketStatusTransitionPolicy transitionPolicy) {
        this.ticketRepository = ticketRepository;
        this.commentRepository = commentRepository;
        this.transitionPolicy = transitionPolicy;
    }

    @Transactional
    public TicketResponse createTicket(CreateTicketRequest request) {
        if (request.getAssignee() != null && !StringUtils.hasText(request.getAssignee())) {
            throw new BadRequestException("Assignee must not be blank when provided");
        }

        Ticket ticket = new Ticket();
        ticket.setTitle(request.getTitle().trim());
        ticket.setDescription(request.getDescription().trim());
        ticket.setPriority(request.getPriority());
        ticket.setAssignee(trimToNull(request.getAssignee()));
        ticket.setStatus(TicketStatus.OPEN);

        Ticket saved = ticketRepository.save(ticket);
        return TicketMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public TicketListResponse listTickets(String q, TicketStatus status) {
        String keyword = normalizeKeyword(q);
        List<TicketSummary> items =
                ticketRepository.search(keyword, status).stream().map(TicketMapper::toSummary).toList();
        return new TicketListResponse(items);
    }

    @Transactional(readOnly = true)
    public TicketResponse getTicket(UUID ticketId) {
        Ticket ticket = findTicketOrThrow(ticketId);
        List<Comment> comments = commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId);
        return TicketMapper.toDetailResponse(ticket, comments);
    }

    @Transactional
    public TicketResponse updateTicket(UUID ticketId, UpdateTicketRequest request) {
        validateUpdateRequest(request);

        Ticket ticket = findTicketOrThrow(ticketId);

        if (request.getTitle() != null) {
            if (!StringUtils.hasText(request.getTitle())) {
                throw new BadRequestException("Title must not be blank");
            }
            ticket.setTitle(request.getTitle().trim());
        }
        if (request.getDescription() != null) {
            if (!StringUtils.hasText(request.getDescription())) {
                throw new BadRequestException("Description must not be blank");
            }
            ticket.setDescription(request.getDescription().trim());
        }
        if (request.getPriority() != null) {
            ticket.setPriority(request.getPriority());
        }
        if (request.isAssigneePresent()) {
            ticket.setAssignee(trimToNull(request.getAssignee()));
        }

        Ticket saved = ticketRepository.save(ticket);
        return TicketMapper.toResponse(saved);
    }

    @Transactional
    public TicketResponse changeStatus(UUID ticketId, TicketStatus newStatus) {
        Ticket ticket = findTicketOrThrow(ticketId);
        TicketStatus current = ticket.getStatus();

        if (!transitionPolicy.isAllowed(current, newStatus)) {
            throw new IllegalStatusTransitionException(current, newStatus);
        }

        ticket.setStatus(newStatus);
        Ticket saved = ticketRepository.save(ticket);
        return TicketMapper.toResponse(saved);
    }

    private Ticket findTicketOrThrow(UUID ticketId) {
        return ticketRepository.findById(ticketId).orElseThrow(() -> new TicketNotFoundException(ticketId));
    }

    private static void validateUpdateRequest(UpdateTicketRequest request) {
        boolean anyField = request.getTitle() != null
                || request.getDescription() != null
                || request.getPriority() != null
                || request.isAssigneePresent();
        if (!anyField) {
            throw new BadRequestException("At least one field must be provided for update");
        }
    }

    private static String normalizeKeyword(String q) {
        if (q == null) {
            return null;
        }
        String trimmed = q.trim();
        if (!StringUtils.hasText(trimmed)) {
            throw new BadRequestException("Query parameter q must not be blank when provided");
        }
        return trimmed;
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return StringUtils.hasText(trimmed) ? trimmed : null;
    }
}
