package com.chat.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.util.Map;

/**
 * Pass-through signalling controller for WebRTC messages.
 * Frontend will send SDP offers/answers and ICE candidates to /app/call
 * Server will broadcast them to /call/signal so other clients can receive and act.
 *
 * NOTE: This is a simple broadcast signalling implementation. In production you may
 * want to route signals to a specific user (using SimpMessagingTemplate and user destinations).
 */
@Controller
@RequiredArgsConstructor
public class CallSignalController {

    @MessageMapping("/call")
    @SendTo("/call/signal")
    public Map<String, Object> signal(Map<String, Object> payload) {
        // payload should contain { type: "offer"/"answer"/"candidate", ... }
        return payload;
    }
}
