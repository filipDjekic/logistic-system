package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.dto.response.ChangeHistoryResponse;
import rs.logistics.logistics_system.entity.ChangeHistory;
import rs.logistics.logistics_system.repository.ChangeHistoryRepository;
import rs.logistics.logistics_system.security.AuthenticatedUserProvider;
import rs.logistics.logistics_system.service.definition.ChangeHistoryServiceDefinition;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChangeHistoryService implements ChangeHistoryServiceDefinition {

    private final ChangeHistoryRepository _changeHistoryRepository;
    private final AuthenticatedUserProvider authenticatedUserProvider;

    @Override
    public ChangeHistoryResponse getById(Long id) {
        ChangeHistory changeHistory = authenticatedUserProvider.isOverlord()
                ? _changeHistoryRepository.findById(id).orElseThrow(() -> new rs.logistics.logistics_system.exception.ResourceNotFoundException("Change history not found"))
                : _changeHistoryRepository.findByIdAndChangedBy_Company_Id(id, authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow())
                .orElseThrow(() -> new rs.logistics.logistics_system.exception.ResourceNotFoundException("Change history not found"));

        return rs.logistics.logistics_system.mapper.ChangeHistoryMapper.toResponse(changeHistory);
    }

    @Override
    public List<ChangeHistoryResponse> getByEntityName(String entityName) {
        List<ChangeHistory> data = authenticatedUserProvider.isOverlord()
                ? _changeHistoryRepository.findByEntityName(entityName)
                : _changeHistoryRepository.findByEntityNameAndChangedBy_Company_Id(
                        entityName,
                        authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                );

        return data.stream().map(rs.logistics.logistics_system.mapper.ChangeHistoryMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<ChangeHistoryResponse> getByEntityId(Long entityId) {
        List<ChangeHistory> data = authenticatedUserProvider.isOverlord()
                ? _changeHistoryRepository.findByEntityId(entityId)
                : _changeHistoryRepository.findByEntityIdAndChangedBy_Company_Id(
                        entityId,
                        authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                );

        return data.stream().map(rs.logistics.logistics_system.mapper.ChangeHistoryMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<ChangeHistoryResponse> getByUserId(Long userId) {
        List<ChangeHistory> data = authenticatedUserProvider.isOverlord()
                ? _changeHistoryRepository.findByChangedById(userId)
                : _changeHistoryRepository.findByChangedByIdAndChangedBy_Company_Id(
                        userId,
                        authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                );

        return data.stream().map(rs.logistics.logistics_system.mapper.ChangeHistoryMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<ChangeHistoryResponse> getByBetweenDate(LocalDateTime start, LocalDateTime end) {
        List<ChangeHistory> data = authenticatedUserProvider.isOverlord()
                ? _changeHistoryRepository.findByChangedAtBetween(start, end)
                : _changeHistoryRepository.findByChangedAtBetweenAndChangedBy_Company_Id(
                        start,
                        end,
                        authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow()
                );

        return data.stream().map(rs.logistics.logistics_system.mapper.ChangeHistoryMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<ChangeHistoryResponse> getAll() {
        List<ChangeHistory> data = authenticatedUserProvider.isOverlord()
                ? _changeHistoryRepository.findAll()
                : _changeHistoryRepository.findAllByChangedBy_Company_Id(authenticatedUserProvider.getAuthenticatedCompanyIdOrThrow());

        return data.stream().map(rs.logistics.logistics_system.mapper.ChangeHistoryMapper::toResponse).collect(Collectors.toList());
    }
}