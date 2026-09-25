package com.akshat.supportticket.backend.ticket.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.ayan.supportticket.backend.comment.repository.CommentRepository;
import com.ayan.supportticket.backend.common.exception.IllegalStatusTransitionException;
import com.ayan.supportticket.backend.ticket.domain.TicketStatusTransitionPolicy;
import com.ayan.supportticket.backend.ticket.dto.CreateTicketRequest;
import com.ayan.supportticket.backend.ticket.dto.TicketResponse;
import com.ayan.supportticket.backend.ticket.entity.Ticket;
import com.ayan.supportticket.backend.ticket.entity.TicketPriority;
import com.ayan.supportticket.backend.ticket.entity.TicketStatus;
import com.ayan.supportticket.backend.ticket.repository.TicketRepository;
import com.ayan.supportticket.backend.ticket.service.TicketService;

@ExtendWith(MockitoExtension.class)
class TicketServiceTest {

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private TicketStatusTransitionPolicy transitionPolicy;

    @InjectMocks
    private TicketService ticketService;

    @Test
    void createTicketSetsOpenStatus() {
        CreateTicketRequest request = new CreateTicketRequest();
        request.setTitle("Title");
        request.setDescription("Description");
        request.setPriority(TicketPriority.HIGH);

        when(ticketRepository.save(any(Ticket.class))).thenAnswer(invocation -> {
            Ticket ticket = invocation.getArgument(0);
            ticket.setId(UUID.randomUUID());
            return ticket;
        });

        TicketResponse response = ticketService.createTicket(request);

        assertThat(response.getStatus()).isEqualTo(TicketStatus.OPEN);
        verify(ticketRepository).save(any(Ticket.class));
    }

    @Test
    void changeStatusThrowsWhenTransitionInvalid() {
        UUID id = UUID.randomUUID();
        Ticket ticket = new Ticket();
        ticket.setId(id);
        ticket.setTitle("T");
        ticket.setDescription("D");
        ticket.setPriority(TicketPriority.LOW);
        ticket.setStatus(TicketStatus.OPEN);

        when(ticketRepository.findById(id)).thenReturn(Optional.of(ticket));
        when(transitionPolicy.isAllowed(TicketStatus.OPEN, TicketStatus.CLOSED)).thenReturn(false);

        assertThatThrownBy(() -> ticketService.changeStatus(id, TicketStatus.CLOSED))
                .isInstanceOf(IllegalStatusTransitionException.class);

        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.OPEN);
    }
}
