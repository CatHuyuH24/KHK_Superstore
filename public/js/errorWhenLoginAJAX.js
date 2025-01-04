document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();
        document.getElementById('message').innerText = result.message || 'Login Successfull';
        if (response.status === 200) {
            window.location.href = result.redirectTo || '/';  1
        }
    } catch (error) {
        console.error('Error:', error);
    }
});
