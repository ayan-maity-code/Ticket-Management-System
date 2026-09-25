package com.ayan.supportticket.backend.comment.service;

import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ayan.supportticket.backend.comment.dto.CommentMapper;
import com.ayan.supportticket.backend.comment.dto.CommentResponse;
import com.ayan.supportticket.backend.comment.dto.CreateCommentRequest;
import com.ayan.supportticket.backend.comment.entity.Comment;
import com.ayan.supportticket.backend.comment.repository.CommentRepository;
import com.ayan.supportticket.backend.common.exception.TicketNotFoundException;
import com.ayan.supportticket.backend.ticket.entity.Ticket;
import com.ayan.supportticket.backend.ticket.repository.TicketRepository;

@Service
public class CommentService {

    private final TicketRepository ticketRepository;
    private final CommentRepository commentRepository;

    public CommentService(TicketRepository ticketRepository, CommentRepository commentRepository) {
        this.ticketRepository = ticketRepository;
        this.commentRepository = commentRepository;
    }

    @Transactional
    public CommentResponse addComment(UUID ticketId, CreateCommentRequest request) {
        Ticket ticket = ticketRepository.findById(ticketId).orElseThrow(() -> new TicketNotFoundException(ticketId));

        Comment comment = new Comment();
        comment.setTicket(ticket);
        comment.setText(request.getText().trim());

        Comment saved = commentRepository.save(comment);
        return CommentMapper.toResponse(saved, ticketId);
    }
}
