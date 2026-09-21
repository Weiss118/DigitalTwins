package com.digitaltwin.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO de respuesta para exponer información del usuario en la API.
 * Excluye la contraseña por seguridad.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    @JsonProperty("numero_empleado")
    private String employeeNumber;

    private String name;

    private User.Role role;
}