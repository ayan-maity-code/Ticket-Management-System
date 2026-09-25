package com.akshat.supportticket.backend.ticket.dto;

import com.akshat.supportticket.backend.ticket.entity.TicketPriority;
import com.fasterxml.jackson.annotation.JsonSetter;
import com.fasterxml.jackson.annotation.Nulls;

public class UpdateTicketRequest {

    private String title;
    private String description;
    private TicketPriority priority;

    @JsonSetter(nulls = Nulls.SET)
    private String assignee;

    private boolean assigneePresent;

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
        this.assigneePresent = true;
    }

    public boolean isAssigneePresent() {
        return assigneePresent;
    }
}
