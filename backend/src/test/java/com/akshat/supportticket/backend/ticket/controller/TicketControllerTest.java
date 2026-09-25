package com.akshat.supportticket.backend.ticket.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.ayan.supportticket.backend.common.advice.GlobalExceptionHandler;
import com.ayan.supportticket.backend.common.exception.IllegalStatusTransitionException;
import com.ayan.supportticket.backend.ticket.controller.TicketController;
import com.ayan.supportticket.backend.ticket.dto.TicketResponse;
import com.ayan.supportticket.backend.ticket.entity.TicketPriority;
import com.ayan.supportticket.backend.ticket.entity.TicketStatus;
import com.ayan.supportticket.backend.ticket.service.TicketService;

@WebMvcTest(controllers = TicketController.class)
@Import(GlobalExceptionHandler.class)
class TicketControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TicketService ticketService;

    @Test
    void createTicketReturns201() throws Exception {
        TicketResponse response = new TicketResponse();
        response.setId(UUID.randomUUID().toString());
        response.setStatus(TicketStatus.OPEN);
        response.setTitle("T");
        response.setDescription("D");
        response.setPriority(TicketPriority.LOW);

        when(ticketService.createTicket(any())).thenReturn(response);

        mockMvc.perform(post("/api/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(
                                """
                                {
                                  "title": "T",
                                  "description": "D",
                                  "priority": "LOW"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("OPEN"));
    }

    @Test
    void invalidStatusTransitionReturns409() throws Exception {
        UUID id = UUID.randomUUID();
        when(ticketService.changeStatus(eq(id), eq(TicketStatus.OPEN)))
                .thenThrow(new IllegalStatusTransitionException(TicketStatus.CLOSED, TicketStatus.OPEN));

        mockMvc.perform(patch("/api/tickets/{id}/status", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\": \"OPEN\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ILLEGAL_STATUS_TRANSITION"));
    }
}
