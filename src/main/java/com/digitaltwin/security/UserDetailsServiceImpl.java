package com.digitaltwin.security;

import com.digitaltwin.model.User;
import com.digitaltwin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

/**
 * Implementación de UserDetailsService para Spring Security.
 * Carga los detalles del usuario desde el repositorio en memoria.
 */
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String employeeNumber) throws UsernameNotFoundException {
        User user = userRepository.findByEmployeeNumber(employeeNumber)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Usuario no encontrado: " + employeeNumber));

        // Crear UserDetails de Spring Security con el rol como autoridad
        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmployeeNumber())
                .password(user.getPassword()) // En producción usar password hasheado
                .authorities(Collections.singletonList(
                        new SimpleGrantedAuthority("ROLE_" + user.getRole().getValue())))
                .build();
    }
}