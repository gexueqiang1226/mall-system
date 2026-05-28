package com.mall.inventory;

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
public class InventoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static String adminToken;

    private void ensureAdminToken() throws Exception {
        if (adminToken != null) return;
        Map<String, String> body = Map.of("username", "admin", "password", "admin123");
        MvcResult result = mockMvc.perform(post("/admin/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andReturn();
        String response = result.getResponse().getContentAsString();
        Map<String, Object> respMap = objectMapper.readValue(response, Map.class);
        Map<String, Object> data = (Map<String, Object>) respMap.get("data");
        adminToken = (String) data.get("token");
    }

    @Test
    @Order(1)
    void testListAllInventoryLogs() throws Exception {
        ensureAdminToken();

        mockMvc.perform(get("/admin/api/inventory-logs")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("page", "1")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }

    @Test
    @Order(2)
    void testListInventoryLogsByProduct() throws Exception {
        ensureAdminToken();

        mockMvc.perform(get("/admin/api/inventory-logs")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("productId", "1")
                        .param("page", "1")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }

    @Test
    @Order(3)
    void testListInventoryLogsPagination() throws Exception {
        ensureAdminToken();

        mockMvc.perform(get("/admin/api/inventory-logs")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("page", "2")
                        .param("size", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }
}
