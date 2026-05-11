package com.mall.order;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static String adminToken;
    private static Long createdOrderId;
    private static final Long USER_ID = 1L;

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
    void testCreateOrder() throws Exception {
        ensureAdminToken();

        Map<String, Object> body = Map.of(
                "userId", USER_ID,
                "items", List.of(
                        Map.of("productId", 1, "quantity", 1)
                )
        );

        MvcResult result = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.id").isNotEmpty())
                .andExpect(jsonPath("$.data.orderNo").isNotEmpty())
                .andExpect(jsonPath("$.data.status").value(0))
                .andExpect(jsonPath("$.data.orderItems").isArray())
                .andReturn();

        String response = result.getResponse().getContentAsString();
        Map<String, Object> respMap = objectMapper.readValue(response, Map.class);
        Map<String, Object> data = (Map<String, Object>) respMap.get("data");
        createdOrderId = ((Number) data.get("id")).longValue();
    }

    @Test
    @Order(2)
    void testCreateOrderEmptyItems() throws Exception {
        ensureAdminToken();

        Map<String, Object> body = Map.of(
                "userId", USER_ID,
                "items", List.of()
        );

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    @Order(3)
    void testGetOrderDetail() throws Exception {
        ensureAdminToken();
        if (createdOrderId == null) return;

        mockMvc.perform(get("/api/orders/" + createdOrderId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.id").value(createdOrderId))
                .andExpect(jsonPath("$.data.orderItems").isArray());
    }

    @Test
    @Order(4)
    void testListUserOrders() throws Exception {
        ensureAdminToken();

        mockMvc.perform(get("/api/orders")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("userId", String.valueOf(USER_ID))
                        .param("page", "1")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.records").isArray());
    }

    @Test
    @Order(5)
    void testPayConfirm() throws Exception {
        ensureAdminToken();
        if (createdOrderId == null) return;

        mockMvc.perform(post("/api/orders/" + createdOrderId + "/pay-confirm")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }

    @Test
    @Order(6)
    void testAdminListOrders() throws Exception {
        ensureAdminToken();

        mockMvc.perform(get("/admin/api/orders")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("page", "1")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.records").isArray());
    }

    @Test
    @Order(7)
    void testAdminShipOrder() throws Exception {
        ensureAdminToken();
        if (createdOrderId == null) return;

        mockMvc.perform(put("/admin/api/orders/" + createdOrderId + "/ship")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }

    @Test
    @Order(8)
    void testAdminRefundOrder() throws Exception {
        ensureAdminToken();
        if (createdOrderId == null) return;

        mockMvc.perform(put("/admin/api/orders/" + createdOrderId + "/refund")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }

    @Test
    @Order(9)
    void testCreateOrderInsufficientStock() throws Exception {
        ensureAdminToken();

        Map<String, Object> body = Map.of(
                "userId", USER_ID,
                "items", List.of(
                        Map.of("productId", 1, "quantity", 999999)
                )
        );

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(409));
    }

    @Test
    @Order(10)
    void testCancelOrderTwice() throws Exception {
        ensureAdminToken();

        // Create a new order first
        Map<String, Object> body = Map.of(
                "userId", USER_ID,
                "items", List.of(Map.of("productId", 2, "quantity", 1))
        );
        MvcResult result = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(jsonPath("$.code").value(0))
                .andReturn();

        String response = result.getResponse().getContentAsString();
        Map<String, Object> respMap = objectMapper.readValue(response, Map.class);
        Map<String, Object> data = (Map<String, Object>) respMap.get("data");
        long orderId = ((Number) data.get("id")).longValue();

        // Cancel first time
        mockMvc.perform(post("/api/orders/" + orderId + "/cancel")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));

        // Cancel second time (already canceled)
        mockMvc.perform(post("/api/orders/" + orderId + "/cancel")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }
}
