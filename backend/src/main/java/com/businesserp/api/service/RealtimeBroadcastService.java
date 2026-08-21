package com.businesserp.api.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class RealtimeBroadcastService {

    private final SimpMessagingTemplate messagingTemplate;

    public void broadcast(String eventType, Object payload) {
        try {
            SyncEvent event = SyncEvent.builder()
                    .eventType(eventType)
                    .payload(payload)
                    .timestamp(LocalDateTime.now().toString())
                    .build();
            messagingTemplate.convertAndSend("/topic/sync-events", event);
        } catch (Exception e) {
            System.err.println("Realtime broadcast warning: " + e.getMessage());
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SyncEvent {
        private String eventType;
        private Object payload;
        private String timestamp;
    }
}
