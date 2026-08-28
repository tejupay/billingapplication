package com.businesserp.api.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;

import javax.sql.DataSource;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Configuration
public class DatabaseConfig {

    @Autowired
    private Environment env;

    @Bean
    @Primary
    public DataSource dataSource() {
        String activeProfile = env.getProperty("spring.profiles.active", "dev");

        String rawUrl = env.getProperty("SPRING_DATASOURCE_URL");
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = env.getProperty("DATABASE_URL");
        }
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = env.getProperty("spring.datasource.url");
        }

        // Fallback for dev profile if url is missing
        if ((rawUrl == null || rawUrl.isBlank()) && "dev".equalsIgnoreCase(activeProfile)) {
            rawUrl = "jdbc:h2:file:./data/businesserpdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL;AUTO_SERVER=TRUE";
        }

        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = "jdbc:h2:file:./data/businesserpdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL;AUTO_SERVER=TRUE";
        }

        String finalUrl = rawUrl.trim();

        // Auto-fix URL format if standard postgresql:// was supplied instead of jdbc:postgresql://
        if (finalUrl.startsWith("postgresql://")) {
            finalUrl = "jdbc:" + finalUrl;
        }

        boolean isH2 = finalUrl.startsWith("jdbc:h2:");
        boolean isPostgres = finalUrl.startsWith("jdbc:postgresql://");

        String username;
        String password;

        if (isH2) {
            username = env.getProperty("SPRING_DATASOURCE_USERNAME");
            if (username == null || username.isBlank()) {
                username = env.getProperty("spring.datasource.username", "sa");
            }

            password = env.getProperty("SPRING_DATASOURCE_PASSWORD");
            if (password == null) {
                password = env.getProperty("spring.datasource.password", "");
            }
        } else {
            // PostgreSQL configuration
            username = env.getProperty("SPRING_DATASOURCE_USERNAME");
            if (username == null || username.isBlank()) {
                username = env.getProperty("DB_USERNAME");
            }
            if (username == null || username.isBlank()) {
                username = env.getProperty("spring.datasource.username", "postgres");
            }

            password = env.getProperty("SPRING_DATASOURCE_PASSWORD");
            if (password == null || password.isBlank()) {
                password = env.getProperty("DB_PASSWORD");
            }
            if (password == null || password.isBlank()) {
                password = env.getProperty("spring.datasource.password", "tejutejas@2007");
            }

            // Detect direct Supabase URL (db.xxxx.supabase.co:5432) which is IPv6-only
            // and auto-convert to IPv4 Pooler host for Cloud compatibility (Render free tier is IPv4 only)
            if (finalUrl.contains(".supabase.co:5432") || (finalUrl.contains("db.") && finalUrl.contains(".supabase.co"))) {
                Pattern pattern = Pattern.compile("db\\.([a-z0-9]+)\\.supabase\\.co");
                Matcher matcher = pattern.matcher(finalUrl);
                String projectRef = matcher.find() ? matcher.group(1) : "mogxxfeyxbwfboyppows";

                System.out.println(">>> Direct Supabase IPv6 URL detected. Auto-converting to IPv4 Pooler endpoint for Render cloud compatibility...");
                finalUrl = "jdbc:postgresql://aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require&prepareThreshold=0";

                if (username.equals("postgres") || !username.contains(".")) {
                    username = "postgres." + projectRef;
                }
            }

            if (isPostgres && !finalUrl.contains("sslmode=")) {
                finalUrl += (finalUrl.contains("?") ? "&" : "?") + "sslmode=require";
            }

            if (isPostgres && finalUrl.contains("pooler.supabase.com") && !finalUrl.contains("prepareThreshold=")) {
                finalUrl += (finalUrl.contains("?") ? "&" : "?") + "prepareThreshold=0";
            }
        }

        System.out.println("=== BUSINESS ERP DB CONFIG ===");
        System.out.println("Active Profile: " + activeProfile);
        System.out.println("Connecting to Database: " + (finalUrl.contains("@") ? finalUrl.replaceAll("://.*@", "://***@") : finalUrl));
        System.out.println("Connecting with Username: " + username);

        DataSourceBuilder<?> builder = DataSourceBuilder.create().url(finalUrl);

        if (username != null && !username.isBlank()) {
            builder.username(username);
        }
        if (password != null) {
            builder.password(password);
        }

        if (isPostgres) {
            builder.driverClassName("org.postgresql.Driver");
        } else if (isH2) {
            builder.driverClassName("org.h2.Driver");
        }

        return builder.build();
    }
}
