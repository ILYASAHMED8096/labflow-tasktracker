using LabFlow.Data.Data;
using LabFlow.Data.Entities;
using LabFlow.Models;
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

    // ---------------- DTO Mapper ----------------

    private static TaskResponseDto ToDto(TaskItem t) =>
        new(
            t.Id,
            t.Title,
            t.Description,
            t.Priority,
            t.Status,
            t.DueDate,
            t.CreatedAtUtc,
            t.UpdatedAtUtc
        );

    // ---------------- GET: /api/tasks ----------------

    [HttpGet]
    public async Task<ActionResult<PagedResult<TaskResponseDto>>> GetAll(
        [FromQuery] string? status,
        [FromQuery] string? priority,
        [FromQuery] string? q,
        [FromQuery] string? sortBy = "createdAt",
        [FromQuery] string? sortDir = "desc",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] DateTime? dueFrom = null,
        [FromQuery] DateTime? dueTo = null,
        [FromQuery] bool? overdue = null)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 100 ? 20 : pageSize;

        IQueryable<TaskItem> query = _db.Tasks;

        // Hide deleted tasks
        query = query.Where(t => !t.IsDeleted);

        // Filtering
        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(t => t.Status == NormalizeStatus(status));
        }

        if (!string.IsNullOrWhiteSpace(priority))
        {
            query = query.Where(t => t.Priority == NormalizePriority(priority));
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(t =>
                t.Title.Contains(term) ||
                (t.Description != null && t.Description.Contains(term)));
        }

        // Due date filters
        if (dueFrom.HasValue)
        {
            query = query.Where(t => t.DueDate.HasValue && t.DueDate.Value.Date >= dueFrom.Value.Date);
        }

        if (dueTo.HasValue)
        {
            query = query.Where(t => t.DueDate.HasValue && t.DueDate.Value.Date <= dueTo.Value.Date);
        }

        if (overdue.HasValue && overdue.Value)
        {
            var today = DateTime.UtcNow.Date;
            query = query.Where(t =>
                t.DueDate.HasValue &&
                t.DueDate.Value.Date < today &&
                t.Status != "Done");
        }

        // Sorting
        bool asc = (sortDir ?? "desc").ToLower() == "asc";

        query = (sortBy ?? "createdAt").ToLower() switch
        {
            "duedate" => asc ? query.OrderBy(t => t.DueDate) : query.OrderByDescending(t => t.DueDate),
            "priority" => asc ? query.OrderBy(t => t.Priority) : query.OrderByDescending(t => t.Priority),
            "status" => asc ? query.OrderBy(t => t.Status) : query.OrderByDescending(t => t.Status),
            _ => asc ? query.OrderBy(t => t.CreatedAtUtc) : query.OrderByDescending(t => t.CreatedAtUtc)
        };

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var result = new PagedResult<TaskResponseDto>
        {
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            Items = items.Select(ToDto).ToList()
        };

        return Ok(result);
    }

    // ---------------- GET: /api/tasks/{id} ----------------

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TaskResponseDto>> GetById(int id)
    {
        var task = await _db.Tasks.FindAsync(id);
        if (task is null || task.IsDeleted) return NotFound();

        return Ok(ToDto(task));
    }

    // ---------------- POST: /api/tasks ----------------

    [HttpPost]
    public async Task<ActionResult<TaskResponseDto>> Create(TaskCreateDto dto)
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

        return CreatedAtAction(nameof(GetById), new { id = task.Id }, ToDto(task));
    }

    // ---------------- PUT: /api/tasks/{id} ----------------

    [HttpPut("{id:int}")]
    public async Task<ActionResult<TaskResponseDto>> Update(int id, TaskUpdateDto dto)
    {
        var error = Validate(dto.Title, dto.Priority, dto.Status);
        if (error != null) return error;

        var task = await _db.Tasks.FindAsync(id);
        if (task is null || task.IsDeleted) return NotFound();

        task.Title = dto.Title.Trim();
        task.Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();
        task.Priority = NormalizePriority(dto.Priority);
        task.Status = NormalizeStatus(dto.Status);
        task.DueDate = dto.DueDate;
        task.UpdatedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(ToDto(task));
    }

    // ---------------- DELETE: /api/tasks/{id} (Soft Delete) ----------------

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var task = await _db.Tasks.FindAsync(id);
        if (task is null || task.IsDeleted) return NotFound();

        task.IsDeleted = true;
        task.UpdatedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ---------------- POST: /api/tasks/{id}/restore ----------------

    [HttpPost("{id:int}/restore")]
    public async Task<ActionResult<TaskResponseDto>> Restore(int id)
    {
        var task = await _db.Tasks.FindAsync(id);
        if (task is null) return NotFound();

        task.IsDeleted = false;
        task.UpdatedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(ToDto(task));
    }

    // ---------------- Validation helpers ----------------

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
