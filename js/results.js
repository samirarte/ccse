document.addEventListener('DOMContentLoaded', () => {
    const examResults = JSON.parse(sessionStorage.getItem('examResults'));

    const scoreEl = document.getElementById('score');
    const correctCountEl = document.getElementById('correct-count');
    const incorrectCountEl = document.getElementById('incorrect-count');
    const unansweredCountEl = document.getElementById('unanswered-count');
    const questionsListEl = document.getElementById('questions-list');

    if (!examResults) {
        questionsListEl.innerHTML = '<p>No se han encontrado resultados. Por favor, completa un examen primero.</p>';
        return;
    }

    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    examResults.questions.forEach((question, index) => {
        const userAnswer = examResults.userAnswers[index];
        const isCorrect = userAnswer === question.correct_answer;
        let status = '';

        if (userAnswer === null || userAnswer === undefined) {
            unansweredCount++;
            status = 'unanswered';
        } else if (isCorrect) {
            correctCount++;
            status = 'correct';
        } else {
            incorrectCount++;
            status = 'incorrect';
        }

        const questionEl = document.createElement('div');
        questionEl.classList.add('question-result', status);

        let userAnswerText = 'No respondida';
        if (userAnswer) {
            const optionKey = 'option_' + userAnswer;
            userAnswerText = question[optionKey] || (userAnswer.toString() === 'true' ? 'Verdadero' : 'Falso');
        }

        const correctAnswerKey = 'option_' + question.correct_answer;
        const correctAnswerText = question[correctAnswerKey] || (question.correct_answer.toString() === 'true' ? 'Verdadero' : 'Falso');

        questionEl.innerHTML = `
            <h4>${index + 1}. ${question.question_text}</h4>
            <p><strong>Tu respuesta:</strong> ${userAnswerText}</p>
            <p><strong>Respuesta correcta:</strong> ${correctAnswerText}</p>
            <p class="explanation"><strong>Explicación:</strong> ${question.explanation_simple}</p>
        `;

        questionsListEl.appendChild(questionEl);
    });

    scoreEl.textContent = correctCount;
    correctCountEl.textContent = correctCount;
    incorrectCountEl.textContent = incorrectCount;
    unansweredCountEl.textContent = unansweredCount;
});
