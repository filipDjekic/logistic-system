package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.dto.create.ChangeHistoryCreate;
import rs.logistics.logistics_system.dto.response.ChangeHistoryResponse;
import rs.logistics.logistics_system.dto.update.ChangeHistoryUpdate;
import rs.logistics.logistics_system.entity.ChangeHistory;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.mapper.ChangeHistoryMapper;
import rs.logistics.logistics_system.repository.ChangeHistoryRepository;
import rs.logistics.logistics_system.repository.UserRepository;
import rs.logistics.logistics_system.service.definition.ChangeHistoryServiceDefinition;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChangeHistoryService implements ChangeHistoryServiceDefinition {

    private final ChangeHistoryRepository _changeHistoryRepository;
    private final UserRepository _userRepository;


    @Override
    public ChangeHistoryResponse create(ChangeHistoryCreate dto) {
        User user = _userRepository.findById(dto.getUserId()).orElseThrow(() -> new RuntimeException("User not found"));

        ChangeHistory changeHistory = ChangeHistoryMapper.toEntity(dto, user);
        ChangeHistory saved =  _changeHistoryRepository.save(changeHistory);
        return ChangeHistoryMapper.toResponse(saved);
    }

    @Override
    public ChangeHistoryResponse update(Long id, ChangeHistoryUpdate dto) {
        User user = _userRepository.findById(dto.getUserId()).orElseThrow(() -> new RuntimeException("User not found"));
        ChangeHistory changeHistory = _changeHistoryRepository.findById(id).orElseThrow(() -> new RuntimeException("Change history not found"));

        ChangeHistoryMapper.updateEntity(changeHistory, dto, user);
        ChangeHistory saved =  _changeHistoryRepository.save(changeHistory);
        return ChangeHistoryMapper.toResponse(saved);
    }

    @Override
    public ChangeHistoryResponse getById(Long id) {
        ChangeHistory changeHistory = _changeHistoryRepository.findById(id).orElseThrow(() -> new RuntimeException("Change history not found"));
        return ChangeHistoryMapper.toResponse(changeHistory);
    }

    @Override
    public List<ChangeHistoryResponse> getAll() {
        return _changeHistoryRepository.findAll().stream().map(ChangeHistoryMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public void delete(Long id) {
        ChangeHistory changeHistory = _changeHistoryRepository.findById(id).orElseThrow(() -> new RuntimeException("Change history not found"));
        _changeHistoryRepository.delete(changeHistory);
    }
}
