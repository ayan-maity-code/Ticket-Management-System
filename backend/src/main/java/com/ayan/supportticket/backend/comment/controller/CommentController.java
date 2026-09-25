package com.ayan.supportticket.backend.comment.controller;

import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ayan.supportticket.backend.comment.dto.CommentResponse;
import com.ayan.supportticket.backend.comment.dto.CreateCommentRequest;
import com.ayan.supportticket.backend.comment.service.CommentService;

@RestController
@RequestMapping("/api/tickets/{ticketId}/comments")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @PostMapping
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable UUID ticketId, @Valid @RequestBody CreateCommentRequest request) {
        CommentResponse response = commentService.addComment(ticketId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
