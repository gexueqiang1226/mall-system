package com.mall;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Mall System 应用启动类
 */
@SpringBootApplication
@EnableCaching
@EnableScheduling
public class MallApplication {

    public static void main(String[] args) {
        SpringApplication.run(MallApplication.class, args);
        System.out.println("\n========================================");
        System.out.println("  Mall System 启动成功！");
        System.out.println("  API Docs: http://localhost:8080/swagger-ui.html");
        System.out.println("========================================\n");
    }
}
