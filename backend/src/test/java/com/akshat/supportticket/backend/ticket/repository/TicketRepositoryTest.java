package com.akshat.supportticket.backend.ticket.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.akshat.supportticket.backend.ticket.entity.Ticket;
import com.akshat.supportticket.backend.ticket.entity.TicketPriority;
import com.akshat.supportticket.backend.ticket.entity.TicketStatus;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

@DataJpaTest
class TicketRepositoryTest {

    @Autowired
    private TicketRepository ticketRepository;

    @Test
    void searchByKeywordAndStatus() {
        Ticket open = ticket("Login issue", "Cannot login", TicketStatus.OPEN);
        Ticket closed = ticket("Login fixed", "Resolved login", TicketStatus.CLOSED);
        ticketRepository.saveAll(List.of(open, closed));

        List<Ticket> results = ticketRepository.search("login", TicketStatus.OPEN);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getTitle()).isEqualTo("Login issue");
    }

    private static Ticket ticket(String title, String description, TicketStatus status) {
        Ticket ticket = new Ticket();
        ticket.setTitle(title);
        ticket.setDescription(description);
        ticket.setPriority(TicketPriority.HIGH);
        ticket.setStatus(status);
        return ticket;
    }
}
