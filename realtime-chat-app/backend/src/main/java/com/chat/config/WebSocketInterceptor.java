package com.chat.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class WebSocketInterceptor implements ChannelInterceptor {

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(message);
        
        if (StompCommand.CONNECT.equals(headerAccessor.getCommand())) {
            log.info("WebSocket CONNECT: User {}", headerAccessor.getUser());
        } else if (StompCommand.SEND.equals(headerAccessor.getCommand())) {
            log.debug("Message SEND to destination: {}", headerAccessor.getDestination());
        } else if (StompCommand.DISCONNECT.equals(headerAccessor.getCommand())) {
            log.info("WebSocket DISCONNECT: User {}", headerAccessor.getUser());
        }
        
        return message;
    }
}
