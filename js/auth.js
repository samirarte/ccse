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
                    // La redirección se gestionará con el observador
                })
                .catch(error => {
                    console.error('Error durante el inicio de sesión con Google:', error);
                    alert('No se pudo iniciar sesión. Revisa tu conexión o inténtalo más tarde.');
                });
        });
    }

    if (ui.logoutBtn) {
        ui.logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                console.log('Usuario ha cerrado sesión.');
                window.location.href = 'index.html';
            }).catch(error => {
                console.error('Error durante el cierre de sesión:', error);
            });
        });
    }

    // --- OBSERVADOR DE ESTADO DE AUTENTICACIÓN ---
    auth.onAuthStateChanged(user => {
        if (user) {
            saveUserToFirestore(user);
            if (ui.userInfo) {
                ui.userInfo.textContent = `Hola, ${user.displayName}`;
            }
            // Si el usuario ya está logueado, y está en login/index, redirigir a dashboard
            if (window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('index.html')) {
                window.location.href = 'dashboard.html';
            }
        } else {
            // Si no hay usuario, y no estamos en una página pública, redirigir a login
            if (!window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('index.html')) {
                window.location.href = 'login.html';
            }
        }
    });

    // --- GUARDAR USUARIO EN FIRESTORE (CON MANEJO DE ERRORES) ---
    function saveUserToFirestore(user) {
        const usersRef = db.collection('users').doc(user.uid);

        usersRef.get().then(doc => {
            if (!doc.exists) {
                // Crear nuevo registro de usuario
                usersRef.set({
                    id: user.uid,
                    name: user.displayName,
                    email: user.email,
                    created_at: firebase.firestore.FieldValue.serverTimestamp(),
                    last_login: firebase.firestore.FieldValue.serverTimestamp()
                }).catch(error => {
                    console.error("Error al crear el registro de usuario en Firestore:", error);
                });
            } else {
                // Actualizar la fecha del último login
                usersRef.update({
                    last_login: firebase.firestore.FieldValue.serverTimestamp()
                }).catch(error => {
                    console.error("Error al actualizar la fecha de último login:", error);
                });
            }
        }).catch(error => {
            // Este error saltará si no hay conexión para hacer el get()
            console.error("Error al obtener el documento del usuario desde Firestore:", error);
        });
    }
});
