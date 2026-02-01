# LabFlow TaskTracker

LabFlow TaskTracker is a clean, enterprise-style **ASP.NET Core Web API** application designed to manage tasks with priority, status, and due dates.  
The project demonstrates **backend architecture, RESTful API design, validation, and database integration** using modern .NET practices.

This project is intended as a **portfolio-grade backend system**, showcasing production-ready coding patterns.

---

## 🚀 Features

- CRUD operations for tasks
- Task validation (title, priority, status)
- Priority & status normalization
- SQLite database using Entity Framework Core
- Swagger UI for API testing
- Clean separation of concerns (API + Data layer)

---

## 🧱 Tech Stack

- **Backend:** ASP.NET Core Web API (.NET 8)
- **ORM:** Entity Framework Core
- **Database:** SQLite
- **API Documentation:** Swagger (OpenAPI)
- **Source Control:** Git & GitHub
- **IDE:** Visual Studio 2026

---

 

## 🏗️ Architecture Overview

LabFlow
│
├── Controllers
│ └── TasksController.cs
│
├── LabFlow.Data
│ ├── Data
│ │ └── LabFlowDbContext.cs
│ └── Entities
│ └── TaskItem.cs
│
├── Program.cs
├── appsettings.json
└── README.md


- **Controllers** handle HTTP requests and validation
- **Data project** contains EF Core DbContext and entities
- **Database** is created automatically at runtime

---

## 📌 API Endpoints

| Method | Endpoint | Description |
|------|---------|------------|
| GET | `/api/tasks` | Get all tasks |
| GET | `/api/tasks/{id}` | Get task by ID |
| POST | `/api/tasks` | Create a new task |
| PUT | `/api/tasks/{id}` | Update a task |
| DELETE | `/api/tasks/{id}` | Delete a task |

---

## ▶️ How to Run Locally

### Prerequisites
- Visual Studio 2026
- .NET 8 SDK

### Steps
1. Clone the repository
2. Open `LabFlow.sln` in Visual Studio
3. Select **IIS Express**
4. Press **F5**
5. Swagger opens automatically at: https://localhost:<port>/swagger


The SQLite database is created automatically on first run.

---

## 🧠 Design Decisions

- SQLite is used for simplicity and portability
- Database files are excluded via `.gitignore`
- Validation logic is centralized in the controller
- Clean DTO usage for update operations
- RESTful naming conventions followed

---

## 📚 What I Learned

- Designing REST APIs using ASP.NET Core
- Implementing EF Core with SQLite
- Validation and normalization of user input
- Structuring projects for maintainability
- Using GitHub pull requests and branching workflow

---

## 🔮 Future Enhancements

- Frontend UI (React or Blazor)
- Authentication & authorization
- Pagination & filtering
- SQL Server support
- Unit testing

---

## 👤 Author

**Mohammed Ilyas Ahmed**  
MS in Artificial Intelligence  
University of North Texas  

