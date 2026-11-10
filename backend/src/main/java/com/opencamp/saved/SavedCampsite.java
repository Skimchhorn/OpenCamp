package com.opencamp.saved;

import jakarta.persistence.*;
import java.time.Instant;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "saved_campsites")
public class SavedCampsite {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private Long userId;
    private Long campsiteId;
    @CreationTimestamp private Instant createdAt;

    protected SavedCampsite() {}

    public SavedCampsite(Long userId, Long campsiteId) {
        this.userId = userId;
        this.campsiteId = campsiteId;
    }
}
