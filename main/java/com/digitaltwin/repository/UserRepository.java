package com.digitaltwin.repository;

import com.digitaltwin.model.User;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Repository;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Repositorio en memoria para usuarios del sistema.
 * Carga los usuarios desde un archivo JSON al iniciar la aplicación.
 * Simula una base de datos para el PoC.
 */
@Repository
@RequiredArgsConstructor
@Slf4j
public class UserRepository {

    private final ObjectMapper objectMapper;
    private final Map<String, User> usersByEmployeeNumber = new ConcurrentHashMap<>();

    /**
     * Carga los usuarios desde el archivo JSON al inicio.
     * El archivo debe estar en src/main/resources/users.json
     */
    @PostConstruct
    public void loadUsers() {
        try {
            ClassPathResource resource = new ClassPathResource("users.json");
            if (!resource.exists()) {
                log.warn("Archivo users.json no encontrado, creando usuarios por defecto");
                createDefaultUsers();
                return;
            }

            try (InputStream inputStream = resource.getInputStream()) {
                List<User> users = objectMapper.readValue(inputStream, new TypeReference<>() {});
                
                for (User user : users) {
                    usersByEmployeeNumber.put(user.getEmployeeNumber(), user);
                }
                
                log.info("Cargados {} usuarios desde users.json", users.size());
            }
        } catch (IOException e) {
            log.error("Error al cargar users.json, usando usuarios por defecto: {}", e.getMessage());
            createDefaultUsers();
        }
    }

    /**
     * Crea los usuarios de prueba por defecto si no se encuentra el archivo JSON.
     */
    private void createDefaultUsers() {
        User operador = User.builder()
                .employeeNumber("EMP001")
                .name("Juan Pérez (Operador)")
                .password("12345678")
                .role(User.Role.OPERADOR)
                .active(true)
                .build();

        User tecnico = User.builder()
                .employeeNumber("EMP002")
                .name("Pedro Gómez (Técnico)")
                .password("12345678")
                .role(User.Role.TECNICO)
                .active(true)
                .build();

        User supervisor = User.builder()
                .employeeNumber("EMP003")
                .name("María Rodríguez (Supervisora)")
                .password("12345678")
                .role(User.Role.SUPERVISOR)
                .active(true)
                .build();

        usersByEmployeeNumber.put(operador.getEmployeeNumber(), operador);
        usersByEmployeeNumber.put(tecnico.getEmployeeNumber(), tecnico);
        usersByEmployeeNumber.put(supervisor.getEmployeeNumber(), supervisor);

        log.info("Creados 3 usuarios por defecto en memoria");
    }

    /**
     * Busca un usuario por su número de empleado.
     * 
     * @param employeeNumber Número de empleado a buscar
     * @return Optional con el usuario si existe y está activo
     */
    public Optional<User> findByEmployeeNumber(String employeeNumber) {
        return Optional.ofNullable(usersByEmployeeNumber.get(employeeNumber))
                .filter(User::isActive);
    }

    /**
     * Valida las credenciales de un usuario.
     * 
     * @param employeeNumber Número de empleado
     * @param password Contraseña en texto plano
     * @return Optional con el usuario si las credenciales son correctas
     */
    public Optional<User> validateCredentials(String employeeNumber, String password) {
        return findByEmployeeNumber(employeeNumber)
                .filter(user -> user.getPassword().equals(password));
    }

    /**
     * Obtiene todos los usuarios activos.
     */
    public List<User> findAllActive() {
        return usersByEmployeeNumber.values().stream()
                .filter(User::isActive)
                .toList();
    }
}