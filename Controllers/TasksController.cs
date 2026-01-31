using LabFlow.Data.Data;
using LabFlow.Data.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LabFlow.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TasksController : ControllerBase
{
    private readonly LabFlowDbContext _db;

    private static readonly HashSet<string> AllowedPriorities =
        new(StringComparer.OrdinalIgnoreCase) { "Low", "Medium", "High" };

    private static readonly HashSet<string> AllowedStatuses =
        new(StringComparer.OrdinalIgnoreCase) { "Todo", "InProgress", "Done" };

    public TasksController(LabFlowDbContext db)
    {
        _db = db;
    }

    // DTOs
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

    [HttpGet]
    public async Task<ActionResult<List<TaskItem>>> GetAll()
    {
        var tasks = await _db.Tasks
            .OrderByDescending(t => t.CreatedAtUtc)
            .ToListAsync();

        return Ok(tasks);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TaskItem>> GetById(int id)
    {
        var task = await _db.Tasks.FindAsync(id);
        return task is null ? NotFound() : Ok(task);
    }

    [HttpPost]
    public async Task<ActionResult<TaskItem>> Create(TaskCreateDto dto)
    {
        var error = Validate(dto.Title, dto.Priority, dto.Status);
        if (error != null) return error;

        var task = new TaskItem
        {
            Title = dto.Title.Trim(),
            Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim(),
            Priority = NormalizePriority(dto.Priority),
            Status = NormalizeStatus(dto.Status),
            DueDate = dto.DueDate,
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.Tasks.Add(task);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = task.Id }, task);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<TaskItem>> Update(int id, TaskUpdateDto dto)
    {
        var error = Validate(dto.Title, dto.Priority, dto.Status);
        if (error != null) return error;

        var task = await _db.Tasks.FindAsync(id);
        if (task == null) return NotFound();

        task.Title = dto.Title.Trim();
        task.Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();
        task.Priority = NormalizePriority(dto.Priority);
        task.Status = NormalizeStatus(dto.Status);
        task.DueDate = dto.DueDate;

        await _db.SaveChangesAsync();
        return Ok(task);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var task = await _db.Tasks.FindAsync(id);
        if (task == null) return NotFound();

        _db.Tasks.Remove(task);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // -------- Validation helpers --------

    private ActionResult? Validate(string title, string priority, string status)
    {
        if (string.IsNullOrWhiteSpace(title))
            return BadRequest("Title is required.");

        if (title.Length > 200)
            return BadRequest("Title must be 200 characters or less.");

        if (!AllowedPriorities.Contains(priority))
            return BadRequest("Priority must be Low, Medium, or High.");

        if (!AllowedStatuses.Contains(status))
            return BadRequest("Status must be Todo, InProgress, or Done.");

        return null;
    }

    private static string NormalizePriority(string priority) =>
        priority.ToLower() switch
        {
            "low" => "Low",
            "medium" => "Medium",
            "high" => "High",
            _ => "Medium"
        };

    private static string NormalizeStatus(string status) =>
        status.ToLower() switch
        {
            "todo" => "Todo",
            "inprogress" => "InProgress",
            "done" => "Done",
            _ => "Todo"
        };
}
