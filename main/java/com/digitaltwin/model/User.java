package com.digitaltwin.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entidad que representa un usuario del sistema Digital Twin.
 * Contiene la información básica de identificación y rol para control de accesos.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    /**
     * Número único de empleado (identificador principal).
     * Ejemplo: "EMP001"
     */
    @NotBlank(message = "El número de empleado es obligatorio")
    @JsonProperty("numero_empleado")
    private String employeeNumber;

    /**
     * Nombre completo del usuario con su rol entre paréntesis.
     * Ejemplo: "Juan Pérez (Operador)"
     */
    @NotBlank(message = "El nombre es obligatorio")
    private String name;

    /**
     * Contraseña del usuario (solo para validación interna, no se expone en respuestas).
     * En producción debería estar hasheada con BCrypt.
     */
    @NotBlank(message = "La contraseña es obligatoria")
    private String password;

    /**
     * Rol del usuario en el sistema.
     * Valores permitidos: OPERADOR, TECNICO, SUPERVISOR
     */
    @NotNull(message = "El rol es obligatorio")
    private Role role;

    /**
     * Indica si el usuario está activo en el sistema.
     */
    @Builder.Default
    private boolean active = true;

    /**
     * Enum que define los roles disponibles en el sistema.
     * Cada rol tiene permisos específicos en el dashboard.
     */
    public enum Role {
        OPERADOR("OPERADOR"),
        TECNICO("TECNICO"),
        SUPERVISOR("SUPERVISOR");

        private final String value;

        Role(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }

        public static Role fromString(String value) {
            for (Role role : Role.values()) {
                if (role.value.equalsIgnoreCase(value)) {
                    return role;
                }
            }
            throw new IllegalArgumentException("Rol no válido: " + value);
        }
    }

    /**
     * Crea un DTO seguro para exponer en respuestas API (sin contraseña).
     */
    public UserResponse toResponse() {
        return UserResponse.builder()
                .employeeNumber(this.employeeNumber)
                .name(this.name)
                .role(this.role)
                .build();
    }
}