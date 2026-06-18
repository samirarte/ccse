document.addEventListener('DOMContentLoaded', function() {
    const auth = firebase.auth();
    const db = firebase.firestore();
    let currentUser = null;
    let currentExamId = null;
    let examQuestions = [];
    let userAnswers = {};
    let timerInterval = null;

    const ui = {
        examContainer: document.getElementById('exam-container'),
        submitExamBtn: document.getElementById('submit-exam-btn'),
        timer: document.getElementById('timer')
    };

    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            startNewExam();
        } else {
            window.location.href = 'login.html';
        }
    });

    async function startNewExam() {
        examQuestions = await generateExamQuestions();
        renderExam(examQuestions);
        startTimer(45 * 60);

        const examRef = db.collection('exams').doc();
        currentExamId = examRef.id;
        await examRef.set({
            id: currentExamId,
            user_id: currentUser.uid,
            started_at: firebase.firestore.FieldValue.serverTimestamp(),
            total_questions: examQuestions.length,
            exam_mode: 'simulacro_oficial'
        });
    }

    async function generateExamQuestions() {
        const questionsRef = db.collection('questions').where('active', '==', true);
        const snapshot = await questionsRef.get();
        const allQuestions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Lógica de selección de 25 preguntas (simplificada por ahora, se puede mejorar)
        // Idealmente, aquí se implementaría la lógica de tareas del CCSE.
        return shuffleArray(allQuestions).slice(0, 25);
    }

    function renderExam(questions) {
        let examHtml = '';
        questions.forEach((q, index) => {
            examHtml += `
                <div class="question-block" id="question-${q.id}">
                    <h3>Pregunta ${index + 1}</h3>
                    <p>${q.question_text}</p>
                    <div class="options" data-question-id="${q.id}">
            `;
            if (q.question_type === 'multiple_choice') {
                examHtml += `
                    <label class="option"><input type="radio" name="q${q.id}" value="a"> A) ${q.option_a}</label>
                    <label class="option"><input type="radio" name="q${q.id}" value="b"> B) ${q.option_b}</label>
                    <label class="option"><input type="radio" name="q${q.id}" value="c"> C) ${q.option_c}</label>
                `;
            } else if (q.question_type === 'true_false') {
                examHtml += `
                    <label class="option"><input type="radio" name="q${q.id}" value="true"> Verdadero</label>
                    <label class="option"><input type="radio" name="q${q.id}" value="false"> Falso</label>
                `;
            }
            examHtml += `</div></div>`;
        });
        ui.examContainer.innerHTML = examHtml;
        addOptionListeners();
    }

    function addOptionListeners() {
        const options = document.querySelectorAll('.option input');
        options.forEach(option => {
            option.addEventListener('change', (e) => {
                const questionId = e.target.name.substring(1);
                userAnswers[questionId] = e.target.value;

                // Visual feedback
                document.querySelectorAll(`input[name="q${questionId}"]`).forEach(opt => {
                    opt.parentElement.classList.remove('selected');
                });
                e.target.parentElement.classList.add('selected');
            });
        });
    }

    ui.submitExamBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres finalizar el examen?')) {
            clearInterval(timerInterval);
            correctExam();
        }
    });

    async function correctExam() {
        let scoreCorrect = 0;
        let scoreIncorrect = 0;
        const batch = db.batch();

        for (const question of examQuestions) {
            const userAnswer = userAnswers[question.id];
            const isCorrect = userAnswer === question.correct_answer;

            if (isCorrect) {
                scoreCorrect++;
            } else {
                scoreIncorrect++;
            }

            // Guardar respuesta del examen
            const answerRef = db.collection('exam_answers').doc();
            batch.set(answerRef, {
                exam_id: currentExamId,
                user_id: currentUser.uid,
                question_id: question.id,
                selected_answer: userAnswer || null,
                correct_answer: question.correct_answer,
                is_correct: isCorrect,
                answered_at: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Actualizar estadísticas de la pregunta
            const questionStatsRef = db.collection('questions').doc(question.id);
            batch.update(questionStatsRef, {
                times_answered: firebase.firestore.FieldValue.increment(1),
                times_correct: firebase.firestore.FieldValue.increment(isCorrect ? 1 : 0),
                times_incorrect: firebase.firestore.FieldValue.increment(isCorrect ? 0 : 1)
            });
        }

        // Actualizar el examen
        const passed = scoreCorrect >= 15;
        const examRef = db.collection('exams').doc(currentExamId);
        batch.update(examRef, {
            finished_at: firebase.firestore.FieldValue.serverTimestamp(),
            score_correct: scoreCorrect,
            score_incorrect: scoreIncorrect,
            passed: passed
        });

        await batch.commit();

        // Guardar resultados en localStorage para mostrarlos en la página de resultados
        localStorage.setItem('lastExamResults', JSON.stringify({ 
            examId: currentExamId,
            questions: examQuestions,
            answers: userAnswers
        }));

        window.location.href = 'resultados.html';
    }
    
    function startTimer(duration) {
        let timer = duration, minutes, seconds;
        timerInterval = setInterval(function () {
            minutes = parseInt(timer / 60, 10);
            seconds = parseInt(timer % 60, 10);

            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;

            ui.timer.textContent = minutes + ":" + seconds;

            if (--timer < 0) {
                clearInterval(timerInterval);
                alert('¡Tiempo agotado! El examen se corregirá automáticamente.');
                correctExam();
            }
        }, 1000);
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
});
