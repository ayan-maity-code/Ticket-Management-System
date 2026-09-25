package com.akshat.supportticket.backend.comment.dto;

import com.akshat.supportticket.backend.comment.entity.Comment;
import java.util.List;
import java.util.UUID;

public final class CommentMapper {

    private CommentMapper() {}

    public static CommentResponse toResponse(Comment comment, UUID ticketId) {
        CommentResponse response = new CommentResponse();
        response.setId(comment.getId().toString());
        response.setTicketId(ticketId.toString());
        response.setText(comment.getText());
        response.setCreatedAt(comment.getCreatedAt());
        return response;
    }

    public static List<CommentResponse> toResponseList(List<Comment> comments, UUID ticketId) {
        return comments.stream().map(c -> toResponse(c, ticketId)).toList();
    }
}
