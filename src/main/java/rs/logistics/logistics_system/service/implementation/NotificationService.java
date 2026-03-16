package rs.logistics.logistics_system.service.implementation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import rs.logistics.logistics_system.dto.create.NotificationCreate;
import rs.logistics.logistics_system.dto.response.NotificationResponse;
import rs.logistics.logistics_system.dto.update.NotificationUpdate;
import rs.logistics.logistics_system.entity.Notification;
import rs.logistics.logistics_system.entity.User;
import rs.logistics.logistics_system.exception.ResourceNotFoundException;
import rs.logistics.logistics_system.mapper.NotificationMapper;
import rs.logistics.logistics_system.repository.NotificationRepository;
import rs.logistics.logistics_system.repository.UserRepository;
import rs.logistics.logistics_system.service.definition.NotificationServiceDefinition;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService implements NotificationServiceDefinition {

    private final NotificationRepository _notificationRepository;
    private final UserRepository _userRepository;


    @Override
    public NotificationResponse create(NotificationCreate dto) {
        User user = _userRepository.findById(dto.getUserId()).orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Notification notification = NotificationMapper.toEntity(dto, user);
        Notification saved =  _notificationRepository.save(notification);
        return NotificationMapper.toResponse(saved);
    }

    @Override
    public NotificationResponse update(Long id, NotificationUpdate dto) {
        User user = _userRepository.findById(dto.getUserId()).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Notification notification = _notificationRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        NotificationMapper.updateEntity(dto, notification, user);
        Notification updated = _notificationRepository.save(notification);
        return NotificationMapper.toResponse(updated);
    }

    @Override
    public NotificationResponse getById(Long id) {
        Notification notification = _notificationRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        return NotificationMapper.toResponse(notification);
    }

    @Override
    public List<NotificationResponse> getAll() {
        return _notificationRepository.findAll().stream().map(NotificationMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public void delete(Long id) {
        Notification notification = _notificationRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        _notificationRepository.delete(notification);
    }
}
