package com.opencamp.upload;

import jakarta.persistence.*;
import java.time.Instant;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "campsite_photos")
public class Photo {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private Long campsiteId;
    private Long uploadedBy;
    /** Path relative to the API origin, e.g. /uploads/abc.jpg. */
    private String imageUrl;
    /** Storage key (file name). */
    private String publicId;
    private String caption;
    @CreationTimestamp private Instant createdAt;

    protected Photo() {}

    Photo(Long campsiteId, Long uploadedBy, String publicId, String caption) {
        this.campsiteId = campsiteId;
        this.uploadedBy = uploadedBy;
        this.publicId = publicId;
        this.imageUrl = "/uploads/" + publicId;
        this.caption = caption;
    }

    public Long getId() { return id; }
    public Long getCampsiteId() { return campsiteId; }
    public Long getUploadedBy() { return uploadedBy; }
    public String getImageUrl() { return imageUrl; }
    public String getPublicId() { return publicId; }
    public String getCaption() { return caption; }
    public Instant getCreatedAt() { return createdAt; }
}
