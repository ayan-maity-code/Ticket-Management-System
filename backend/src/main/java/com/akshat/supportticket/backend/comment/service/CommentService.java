package com.akshat.supportticket.backend.comment.service;

import com.akshat.supportticket.backend.comment.dto.CommentMapper;
import com.akshat.supportticket.backend.comment.dto.CommentResponse;
import com.akshat.supportticket.backend.comment.dto.CreateCommentRequest;
import com.akshat.supportticket.backend.comment.entity.Comment;
import com.akshat.supportticket.backend.comment.repository.CommentRepository;
import com.akshat.supportticket.backend.common.exception.TicketNotFoundException;
import com.akshat.supportticket.backend.ticket.entity.Ticket;
import com.akshat.supportticket.backend.ticket.repository.TicketRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
