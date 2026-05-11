package com.mall.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class UserAuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static String userToken;
    private static final String TEST_USERNAME = "testuser_" + System.currentTimeMillis();
    private static final String TEST_PASSWORD = "test123456";
    private static final String TEST_PHONE = "13800000001";

    @Test
    @Order(1)
    void testRegisterSuccess() throws Exception {
        Map<String, String> body = Map.of(
                "username", TEST_USERNAME,
                "password", TEST_PASSWORD,
                "phone", TEST_PHONE
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.username").value(TEST_USERNAME));
    }

    @Test
    @Order(2)
    void testRegisterDuplicate() throws Exception {
        Map<String, String> body = Map.of(
                "username", TEST_USERNAME,
                "password", TEST_PASSWORD,
                "phone", TEST_PHONE
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(409));
    }

    @Test
    @Order(3)
    void testRegisterMissingFields() throws Exception {
        Map<String, String> body = Map.of("username", "someone");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    @Order(4)
    void testLoginSuccess() throws Exception {
        Map<String, String> body = Map.of(
                "username", TEST_USERNAME,
                "password", TEST_PASSWORD
        );

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.userId").isNotEmpty())
                .andExpect(jsonPath("$.data.username").value(TEST_USERNAME))
                .andReturn();

        String response = result.getResponse().getContentAsString();
        Map<String, Object> respMap = objectMapper.readValue(response, Map.class);
        Map<String, Object> data = (Map<String, Object>) respMap.get("data");
        userToken = (String) data.get("token");
    }

    @Test
    @Order(5)
    void testLoginWrongPassword() throws Exception {
        Map<String, String> body = Map.of(
                "username", TEST_USERNAME,
                "password", "wrongpassword"
        );

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401));
    }

    @Test
    @Order(6)
    void testLoginNonexistentUser() throws Exception {
        Map<String, String> body = Map.of(
                "username", "nonexistent_user_xyz",
                "password", "whatever"
        );

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401));
    }

    @Test
    @Order(7)
    void testLoginMissingFields() throws Exception {
        Map<String, String> body = Map.of("username", "someone");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400));
    }
}
