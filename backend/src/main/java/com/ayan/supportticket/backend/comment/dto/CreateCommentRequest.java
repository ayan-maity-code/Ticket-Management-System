package com.ayan.supportticket.backend.comment.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateCommentRequest {

    @NotBlank(message = "Text is required")
    private String text;

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }
}
