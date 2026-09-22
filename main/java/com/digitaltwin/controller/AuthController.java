package com.digitaltwin.controller;

import com.digitaltwin.model.ErrorResponse;
import com.digitaltwin.model.LoginRequest;
import com.digitaltwin.model.LoginResponse;
import com.digitaltwin.model.User;
import com.digitaltwin.repository.UserRepository;
import com.digitaltwin.security.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.stream.Collectors;

/**
 * Controlador REST para autenticación y gestión de sesiones.
 * Expone el endpoint POST /api/v1/auth/login para inicio de sesión.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.POST, RequestMethod.OPTIONS, RequestMethod.GET})
public class AuthController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    /**
     * Endpoint para inicio de sesión de usuarios.
     * 
     * @param request Petición con numero_empleado y contrasena
     * @param httpServletRequest Request HTTP para obtener path en errores
     * @return ResponseEntity con LoginResponse (usuario + JWT) o ErrorResponse
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpServletRequest) {

        log.info("=== LOGIN REQUEST RECEIVED ===");
        log.info("Method: {}", httpServletRequest.getMethod());
        log.info("Request URI: {}", httpServletRequest.getRequestURI());
        log.info("Content-Type: {}", httpServletRequest.getContentType());
        log.info("Intento de login para empleado: {}", request.getEmployeeNumber());
        log.info("Password present: {}", request.getPassword() != null && !request.getPassword().isEmpty());

        // Validar credenciales contra repositorio en memoria
        var userOptional = userRepository.validateCredentials(
                request.getEmployeeNumber(),
                request.getPassword()
        );

        if (userOptional.isEmpty()) {
            log.warn("Credenciales inválidas para empleado: {}", request.getEmployeeNumber());
            
            ErrorResponse error = ErrorResponse.builder()
                    .status(HttpStatus.UNAUTHORIZED.value())
                    .error("Unauthorized")
                    .message("Número de empleado o contraseña incorrectos")
                    .timestamp(OffsetDateTime.now().toString())
                    .path(httpServletRequest.getRequestURI())
                    .build();

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }

        User user = userOptional.get();
        log.info("Login exitoso para: {} (Rol: {})", user.getName(), user.getRole());

        // Generar token JWT
        String token = jwtUtil.generateToken(user);

        // Construir respuesta exitosa
        LoginResponse response = LoginResponse.builder()
                .user(user.toResponse())
                .accessToken(token)
                .expiresIn(jwtUtil.getExpirationInSeconds())
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Manejo de errores de validación (@Valid fallido).
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {

        String errorMessage = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));

        ErrorResponse error = ErrorResponse.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Bad Request")
                .message(errorMessage)
                .timestamp(OffsetDateTime.now().toString())
                .path(request.getRequestURI())
                .build();

        return ResponseEntity.badRequest().body(error);
    }

    /**
     * Manejo de errores de validación en BindException.
     */
    @ExceptionHandler(BindException.class)
    public ResponseEntity<ErrorResponse> handleBindException(
            BindException ex,
            HttpServletRequest request) {

        String errorMessage = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));

        ErrorResponse error = ErrorResponse.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Bad Request")
                .message(errorMessage)
                .timestamp(OffsetDateTime.now().toString())
                .path(request.getRequestURI())
                .build();

        return ResponseEntity.badRequest().body(error);
    }
}