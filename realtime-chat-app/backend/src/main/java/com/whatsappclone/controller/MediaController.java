package com.whatsappclone.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/media")
@Slf4j
public class MediaController {

    private static final String UPLOAD_DIR = "uploads";

    @PostMapping("/upload")
    public ResponseEntity<?> uploadMedia(@RequestParam("file") MultipartFile file, Principal principal) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
        }

        // Limit to 50MB for general files
        if (file.getSize() > 50 * 1024 * 1024) {
            return ResponseEntity.badRequest().body(Map.of("error", "File size exceeds 50MB limit"));
        }

        try {
            File uploadFolder = new File(UPLOAD_DIR);
            if (!uploadFolder.exists()) {
                uploadFolder.mkdirs();
            }

            String cleanName = file.getOriginalFilename().replaceAll("[^a-zA-Z0-9\\.\\-_]", "_");
            String filename = System.currentTimeMillis() + "_" + cleanName;
            Path targetPath = Paths.get(UPLOAD_DIR).resolve(filename);

            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/api/media/")
                    .path(filename)
                    .toUriString();
            String contentType = file.getContentType();
            String mediaType = "document";
            if (contentType != null) {
                if (contentType.startsWith("image/")) {
                    mediaType = "image";
                } else if (contentType.startsWith("video/")) {
                    mediaType = "video";
                } else if (contentType.startsWith("audio/")) {
                    mediaType = "audio";
                }
            }

            return ResponseEntity.ok(Map.of(
                    "mediaUrl", fileUrl,
                    "mediaType", mediaType,
                    "fileName", file.getOriginalFilename(),
                    "fileSize", file.getSize()
            ));
        } catch (Exception e) {
            log.error("Media upload failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to store media file: " + e.getMessage()));
        }
    }

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> getMedia(@PathVariable String filename) {
        try {
            Path file = Paths.get(UPLOAD_DIR).resolve(filename);
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() || resource.isReadable()) {
                String contentType = Files.probeContentType(file);
                if (contentType == null) contentType = "application/octet-stream";
                
                HttpHeaders headers = new HttpHeaders();
                headers.add(HttpHeaders.CONTENT_TYPE, contentType);
                if (!contentType.startsWith("image/") && !contentType.startsWith("video/") && !contentType.startsWith("audio/")) {
                    headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");
                }
                
                return ResponseEntity.ok()
                        .headers(headers)
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
