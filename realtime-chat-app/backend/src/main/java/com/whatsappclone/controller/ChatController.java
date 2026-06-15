package com.whatsappclone.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/chats")
public class ChatController {

    // GET /api/chats: Yeh route protected hai (sirf authenticated users access kar sakte hain)
    @GetMapping
    public ResponseEntity<List<String>> getChats() {
        // Mock data return karenge verify karne ke liye ki JWT working hai
        return ResponseEntity.ok(List.of("Chat with Rahul", "Chat with Priya", "Group Study"));
    }
}
