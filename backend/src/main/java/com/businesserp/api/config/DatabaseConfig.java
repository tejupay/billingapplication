package com.businesserp.api.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;

import javax.sql.DataSource;

@Configuration
public class DatabaseConfig {

    @Autowired
    private Environment env;

    @Bean
    @Primary
    public DataSource dataSource() {
        String rawUrl = env.getProperty("SPRING_DATASOURCE_URL");
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = env.getProperty("DATABASE_URL");
        }
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = env.getProperty("spring.datasource.url");
        }
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = "jdbc:h2:mem:businesserpdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL";
        }

        String username = env.getProperty("SPRING_DATASOURCE_USERNAME");
        if (username == null || username.isBlank()) {
            username = env.getProperty("DB_USERNAME");
        }
        if (username == null || username.isBlank()) {
            username = env.getProperty("spring.datasource.username", "sa");
        }

        String password = env.getProperty("SPRING_DATASOURCE_PASSWORD");
        if (password == null) {
            password = env.getProperty("DB_PASSWORD");
        }
        if (password == null) {
            password = env.getProperty("spring.datasource.password", "");
        }

        String finalUrl = rawUrl.trim();
        System.out.println("=== BUSINESS ERP DB CONFIG ===");
        System.out.println("Connecting to Database Host: " + (finalUrl.contains("@") ? finalUrl.replaceAll("://.*@", "://***@") : finalUrl));
        System.out.println("Connecting with Username: " + username);

        // Auto-fix URL format if user pasted standard postgresql:// instead of jdbc:postgresql://
        if (finalUrl.startsWith("postgresql://")) {
            finalUrl = "jdbc:" + finalUrl;
        }

        // Auto-append sslmode=require for Supabase & Cloud Postgres if omitted
        if (finalUrl.startsWith("jdbc:postgresql://") && !finalUrl.contains("sslmode=")) {
            finalUrl += (finalUrl.contains("?") ? "&" : "?") + "sslmode=require";
        }

        DataSourceBuilder<?> builder = DataSourceBuilder.create().url(finalUrl);

        if (username != null && !username.isBlank()) {
            builder.username(username);
        }
        if (password != null) {
            builder.password(password);
        }

        if (finalUrl.startsWith("jdbc:postgresql://")) {
            builder.driverClassName("org.postgresql.Driver");
        } else if (finalUrl.startsWith("jdbc:h2:")) {
            builder.driverClassName("org.h2.Driver");
        }

        return builder.build();
    }
}
