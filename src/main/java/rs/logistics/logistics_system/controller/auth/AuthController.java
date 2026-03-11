package rs.logistics.logistics_system.controller.auth;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import rs.logistics.logistics_system.dto.auth.LoginRequest;
import rs.logistics.logistics_system.dto.auth.LoginResponse;
import rs.logistics.logistics_system.service.definition.auth.AuthServiceDefinition;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthServiceDefinition authService;

    public AuthController(AuthServiceDefinition authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request){
        LoginResponse response = authService.login(request);

        return  ResponseEntity.ok(response);
    }
}
