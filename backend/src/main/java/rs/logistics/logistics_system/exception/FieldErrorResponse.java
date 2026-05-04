package rs.logistics.logistics_system.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class FieldErrorResponse {

    private String field;
    private String message;
}
