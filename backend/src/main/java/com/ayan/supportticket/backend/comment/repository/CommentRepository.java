package com.ayan.supportticket.backend.comment.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ayan.supportticket.backend.comment.entity.Comment;

public interface CommentRepository extends JpaRepository<Comment, UUID> {

    @Query("SELECT c FROM Comment c WHERE c.ticket.id = :ticketId ORDER BY c.createdAt ASC")
    List<Comment> findByTicketIdOrderByCreatedAtAsc(@Param("ticketId") UUID ticketId);
}
