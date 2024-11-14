//Script in Javascript
const taskForm = document.getElementById('task_form');
const taskList = document.getElementById('task_list');
const completedTasksList = document.getElementById('completed_tasks_list');
const completedTasksCounter = document.getElementById('completed_tasks');
const expiredTasksCounter = document.getElementById('expired_tasks');
const resetButton = document.getElementById('reset_button');

let timerIntervals = {}; // Oggetto per tenere traccia dei timer dei task
let taskIdCounter = localStorage.getItem('taskIdCounter') ? parseInt(localStorage.getItem('taskIdCounter')) : 0;
let completedTasks = localStorage.getItem('completedTasks') ? parseInt(localStorage.getItem('completedTasks')) : 0;
let expiredTasks = localStorage.getItem('expiredTasks') ? parseInt(localStorage.getItem('expiredTasks')) : 0;

// Recupera i task salvati dal localStorage alla riapertura del browser
window.addEventListener('load', function() {
    const savedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const savedCompletedTasks = JSON.parse(localStorage.getItem('completedTasksList')) || [];

    let anyTaskExpired = false; // Variabile per controllare se un task è scaduto

    // Ripristina i task non completati
    savedTasks.forEach(task => {
        const remainingTime = task.duration - (Date.now() - task.startTime);
        if (remainingTime > 0) {
            addTaskToDOM(task.id, task.name, remainingTime);
            startTimer(task.id, remainingTime);
        } else {
            anyTaskExpired = true; // Se un task è scaduto, impostiamo la variabile
        }
    });

    // Se un task è scaduto, rimuoviamo tutti gli altri task
    if (anyTaskExpired) {
        removeAllTasks(); // Rimuove tutti i task
        expiredTasks++; // Incrementa il conteggio dei task scaduti
    }

    // Ripristina i task completati
    savedCompletedTasks.forEach(taskName => {
        const completedTaskItem = document.createElement('li');
        completedTaskItem.textContent = taskName;
        completedTasksList.appendChild(completedTaskItem);
    });

    updateStatistics();
});

// Aggiorna il localStorage ogni volta che un task viene aggiunto o completato
function updateLocalStorage() {
    const tasks = [];
    taskList.querySelectorAll('li').forEach(taskItem => {
        const taskId = taskItem.id;
        const taskName = taskItem.querySelector('.task_name').textContent;
        const remainingTime = parseInt(taskItem.querySelector('.task_timer').getAttribute('data-remaining-time'));
        tasks.push({ id: taskId, name: taskName, duration: remainingTime, startTime: Date.now() });
    });
    localStorage.setItem('tasks', JSON.stringify(tasks));

    // Salva i task completati
    const completedTaskNames = [];
    completedTasksList.querySelectorAll('li').forEach(completedTaskItem => {
        completedTaskNames.push(completedTaskItem.textContent);
    });
    localStorage.setItem('completedTasksList', JSON.stringify(completedTaskNames));

    localStorage.setItem('completedTasks', completedTasks);
    localStorage.setItem('expiredTasks', expiredTasks);
    localStorage.setItem('taskIdCounter', taskIdCounter);
}

// Add new task
taskForm.addEventListener('submit', function(e) {
    e.preventDefault();

    // Get the values from the form
    const taskName = document.getElementById('task_name').value.trim();
    const taskHours = parseInt(document.getElementById('task_hours').value, 10);
    const taskMinutes = parseInt(document.getElementById('task_minutes').value, 10);

    // Don't add a blank task
    if (taskName === '') return;

    // Verifica che almeno uno dei due campi "Hours" o "Minutes" sia maggiore di 0
    if (taskHours === 0 && taskMinutes === 0) {
        alert('Please enter a value for either hours or minutes.'); // Messaggio di errore
        return; // Blocca l'invio del form
    }

    // Count the total time in milliseconds
    const taskDuration = (taskHours * 60 * 60 * 1000) + (taskMinutes * 60 * 1000);

    // Create new task
    const taskId = `task-${taskIdCounter++}`;
    addTaskToDOM(taskId, taskName, taskDuration);
    startTimer(taskId, taskDuration);
    updateLocalStorage();

    // Reset form
    taskForm.reset();
});

