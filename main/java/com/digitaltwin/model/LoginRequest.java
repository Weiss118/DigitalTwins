package com.digitaltwin.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para la petición de inicio de sesión.
 * Recibe número de empleado y contraseña.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    @NotBlank(message = "El número de empleado es obligatorio")
    @JsonProperty("numero_empleado")
    private String employeeNumber;

    @NotBlank(message = "La contraseña es obligatoria")
    @JsonProperty("contrasena")
    private String password;
}