# LabFlow – Task Management REST API

LabFlow is a backend-focused task management system built using **ASP.NET Core Web API** and **Entity Framework Core**.  
The project demonstrates clean architecture, RESTful API design, and database-backed CRUD operations.

This project is designed as a portfolio-ready backend application, simulating internal tools used in enterprise or lab environments.

---

## 🚀 Features

- RESTful API using ASP.NET Core
- CRUD operations for task management
- Entity Framework Core with SQLite
- Input validation and normalization
- Swagger (OpenAPI) documentation
- Clean separation of concerns
- CORS enabled for frontend integration
- Git-based workflow with feature branches

---

## 🧱 Tech Stack

- **Backend:** ASP.NET Core Web API (.NET 8 / .NET 10 compatible)
- **ORM:** Entity Framework Core
- **Database:** SQLite
- **API Docs:** Swagger / OpenAPI
- **Version Control:** Git & GitHub
- **IDE:** Visual Studio 2026

---

## 📂 Project Structure

LabFlow/
│
├── Controllers/ # API Controllers
│ └── TasksController.cs
│
├── LabFlow.Data/ # Data access layer
│ ├── Data/
│ │ └── LabFlowDbContext.cs
│ └── Entities/
│ └── TaskItem.cs
│
├── Program.cs # Application bootstrap
├── appsettings.json # Configuration
├── LabFlow.http # HTTP test file
└── README.md



---

## 🔌 API Endpoints

| Method | Endpoint              | Description              |
|------|----------------------|--------------------------|
| GET  | /api/tasks            | Get all tasks            |
| GET  | /api/tasks/{id}       | Get task by ID           |
| POST | /api/tasks            | Create new task          |
| PUT  | /api/tasks/{id}       | Update existing task     |
| DELETE | /api/tasks/{id}     | Delete task              |

---

## 🧪 Running the Project

1. Clone the repository
2. Open `LabFlow.sln` in Visual Studio
3. Run the project using **IIS Express**
4. Open Swagger UI:



The database is created automatically on first run.

---

## ✅ Validation Rules

- Title is required (max 200 characters)
- Priority: Low | Medium | High
- Status: Todo | InProgress | Done

---

## 📌 Future Enhancements

- Authentication & Authorization (JWT)
- Frontend UI (React / Angular)
- Role-based access
- Pagination & filtering
- Deployment to Azure

---

## 👤 Author

**Mohammed Ilyas Ahmed**  
MS in Artificial Intelligence – University of North Texas  
Software Engineer | Backend & AI-focused Development
