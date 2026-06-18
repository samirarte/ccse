document.addEventListener('DOMContentLoaded', function() {
    const auth = firebase.auth();
    const db = firebase.firestore();

    const ui = {
        startExamBtn: document.getElementById('start-exam-btn'),
        examList: document.getElementById('exam-list'),
        dbStatus: document.getElementById('db-status') // Elemento para el estado de la BD
    };

    // 1. Comprobar la conectividad con Firestore
    db.collection('_ping').get().then(() => {
        console.log("Firestore connection is OK.");
        if (ui.dbStatus) {
            ui.dbStatus.textContent = '(en línea)';
            ui.dbStatus.style.color = 'green';
        }
    }).catch(error => {
        console.error("Firestore connection failed:", error.message);
        if (ui.dbStatus) {
            ui.dbStatus.textContent = '_sin conexión_';
            ui.dbStatus.style.color = 'red';
        }
    });

    auth.onAuthStateChanged(user => {
        if (user) {
            // 2. Cargar el historial con manejo de errores
            loadExamHistory(user.uid);

            if (ui.startExamBtn) {
                ui.startExamBtn.addEventListener('click', () => {
                    window.location.href = 'examen.html';
                });
            }
        } else {
            // Si no hay usuario, no se necesita hacer nada aquí
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
                const date = exam.finished_at ? exam.finished_at.toDate().toLocaleString('es-ES') : 'Fecha no disponible';
                const resultClass = exam.passed ? 'passed' : 'failed';
                historyHtml += `
                    <li class="${resultClass}">
                        <strong>Examen del ${date}</strong> - 
                        Resultado: ${exam.score_correct} de ${exam.total_questions}. 
                        <strong>${exam.passed ? 'APROBADO' : 'NO APROBado'}</strong>
                    </li>
                `;
            });
            ui.examList.innerHTML = historyHtml;

        }).catch(error => {
            console.error("Error loading exam history:", error);
            ui.examList.innerHTML = '<li class="error-message">No se pudo cargar el historial. Parece que hay un problema de conexión.</li>';
        });
    }
});
