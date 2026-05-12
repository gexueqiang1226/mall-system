package com.mall.common.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.http.MediaType;

import java.io.IOException;

/**
 * 强制 UTF-8 编码配置
 * 解决中文乱码问题
 */
@Configuration
public class CharacterEncodingConfig {

    @Bean
    public FilterRegistrationBean<CharacterEncodingFilter> utf8CharacterEncodingFilter() {
        FilterRegistrationBean<CharacterEncodingFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new CharacterEncodingFilter());
        registration.addUrlPatterns("/*");
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return registration;
    }

    public static class CharacterEncodingFilter implements Filter {
        @Override
        public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
                throws IOException, ServletException {
            HttpServletRequest httpRequest = (HttpServletRequest) request;
            HttpServletResponse httpResponse = (HttpServletResponse) response;

            // 设置请求编码
            httpRequest.setCharacterEncoding("UTF-8");
            
            // 设置响应编码
            httpResponse.setCharacterEncoding("UTF-8");
            httpResponse.setContentType(MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8");

            chain.doFilter(request, response);
        }
    }
}
