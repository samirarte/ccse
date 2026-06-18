document.addEventListener('DOMContentLoaded', function() {
    // Firebase auth check remains important for user session
    const auth = firebase.auth();
    let currentUser = null;

    let examQuestions = []; // Array of questions for the current exam
    let userAnswers = {};   // Object to store user's answers { questionIndex: answer }
    let timerInterval = null;

    const ui = {
        examContainer: document.getElementById('exam-container'),
        submitExamBtn: document.getElementById('submit-exam-btn'),
        timer: document.getElementById('timer')
    };

    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            startNewExam(); // Start exam when user is logged in
        } else {
            // If no user, redirect to login
            window.location.href = 'login.html';
        }
    });

    /**
     * Fetches questions from the local JSON file, shuffles them, and starts the exam.
     */
    async function startNewExam() {
        try {
            const response = await fetch('preguntas.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const allQuestions = await response.json();
            
            // Select 25 random questions for the exam
            examQuestions = shuffleArray(allQuestions).slice(0, 25);
            userAnswers = {}; // Reset answers for the new exam
            
            renderExam(examQuestions);
            startTimer(45 * 60); // 45 minutes for the exam
        } catch (error) {
            console.error("Could not start new exam:", error);
            ui.examContainer.innerHTML = "<p>Error al cargar las preguntas del examen. Por favor, intentalo de nuevo más tarde.</p>";
        }
    }

    /**
     * Renders the exam questions and options on the page.
     */
    function renderExam(questions) {
        let examHtml = '';
        questions.forEach((q, index) => {
            const questionId = index; // Use the array index as a unique identifier for this exam session
            examHtml += `
                <div class="question-block" id="question-${questionId}">
                    <h3>Pregunta ${index + 1}</h3>
                    <p>${q.question_text}</p>
                    <div class="options" data-question-id="${questionId}">
            `;
            if (q.question_type === 'multiple_choice') {
                examHtml += `
                    <label class="option"><input type="radio" name="q${questionId}" value="a"> A) ${q.option_a}</label>
                    <label class="option"><input type="radio" name="q${questionId}" value="b"> B) ${q.option_b}</label>
                    <label class="option"><input type="radio" name="q${questionId}" value="c"> C) ${q.option_c}</label>
                `;
            } else if (q.question_type === 'true_false') {
                examHtml += `
                    <label class="option"><input type="radio" name="q${questionId}" value="true"> Verdadero</label>
                    <label class="option"><input type="radio" name="q${questionId}" value="false"> Falso</label>
                `;
            }
            examHtml += `</div></div>`;
        });
        ui.examContainer.innerHTML = examHtml;
        addOptionListeners();
    }

    /**
     * Adds event listeners to all answer options.
     */
    function addOptionListeners() {
        const options = document.querySelectorAll('.option input');
        options.forEach(option => {
            option.addEventListener('change', (e) => {
                const questionId = e.target.name.substring(1); // Extracts index from "q[index]"
                userAnswers[questionId] = e.target.value;

                // Visual feedback for selected option
                document.querySelectorAll(`input[name="q${questionId}"]`).forEach(opt => {
                    opt.parentElement.classList.remove('selected');
                });
                e.target.parentElement.classList.add('selected');
            });
        });
    }

    /**
     * Handles the exam submission button click.
     */
    ui.submitExamBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres finalizar y corregir el examen?')) {
            clearInterval(timerInterval); // Stop the timer
            finishExam();
        }
    });

    /**
     * Calculates the score, saves results to sessionStorage, and redirects to the results page.
     */
    function finishExam() {
        // Save the full questions and user answers to sessionStorage
        sessionStorage.setItem('examResults', JSON.stringify({
            questions: examQuestions,
            userAnswers: userAnswers
        }));

        // Redirect to the new results page
        window.location.href = 'results.html';
    }
    
    /**
     * Starts the exam timer.
     */
    function startTimer(duration) {
        let timer = duration, minutes, seconds;
        clearInterval(timerInterval); // Clear any existing timer
        timerInterval = setInterval(function () {
            minutes = parseInt(timer / 60, 10);
            seconds = parseInt(timer % 60, 10);

            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;

            ui.timer.textContent = minutes + ":" + seconds;

            if (--timer < 0) {
                clearInterval(timerInterval);
                alert('¡Tiempo agotado! El examen se corregirá automáticamente.');
                finishExam();
            }
        }, 1000);
    }

    /**
     * Shuffles an array randomly.
     */
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
});