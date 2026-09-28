package com.digitaltwin.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO estándar para respuestas de error en la API.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {

    private int status;

    private String error;

    @JsonProperty("message")
    private String message;

    @JsonProperty("timestamp")
    private String timestamp;

    @JsonProperty("path")
    private String path;
}