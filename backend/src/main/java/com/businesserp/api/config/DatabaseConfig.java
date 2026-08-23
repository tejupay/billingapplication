package com.businesserp.api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

@Configuration
public class DatabaseConfig {

    @Value("${spring.datasource.url:jdbc:h2:mem:businesserpdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL}")
    private String url;

    @Value("${spring.datasource.username:sa}")
    private String username;

    @Value("${spring.datasource.password:}")
    private String password;

    @Value("${spring.datasource.driverClassName:#{null}}")
    private String driverClassName;

    @Bean
    @Primary
    public DataSource dataSource() {
        String finalUrl = url != null ? url.trim() : "";

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
        } else if (driverClassName != null && !driverClassName.isBlank()) {
            builder.driverClassName(driverClassName);
        }

        return builder.build();
    }
}
