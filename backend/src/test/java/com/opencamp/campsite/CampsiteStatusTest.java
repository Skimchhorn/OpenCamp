package com.opencamp.campsite;

import static com.opencamp.campsite.Campsite.Status.*;
import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class CampsiteStatusTest {

    LocalDate today = LocalDate.now();

    @Test
    void newSiteIsUnverified() {
        assertEquals(NEEDS_UPDATE, new Campsite(1L).getStatus());
    }

    @Test
    void visitOutcomesMapToStatus() {
        Campsite c = new Campsite(1L);
        c.recordVisit(today, true, true, true, true);
        assertEquals(VERIFIED_RECENTLY, c.getStatus());
        c.recordVisit(today, true, true, true, false);
        assertEquals(REPORTED_UNSAFE, c.getStatus());
        c.recordVisit(today, true, true, false, true);
        assertEquals(REPORTED_ILLEGAL, c.getStatus());
        c.recordVisit(today, true, false, true, true);
        assertEquals(NEEDS_UPDATE, c.getStatus());
    }

    @Test
    void oldVerificationGoesStale() {
        Campsite c = new Campsite(1L);
        c.recordVisit(today.minusDays(91), true, true, true, true);
        assertEquals(NEEDS_UPDATE, c.getStatus());
    }

    @Test
    void visitsDoNotUnhide() {
        Campsite c = new Campsite(1L);
        c.moderate(HIDDEN, null);
        c.recordVisit(today, true, true, true, true);
        assertEquals(HIDDEN, c.getStatus());
    }
}
