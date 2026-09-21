package com.knowflow.service;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AiServiceClient {
    private final RestClient restClient;

    public AiServiceClient(RestClient.Builder builder, @Value("${knowflow.ai-service-url}") String baseUrl) {
        HttpClient httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofSeconds(60));

        this.restClient = builder
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .build();
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> post(String path, Object body) {
        try {
            Map<String, Object> result = restClient.post()
                    .uri(path)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);
            if (result == null) {
                throw new IllegalStateException("AI service returned an empty response");
            }
            return result;
        } catch (RestClientResponseException exception) {
            boolean missingApiKey = exception.getResponseBodyAsString().contains("AI_NOT_CONFIGURED");
            String message = missingApiKey
                    ? "AI API 키가 설정되지 않았습니다. 루트 .env 파일을 확인해주세요."
                    : "AI 기능 실행 중 오류가 발생했습니다. AI Service 로그를 확인해주세요.";
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    message,
                    exception
            );
        } catch (Exception exception) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "AI Service에 연결할 수 없습니다. 실행 상태를 확인해주세요.",
                    exception
            );
        }
    }
}
