package com.ayan.supportticket.backend.ticket.dto;

import java.time.Instant;
import java.util.List;

import com.ayan.supportticket.backend.comment.dto.CommentResponse;
import com.ayan.supportticket.backend.ticket.entity.TicketPriority;
import com.ayan.supportticket.backend.ticket.entity.TicketStatus;

public class TicketResponse {

    private String id;
    private String title;
    private String description;
    private TicketPriority priority;
    private String assignee;
    private TicketStatus status;
    private Instant createdAt;
    private Instant updatedAt;
    private List<CommentResponse> comments;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public TicketPriority getPriority() {
        return priority;
    }

    public void setPriority(TicketPriority priority) {
        this.priority = priority;
    }

    public String getAssignee() {
        return assignee;
    }

    public void setAssignee(String assignee) {
        this.assignee = assignee;
    }

    public TicketStatus getStatus() {
        return status;
    }

    public void setStatus(TicketStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<CommentResponse> getComments() {
        return comments;
    }

    public void setComments(List<CommentResponse> comments) {
        this.comments = comments;
    }
}
