package com.akshat.supportticket.backend.ticket.domain;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.ayan.supportticket.backend.ticket.domain.TicketStatusTransitionPolicy;
import com.ayan.supportticket.backend.ticket.entity.TicketStatus;

class TicketStatusTransitionPolicyTest {

    private TicketStatusTransitionPolicy policy;

    @BeforeEach
    void setUp() {
        policy = new TicketStatusTransitionPolicy();
    }

    @Test
    void allowsAllValidTransitions() {
        assertTrue(policy.isAllowed(TicketStatus.OPEN, TicketStatus.IN_PROGRESS));
        assertTrue(policy.isAllowed(TicketStatus.OPEN, TicketStatus.CANCELLED));
        assertTrue(policy.isAllowed(TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED));
        assertTrue(policy.isAllowed(TicketStatus.IN_PROGRESS, TicketStatus.CANCELLED));
        assertTrue(policy.isAllowed(TicketStatus.RESOLVED, TicketStatus.CLOSED));
    }

    @Test
    void rejectsSameStatus() {
        assertFalse(policy.isAllowed(TicketStatus.OPEN, TicketStatus.OPEN));
        assertFalse(policy.isAllowed(TicketStatus.CLOSED, TicketStatus.CLOSED));
    }

    @Test
    void rejectsRepresentativeInvalidTransitions() {
        assertFalse(policy.isAllowed(TicketStatus.CLOSED, TicketStatus.OPEN));
        assertFalse(policy.isAllowed(TicketStatus.RESOLVED, TicketStatus.OPEN));
        assertFalse(policy.isAllowed(TicketStatus.CANCELLED, TicketStatus.OPEN));
        assertFalse(policy.isAllowed(TicketStatus.OPEN, TicketStatus.CLOSED));
        assertFalse(policy.isAllowed(TicketStatus.IN_PROGRESS, TicketStatus.OPEN));
    }

    @Test
    void rejectsTransitionsFromTerminalStates() {
        for (TicketStatus target : TicketStatus.values()) {
            assertFalse(policy.isAllowed(TicketStatus.CLOSED, target));
            assertFalse(policy.isAllowed(TicketStatus.CANCELLED, target));
        }
    }
}
