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

    private static final String DEFAULT_SUPABASE_URL = "jdbc:postgresql://aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require&prepareThreshold=0";
    private static final String DEFAULT_SUPABASE_USER = "postgres.sfqxnahbjufvwokoigun";
    private static final String DEFAULT_SUPABASE_PASS = "Tejupay@2007";

    @Autowired
    private Environment env;

    @Bean
    @Primary
    public DataSource dataSource() {
        String activeProfile = env.getProperty("spring.profiles.active", "prod");
        
        String rawUrl = env.getProperty("SPRING_DATASOURCE_URL");
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = env.getProperty("DATABASE_URL");
        }
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = env.getProperty("spring.datasource.url");
        }

        // If localhost or missing in production mode, override directly with Supabase Pooler
        if ("prod".equalsIgnoreCase(activeProfile) && (rawUrl == null || rawUrl.isBlank() || rawUrl.contains("localhost:5432"))) {
            rawUrl = DEFAULT_SUPABASE_URL;
        } else if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = DEFAULT_SUPABASE_URL;
        }

        String username = env.getProperty("SPRING_DATASOURCE_USERNAME");
        if (username == null || username.isBlank()) {
            username = env.getProperty("DB_USERNAME");
        }
        if (username == null || username.isBlank() || "postgres".equalsIgnoreCase(username) || "sa".equalsIgnoreCase(username)) {
            if (rawUrl.contains("pooler.supabase.com")) {
                username = DEFAULT_SUPABASE_USER;
            } else {
                username = env.getProperty("spring.datasource.username", DEFAULT_SUPABASE_USER);
            }
        }

        String password = env.getProperty("SPRING_DATASOURCE_PASSWORD");
        if (password == null || password.isBlank() || "postgrespassword".equalsIgnoreCase(password)) {
            password = env.getProperty("DB_PASSWORD");
        }
        if (password == null || password.isBlank() || "postgrespassword".equalsIgnoreCase(password)) {
            password = DEFAULT_SUPABASE_PASS;
        }

        String finalUrl = rawUrl.trim();

        // Auto-fix URL format if user pasted standard postgresql:// instead of jdbc:postgresql://
        if (finalUrl.startsWith("postgresql://")) {
            finalUrl = "jdbc:" + finalUrl;
        }

        // Auto-append sslmode=require for Supabase & Cloud Postgres if omitted
        if (finalUrl.startsWith("jdbc:postgresql://") && !finalUrl.contains("sslmode=")) {
            finalUrl += (finalUrl.contains("?") ? "&" : "?") + "sslmode=require";
        }

        // Auto-append prepareThreshold=0 to disable server-side prepared statements for PgBouncer / Supabase Pooler
        if (finalUrl.startsWith("jdbc:postgresql://") && !finalUrl.contains("prepareThreshold=")) {
            finalUrl += (finalUrl.contains("?") ? "&" : "?") + "prepareThreshold=0";
        }

        System.out.println("=== BUSINESS ERP DB CONFIG ===");
        System.out.println("Connecting to Database Host: " + (finalUrl.contains("@") ? finalUrl.replaceAll("://.*@", "://***@") : finalUrl));
        System.out.println("Connecting with Username: " + username);

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
