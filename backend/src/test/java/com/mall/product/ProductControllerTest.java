package com.mall.product;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static String adminToken;
    private static Long createdProductId;

    @BeforeAll
    static void setup() throws Exception {
        // Login handled in first test
    }

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
    void testListPublicProducts() throws Exception {
        mockMvc.perform(get("/api/products")
                        .param("page", "1")
                        .param("size", "10")
                        .param("isOnline", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.items").isArray())
                .andExpect(jsonPath("$.data.total").isNumber());
    }

    @Test
    @Order(2)
    void testListProductsWithKeyword() throws Exception {
        mockMvc.perform(get("/api/products")
                        .param("keyword", "iPhone")
                        .param("page", "1")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }

    @Test
    @Order(3)
    void testGetPublicProduct() throws Exception {
        mockMvc.perform(get("/api/products/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    @Order(4)
    void testGetNonexistentProduct() throws Exception {
        mockMvc.perform(get("/api/products/999999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(404));
    }

    @Test
    @Order(5)
    void testCreateProduct() throws Exception {
        ensureAdminToken();

        Map<String, Object> body = Map.of(
                "productName", "Test Product " + System.currentTimeMillis(),
                "productCode", "SKU-TEST-" + System.currentTimeMillis(),
                "salePrice", new BigDecimal("99.99"),
                "sellableStock", 50,
                "isOnline", 0
        );

        MvcResult result = mockMvc.perform(post("/admin/api/products")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.id").isNotEmpty())
                .andReturn();

        String response = result.getResponse().getContentAsString();
        Map<String, Object> respMap = objectMapper.readValue(response, Map.class);
        Map<String, Object> data = (Map<String, Object>) respMap.get("data");
        createdProductId = ((Number) data.get("id")).longValue();
    }

    @Test
    @Order(6)
    void testUpdateProduct() throws Exception {
        ensureAdminToken();

        Map<String, Object> body = Map.of(
                "productName", "Updated Test Product",
                "salePrice", new BigDecimal("129.99")
        );

        mockMvc.perform(put("/admin/api/products/" + (createdProductId != null ? createdProductId : 1))
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }

    @Test
    @Order(7)
    void testOnlineProduct() throws Exception {
        ensureAdminToken();

        long pid = createdProductId != null ? createdProductId : 1L;
        mockMvc.perform(post("/admin/api/products/" + pid + "/online")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }

    @Test
    @Order(8)
    void testOfflineProduct() throws Exception {
        ensureAdminToken();

        long pid = createdProductId != null ? createdProductId : 1L;
        mockMvc.perform(post("/admin/api/products/" + pid + "/offline")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }

    @Test
    @Order(9)
    void testUpdateInventory() throws Exception {
        ensureAdminToken();

        long pid = createdProductId != null ? createdProductId : 1L;
        Map<String, Object> body = Map.of(
                "sellableStock", 200,
                "lowStockWarning", 30,
                "reason", "测试调整库存"
        );

        mockMvc.perform(put("/admin/api/products/" + pid + "/inventory")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }
}