// Function to add task to the DOM
function addTaskToDOM(taskId, taskName, taskDuration) {
    const taskItem = document.createElement('li');
    taskItem.setAttribute('id', taskId);
    taskItem.innerHTML = `
        <span class="task_timer" id="${taskId}-timer" data-remaining-time="${taskDuration}"></span>
        <span class="task_name">${taskName}</span>
        <button class="task_complete_button" onclick="completeTask('${taskId}')">Complete</button>
    `;
    taskList.appendChild(taskItem);
}

// Function to start the timer (accurate with milliseconds but only displaying seconds)
function startTimer(taskId, duration) {
    const endTime = Date.now() + duration;

    const timerInterval = setInterval(function() {
        const remainingTime = endTime - Date.now();

        // Controlla se il timer è scaduto
        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            removeAllTasks();
            expiredTasks++;
            updateStatistics();
        } else {
            const hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
            document.getElementById(`${taskId}-timer`).textContent = `${hours}h ${minutes}m ${seconds}s`;
            document.getElementById(`${taskId}-timer`).setAttribute('data-remaining-time', remainingTime);
        }
    }, 100); // Update every 100ms for precision

    timerIntervals[taskId] = timerInterval;
}

// Function to complete a task
function completeTask(taskId) {
    const taskItem = document.getElementById(taskId);
    if (!taskItem) return;

    const taskName = taskItem.querySelector('.task_name').textContent;

    taskList.removeChild(taskItem);

    const completedTaskItem = document.createElement('li');
    completedTaskItem.textContent = taskName;
    completedTasksList.appendChild(completedTaskItem);

    completedTasks++;
    updateStatistics();
    clearInterval(timerIntervals[taskId]);
    delete timerIntervals[taskId];
    updateLocalStorage();
}

// Function to remove all tasks
function removeAllTasks() {
    taskList.innerHTML = '';
    for (let taskId in timerIntervals) {
        clearInterval(timerIntervals[taskId]);
        delete timerIntervals[taskId];
    }
    updateLocalStorage();
}

// Get the current year
let currentYear = new Date().getFullYear();
document.getElementById('currentYear').textContent = currentYear;

// Update the statistics
function updateStatistics() {
    expiredTasksCounter.textContent = expiredTasks;
    completedTasksCounter.textContent = completedTasks;
    updateLocalStorage();
}

// Function to reset the application
resetButton.addEventListener('click', function() {
    expiredTasks = 0;
    completedTasks = 0;
    taskIdCounter = 0;
    updateStatistics();
    removeAllTasks();
    completedTasksList.innerHTML = '';
    localStorage.clear();
});

// Funzione per gestire il focus sugli input delle ore e dei minuti
function handleInputFocus(event) {
    if (event.target.value === '0') {
        event.target.value = ''; // Nasconde il valore 0
    }
}

// Funzione per gestire il blur sugli input delle ore e dei minuti
function handleInputBlur(event) {
    if (event.target.value === '') {
        event.target.value = '0'; // Ripristina il valore 0 se il campo è vuoto
    }
}

// Aggiungo gli event listener agli input delle ore e dei minuti
document.getElementById('task_hours').addEventListener('focus', handleInputFocus);
document.getElementById('task_hours').addEventListener('blur', handleInputBlur);
document.getElementById('task_minutes').addEventListener('focus', handleInputFocus);
document.getElementById('task_minutes').addEventListener('blur', handleInputBlur);

let darkmode = localStorage.getItem('darkMode')
const themeSwitch = document.getElementById('theme-switch')

const enableDarkmode = () => {
    document.body.classList.add('darkMode')
    localStorage.setItem('darkMode', 'active')
}

const disableDarkmode = () => {
    document.body.classList.remove('darkMode')
    localStorage.setItem('darkMode', null)
}

if(darkmode === "active") enableDarkmode()

themeSwitch.addEventListener("click", () => {
    darkmode = localStorage.getItem('darkMode')
    darkmode !== "active" ? enableDarkmode() : disableDarkmode()
})
