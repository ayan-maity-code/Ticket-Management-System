package com.ayan.supportticket.backend.ticket.dto;

import java.util.List;

import com.ayan.supportticket.backend.comment.dto.CommentMapper;
import com.ayan.supportticket.backend.comment.entity.Comment;
import com.ayan.supportticket.backend.ticket.entity.Ticket;

public final class TicketMapper {

    private TicketMapper() {}

    public static TicketSummary toSummary(Ticket ticket) {
        TicketSummary summary = new TicketSummary();
        summary.setId(ticket.getId().toString());
        summary.setTitle(ticket.getTitle());
        summary.setDescription(ticket.getDescription());
        summary.setPriority(ticket.getPriority());
        summary.setAssignee(ticket.getAssignee());
        summary.setStatus(ticket.getStatus());
        summary.setCreatedAt(ticket.getCreatedAt());
        summary.setUpdatedAt(ticket.getUpdatedAt());
        return summary;
    }

    public static TicketResponse toResponse(Ticket ticket) {
        TicketResponse response = new TicketResponse();
        response.setId(ticket.getId().toString());
        response.setTitle(ticket.getTitle());
        response.setDescription(ticket.getDescription());
        response.setPriority(ticket.getPriority());
        response.setAssignee(ticket.getAssignee());
        response.setStatus(ticket.getStatus());
        response.setCreatedAt(ticket.getCreatedAt());
        response.setUpdatedAt(ticket.getUpdatedAt());
        return response;
    }

    public static TicketResponse toDetailResponse(Ticket ticket, List<Comment> comments) {
        TicketResponse response = toResponse(ticket);
        response.setComments(CommentMapper.toResponseList(comments, ticket.getId()));
        return response;
    }
}
