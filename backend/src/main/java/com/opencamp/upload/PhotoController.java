package com.opencamp.upload;

import static com.opencamp.common.CurrentUser.*;

import com.opencamp.campsite.CampsiteRepository;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

// shortcut: photos live on local disk under UPLOAD_DIR, so a host with an ephemeral disk loses them;
// move to Cloudinary or S3 (README §9.5) before deploying for real.
@RestController
@RequestMapping("/api")
public class PhotoController {

    private final PhotoRepository photos;
    private final CampsiteRepository campsites;
    private final Path uploadDir;

    public PhotoController(PhotoRepository photos, CampsiteRepository campsites,
                           @Value("${opencamp.upload-dir}") Path uploadDir) throws IOException {
        this.photos = photos;
        this.campsites = campsites;
        this.uploadDir = Files.createDirectories(uploadDir);
    }

    @GetMapping("/campsites/{campsiteId}/photos")
    public List<Photo> list(@PathVariable Long campsiteId) {
        return photos.findByCampsiteIdOrderByCreatedAtAsc(campsiteId);
    }

    @PostMapping("/campsites/{campsiteId}/photos")
    @ResponseStatus(HttpStatus.CREATED)
    public Photo upload(@PathVariable Long campsiteId, @RequestParam MultipartFile file,
                        @RequestParam(required = false) String caption, @AuthenticationPrincipal Jwt jwt) throws IOException {
        campsites.findById(campsiteId).filter(c -> !c.isHidden()).orElseThrow(() -> notFound("Campsite"));
        if (caption != null && caption.length() > 300) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Caption must be at most 300 characters");
        }
        byte[] bytes = file.getBytes(); // size capped by spring.servlet.multipart.max-file-size
        String ext = imageExtension(bytes);
        if (ext == null) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Only JPEG, PNG or WebP images are allowed");
        }
        String name = UUID.randomUUID() + "." + ext;
        Files.write(uploadDir.resolve(name), bytes);
        return photos.save(new Photo(campsiteId, id(jwt), name, caption));
    }

    @DeleteMapping("/photos/{photoId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long photoId, @AuthenticationPrincipal Jwt jwt) throws IOException {
        Photo photo = photos.findById(photoId).orElseThrow(() -> notFound("Photo"));
        requireOwnerOrAdmin(photo.getUploadedBy(), jwt);
        photos.delete(photo);
        Files.deleteIfExists(uploadDir.resolve(photo.getPublicId()));
    }

    /** Decides the type from the file's magic bytes, never the client-supplied name or content type. */
    static String imageExtension(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) return "jpg";
        if (b.length >= 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G') return "png";
        if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') return "webp";
        return null;
    }
}
