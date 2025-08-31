// ✅ Student Planner — Upcoming shows 5 soonest *incomplete* tasks under the button,
//    hides on second click, and auto-removes completed tasks from Upcoming.

window.onload = function () {

    // --- DOM refs
    const addCourseBtn = document.getElementById('addCourseBtn');
    const courseContainer = document.getElementById('courseContainer');
    const upcomingTasks = document.getElementById('upcomingTasks');
    const quickTasks = document.getElementById('quickTasks');
    const showHistoryBtn = document.getElementById('showHistoryBtn');

    // Course modal
    const modal = document.getElementById('courseModal');
    const saveBtn = document.getElementById('saveCourse');
    const cancelBtn = document.getElementById('cancelCourse');
    const courseInput = document.getElementById('courseName');

    // Settings modal
    const settingsIcon = document.getElementById('settingsIcon');
    const settingsModal = document.getElementById('settingsModal');
    const bgColorPicker = document.getElementById('bgColor');
    const applySettings = document.getElementById('applySettings');
    const closeSettings = document.getElementById('closeSettings');

    // History modal
    const historyModal = document.getElementById('historyModal');
    const historyList = document.getElementById('historyList');
    const closeHistoryBtn = document.getElementById('closeHistory');

    // All dated course tasks live here for Upcoming
    // Each entry: { element, date, name, course }
    const allTasks = [];

    const rainbowColors = ["#EF4444", "#F97316", "#F59E0B", "#22C55E", "#3B82F6", "#6366F1", "#A855F7"];

    // --- Date picker mini modal (re-used for both course tasks and quick tasks)
    const taskDateModal = document.createElement('div');
    taskDateModal.className = "modal hidden";
    taskDateModal.innerHTML = `
        <div class="modal-content">
            <label for="taskDate">Select Due Date (optional):</label>
            <input type="date" id="taskDate" />
            <div class="modal-buttons">
                <button id="saveTaskDate">OK</button>
                <button id="cancelTaskDate">No Date</button>
            </div>
        </div>
    `;
    document.body.appendChild(taskDateModal);
    const taskDateInput = taskDateModal.querySelector('#taskDate');
    const saveTaskDateBtn = taskDateModal.querySelector('#saveTaskDate');
    const cancelTaskDateBtn = taskDateModal.querySelector('#cancelTaskDate');

    // Used to pass info between prompts/modals
    let pendingTask = null; // { taskName, courseIndex, isQuick }

    // --- Local Storage Functions
    function saveCoursesToLocalStorage(courses) {
        localStorage.setItem('studentPlannerCourses', JSON.stringify(courses));
    }

    function getCoursesFromLocalStorage() {
        const coursesString = localStorage.getItem('studentPlannerCourses');
        return coursesString ? JSON.parse(coursesString) : [];
    }

    function saveQuickTasksToLocalStorage(tasks) {
        localStorage.setItem('studentPlannerQuickTasks', JSON.stringify(tasks));
    }

    function getQuickTasksFromLocalStorage() {
        const tasksString = localStorage.getItem('studentPlannerQuickTasks');
        return tasksString ? JSON.parse(tasksString) : [];
    }

    function saveDeletedHistoryToLocalStorage(history) {
        localStorage.setItem('studentPlannerDeletedHistory', JSON.stringify(history));
    }

    function getDeletedHistoryFromLocalStorage() {
        const historyString = localStorage.getItem('studentPlannerDeletedHistory');
        return historyString ? JSON.parse(historyString) : [];
    }

    // --- Initial data load
    function loadData() {
        // Clear all dynamically generated content before re-rendering
        courseContainer.innerHTML = '';
        upcomingTasks.innerHTML = '';
        quickTasks.innerHTML = '';
        
        const courses = getCoursesFromLocalStorage();
        courses.forEach((courseData, index) => createCourseElement(courseData, index));
        loadQuickTasks();
        displayUpcomingTasks();
        
        // Load background color
        const savedColor = localStorage.getItem('bgColor');
        if (savedColor) {
            document.body.style.backgroundColor = savedColor;
            bgColorPicker.value = savedColor;
        }
    }

    function loadQuickTasks() {
        const quickTasksData = getQuickTasksFromLocalStorage();
        
        // Clear the quick tasks section first to prevent duplication
        quickTasks.innerHTML = '';
        
        // Add the "Add Quick Task" button first
        const addQuickTaskBtn = document.createElement('button');
        addQuickTaskBtn.textContent = "Add Quick Task";
        addQuickTaskBtn.addEventListener('click', () => {
            const taskName = prompt("Enter quick task name:");
            if (!taskName) return;
            pendingTask = { taskName, isQuick: true };
            taskDateInput.value = "";
            taskDateModal.classList.remove('hidden');
        });
        quickTasks.appendChild(addQuickTaskBtn);

        quickTasksData.forEach((taskData, index) => {
            if (!taskData.completed) {
                createQuickTaskElement(taskData, index);
            }
        });
        displayUpcomingTasks(); // Refresh upcoming after loading
    }

    // --- Section toggles (called by buttons in index.html)
    window.toggleSection = function (sectionId) {
        const section = document.getElementById(sectionId);

        if (sectionId === 'upcomingTasks') {
            // Toggle show/hide and rebuild list when showing
            if (section.classList.contains('hidden')) {
                displayUpcomingTasks();
                section.classList.remove('hidden');
            } else {
                section.classList.add('hidden');
            }
        } else if (sectionId === 'quickTasks') {
            section.classList.toggle('hidden');
        }
    };

    // --- Upcoming tasks display
    function displayUpcomingTasks() {
        upcomingTasks.innerHTML = '';
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];

        const courses = getCoursesFromLocalStorage();
        const quickTasksData = getQuickTasksFromLocalStorage();
        
        const allTasks = [];
        
        courses.forEach(courseData => {
            courseData.tasks.forEach(taskData => {
                if (taskData.dueDate && !taskData.completed) {
                    // Compare date strings directly for reliability
                    if (taskData.dueDate >= todayString) {
                        allTasks.push({
                            name: taskData.name,
                            date: new Date(taskData.dueDate),
                            course: courseData.name
                        });
                    }
                }
            });
        });
        
        quickTasksData.forEach(taskData => {
            if (taskData.dueDate && !taskData.completed) {
                // Compare date strings directly for reliability
                if (taskData.dueDate >= todayString) {
                    allTasks.push({
                        name: taskData.name,
                        date: new Date(taskData.dueDate),
                        course: 'Quick Task'
                    });
                }
            }
        });
        
        const sortedUpcomingTasks = allTasks.sort((a, b) => a.date - b.date).slice(0, 5);
        
        if (sortedUpcomingTasks.length === 0) {
            upcomingTasks.innerHTML = '<p>No upcoming tasks.</p>';
        } else {
            const list = document.createElement('ul');
            sortedUpcomingTasks.forEach(task => {
                const listItem = document.createElement('li');
                const dueDate = task.date.toLocaleDateString('en-US');
                listItem.textContent = `${task.name} (${task.course}) - Due: ${dueDate}`;
                list.appendChild(listItem);
            });
            upcomingTasks.appendChild(list);
        }
    }

    // --- Course modal handlers
    addCourseBtn.addEventListener('click', () => {
        courseInput.value = "";
        modal.classList.remove('hidden');
    });

    cancelBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    saveBtn.addEventListener('click', () => {
        const courseName = courseInput.value.trim();
        if (!courseName) {
            showCustomMessage("Course name cannot be empty.");
            return;
        }

        const courses = getCoursesFromLocalStorage();
        const newCourse = {
            name: courseName,
            tasks: [],
        };
        courses.push(newCourse);
        saveCoursesToLocalStorage(courses);
        loadData();
        modal.classList.add('hidden');
    });

    // --- Date modal actions
    saveTaskDateBtn.addEventListener('click', () => {
        if (pendingTask) {
            const dueDateStr = taskDateInput.value;
            if (pendingTask.isQuick) {
                saveQuickTask(pendingTask.taskName, dueDateStr);
            } else {
                saveCourseTask(pendingTask, dueDateStr);
            }
            pendingTask = null;
        }
        taskDateModal.classList.add('hidden');
    });

    cancelTaskDateBtn.addEventListener('click', () => {
        if (pendingTask) {
            if (pendingTask.isQuick) {
                saveQuickTask(pendingTask.taskName, null);
            } else {
                saveCourseTask(pendingTask, null);
            }
            pendingTask = null;
        }
        taskDateModal.classList.add('hidden');
    });

    // --- Save functions
    function saveCourseTask({ courseIndex, taskName }, dueDateStr) {
        let percent = prompt("Enter % value (0 if not weighted):");
        percent = parseFloat(percent);
        if (isNaN(percent) || percent < 0) percent = 0;

        const courses = getCoursesFromLocalStorage();
        const tasks = courses[courseIndex].tasks;
        const color = percent > 0 ? rainbowColors[tasks.length % rainbowColors.length] : "#D1D5DB"; // Default gray

        const newTask = {
            name: taskName,
            percent: percent,
            color: color,
            earned: 0,
            dueDate: dueDateStr || null,
            completed: false,
        };

        tasks.push(newTask);
        saveCoursesToLocalStorage(courses);
        loadData();
    }

    function saveQuickTask(taskName, dueDateStr) {
        const tasks = getQuickTasksFromLocalStorage();
        const newTask = {
            name: taskName,
            dueDate: dueDateStr || null,
            completed: false,
        };
        tasks.push(newTask);
        saveQuickTasksToLocalStorage(tasks);
        loadQuickTasks(); // Reload the quick tasks section
    }

    // --- Delete functions
    function deleteCourse(index) {
        if (confirm("Are you sure you want to delete this course and all its tasks?")) {
            const courses = getCoursesFromLocalStorage();
            const [deletedCourse] = courses.splice(index, 1);
            saveCoursesToLocalStorage(courses);
            
            // Add to history
            const history = getDeletedHistoryFromLocalStorage();
            history.push({ 
                type: 'course', 
                name: deletedCourse.name,
                data: deletedCourse,
                deletedAt: new Date().toISOString()
            });
            saveDeletedHistoryToLocalStorage(history);
            
            loadData();
        }
    }

    function deleteCourseTask(courseIndex, taskIndex) {
        if (confirm("Are you sure you want to delete this task?")) {
            const courses = getCoursesFromLocalStorage();
            const [deletedTask] = courses[courseIndex].tasks.splice(taskIndex, 1);
            saveCoursesToLocalStorage(courses);
            
            const history = getDeletedHistoryFromLocalStorage();
            history.push({ 
                type: 'courseTask', 
                name: deletedTask.name,
                parent: courses[courseIndex].name,
                data: deletedTask,
                deletedAt: new Date().toISOString()
            });
            saveDeletedHistoryToLocalStorage(history);
            
            loadData();
        }
    }

    function deleteQuickTask(index) {
        if (confirm("Are you sure you want to delete this quick task?")) {
            const tasks = getQuickTasksFromLocalStorage();
            const [deletedTask] = tasks.splice(index, 1);
            saveQuickTasksToLocalStorage(tasks);

            const history = getDeletedHistoryFromLocalStorage();
            history.push({ 
                type: 'quickTask', 
                name: deletedTask.name,
                data: deletedTask,
                deletedAt: new Date().toISOString()
            });
            saveDeletedHistoryToLocalStorage(history);
            
            loadData();
        }
    }

    // --- Element creation functions
    function createCourseElement(courseData, index) {
        const course = document.createElement('div');
        course.className = 'category';
        course.innerHTML = `
            <div class="category-header">
                <span class="category-title">${courseData.name}</span>
                <div class="category-actions">
                    <button class="delete-course-btn">❌</button>
                </div>
                <div class="category-meta">
                    <div class="progress-container">
                        <div class="progress-bar"></div>
                        <span class="category-progress">Progress: 0%</span>
                    </div>
                </div>
            </div>
            <div class="subcategory-container"></div>
            <button class="add-subcategory">Add Task</button>
        `;
        
        // Find the correct elements to add event listeners
        const deleteCourseBtn = course.querySelector('.delete-course-btn');
        const subContainer = course.querySelector('.subcategory-container');
        const addTaskBtn = course.querySelector('.add-subcategory');
        const progressBar = course.querySelector('.progress-bar');
        const progressText = course.querySelector('.category-progress');
        
        // Hook up delete button
        deleteCourseBtn.addEventListener('click', () => deleteCourse(index));

        // Add task flow
        addTaskBtn.addEventListener('click', () => {
            const taskName = prompt("Enter task name:");
            if (!taskName) return;
            pendingTask = { taskName, courseIndex: index, isQuick: false };
            taskDateInput.value = "";
            taskDateModal.classList.remove('hidden');
        });

        // Add tasks to the course
        courseData.tasks.forEach((taskData, taskIndex) => createCourseTaskElement(taskData, subContainer, index, taskIndex));
        updateProgressBar(courseData.tasks, progressBar, progressText);
        
        courseContainer.appendChild(course);
    }

    function createCourseTaskElement(taskData, subContainer, courseIndex, taskIndex) {
        const task = document.createElement('div');
        task.className = `subcategory ${taskData.completed ? 'completed' : ''}`;

        const circle = document.createElement('span');
        circle.className = 'task-circle';
        circle.style.borderColor = taskData.color;
        circle.style.backgroundColor = taskData.completed ? taskData.color : "transparent";
        task.appendChild(circle);

        const dueText = taskData.dueDate ? ` <span class="percent">(Due: ${taskData.dueDate})</span>` : '';
        const percentText = `<span class="percent">${taskData.percent}%</span>`;
        const taskContent = document.createElement('span');
        taskContent.innerHTML = ` ${taskData.name}${dueText} ${percentText}`;
        task.appendChild(taskContent);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-task-btn';
        deleteBtn.textContent = '❌';
        deleteBtn.addEventListener('click', () => deleteCourseTask(courseIndex, taskIndex));
        task.appendChild(deleteBtn);

        // Toggle completion
        circle.addEventListener('click', () => {
            const courses = getCoursesFromLocalStorage();
            const task = courses[courseIndex].tasks[taskIndex];
            task.completed = !task.completed;
            
            if (task.completed) {
                if (task.percent > 0) {
                    let earnedInput = prompt(`You completed "${task.name}". How much out of ${task.percent}% did you earn?`);
                    let earnedValue = parseFloat(earnedInput);
                    if (isNaN(earnedValue) || earnedValue < 0) earnedValue = 0;
                    if (earnedValue > task.percent) earnedValue = task.percent;
                    task.earned = earnedValue;
                }
            } else {
                task.earned = 0;
            }

            saveCoursesToLocalStorage(courses);
            // Re-render the course to reflect the change
            loadData();
        });

        subContainer.appendChild(task);
    }

    function createQuickTaskElement(taskData, index) {
        const task = document.createElement('div');
        task.className = `subcategory`;

        const circle = document.createElement('span');
        circle.className = 'task-circle';
        circle.style.borderColor = "grey";
        circle.style.backgroundColor = taskData.completed ? "grey" : "transparent";
        task.appendChild(circle);

        const dueText = taskData.dueDate ? ` <span class="percent">(Due: ${taskData.dueDate})</span>` : '';
        const taskContent = document.createElement('span');
        taskContent.innerHTML = ` ${taskData.name}${dueText}`;
        task.appendChild(taskContent);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-task-btn';
        deleteBtn.textContent = '❌';
        deleteBtn.addEventListener('click', () => deleteQuickTask(index));
        task.appendChild(deleteBtn);

        // Toggle completion
        circle.addEventListener('click', () => {
            const tasks = getQuickTasksFromLocalStorage();
            const taskIndex = tasks.findIndex(t => t.name === taskData.name && t.dueDate === taskData.dueDate); // Find by name and date
            if (taskIndex !== -1) {
                tasks[taskIndex].completed = !tasks[taskIndex].completed;
                saveQuickTasksToLocalStorage(tasks);
                loadQuickTasks(); // Reload the section
            }
        });

        quickTasks.appendChild(task);
    }
    
    // --- History Modal handlers
    showHistoryBtn.addEventListener('click', () => {
        historyModal.classList.remove('hidden');
        displayDeletedHistory();
    });

    closeHistoryBtn.addEventListener('click', () => {
        historyModal.classList.add('hidden');
    });

    function displayDeletedHistory() {
        historyList.innerHTML = '';
        const history = getDeletedHistoryFromLocalStorage();
        const now = new Date().getTime();
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        
        const freshHistory = history.filter(item => {
            const deletedTime = new Date(item.deletedAt).getTime();
            return (now - deletedTime) < oneWeek;
        });

        saveDeletedHistoryToLocalStorage(freshHistory);

        if (freshHistory.length === 0) {
            historyList.innerHTML = '<p>No recently deleted items.</p>';
            return;
        }

        const list = document.createElement('ul');
        freshHistory.forEach(item => {
            const listItem = document.createElement('li');
            const date = new Date(item.deletedAt).toLocaleDateString();
            let text = '';
            if (item.type === 'course') {
                text = `Course: "${item.name}" deleted on ${date}.`;
            } else if (item.type === 'courseTask') {
                text = `Task: "${item.name}" from "${item.parent}" deleted on ${date}.`;
            } else if (item.type === 'quickTask') {
                text = `Quick Task: "${item.name}" deleted on ${date}.`;
            }
            listItem.textContent = text;
            list.appendChild(listItem);
        });
        historyList.appendChild(list);
    }

    // --- Progress bar update
    function updateProgressBar(tasks, bar, textElement) {
        bar.innerHTML = '';
        if (!tasks || tasks.length === 0) {
            textElement.textContent = 'Progress: 0%';
            return;
        }

        const totalPercent = tasks.reduce((sum, task) => sum + (task.percent || 0), 0);
        let earned = 0;
        
        // Create colored segments for each task
        tasks.forEach(task => {
            if (task.percent > 0) {
                const seg = document.createElement('div');
                seg.className = 'progress-segment';
                seg.style.width = (task.percent / totalPercent) * 100 + '%';
                
                // Use the task's specific color instead of completion status
                seg.style.backgroundColor = task.completed ? '#22C55E' : task.color;
                
                bar.appendChild(seg);
            }
            
            if (task.completed) {
                earned += task.earned || 0;
            }
        });

        // Add grey segment for remaining space if needed
        const currentWidth = bar.children.length > 0 
            ? Array.from(bar.children).reduce((sum, child) => sum + parseFloat(child.style.width), 0) 
            : 0;
            
        if (currentWidth < 100) {
            const greySeg = document.createElement('div');
            greySeg.className = 'progress-segment';
            greySeg.style.width = (100 - currentWidth) + '%';
            greySeg.style.backgroundColor = 'lightgrey';
            bar.appendChild(greySeg);
        }

        earned = Math.round(earned * 100) / 100;
        textElement.textContent = `Progress: ${earned}%`;
    }

    // --- Settings handlers
    settingsIcon.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
    });

    closeSettings.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });

    applySettings.addEventListener('click', () => {
        const newColor = bgColorPicker.value;
        if (!newColor) return;
        document.body.style.backgroundColor = newColor;
        localStorage.setItem('bgColor', newColor);
        settingsModal.classList.add('hidden');
    });

    // Custom message box to replace alerts
    function showCustomMessage(message) {
        const msgModal = document.createElement('div');
        msgModal.className = "modal";
        msgModal.innerHTML = `
            <div class="modal-content">
                <p>${message}</p>
                <div class="modal-buttons">
                    <button class="close-msg-btn">OK</button>
                </div>
            </div>
        `;
        document.body.appendChild(msgModal);
        msgModal.querySelector('.close-msg-btn').addEventListener('click', () => {
            document.body.removeChild(msgModal);
        });
    }

    // Call loadData on window load to initialize everything
    loadData();
};