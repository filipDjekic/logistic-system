package rs.logistics.logistics_system.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import rs.logistics.logistics_system.dto.create.ProductCreate;
import rs.logistics.logistics_system.dto.response.ProductResponse;
import rs.logistics.logistics_system.dto.update.ProductUpdate;
import rs.logistics.logistics_system.service.definition.ProductServiceDefinition;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductServiceDefinition productService;

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER')")
    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody ProductCreate dto) {
        return new ResponseEntity<>(productService.create(dto), HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER')")
    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> updateProduct(@PathVariable Long id, @Valid @RequestBody ProductUpdate dto) {
        return new ResponseEntity<>(productService.update(id, dto), HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER','DISPATCHER')")
    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProduct(@PathVariable Long id) {
        return new ResponseEntity<>(productService.getById(id), HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER','DISPATCHER')")
    @GetMapping
    public ResponseEntity<List<ProductResponse>> getAll() {
        return new ResponseEntity<>(productService.getAll(), HttpStatus.OK);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }
}