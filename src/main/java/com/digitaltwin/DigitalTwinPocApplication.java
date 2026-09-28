package com.digitaltwin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Clase principal de la aplicación Digital Twin PoC.
 * 
 * Punto de entrada para el backend Spring Boot que expone la API REST
 * para autenticación y gestión de gemelos digitales en manufactura industrial.
 */
@SpringBootApplication
@EnableAsync
public class DigitalTwinPocApplication {

    public static void main(String[] args) {
        SpringApplication.run(DigitalTwinPocApplication.class, args);
    }
}