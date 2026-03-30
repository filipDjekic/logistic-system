package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.dto.create.ChangeHistoryCreate;
import rs.logistics.logistics_system.dto.response.ChangeHistoryResponse;
import rs.logistics.logistics_system.dto.update.ChangeHistoryUpdate;
import rs.logistics.logistics_system.entity.ChangeHistory;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.ChangeHistoryMapper;
import rs.logistics.logistics_system.repository.ChangeHistoryRepository;
import rs.logistics.logistics_system.repository.UserRepository;
import rs.logistics.logistics_system.service.definition.ChangeHistoryServiceDefinition;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChangeHistoryService implements ChangeHistoryServiceDefinition {

    private final ChangeHistoryRepository _changeHistoryRepository;
    private final UserRepository _userRepository;

    @Override
    public ChangeHistoryResponse getById(Long id) {
        ChangeHistory changeHistory = _changeHistoryRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Change history not found"));
        return ChangeHistoryMapper.toResponse(changeHistory);
    }

    @Override
    public List<ChangeHistoryResponse> getByEntityName(String entityName) {
        List<ChangeHistory> changeHistory = _changeHistoryRepository.findByEntityName(entityName);
        return changeHistory.stream().map(ChangeHistoryMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<ChangeHistoryResponse> getByEntityId(Long entityId) {
        List<ChangeHistory> changeHistory = _changeHistoryRepository.findByEntityId(entityId);
        return changeHistory.stream().map(ChangeHistoryMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<ChangeHistoryResponse> getByUserId(Long userId) {
        List<ChangeHistory> changeHistory = _changeHistoryRepository.findByChangedById(userId);
        return changeHistory.stream().map(ChangeHistoryMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<ChangeHistoryResponse> getByBetweenDate(LocalDateTime start, LocalDateTime end) {
        List<ChangeHistory>  changeHistory = _changeHistoryRepository.findByChangedAtBetween(start, end);
        return changeHistory.stream().map(ChangeHistoryMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<ChangeHistoryResponse> getAll() {
        return _changeHistoryRepository.findAll().stream().map(ChangeHistoryMapper::toResponse).collect(Collectors.toList());
    }
}
