
/* =====================================
   FOCUSFORGE - TASK MANAGER
===================================== */

// 1. Get the HTML elements we need
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");

const totalTasksEl = document.getElementById("totalTasks");
const completedTasksEl = document.getElementById("completedTasks");
const progressEl = document.getElementById("progress");
const emptyMessage = document.getElementById("emptyMessage");

// 2. Load previously saved tasks
let tasks = [];

try {
    const savedTasks = localStorage.getItem("focusforgeTasks");
    tasks = savedTasks ? JSON.parse(savedTasks) : [];

    // Make sure the stored data has the expected structure
    if (
        !Array.isArray(tasks) ||
        !tasks.every(task =>
            task &&
            typeof task.id === "string" &&
            typeof task.text === "string" &&
            typeof task.completed === "boolean"
        )
    ) {
        tasks = [];
    }
} catch (error) {
    tasks = [];
}

// 3. Save tasks in the browser
function saveTasks() {
    localStorage.setItem(
        "focusforgeTasks",
        JSON.stringify(tasks)
    );
}

// 4. Display tasks and update statistics
function renderTasks() {
    // Clear the old list before drawing it again
    taskList.replaceChildren();

    // Create an HTML list item for every task
    tasks.forEach(function(task) {
        const li = document.createElement("li");

        const taskText = document.createElement("span");
        taskText.textContent = task.text;

        if (task.completed) {
            taskText.classList.add("completed-task");
        }

        // Complete / undo button
        const completeButton = document.createElement("button");
        completeButton.textContent = task.completed
            ? "Undo"
            : "Complete";
        completeButton.dataset.action = "toggle";
        completeButton.dataset.id = task.id;
        completeButton.setAttribute(
            "aria-label",
            `${task.completed ? "Undo" : "Complete"} ${task.text}`
        );

        // Delete button
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.dataset.action = "delete";
        deleteButton.dataset.id = task.id;
        deleteButton.setAttribute(
            "aria-label",
            `Delete ${task.text}`
        );

        li.append(taskText, completeButton, deleteButton);
        taskList.appendChild(li);
    });

    // Calculate statistics
    const total = tasks.length;

    const completed = tasks.filter(function(task) {
        return task.completed;
    }).length;

    const percentage = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    // Update the dashboard
    totalTasksEl.textContent = total;
    completedTasksEl.textContent = completed;
    progressEl.textContent = percentage + "%";

    // Show the empty message only when there are no tasks
    emptyMessage.style.display = total === 0
        ? "block"
        : "none";
}

// 5. Add a new task
taskForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const text = taskInput.value.trim();

    // Do not accept empty tasks
    if (text === "") {
        return;
    }

    const newTask = {
        id: crypto.randomUUID(),
        text: text,
        completed: false
    };

    tasks.push(newTask);

    saveTasks();
    renderTasks();

    taskForm.reset();
    taskInput.focus();
});

// 6. Complete, undo or delete tasks
taskList.addEventListener("click", function(event) {
    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const id = button.dataset.id;
    const action = button.dataset.action;

    if (action === "toggle") {
        // Find the selected task
        const task = tasks.find(function(task) {
            return task.id === id;
        });

        if (task) {
            task.completed = !task.completed;
        }
    }

    if (action === "delete") {
        // Keep every task except the selected one
        tasks = tasks.filter(function(task) {
            return task.id !== id;
        });
    }

    saveTasks();
    renderTasks();
});

// 7. Display saved tasks on page load
renderTasks();

/* =====================================
   FOCUSFORGE - POMODORO TIMER
===================================== */

const timerDisplay = document.getElementById("timer");
const startTimerBtn = document.getElementById("startTimer");
const resetTimerBtn = document.getElementById("resetTimer");

const FOCUS_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

let timeLeft = FOCUS_TIME;
let timerInterval = null;
let isBreak = false;

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    timerDisplay.textContent =
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0");
}

function startTimer() {
    // Prevent multiple timers from running simultaneously
    if (timerInterval !== null) {
        return;
    }

    startTimerBtn.textContent = "Pause Focus";

    timerInterval = setInterval(function() {
        timeLeft--;

        updateTimerDisplay();

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;

            isBreak = !isBreak;
            timeLeft = isBreak ? BREAK_TIME : FOCUS_TIME;

            timerDisplay.textContent = isBreak
                ? "Break time!"
                : "Focus time!";

            startTimerBtn.textContent = isBreak
                ? "Start Break"
                : "Start Focus";

            // Optional browser notification
            if ("Notification" in window &&
                Notification.permission === "granted") {
                new Notification(
                    isBreak ? "FocusForge" : "FocusForge",
                    {
                        body: isBreak
                            ? "Focus session complete! Take a break."
                            : "Break complete! Ready to focus again?"
                    }
                );
            }

            // Show the next session's starting time
            setTimeout(updateTimerDisplay, 1500);
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    startTimerBtn.textContent = isBreak
        ? "Resume Break"
        : "Resume Focus";
}

function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    isBreak = false;
    timeLeft = FOCUS_TIME;

    updateTimerDisplay();
    startTimerBtn.textContent = "Start Focus";
}

startTimerBtn.addEventListener("click", function() {
    if (timerInterval !== null) {
        pauseTimer();
    } else {
        startTimer();
    }
});

resetTimerBtn.addEventListener("click", resetTimer);

// Initialize the timer when the page loads
updateTimerDisplay();
