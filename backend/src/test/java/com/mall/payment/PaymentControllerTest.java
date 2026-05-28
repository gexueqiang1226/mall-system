package com.mall.payment;

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
public class PaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static String adminToken;
    private static String paymentNo;
    private static Long orderId;

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
    void testCreatePayment() throws Exception {
        ensureAdminToken();

        // First create an order
        Map<String, Object> orderBody = Map.of(
                "userId", 1L,
                "items", List.of(Map.of("productId", 3, "quantity", 1))
        );
        MvcResult orderResult = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderBody)))
                .andExpect(jsonPath("$.code").value(0))
                .andReturn();

        String orderResponse = orderResult.getResponse().getContentAsString();
        Map<String, Object> orderRespMap = objectMapper.readValue(orderResponse, Map.class);
        Map<String, Object> orderData = (Map<String, Object>) orderRespMap.get("data");
        orderId = ((Number) orderData.get("id")).longValue();

        // Create payment
        Map<String, Object> payBody = Map.of(
                "orderId", orderId,
                "paymentMethod", "mock"
        );

        MvcResult result = mockMvc.perform(post("/api/payments/create")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.paymentNo").isNotEmpty())
                .andExpect(jsonPath("$.data.status").value("pending"))
                .andReturn();

        String response = result.getResponse().getContentAsString();
        Map<String, Object> respMap = objectMapper.readValue(response, Map.class);
        Map<String, Object> data = (Map<String, Object>) respMap.get("data");
        paymentNo = (String) data.get("paymentNo");
    }

    @Test
    @Order(2)
    void testGetPayment() throws Exception {
        ensureAdminToken();
        if (paymentNo == null) return;

        mockMvc.perform(get("/api/payments/" + paymentNo)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.paymentNo").value(paymentNo));
    }

    @Test
    @Order(3)
    void testPaymentCallback() throws Exception {
        ensureAdminToken();
        if (paymentNo == null) return;

        mockMvc.perform(post("/api/payments/" + paymentNo + "/callback")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.status").value("success"));
    }

    @Test
    @Order(4)
    void testDuplicatePaymentCallback() throws Exception {
        ensureAdminToken();
        if (paymentNo == null) return;

        mockMvc.perform(post("/api/payments/" + paymentNo + "/callback")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }

    @Test
    @Order(5)
    void testCreatePaymentNonexistentOrder() throws Exception {
        ensureAdminToken();

        Map<String, Object> payBody = Map.of("orderId", 999999L);
        mockMvc.perform(post("/api/payments/create")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(404));
    }

    @Test
    @Order(6)
    void testGetNonexistentPayment() throws Exception {
        ensureAdminToken();

        mockMvc.perform(get("/api/payments/NONEXISTENT")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(404));
    }
}
