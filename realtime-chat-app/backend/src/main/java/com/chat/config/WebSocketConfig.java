package com.chat.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketInterceptor webSocketInterceptor;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // WebSocket endpoint for real-time chat
        registry.addEndpoint("/ws/chat").setAllowedOriginPatterns("*").withSockJS();
        
        // Alternative endpoint for raw WebSocket (no SockJS fallback)
        registry.addEndpoint("/ws/chat/raw").setAllowedOriginPatterns("*");
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable simple in-memory broker for topics (broadcast to multiple subscribers)
        config.enableSimpleBroker("/chat", "/user", "/group", "/call", "/notification");
        
        // Application destination prefix for client messages to server
        config.setApplicationDestinationPrefixes("/app");
        
        // User-specific message prefix for direct user messages
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(org.springframework.messaging.simp.config.ChannelRegistration registration) {
        // Can configure interceptors here for additional processing
        registration.interceptors(webSocketInterceptor);
    }
}

