document.addEventListener('DOMContentLoaded', function() {
    const auth = firebase.auth();
    const db = firebase.firestore();

    const ui = {
        startExamBtn: document.getElementById('start-exam-btn'),
        examList: document.getElementById('exam-list')
    };

    auth.onAuthStateChanged(user => {
        if (user) {
            loadExamHistory(user.uid);

            if (ui.startExamBtn) {
                ui.startExamBtn.addEventListener('click', () => {
                    // Redirigir a la página de examen
                    window.location.href = 'examen.html';
                });
            }
        } else {
            // El usuario no está logueado
        }
    });

    function loadExamHistory(userId) {
        const examsRef = db.collection('exams').where('user_id', '==', userId).orderBy('finished_at', 'desc');

        examsRef.get().then(snapshot => {
            if (snapshot.empty) {
                ui.examList.innerHTML = '<li>Aún no has completado ningún examen.</li>';
                return;
            }

            let historyHtml = '';
            snapshot.forEach(doc => {
                const exam = doc.data();
                const date = exam.finished_at.toDate().toLocaleString('es-ES');
                const resultClass = exam.passed ? 'passed' : 'failed';
                historyHtml += `
                    <li class="${resultClass}">
                        <strong>Examen del ${date}</strong> - 
                        Resultado: ${exam.score_correct} de ${exam.total_questions}. 
                        <strong>${exam.passed ? 'APROBADO' : 'NO APROBADO'}</strong>
                    </li>
                `;
            });
            ui.examList.innerHTML = historyHtml;
        });
    }
});
