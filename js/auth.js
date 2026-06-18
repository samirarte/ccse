document.addEventListener('DOMContentLoaded', function() {
    const auth = firebase.auth();
    const db = firebase.firestore();

    const ui = {
        googleLoginBtn: document.getElementById('google-login-btn'),
        logoutBtn: document.getElementById('logout-btn'),
        userInfo: document.getElementById('user-info')
    };

    // --- MANEJO DE AUTENTICACIÓN ---
    const provider = new firebase.auth.GoogleAuthProvider();

    if (ui.googleLoginBtn) {
        ui.googleLoginBtn.addEventListener('click', () => {
            auth.signInWithPopup(provider)
                .then(result => {
                    const user = result.user;
                    console.log('Usuario ha iniciado sesión:', user.displayName);
                    window.location.href = 'dashboard.html';
                })
                .catch(error => {
                    console.error('Error durante el inicio de sesión con Google:', error);
                });
        });
    }

    if (ui.logoutBtn) {
        ui.logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                console.log('Usuario ha cerrado sesión.');
                window.location.href = 'index.html';
            });
        });
    }

    // --- OBSERVADOR DE ESTADO DE AUTENTICACIÓN ---
    auth.onAuthStateChanged(user => {
        if (user) {
            // Si el usuario está en una página que no requiere autenticación, redirigir al dashboard
            if (window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('index.html')) {
                window.location.href = 'dashboard.html';
            }
            if (ui.userInfo) {
                ui.userInfo.textContent = `Hola, ${user.displayName}`;
            }
            saveUserToFirestore(user);
        } else {
            // Si el usuario no está logueado y no está en la página de login o index, redirigirlo
            if (!window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('index.html')) {
                window.location.href = 'login.html';
            }
        }
    });

    // --- GUARDAR USUARIO EN FIRESTORE ---
    function saveUserToFirestore(user) {
        const usersRef = db.collection('users').doc(user.uid);

        usersRef.get().then(doc => {
            if (!doc.exists) {
                usersRef.set({
                    id: user.uid,
                    name: user.displayName,
                    email: user.email,
                    created_at: firebase.firestore.FieldValue.serverTimestamp(),
                    last_login: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else {
                usersRef.update({
                    last_login: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        });
    }
});
