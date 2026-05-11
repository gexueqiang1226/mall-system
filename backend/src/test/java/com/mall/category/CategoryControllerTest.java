package com.mall.category;

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
public class CategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static String adminToken;
    private static Long createdCategoryId;

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
    void testListPublicCategories() throws Exception {
        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @Order(2)
    void testListSubCategories() throws Exception {
        mockMvc.perform(get("/api/categories/0/children"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }

    @Test
    @Order(3)
    void testCreateCategory() throws Exception {
        ensureAdminToken();

        Map<String, Object> body = Map.of(
                "categoryName", "Test Category " + System.currentTimeMillis(),
                "parentId", 0,
                "sortOrder", 99,
                "status", 1
        );

        MvcResult result = mockMvc.perform(post("/admin/api/categories")
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
        createdCategoryId = ((Number) data.get("id")).longValue();
    }

    @Test
    @Order(4)
    void testListAdminCategories() throws Exception {
        ensureAdminToken();

        mockMvc.perform(get("/admin/api/categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("page", "1")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }

    @Test
    @Order(5)
    void testUpdateCategory() throws Exception {
        ensureAdminToken();
        if (createdCategoryId == null) return;

        Map<String, Object> body = Map.of(
                "categoryName", "Updated Category",
                "sortOrder", 100
        );

        mockMvc.perform(put("/admin/api/categories/" + createdCategoryId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }

    @Test
    @Order(6)
    void testDeleteCategory() throws Exception {
        ensureAdminToken();
        if (createdCategoryId == null) return;

        mockMvc.perform(delete("/admin/api/categories/" + createdCategoryId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }

    @Test
    @Order(7)
    void testDeleteNonexistentCategory() throws Exception {
        ensureAdminToken();

        mockMvc.perform(delete("/admin/api/categories/999999")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(404));
    }
}
