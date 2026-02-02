namespace LabFlow.Models;

public record TaskResponseDto(
    int Id,
    string Title,
    string? Description,
    string Priority,
    string Status,
    DateTime? DueDate,
    DateTime CreatedAtUtc,
    DateTime? UpdatedAtUtc
);

public record TaskCreateDto(
    string Title,
    string? Description,
    string Priority,
    string Status,
    DateTime? DueDate
);

public record TaskUpdateDto(
    string Title,
    string? Description,
    string Priority,
    string Status,
    DateTime? DueDate
);
