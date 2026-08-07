package app.pagemate.common.config;

import app.pagemate.common.security.JwtAuthFilter;
import app.pagemate.common.security.JwtProvider;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtProvider jwtProvider;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("http://localhost:*", "http://127.0.0.1:*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(e -> e
                .authenticationEntryPoint((req, res, ex) -> {
                    res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    res.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    res.getWriter().write("{\"success\":false,\"error\":{\"code\":\"UNAUTHORIZED\",\"message\":\"인증 토큰이 없거나 만료되었습니다.\"}}");
                })
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/v1/auth/oauth/**", "/v1/auth/refresh", "/v1/auth/demo").permitAll()
                .requestMatchers("/v1/auth/logout").authenticated()
                .requestMatchers(HttpMethod.GET, "/books/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/v1/users/me", "/v1/users/me/books").authenticated()
                .requestMatchers(HttpMethod.GET, "/v1/users/*/books", "/v1/users/*").permitAll()
                .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/api-docs/**").permitAll()
                // 핸드셰이크만 개방하고, 실제 인증·인가는 StompAuthChannelInterceptor 가 프레임 단위로 수행
                .requestMatchers("/ws/**", "/ws-native/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(new JwtAuthFilter(jwtProvider),
                    UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

}
