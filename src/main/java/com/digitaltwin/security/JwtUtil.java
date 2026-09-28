package com.digitaltwin.security;

import com.digitaltwin.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Utilidad para generación y validación de tokens JWT.
 * Maneja la creación de tokens de acceso con claims personalizados (rol, número empleado).
 */
@Component
@Slf4j
public class JwtUtil {

    @Value("${jwt.secret:digitalTwinPoCSecretKey2024ForIndustrialManufacturingDigitalTwinApplication}")
    private String secret;

    @Value("${jwt.expiration:3600000}") // 1 hora en milisegundos
    private long expirationMs;

    private SecretKey secretKey;

    @PostConstruct
    public void init() {
        // Genera una clave segura a partir del secret configurado
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        log.info("JWT Util inicializado - Expiración: {} ms", expirationMs);
    }

    /**
     * Genera un token JWT para el usuario autenticado.
     * Incluye claims: numero_empleado, name, role.
     * 
     * @param user Usuario autenticado
     * @return Token JWT firmado
     */
    public String generateToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("numero_empleado", user.getEmployeeNumber());
        claims.put("name", user.getName());
        claims.put("role", user.getRole().getValue());

        return createToken(claims, user.getEmployeeNumber());
    }

    /**
     * Crea el token JWT con los claims y subject especificados.
     */
    private String createToken(Map<String, Object> claims, String subject) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(secretKey)
                .compact();
    }

    /**
     * Extrae el número de empleado (subject) del token.
     */
    public String extractEmployeeNumber(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Extrae el rol del token.
     */
    public String extractRole(String token) {
        return extractClaim(token, claims -> claims.get("role", String.class));
    }

    /**
     * Extrae el nombre del token.
     */
    public String extractName(String token) {
        return extractClaim(token, claims -> claims.get("name", String.class));
    }

    /**
     * Extrae la fecha de expiración del token.
     */
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Método genérico para extraer un claim específico del token.
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Parsea y valida el token, extrayendo todos los claims.
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Verifica si el token ha expirado.
     */
    public boolean isTokenExpired(String token) {
        try {
            return extractExpiration(token).before(new Date());
        } catch (Exception e) {
            return true;
        }
    }

    /**
     * Valida el token completo: firma, expiración y subject coincidente.
     */
    public boolean validateToken(String token, String employeeNumber) {
        try {
            final String tokenEmployeeNumber = extractEmployeeNumber(token);
            return tokenEmployeeNumber.equals(employeeNumber) && !isTokenExpired(token);
        } catch (Exception e) {
            log.debug("Token inválido: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Obtiene el tiempo de expiración en segundos (para respuesta API).
     */
    public long getExpirationInSeconds() {
        return expirationMs / 1000;
    }
}