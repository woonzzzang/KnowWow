package com.knowflow.service;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AiServiceClient {
    private final RestClient restClient;

    public AiServiceClient(RestClient.Builder builder, @Value("${knowflow.ai-service-url}") String baseUrl) {
        this.restClient = builder.baseUrl(baseUrl).build();
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> post(String path, Object body) {
        try {
            Map<String, Object> result = restClient.post()
                    .uri(path)
                    .body(body)
                    .retrieve()
                    .body(Map.class);
            if (result == null) {
                throw new IllegalStateException("AI service returned an empty response");
            }
            return result;
        } catch (Exception exception) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "AI 기능을 사용할 수 없습니다. API 키와 AI Service 상태를 확인해주세요.",
                    exception
            );
        }
    }
}

