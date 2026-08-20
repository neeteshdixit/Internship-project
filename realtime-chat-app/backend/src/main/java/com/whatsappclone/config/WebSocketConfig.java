// package com.whatsappclone.config;

// import org.springframework.context.annotation.Configuration;
// import org.springframework.messaging.simp.config.MessageBrokerRegistry;
// import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
// import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
// import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

// @Configuration
// @EnableWebSocketMessageBroker
// public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

//     @Override
//     public void registerStompEndpoints(StompEndpointRegistry registry) {
//         // 1. SockJS fallback endpoint with wildcard allowed origin patterns to prevent 403 on /ws/info
//         registry.addEndpoint("/ws")
//                 .setAllowedOriginPatterns("*")
//                 .withSockJS();

//         // 2. Direct WebSocket endpoint without SockJS wrapper
//         registry.addEndpoint("/ws")
//                 .setAllowedOriginPatterns("*");
//     }

//     @Override
//     public void configureMessageBroker(MessageBrokerRegistry registry) {
//         // Enable /topic and /queue broker for pub/sub and direct messaging
//         registry.enableSimpleBroker("/topic", "/queue");
//         registry.setApplicationDestinationPrefixes("/app");
//         registry.setUserDestinationPrefix("/user");
//     }
// }

package com.whatsappclone.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {

        // SockJS endpoint
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(
                        "https://internship-project-xi.vercel.app",
                        "http://localhost:5173",
                        "http://localhost:5174"
                )
                .withSockJS();

        // Native WebSocket endpoint
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(
                        "https://internship-project-xi.vercel.app",
                        "http://localhost:5173",
                        "http://localhost:5174"
                );
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {

        registry.enableSimpleBroker("/topic", "/queue");

        registry.setApplicationDestinationPrefixes("/app");

        registry.setUserDestinationPrefix("/user");
    }
}